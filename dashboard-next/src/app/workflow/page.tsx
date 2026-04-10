"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";

// ── Types ────────────────────────────────────────────────────────────────────

interface SkillMeta {
  source: string;
  desc: string;
  installed: boolean;
}

interface CoreStep {
  num: number;
  label: string;
  desc: string;
  mandatory?: string[];
  optional?: string[];
}

interface CoreTrack {
  id: string;
  label: string;
  icon: string;
  steps: CoreStep[];
}

interface DomainStep {
  num: number;
  label: string;
  desc: string;
  skills: string[];
}

interface DomainFlow {
  id: string;
  label: string;
  icon: string;
  steps: DomainStep[];
}

interface Maintenance {
  trigger: string;
  skills: string[];
}

interface Situational {
  trigger: string;
  icon: string;
  skills: string[];
}

interface Orphan {
  skill: string;
  severity: string;
  reason: string;
}

interface WorkflowData {
  skillMeta: Record<string, SkillMeta>;
  tracks: CoreTrack[];
  maintenance: Maintenance[];
  domainFlows: DomainFlow[];
  situational: Situational[];
  orphaned: Orphan[];
  autoOrphaned: string[];
  stats: {
    totalSkills: number;
    mapped: number;
    unmapped: number;
    domainFlows: number;
    situational: number;
  };
}

// ── Chip Component ───────────────────────────────────────────────────────────

function SkillChip({
  name,
  meta,
  variant = "default",
  highlight,
}: {
  name: string;
  meta?: SkillMeta;
  variant?: "mandatory" | "optional" | "default";
  highlight?: boolean;
}) {
  const source = meta?.source ?? "local";
  const installed = meta?.installed ?? false;

  const baseClasses =
    "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono transition-all";

  const colorMap: Record<string, string> = {
    "local-mandatory":
      "bg-violet-500/15 text-violet-400 border border-violet-500/50",
    "local-optional":
      "bg-violet-500/7 text-violet-400 border border-violet-500/30 border-dashed",
    "local-default":
      "bg-violet-500/10 text-violet-400 border border-violet-500/40",
    "gstack-mandatory":
      "bg-teal-500/15 text-teal-400 border border-teal-500/50",
    "gstack-optional":
      "bg-teal-500/7 text-teal-400 border border-teal-500/30 border-dashed",
    "gstack-default":
      "bg-teal-500/10 text-teal-400 border border-teal-500/40",
  };

  const key = `${source}-${variant}`;
  const colorClass = colorMap[key] ?? colorMap["local-default"];
  const dimClass = !installed ? "opacity-40" : "";
  const highlightClass = highlight
    ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-zinc-900"
    : "";

  return (
    <span
      className={`${baseClasses} ${colorClass} ${dimClass} ${highlightClass}`}
      title={meta?.desc ?? name}
    >
      {name}
    </span>
  );
}

// ── Section Components ───────────────────────────────────────────────────────

function CoreFlowSection({
  track,
  skillMeta,
  search,
}: {
  track: CoreTrack;
  skillMeta: Record<string, SkillMeta>;
  search: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg">{track.icon}</span>
        <span className="font-semibold text-zinc-200">{track.label}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {track.steps.length} 步驟
        </span>
        <span
          className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
      </button>
      {open && (
        <div className="space-y-0 border-t border-zinc-800 px-4 py-2">
          {track.steps.map((step) => {
            const allSkills = [
              ...(step.mandatory ?? []),
              ...(step.optional ?? []),
            ];
            const matches =
              !search ||
              step.label.toLowerCase().includes(search) ||
              allSkills.some((s) => s.includes(search));

            return (
              <div
                key={step.num}
                className={`flex items-start gap-3 border-b border-zinc-800/50 py-2.5 last:border-0 ${matches ? "" : "opacity-10"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                  {step.num}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-zinc-300">
                      {step.label}
                    </span>
                    <span className="text-xs text-zinc-500">{step.desc}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(step.mandatory ?? []).map((s) => (
                      <SkillChip
                        key={s}
                        name={s}
                        meta={skillMeta[s]}
                        variant="mandatory"
                        highlight={!!search && s.includes(search)}
                      />
                    ))}
                    {(step.optional ?? []).map((s) => (
                      <SkillChip
                        key={s}
                        name={s}
                        meta={skillMeta[s]}
                        variant="optional"
                        highlight={!!search && s.includes(search)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DomainFlowSection({
  flow,
  skillMeta,
  search,
}: {
  flow: DomainFlow;
  skillMeta: Record<string, SkillMeta>;
  search: string;
}) {
  const [open, setOpen] = useState(false);
  const skillCount = flow.steps.reduce(
    (acc, s) => acc + s.skills.length,
    0
  );
  const hasMatch =
    !search ||
    flow.label.toLowerCase().includes(search) ||
    flow.steps.some(
      (s) =>
        s.label.toLowerCase().includes(search) ||
        s.skills.some((sk) => sk.includes(search))
    );

  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-900/50 ${hasMatch ? "" : "opacity-10"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg">{flow.icon}</span>
        <span className="font-semibold text-zinc-200">{flow.label}</span>
        <span className="ml-auto text-xs text-zinc-500">
          {flow.steps.length} 步驟 · {skillCount} skills
        </span>
        <span
          className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
      </button>
      {open && (
        <div className="space-y-0 border-t border-zinc-800 px-4 py-2">
          {flow.steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3 border-b border-zinc-800/50 py-2.5 last:border-0"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                {step.num}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-zinc-300">
                    {step.label}
                  </span>
                  <span className="text-xs text-zinc-500">{step.desc}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {step.skills.map((s) => (
                    <SkillChip
                      key={s}
                      name={s}
                      meta={skillMeta[s]}
                      highlight={!!search && s.includes(search)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const [data, setData] = useState<WorkflowData | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiFetch<WorkflowData>("/api/workflow").then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center text-zinc-500">
        Loading workflow map…
      </div>
    );
  }

  const q = search.toLowerCase().trim();

  return (
    <div className="space-y-8 p-6">
      {/* Header + Search */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workflow Map</h1>
          <p className="mt-1 text-sm text-zinc-500">
            每個 skill 在工作流程中的定位
          </p>
        </div>
        <input
          type="search"
          placeholder="搜尋 skill…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Stats */}
      <MetricsRow
        metrics={[
          { label: "已安裝 Skills", value: data.stats.totalSkills },
          { label: "已對應", value: data.stats.mapped },
          { label: "未對應", value: data.stats.unmapped },
          { label: "領域工作流", value: data.stats.domainFlows },
          { label: "情境觸發", value: data.stats.situational },
        ]}
      />

      {/* Core Flows */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          核心開發流程
        </h2>
        <div className="space-y-3">
          {data.tracks.map((t) => (
            <CoreFlowSection
              key={t.id}
              track={t}
              skillMeta={data.skillMeta}
              search={q}
            />
          ))}
        </div>
      </section>

      {/* Maintenance */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          例行維護觸發
        </h2>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
          {data.maintenance.map((m, i) => {
            const matches =
              !q ||
              m.trigger.toLowerCase().includes(q) ||
              m.skills.some((s) => s.includes(q));
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 ${matches ? "" : "opacity-10"}`}
              >
                <span className="min-w-[200px] text-sm text-zinc-400">
                  {m.trigger}
                </span>
                <div className="flex flex-wrap gap-1">
                  {m.skills.map((s) => (
                    <SkillChip
                      key={s}
                      name={s}
                      meta={data.skillMeta[s]}
                      highlight={!!q && s.includes(q)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Domain Flows */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          領域工作流程
          <span className="ml-2 text-sm font-normal text-zinc-500">
            ({data.domainFlows.length})
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {data.domainFlows.map((f) => (
            <DomainFlowSection
              key={f.id}
              flow={f}
              skillMeta={data.skillMeta}
              search={q}
            />
          ))}
        </div>
      </section>

      {/* Situational Triggers */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          情境觸發
          <span className="ml-2 text-sm font-normal text-zinc-500">
            ({data.situational.length})
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.situational.map((s, i) => {
            const matches =
              !q ||
              s.trigger.toLowerCase().includes(q) ||
              s.skills.some((sk) => sk.includes(q));
            return (
              <div
                key={i}
                className={`rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 ${matches ? "" : "opacity-10"}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm font-medium text-zinc-300">
                    {s.trigger}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {s.skills.map((sk) => (
                    <SkillChip
                      key={sk}
                      name={sk}
                      meta={data.skillMeta[sk]}
                      highlight={!!q && sk.includes(q)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Orphaned */}
      {(data.orphaned.length > 0 || data.autoOrphaned.length > 0) && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-300">
            孤兒 Skills
            <span className="ml-2 text-sm font-normal text-zinc-500">
              未對應到任何工作流程
            </span>
          </h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">
            {data.orphaned.map((o) => (
              <div key={o.skill} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-mono ${
                    o.severity === "red"
                      ? "bg-red-500/15 text-red-400 border border-red-500/50"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/50"
                  }`}
                >
                  {o.skill}
                </span>
                <span className="text-xs text-zinc-500">{o.reason}</span>
              </div>
            ))}
            {data.autoOrphaned.map((name) => (
              <div key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="inline-flex rounded bg-zinc-700/50 px-1.5 py-0.5 text-[11px] font-mono text-zinc-400 border border-zinc-600">
                  {name}
                </span>
                <span className="text-xs text-zinc-500">
                  已安裝但未出現在任何 flow 或 trigger 中
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
