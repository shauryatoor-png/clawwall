import { WebSocketServer, WebSocket } from "ws";
export class WsBroadcaster {
    wss;
    approvals;
    getStats;
    constructor(server, approvals, getStats) {
        this.approvals = approvals;
        this.getStats = getStats;
        this.wss = new WebSocketServer({ noServer: true });
        server.on("upgrade", (request, socket, head) => {
            if (request.url === "/ws") {
                this.wss.handleUpgrade(request, socket, head, (ws) => {
                    this.wss.emit("connection", ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
        this.wss.on("connection", (ws) => {
            // Send snapshot of current state on connect
            const snapshot = {
                type: "snapshot",
                data: {
                    pending: this.approvals.getPending(),
                    stats: this.getStats(),
                },
            };
            ws.send(JSON.stringify(snapshot));
            ws.on("message", (raw) => {
                try {
                    const msg = JSON.parse(String(raw));
                    if (msg.type === "ask.resolve") {
                        this.approvals.resolve(msg.data.id, msg.data.decision);
                    }
                }
                catch {
                    // ignore malformed messages
                }
            });
        });
    }
    /** Broadcast a message to all connected TUI clients. */
    broadcast(msg) {
        const data = JSON.stringify(msg);
        for (const client of this.wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    }
    /** Number of connected TUI clients. */
    get clientCount() {
        return this.wss.clients.size;
    }
}
//# sourceMappingURL=websocket.js.map