// ── Policy evaluation types ──

export type PolicyRequest = {
  agent_id: string;
  tool: { name: string; args: Record<string, unknown> };
  context: {
    sandboxed?: boolean;
    elevated?: boolean;
    cwd?: string;
    workspace_access?: string;
  };
};

export type PolicyDecision = {
  decision: "allow" | "deny" | "ask";
  reason: string;
};

export type CustomRules = {
  denyCommands?: string[];
  denyPaths?: string[];
};

// ── Audit types ──

export type AuditEntry = {
  ts: string;
  agent_id: string;
  tool: string;
  decision: PolicyDecision["decision"];
  reason: string;
};

// ── WebSocket message protocol ──

export type ServerMessage =
  | { type: "policy.checked"; data: { id: string; tool: string; args: Record<string, unknown>; decision: string; reason: string; ts: string } }
  | { type: "ask.pending"; data: { id: string; tool: string; args: Record<string, unknown>; reason: string; ts: string } }
  | { type: "ask.resolved"; data: { id: string; decision: string } }
  | { type: "stats"; data: DaemonStats }
  | { type: "snapshot"; data: { pending: Array<{ id: string; tool: string; args: Record<string, unknown>; reason: string; ts: string }>; stats: DaemonStats } };

export type ClientMessage =
  | { type: "ask.resolve"; data: { id: string; decision: "allow" | "deny" } };

export type DaemonStats = {
  allow: number;
  deny: number;
  ask: number;
  uptime: number;
  startedAt: string;
};

// ── Pending approval ──

export type PendingApproval = {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  reason: string;
  ts: string;
  resolve: (decision: "allow" | "deny") => void;
  timer: ReturnType<typeof setTimeout>;
};
