"use client";

import { useCallback, useMemo, useState } from "react";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { ResultToolbar } from "@/components/ui/ResultToolbar";
import { SearchField } from "@/components/ui/SearchField";
import type { Article, SortOrder } from "@/domain/article";
import {
  ARTICLE_PAGE_SIZE,
  ARTICLE_SOURCES,
  filterAndSortArticles,
  getTotalPages,
  paginate,
} from "@/lib/article-list";
import { useSavedLinks } from "../hooks/useSavedLinks";
import { AddSavedLinkDialog } from "./AddSavedLinkDialog";

export function SavedPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<SortOrder>("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const { saved, save, remove } = useSavedLinks();

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

  const handleAddLink = useCallback(
    (article: Article, label?: string) => {
      save(article, label);
      setCurrentPage(1);
    },
    [save],
  );

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
      <div className="mb-[11px] flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[31px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
          Saved
        </h1>
        <button
          type="button"
          className="inline-flex h-10 w-[140px] items-center justify-center gap-2 rounded-[7px] bg-[#5638e8] px-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#6749f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff]"
          onClick={() => setAddLinkOpen(true)}
        >
          <Icon name="plus" className="h-[18px] w-[18px]" />
          Add new
        </button>
      </div>
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
          Save an article from Search or add a link to keep it here.
        </p>
      )}
      <AddSavedLinkDialog
        open={addLinkOpen}
        onOpenChange={setAddLinkOpen}
        onSave={handleAddLink}
      />
    </section>
  );
}
