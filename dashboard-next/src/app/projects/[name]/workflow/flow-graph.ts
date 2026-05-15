// Converts a Workflow (linear or branch-based) from playbook-data.ts
// into a {nodes, edges} graph for React Flow rendering.
//
// Forward-compat: when editing is added later, this converter can be
// inverted to round-trip user-positioned nodes back into the data file,
// or the data file can be replaced entirely with the graph format.

import type {
  Workflow,
  WorkflowId,
  Step,
  Chip,
  Branch,
} from "./playbook-data";

export interface StepNodeData {
  num: string;
  action: string;
  detail?: string;
  chips: Chip[];
  branches: { label: string; chips: Chip[]; inlineNote?: string }[];
  hardGate?: string;
  inlineNote?: string;
}

export interface GraphNode {
  id: string;
  type: "step";
  data: StepNodeData;
  // Position is auto-computed by dagre at render time; we ship 0,0 placeholders.
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** "default" = sequential; "skip" = bypass (e.g. backend skip-design exception) */
  kind?: "default" | "skip";
  label?: string;
}

export interface FlowGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Flatten one Step's optional rows into a uniform `branches: [{label, chips}]` list. */
function flattenBranches(step: Step): StepNodeData["branches"] {
  if (!step.optionals) return [];
  const out: StepNodeData["branches"] = [];
  for (const row of step.optionals) {
    out.push({
      label: row.label,
      chips: row.chips,
      inlineNote: row.inlineNote,
    });
    if (row.secondLabel) {
      out.push({
        label: row.secondLabel,
        chips: row.secondChips ?? [],
      });
    }
  }
  return out;
}

function stepToNode(prefix: string, step: Step): GraphNode {
  return {
    id: `${prefix}-${step.num}`,
    type: "step",
    position: { x: 0, y: 0 },
    data: {
      num: step.num,
      action: step.action,
      detail: step.detail,
      chips: step.chips ?? [],
      branches: flattenBranches(step),
      hardGate: step.hardGate,
      inlineNote: step.inlineNote,
    },
  };
}

function stepsToGraph(prefix: string, steps: Step[]): FlowGraph {
  const nodes = steps.map((s) => stepToNode(prefix, s));
  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `${nodes[i].id}__to__${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      kind: "default",
    });
  }
  return { nodes, edges };
}

/** Convert one branch of the Slide flow into a graph. */
export function branchToGraph(branch: Branch): FlowGraph {
  return stepsToGraph(`slide-${branch.id}`, branch.steps);
}

/** Convert a top-level workflow into a graph. Returns null for non-graphable
 *  flows (currently only maintenance, which renders as a flat table). */
export function workflowToGraph(workflow: Workflow): FlowGraph | null {
  if (workflow.steps && workflow.steps.length > 0) {
    return stepsToGraph(workflow.id, workflow.steps);
  }
  // Branch-based flow: caller picks which branch to render.
  return null;
}

export function flowIdToGraph(
  workflows: Workflow[],
  flowId: WorkflowId,
  branchId?: string,
): FlowGraph | null {
  const wf = workflows.find((w) => w.id === flowId);
  if (!wf) return null;
  if (wf.branches && branchId) {
    const b = wf.branches.find((x) => x.id === branchId);
    return b ? branchToGraph(b) : null;
  }
  return workflowToGraph(wf);
}
