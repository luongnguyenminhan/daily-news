"use client";

import { Icon } from "@/components/ui/Icon";

interface SearchLandingProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  loading?: boolean;
}

export function SearchLanding({
  query,
  onQueryChange,
  onSearch,
  loading = false,
}: SearchLandingProps) {
  return (
    <section
      className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-[#060b13] px-6 py-20"
      aria-labelledby="search-landing-title"
    >
      <div className="w-full max-w-[600px] text-center">
        <h1
          id="search-landing-title"
          className="w-full bg-gradient-to-r from-[#a047ff] via-[#754dff] to-[#4c7dff] bg-clip-text text-[clamp(3rem,9vw,7.5rem)] font-semibold leading-none tracking-[-.07em] text-transparent"
        >
          Daily News
        </h1>

        <p className="mx-auto mt-8 max-w-[34rem] text-[clamp(.8rem,2.3vw,1.4rem)] leading-[1.32] tracking-[-.03em] text-[#bec6d4]">
          Search the newest ideas, all in one place.
        </p>

        <form
          className="mx-auto mt-12 flex h-11 w-full max-w-[600px] rounded-lg border border-[#253043] bg-[#0e1521]/75 p-1 transition-colors focus-within:border-[#8568ff]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading) onSearch();
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-5">
            <Icon name="search" className="h-6 w-6 shrink-0 text-[#9aa6ba]" />
            <input
              type="search"
              aria-label="Search papers, repositories, authors, and topics"
              className="w-full border-0 bg-transparent text-[15px] text-[#f3f5fb] outline-none placeholder:text-[#7f8a9d] focus:border-0 focus:outline-none focus:ring-0 focus-visible:!outline-none focus-visible:!outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[18px]"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search papers, repositories, authors, topics..."
              autoFocus
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </section>
  );
}
