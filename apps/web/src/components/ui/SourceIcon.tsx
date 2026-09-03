import { Icon } from "./Icon";

export function SourceIcon({ source }: { source: string }) {
  const github = source.toLowerCase().includes("github");

  return (
    <span
      role="img"
      aria-label={source}
      className={`grid h-[52px] w-[52px] place-items-center rounded-full ${github ? "bg-[#f8fafc] text-[#07101f]" : "bg-[#e42a2c] text-white"}`}
    >
      <Icon name={github ? "github" : "arxiv"} className="h-[37px] w-[37px]" />
    </span>
  );
}
