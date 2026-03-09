import { useState, useEffect, useCallback, useRef } from "react";
import WebSocket from "ws";
const INITIAL_STATS = { allow: 0, deny: 0, ask: 0, uptime: 0, startedAt: "" };
const MAX_EVENTS = 200;
export function useWebSocket(port) {
    const [connected, setConnected] = useState(false);
    const [events, setEvents] = useState([]);
    const [pending, setPending] = useState([]);
    const [stats, setStats] = useState(INITIAL_STATS);
    const wsRef = useRef(null);
    useEffect(() => {
        let reconnectTimer;
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
                    const msg = JSON.parse(String(raw));
                    switch (msg.type) {
                        case "snapshot":
                            setPending(msg.data.pending);
                            setStats(msg.data.stats);
                            break;
                        case "policy.checked":
                            setEvents((prev) => [...prev.slice(-(MAX_EVENTS - 1)), msg.data]);
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
                }
                catch { /* ignore */ }
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
    const resolve = useCallback((id, decision) => {
        const msg = { type: "ask.resolve", data: { id, decision } };
        wsRef.current?.send(JSON.stringify(msg));
    }, []);
    return { connected, events, pending, stats, resolve };
}
//# sourceMappingURL=use-websocket.js.map