import { Controller, Post } from '@nestjs/common';
import { SummaryService } from './summary.service.js';

@Controller('summarize')
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Post()
  enqueue() {
    return this.summary.enqueuePending();
  }

  @Post('ingest')
  ingest() {
    return this.summary.ingestBatches();
  }
}
