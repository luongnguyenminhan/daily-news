import { BadRequestException, Controller, Get, Post, Query } from '@nestjs/common';
import { CrawlService } from './crawl.service.js';

@Controller()
export class CrawlController {
  constructor(private readonly crawl: CrawlService) {}

  @Post('crawl')
  trigger() {
    return this.crawl.crawl();
  }

  @Post('crawl/github')
  triggerGithub(@Query('topic') topic?: string) {
    const cleaned = topic?.trim();
    if (!cleaned) throw new BadRequestException('topic is required');
    return this.crawl.crawlGithub(cleaned);
  }

  @Get('articles')
  list(@Query('topic') topic?: string) {
    return this.crawl.articles(topic);
  }
}
