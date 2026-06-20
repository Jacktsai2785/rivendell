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

interface StageField {
  name: string;
  desc: string;
}

interface StageBranch {
  stage: string;
  mode: string;
  desc: string;
  skills: string[];
  enters: boolean;
  fields?: StageField[];
}

interface StageRouter {
  title: string;
  subtitle: string;
  branches: StageBranch[];
}

interface WorkflowData {
  skillMeta: Record<string, SkillMeta>;
  stageRouter?: StageRouter;
  tracks: CoreTrack[];
  maintenance: Maintenance[];
  domainFlows: DomainFlow[];
  situational: Situational[];
  orphaned: Orphan[];
  autoOrphaned: AutoOrphan[];
  stats: {
    totalSkills: number;
    mapped: number;
    unmapped: number;
    domainFlows: number;
    situational: number;
    bySource: Record<string, number>;
    unmappedBySource: Record<string, number>;
  };
}

interface AutoOrphan {
  name: string;
  source: string;
}

// ── Source styling (origin repo, auto-derived server-side) ───────────────────

const SOURCE_ORDER = ["rivendell", "skill-lab", "gstack", "local"] as const;

const SOURCE_LABEL: Record<string, string> = {
  rivendell: "rivendell",
  "skill-lab": "skill-lab",
  gstack: "gstack",
  local: "local（無 repo）",
};

const SOURCE_CHIP: Record<string, Record<string, string>> = {
  rivendell: {
    mandatory: "bg-violet-500/15 text-violet-400 border border-violet-500/50",
    optional: "bg-violet-500/7 text-violet-400 border border-violet-500/30 border-dashed",
    default: "bg-violet-500/10 text-violet-400 border border-violet-500/40",
  },
  "skill-lab": {
    mandatory: "bg-sky-500/15 text-sky-400 border border-sky-500/50",
    optional: "bg-sky-500/7 text-sky-400 border border-sky-500/30 border-dashed",
    default: "bg-sky-500/10 text-sky-400 border border-sky-500/40",
  },
  gstack: {
    mandatory: "bg-teal-500/15 text-teal-400 border border-teal-500/50",
    optional: "bg-teal-500/7 text-teal-400 border border-teal-500/30 border-dashed",
    default: "bg-teal-500/10 text-teal-400 border border-teal-500/40",
  },
  local: {
    mandatory: "bg-amber-500/15 text-amber-400 border border-amber-500/50",
    optional: "bg-amber-500/7 text-amber-400 border border-amber-500/30 border-dashed",
    default: "bg-amber-500/10 text-amber-400 border border-amber-500/40",
  },
};

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

  // Color by origin repo (auto-derived server-side):
  // rivendell = violet · skill-lab = sky · gstack = teal · local(無 repo) = amber
  const colorClass = SOURCE_CHIP[source]?.[variant] ?? SOURCE_CHIP.rivendell.default;
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

function StageRouterSection({
  router,
  skillMeta,
  search,
}: {
  router: StageRouter;
  skillMeta: Record<string, SkillMeta>;
  search: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-lg">🧭</span>
        <span className="font-semibold text-zinc-200">{router.title}</span>
        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
          前置 gate · 進入下方 track 前
        </span>
        <span className="ml-auto text-xs text-zinc-500">
          {router.branches.length} 階段
        </span>
        <span
          className={`text-zinc-500 transition-transform ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            {router.subtitle}
          </p>
          <div className="space-y-1.5">
            {router.branches.map((b) => {
              const matches =
                !search ||
                b.stage.includes(search) ||
                b.mode.toLowerCase().includes(search) ||
                b.skills.some((s) => s.includes(search));

              return (
                <div
                  key={b.stage}
                  className={`flex items-start gap-3 rounded-md px-3 py-2 ${
                    b.enters
                      ? "border border-violet-500/40 bg-violet-500/10"
                      : "bg-zinc-800/40"
                  } ${matches ? "" : "opacity-10"}`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-6 shrink-0 items-center justify-center rounded px-2 text-[11px] font-semibold ${
                      b.enters
                        ? "bg-violet-500/30 text-violet-200"
                        : "bg-zinc-700 text-zinc-300"
                    }`}
                  >
                    {b.stage}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      {b.fields && b.fields.length > 0 ? (
                        <span className="group relative cursor-help whitespace-nowrap border-b border-dotted border-violet-400/60 text-xs font-medium text-zinc-300">
                          {b.mode}
                          <span className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 hidden w-max min-w-[13rem] whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-left normal-case shadow-xl group-hover:block">
                            <span className="mb-2 block text-[11px] font-semibold text-violet-300">
                              五欄位 brief — 逐欄要問什麼
                            </span>
                            {b.fields.map((f, i) => (
                              <span key={f.name} className="mb-2 block last:mb-0">
                                <span className="text-[11px] font-semibold text-zinc-200">
                                  {i + 1}. {f.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-400">
                                  {f.desc}
                                </span>
                              </span>
                            ))}
                            <span className="mt-2 block border-t border-zinc-800 pt-2 text-[10px] leading-relaxed text-zinc-500">
                              這份 brief 即下方 1–10 步的輸入 spec。
                            </span>
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-300">
                          {b.mode}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500">{b.desc}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {b.skills.map((s) => (
                        <SkillChip
                          key={s}
                          name={s}
                          meta={skillMeta[s]}
                          variant="optional"
                          highlight={!!search && s.includes(search)}
                        />
                      ))}
                      {b.enters && (
                        <span className="ml-1 text-[11px] font-medium text-violet-400">
                          ↓ 進入下方 track
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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

      {/* Source distribution (auto-derived from how each skill is installed) */}
      {data.stats.bySource && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="text-zinc-400">來源分佈：</span>
          {SOURCE_ORDER.map((src) => (
            <span
              key={src}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 ${SOURCE_CHIP[src].default}`}
            >
              {SOURCE_LABEL[src]}
              <span className="font-semibold">{data.stats.bySource[src] ?? 0}</span>
              {(data.stats.unmappedBySource?.[src] ?? 0) > 0 && (
                <span className="text-zinc-500">
                  · 未對應 {data.stats.unmappedBySource[src]}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Core Flows */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          核心開發流程
        </h2>
        <div className="space-y-3">
          {data.stageRouter && (
            <StageRouterSection
              router={data.stageRouter}
              skillMeta={data.skillMeta}
              search={q}
            />
          )}
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
            {SOURCE_ORDER.map((src) => {
              const items = data.autoOrphaned.filter((o) => o.source === src);
              if (items.length === 0) return null;
              return (
                <div key={src} className="px-4 py-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] ${SOURCE_CHIP[src].default}`}
                    >
                      {SOURCE_LABEL[src]}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {items.length} 個已安裝但尚未歸入任何 flow / trigger
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((o) => (
                      <span
                        key={o.name}
                        className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-mono ${SOURCE_CHIP[src].optional}`}
                      >
                        {o.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
