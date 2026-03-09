import { useState, useEffect, useCallback, useRef } from "react";
import WebSocket from "ws";
import type { ServerMessage, ClientMessage, DaemonStats } from "../../rules/types.js";

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

const INITIAL_STATS: DaemonStats = { allow: 0, deny: 0, ask: 0, uptime: 0, startedAt: "" };
const MAX_EVENTS = 200;

export function useWebSocket(port: number): WsState {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<PolicyEvent[]>([]);
  const [pending, setPending] = useState<PendingAsk[]>([]);
  const [stats, setStats] = useState<DaemonStats>(INITIAL_STATS);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let backoff = 1000;

    function connect() {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);
      wsRef.current = ws;

      ws.on("open", () => {
        setConnected(true);
        backoff = 1000;
      });

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as ServerMessage;
          switch (msg.type) {
            case "snapshot":
              setPending(msg.data.pending);
              setStats(msg.data.stats);
              break;
            case "policy.checked":
              setEvents((prev) => [...prev.slice(-(MAX_EVENTS - 1)), msg.data as PolicyEvent]);
              break;
            case "ask.pending":
              setPending((prev) => [...prev, msg.data]);
              break;
            case "ask.resolved":
              setPending((prev) => prev.filter((p) => p.id !== msg.data.id));
              break;
            case "stats":
              setStats(msg.data);
              break;
          }
        } catch { /* ignore */ }
      });

      ws.on("close", () => {
        setConnected(false);
        wsRef.current = null;
        reconnectTimer = setTimeout(connect, Math.min(backoff, 10000));
        backoff *= 1.5;
      });

      ws.on("error", () => {
        ws.close();
      });
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [port]);

  const resolve = useCallback((id: string, decision: "allow" | "deny") => {
    const msg: ClientMessage = { type: "ask.resolve", data: { id, decision } };
    wsRef.current?.send(JSON.stringify(msg));
  }, []);

  return { connected, events, pending, stats, resolve };
}
