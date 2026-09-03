"use client";
import { useEffect, useMemo, useState } from "react";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { SearchField } from "@/components/ui/SearchField";
import { ResultToolbar } from "@/components/ui/ResultToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { articlesApi } from "../api/articles";
import { useSavedLinks } from "@/features/saved/hooks/useSavedLinks";
import type { Article } from "../types/article";
import { SearchLanding } from "./SearchLanding";
export function SearchPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<"relevance" | "newest" | "oldest">(
    "relevance",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { saved, save } = useSavedLinks();
  async function refresh() {
    try {
      setArticles(await articlesApi.list());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not load results.",
      );
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function search() {
    if (!query.trim()) return;

    setHasSearched(true);
    setLoading(true);
    setMessage("");
    try {
      await articlesApi.crawlGithub(query.trim());
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }
  const results = useMemo(() => {
    const filtered = articles.filter((article) => {
      const matchesSource =
        source === "All" ||
        article.source.toLowerCase().includes(source.toLowerCase());
      const term = query.toLowerCase();
      return (
        matchesSource &&
        (!term ||
          article.title.toLowerCase().includes(term) ||
          article.topic.toLowerCase().includes(term) ||
          article.source.toLowerCase().includes(term))
      );
    });

    if (sort === "newest") {
      return [...filtered].sort(
        (first, second) =>
          new Date(second.publishedAt).getTime() -
          new Date(first.publishedAt).getTime(),
      );
    }

    if (sort === "oldest") {
      return [...filtered].sort(
        (first, second) =>
          new Date(first.publishedAt).getTime() -
          new Date(second.publishedAt).getTime(),
      );
    }

    return filtered;
  }, [articles, query, source, sort]);
  const totalPages = Math.ceil(results.length / 10);
  const pageResults = results.slice((currentPage - 1) * 10, currentPage * 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, source, sort]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!hasSearched) {
    return (
      <SearchLanding query={query} onQueryChange={setQuery} onSearch={search} />
    );
  }
  return (
    <section>
      <h1 className="mb-[11px] text-[31px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
        Search
      </h1>
      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={search}
        placeholder="Search GitHub and arXiv..."
      />
      <ResultToolbar
        source={source}
        onSourceChange={setSource}
        sort={sort}
        onSortChange={setSort}
      />
      <p className="my-[17px] text-[17px] text-[#b5bdca]">
        {results.length ? `About ${results.length} results` : "No results yet"}
      </p>
      {message && <p className="text-[17px] text-[#ff9ba5]">{message}</p>}
      <div className="grid gap-[13px]">
        {pageResults.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onSave={save}
            saved={saved.some((item) => item.id === article.id)}
          />
        ))}
      </div>
      {results.length > 0 && (
        <>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <p className="mt-[13px] text-center text-[16px] text-[#bec6d4]">
            10 results per page
          </p>
        </>
      )}
    </section>
  );
}
