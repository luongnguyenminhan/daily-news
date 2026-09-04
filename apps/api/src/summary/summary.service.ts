import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiSummaryClient } from './gemini-summary.client.js';
import { fetchSourceText } from './source-fetcher.js';

const SUMMARY_CONCURRENCY = 2;
const MAX_SUMMARY_ATTEMPTS = 3;

@Injectable()
export class SummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiSummaryClient,
  ) {}

  async summarizePending(articleIds?: string[]) {
    const articles = await this.prisma.article.findMany({
      where: {
        OR: [{ summary: null }, { summary: { status: 'FAILED' } }],
        ...(articleIds?.length ? { id: { in: articleIds } } : {}),
      },
    });

    if (articles.length === 0) {
      return { processed: 0, done: 0, failed: 0 };
    }

    let done = 0;
    let failed = 0;

    await mapWithConcurrency(articles, SUMMARY_CONCURRENCY, async (article) => {
      try {
        const sourceText = await fetchSourceText(article);
        const summary = await summarizeWithRetry(() =>
          this.gemini.summarize({
            articleTitle: article.title,
            articleSource: article.source,
            sourceText,
          }),
        );
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

async function summarizeWithRetry<T>(
  summarize: () => Promise<T>,
  attempt = 1,
): Promise<T> {
  try {
    return await summarize();
  } catch (error) {
    if (attempt >= MAX_SUMMARY_ATTEMPTS || !isTemporaryGeminiError(error)) {
      throw error;
    }

    await delay(1_000 * 2 ** (attempt - 1));
    return summarizeWithRetry(summarize, attempt + 1);
  }
}

function isTemporaryGeminiError(error: unknown): boolean {
  const message = errorMessage(error);

  return message.includes('503') || message.includes('UNAVAILABLE');
}

function delay(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
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
