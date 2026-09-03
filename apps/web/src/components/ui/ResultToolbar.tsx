"use client";

import { Icon } from "./Icon";

type SortOrder = "relevance" | "newest" | "oldest";

interface ResultToolbarProps {
  sources: readonly string[];
  source: string;
  onSourceChange: (source: string) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function ResultToolbar({
  sources,
  source,
  onSourceChange,
  sort,
  onSortChange,
}: ResultToolbarProps) {
  const sortLabels: Record<SortOrder, string> = {
    relevance: "Relevance",
    newest: "Newest",
    oldest: "Oldest",
  };

  return (
    <div className="mt-[17px] flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:gap-4">
        {sources.map((item) => (
          <button
            key={item}
            type="button"
            className={`shrink-0 rounded-lg border border-[#243043] bg-[#0e1521]/75 px-4 py-2 text-[15px] text-[#bec6d4] transition-colors hover:border-[#5b3de5]/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff] sm:min-w-[84px] sm:text-[18px] ${source === item ? "border-[#6044e8] bg-gradient-to-br from-[#5538dc] to-[#6c45ff] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)]" : ""}`}
            onClick={() => onSourceChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <label
        className="flex items-center gap-2 self-end text-[14px] text-[#b5bdca] sm:self-auto sm:text-[18px]"
        htmlFor="sort-results"
      >
        <span>Sort by:</span>
        <span className="relative">
          <select
            id="sort-results"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOrder)}
            className="h-[42px] w-[140px] appearance-none rounded-lg border border-[#243043] bg-[#0e1521]/75 px-3 pr-9 text-left text-[14px] font-normal text-[#b5bdca] transition-colors hover:border-[#5b3de5]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff] sm:text-[18px]"
          >
            {(Object.keys(sortLabels) as SortOrder[]).map((option) => (
              <option key={option} value={option}>
                {sortLabels[option]}
              </option>
            ))}
          </select>
          <Icon
            name="chevron"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#f5f7fb]"
          />
        </span>
      </label>
    </div>
  );
}
