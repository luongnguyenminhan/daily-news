import { Body, Controller, Post } from '@nestjs/common';
import { SummaryService } from './summary.service.js';

interface SummarizeRequest {
  articleIds?: unknown;
}

@Controller('summarize')
export class SummaryController {
  constructor(private readonly summary: SummaryService) {}

  @Post()
  summarize(@Body() body: SummarizeRequest = {}) {
    const articleIds = Array.isArray(body.articleIds)
      ? body.articleIds.filter(
          (articleId): articleId is string =>
            typeof articleId === 'string' && articleId.length > 0,
        )
      : undefined;

    return this.summary.summarizePending(articleIds);
  }
}
