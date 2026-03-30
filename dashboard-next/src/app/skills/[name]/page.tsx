"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, type SkillDetail, type SkillUsage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChevronLeft, Zap } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────

const LIFECYCLE_COLORS: Record<string, string> = {
  manual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  hook: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  unknown: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${LIFECYCLE_COLORS[lifecycle] ?? LIFECYCLE_COLORS.unknown}`}
    >
      {lifecycle}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function SkillDetailPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);

  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [usageDays, setUsageDays] = useState<{ date: string; count: number }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<SkillDetail>(`/api/skills/${encodeURIComponent(name)}`),
      apiFetch<SkillUsage>("/api/skills/usage"),
    ])
      .then(([d, usage]) => {
        setDetail(d);
        setUsageDays(usage[name] ?? []);
      })
      .catch((e: Error) => setErr(e.message));
  }, [name]);

  // Generate last 30 days with zeros for missing dates
  const chartData = useMemo(() => {
    const today = new Date();
    const map: Record<string, number> = {};
    for (const u of usageDays) map[u.date] = u.count;
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (29 - i));
      const iso = d.toISOString().slice(0, 10);
      return { date: iso.slice(5), count: map[iso] ?? 0 };
    });
  }, [usageDays]);

  const total7 = useMemo(
    () => chartData.slice(-7).reduce((s, d) => s + d.count, 0),
    [chartData],
  );
  const total30 = useMemo(
    () => chartData.reduce((s, d) => s + d.count, 0),
    [chartData],
  );
  const totalAll = useMemo(
    () => usageDays.reduce((s, d) => s + d.count, 0),
    [usageDays],
  );

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!detail) return <p className="text-zinc-400">載入中...</p>;

  const body = detail.content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/skills"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        <ChevronLeft size={16} />
        Skills
      </Link>

      {/* Header */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{name}</h1>
        {detail.lifecycle && <LifecycleBadge lifecycle={detail.lifecycle} />}
        {detail.category && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {detail.category}
          </span>
        )}
        {detail.invocable && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <Zap size={10} />
            invocable
          </span>
        )}
      </div>
      {detail.summary && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {detail.summary}
        </p>
      )}

      {/* Usage metrics */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "最近 7 天", value: total7 },
          { label: "最近 30 天", value: total30 },
          { label: "累計全部", value: totalAll },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Time series chart */}
      <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">呼叫次數（近 30 天）</h2>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 2, right: 4, left: -24, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                interval={4}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9 }}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v) => [v, "呼叫次數"]}
                labelFormatter={(l) => `日期：${l}`}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.count > 0 ? "#3b82f6" : "#e4e4e7"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SKILL.md content */}
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          SKILL.md
        </p>
        <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-pre:bg-zinc-100 prose-pre:text-xs dark:prose-pre:bg-zinc-800">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
