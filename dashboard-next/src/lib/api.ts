const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiFetch(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiFetch(path, { method: "DELETE" });
}

// ── Types ────────────────────────────────────────────────────────────

export interface OverviewData {
  metrics: {
    total_skills: number;
    running_agents: number;
    enabled_hooks: number;
    total_cost_usd: number;
    total_projects: number;
  };
  agents: AgentInfo[];
  hooks: HookInfo[];
  projects_summary: {
    name: string;
    description: string;
    agent_count: number;
    agent_count_loaded: number;
  }[];
}

export interface HookInfo {
  event: string;
  matcher: string;
  command: string;
}

export interface AgentInfo {
  label: string;
  name: string;
  description: string;
  project: string;
  plist_path: string;
  working_directory: string;
  schedule: Record<string, unknown>;
  schedule_display: string;
  schedule_list: Record<string, number>[];
  loaded: boolean;
  installed: boolean;
  pid: number | null;
  exit_code: number | null;
  role_badge: string;
  merge_strategy_display: string;
  qa_display: string;
  recent_commit: { sha: string; message: string } | null;
  git_safety: {
    allowed_paths: string[];
    forbidden_paths: string[];
    max_files_changed: number;
  } | null;
  current_activity: {
    tool: string;
    label: string;
    detail: string;
  } | null;
}

export interface AgentsData {
  metrics: {
    total: number;
    running: number;
    last_success: string | null;
    today_cost: number;
  };
  agents: AgentInfo[];
  by_project: Record<string, string[]>;
}

export interface AgentRun {
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  commit_sha: string | null;
  files_changed: number | null;
  qa_passed: number | null;
  branch_name: string | null;
  pr_url: string | null;
}

export interface TokensData {
  totals: {
    total_sessions: number;
    total_messages: number;
    total_cost_usd: number;
    total_input: number;
    total_output: number;
    total_cache_read: number;
    first_session: string;
    last_computed: string;
  };
  daily: {
    date: string;
    sessions: number;
    messages: number;
    tool_calls: number;
    tokens_total: number;
    cost_usd: number;
    models: Record<string, number>;
  }[];
  models: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_create_tokens: number;
    cost_usd: number;
  }[];
}

export interface FilteredTokensData {
  total_sessions: number;
  total_messages: number;
  total_cost_usd: number;
  total_tokens: number;
  daily: {
    date: string;
    sessions: number;
    messages: number;
    tokens_total: number;
    cost_usd: number;
  }[];
  models: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  }[];
  projects: {
    project: string;
    sessions: number;
    messages: number;
    tokens_total: number;
    cost_usd: number;
  }[];
}

export interface CollaborationData {
  found: boolean;
  pending: number;
  resolved: number;
  resolution_rate: number;
}

export interface IssueItem {
  source: "agent" | "learnings" | "skill" | "env";
  severity: "error" | "warning" | "info";
  title: string;
  detail: string;
  label: string;
}

export interface IssuesData {
  total: number;
  errors: number;
  warnings: number;
  issues: IssueItem[];
}

export interface SkillInfo {
  name: string;
  category: string;
  summary: string;
  line_count: number;
  invocable: boolean;
  lifecycle: string;
}

export interface SkillDetail extends SkillInfo {
  content: string;
}

export interface SkillUsageDay {
  date: string;
  count: number;
}

export type SkillUsage = Record<string, SkillUsageDay[]>;

// ── Projects ──────────────────────────────────────────────────────────

export interface ProjectInfo {
  name: string;
  repo: string;
  description: string;
  agents: string[];
  agent_count_loaded: number;
  total_cost_usd: number;
}

export interface ProjectsData {
  projects: ProjectInfo[];
}

export interface ProjectDetailData extends ProjectInfo {
  agent_details: AgentInfo[];
}

// ── Ports ─────────────────────────────────────────────────────────────────────

export interface PortInfo {
  port: number;
  service: string;
  container: string;
  type: "API" | "Frontend" | "Streamlit" | "DB" | "Cache" | "Service";
  web: boolean;
  category: "前端" | "後端" | "資料庫" | "其他";
  project: string;
  status: "live" | "stopped" | "unknown";
}

export interface PortsData {
  ports: PortInfo[];
}

export interface AgentFile {
  name: string;
  path: string;
  size: number;
  modified: number;
  type: string;
}

export interface AgentFileContent {
  name: string;
  content: string;
  size: number;
}

// ── Harvest ──────────────────────────────────────────────────────────

export interface HarvestCandidate {
  key: string;
  name: string;
  strength: "strong" | "moderate" | "weak";
  purpose: string;
  trigger: string;
  category: string;
  reasoning: string;
  conclusion: string;
  report_date: string;
  decision: "pending" | "accepted" | "dismissed";
}

export interface HarvestData {
  total: number;
  pending_count: number;
  accepted_count: number;
  dismissed_count: number;
  candidates: HarvestCandidate[];
}

export interface TimelineEvent {
  ts: string;
  type: "tool" | "text" | "thinking" | "result" | "auto_commit" | "auto_push" | string;
  name?: string;
  input?: Record<string, unknown>;
  text?: string;
  preview?: string;
  len?: number;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  detail?: string;
}
