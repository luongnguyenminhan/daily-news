import { access, writeFile } from 'node:fs/promises';

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

describe('GeminiBatchClient.getBatchState normalization', () => {
  it.each([
    ['JOB_STATE_CANCELLING', 'RUNNING'],
    ['JOB_STATE_PAUSED', 'RUNNING'],
    ['JOB_STATE_PARTIALLY_SUCCEEDED', 'SUCCEEDED'],
  ] as const)('normalizes %s to %s', async (sdkState, expectedState) => {
    const client = fakeClient({
      batches: {
        create: vi.fn(),
        get: vi.fn().mockResolvedValue({ state: sdkState }),
      },
    });
    const batch = new GeminiBatchClient(client, 'gemini-3.8-flash');

    const state = await batch.getBatchState('batches/123');

    expect(state.state).toBe(expectedState);
  });
});

describe('GeminiBatchClient.downloadResults', () => {
  it('reads JSONL written by the SDK download call and cleans up the temporary file', async () => {
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
        download: vi.fn(async ({ file, downloadPath }) => {
          expect(file).toBe('files/results');
          await writeFile(downloadPath, `${line}\n`, 'utf8');
          return undefined;
        }),
      },
    });
    const batch = new GeminiBatchClient(client, 'gemini-3.8-flash');

    const results = await batch.downloadResults('files/results');
    const downloadCall = vi.mocked(client.files.download).mock.calls[0];
    const downloadPath = downloadCall[0].downloadPath;

    expect(results).toEqual([{ key: 'a1', title: 'T', content: 'C' }]);
    expect(client.files.download).toHaveBeenCalledWith({
      file: 'files/results',
      downloadPath: expect.any(String),
    });
    await expect(access(downloadPath)).rejects.toThrow();
  });

  it('parses a string response for compatibility with alternate clients', async () => {
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
