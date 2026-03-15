"use client";

import { Fragment, useState, useEffect } from "react";
import { apiFetch, type AgentRun, type TimelineEvent } from "@/lib/api";
import { ChevronDown, ChevronRight } from "lucide-react";

const EVENT_ICONS: Record<string, string> = {
  tool: "🔧",
  text: "💬",
  thinking: "🧠",
  result: "📊",
  auto_commit: "📝",
  auto_push: "🚀",
  qa_gate_failed: "❌",
  path_filter_rejected: "🚫",
};

function InlineTimeline({
  label,
  startedAt,
}: {
  label: string;
  startedAt: string;
}) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<TimelineEvent[]>(
      `/api/agents/${encodeURIComponent(label)}/timeline?started_at=${encodeURIComponent(startedAt)}`
    )
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [label, startedAt]);

  if (loading) return <p className="py-2 text-xs text-zinc-400">載入時間線...</p>;
  if (!events || events.length === 0)
    return (
      <p className="py-2 text-xs text-zinc-500">
        無時間線資料（下次執行將自動記錄 tool calls）
      </p>
    );

  return (
    <div className="relative space-y-0 py-2">
      <div className="absolute left-3 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      {events.map((ev, i) => {
        const icon = EVENT_ICONS[ev.type] || "•";
        const time = ev.ts ? ev.ts.split("T")[1]?.slice(0, 8) || ev.ts : "";
        const isExpanded = expandedIdx === i;

        return (
          <div key={i} className="relative flex items-start gap-2 py-1 pl-0.5">
            <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs dark:bg-zinc-900">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="flex w-full items-start gap-2 text-left text-xs"
              >
                <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                  {time}
                </span>
                <span className="min-w-0 flex-1">
                  {ev.type === "tool" && (
                    <code className="rounded bg-blue-100 px-1 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {ev.name}
                    </code>
                  )}
                  {ev.type === "text" && (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {(ev.text || "").slice(0, 100)}
                      {(ev.len || 0) > 100 ? "..." : ""}
                    </span>
                  )}
                  {ev.type === "thinking" && (
                    <span className="italic text-zinc-500">
                      thinking ({ev.len} chars)
                    </span>
                  )}
                  {ev.type === "result" && (
                    <span className="text-green-600 dark:text-green-400">
                      完成 | {(ev.input_tokens || 0).toLocaleString()} in / {(ev.output_tokens || 0).toLocaleString()} out | ${ev.cost_usd?.toFixed(4)}
                    </span>
                  )}
                  {ev.type === "auto_commit" && (
                    <span className="text-amber-600">Commit: {ev.detail}</span>
                  )}
                  {ev.type === "auto_push" && (
                    <span className="text-amber-600">Push: {ev.detail}</span>
                  )}
                </span>
              </button>
              {isExpanded && ev.type === "tool" && ev.input && (
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-zinc-50 p-2 text-[10px] dark:bg-zinc-800">
                  {JSON.stringify(ev.input, null, 2)}
                </pre>
              )}
              {isExpanded && ev.type === "text" && (
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-[10px] whitespace-pre-wrap dark:bg-zinc-800">
                  {ev.text}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RunHistory({
  runs,
  agentLabel,
}: {
  runs: AgentRun[];
  agentLabel?: string;
}) {
  const [expandedRun, setExpandedRun] = useState<number | null>(null);

  if (runs.length === 0) {
    return <p className="mt-2 text-xs text-zinc-400">尚無執行紀錄</p>;
  }

  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
            {agentLabel && <th className="pb-2 pr-1 w-6" />}
            <th className="pb-2 pr-3 font-medium">時間</th>
            <th className="pb-2 pr-3 font-medium">結果</th>
            <th className="pb-2 pr-3 font-medium">花費</th>
            <th className="pb-2 pr-3 font-medium">Tokens</th>
            <th className="pb-2 pr-3 font-medium">Commit</th>
            <th className="pb-2 pr-3 font-medium">Files</th>
            <th className="pb-2 pr-3 font-medium">QA</th>
            <th className="pb-2 font-medium">Branch</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => (
            <Fragment key={i}>
              <tr
                className={`border-b border-zinc-100 dark:border-zinc-800 ${
                  agentLabel ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50" : ""
                }`}
                onClick={() => {
                  if (!agentLabel) return;
                  setExpandedRun(expandedRun === i ? null : i);
                }}
              >
                {agentLabel && (
                  <td className="py-1.5 pr-1 text-zinc-400">
                    {expandedRun === i ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </td>
                )}
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  {run.started_at || "—"}
                </td>
                <td className="py-1.5 pr-3">
                  {run.exit_code === 0 ? "✅" : `❌ (${run.exit_code})`}
                </td>
                <td className="py-1.5 pr-3">
                  {run.cost_usd != null ? `$${run.cost_usd.toFixed(4)}` : "—"}
                </td>
                <td className="py-1.5 pr-3">
                  {run.tokens_used?.toLocaleString() || "—"}
                </td>
                <td className="py-1.5 pr-3 font-mono">
                  {run.commit_sha || "—"}
                </td>
                <td className="py-1.5 pr-3">
                  {run.files_changed != null ? run.files_changed : "—"}
                </td>
                <td className="py-1.5 pr-3">
                  {run.qa_passed === 1
                    ? "✅"
                    : run.qa_passed === 0
                      ? "❌"
                      : "—"}
                </td>
                <td className="py-1.5">{run.branch_name || "—"}</td>
              </tr>
              {expandedRun === i && agentLabel && run.started_at && (
                <tr>
                  <td colSpan={9} className="bg-zinc-50/50 px-4 dark:bg-zinc-800/20">
                    <InlineTimeline
                      label={agentLabel}
                      startedAt={run.started_at}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
