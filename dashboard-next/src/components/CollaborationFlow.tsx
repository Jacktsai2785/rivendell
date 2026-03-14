"use client";

import { useEffect, useState } from "react";
import { apiFetch, type CollaborationData } from "@/lib/api";

export default function CollaborationFlow() {
  const [data, setData] = useState<CollaborationData | null>(null);

  useEffect(() => {
    apiFetch<CollaborationData>("/api/collaboration").then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  if (!data.found) {
    return (
      <div className="mt-6">
        <h2 className="text-base font-semibold">Agent 協作流</h2>
        <p className="mt-2 text-sm text-zinc-500">
          尚無 .learnings/ERRORS.md 資料。Agent 執行後會自動產生。
        </p>
        <pre className="mt-2 rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
{`tester 發現 bug → .learnings/ERRORS.md → maintainer 修復 → resolved`}
        </pre>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold">Agent 協作流</h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">Pending 問題</p>
          <p className="text-xl font-semibold">{data.pending}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">已解決</p>
          <p className="text-xl font-semibold">{data.resolved}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">解決率</p>
          <p className="text-xl font-semibold">{data.resolution_rate}%</p>
        </div>
      </div>
      <pre className="mt-3 rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
{`tester 發現 bug (${data.pending} pending)
      ↓
.learnings/ERRORS.md
      ↓
maintainer 修復 (${data.resolved} resolved)`}
      </pre>
    </div>
  );
}
