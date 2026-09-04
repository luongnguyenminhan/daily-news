import type { Article } from "@/domain/article";
import { Icon } from "./Icon";
import { SourceIcon } from "./SourceIcon";
import { resultCardTypography } from "./typography";

interface ArticleCardProps {
  article: Article;
  title?: string;
  subtitle?: string;
  description?: string;
  saved?: boolean;
  onBookmarkClick?: () => void;
}

const articleDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function ArticleCard({
  article,
  title = article.title,
  subtitle,
  description = article.topic,
  saved = false,
  onBookmarkClick,
}: ArticleCardProps) {
  const date = articleDateFormatter.format(new Date(article.publishedAt));

  return (
    <article className="group relative rounded-[11px] border border-[#202b3b] bg-[#0e1521]/65 transition-colors hover:border-[#35435a]">
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="grid grid-cols-[50px_minmax(0,1fr)] items-center gap-3 rounded-[11px] px-[18px] py-[16px] pr-[55px] text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff] focus-visible:ring-inset sm:grid-cols-[68px_minmax(0,1fr)_255px] sm:gap-[17px] sm:px-[22px] sm:py-[18px] sm:pr-[74px]"
      >
        <SourceIcon source={article.source} />
        <div className="min-w-0">
          <h2 className={resultCardTypography.title}>{title}</h2>
          {subtitle && (
            <p className={resultCardTypography.subtitle}>{subtitle}</p>
          )}
          <p className={resultCardTypography.description}>{description}</p>
        </div>
        <time
          className={resultCardTypography.meta}
          dateTime={article.publishedAt}
        >
          {date}
        </time>
      </a>
      {onBookmarkClick && (
        <button
          type="button"
          aria-label={saved ? "Remove saved link" : "Save link"}
          className={`absolute right-[23px] top-[20px] rounded p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8568ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1521] ${saved ? "text-[#9b68ff]" : "text-[#aab6c8] hover:text-white"}`}
          onClick={onBookmarkClick}
        >
          <Icon name="bookmark" className="h-7 w-7" />
        </button>
      )}
    </article>
  );
}
