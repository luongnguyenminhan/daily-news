import { SummaryService } from './summary.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { GeminiBatchClient } from './gemini-batch.client.js';

vi.mock('./source-fetcher.js', () => ({
  fetchSourceText: vi.fn().mockResolvedValue('fetched source text'),
}));

function fakePrisma(overrides: Record<string, unknown> = {}): PrismaService {
  return {
    article: { findMany: vi.fn().mockResolvedValue([]) },
    summary: {
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    ...overrides,
  } as unknown as PrismaService;
}

function fakeGemini(
  overrides: Partial<GeminiBatchClient> = {},
): GeminiBatchClient {
  return {
    createBatch: vi.fn().mockResolvedValue('batches/123'),
    getBatchState: vi.fn(),
    downloadResults: vi.fn(),
    ...overrides,
  } as unknown as GeminiBatchClient;
}

describe('SummaryService.enqueuePending', () => {
  it('returns queued: 0 and does not create or persist a batch when nothing is pending', async () => {
    const upsert = vi.fn();
    const transaction = vi.fn((ops: Promise<unknown>[]) => Promise.all(ops));
    const prisma = fakePrisma({
      summary: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert,
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      $transaction: transaction,
    });
    const createBatch = vi.fn().mockResolvedValue('batches/123');
    const service = new SummaryService(prisma, fakeGemini({ createBatch }));

    const result = await service.enqueuePending();

    expect(result).toEqual({ batchName: null, queued: 0 });
    expect(createBatch).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('selects articles with no summary or a failed summary', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = fakePrisma({ article: { findMany } });
    const service = new SummaryService(prisma, fakeGemini());

    await service.enqueuePending();

    expect(findMany).toHaveBeenCalledWith({
      where: { OR: [{ summary: null }, { summary: { status: 'FAILED' } }] },
    });
  });

  it('submits a batch and upserts each pending summary with the exact retry payload', async () => {
    const articles = [
      {
        id: 'a1',
        title: 'Title 1',
        url: 'https://one.example',
        source: 'Example',
      },
      {
        id: 'a2',
        title: 'Title 2',
        url: 'https://two.example',
        source: 'Example',
      },
    ];
    const findMany = vi.fn().mockResolvedValue(articles);
    const upsert = vi.fn();
    const transaction = vi.fn((ops: Promise<unknown>[]) => Promise.all(ops));
    const prisma = fakePrisma({
      article: { findMany },
      summary: {
        upsert,
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn(),
      },
      $transaction: transaction,
    });
    const createBatch = vi.fn().mockResolvedValue('batches/123');
    const service = new SummaryService(prisma, fakeGemini({ createBatch }));

    const result = await service.enqueuePending();

    expect(result).toEqual({ batchName: 'batches/123', queued: 2 });
    expect(createBatch).toHaveBeenCalledWith([
      {
        articleId: 'a1',
        articleTitle: 'Title 1',
        sourceText: 'fetched source text',
      },
      {
        articleId: 'a2',
        articleTitle: 'Title 2',
        sourceText: 'fetched source text',
      },
    ]);
    expect(transaction).toHaveBeenCalled();
    expect(upsert).toHaveBeenNthCalledWith(1, {
      where: { articleId: 'a1' },
      create: {
        articleId: 'a1',
        status: 'PROCESSING',
        batchName: 'batches/123',
      },
      update: {
        status: 'PROCESSING',
        batchName: 'batches/123',
        error: null,
      },
    });
    expect(upsert).toHaveBeenNthCalledWith(2, {
      where: { articleId: 'a2' },
      create: {
        articleId: 'a2',
        status: 'PROCESSING',
        batchName: 'batches/123',
      },
      update: {
        status: 'PROCESSING',
        batchName: 'batches/123',
        error: null,
      },
    });
  });
});

describe('SummaryService.ingestBatches', () => {
  it('reports nothing to do when there are no in-flight batches', async () => {
    const service = new SummaryService(fakePrisma(), fakeGemini());

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 0, stillProcessing: 0 });
  });

  it('counts still-processing summaries for a batch that has not finished', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a1' }, { articleId: 'a2' }]);
    const count = vi.fn().mockResolvedValue(2);
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count,
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({ state: 'RUNNING' });
    const service = new SummaryService(prisma, fakeGemini({ getBatchState }));

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 0, stillProcessing: 2 });
    expect(count).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
    });
  });

  it('marks every summary in a batch FAILED when the batch itself failed', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a1' }, { articleId: 'a2' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany,
        count: vi.fn(),
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({ state: 'FAILED' });
    const service = new SummaryService(prisma, fakeGemini({ getBatchState }));

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 2, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
      data: { status: 'FAILED', error: 'Batch ended with state FAILED' },
    });
  });

  it('writes each result only to its active batch row and counts affected rows', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a1' }, { articleId: 'a2' }]);
    const activeArticleIds = new Set(['a1', 'a2']);
    const updateMany = vi.fn(
      async ({
        where,
      }: {
        where: {
          articleId: string;
          batchName: string;
          status: string;
        };
      }) => {
        if (where.articleId && activeArticleIds.has(where.articleId)) {
          activeArticleIds.delete(where.articleId);
          return { count: 1 };
        }

        return { count: 0 };
      },
    );
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany,
        count: vi.fn(),
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({
      state: 'SUCCEEDED',
      resultFileName: 'files/results',
    });
    const downloadResults = vi.fn().mockResolvedValue([
      { key: 'a1', title: 'T', content: 'C' },
      { key: 'a1', error: 'duplicate response' },
      { key: 'foreign', title: 'Foreign', content: 'Must be ignored' },
    ]);
    const service = new SummaryService(
      prisma,
      fakeGemini({ getBatchState, downloadResults }),
    );

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 1, failed: 1, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        articleId: 'a1',
        batchName: 'batches/123',
        status: 'PROCESSING',
      },
      data: { status: 'DONE', title: 'T', content: 'C', error: null },
    });
    expect(updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        articleId: 'a2',
        batchName: 'batches/123',
        status: 'PROCESSING',
      },
      data: {
        status: 'FAILED',
        error: 'Batch succeeded without a result for this article',
      },
    });
  });

  it('writes a per-item error only to its active batch row', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a2' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany,
        count: vi.fn(),
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({
      state: 'SUCCEEDED',
      resultFileName: 'files/results',
    });
    const downloadResults = vi
      .fn()
      .mockResolvedValue([{ key: 'a2', error: 'bad response' }]);
    const service = new SummaryService(
      prisma,
      fakeGemini({ getBatchState, downloadResults }),
    );

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 1, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        articleId: 'a2',
        batchName: 'batches/123',
        status: 'PROCESSING',
      },
      data: { status: 'FAILED', error: 'bad response' },
    });
  });

  it('marks the active batch FAILED when reading its provider state throws', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a1' }, { articleId: 'a2' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany,
        count: vi.fn(),
      },
    });
    const getBatchState = vi
      .fn()
      .mockRejectedValue(new Error('provider unavailable'));
    const service = new SummaryService(prisma, fakeGemini({ getBatchState }));

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 2, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        error: 'Failed to get batch state: provider unavailable',
      },
    });
  });

  it('marks the active batch FAILED when downloading its results throws', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValueOnce([{ batchName: 'batches/123' }])
      .mockResolvedValueOnce([{ articleId: 'a1' }, { articleId: 'a2' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update: vi.fn(),
        updateMany,
        count: vi.fn(),
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({
      state: 'SUCCEEDED',
      resultFileName: 'files/results',
    });
    const downloadResults = vi
      .fn()
      .mockRejectedValue(new Error('result file unavailable'));
    const service = new SummaryService(
      prisma,
      fakeGemini({ getBatchState, downloadResults }),
    );

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 0, failed: 2, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        error: 'Failed to download batch results: result file unavailable',
      },
    });
  });
});
