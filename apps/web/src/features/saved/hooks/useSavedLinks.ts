"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Article, SavedLink } from "@/domain/article";
import { savedLinksStorage } from "../storage/savedLinksStorage";

const SERVER_SAVED_LINKS: SavedLink[] = [];

export function useSavedLinks() {
  const saved = useSyncExternalStore(
    savedLinksStorage.subscribe,
    savedLinksStorage.read,
    () => SERVER_SAVED_LINKS,
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
