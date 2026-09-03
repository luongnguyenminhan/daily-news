"use client";

import { Icon } from "@/components/ui/Icon";

interface SearchLandingProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export function SearchLanding({
  query,
  onQueryChange,
  onSearch,
}: SearchLandingProps) {
  return (
    <section className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#060b13] px-6 py-20">
      <div className="w-full max-w-[600px] text-center">
        <h1 className="w-full whitespace-nowrap bg-gradient-to-r from-[#a047ff] via-[#754dff] to-[#4c7dff] bg-clip-text text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-none tracking-[-.07em] text-transparent">
          Daily News
        </h1>

        <p className="mt-8 whitespace-nowrap text-[clamp(.8rem,2.3vw,1.4rem)] leading-[1.32] tracking-[-.03em] text-[#bec6d4]">
          Search the newest ideas, all in one place.
        </p>

        <form
          className="mt-12 flex h-11 w-full gap-2 rounded-lg border border-[#253043] bg-[#0e1521]/75 p-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-5">
            <Icon name="search" className="h-6 w-6 shrink-0 text-[#9aa6ba]" />
            <input
              className="w-full border-0 bg-transparent text-[15px] text-[#f3f5fb] outline-none placeholder:text-[#7f8a9d] sm:text-[18px]"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search papers, repositories, authors, topics..."
              autoFocus
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#5638e8] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)] transition-colors hover:bg-[#6749f4]"
          >
            <Icon name="search" className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  );
}
