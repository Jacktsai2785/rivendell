"use client";

import { Fragment, useState, useEffect } from "react";
import {
  apiFetch,
  type AgentRun,
  type AgentFile,
  type AgentFileContent,
  type TimelineEvent,
} from "@/lib/api";
import { ChevronDown, ChevronRight, FileText, X } from "lucide-react";

const EVENT_ICONS: Record<string, string> = {
  tool: "🔧",
  text: "💬",
  thinking: "🧠",
  result: "📊",
  auto_commit: "📝",
  auto_push: "🚀",
  qa_gate_failed: "❌",
  path_filter_rejected: "🚫",
  log: "📋",
  log_error: "🔴",
  log_warn: "🟡",
  log_header: "📌",
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

  if (loading)
    return <p className="py-2 text-xs text-zinc-400">載入時間線...</p>;
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
                      完成 | {(ev.input_tokens || 0).toLocaleString()} in /{" "}
                      {(ev.output_tokens || 0).toLocaleString()} out | $
                      {ev.cost_usd?.toFixed(4)}
                    </span>
                  )}
                  {ev.type === "auto_commit" && (
                    <span className="text-amber-600">
                      Commit: {ev.detail}
                    </span>
                  )}
                  {ev.type === "auto_push" && (
                    <span className="text-amber-600">Push: {ev.detail}</span>
                  )}
                  {ev.type === "log" && (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {ev.text}
                    </span>
                  )}
                  {ev.type === "log_error" && (
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {ev.text}
                    </span>
                  )}
                  {ev.type === "log_warn" && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {ev.text}
                    </span>
                  )}
                  {ev.type === "log_header" && (
                    <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {ev.text}
                    </span>
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

function RunArtifacts({
  label,
  startedAt,
}: {
  label: string;
  startedAt: string;
}) {
  const [artifacts, setArtifacts] = useState<AgentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<AgentFileContent | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  useEffect(() => {
    apiFetch<AgentFile[]>(
      `/api/agents/${encodeURIComponent(label)}/artifacts?started_at=${encodeURIComponent(startedAt)}`
    )
      .then(setArtifacts)
      .catch(() => setArtifacts([]))
      .finally(() => setLoading(false));
  }, [label, startedAt]);

  async function openFile(path: string) {
    setFileLoading(true);
    try {
      const data = await apiFetch<AgentFileContent>(
        `/api/agents/${encodeURIComponent(label)}/file?path=${encodeURIComponent(path)}`
      );
      setViewingFile(data);
    } catch {
      setViewingFile({ name: "error", content: "Failed to load file", size: 0 });
    } finally {
      setFileLoading(false);
    }
  }

  if (loading) return null;
  if (artifacts.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          成果
        </span>
        {artifacts.map((f) => (
          <button
            key={f.path}
            onClick={(e) => {
              e.stopPropagation();
              openFile(f.path);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
          >
            <FileText size={12} className="text-blue-500" />
            {f.name}
            <span className="text-[10px] text-zinc-400">
              {f.size > 1024
                ? `${(f.size / 1024).toFixed(1)}K`
                : `${f.size}B`}
            </span>
          </button>
        ))}
      </div>

      {/* Full-screen markdown viewer overlay */}
      {(viewingFile || fileLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingFile(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <span className="font-mono text-sm font-medium">
                  {viewingFile?.name || "Loading..."}
                </span>
                {viewingFile && (
                  <span className="text-xs text-zinc-400">
                    ({(viewingFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
              {fileLoading ? (
                <p className="p-6 text-sm text-zinc-400">載入中...</p>
              ) : viewingFile ? (
                <div className="p-6">
                  <MarkdownContent content={viewingFile.content} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown-to-HTML rendering for reports
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  function flushTable() {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(2); // skip separator row
    elements.push(
      <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 dark:border-zinc-600">
              {headerRow.map((cell, ci) => (
                <th
                  key={ci}
                  className="px-3 py-1.5 text-left font-semibold text-zinc-600 dark:text-zinc-400"
                >
                  {cell.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300"
                  >
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line
        .split("|")
        .slice(1, -1);
      if (!inTable) inTable = true;
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="mb-3 mt-6 text-xl font-bold text-zinc-900 first:mt-0 dark:text-zinc-100"
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mb-2 mt-5 text-lg font-semibold text-zinc-800 dark:text-zinc-200"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="mb-1 mt-4 text-base font-semibold text-zinc-700 dark:text-zinc-300"
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("---")) {
      elements.push(
        <hr
          key={i}
          className="my-4 border-zinc-200 dark:border-zinc-700"
        />
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="my-2 border-l-4 border-blue-300 pl-4 text-sm italic text-zinc-600 dark:border-blue-700 dark:text-zinc-400"
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.startsWith("- [") || line.startsWith("  - [")) {
      const indent = line.startsWith("  ") ? "ml-4" : "";
      const checked = line.includes("[x]") || line.includes("[X]");
      const text = line.replace(/^[\s]*- \[.\]\s*/, "");
      elements.push(
        <div key={i} className={`flex items-start gap-2 py-0.5 text-sm ${indent}`}>
          <input type="checkbox" checked={checked} readOnly className="mt-0.5" />
          <span className="text-zinc-700 dark:text-zinc-300">{text}</span>
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("  - ")) {
      const indent = line.startsWith("  ") ? "ml-4" : "";
      const text = line.replace(/^[\s]*- /, "");
      elements.push(
        <div key={i} className={`py-0.5 text-sm ${indent}`}>
          <span className="mr-2 text-zinc-400">•</span>
          <span className="text-zinc-700 dark:text-zinc-300">{text}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else if (line.startsWith("_") && line.endsWith("_")) {
      elements.push(
        <p key={i} className="text-xs italic text-zinc-500">
          {line.slice(1, -1)}
        </p>
      );
    } else {
      elements.push(
        <p key={i} className="py-0.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {line}
        </p>
      );
    }
    i++;
  }
  if (inTable) flushTable();

  return <div>{elements}</div>;
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
                  agentLabel
                    ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    : ""
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
                  <td
                    colSpan={9}
                    className="bg-zinc-50/50 px-4 dark:bg-zinc-800/20"
                  >
                    <RunArtifacts
                      label={agentLabel}
                      startedAt={run.started_at}
                    />
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
