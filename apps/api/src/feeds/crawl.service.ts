import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { PrismaService } from '../prisma/prisma.service.js';

const parser = new Parser();

interface ArticleInput {
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: Date;
}

interface GithubRepo {
  full_name: string;
  description: string | null;
  html_url: string;
  pushed_at: string;
}

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);

  constructor(private readonly prisma: PrismaService) {}

  async crawl() {
    const feeds = await this.prisma.feed.findMany();

    // ponytail: sequential, not Promise.all — concurrent requests to the same
    // host (e.g. multiple hnrss.org feeds) trip that host's own rate limit.
    // Fine at this feed count; batch by host if the feed list grows large.
    const items: ArticleInput[] = [];
    for (const feed of feeds) {
      items.push(...(await this.fetchFeed(feed)));
    }

    if (items.length === 0) return [];

    await this.prisma.article.createMany({ data: items, skipDuplicates: true });

    return this.prisma.article.findMany({
      where: { url: { in: items.map((item) => item.url) } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async crawlGithub(topic: string) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`topic:${topic}`)}&sort=stars&order=desc&per_page=30`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'daily-news-crawler',
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new BadGatewayException(
        `GitHub search failed: ${res.status} ${await res.text()}`,
      );
    }

    const { items: repos } = (await res.json()) as { items: GithubRepo[] };
    const items: ArticleInput[] = repos.map((repo) => ({
      title: repo.description
        ? `${repo.full_name} — ${repo.description}`
        : repo.full_name,
      url: repo.html_url,
      source: 'GitHub',
      topic,
      publishedAt: new Date(repo.pushed_at),
    }));

    if (items.length === 0) return [];

    await this.prisma.article.createMany({ data: items, skipDuplicates: true });

    return this.prisma.article.findMany({
      where: { url: { in: items.map((item) => item.url) } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  articles(topic?: string) {
    return this.prisma.article.findMany({
      where: topic
        ? { topic: { equals: topic, mode: 'insensitive' } }
        : undefined,
      orderBy: { publishedAt: 'desc' },
    });
  }

  private async fetchFeed(feed: {
    url: string;
    name: string;
    topic: string;
  }): Promise<ArticleInput[]> {
    try {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? [])
        .filter((item) => item.link && item.title)
        .map((item) => ({
          title: item.title as string,
          url: item.link as string,
          source: feed.name,
          topic: feed.topic,
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        }));
    } catch (error) {
      this.logger.warn(
        `Failed to crawl feed ${feed.url}: ${(error as Error).message}`,
      );
      return [];
    }
  }
}
