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

// ── Types ────────────────────────────────────────────────────────────

export interface OverviewData {
  metrics: {
    total_skills: number;
    running_agents: number;
    enabled_hooks: number;
    total_cost_usd: number;
  };
  agents: AgentInfo[];
  hooks: HookInfo[];
}

export interface HookInfo {
  event: string;
  matcher: string;
  command: string;
}

export interface AgentInfo {
  label: string;
  name: string;
  project: string;
  plist_path: string;
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
}

export interface AgentsData {
  metrics: {
    total: number;
    running: number;
    last_success: string | null;
    today_cost: number;
  };
  agents: AgentInfo[];
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

export interface SkillInfo {
  name: string;
  category: string;
  summary: string;
  line_count: number;
  invocable: boolean;
  lifecycle: string;
}
