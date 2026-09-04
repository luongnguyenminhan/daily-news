"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { ResultToolbar } from "@/components/ui/ResultToolbar";
import { SearchField } from "@/components/ui/SearchField";
import { useSavedLinks } from "@/features/saved/hooks/useSavedLinks";
import {
  ARTICLE_PAGE_SIZE,
  ARTICLE_SOURCES,
  filterAndSortArticles,
  getTotalPages,
  paginate,
} from "@/lib/article-list";
import { SearchResultCard } from "./SearchResultCard";
import { useSearchArticles } from "../hooks/useSearchArticles";

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { articles, loading, message, search } = useSearchArticles();
  const { saved, save, remove } = useSavedLinks();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(queryFromUrl);
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<"relevance" | "newest" | "oldest">(
    "relevance",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const lastSearchedQuery = useRef("");

  useEffect(() => {
    setQuery(queryFromUrl);
    setCurrentPage(1);

    if (
      loading ||
      !queryFromUrl ||
      lastSearchedQuery.current === queryFromUrl
    ) {
      return;
    }

    lastSearchedQuery.current = queryFromUrl;
    void search(queryFromUrl);
  }, [loading, queryFromUrl, search]);

  const savedIds = useMemo(
    () => new Set(saved.map((item) => item.id)),
    [saved],
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setSource(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback(
    (value: "relevance" | "newest" | "oldest") => {
      setSort(value);
      setCurrentPage(1);
    },
    [],
  );

  const handleSearch = useCallback(() => {
    const term = query.trim();

    if (!term) {
      return;
    }

    if (term === queryFromUrl) {
      lastSearchedQuery.current = term;
      void search(term);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [query, queryFromUrl, router, search]);

  const results = useMemo(() => {
    if (!queryFromUrl) {
      return [];
    }

    return filterAndSortArticles(articles, { query, source, sort });
  }, [articles, query, queryFromUrl, source, sort]);
  const totalPages = getTotalPages(results.length, ARTICLE_PAGE_SIZE);
  const visiblePage = totalPages ? Math.min(currentPage, totalPages) : 1;
  const pageResults = paginate(results, visiblePage, ARTICLE_PAGE_SIZE);

  return (
    <section aria-labelledby="search-results-title">
      <h1
        id="search-results-title"
        className="mb-[11px] text-[31px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]"
      >
        Search
      </h1>
      <SearchField
        value={query}
        onChange={handleQueryChange}
        onSubmit={handleSearch}
        placeholder="Search GitHub and arXiv..."
        disabled={loading}
      />
      <ResultToolbar
        sources={ARTICLE_SOURCES}
        source={source}
        onSourceChange={handleSourceChange}
        sort={sort}
        onSortChange={handleSortChange}
      />
      <p
        className="my-[17px] text-[17px] text-[#b5bdca]"
        role={loading ? "status" : undefined}
        aria-live="polite"
      >
        {!queryFromUrl
          ? "Enter a search term to find the latest results."
          : loading
            ? "Searching for the latest results..."
            : results.length
              ? `About ${results.length} results`
              : "No matching results"}
      </p>
      {message && (
        <p className="text-[17px] text-[#ff9ba5]" role="alert">
          {message}
        </p>
      )}
      <div className="grid gap-[13px]" aria-busy={loading}>
        {pageResults.map((article) => (
          <SearchResultCard
            key={article.id}
            article={article}
            onSave={save}
            onRemove={() => remove(article.id)}
            saved={savedIds.has(article.id)}
          />
        ))}
      </div>
      {results.length > 0 && (
        <>
          <Pagination
            currentPage={visiblePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
          <p className="mt-[13px] text-center text-[16px] text-[#bec6d4]">
            {ARTICLE_PAGE_SIZE} results per page
          </p>
        </>
      )}
    </section>
  );
}
