import type { Article, ArticleListOptions } from "@/domain/article";

export const ARTICLE_PAGE_SIZE = 10;
export const ARTICLE_SOURCES = ["All", "GitHub", "arXiv"] as const;

export function filterAndSortArticles<T extends Article>(
  articles: T[],
  { query, source, sort, getSearchText }: ArticleListOptions<T>,
): T[] {
  const term = query.trim().toLowerCase();
  const sourceTerm = source.toLowerCase();
  const searchText = getSearchText ?? defaultSearchText;

  const filtered = articles.filter((article) => {
    const matchesSource =
      source === "All" || article.source.toLowerCase().includes(sourceTerm);

    return (
      matchesSource &&
      (!term || searchText(article).toLowerCase().includes(term))
    );
  });

  if (sort === "newest") {
    return [...filtered].sort(compareNewest);
  }

  if (sort === "oldest") {
    return [...filtered].sort(compareOldest);
  }

  return filtered;
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page <= 0 || pageSize <= 0) return [];

  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getTotalPages(itemCount: number, pageSize: number): number {
  if (itemCount <= 0 || pageSize <= 0) return 0;

  return Math.ceil(itemCount / pageSize);
}

function defaultSearchText(article: Article): string {
  return `${article.title} ${article.topic} ${article.source}`;
}

function compareNewest(first: Article, second: Article): number {
  return getPublishedTime(second) - getPublishedTime(first);
}

function compareOldest(first: Article, second: Article): number {
  return getPublishedTime(first) - getPublishedTime(second);
}

function getPublishedTime(article: Article): number {
  return new Date(article.publishedAt).getTime();
}
