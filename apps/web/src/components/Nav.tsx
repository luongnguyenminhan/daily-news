"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Search" },
  { href: "/feeds", label: "Feeds" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-6 z-20 flex justify-center px-4">
      <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-2 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        <Link
          href="/"
          className="mr-2 pl-3 pr-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-ink"
        >
          Daily News
        </Link>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
                active ? "bg-white text-black" : "text-ink-dim hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
