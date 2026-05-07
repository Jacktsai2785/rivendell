"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import SkillChip from "@/components/SkillChip";
import TrackRow, { type TrackData } from "@/components/workflow/TrackRow";
import CrossReferencePanel from "@/components/workflow/CrossReferencePanel";

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

// ── Cross-reference resolver ─────────────────────────────────────────────────

function resolveReferences(skill: string | null, tracks: CoreTrack[]) {
  if (!skill) return [];
  const refs: { trackLabel: string; stepNum: number; role: "mandatory" | "optional" }[] = [];
  for (const t of tracks) {
    for (const s of t.steps) {
      if ((s.mandatory ?? []).includes(skill)) {
        refs.push({ trackLabel: t.label, stepNum: s.num, role: "mandatory" });
      } else if ((s.optional ?? []).includes(skill)) {
        refs.push({ trackLabel: t.label, stepNum: s.num, role: "optional" });
      }
    }
  }
  return refs;
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div
        style={{ height: 32, width: 240, background: "var(--surface-2)", borderRadius: 4 }}
      />
      <div className="flex gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              width: 140,
              background: "var(--surface-2)",
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 160,
              background: "var(--surface-2)",
              borderRadius: "var(--radius-md)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function WorkflowPage() {
  const [data, setData] = useState<WorkflowData | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WorkflowData>("/api/workflow").then(setData);
  }, []);

  const references = useMemo(
    () => resolveReferences(selectedSkill, data?.tracks ?? []),
    [selectedSkill, data]
  );

  if (!data) return <LoadingSkeleton />;

  const q = search.toLowerCase().trim();

  return (
    <div
      className="flex"
      style={{
        background: "var(--bg)",
        minHeight: "calc(100vh - 0px)",
      }}
    >
      {/* Main canvas */}
      <div className="flex-1 min-w-0 p-6 space-y-8">
        {/* Header + Search */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              Workflow Map
            </h1>
            <p
              className="mt-1"
              style={{ color: "var(--text-muted)", fontSize: 14 }}
            >
              每個 skill 在工作流程中的定位 · click any chip to cross-reference
            </p>
          </div>
          <input
            type="search"
            placeholder="search skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-3 py-2 text-sm focus:outline-none"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
            }}
          />
        </div>

        <MetricsRow
          metrics={[
            { label: "已安裝 Skills", value: data.stats.totalSkills },
            { label: "已對應", value: data.stats.mapped },
            { label: "未對應", value: data.stats.unmapped },
            { label: "領域工作流", value: data.stats.domainFlows },
            { label: "情境觸發", value: data.stats.situational },
          ]}
        />

        {/* Core flows · horizontal tree per track */}
        <section>
          <h2
            className="mb-4"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            核心開發流程
          </h2>
          <div className="overflow-x-auto pb-2">
            {data.tracks.map((t) => (
              <TrackRow
                key={t.id}
                track={t as TrackData}
                selectedSkill={selectedSkill}
                onSkillClick={setSelectedSkill}
              />
            ))}
          </div>
        </section>

        {/* Maintenance — token swap, structure preserved */}
        <section>
          <h2
            className="mb-3"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            例行維護觸發
          </h2>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {data.maintenance.map((m, i) => {
              const matches =
                !q ||
                m.trigger.toLowerCase().includes(q) ||
                m.skills.some((s) => s.includes(q));
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    opacity: matches ? 1 : 0.2,
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <span
                    className="min-w-[200px] text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {m.trigger}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {m.skills.map((s) => (
                      <SkillChip key={s} name={s} asLink={false} onClick={setSelectedSkill} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Domain flows — token swap */}
        <section>
          <h2
            className="mb-3"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            領域工作流程{" "}
            <span
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              ({data.domainFlows.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.domainFlows.map((f) => {
              const skillCount = f.steps.reduce(
                (acc, s) => acc + s.skills.length,
                0
              );
              const hasMatch =
                !q ||
                f.label.toLowerCase().includes(q) ||
                f.steps.some(
                  (s) =>
                    s.label.toLowerCase().includes(q) ||
                    s.skills.some((sk) => sk.includes(q))
                );
              return (
                <details
                  key={f.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    opacity: hasMatch ? 1 : 0.2,
                  }}
                >
                  <summary
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer text-sm font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    <span>{f.label}</span>
                    <span
                      className="ml-auto font-mono text-xs"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      {f.steps.length} 步驟 · {skillCount} skills
                    </span>
                  </summary>
                  <div
                    className="px-4 py-2"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    {f.steps.map((step, i) => (
                      <div
                        key={step.num}
                        className="flex items-start gap-3 py-2.5"
                        style={{
                          borderTop:
                            i === 0 ? "none" : "1px solid var(--border)",
                        }}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-mono"
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                            borderRadius: "50%",
                          }}
                        >
                          {step.num}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span
                              className="text-sm"
                              style={{ color: "var(--text)", fontWeight: 500 }}
                            >
                              {step.label}
                            </span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {step.desc}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {step.skills.map((s) => (
                              <SkillChip
                                key={s}
                                name={s}
                                asLink={false}
                                onClick={setSelectedSkill}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </section>

        {/* Situational triggers — token swap */}
        <section>
          <h2
            className="mb-3"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            情境觸發{" "}
            <span
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
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
                  className="px-4 py-3"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    opacity: matches ? 1 : 0.2,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text)", fontWeight: 500 }}
                    >
                      {s.trigger}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.skills.map((sk) => (
                      <SkillChip
                        key={sk}
                        name={sk}
                        asLink={false}
                        onClick={setSelectedSkill}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Orphaned — token swap, semantic status colors for severity */}
        {(data.orphaned.length > 0 || data.autoOrphaned.length > 0) && (
          <section>
            <h2
              className="mb-3"
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text)",
                letterSpacing: "-0.01em",
              }}
            >
              孤兒 Skills{" "}
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  fontWeight: 400,
                }}
              >
                未對應到任何工作流程
              </span>
            </h2>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {data.orphaned.map((o, i) => (
                <div
                  key={o.skill}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                  }}
                >
                  <span
                    className="inline-flex font-mono text-[11px]"
                    style={{
                      padding: "2px 6px",
                      borderRadius: 2,
                      background: "var(--surface-2)",
                      color:
                        o.severity === "red"
                          ? "var(--status-err)"
                          : "var(--status-warn)",
                      border: `1px solid ${
                        o.severity === "red"
                          ? "var(--status-err)"
                          : "var(--status-warn)"
                      }`,
                    }}
                  >
                    {o.skill}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {o.reason}
                  </span>
                </div>
              ))}
              {data.autoOrphaned.map((name, i) => (
                <div
                  key={name}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <SkillChip name={name} variant="optional" asLink={false} onClick={setSelectedSkill} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    已安裝但未出現在任何 flow 或 trigger 中
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Cross-reference panel · always visible on the right */}
      <CrossReferencePanel
        selectedSkill={selectedSkill}
        references={references}
      />
    </div>
  );
}
