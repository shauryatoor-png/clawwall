import type { DaemonStats } from "../../rules/types.js";
export type PolicyEvent = {
    id: string;
    tool: string;
    args: Record<string, unknown>;
    decision: string;
    reason: string;
    ts: string;
};
export type PendingAsk = {
    id: string;
    tool: string;
    args: Record<string, unknown>;
    reason: string;
    ts: string;
};
export type WsState = {
    connected: boolean;
    events: PolicyEvent[];
    pending: PendingAsk[];
    stats: DaemonStats;
    resolve: (id: string, decision: "allow" | "deny") => void;
};
export declare function useWebSocket(port: number): WsState;
