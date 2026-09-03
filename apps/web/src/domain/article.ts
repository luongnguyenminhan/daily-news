export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: string;
  summary?: {
    title: string;
    content: string;
    status: "PROCESSING" | "DONE" | "FAILED";
  } | null;
}

export interface SavedLink extends Article {
  savedAt: string;
  label?: string;
}

export type SortOrder = "relevance" | "newest" | "oldest";

export interface ArticleListOptions<T extends Article = Article> {
  query: string;
  source: string;
  sort: SortOrder;
  getSearchText?: (article: T) => string;
}
