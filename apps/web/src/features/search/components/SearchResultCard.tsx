"use client";

import { useState } from "react";
import type { Article } from "@/domain/article";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { SaveArticleDialog } from "./SaveArticleDialog";

interface SearchResultCardProps {
  article: Article;
  saved: boolean;
  onSave: (article: Article, label?: string) => void;
  onRemove?: () => void;
}

export function SearchResultCard({
  article,
  saved,
  onSave,
  onRemove,
}: SearchResultCardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [topic, setTopic] = useState(article.topic);

  function handleBookmarkClick() {
    if (saved) {
      onRemove?.();
      return;
    }

    setFormOpen(true);
  }

  function handleSave() {
    onSave({ ...article, topic }, label.trim() || undefined);
    setFormOpen(false);
  }

  return (
    <div className="relative">
      <ArticleCard
        article={article}
        saved={saved}
        description={article.summary?.content ?? article.title}
        onBookmarkClick={handleBookmarkClick}
      />
      <SaveArticleDialog
        open={formOpen}
        label={label}
        topic={topic}
        onLabelChange={setLabel}
        onTopicChange={setTopic}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />
    </div>
  );
}
