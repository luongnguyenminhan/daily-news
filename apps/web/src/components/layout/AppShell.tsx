"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const navigation = [
  { href: "/search", label: "Search", icon: "search" as const },
  { href: "/saved", label: "Saved", icon: "bookmark" as const },
];

function NavigationLinks({
  pathname,
  mobile = false,
}: {
  pathname: string;
  mobile?: boolean;
}) {
  return (
    <nav
      aria-label="Primary navigation"
      className={mobile ? "flex items-center gap-1" : "mt-5 grid gap-1.5"}
    >
      {navigation.map(({ href, label, icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition-colors sm:px-3 ${active ? "bg-[#3d318f] text-white [&_svg]:text-[#9a62ff]" : "text-[#b8c1d1] hover:bg-white/5"}`
                : `flex min-h-12 items-center gap-3.5 rounded-lg px-3.5 text-[16px] font-semibold text-[#b8c1d1] transition-colors ${active ? "bg-gradient-to-r from-[#3d318f] to-[#332e80] text-white [&_svg]:text-[#9a62ff]" : "hover:bg-white/5"}`
            }
          >
            <Icon
              name={icon}
              className={mobile ? "h-5 w-5" : "h-[23px] w-[23px] stroke-[1.7]"}
            />
            <span className={mobile ? "sr-only sm:not-sr-only" : undefined}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative z-10 h-screen overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[266px] border-r border-[#202938] bg-[#0c1422]/55 px-4 py-5 md:block">
        <Link
          href="/"
          className="block pl-3 text-[25px] font-semibold tracking-[-.04em] text-[#f5f6fa]"
        >
          Daily News
        </Link>
        <NavigationLinks pathname={pathname} />
      </aside>
      <section className="ml-0 h-screen min-w-0 overflow-y-auto md:ml-[266px]">
        <header className="sticky top-0 z-10 h-[61px] border-b border-[#202938] bg-[#060b13]/95 backdrop-blur">
          <div className="flex h-full items-center justify-between px-4 md:hidden">
            <Link
              href="/"
              className="text-lg font-semibold tracking-[-.04em] text-[#f5f6fa]"
            >
              Daily News
            </Link>
            <NavigationLinks pathname={pathname} mobile />
          </div>
        </header>
        <main className="w-full max-w-[1290px] px-4 py-[18px] sm:px-9 sm:pb-[30px]">
          {children}
        </main>
      </section>
    </div>
  );
}
