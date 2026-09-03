import { request } from "@/lib/api";
import type { Article } from "@/domain/article";
export const articlesApi = {
  list: () => request<Article[]>("/articles"),
  crawl: () => request<Article[]>("/crawl", { method: "POST" }),
  crawlGithub: (topic: string) =>
    request<Article[]>(`/crawl/github?topic=${encodeURIComponent(topic)}`, {
      method: "POST",
    }),
};
