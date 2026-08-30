"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Nav } from "@/components/Nav";
import { api, type Article } from "@/lib/api";

export default function Home() {
  const [filter, setFilter] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [githubTopic, setGithubTopic] = useState("");
  const [githubStatus, setGithubStatus] = useState<"idle" | "loading" | "error">("idle");
  const [githubMessage, setGithubMessage] = useState("");
  const resultsRef = useRef<HTMLUListElement>(null);

  async function refresh() {
    setArticles(await api.listArticles());
  }

  useEffect(() => {
    refresh().catch((err) => setMessage(err instanceof Error ? err.message : "Failed to load articles"));
  }, []);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return articles;
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.source.toLowerCase().includes(needle) ||
        a.topic.toLowerCase().includes(needle),
    );
  }, [articles, filter]);

  useGSAP(
    () => {
      if (!resultsRef.current) return;
      gsap.fromTo(
        resultsRef.current.children,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.06 },
      );
    },
    { dependencies: [filtered], scope: resultsRef },
  );

  async function handleCrawl() {
    setStatus("loading");
    setMessage("");
    try {
      const results = await api.crawl();
      await refresh();
      setMessage(results.length === 0 ? "No new articles — add a feed on the Feeds page." : "");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Crawl failed");
    }
  }

  async function handleCrawlGithub(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = githubTopic.trim();
    if (!cleaned) return;
    setGithubStatus("loading");
    setGithubMessage("");
    try {
      const results = await api.crawlGithub(cleaned);
      await refresh();
      setGithubMessage(results.length === 0 ? `No repos found for topic "${cleaned}".` : "");
      setGithubStatus("idle");
    } catch (err) {
      setGithubStatus("error");
      setGithubMessage(err instanceof Error ? err.message : "GitHub search failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 pb-32">
      <Nav />

      <section className="flex w-full flex-col items-center pt-32 pb-20 text-center md:pt-40">
        <span className="mb-6 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-ink-faint uppercase">
          Topic-scoped RSS crawler
        </span>
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-semibold tracking-tight text-ink">
          Track a topic before anyone else does.
        </h1>

        <div className="mt-12 flex w-full max-w-xl items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter stored articles by topic…"
            className="w-full rounded-full border border-white/10 bg-white/[0.05] px-6 py-4 text-base text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent"
          />
          <button
            onClick={handleCrawl}
            disabled={status === "loading"}
            className="shrink-0 rounded-full bg-ink px-7 py-4 text-sm font-medium text-black transition-transform duration-300 hover:scale-105 disabled:opacity-50"
          >
            {status === "loading" ? "Crawling…" : "Crawl all feeds"}
          </button>
        </div>

        {message && (
          <p className={`mt-6 text-sm ${status === "error" ? "text-red-400" : "text-ink-dim"}`}>{message}</p>
        )}
        {!message && articles.length > 0 && (
          <p className="mt-6 text-sm text-ink-faint">
            {filtered.length} of {articles.length} articles
          </p>
        )}

        <form onSubmit={handleCrawlGithub} className="mt-8 flex w-full max-w-xl items-center gap-2">
          <input
            value={githubTopic}
            onChange={(e) => setGithubTopic(e.target.value)}
            placeholder="GitHub topic (e.g. machine-learning)"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={githubStatus === "loading"}
            className="shrink-0 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:border-accent disabled:opacity-50"
          >
            {githubStatus === "loading" ? "Searching…" : "Crawl GitHub repos"}
          </button>
        </form>
        {githubMessage && (
          <p className={`mt-4 text-sm ${githubStatus === "error" ? "text-red-400" : "text-ink-dim"}`}>
            {githubMessage}
          </p>
        )}
      </section>

      <ul ref={resultsRef} className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((article) => (
          <li
            key={article.id}
            className="group rounded-2xl border border-white/10 bg-surface-raised/60 p-6 transition-colors duration-300 hover:border-accent/40"
          >
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
              <span className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] tracking-wide text-ink-dim uppercase">
                  {article.source}
                </span>
                <span className="rounded-full border border-accent/30 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] tracking-wide text-accent uppercase">
                  {article.topic}
                </span>
              </span>
              <h2 className="text-lg leading-snug font-medium text-ink transition-colors duration-300 group-hover:text-accent">
                {article.title}
              </h2>
              <span className="mt-3 block text-xs text-ink-faint">
                {new Date(article.publishedAt).toLocaleString()}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
