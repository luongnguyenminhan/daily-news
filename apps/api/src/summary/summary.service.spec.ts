import { SummaryService } from './summary.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { GeminiSummaryClient } from './gemini-summary.client.js';

vi.mock('./source-fetcher.js', () => ({
  fetchSourceText: vi.fn().mockResolvedValue('fetched source text'),
}));

function fakePrisma(overrides: Record<string, unknown> = {}): PrismaService {
  return {
    article: { findMany: vi.fn().mockResolvedValue([]) },
    summary: {
      upsert: vi.fn(),
    },
    ...overrides,
  } as unknown as PrismaService;
}

function fakeGemini(
  overrides: Partial<GeminiSummaryClient> = {},
): GeminiSummaryClient {
  return {
    summarize: vi.fn().mockResolvedValue({ title: 'T', content: 'C' }),
    ...overrides,
  } as unknown as GeminiSummaryClient;
}

describe('SummaryService.summarizePending', () => {
  it('returns all zeros and does not call Gemini when nothing is pending', async () => {
    const gemini = fakeGemini();
    const service = new SummaryService(fakePrisma(), gemini);

    const result = await service.summarizePending();

    expect(result).toEqual({ processed: 0, done: 0, failed: 0 });
    expect(gemini.summarize).not.toHaveBeenCalled();
  });

  it('selects articles with no summary or a failed summary', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = fakePrisma({ article: { findMany } });
    const service = new SummaryService(prisma, fakeGemini());

    await service.summarizePending();

    expect(findMany).toHaveBeenCalledWith({
      where: { OR: [{ summary: null }, { summary: { status: 'FAILED' } }] },
    });
  });

  it('limits summaries to requested article IDs', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = fakePrisma({ article: { findMany } });
    const service = new SummaryService(prisma, fakeGemini());

    await service.summarizePending(['article-1', 'article-2']);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ summary: null }, { summary: { status: 'FAILED' } }],
        id: { in: ['article-1', 'article-2'] },
      },
    });
  });

  it('summarizes a pending article and writes it as DONE', async () => {
    const article = {
      id: 'a1',
      title: 'Title',
      url: 'https://x',
      source: 'Example',
    };
    const findMany = vi.fn().mockResolvedValue([article]);
    const upsert = vi.fn();
    const prisma = fakePrisma({
      article: { findMany },
      summary: { upsert },
    });
    const summarize = vi.fn().mockResolvedValue({ title: 'T', content: 'C' });
    const service = new SummaryService(prisma, fakeGemini({ summarize }));

    const result = await service.summarizePending();

    expect(result).toEqual({ processed: 1, done: 1, failed: 0 });
    expect(summarize).toHaveBeenCalledWith({
      articleTitle: 'Title',
      articleSource: 'Example',
      sourceText: 'fetched source text',
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { articleId: 'a1' },
      create: {
        articleId: 'a1',
        status: 'DONE',
        title: 'T',
        content: 'C',
      },
      update: {
        status: 'DONE',
        title: 'T',
        content: 'C',
        error: null,
      },
    });
  });

  it('marks an article FAILED when Gemini throws, without failing the whole run', async () => {
    const articles = [
      { id: 'a1', title: 'Title 1', url: 'https://x', source: 'Example' },
      { id: 'a2', title: 'Title 2', url: 'https://y', source: 'Example' },
    ];
    const findMany = vi.fn().mockResolvedValue(articles);
    const upsert = vi.fn();
    const prisma = fakePrisma({
      article: { findMany },
      summary: { upsert },
    });
    const summarize = vi
      .fn()
      .mockRejectedValueOnce(new Error('quota exceeded'))
      .mockResolvedValueOnce({ title: 'T', content: 'C' });
    const service = new SummaryService(prisma, fakeGemini({ summarize }));

    const result = await service.summarizePending();

    expect(result).toEqual({ processed: 2, done: 1, failed: 1 });
    expect(upsert).toHaveBeenCalledWith({
      where: { articleId: 'a1' },
      create: { articleId: 'a1', status: 'FAILED', error: 'quota exceeded' },
      update: { status: 'FAILED', error: 'quota exceeded' },
    });
  });
});
