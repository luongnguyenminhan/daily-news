"use client";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SearchField } from "@/components/ui/SearchField";
import { ResultToolbar } from "@/components/ui/ResultToolbar";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Pagination } from "@/components/ui/Pagination";
import { useSavedLinks } from "../hooks/useSavedLinks";
export function SavedPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [sort, setSort] = useState<"relevance" | "newest" | "oldest">(
    "relevance",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const { saved, remove } = useSavedLinks();
  const results = useMemo(() => {
    const filtered = saved.filter(
      (item) =>
        (source === "All" ||
          item.source.toLowerCase().includes(source.toLowerCase())) &&
        `${item.title} ${item.source} ${item.topic} ${item.label ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );

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
  }, [saved, query, source, sort]);
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
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="mb-[11px] text-[31px] font-semibold leading-tight tracking-[-.045em] sm:text-[36px]">
          Saved
        </h1>
        <button className="mb-[10px] inline-flex h-11 w-[140px] items-center justify-center gap-[7px] rounded-[7px] bg-[#5638e8] px-[18px] text-[17px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)]">
          <Icon name="plus" className="h-5 w-5" /> Add new
        </button>
      </div>
      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={() => undefined}
        placeholder="Search saved links..."
      />
      <ResultToolbar
        source={source}
        onSourceChange={setSource}
        sort={sort}
        onSortChange={setSort}
      />
      <p className="my-[17px] text-[17px] text-[#b5bdca]">
        About {results.length} saved results
      </p>
      <div className="grid gap-[13px]">
        {pageResults.map((item) => (
          <ArticleCard
            key={item.id}
            article={{ ...item, title: item.label || item.title }}
            saved
            onRemove={() => remove(item.id)}
          />
        ))}
      </div>
      {results.length ? (
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
      ) : (
        <p className="text-[17px] text-[#aab6c8]">
          Save an article from Search to keep it here.
        </p>
      )}
    </section>
  );
}
