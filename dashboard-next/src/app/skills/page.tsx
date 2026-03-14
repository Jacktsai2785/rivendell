"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, type SkillInfo } from "@/lib/api";

function LifecycleBadge({ lifecycle }: { lifecycle: string }) {
  const colors: Record<string, string> = {
    manual: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    hook: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    unknown: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[lifecycle] || colors.unknown}`}
    >
      {lifecycle}
    </span>
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillInfo[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    apiFetch<SkillInfo[]>("/api/skills")
      .then(setSkills)
      .catch((e) => setErr(e.message));
  }, []);

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

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!skills) return <p className="text-zinc-400">載入中...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        Skill 總覽{" "}
        <span className="text-base font-normal text-zinc-500">
          ({skills.length})
        </span>
      </h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
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

      {/* Skills grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <div
            key={skill.name}
            className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{skill.name}</h3>
              <LifecycleBadge lifecycle={skill.lifecycle} />
            </div>
            {skill.category && (
              <p className="mt-1 text-xs text-zinc-500">{skill.category}</p>
            )}
            {skill.summary && (
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {skill.summary}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
              <span>{skill.line_count} lines</span>
              {skill.invocable && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  invocable
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">沒有符合條件的 skill</p>
      )}
    </div>
  );
}
