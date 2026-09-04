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
import { LAST_SEARCH_HREF_STORAGE_KEY } from "../lib/search-navigation";
import { SearchResultCard } from "./SearchResultCard";
import { useSearchArticles } from "../hooks/useSearchArticles";

export function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q")?.trim() ?? "";
  const isAllSearch = searchParams.get("all") === "1";
  const hasSearchRequest = Boolean(queryFromUrl) || isAllSearch;
  const pageFromUrl = Number(searchParams.get("page") ?? "1");
  const currentPage =
    Number.isInteger(pageFromUrl) && pageFromUrl > 0 ? pageFromUrl : 1;
  const { articles, loading, message, search, summarize, isSummarizing } =
    useSearchArticles({
      enabled: hasSearchRequest,
    });
  const { saved, save, remove } = useSavedLinks();
  const [query, setQuery] = useState(queryFromUrl);
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<"relevance" | "newest" | "oldest">(
    "relevance",
  );
  const lastSearchedQuery = useRef("");
  const summarizedArticleIds = useRef(new Set<string>());

  useEffect(() => {
    setQuery(queryFromUrl);
  }, [queryFromUrl]);

  useEffect(() => {
    if (
      loading ||
      !hasSearchRequest ||
      lastSearchedQuery.current === (queryFromUrl || "all")
    ) {
      return;
    }

    lastSearchedQuery.current = queryFromUrl || "all";
    void search(queryFromUrl);
  }, [hasSearchRequest, loading, queryFromUrl, search]);

  useEffect(() => {
    if (!hasSearchRequest) {
      return;
    }

    const params = new URLSearchParams();

    if (queryFromUrl) {
      params.set("q", queryFromUrl);
    }

    if (isAllSearch) {
      params.set("all", "1");
    }

    window.sessionStorage.setItem(
      LAST_SEARCH_HREF_STORAGE_KEY,
      `/search?${params.toString()}`,
    );
  }, [hasSearchRequest, isAllSearch, queryFromUrl]);

  const savedIds = useMemo(
    () => new Set(saved.map((item) => item.id)),
    [saved],
  );

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setSource(value);
  }, []);

  const handleSortChange = useCallback(
    (value: "relevance" | "newest" | "oldest") => {
      setSort(value);
    },
    [],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }

      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleSearch = useCallback(() => {
    const term = query.trim();

    if (!term) {
      if (isAllSearch) {
        lastSearchedQuery.current = "all";
        void search();
        return;
      }

      router.push("/search?all=1");
      return;
    }

    if (term === queryFromUrl) {
      lastSearchedQuery.current = term;
      void search(term);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [isAllSearch, query, queryFromUrl, router, search]);

  const results = useMemo(() => {
    if (!hasSearchRequest) {
      return [];
    }

    return filterAndSortArticles(articles, {
      query: queryFromUrl,
      source,
      sort,
    });
  }, [articles, hasSearchRequest, queryFromUrl, source, sort]);
  const totalPages = getTotalPages(results.length, ARTICLE_PAGE_SIZE);
  const visiblePage = totalPages ? Math.min(currentPage, totalPages) : 1;
  const pageResults = paginate(results, visiblePage, ARTICLE_PAGE_SIZE);

  useEffect(() => {
    if (isSummarizing) {
      return;
    }

    const articleIds = pageResults
      .filter(
        (article) =>
          article.summary?.status !== "DONE" &&
          !summarizedArticleIds.current.has(article.id),
      )
      .map((article) => article.id);

    if (!articleIds.length) {
      return;
    }

    articleIds.forEach((articleId) => {
      summarizedArticleIds.current.add(articleId);
    });

    void summarize(articleIds).catch(() => {
      articleIds.forEach((articleId) => {
        summarizedArticleIds.current.delete(articleId);
      });
    });
  }, [isSummarizing, pageResults, summarize]);

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
        {!hasSearchRequest
          ? "Enter a search term to find the latest results."
          : loading
            ? isAllSearch
              ? "Fetching the latest results from all feeds..."
              : "Searching for the latest results..."
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
            onPageChange={handlePageChange}
          />
          <p className="mt-[13px] text-center text-[16px] text-[#bec6d4]">
            {ARTICLE_PAGE_SIZE} results per page
          </p>
        </>
      )}
    </section>
  );
}
