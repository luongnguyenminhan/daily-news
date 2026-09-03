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
  it('returns queued: 0 and does not create a batch when nothing is pending', async () => {
    const service = new SummaryService(fakePrisma(), fakeGemini());

    const result = await service.enqueuePending();

    expect(result).toEqual({ batchName: null, queued: 0 });
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

  it('submits a batch for pending articles and records them as PROCESSING', async () => {
    const article = {
      id: 'a1',
      title: 'Title',
      url: 'https://x',
      source: 'Example',
    };
    const findMany = vi.fn().mockResolvedValue([article]);
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

    expect(result).toEqual({ batchName: 'batches/123', queued: 1 });
    expect(createBatch).toHaveBeenCalledWith([
      {
        articleId: 'a1',
        articleTitle: 'Title',
        sourceText: 'fetched source text',
      },
    ]);
    expect(transaction).toHaveBeenCalled();
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
      .mockResolvedValue([{ batchName: 'batches/123' }]);
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
  });

  it('marks every summary in a batch FAILED when the batch itself failed', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValue([{ batchName: 'batches/123' }]);
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
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

    expect(result).toEqual({ done: 0, failed: 3, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
      data: { status: 'FAILED', error: 'Batch ended with state FAILED' },
    });
  });

  it('writes each successful result onto its article and counts done/failed', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValue([{ batchName: 'batches/123' }]);
    const update = vi.fn();
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update,
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn(),
      },
    });
    const getBatchState = vi.fn().mockResolvedValue({
      state: 'SUCCEEDED',
      resultFileName: 'files/results',
    });
    const downloadResults = vi.fn().mockResolvedValue([
      { key: 'a1', title: 'T', content: 'C' },
      { key: 'a2', error: 'bad response' },
    ]);
    const service = new SummaryService(
      prisma,
      fakeGemini({ getBatchState, downloadResults }),
    );

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 1, failed: 1, stillProcessing: 0 });
    expect(update).toHaveBeenCalledWith({
      where: { articleId: 'a1' },
      data: { status: 'DONE', title: 'T', content: 'C', error: null },
    });
    expect(update).toHaveBeenCalledWith({
      where: { articleId: 'a2' },
      data: { status: 'FAILED', error: 'bad response' },
    });
  });

  it('fails processing summaries omitted from a succeeded batch result', async () => {
    const summaryFindMany = vi
      .fn()
      .mockResolvedValue([{ batchName: 'batches/123' }]);
    const update = vi.fn();
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = fakePrisma({
      summary: {
        findMany: summaryFindMany,
        upsert: vi.fn(),
        update,
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
      .mockResolvedValue([{ key: 'a1', title: 'T', content: 'C' }]);
    const service = new SummaryService(
      prisma,
      fakeGemini({ getBatchState, downloadResults }),
    );

    const result = await service.ingestBatches();

    expect(result).toEqual({ done: 1, failed: 1, stillProcessing: 0 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { batchName: 'batches/123', status: 'PROCESSING' },
      data: {
        status: 'FAILED',
        error: 'Batch succeeded without a result for this article',
      },
    });
  });
});
