import { Test, TestingModule } from '@nestjs/testing';
import { SummaryController } from './summary.controller.js';
import { SummaryService } from './summary.service.js';

describe('SummaryController', () => {
  let controller: SummaryController;
  let service: {
    enqueuePending: ReturnType<typeof vi.fn>;
    ingestBatches: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      enqueuePending: vi
        .fn()
        .mockResolvedValue({ batchName: 'batches/123', queued: 1 }),
      ingestBatches: vi
        .fn()
        .mockResolvedValue({ done: 1, failed: 0, stillProcessing: 0 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [{ provide: SummaryService, useValue: service }],
    }).compile();

    controller = module.get(SummaryController);
  });

  it('POST /summarize delegates to enqueuePending', async () => {
    const result = await controller.enqueue();

    expect(service.enqueuePending).toHaveBeenCalled();
    expect(result).toEqual({ batchName: 'batches/123', queued: 1 });
  });

  it('POST /summarize/ingest delegates to ingestBatches', async () => {
    const result = await controller.ingest();

    expect(service.ingestBatches).toHaveBeenCalled();
    expect(result).toEqual({ done: 1, failed: 0, stillProcessing: 0 });
  });
});
