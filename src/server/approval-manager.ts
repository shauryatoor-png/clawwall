import { randomUUID } from "node:crypto";
import type { PendingApproval, ServerMessage } from "../rules/types.js";

export type ApprovalBroadcaster = (msg: ServerMessage) => void;

export class ApprovalManager {
  private pending = new Map<string, PendingApproval>();
  private timeoutMs: number;

  constructor(opts?: { timeoutMs?: number }) {
    this.timeoutMs = opts?.timeoutMs ?? 120_000;
  }

  /**
   * Create a pending approval and return a Promise that resolves to "allow" or "deny".
   * Broadcasts `ask.pending` via the broadcaster.
   */
  request(
    tool: string,
    args: Record<string, unknown>,
    reason: string,
    broadcast: ApprovalBroadcaster,
  ): Promise<"allow" | "deny"> {
    const id = randomUUID();
    const ts = new Date().toISOString();

    return new Promise<"allow" | "deny">((resolvePromise) => {
      let settled = false;

      const settle = (decision: "allow" | "deny") => {
        if (settled) return; // guard against double-resolution
        settled = true;
        clearTimeout(timer);
        this.pending.delete(id);
        broadcast({ type: "ask.resolved", data: { id, decision } });
        resolvePromise(decision);
      };

      const timer = setTimeout(() => settle("deny"), this.timeoutMs);

      const entry: PendingApproval = {
        id,
        tool,
        args,
        reason,
        ts,
        resolve: settle,
        timer,
      };

      this.pending.set(id, entry);
      broadcast({ type: "ask.pending", data: { id, tool, args, reason, ts } });
    });
  }

  /** Resolve a pending approval by ID. Returns false if not found. */
  resolve(id: string, decision: "allow" | "deny"): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    entry.resolve(decision);
    return true;
  }

  /** Get all pending approvals (for TUI snapshot on connect). */
  getPending(): Array<{ id: string; tool: string; args: Record<string, unknown>; reason: string; ts: string }> {
    return Array.from(this.pending.values()).map(({ id, tool, args, reason, ts }) => ({
      id, tool, args, reason, ts,
    }));
  }
}
