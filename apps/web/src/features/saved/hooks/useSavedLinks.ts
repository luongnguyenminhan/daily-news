"use client";
import { useCallback, useEffect, useState } from "react";
import type { Article } from "@/features/search/types/article";
import type { SavedLink } from "../types/saved-link";

const key = "daily-news:saved-links";
function read(): SavedLink[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}
export function useSavedLinks() {
  const [saved, setSaved] = useState<SavedLink[]>([]);
  useEffect(() => setSaved(read()), []);
  const persist = useCallback((next: SavedLink[]) => {
    setSaved(next);
    localStorage.setItem(key, JSON.stringify(next));
  }, []);
  const save = useCallback(
    (article: Article, label?: string) => {
      const next = [
        { ...article, label, savedAt: new Date().toISOString() },
        ...read().filter((item) => item.id !== article.id),
      ];
      persist(next);
    },
    [persist],
  );
  const remove = useCallback(
    (id: string) => persist(read().filter((item) => item.id !== id)),
    [persist],
  );
  return { saved, save, remove };
}
