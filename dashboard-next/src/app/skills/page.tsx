"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch, type SkillInfo, type SkillUsage } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import {
  Treemap,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Category colors ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  基礎建設: "#3b82f6",
  品質: "#10b981",
  工作流: "#f59e0b",
  整合: "#f97316",
  商業: "#6366f1",
  前端: "#ec4899",
  後端: "#06b6d4",
  文件: "#8b5cf6",
  Git: "#ef4444",
  人資: "#14b8a6",
};

const UNCATEGORIZED_COLOR = "#a1a1aa";

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || UNCATEGORIZED_COLOR;
}

// ── Lifecycle colors ─────────────────────────────────────────────────

const LIFECYCLE_COLORS: Record<string, string> = {
  manual: "#3b82f6",
  hook: "#f59e0b",
  agent: "#8b5cf6",
};

function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  const colors: Record<string, string> = {
    manual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    hook: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    agent:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    unknown:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[lifecycle] || colors.unknown}`}
    >
      {lifecycle}
    </span>
  );
}

// ── Treemap custom content ───────────────────────────────────────────

function TreemapContent(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
}) {
  const { x, y, width, height, name, color } = props;
  if (width < 40 || height < 20) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
        className="dark:stroke-zinc-900"
        style={{ opacity: 0.85 }}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={Math.min(12, width / 6)}
          fontWeight={600}
        >
          {name}
        </text>
      )}
    </g>
  );
}


export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillInfo[] | null>(null);
  const [usage, setUsage] = useState<SkillUsage>({});
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    apiFetch<SkillInfo[]>("/api/skills")
      .then(setSkills)
      .catch((e) => setErr(e.message));
    // Load usage in background — non-blocking
    apiFetch<SkillUsage>("/api/skills/usage")
      .then(setUsage)
      .catch(() => {});
  }, []);

  // ── Derived data ─────────────────────────────────────────────────

  const categories = useMemo(() => {
    if (!skills) return [];
    const cats = new Set(skills.map((s) => s.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [skills]);

  const filtered = useMemo(() => {
    if (!skills) return [];
    return skills.filter((s) => {
      if (filterCategory && s.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [skills, search, filterCategory]);

  // Group skills by category, 未分類 last
  const grouped = useMemo(() => {
    const map = new Map<string, SkillInfo[]>();
    for (const s of filtered) {
      const cat = s.category || "未分類";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "未分類") return 1;
      if (b === "未分類") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [filtered]);

  // Treemap data (all skills, not filtered)
  const treemapData = useMemo(() => {
    if (!skills) return [];
    const counts = new Map<string, number>();
    for (const s of skills) {
      const cat = s.category || "未分類";
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, size]) => ({
        name: `${name} (${size})`,
        size,
        color: categoryColor(name),
      }))
      .sort((a, b) => b.size - a.size);
  }, [skills]);

  // Lifecycle pie data
  const lifecycleData = useMemo(() => {
    if (!skills) return [];
    const counts = new Map<string, number>();
    for (const s of skills) {
      const lc = s.lifecycle || "unknown";
      counts.set(lc, (counts.get(lc) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [skills]);

  // Metrics
  const metrics = useMemo(() => {
    if (!skills) return null;
    const invocableCount = skills.filter((s) => s.invocable).length;
    const avgLines = Math.round(
      skills.reduce((sum, s) => sum + s.line_count, 0) / skills.length,
    );
    return {
      total: skills.length,
      categories: categories.length + (skills.some((s) => !s.category) ? 1 : 0),
      invocableRate: `${Math.round((invocableCount / skills.length) * 100)}%`,
      avgLines,
    };
  }, [skills, categories]);

  // ── Render ───────────────────────────────────────────────────────

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!skills || !metrics)
    return <p className="text-zinc-400">載入中...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Skill 總覽</h1>

      {/* Metrics row */}
      <MetricsRow
        metrics={[
          { label: "總數", value: metrics.total },
          { label: "分類", value: metrics.categories },
          { label: "可呼叫", value: metrics.invocableRate },
          { label: "平均行數", value: metrics.avgLines },
        ]}
      />

      {/* Charts row */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {/* Treemap */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">Category Map</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                content={<TreemapContent x={0} y={0} width={0} height={0} name="" color="" />}
              />
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut pie */}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">Lifecycle 分佈</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lifecycleData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="45%"
                  outerRadius="75%"
                  paddingAngle={3}
                  label={({ name, value }: { name?: string; value?: number }) =>
                    `${name ?? ""} (${value ?? 0})`
                  }
                >
                  {lifecycleData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={LIFECYCLE_COLORS[entry.name] || "#a1a1aa"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="搜尋 skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">全部分類</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped skill cards */}
      <div className="mt-6 space-y-6">
        {grouped.map(([category, catSkills]) => (
          <section key={category}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: categoryColor(category) }}
              />
              {category}
              <span className="text-sm font-normal text-zinc-500">
                ({catSkills.length})
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catSkills.map((skill) => {
                const skillUsage = usage[skill.name] ?? [];
                const uses30 = skillUsage.reduce((s, d) => s + d.count, 0);
                return (
                  <Link
                    key={skill.name}
                    href={`/skills/${encodeURIComponent(skill.name)}`}
                    className="rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: categoryColor(category),
                    }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold">{skill.name}</h3>
                        <LifecycleBadge lifecycle={skill.lifecycle} />
                      </div>
                      {skill.summary && (
                        <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                          {skill.summary}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                        <span>{skill.line_count} lines</span>
                        {uses30 > 0 && (
                          <span className="text-blue-500">{uses30}× / 30d</span>
                        )}
                        {skill.invocable && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            invocable
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">沒有符合條件的 skill</p>
      )}
    </div>
  );
}
