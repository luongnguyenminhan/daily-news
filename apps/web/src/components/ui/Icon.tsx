import type { SVGProps } from "react";

type IconName =
  "search" | "bookmark" | "chevron" | "plus" | "github" | "arxiv" | "close";

export function Icon({
  name,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.25 4.25" />
      </svg>
    );
  if (name === "bookmark")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M6.5 3.75h11a1 1 0 0 1 1 1v15.5L12 16.4l-6.5 3.85V4.75a1 1 0 0 1 1-1Z" />
      </svg>
    );
  if (name === "chevron")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="m7.5 9.5 4.5 4.5 4.5-4.5" />
      </svg>
    );
  if (name === "plus")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  if (name === "close")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  if (name === "arxiv")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M6 6.5c2.3-2 9.7-2 12 0v11c-2.3 2-9.7 2-12 0Z" />
        <path d="m8.5 15.5 3.5-7 3.5 7M10 12.5h4" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path
        fill="currentColor"
        stroke="none"
        d="M12 2.5a9.5 9.5 0 0 0-3 18.51c.48.09.65-.21.65-.46v-1.68c-2.66.58-3.22-1.13-3.22-1.13-.43-1.1-1.06-1.39-1.06-1.39-.87-.59.07-.58.07-.58.96.07 1.47.98 1.47.98.86 1.47 2.25 1.05 2.8.8.09-.62.34-1.05.61-1.29-2.12-.24-4.35-1.06-4.35-4.72 0-1.04.37-1.89.98-2.56-.1-.24-.43-1.21.09-2.52 0 0 .8-.26 2.62.98A9.08 9.08 0 0 1 12 6.6c.81 0 1.63.11 2.39.32 1.82-1.24 2.62-.98 2.62-.98.52 1.31.19 2.28.09 2.52.61.67.98 1.52.98 2.56 0 3.67-2.24 4.47-4.37 4.71.34.3.65.87.65 1.75v2.59c0 .25.17.55.66.46A9.5 9.5 0 0 0 12 2.5Z"
      />
    </svg>
  );
}
