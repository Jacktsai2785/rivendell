"use client";

import { useEffect, useState } from "react";
import { apiFetch, type FilteredTokensData } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TokensPage() {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [data, setData] = useState<FilteredTokensData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateStart) params.set("date_start", dateStart);
    if (dateEnd) params.set("date_end", dateEnd);
    const qs = params.toString();
    apiFetch<FilteredTokensData>(`/api/tokens/filtered${qs ? `?${qs}` : ""}`)
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [dateStart, dateEnd]);

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Token 用量</h1>

      {/* Date filter */}
      <div className="mb-6 flex items-center gap-3 text-sm">
        <label>
          從{" "}
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label>
          到{" "}
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        {(dateStart || dateEnd) && (
          <button
            onClick={() => {
              setDateStart("");
              setDateEnd("");
            }}
            className="text-xs text-blue-500 hover:underline"
          >
            清除
          </button>
        )}
      </div>

      <MetricsRow
        metrics={[
          { label: "總 Session", value: data.total_sessions.toLocaleString() },
          { label: "總 Messages", value: data.total_messages.toLocaleString() },
          { label: "總 Tokens", value: data.total_tokens.toLocaleString() },
          { label: "估算花費", value: `$${data.total_cost_usd.toFixed(2)}` },
        ]}
      />

      {/* Daily usage chart */}
      {data.daily.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold">每日 Token 用量</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => Number(value).toLocaleString()}
                />
                <Bar dataKey="tokens_total" fill="#3b82f6" name="Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Daily cost chart */}
      {data.daily.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold">每日花費</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => `$${Number(value).toFixed(4)}`}
                />
                <Bar dataKey="cost_usd" fill="#10b981" name="Cost (USD)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Model breakdown */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">模型用量</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
                <th className="px-4 py-2 font-medium">Model</th>
                <th className="px-4 py-2 font-medium text-right">Input</th>
                <th className="px-4 py-2 font-medium text-right">Output</th>
                <th className="px-4 py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => (
                <tr
                  key={m.model}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2 font-mono text-xs">{m.model}</td>
                  <td className="px-4 py-2 text-right">
                    {m.input_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {m.output_tokens.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${m.cost_usd.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Project breakdown */}
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">專案用量</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700">
                <th className="px-4 py-2 font-medium">Project</th>
                <th className="px-4 py-2 font-medium text-right">Sessions</th>
                <th className="px-4 py-2 font-medium text-right">Messages</th>
                <th className="px-4 py-2 font-medium text-right">Tokens</th>
                <th className="px-4 py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr
                  key={p.project}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-2 font-medium">{p.project}</td>
                  <td className="px-4 py-2 text-right">{p.sessions}</td>
                  <td className="px-4 py-2 text-right">
                    {p.messages.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.tokens_total.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${p.cost_usd.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
