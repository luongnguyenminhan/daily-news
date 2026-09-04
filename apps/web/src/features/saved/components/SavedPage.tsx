"use client";

import { useCallback, useMemo, useState } from "react";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import { ResultToolbar } from "@/components/ui/ResultToolbar";
import { SearchField } from "@/components/ui/SearchField";
import type { SortOrder } from "@/domain/article";
import {
  ARTICLE_PAGE_SIZE,
  ARTICLE_SOURCES,
  filterAndSortArticles,
  getTotalPages,
  paginate,
} from "@/lib/article-list";
import { useSavedLinks } from "../hooks/useSavedLinks";

export function SavedPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<SortOrder>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const { saved, remove } = useSavedLinks();

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSourceChange = useCallback((value: string) => {
    setSource(value);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOrder) => {
    setSort(value);
    setCurrentPage(1);
  }, []);

  const results = useMemo(
    () =>
      filterAndSortArticles(saved, {
        query,
        source,
        sort,
        getSearchText: (item) =>
          `${item.title} ${item.source} ${item.topic} ${item.label ?? ""}`,
      }),
    [saved, query, source, sort],
  );
  const totalPages = getTotalPages(results.length, ARTICLE_PAGE_SIZE);
  const visiblePage = totalPages ? Math.min(currentPage, totalPages) : 1;
  const pageResults = paginate(results, visiblePage, ARTICLE_PAGE_SIZE);

  return (
    <section>
      <h1 className="mb-[11px] text-[31px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
        Saved
      </h1>
      <SearchField
        value={query}
        onChange={handleQueryChange}
        placeholder="Search saved links..."
      />
      <ResultToolbar
        sources={ARTICLE_SOURCES}
        source={source}
        onSourceChange={handleSourceChange}
        sort={sort}
        onSortChange={handleSortChange}
      />
      <p className="my-[17px] text-[17px] text-[#b5bdca]">
        About {results.length} saved results
      </p>
      <div className="grid gap-[13px]">
        {pageResults.map((item) => (
          <ArticleCard
            key={item.id}
            article={item}
            title={`${item.topic}: ${item.label || item.title}`}
            subtitle={item.title}
            description={
              item.summary?.content ?? "No AI-generated description yet."
            }
            saved
            onBookmarkClick={() => remove(item.id)}
          />
        ))}
      </div>
      {results.length ? (
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
      ) : (
        <p className="text-[17px] text-[#aab6c8]">
          Save an article from Search to keep it here.
        </p>
      )}
    </section>
  );
}
