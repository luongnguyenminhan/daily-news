"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Article } from "@/domain/article";
import { articlesApi } from "../api/articles";

const ARTICLES_QUERY_KEY = ["articles"];

export function useSearchArticles() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const articlesQuery = useQuery<Article[]>({
    queryKey: ARTICLES_QUERY_KEY,
    queryFn: articlesApi.list,
  });
  const crawlMutation = useMutation({
    mutationFn: articlesApi.crawlGithub,
  });

  const search = useCallback(
    async (query: string) => {
      const term = query.trim();

      if (!term || articlesQuery.isFetching || crawlMutation.isPending) {
        return false;
      }

      setMessage("");

      try {
        await crawlMutation.mutateAsync(term);
        await queryClient.invalidateQueries({ queryKey: ARTICLES_QUERY_KEY });
        return true;
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Search failed.");
        return false;
      }
    },
    [articlesQuery.isFetching, crawlMutation, queryClient],
  );

  const queryMessage =
    articlesQuery.error instanceof Error
      ? articlesQuery.error.message
      : articlesQuery.error
        ? "Could not load results."
        : "";

  return {
    articles: articlesQuery.data ?? [],
    loading:
      articlesQuery.isLoading ||
      articlesQuery.isFetching ||
      crawlMutation.isPending,
    message: message || queryMessage,
    search,
  };
}
