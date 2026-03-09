import type { ServerMessage } from "../rules/types.js";
export type ApprovalBroadcaster = (msg: ServerMessage) => void;
export declare class ApprovalManager {
    private pending;
    private timeoutMs;
    constructor(opts?: {
        timeoutMs?: number;
    });
    /**
     * Create a pending approval and return a Promise that resolves to "allow" or "deny".
     * Broadcasts `ask.pending` via the broadcaster.
     */
    request(tool: string, args: Record<string, unknown>, reason: string, broadcast: ApprovalBroadcaster): Promise<"allow" | "deny">;
    /** Resolve a pending approval by ID. Returns false if not found. */
    resolve(id: string, decision: "allow" | "deny"): boolean;
    /** Get all pending approvals (for TUI snapshot on connect). */
    getPending(): Array<{
        id: string;
        tool: string;
        args: Record<string, unknown>;
        reason: string;
        ts: string;
    }>;
}
