import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildBatchRequestLine,
  parseBatchResultLine,
  type BatchSummaryResult,
} from './batch-format.js';

export type BatchState =
  'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

export interface BatchSummaryRequest {
  articleId: string;
  articleTitle: string;
  sourceText: string;
}

export interface GeminiClientLike {
  files: {
    upload(params: { file: Blob }): Promise<{ name?: string }>;
    download(params: {
      file: string;
      downloadPath: string;
    }): Promise<Blob | string | void>;
  };
  batches: {
    create(params: {
      model: string;
      src: string;
      config?: { displayName?: string };
    }): Promise<{ name?: string }>;
    get(params: { name: string }): Promise<{
      name?: string;
      state?: string;
      dest?: { fileName?: string };
    }>;
  };
}

export class GeminiBatchClient {
  constructor(
    private readonly client: GeminiClientLike,
    private readonly model: string,
  ) {}

  async createBatch(requests: BatchSummaryRequest[]): Promise<string> {
    const jsonl = requests
      .map((request) =>
        buildBatchRequestLine(
          request.articleId,
          request.articleTitle,
          request.sourceText,
        ),
      )
      .join('\n');

    const file = await this.client.files.upload({
      file: new Blob([jsonl], { type: 'application/jsonl' }),
    });
    if (!file.name) {
      throw new Error('Gemini upload did not return a file name');
    }

    const job = await this.client.batches.create({
      model: this.model,
      src: file.name,
      config: { displayName: `daily-news-summarize-${Date.now()}` },
    });
    if (!job.name) {
      throw new Error('Gemini batch creation did not return a batch name');
    }

    return job.name;
  }

  async getBatchState(
    batchName: string,
  ): Promise<{ state: BatchState; resultFileName?: string }> {
    const job = await this.client.batches.get({ name: batchName });
    return {
      state: normalizeBatchState(job.state),
      resultFileName: job.dest?.fileName,
    };
  }

  async downloadResults(resultFileName: string): Promise<BatchSummaryResult[]> {
    const directory = await mkdtemp(join(tmpdir(), 'daily-news-gemini-'));
    const downloadPath = join(directory, 'results.jsonl');

    try {
      const raw = await this.client.files.download({
        file: resultFileName,
        downloadPath,
      });
      const text =
        typeof raw === 'string'
          ? raw
          : raw instanceof Blob
            ? await raw.text()
            : await readFile(downloadPath, 'utf8');

      return text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map(parseBatchResultLine);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

function normalizeBatchState(state: string | undefined): BatchState {
  switch (state) {
    case 'PENDING':
    case 'JOB_STATE_PENDING':
    case 'JOB_STATE_QUEUED':
      return 'PENDING';
    case 'RUNNING':
    case 'JOB_STATE_RUNNING':
    case 'JOB_STATE_UPDATING':
      return 'RUNNING';
    case 'SUCCEEDED':
    case 'JOB_STATE_SUCCEEDED':
    case 'JOB_STATE_PARTIALLY_SUCCEEDED':
      return 'SUCCEEDED';
    case 'FAILED':
    case 'JOB_STATE_FAILED':
      return 'FAILED';
    case 'CANCELLED':
    case 'JOB_STATE_CANCELLED':
    case 'JOB_STATE_CANCELLING':
      return 'CANCELLED';
    case 'EXPIRED':
    case 'JOB_STATE_EXPIRED':
      return 'EXPIRED';
    default:
      throw new Error(`Unknown Gemini batch state: ${state ?? 'undefined'}`);
  }
}
