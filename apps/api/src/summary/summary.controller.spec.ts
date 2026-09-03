import { Test, TestingModule } from '@nestjs/testing';
import { SummaryController } from './summary.controller.js';
import { SummaryService } from './summary.service.js';

describe('SummaryController', () => {
  let controller: SummaryController;
  let service: { summarizePending: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      summarizePending: vi
        .fn()
        .mockResolvedValue({ processed: 1, done: 1, failed: 0 }),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SummaryController],
      providers: [{ provide: SummaryService, useValue: service }],
    }).compile();

    controller = module.get(SummaryController);
  });

  it('POST /summarize delegates to summarizePending', async () => {
    const result = await controller.summarize();

    expect(service.summarizePending).toHaveBeenCalled();
    expect(result).toEqual({ processed: 1, done: 1, failed: 0 });
  });
});
