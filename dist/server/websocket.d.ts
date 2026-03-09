import type { Server } from "node:http";
import type { ServerMessage, DaemonStats } from "../rules/types.js";
import type { ApprovalManager } from "./approval-manager.js";
export declare class WsBroadcaster {
    private wss;
    private approvals;
    private getStats;
    constructor(server: Server, approvals: ApprovalManager, getStats: () => DaemonStats);
    /** Broadcast a message to all connected TUI clients. */
    broadcast(msg: ServerMessage): void;
    /** Number of connected TUI clients. */
    get clientCount(): number;
}
