import { Module } from '@nestjs/common';
import { FeedsController } from './feeds.controller.js';
import { FeedsService } from './feeds.service.js';
import { CrawlController } from './crawl.controller.js';
import { CrawlService } from './crawl.service.js';

@Module({
  controllers: [FeedsController, CrawlController],
  providers: [FeedsService, CrawlService],
})
export class FeedsModule {}
