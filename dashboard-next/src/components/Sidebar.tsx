"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Bot,
  Coins,
  Sparkles,
  Wheat,
} from "lucide-react";
import { apiFetch, type ProjectsData, type AgentsData } from "@/lib/api";

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
  { href: "/harvest", label: "Skill Harvest", icon: Wheat },
];

interface RunningAgent {
  label: string;
  name: string;
  project: string;
  pid: number | null;
  activity: { tool: string; label: string; detail: string } | null;
}

function RunningAgentsPanel() {
  const [agents, setAgents] = useState<RunningAgent[]>([]);

  const poll = useCallback(() => {
    apiFetch<AgentsData>("/api/agents")
      .then((data) => {
        const running = data.agents
          .filter((a) => a.pid !== null)
          .map((a) => ({
            label: a.label,
            name: a.name,
            project: a.project,
            pid: a.pid,
            activity: a.current_activity ?? null,
          }));
        setAgents(running);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [poll]);

  if (agents.length === 0) return null;

  return (
    <div className="border-t border-zinc-200 px-3 py-3 dark:border-zinc-800">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        執行中 ({agents.length})
      </p>
      <div className="space-y-1.5">
        {agents.map((a) => (
          <Link
            key={a.label}
            href={`/agents/${encodeURIComponent(a.label)}`}
            className="block rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
              <span className="min-w-0 truncate font-medium">
                {a.name}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[10px] text-zinc-400">
                {a.project}
              </span>
            </div>
            {a.activity && (
              <div className="mt-0.5 ml-3.5 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                <span className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">
                  {a.activity.label}
                </span>
                {a.activity.detail && (
                  <span className="min-w-0 truncate font-mono">
                    {a.activity.detail}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<ProjectsData>("/api/projects")
      .then((d) => setProjects(d.projects.map((p) => p.name)))
      .catch(() => {});
  }, []);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 min-h-screen">
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

      {/* Running agents indicator — always visible */}
      <div className="mt-auto">
        <RunningAgentsPanel />
      </div>
    </aside>
  );
}
