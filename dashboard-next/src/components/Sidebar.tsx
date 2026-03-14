"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Coins,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/", label: "總覽", icon: LayoutDashboard },
  { href: "/agents", label: "Agent 管理", icon: Bot },
  { href: "/tokens", label: "Token 用量", icon: Coins },
  { href: "/skills", label: "Skill 總覽", icon: Sparkles },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 min-h-screen">
      <div className="px-4 py-6">
        <h1 className="text-lg font-bold tracking-tight">sk-dashboard</h1>
      </div>
      <nav className="flex flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
