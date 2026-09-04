"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchLanding } from "./SearchLanding";

export function SearchLandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(() => {
    const term = query.trim();

    if (!term) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(term)}`);
  }, [query, router]);

  return (
    <SearchLanding
      query={query}
      onQueryChange={setQuery}
      onSearch={handleSearch}
    />
  );
}
