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
  Network,
  Workflow,
} from "lucide-react";
import { apiFetch, type ProjectsData, type AgentsData } from "@/lib/api";
import Logo from "./Logo";

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
  { href: "/projects/rivendell/workflow", label: "Workflow Map", icon: Workflow, indent: true },
  { href: "/skills", label: "Skill 總覽", icon: Sparkles },
  { href: "/harvest", label: "Skill Harvest", icon: Wheat, indent: true },
  { href: "/ports", label: "Port 對應", icon: Network },
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
    <div
      className="px-3 py-3"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <p
        className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-subtle)" }}
      >
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ background: "var(--status-ok)" }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: "var(--status-ok)" }}
          />
        </span>
        執行中 ({agents.length})
      </p>
      <div className="space-y-1.5">
        {agents.map((a) => (
          <Link
            key={a.label}
            href={`/agents/${encodeURIComponent(a.label)}`}
            className="block rounded-md px-2 py-1.5 transition-colors"
            style={{ color: "var(--text)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--surface-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <div className="flex items-center gap-2 text-xs">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: "var(--status-ok)" }}
              />
              <span className="min-w-0 truncate font-medium">{a.name}</span>
              <span
                className="ml-auto shrink-0 font-mono text-[10px]"
                style={{ color: "var(--text-subtle)" }}
              >
                {a.project}
              </span>
            </div>
            {a.activity && (
              <div
                className="mt-0.5 ml-3.5 flex items-center gap-1.5 text-[10px]"
                style={{ color: "var(--text-subtle)" }}
              >
                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
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
    <aside
      className="flex w-56 shrink-0 flex-col min-h-screen"
      style={{
        background: "var(--surface-2)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div className="px-4 pt-6 pb-1">
        <Logo size={28} />
      </div>
      <p
        className="px-4 pb-5 font-mono text-[11px]"
        style={{ color: "var(--text-muted)", letterSpacing: "0.02em" }}
      >
        council of skills · refuge of work
      </p>

      {/* Project switcher */}
      <div className="px-3 pb-4">
        <select
          className="w-full rounded-md px-2.5 py-1.5 text-xs font-mono"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          <option value="">all projects</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon, indent }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md py-2 text-sm font-medium transition-colors ${
                indent ? "pl-8 pr-3 text-[13px]" : "px-3"
              }`}
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                boxShadow: active ? "0 0 0 1px var(--border)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon size={indent ? 16 : 18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <RunningAgentsPanel />
      </div>
    </aside>
  );
}
