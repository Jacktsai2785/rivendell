"use client";

import { useEffect, useState } from "react";
import { apiFetch, type IssuesData, type IssueItem } from "@/lib/api";
import {
  AlertTriangle,
  XCircle,
  Bot,
  FileText,
  Sparkles,
  FileKey,
} from "lucide-react";

const sourceIcon: Record<string, typeof Bot> = {
  agent: Bot,
  learnings: FileText,
  skill: Sparkles,
  env: FileKey,
};

const sourceLabel: Record<string, string> = {
  agent: "Agent",
  learnings: "Learnings",
  skill: "Skill",
  env: "Env",
};

function IssueBadge({ severity }: { severity: string }) {
  if (severity === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
        <XCircle size={12} />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      <AlertTriangle size={12} />
      Warning
    </span>
  );
}

function IssueRow({ issue }: { issue: IssueItem }) {
  const Icon = sourceIcon[issue.source] || FileText;
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="py-2.5 px-4">
        <IssueBadge severity={issue.severity} />
      </td>
      <td className="py-2.5 px-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <Icon size={13} />
          {sourceLabel[issue.source] || issue.source}
        </span>
      </td>
      <td className="py-2.5 px-4 font-medium text-sm">{issue.title}</td>
      <td className="py-2.5 px-4 text-xs text-zinc-500">{issue.detail}</td>
    </tr>
  );
}

export default function PendingIssues() {
  const [data, setData] = useState<IssuesData | null>(null);

  useEffect(() => {
    apiFetch<IssuesData>("/api/issues")
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.total === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold">Pending Issues</h2>
        <div className="flex gap-2">
          {data.errors > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <XCircle size={12} />
              {data.errors}
            </span>
          )}
          {data.warnings > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle size={12} />
              {data.warnings}
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 w-24">
                嚴重度
              </th>
              <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 w-24">
                來源
              </th>
              <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500">
                問題
              </th>
              <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500">
                詳情
              </th>
            </tr>
          </thead>
          <tbody>
            {data.issues.map((issue, i) => (
              <IssueRow key={`${issue.source}-${issue.label}-${i}`} issue={issue} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
