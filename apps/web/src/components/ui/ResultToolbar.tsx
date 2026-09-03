"use client";

import { useState } from "react";
import { Icon } from "./Icon";

const sources = ["All", "GitHub", "arXiv"];

type SortOrder = "relevance" | "newest" | "oldest";

interface ResultToolbarProps {
  source: string;
  onSourceChange: (source: string) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function ResultToolbar({
  source,
  onSourceChange,
  sort,
  onSortChange,
}: ResultToolbarProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortLabels: Record<SortOrder, string> = {
    relevance: "Relevance",
    newest: "Newest",
    oldest: "Oldest",
  };

  return (
    <div className="mt-[17px] flex items-start justify-between gap-3.5 sm:items-center">
      <div className="flex gap-1.5 sm:gap-4">
        {sources.map((item) => (
          <button
            key={item}
            className={`h-[42px] min-w-[84px] rounded-lg border border-[#243043] bg-[#0e1521]/75 px-4 text-[15px] text-[#bec6d4] transition-colors hover:border-[#5b3de5]/70 hover:text-white sm:text-[18px] ${source === item ? "border-[#6044e8] bg-gradient-to-br from-[#5538dc] to-[#6c45ff] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)]" : ""}`}
            onClick={() => onSourceChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[14px] text-[#b5bdca] sm:text-[18px]">
        <span>Sort by:</span>
        <span className="relative">
          <button
            type="button"
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            className="flex h-[42px] w-[140px] items-center rounded-lg border border-[#243043] bg-[#0e1521]/75 px-3 text-left text-[14px] font-normal text-[#b5bdca] transition-colors hover:border-[#5b3de5]/70 sm:px-3 sm:text-[18px]"
            onClick={() => setIsSortOpen((isOpen) => !isOpen)}
          >
            {sortLabels[sort]}
            <Icon
              name="chevron"
              className={`ml-auto h-4 w-4 text-[#f5f7fb] transition-transform ${isSortOpen ? "rotate-180" : ""}`}
            />
          </button>
          {isSortOpen && (
            <div
              role="listbox"
              aria-label="Sort results"
              className="absolute left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#243043] bg-[#111925] py-1 shadow-[0_16px_32px_rgba(0,0,0,.35)]"
            >
              {(Object.keys(sortLabels) as SortOrder[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={sort === option}
                  className={`block w-full px-4 py-2 text-left text-[14px] font-normal text-[#bec6d4] transition-colors hover:bg-[#1b2636] hover:text-white sm:text-[18px] ${sort === option ? "bg-gradient-to-br from-[#5538dc] to-[#6c45ff] text-white" : ""}`}
                  onClick={() => {
                    onSortChange(option);
                    setIsSortOpen(false);
                  }}
                >
                  {sortLabels[option]}
                </button>
              ))}
            </div>
          )}
        </span>
      </label>
    </div>
  );
}
