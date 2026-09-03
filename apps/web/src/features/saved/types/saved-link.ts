import type { Article } from "@/features/search/types/article";
export interface SavedLink extends Article {
  savedAt: string;
  label?: string;
}
