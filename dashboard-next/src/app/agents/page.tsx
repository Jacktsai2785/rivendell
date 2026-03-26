"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, type AgentsData } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import AgentCard from "@/components/AgentCard";

export default function AgentsPage() {
  const [data, setData] = useState<AgentsData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<AgentsData>("/api/agents")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const { metrics, agents, by_project } = data;

  // Group agents by project name
  const projectNames = Object.keys(by_project).sort();
  const agentsByProject = new Map<string, typeof agents>();
  for (const name of projectNames) {
    agentsByProject.set(
      name,
      agents.filter((a) => a.project === name),
    );
  }
  // Agents not in any project group
  const grouped = new Set(projectNames);
  const ungrouped = agents.filter((a) => !grouped.has(a.project));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Agent 管理</h1>

      <MetricsRow
        metrics={[
          { label: "總 Agent 數", value: metrics.total },
          { label: "執行中", value: metrics.running },
          { label: "上次成功", value: metrics.last_success || "—" },
          { label: "今日花費", value: `$${metrics.today_cost.toFixed(4)}` },
        ]}
      />

      {agents.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">未找到 sk agent</p>
      ) : (
        <div className="mt-6 space-y-6">
          {projectNames.map((projName) => {
            const projAgents = agentsByProject.get(projName) || [];
            if (projAgents.length === 0) return null;
            return (
              <div key={projName}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  📁 {projName}
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {projAgents.length} agent{projAgents.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="flex flex-col gap-4">
                  {projAgents.map((agent) => (
                    <AgentCard key={agent.label} agent={agent} onRefresh={load} />
                  ))}
                </div>
              </div>
            );
          })}
          {ungrouped.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                未分類
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800">
                  {ungrouped.length}
                </span>
              </h2>
              <div className="flex flex-col gap-4">
                {ungrouped.map((agent) => (
                  <AgentCard key={agent.label} agent={agent} onRefresh={load} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
