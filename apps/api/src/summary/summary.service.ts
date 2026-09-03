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
      const { state, resultFileName } =
        await this.gemini.getBatchState(batchName);

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

      const results = await this.gemini.downloadResults(resultFileName);
      for (const result of results) {
        if (result.error) {
          await this.prisma.summary.update({
            where: { articleId: result.key },
            data: { status: 'FAILED', error: result.error },
          });
          failed += 1;
        } else {
          await this.prisma.summary.update({
            where: { articleId: result.key },
            data: {
              status: 'DONE',
              title: result.title,
              content: result.content,
              error: null,
            },
          });
          done += 1;
        }
      }

      const missingResults = await this.prisma.summary.updateMany({
        where: { batchName, status: 'PROCESSING' },
        data: {
          status: 'FAILED',
          error: 'Batch succeeded without a result for this article',
        },
      });
      failed += missingResults.count;
    }

    return { done, failed, stillProcessing };
  }
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
