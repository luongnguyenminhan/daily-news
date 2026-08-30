const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface Feed {
  id: string;
  url: string;
  name: string;
  topic: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: string;
  publishedAt: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listFeeds: (topic?: string) =>
    request<Feed[]>(`/feeds${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`),
  createFeed: (data: { url: string; name: string; topic: string }) =>
    request<Feed>("/feeds", { method: "POST", body: JSON.stringify(data) }),
  updateFeed: (id: string, data: Partial<{ url: string; name: string; topic: string }>) =>
    request<Feed>(`/feeds/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFeed: (id: string) => request<Feed>(`/feeds/${id}`, { method: "DELETE" }),
  crawl: () => request<Article[]>("/crawl", { method: "POST" }),
  crawlGithub: (topic: string) =>
    request<Article[]>(`/crawl/github?topic=${encodeURIComponent(topic)}`, { method: "POST" }),
  listArticles: (topic?: string) =>
    request<Article[]>(`/articles${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`),
};
