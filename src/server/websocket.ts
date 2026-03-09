import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import type { ServerMessage, ClientMessage, DaemonStats } from "../rules/types.js";
import type { ApprovalManager } from "./approval-manager.js";

export class WsBroadcaster {
  private wss: WebSocketServer;
  private approvals: ApprovalManager;
  private getStats: () => DaemonStats;

  constructor(server: Server, approvals: ApprovalManager, getStats: () => DaemonStats) {
    this.approvals = approvals;
    this.getStats = getStats;

    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      if (request.url === "/ws") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit("connection", ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on("connection", (ws) => {
      // Send snapshot of current state on connect
      const snapshot: ServerMessage = {
        type: "snapshot",
        data: {
          pending: this.approvals.getPending(),
          stats: this.getStats(),
        },
      };
      ws.send(JSON.stringify(snapshot));

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(String(raw)) as ClientMessage;
          if (msg.type === "ask.resolve") {
            this.approvals.resolve(msg.data.id, msg.data.decision);
          }
        } catch {
          // ignore malformed messages
        }
      });
    });
  }

  /** Broadcast a message to all connected TUI clients. */
  broadcast(msg: ServerMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /** Number of connected TUI clients. */
  get clientCount(): number {
    return this.wss.clients.size;
  }
}
