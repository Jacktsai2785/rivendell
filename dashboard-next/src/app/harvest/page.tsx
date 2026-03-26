"use client";

import { useCallback, useEffect, useState } from "react";
import {
  apiFetch,
  apiPost,
  type HarvestData,
  type HarvestCandidate,
} from "@/lib/api";
import MetricsRow from "@/components/MetricsRow";
import {
  Check,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const strengthConfig = {
  strong: {
    label: "Strong",
    icon: Zap,
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-300 dark:border-green-800",
  },
  moderate: {
    label: "Moderate",
    icon: TrendingUp,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-800",
  },
  weak: {
    label: "Weak",
    icon: AlertTriangle,
    color: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    border: "border-zinc-300 dark:border-zinc-700",
  },
};

function StrengthBadge({ strength }: { strength: HarvestCandidate["strength"] }) {
  const cfg = strengthConfig[strength];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <Check size={12} /> Accepted
      </span>
    );
  if (decision === "dismissed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 line-through dark:bg-zinc-800 dark:text-zinc-500">
        <X size={12} /> Dismissed
      </span>
    );
  return null;
}

function CandidateCard({
  candidate,
  onDecide,
}: {
  candidate: HarvestCandidate;
  onDecide: (key: string, decision: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = strengthConfig[candidate.strength];
  const isDismissed = candidate.decision === "dismissed";

  return (
    <div
      className={`rounded-lg border p-4 transition-opacity ${cfg.border} ${
        isDismissed ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-sm font-bold">{candidate.name}</code>
            <StrengthBadge strength={candidate.strength} />
            <DecisionBadge decision={candidate.decision} />
            {candidate.category && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800">
                {candidate.category}
              </span>
            )}
          </div>
          {candidate.purpose && (
            <p className="mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
              {candidate.purpose}
            </p>
          )}
          <p className="mt-1 text-[11px] text-zinc-400">
            {candidate.report_date}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-1.5">
          {candidate.decision !== "accepted" && (
            <button
              onClick={() => onDecide(candidate.key, "accepted")}
              className="rounded-md bg-green-600 p-1.5 text-white hover:bg-green-700"
              title="Accept — create this skill"
            >
              <Check size={14} />
            </button>
          )}
          {candidate.decision !== "dismissed" && (
            <button
              onClick={() => onDecide(candidate.key, "dismissed")}
              className="rounded-md bg-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-400 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              title="Dismiss — not needed"
            >
              <X size={14} />
            </button>
          )}
          {candidate.decision !== "pending" && (
            <button
              onClick={() => onDecide(candidate.key, "pending")}
              className="rounded-md border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              title="Reset to pending"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        詳細分析
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-md bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
          {candidate.trigger && (
            <p>
              <strong className="text-zinc-600 dark:text-zinc-400">觸發：</strong>{" "}
              {candidate.trigger}
            </p>
          )}
          {candidate.reasoning && (
            <div>
              <strong className="text-zinc-600 dark:text-zinc-400">理由：</strong>
              <p className="mt-0.5 whitespace-pre-line text-zinc-500">{candidate.reasoning}</p>
            </div>
          )}
          {candidate.conclusion && (
            <p>
              <strong className="text-zinc-600 dark:text-zinc-400">結論：</strong>{" "}
              {candidate.conclusion}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

type FilterTab = "all" | "pending" | "accepted" | "dismissed";

export default function HarvestPage() {
  const [data, setData] = useState<HarvestData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("pending");

  const load = useCallback(() => {
    apiFetch<HarvestData>("/api/harvest")
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(load, [load]);

  async function handleDecide(key: string, decision: string) {
    await apiPost("/api/harvest/decide", { key, decision });
    load();
  }

  if (err) return <p className="text-red-500">Error: {err}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const filtered =
    tab === "all"
      ? data.candidates
      : data.candidates.filter((c) => c.decision === tab);

  // Group by strength for display
  const strong = filtered.filter((c) => c.strength === "strong");
  const moderate = filtered.filter((c) => c.strength === "moderate");
  const weak = filtered.filter((c) => c.strength === "weak");

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "pending", label: "待決定", count: data.pending_count },
    { key: "accepted", label: "已接受", count: data.accepted_count },
    { key: "dismissed", label: "已忽略", count: data.dismissed_count },
    { key: "all", label: "全部", count: data.total },
  ];

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Skill Harvest</h1>
      <p className="mb-6 text-sm text-zinc-500">
        從 session harvest 報告中萃取的 skill 候選。審閱後決定是否建立。
      </p>

      <MetricsRow
        metrics={[
          { label: "候選總數", value: data.total },
          { label: "待決定", value: data.pending_count },
          { label: "已接受", value: data.accepted_count },
          { label: "已忽略", value: data.dismissed_count },
        ]}
      />

      {/* Filter tabs */}
      <div className="mt-6 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-400">
          {tab === "pending" ? "沒有待決定的候選" : "沒有符合的候選"}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {strong.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Zap size={16} className="text-green-600" />
                Strong ({strong.length})
              </h2>
              <div className="space-y-3">
                {strong.map((c) => (
                  <CandidateCard key={c.key} candidate={c} onDecide={handleDecide} />
                ))}
              </div>
            </section>
          )}

          {moderate.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <TrendingUp size={16} className="text-amber-600" />
                Moderate ({moderate.length})
              </h2>
              <div className="space-y-3">
                {moderate.map((c) => (
                  <CandidateCard key={c.key} candidate={c} onDecide={handleDecide} />
                ))}
              </div>
            </section>
          )}

          {weak.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={16} className="text-zinc-400" />
                Weak ({weak.length})
              </h2>
              <div className="space-y-3">
                {weak.map((c) => (
                  <CandidateCard key={c.key} candidate={c} onDecide={handleDecide} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
