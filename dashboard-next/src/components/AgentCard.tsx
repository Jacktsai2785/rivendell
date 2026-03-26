"use client";

import { useState, useEffect, useRef } from "react";
import type { AgentInfo, AgentRun } from "@/lib/api";
import { apiFetch, apiPost } from "@/lib/api";
import RunHistory from "./RunHistory";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  Download,
  RefreshCw,
  Shield,
  ExternalLink,
  Loader2,
} from "lucide-react";

function StatusBadge({ agent }: { agent: AgentInfo }) {
  if (!agent.installed) return <span className="text-zinc-400">⚪ 未安裝</span>;
  if (agent.pid !== null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-600">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        執行中
      </span>
    );
  }
  if (agent.exit_code !== null && agent.exit_code !== 0)
    return <span className="text-red-500">🔴 Exit {agent.exit_code}</span>;
  if (agent.loaded) return <span className="text-green-600">🟢 已載入</span>;
  return <span className="text-red-500">🔴 未載入</span>;
}

function ActivityIndicator({ activity }: { activity: AgentInfo["current_activity"] }) {
  if (!activity) return null;
  return (
    <div className="mt-2 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs dark:bg-blue-900/20">
      <Loader2 size={14} className="animate-spin text-blue-500" />
      <span className="font-medium text-blue-700 dark:text-blue-400">{activity.label}</span>
      {activity.detail && (
        <span className="min-w-0 truncate font-mono text-blue-600/70 dark:text-blue-400/60">
          {activity.detail}
        </span>
      )}
    </div>
  );
}

export default function AgentCard({
  agent,
  onRefresh,
}: {
  agent: AgentInfo;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [runs, setRuns] = useState<AgentRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [justStarted, setJustStarted] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-poll after starting an agent until it appears as running or finishes
  useEffect(() => {
    if (justStarted) {
      pollRef.current = setInterval(() => {
        onRefresh();
      }, 2000);
      // Stop polling after 60s max
      const timeout = setTimeout(() => {
        setJustStarted(false);
      }, 60000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        clearTimeout(timeout);
      };
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [justStarted, onRefresh]);

  // Clear justStarted once agent is detected as running
  useEffect(() => {
    if (justStarted && agent.pid !== null) {
      setJustStarted(false);
      setToast(null);
    }
  }, [justStarted, agent.pid]);

  async function action(path: string, body: Record<string, unknown>, successMsg?: string) {
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      await apiPost(path, body);
      if (successMsg) {
        setToast(successMsg);
        setTimeout(() => setToast(null), 5000);
      }
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleStart() {
    setBusy(true);
    setError(null);
    setToast(null);
    try {
      await apiPost("/api/agents/start", { label: agent.label });
      setToast("已觸發，等待啟動中...");
      setJustStarted(true);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function loadRuns() {
    if (runs !== null) {
      setShowHistory(!showHistory);
      return;
    }
    try {
      const data = await apiFetch<AgentRun[]>(
        `/api/agents/${encodeURIComponent(agent.label)}/runs`
      );
      setRuns(data);
      setShowHistory(true);
    } catch {
      setRuns([]);
      setShowHistory(true);
    }
  }

  const isRunning = agent.pid !== null;

  return (
    <div className={`rounded-lg border p-5 ${
      isRunning
        ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    }`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/agents/${encodeURIComponent(agent.label)}`}
            className="text-base font-semibold hover:text-blue-600 dark:hover:text-blue-400"
          >
            {agent.project}/{agent.name}
            <ExternalLink size={14} className="ml-1.5 inline" />
          </Link>
          <p className="text-xs text-zinc-500">{agent.role_badge}</p>
          {agent.description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{agent.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <StatusBadge agent={agent} />
          <span className="text-zinc-500">排程：{agent.schedule_display}</span>
        </div>
      </div>

      {/* Activity indicator — shown when running */}
      {isRunning && <ActivityIndicator activity={agent.current_activity} />}

      {/* Starting indicator — shown after click before PID appears */}
      {justStarted && !isRunning && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs dark:bg-amber-900/20">
          <Loader2 size={14} className="animate-spin text-amber-500" />
          <span className="text-amber-700 dark:text-amber-400">已觸發，等待啟動中...</span>
        </div>
      )}

      {/* Tags row */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {agent.merge_strategy_display !== "—" && (
          <span>
            Merge: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{agent.merge_strategy_display}</code>
          </span>
        )}
        <span>
          QA: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">{agent.qa_display}</code>
        </span>
        {agent.recent_commit && (
          <span className="text-zinc-500">
            最近 commit: <code className="text-xs">{agent.recent_commit.sha}</code>{" "}
            {agent.recent_commit.message}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {!agent.installed && (
          <button
            disabled={busy}
            onClick={() => action("/api/agents/install", { plist_path: agent.plist_path })}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={14} /> 安裝
          </button>
        )}
        {agent.installed && !agent.loaded && (
          <button
            disabled={busy}
            onClick={() => action("/api/agents/load", { label: agent.label })}
            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Play size={14} /> 啟動
          </button>
        )}
        {agent.installed && agent.loaded && (
          <button
            disabled={busy}
            onClick={() => action("/api/agents/unload", { label: agent.label })}
            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Square size={14} /> 停止
          </button>
        )}
        {agent.installed && (
          <button
            disabled={busy || isRunning}
            onClick={handleStart}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isRunning ? "執行中..." : "立即執行"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
      {toast && !justStarted && (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400">{toast}</p>
      )}

      {/* Collapsible sections */}
      <div className="mt-4 flex gap-3 text-xs">
        {agent.git_safety && (
          <button
            onClick={() => setShowSafety(!showSafety)}
            className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <Shield size={14} />
            {showSafety ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Git 安全設定
          </button>
        )}
        <button
          onClick={loadRuns}
          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          執行歷史
        </button>
      </div>

      {showSafety && agent.git_safety && (
        <div className="mt-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
          {agent.git_safety.allowed_paths.length > 0 && (
            <p>
              <strong>Allowed paths:</strong>{" "}
              {agent.git_safety.allowed_paths.map((p) => (
                <code key={p} className="mr-1 rounded bg-zinc-200 px-1 dark:bg-zinc-700">{p}</code>
              ))}
            </p>
          )}
          {agent.git_safety.forbidden_paths.length > 0 && (
            <p className="mt-1">
              <strong>Forbidden paths:</strong>{" "}
              {agent.git_safety.forbidden_paths.map((p) => (
                <code key={p} className="mr-1 rounded bg-zinc-200 px-1 dark:bg-zinc-700">{p}</code>
              ))}
            </p>
          )}
          {agent.git_safety.max_files_changed > 0 && (
            <p className="mt-1">
              <strong>Max files:</strong> {agent.git_safety.max_files_changed}
            </p>
          )}
        </div>
      )}

      {showHistory && <RunHistory runs={runs || []} />}
    </div>
  );
}
