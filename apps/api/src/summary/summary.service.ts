import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiSummaryClient } from './gemini-summary.client.js';
import { fetchSourceText } from './source-fetcher.js';

const FETCH_CONCURRENCY = 5;

@Injectable()
export class SummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiSummaryClient,
  ) {}

  async summarizePending() {
    const articles = await this.prisma.article.findMany({
      where: { OR: [{ summary: null }, { summary: { status: 'FAILED' } }] },
    });

    if (articles.length === 0) {
      return { processed: 0, done: 0, failed: 0 };
    }

    let done = 0;
    let failed = 0;

    await mapWithConcurrency(articles, FETCH_CONCURRENCY, async (article) => {
      try {
        const sourceText = await fetchSourceText(article);
        const summary = await this.gemini.summarize({
          articleTitle: article.title,
          sourceText,
        });
        await this.prisma.summary.upsert({
          where: { articleId: article.id },
          create: {
            articleId: article.id,
            status: 'DONE',
            title: summary.title,
            content: summary.content,
          },
          update: {
            status: 'DONE',
            title: summary.title,
            content: summary.content,
            error: null,
          },
        });
        done += 1;
      } catch (error) {
        await this.prisma.summary.upsert({
          where: { articleId: article.id },
          create: {
            articleId: article.id,
            status: 'FAILED',
            error: errorMessage(error),
          },
          update: { status: 'FAILED', error: errorMessage(error) },
        });
        failed += 1;
      }
    });

    return { processed: articles.length, done, failed };
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
  const results: R[] = Array.from({ length: items.length });
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
