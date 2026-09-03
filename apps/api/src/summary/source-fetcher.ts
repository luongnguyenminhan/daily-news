import { Logger } from '@nestjs/common';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

const logger = new Logger('SourceFetcher');

export interface SourceArticle {
  title: string;
  url: string;
  source: string;
}

export async function fetchSourceText(
  article: SourceArticle,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  try {
    if (article.source === 'GitHub') {
      return await fetchGithubReadme(article.url, fetchImpl);
    }
    return await fetchWebpageText(article.url, fetchImpl);
  } catch (error) {
    logger.warn(
      `Failed to fetch source for ${article.url}: ${(error as Error).message}`,
    );
    return article.title;
  }
}

async function fetchGithubReadme(
  url: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const fullName = new URL(url).pathname.replace(/^\//, '');
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw',
    'User-Agent': 'daily-news-crawler',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetchImpl(
    `https://api.github.com/repos/${fullName}/readme`,
    { headers },
  );
  if (!res.ok) {
    throw new Error(`GitHub readme fetch failed: ${res.status}`);
  }
  return res.text();
}

async function fetchWebpageText(
  url: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'daily-news-crawler' },
  });
  if (!res.ok) {
    throw new Error(`Webpage fetch failed: ${res.status}`);
  }

  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const parsed = new Readability(dom.window.document).parse();

  if (!parsed?.textContent?.trim()) {
    throw new Error('Readability produced no content');
  }

  return parsed.textContent.trim();
}
