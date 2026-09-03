"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { resultCardTypography } from "@/components/ui/typography";
import { SourceIcon } from "./SourceIcon";
import type { Article } from "../types/article";

export function ResultCard({
  article,
  onSave,
  saved = false,
  onRemove,
}: {
  article: Article;
  onSave?: (article: Article, label?: string) => void;
  saved?: boolean;
  onRemove?: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [topic, setTopic] = useState(article.topic);
  const date = new Date(article.publishedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  function save() {
    onSave?.({ ...article, topic }, label.trim() || undefined);
    setFormOpen(false);
  }
  return (
    <article className="relative min-h-[100px] rounded-[11px] border border-[#202b3b] bg-[#0e1521]/65">
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="grid min-h-[100px] grid-cols-[50px_minmax(0,1fr)] items-center gap-3 px-[18px] py-[16px] pr-[55px] text-inherit no-underline sm:min-h-[111px] sm:grid-cols-[68px_minmax(0,1fr)_255px] sm:gap-[17px] sm:px-[22px] sm:py-[18px] sm:pr-[74px]"
      >
        <SourceIcon source={article.source} />
        <div className="min-w-0">
          <h2 className={resultCardTypography.title}>{article.title}</h2>
          <p className={resultCardTypography.description}>{article.title}</p>
        </div>
        <time className={resultCardTypography.meta}>{date}</time>
      </a>
      <button
        aria-label={saved ? "Remove saved link" : "Save link"}
        className={`absolute right-[23px] top-[20px] border-0 bg-transparent p-0 ${saved ? "text-[#9b68ff]" : "text-[#aab6c8]"}`}
        onClick={() => (saved ? onRemove?.() : setFormOpen(true))}
      >
        <Icon name="bookmark" className="h-7 w-7" />
      </button>
      {formOpen && (
        <div className="absolute right-0 top-[65px] z-10 w-[calc(100vw-32px)] rounded-[9px] border border-[#5a6678] bg-[#111925] p-5 shadow-[0_17px_36px_rgba(0,0,0,.35)] sm:w-[363px]">
          <div className="mb-[13px] flex items-center justify-between text-[18px]">
            <span>Save link</span>
            <button
              className="border-0 bg-transparent text-[#aab6c8]"
              onClick={() => setFormOpen(false)}
            >
              <Icon name="close" className="h-[19px] w-[19px]" />
            </button>
          </div>
          <label className="my-3 grid grid-cols-[73px_1fr] items-center gap-2.5 text-[16px] text-[#eef0f4]">
            Name
            <input
              className="h-[41px] min-w-0 rounded border border-[#8490a3] bg-transparent px-2.5 text-white outline-none"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={article.title}
            />
          </label>
          <label className="my-3 grid grid-cols-[73px_1fr] items-center gap-2.5 text-[16px] text-[#eef0f4]">
            Topic
            <input
              className="h-[41px] min-w-0 rounded border border-[#8490a3] bg-transparent px-2.5 text-white outline-none"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>
          <button
            className="ml-auto mt-[14px] block border-0 bg-transparent text-[20px] text-[#9565ff]"
            onClick={save}
          >
            Save
          </button>
        </div>
      )}
    </article>
  );
}
