import { randomUUID } from "node:crypto";
export class ApprovalManager {
    pending = new Map();
    timeoutMs;
    constructor(opts) {
        this.timeoutMs = opts?.timeoutMs ?? 120_000;
    }
    /**
     * Create a pending approval and return a Promise that resolves to "allow" or "deny".
     * Broadcasts `ask.pending` via the broadcaster.
     */
    request(tool, args, reason, broadcast) {
        const id = randomUUID();
        const ts = new Date().toISOString();
        return new Promise((resolvePromise) => {
            let settled = false;
            const settle = (decision) => {
                if (settled)
                    return; // guard against double-resolution
                settled = true;
                clearTimeout(timer);
                this.pending.delete(id);
                broadcast({ type: "ask.resolved", data: { id, decision } });
                resolvePromise(decision);
            };
            const timer = setTimeout(() => settle("deny"), this.timeoutMs);
            const entry = {
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
    resolve(id, decision) {
        const entry = this.pending.get(id);
        if (!entry)
            return false;
        entry.resolve(decision);
        return true;
    }
    /** Get all pending approvals (for TUI snapshot on connect). */
    getPending() {
        return Array.from(this.pending.values()).map(({ id, tool, args, reason, ts }) => ({
            id, tool, args, reason, ts,
        }));
    }
}
//# sourceMappingURL=approval-manager.js.map