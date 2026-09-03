import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { FeedsService } from './feeds.service.js';

interface FeedBody {
  url?: string;
  name?: string;
  topic?: string;
}

@Controller('feeds')
export class FeedsController {
  constructor(private readonly feeds: FeedsService) {}

  @Get()
  list(@Query('topic') topic?: string) {
    return this.feeds.list(topic);
  }

  @Post()
  create(@Body() body: FeedBody) {
    return this.feeds.create(requireFeedFields(body));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: FeedBody) {
    return this.feeds.update(id, cleanFields(body));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feeds.remove(id);
  }
}

function requireFeedFields(body: FeedBody) {
  const { url, name, topic } = cleanFields(body);
  if (!url || !name || !topic) {
    throw new BadRequestException('url, name, and topic are required');
  }
  return { url, name, topic };
}

function cleanFields(body: FeedBody) {
  return {
    url: body.url?.trim() || undefined,
    name: body.name?.trim() || undefined,
    topic: body.topic?.trim() || undefined,
  };
}
