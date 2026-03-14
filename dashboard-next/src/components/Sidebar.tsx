"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  Coins,
  Sparkles,
} from "lucide-react";
import { apiFetch, type ProjectsData } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  indent?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "總覽", icon: LayoutDashboard },
  { href: "/projects", label: "專案管理", icon: FolderOpen },
  { href: "/agents", label: "Agent 管理", icon: Bot, indent: true },
  { href: "/tokens", label: "Token 用量", icon: Coins, indent: true },
  { href: "/skills", label: "Skill 總覽", icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<ProjectsData>("/api/projects")
      .then((d) => setProjects(d.projects.map((p) => p.name)))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 min-h-screen">
      <div className="px-4 py-6">
        <h1 className="text-lg font-bold tracking-tight">sk-dashboard</h1>
      </div>

      {/* Project Switcher */}
      <div className="px-3 pb-4">
        <select className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <option value="">🌐 全部專案</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              📁 {p}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon, indent }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors ${
                indent ? "pl-8 pr-3 text-[13px]" : "px-3"
              } ${
                active
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
              }`}
            >
              <Icon size={indent ? 16 : 18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
