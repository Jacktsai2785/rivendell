"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiFetch,
  apiPost,
  apiPut,
  apiDelete,
  type ProjectsData,
  type ProjectInfo,
} from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import { Pencil, Trash2, Plus, X, FolderOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

function ProjectCard({
  project,
  onRefresh,
}: {
  project: ProjectInfo;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(project.description);
  const [agentsStr, setAgentsStr] = useState(project.agents.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await apiPut(`/api/projects/${encodeURIComponent(project.name)}`, {
        description: desc,
        agents: agentsStr
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setEditing(false);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`確定刪除專案「${project.name}」？（不會影響 plist 檔案）`)) return;
    setBusy(true);
    try {
      await apiDelete(`/api/projects/${encodeURIComponent(project.name)}`);
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/projects/${encodeURIComponent(project.name)}`}
          className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <FolderOpen size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold">{project.name}</h3>
          <ChevronRight size={16} className="text-zinc-300" />
        </Link>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            project.agent_count_loaded > 0
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {project.agent_count_loaded}/{project.agents.length} running
        </span>
      </div>

      <p className="mt-1 font-mono text-xs text-zinc-400">{project.repo}</p>

      {editing ? (
        <div className="mt-3 space-y-2">
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm dark:border-zinc-700"
          />
          <input
            value={agentsStr}
            onChange={(e) => setAgentsStr(e.target.value)}
            placeholder="Agents（逗號分隔）"
            className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-1.5 text-sm font-mono dark:border-zinc-700"
          />
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={handleSave}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              儲存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {project.description || "（無描述）"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.agents.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                🤖 {name}
              </span>
            ))}
            {project.agents.length === 0 && (
              <span className="text-xs text-zinc-400">尚無 agent</span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Pencil size={14} /> 編輯
            </button>
            <button
              disabled={busy}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={14} /> 刪除
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function ProjectsPage() {
  const [data, setData] = useState<ProjectsData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // New project form
  const [newName, setNewName] = useState("");
  const [newRepo, setNewRepo] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAgents, setNewAgents] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    apiFetch<ProjectsData>("/api/projects")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(load, [load]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setErr(null);
    try {
      await apiPost("/api/projects", {
        name: newName.trim(),
        repo: newRepo.trim(),
        description: newDesc.trim(),
        agents: newAgents
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setNewName("");
      setNewRepo("");
      setNewDesc("");
      setNewAgents("");
      setShowForm(false);
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  if (err && !data) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const { projects } = data;
  const totalAgents = projects.reduce((s, p) => s + p.agents.length, 0);
  const totalCost = projects.reduce((s, p) => s + p.total_cost_usd, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">專案管理</h1>

      <MetricsRow
        metrics={[
          { label: "總專案", value: projects.length },
          { label: "總 Agent", value: totalAgents },
          { label: "總花費", value: `$${totalCost.toFixed(2)}` },
        ]}
      />

      {/* Add project button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "取消" : "新增專案"}
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20">
          <h2 className="mb-4 text-sm font-semibold">新增專案</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs text-zinc-500">專案名稱</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="my-project"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-500">Repo 路徑</span>
                <input
                  value={newRepo}
                  onChange={(e) => setNewRepo(e.target.value)}
                  placeholder="/Users/…/Projects/my-project"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-zinc-500">描述</span>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Project description…"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500">Agent（逗號分隔）</span>
              <input
                value={newAgents}
                onChange={(e) => setNewAgents(e.target.value)}
                placeholder="maintainer, tester"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <button
              disabled={creating || !newName.trim()}
              onClick={handleCreate}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              建立
            </button>
          </div>
          {err && <p className="mt-2 text-xs text-red-500">{err}</p>}
        </div>
      )}

      {/* Project cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard key={p.name} project={p} onRefresh={load} />
        ))}
        {projects.length === 0 && (
          <p className="text-sm text-zinc-500">
            尚無專案。點擊「新增專案」或編輯 <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">~/.claude/projects.json</code>
          </p>
        )}
      </div>
    </div>
  );
}
