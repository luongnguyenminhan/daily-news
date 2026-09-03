"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Article } from "@/domain/article";
import { savedLinksStorage } from "../storage/savedLinksStorage";

export function useSavedLinks() {
  const saved = useSyncExternalStore(
    savedLinksStorage.subscribe,
    savedLinksStorage.read,
    () => [],
  );

  const save = useCallback((article: Article, label?: string) => {
    const next = [
      { ...article, label, savedAt: new Date().toISOString() },
      ...savedLinksStorage.read().filter((item) => item.id !== article.id),
    ];
    savedLinksStorage.write(next);
  }, []);

  const remove = useCallback((id: string) => {
    savedLinksStorage.write(
      savedLinksStorage.read().filter((item) => item.id !== id),
    );
  }, []);

  return { saved, save, remove };
}
