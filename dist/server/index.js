import { createServer } from "node:http";
import { evaluate, getBuiltInRules } from "../rules/engine.js";
import { loadCustomRules } from "../rules/loader.js";
import { writeAuditEntry, configureAudit } from "../audit/writer.js";
import { ApprovalManager } from "./approval-manager.js";
import { WsBroadcaster } from "./websocket.js";
// ── State ──
let customRules;
const stats = { allow: 0, deny: 0, ask: 0 };
const startedAt = new Date().toISOString();
function getStats() {
    return { ...stats, uptime: Date.now() - new Date(startedAt).getTime(), startedAt };
}
// ── HTTP helpers ──
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => resolve(Buffer.concat(chunks).toString()));
        req.on("error", reject);
    });
}
function json(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
}
export function startServer(opts) {
    const port = opts?.port ?? (Number(process.env.CLAWWALL_PORT) || 7654);
    const rulesFile = opts?.rulesFile ?? process.env.CLAWWALL_RULES_FILE;
    const auditDir = opts?.auditDir ?? process.env.CLAWWALL_AUDIT_DIR ?? `${process.env.HOME ?? "/tmp"}/.clawwall/audit`;
    configureAudit({
        dir: auditDir,
        fileEnabled: opts?.auditFileEnabled !== false && process.env.CLAWWALL_AUDIT_FILE !== "false",
    });
    customRules = loadCustomRules(rulesFile);
    const approvals = new ApprovalManager({ timeoutMs: opts?.askTimeoutMs ?? 120_000 });
    const server = createServer(async (req, res) => {
        try {
            await handleRequest(req, res, approvals, broadcast);
        }
        catch (err) {
            json(res, 500, { error: String(err) });
        }
    });
    const ws = new WsBroadcaster(server, approvals, getStats);
    const broadcast = ws.broadcast.bind(ws);
    server.listen(port, () => {
        console.error(`[clawwall] listening on port ${port}`);
        if (customRules)
            console.error(`[clawwall] loaded custom rules from ${rulesFile}`);
    });
    return server;
}
// ── Request handler ──
async function handleRequest(req, res, approvals, broadcast) {
    // POST /policy/check
    if (req.method === "POST" && req.url === "/policy/check") {
        let body;
        try {
            body = JSON.parse(await readBody(req));
        }
        catch {
            return json(res, 400, { error: "invalid_json" });
        }
        if (!body.agent_id || !body.tool?.name) {
            return json(res, 400, { error: "missing_required_fields: agent_id, tool.name" });
        }
        let decision = evaluate(body, customRules);
        // If "ask", hold the request open and wait for TUI resolution
        if (decision.decision === "ask") {
            stats.ask++;
            const finalDecision = await approvals.request(body.tool.name, body.tool.args, decision.reason, broadcast);
            decision = { decision: finalDecision, reason: decision.reason };
        }
        if (decision.decision === "allow")
            stats.allow++;
        else if (decision.decision === "deny")
            stats.deny++;
        writeAuditEntry({
            ts: new Date().toISOString(),
            agent_id: body.agent_id,
            tool: body.tool.name,
            decision: decision.decision,
            reason: decision.reason,
        });
        broadcast({
            type: "policy.checked",
            data: {
                id: Math.random().toString(36).slice(2, 10),
                tool: body.tool.name,
                args: body.tool.args,
                decision: decision.decision,
                reason: decision.reason,
                ts: new Date().toISOString(),
            },
        });
        return json(res, 200, decision);
    }
    // POST /rules/reload
    if (req.method === "POST" && req.url === "/rules/reload") {
        customRules = loadCustomRules(process.env.CLAWWALL_RULES_FILE);
        return json(res, 200, { reloaded: true, hasCustomRules: !!customRules });
    }
    // GET /rules
    if (req.method === "GET" && req.url === "/rules") {
        return json(res, 200, {
            builtIn: getBuiltInRules(),
            custom: customRules ?? null,
        });
    }
    // GET /stats
    if (req.method === "GET" && req.url === "/stats") {
        return json(res, 200, getStats());
    }
    // GET /health
    if (req.method === "GET" && req.url === "/health") {
        return json(res, 200, { status: "ok", hasCustomRules: !!customRules, stats: getStats() });
    }
    json(res, 404, { error: "not_found" });
}
// ── Direct execution ──
const isDirectRun = process.argv[1]?.includes("clawwall") && process.argv[1]?.includes("server");
if (isDirectRun) {
    startServer();
}
//# sourceMappingURL=index.js.map