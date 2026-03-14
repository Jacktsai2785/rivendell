"use client";

import { useEffect, useState } from "react";
import { apiFetch, type OverviewData, type AgentInfo } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import CollaborationFlow from "@/components/CollaborationFlow";

function AgentStatusRow({ agent }: { agent: AgentInfo }) {
  let status: string;
  if (!agent.installed) {
    status = "⚪ 未安裝";
  } else if (agent.exit_code !== null && agent.exit_code !== 0) {
    status = `🔴 exit=${agent.exit_code}`;
  } else if (agent.loaded) {
    status = "🟢 已載入";
  } else {
    status = "🔴 未載入";
  }

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="py-2 pr-4 font-medium">
        {agent.project}/{agent.name}
      </td>
      <td className="py-2 pr-4">{status}</td>
      <td className="py-2 pr-4 text-sm text-zinc-500">
        排程 {agent.schedule_display}
      </td>
      <td className="py-2 text-sm text-zinc-500">{agent.role_badge}</td>
    </tr>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OverviewData>("/api/overview")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const { metrics, agents, hooks } = data;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">總覽</h1>

      <MetricsRow
        metrics={[
          { label: "Skill 總數", value: metrics.total_skills },
          { label: "執行中 Agent", value: metrics.running_agents },
          { label: "啟用 Hook", value: metrics.enabled_hooks },
          { label: "估算總花費", value: `$${metrics.total_cost_usd.toFixed(2)}` },
        ]}
      />

      {/* Agent status table */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Agent 狀態</h2>
        {agents.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <tbody>
                {agents.map((a) => (
                  <AgentStatusRow key={a.label} agent={a} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">未找到 sk agent</p>
        )}
      </section>

      {/* Hook status table */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Hook 狀態</h2>
        {hooks.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <tbody>
                {hooks.map((h, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2 pr-4 font-medium">{h.event}</td>
                    <td className="py-2 pr-4 text-zinc-500">
                      {h.matcher || "（全部）"}
                    </td>
                    <td className="py-2">
                      <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                        {h.command}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            未設定 hook（~/.claude/settings.json）
          </p>
        )}
      </section>

      {/* Collaboration flow */}
      <CollaborationFlow />
    </div>
  );
}
