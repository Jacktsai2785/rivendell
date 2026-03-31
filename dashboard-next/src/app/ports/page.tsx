"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, type PortInfo, type PortsData } from "@/lib/api";
import { ExternalLink, Folder, MinusCircle, RefreshCw } from "lucide-react";

const TABS = ["全部", "前端", "後端", "資料庫"] as const;
type Tab = (typeof TABS)[number];

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeChip({ type }: { type: PortInfo["type"] }) {
  const styles: Record<string, string> = {
    API:      "text-blue-400 bg-blue-950/40 border-blue-800/40",
    Frontend: "text-violet-400 bg-violet-950/40 border-violet-800/40",
    Streamlit:"text-orange-400 bg-orange-950/40 border-orange-800/40",
    DB:       "text-zinc-400 bg-zinc-800/60 border-zinc-700/60",
    Cache:    "text-zinc-400 bg-zinc-800/60 border-zinc-700/60",
    Service:  "text-zinc-400 bg-zinc-800/60 border-zinc-700/60",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono border ${styles[type] ?? styles.Service}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: PortInfo["status"] }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "#16a34a22", color: "#4ade80", border: "1px solid #16a34a55" }}>
        <span className="relative flex w-2 h-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
        </span>
        live
      </span>
    );
  }
  if (status === "stopped") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "#3f3f4622", color: "#a1a1aa", border: "1px solid #52525b55" }}>
        <span className="inline-flex rounded-full w-2 h-2 bg-zinc-500" />
        stopped
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ background: "#ca8a0422", color: "#fbbf24", border: "1px solid #ca8a0455" }}>
      <span className="inline-flex rounded-full w-2 h-2 bg-yellow-400" />
      unknown
    </span>
  );
}

function PortRow({ port }: { port: PortInfo }) {
  const clickable = port.web && port.status !== "unknown";
  const Wrapper = clickable ? "a" : "tr";
  const props = clickable
    ? { href: `http://localhost:${port.port}`, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <tr
      className={clickable ? "cursor-pointer hover:bg-zinc-800/30 transition-colors" : undefined}
      onClick={clickable ? () => window.open(`http://localhost:${port.port}`, "_blank") : undefined}
    >
      <td className="px-4 py-3 font-mono text-sm font-semibold text-zinc-200">{port.port}</td>
      <td className="px-4 py-3 text-sm text-zinc-300">{port.service}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{port.container}</td>
      <td className="px-4 py-3"><TypeChip type={port.type} /></td>
      <td className="px-4 py-3"><StatusBadge status={port.status} /></td>
      <td className="px-4 py-2">
        {port.web ? (
          <a
            href={`http://localhost:${port.port}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`開啟 localhost:${port.port}`}
            className="flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700/60 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="flex items-center justify-center w-7 h-7 text-zinc-700" title="非 HTTP 服務">
            <MinusCircle size={14} />
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PortsPage() {
  const [data, setData] = useState<PortsData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("全部");

  const load = useCallback((showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    apiFetch<PortsData>("/api/ports")
      .then((d) => { setData(d); setErr(null); })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return activeTab === "全部" ? data.ports : data.ports.filter((p) => p.category === activeTab);
  }, [data, activeTab]);

  const grouped = useMemo(() => {
    const map = new Map<string, PortInfo[]>();
    for (const p of filtered) {
      if (!map.has(p.project)) map.set(p.project, []);
      map.get(p.project)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const liveCount = filtered.filter((p) => p.status === "live").length;
  const stoppedCount = filtered.filter((p) => p.status === "stopped").length;

  if (err && !data) {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        無法載入 Port 資料 — {err}
      </div>
    );
  }

  if (!data) return <p className="text-zinc-400">載入中...</p>;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Port 對應</h1>
          <p className="mt-0.5 text-sm text-zinc-500">所有 Docker 服務的 host port 對應一覽</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {liveCount} live
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />
              {stoppedCount} stopped
            </span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-4">
        {TABS.map((tab) => {
          const count =
            tab === "全部"
              ? data.ports.length
              : data.ports.filter((p) => p.category === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-zinc-100 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
              }`}
            >
              {tab}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  isActive ? "bg-zinc-700 text-zinc-300" : "bg-zinc-800/60 text-zinc-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/30">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-24">Port</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">服務</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Container</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-24">類型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 w-28">狀態</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {grouped.map(([project, ports], gi) => (
              <>
                <tr
                  key={`hdr-${project}`}
                  className={gi > 0 ? "border-t-2 border-zinc-300/30 dark:border-zinc-700/60" : ""}
                >
                  <td colSpan={6} className="px-4 py-2 bg-zinc-100/60 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-2">
                      <Folder size={14} className="text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{project}</span>
                      <span className="text-[10px] text-zinc-500">
                        {ports.length} port{ports.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>
                </tr>
                {ports.map((port) => (
                  <PortRow key={port.port} port={port} />
                ))}
              </>
            ))}
            {grouped.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                  無符合條件的 port
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-600">
        資料源：<code className="font-mono text-zinc-500">docker-compose.yml</code> · 狀態：port
        reachability check via dashboard-api
      </p>
    </div>
  );
}
