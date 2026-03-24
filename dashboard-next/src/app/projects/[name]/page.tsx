"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  apiFetch,
  type ProjectDetailData,
  type AgentInfo,
} from "@/lib/api";
import {
  ArrowLeft,
  FolderOpen,
  Clock,
  Activity,
  ChevronRight,
} from "lucide-react";

function StatusDot({ agent }: { agent: AgentInfo }) {
  if (agent.pid)
    return <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" title="Running" />;
  if (agent.exit_code !== null && agent.exit_code !== 0)
    return <span className="h-2.5 w-2.5 rounded-full bg-red-500" title={`Exit ${agent.exit_code}`} />;
  if (agent.loaded)
    return <span className="h-2.5 w-2.5 rounded-full bg-green-500" title="Loaded" />;
  return <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" title="Not loaded" />;
}

function AgentRow({ agent }: { agent: AgentInfo }) {
  return (
    <Link
      href={`/agents/${encodeURIComponent(agent.label)}`}
      className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
    >
      {/* Status dot */}
      <StatusDot agent={agent} />

      {/* Name & role */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{agent.name}</span>
          {agent.role_badge && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {agent.role_badge}
            </span>
          )}
        </div>
        {agent.description && (
          <p className="mt-0.5 text-xs text-zinc-500 truncate">
            {agent.description}
          </p>
        )}
      </div>

      {/* Schedule */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
        <Clock size={12} />
        <span>{agent.schedule_display || "—"}</span>
      </div>

      {/* Exit code */}
      <div className="text-xs">
        {agent.exit_code === null || agent.exit_code === undefined ? (
          <span className="text-zinc-400">—</span>
        ) : agent.exit_code === 0 ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-red-500">Exit {agent.exit_code}</span>
        )}
      </div>

      {/* Activity */}
      {agent.current_activity && (
        <div className="hidden md:flex items-center gap-1.5 max-w-48 text-xs text-blue-600 dark:text-blue-400 truncate">
          <Activity size={12} />
          <span>{agent.current_activity.label}</span>
          {agent.current_activity.detail && (
            <span className="text-zinc-400 truncate">
              {agent.current_activity.detail}
            </span>
          )}
        </div>
      )}

      <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600" />
    </Link>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const [data, setData] = useState<ProjectDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<ProjectDetailData>(`/api/projects/${encodeURIComponent(name)}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [name]);

  useEffect(load, [load]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const agents = data.agent_details || [];
  const running = agents.filter((a) => a.pid);
  const healthy = agents.filter((a) => a.loaded && (a.exit_code === 0 || a.exit_code === null));
  const failing = agents.filter((a) => a.exit_code !== null && a.exit_code !== 0);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back */}
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ArrowLeft size={16} /> 返回專案列表
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen size={24} className="text-blue-500" />
            <div>
              <h1 className="text-xl font-bold">{data.name}</h1>
              {data.description && (
                <p className="mt-0.5 text-sm text-zinc-500">{data.description}</p>
              )}
              <p className="mt-1 font-mono text-xs text-zinc-400">{data.repo}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="text-xs text-zinc-500">Agents</span>
            <p className="font-semibold">{agents.length}</p>
          </div>
          <div>
            <span className="text-xs text-zinc-500">Running</span>
            <p className="font-semibold text-blue-600">{running.length}</p>
          </div>
          <div>
            <span className="text-xs text-zinc-500">Healthy</span>
            <p className="font-semibold text-green-600">{healthy.length}</p>
          </div>
          {failing.length > 0 && (
            <div>
              <span className="text-xs text-zinc-500">Failing</span>
              <p className="font-semibold text-red-500">{failing.length}</p>
            </div>
          )}
          {data.total_cost_usd > 0 && (
            <div>
              <span className="text-xs text-zinc-500">Cost</span>
              <p className="font-semibold">${data.total_cost_usd.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent list */}
      <div className="mt-6 space-y-2">
        <h2 className="mb-3 text-lg font-semibold">Agents</h2>
        {agents.length > 0 ? (
          agents.map((agent) => (
            <AgentRow key={agent.label} agent={agent} />
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            此專案尚無 agent。
          </p>
        )}
      </div>
    </div>
  );
}
