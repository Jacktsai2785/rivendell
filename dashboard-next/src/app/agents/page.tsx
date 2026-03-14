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

  useEffect(load, [load]);

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const { metrics, agents } = data;

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
        <div className="mt-6 flex flex-col gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.label} agent={agent} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
