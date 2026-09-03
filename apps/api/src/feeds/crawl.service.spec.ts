import { CrawlService } from './crawl.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('CrawlService.articles', () => {
  it('includes the summary relation and orders by publishedAt desc', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { article: { findMany } } as unknown as PrismaService;
    const service = new CrawlService(prisma);

    await service.articles();

    expect(findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { publishedAt: 'desc' },
      include: { summary: true },
    });
  });

  it('filters by topic case-insensitively when provided', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = { article: { findMany } } as unknown as PrismaService;
    const service = new CrawlService(prisma);

    await service.articles('ai');

    expect(findMany).toHaveBeenCalledWith({
      where: { topic: { equals: 'ai', mode: 'insensitive' } },
      orderBy: { publishedAt: 'desc' },
      include: { summary: true },
    });
  });
});
