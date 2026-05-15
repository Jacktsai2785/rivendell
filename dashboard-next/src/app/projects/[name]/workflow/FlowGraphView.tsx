"use client";

import { useEffect, useMemo, useState } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { X } from "lucide-react";
import {
  skillDetails,
  type Chip as ChipData,
  type ChipCategory,
} from "./playbook-data";
import type { FlowGraph, StepNodeData } from "./flow-graph";

// ─────────────────────────────────────────────────────── Chip (reused style)
function ChipPill({
  chip,
  onClick,
}: {
  chip: ChipData;
  onClick: (key: string) => void;
}) {
  const { key, category } = chip;
  const isCritical = category === "critical";
  const isCore = category === "core";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(key);
      }}
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        padding: "2px 6px",
        borderRadius: 3,
        cursor: "pointer",
        background: "var(--surface)",
        border: isCritical
          ? "1px dashed var(--status-err)"
          : "1px solid var(--border-strong)",
        color: isCritical
          ? "var(--status-err)"
          : isCore
            ? "var(--accent)"
            : "var(--text-muted)",
      }}
    >
      /{key}
    </button>
  );
}

// ───────────────────────────────────────────────────── Custom step node
const STEP_NODE_WIDTH = 280;
const STEP_NODE_MIN_HEIGHT = 90;

function StepNode({ data, selected }: NodeProps<StepNodeData & { onChipClick: (k: string) => void }>) {
  const numStr = /^\d+$/.test(data.num) ? data.num.padStart(2, "0") : data.num;
  const { onChipClick } = data;
  return (
    <div
      style={{
        width: STEP_NODE_WIDTH,
        minHeight: STEP_NODE_MIN_HEIGHT,
        background: "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        position: "relative",
        boxShadow: selected
          ? "0 0 0 2px var(--accent-bg)"
          : "0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "var(--border-strong)", width: 6, height: 6 }}
      />
      <div className="flex items-baseline gap-2 mb-1">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-subtle)",
            fontFeatureSettings: "'tnum' 1",
          }}
        >
          {numStr}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.4,
          }}
        >
          {data.action}
        </span>
      </div>
      {data.detail && (
        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            marginBottom: 6,
          }}
        >
          {data.detail}
        </div>
      )}
      {data.chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {data.chips.map((c) => (
            <ChipPill key={c.key} chip={c} onClick={onChipClick} />
          ))}
          {data.inlineNote && (
            <span
              style={{
                color: "var(--text-subtle)",
                fontSize: 10.5,
                fontStyle: "italic",
                marginLeft: 2,
              }}
            >
              {data.inlineNote}
            </span>
          )}
        </div>
      )}
      {data.branches.map((b, i) => (
        <div
          key={i}
          className="flex flex-wrap items-baseline gap-1.5 mt-2"
          style={{ paddingLeft: 12, position: "relative" }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-subtle)",
            }}
          >
            ↳
          </span>
          <span
            style={{
              fontSize: 10.5,
              color: "var(--text-subtle)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {b.label}
          </span>
          {b.chips.map((c) => (
            <ChipPill key={c.key} chip={c} onClick={onChipClick} />
          ))}
          {b.inlineNote && (
            <span
              style={{
                color: "var(--text-subtle)",
                fontSize: 10.5,
                fontStyle: "italic",
                marginLeft: 2,
              }}
            >
              {b.inlineNote}
            </span>
          )}
        </div>
      ))}
      {data.hardGate && (
        <div
          className="mt-2 pl-2"
          style={{
            borderLeft: "2px solid var(--status-warn)",
            color: "var(--text-muted)",
            fontSize: 11,
            fontStyle: "italic",
            lineHeight: 1.4,
          }}
        >
          {data.hardGate}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "var(--border-strong)", width: 6, height: 6 }}
      />
    </div>
  );
}

const nodeTypes = { step: StepNode };

// ────────────────────────────────────────────────────── Dagre auto-layout
function layout(graph: FlowGraph): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 50, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  // Estimate node height: base + 18px per branch + 16px if detail exists.
  for (const n of graph.nodes) {
    const branchLines = n.data.branches.length;
    const hasDetail = n.data.detail ? 1 : 0;
    const hasGate = n.data.hardGate ? 1 : 0;
    const estHeight =
      STEP_NODE_MIN_HEIGHT + branchLines * 24 + hasDetail * 18 + hasGate * 22;
    g.setNode(n.id, { width: STEP_NODE_WIDTH, height: estHeight });
  }
  for (const e of graph.edges) {
    g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  const nodes: Node[] = graph.nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "step",
      position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 },
      data: n.data,
      draggable: false,
      selectable: true,
      connectable: false,
    };
  });

  const edges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    style: {
      stroke:
        e.kind === "skip" ? "var(--text-subtle)" : "var(--accent-soft)",
      strokeWidth: 1.5,
      strokeDasharray: e.kind === "skip" ? "4 4" : undefined,
    },
    label: e.label,
    labelStyle: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      fill: "var(--text-muted)",
    },
    labelBgPadding: [4, 2],
    labelBgStyle: { fill: "var(--bg)" },
  }));

  return { nodes, edges };
}

// ────────────────────────────────────────────────────── Skill detail modal
function SkillModal({
  skillKey,
  onClose,
}: {
  skillKey: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!skillKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skillKey, onClose]);

  if (!skillKey) return null;
  const data = skillDetails[skillKey];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(10, 10, 10, 0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg p-7"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute right-3 top-3 p-1.5"
          style={{ color: "var(--text-subtle)" }}
        >
          <X size={14} />
        </button>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 500,
            color: "var(--accent)",
            marginBottom: 14,
          }}
        >
          /{skillKey}
        </div>
        {data ? (
          <>
            <p
              style={{
                color: "var(--text)",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 16,
              }}
            >
              {data.desc}
            </p>
            {data.trigger && (
              <DetailBlock label="trigger" body={data.trigger} />
            )}
            {data.skip && <DetailBlock label="skip" body={data.skip} muted />}
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            (no description available)
          </p>
        )}
      </div>
    </div>
  );
}

function DetailBlock({
  label,
  body,
  muted,
}: {
  label: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div className="mt-3 pl-3" style={{ borderLeft: "2px solid var(--border)" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--text-subtle)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <p
        style={{
          color: muted ? "var(--text-muted)" : "var(--text)",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────── Public view
export default function FlowGraphView({ graph }: { graph: FlowGraph }) {
  const [openSkill, setOpenSkill] = useState<string | null>(null);

  // Inject onChipClick into node data so the custom node can call it.
  const enriched = useMemo<FlowGraph>(
    () => ({
      nodes: graph.nodes.map((n) => ({
        ...n,
        data: { ...n.data, onChipClick: setOpenSkill },
      })),
      edges: graph.edges,
    }),
    [graph],
  );

  const { nodes, edges } = useMemo(() => layout(enriched), [enriched]);

  // Pick a height that fits typical flow lengths without dwarfing short ones.
  const rfHeight = Math.max(420, nodes.length * 140);

  return (
    <>
      <div
        style={{
          width: "100%",
          height: rfHeight,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.4}
          maxZoom={1.4}
          panOnScroll
          zoomOnScroll={false}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="var(--border)" size={1} />
          <Controls
            showInteractive={false}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          />
        </ReactFlow>
      </div>
      <SkillModal skillKey={openSkill} onClose={() => setOpenSkill(null)} />
    </>
  );
}
