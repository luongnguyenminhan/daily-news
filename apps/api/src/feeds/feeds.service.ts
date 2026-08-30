import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface FeedInput {
  url: string;
  name: string;
  topic: string;
}

@Injectable()
export class FeedsService {
  constructor(private readonly prisma: PrismaService) {}

  list(topic?: string) {
    return this.prisma.feed.findMany({
      where: topic ? { topic: { equals: topic, mode: 'insensitive' } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: FeedInput) {
    return this.prisma.feed.create({ data });
  }

  async update(id: string, data: Partial<FeedInput>) {
    await this.ensureExists(id);
    return this.prisma.feed.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.feed.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const feed = await this.prisma.feed.findUnique({ where: { id } });
    if (!feed) throw new NotFoundException(`Feed ${id} not found`);
  }
}
