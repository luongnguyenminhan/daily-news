import { GeminiBatchClient } from './gemini-batch.client.js';
import type { GeminiClientLike } from './gemini-batch.client.js';

function fakeClient(
  overrides: Partial<GeminiClientLike> = {},
): GeminiClientLike {
  return {
    files: {
      upload: vi.fn().mockResolvedValue({ name: 'files/abc' }),
      download: vi.fn(),
    },
    batches: {
      create: vi.fn().mockResolvedValue({ name: 'batches/123' }),
      get: vi.fn(),
    },
    ...overrides,
  };
}

describe('GeminiBatchClient.createBatch', () => {
  it('uploads a JSONL file built from the requests and returns the batch name', async () => {
    const client = fakeClient();
    const batch = new GeminiBatchClient(client, 'gemini-3.8-flash');

    const batchName = await batch.createBatch([
      { articleId: 'a1', articleTitle: 'Title', sourceText: 'Body' },
    ]);

    expect(batchName).toBe('batches/123');
    expect(client.batches.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-3.8-flash', src: 'files/abc' }),
    );
  });
});

describe('GeminiBatchClient.getBatchState', () => {
  it('reports the batch state and result file name', async () => {
    const client = fakeClient({
      batches: {
        create: vi.fn(),
        get: vi.fn().mockResolvedValue({
          name: 'batches/123',
          state: 'SUCCEEDED',
          dest: { fileName: 'files/results' },
        }),
      },
    });
    const batch = new GeminiBatchClient(client, 'gemini-3.8-flash');

    const state = await batch.getBatchState('batches/123');

    expect(state).toEqual({
      state: 'SUCCEEDED',
      resultFileName: 'files/results',
    });
  });
});

describe('GeminiBatchClient.downloadResults', () => {
  it('parses each JSONL line into a summary result', async () => {
    const line = JSON.stringify({
      key: 'a1',
      response: {
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify({ title: 'T', content: 'C' }) }],
            },
          },
        ],
      },
    });
    const client = fakeClient({
      files: {
        upload: vi.fn(),
        download: vi.fn().mockResolvedValue(line),
      },
    });
    const batch = new GeminiBatchClient(client, 'gemini-3.8-flash');

    const results = await batch.downloadResults('files/results');

    expect(results).toEqual([{ key: 'a1', title: 'T', content: 'C' }]);
  });
});
