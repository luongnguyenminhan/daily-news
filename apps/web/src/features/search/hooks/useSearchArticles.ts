"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Article } from "@/domain/article";
import { articlesApi } from "../api/articles";

const ARTICLES_QUERY_KEY = ["articles"];

interface UseSearchArticlesOptions {
  enabled?: boolean;
}

export function useSearchArticles({
  enabled = true,
}: UseSearchArticlesOptions = {}) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const articlesQuery = useQuery<Article[]>({
    queryKey: ARTICLES_QUERY_KEY,
    queryFn: articlesApi.list,
    enabled,
  });
  const crawlMutation = useMutation({
    mutationFn: (query: string) =>
      query ? articlesApi.crawlGithub(query) : articlesApi.crawl(),
  });
  const summarizeMutation = useMutation({
    mutationFn: articlesApi.summarize,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ARTICLES_QUERY_KEY });
    },
  });

  const search = useCallback(
    async (query = "") => {
      const term = query.trim();

      if (articlesQuery.isFetching || crawlMutation.isPending) {
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

  const summarize = useCallback(
    async (articleIds: string[]) => {
      if (!articleIds.length) {
        return;
      }

      await summarizeMutation.mutateAsync(articleIds);
    },
    [summarizeMutation],
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
    summarize,
    isSummarizing: summarizeMutation.isPending,
  };
}
