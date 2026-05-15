"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { workflows, type WorkflowId } from "../playbook-data";
import FlowView from "../FlowView";
import FlowGraphView from "../FlowGraphView";
import { workflowToGraph, branchToGraph } from "../flow-graph";

const VALID_FLOWS = new Set<WorkflowId>(["ui", "backend", "slide", "maintenance"]);

export default function ProjectWorkflowFlowPage() {
  const params = useParams();
  const router = useRouter();
  const name = decodeURIComponent(params.name as string);
  const flow = params.flow as string;
  const [activeBranch, setActiveBranch] = useState("branch-a");

  if (name !== "rivendell") {
    return (
      <div className="p-10" style={{ maxWidth: 720 }}>
        <Link
          href={`/projects/${encodeURIComponent(name)}`}
          className="inline-flex items-center gap-1.5 mb-6"
          style={{ color: "var(--text-muted)", fontSize: 13 }}
        >
          <ArrowLeft size={13} /> {name}
        </Link>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          此專案沒有 workflow playbook。目前只有{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>rivendell</code>{" "}
          有對應的流程定義。
        </p>
      </div>
    );
  }

  if (!VALID_FLOWS.has(flow as WorkflowId)) {
    return (
      <div className="p-10" style={{ maxWidth: 720 }}>
        <Link
          href={`/projects/${encodeURIComponent(name)}/workflow/ui`}
          className="inline-flex items-center gap-1.5 mb-6"
          style={{ color: "var(--text-muted)", fontSize: 13 }}
        >
          <ArrowLeft size={13} /> Workflow Map
        </Link>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Unknown flow:{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>{flow}</code>
        </p>
      </div>
    );
  }

  const flowId = flow as WorkflowId;
  const current = workflows.find((w) => w.id === flowId)!;
  const isGraphable = flowId !== "maintenance";

  // Slide: linear steps live inside a chosen branch; ui/backend: linear at flow level.
  const graphFor =
    flowId === "slide"
      ? branchToGraph(current.branches!.find((b) => b.id === activeBranch)!)
      : workflowToGraph(current);

  return (
    <div className="px-10 py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="mx-auto" style={{ maxWidth: 980 }}>
        {/* Breadcrumb back to project */}
        <button
          onClick={() => router.push(`/projects/${encodeURIComponent(name)}`)}
          className="inline-flex items-center gap-1.5 mb-6 transition-colors"
          style={{ color: "var(--text-muted)", fontSize: 13 }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <ArrowLeft size={13} /> {name}
        </button>

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
        <div
          className="mt-1.5"
          style={{
            color: "var(--text-subtle)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          ~/.claude/CLAUDE.md · click any chip for trigger / skip
        </div>

        {/* Flow nav — real sub-routes via <Link> */}
        <nav
          className="flex gap-8 mt-8 mb-2 overflow-x-auto"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {workflows.map((w) => {
            const active = w.id === flowId;
            return (
              <Link
                key={w.id}
                href={`/projects/${encodeURIComponent(name)}/workflow/${w.id}`}
                className="whitespace-nowrap transition-colors"
                style={{
                  padding: "10px 0",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  borderBottom: `2px solid ${
                    active ? "var(--accent)" : "transparent"
                  }`,
                  marginBottom: -1,
                  textDecoration: "none",
                }}
              >
                {w.label}
              </Link>
            );
          })}
        </nav>

        <section className="mt-8">
          <h2
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            {current.heading}
          </h2>

          {current.lead && (
            <p
              className="mt-3 pl-3"
              style={{
                borderLeft: `2px solid ${
                  current.lead.tone === "warn"
                    ? "var(--status-warn)"
                    : "var(--border)"
                }`,
                color: "var(--text-muted)",
                fontSize: 13,
                fontStyle: "italic",
                lineHeight: 1.65,
              }}
            >
              {/Exception|→ ?跳/.test(current.lead.text) && (
                <span
                  aria-hidden
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-subtle)",
                    fontStyle: "normal",
                    marginRight: 6,
                  }}
                >
                  ↪
                </span>
              )}
              {current.lead.text}
            </p>
          )}

          {/* Slide branch tabs (only relevant for slide flow) */}
          {flowId === "slide" && current.branches && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1">
              {current.branches.map((b) => {
                const active = activeBranch === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setActiveBranch(b.id)}
                    style={{
                      padding: "4px 0",
                      border: "none",
                      background: "transparent",
                      color: active ? "var(--accent)" : "var(--text-muted)",
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      cursor: "pointer",
                      borderBottom: `1px solid ${
                        active ? "var(--accent)" : "transparent"
                      }`,
                    }}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          )}

          {flowId === "slide" && (
            <p
              className="mt-3"
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                fontStyle: "italic",
              }}
            >
              {current.branches?.find((b) => b.id === activeBranch)?.lead}
            </p>
          )}

          {/* Graph for ui / backend / slide-branch; table for maintenance */}
          {isGraphable && graphFor ? (
            <div className="mt-4">
              <FlowGraphView graph={graphFor} />
            </div>
          ) : (
            <FlowView flowId={flowId} />
          )}
        </section>

        <div
          className="mt-16 text-center"
          style={{ color: "var(--text-subtle)", fontSize: 14 }}
        >
          ❦
        </div>
      </div>
    </div>
  );
}
