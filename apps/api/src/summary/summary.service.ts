import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiBatchClient } from './gemini-batch.client.js';
import { fetchSourceText } from './source-fetcher.js';

const FETCH_CONCURRENCY = 5;

@Injectable()
export class SummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiBatchClient,
  ) {}

  async enqueuePending() {
    const articles = await this.prisma.article.findMany({
      where: { OR: [{ summary: null }, { summary: { status: 'FAILED' } }] },
    });

    if (articles.length === 0) {
      return { batchName: null, queued: 0 };
    }

    const requests = await mapWithConcurrency(
      articles,
      FETCH_CONCURRENCY,
      async (article) => ({
        articleId: article.id,
        articleTitle: article.title,
        sourceText: await fetchSourceText(article),
      }),
    );

    const batchName = await this.gemini.createBatch(requests);

    await this.prisma.$transaction(
      articles.map((article) =>
        this.prisma.summary.upsert({
          where: { articleId: article.id },
          create: { articleId: article.id, status: 'PROCESSING', batchName },
          update: { status: 'PROCESSING', batchName, error: null },
        }),
      ),
    );

    return { batchName, queued: articles.length };
  }

  async ingestBatches() {
    const inFlight = await this.prisma.summary.findMany({
      where: { status: 'PROCESSING' },
      distinct: ['batchName'],
      select: { batchName: true },
    });

    let done = 0;
    let failed = 0;
    let stillProcessing = 0;

    for (const { batchName } of inFlight) {
      const processingRows = await this.prisma.summary.findMany({
        where: { batchName, status: 'PROCESSING' },
        select: { articleId: true },
      });
      const expectedArticleIds = new Set(
        processingRows.map((row) => row.articleId),
      );

      let batchState: Awaited<ReturnType<GeminiBatchClient['getBatchState']>>;
      try {
        batchState = await this.gemini.getBatchState(batchName);
      } catch (error) {
        failed += await this.markBatchFailed(
          batchName,
          `Failed to get batch state: ${errorMessage(error)}`,
        );
        continue;
      }

      const { state, resultFileName } = batchState;

      if (state === 'PENDING' || state === 'RUNNING') {
        stillProcessing += await this.prisma.summary.count({
          where: { batchName, status: 'PROCESSING' },
        });
        continue;
      }

      if (state !== 'SUCCEEDED' || !resultFileName) {
        const result = await this.prisma.summary.updateMany({
          where: { batchName, status: 'PROCESSING' },
          data: { status: 'FAILED', error: `Batch ended with state ${state}` },
        });
        failed += result.count;
        continue;
      }

      let results: Awaited<ReturnType<GeminiBatchClient['downloadResults']>>;
      try {
        results = await this.gemini.downloadResults(resultFileName);
      } catch (error) {
        failed += await this.markBatchFailed(
          batchName,
          `Failed to download batch results: ${errorMessage(error)}`,
        );
        continue;
      }

      const acceptedArticleIds = new Set<string>();
      for (const result of results) {
        if (
          !expectedArticleIds.has(result.key) ||
          acceptedArticleIds.has(result.key)
        ) {
          continue;
        }
        acceptedArticleIds.add(result.key);

        const update = result.error
          ? {
              status: 'FAILED' as const,
              error: result.error,
            }
          : {
              status: 'DONE' as const,
              title: result.title,
              content: result.content,
              error: null,
            };
        const affected = await this.prisma.summary.updateMany({
          where: {
            articleId: result.key,
            batchName,
            status: 'PROCESSING',
          },
          data: update,
        });

        if (result.error) {
          failed += affected.count;
        } else {
          done += affected.count;
        }
      }

      for (const articleId of expectedArticleIds) {
        if (acceptedArticleIds.has(articleId)) {
          continue;
        }

        const missingResult = await this.prisma.summary.updateMany({
          where: {
            articleId,
            batchName,
            status: 'PROCESSING',
          },
          data: {
            status: 'FAILED',
            error: 'Batch succeeded without a result for this article',
          },
        });
        failed += missingResult.count;
      }
    }

    return { done, failed, stillProcessing };
  }

  private async markBatchFailed(
    batchName: string,
    error: string,
  ): Promise<number> {
    const result = await this.prisma.summary.updateMany({
      where: { batchName, status: 'PROCESSING' },
      data: { status: 'FAILED', error },
    });
    return result.count;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
