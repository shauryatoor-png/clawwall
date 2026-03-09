# ClawWall

**Policy firewall for OpenClaw.** ClawWall intercepts every tool call OpenClaw makes — file writes, shell commands, web requests, deployments, messages — and enforces security rules before they execute. Dangerous operations are blocked automatically. Suspicious ones pause for your approval. Everything is logged.

It doesn't matter what task OpenClaw is doing. Coding, managing files, browsing the web, running scripts — all of it goes through ClawWall.

---

## Why ClawWall

When an AI agent runs on your machine, it has access to everything you have access to: your SSH keys, your `.env` files, your AWS credentials, your entire filesystem. It can run shell commands, make network requests, modify any file. Most of the time that's fine. But you shouldn't have to just *trust* that it won't make a mistake — or that the prompt it received wasn't manipulated.

ClawWall gives you a kill switch backed by real enforcement inside OpenClaw:

| Threat | What ClawWall Does |
|--------|--------------------|
| Destructive commands (`rm -rf /`, `mkfs`, `shutdown`) | **Blocked automatically** |
| Credential access (`.env`, `.ssh/id_rsa`, `.aws/credentials`) | **Blocked automatically** |
| Writes outside your project directory | **Blocked automatically** |
| Internal network access (localhost, private IPs) | **Paused for your approval** |
| Everything else | **Allowed, logged** |
| Your custom rules | **Your call** |

You can see every decision in real time via the TUI dashboard. Approve or deny anything with a single keypress. Every action is logged to an audit trail.

> **Scope:** ClawWall works by integrating directly with OpenClaw's tool execution pipeline. It is not an OS-level or kernel-level firewall — other AI tools on your machine (Claude Desktop, Cursor, etc.) are not covered unless they implement the [ClawWall HTTP API](#api).

---

## Install

```bash
npm install -g clawwall
```

Requires Node.js 20+.

Or use the one-liner installer:

```bash
curl -fsSL https://clawwall.dev/install.sh | bash
```

---

## Quick Start

```bash
# 1. Start the firewall daemon (runs in background)
clawwall start

# 2. Enable it for your AI agent
CLAWWALL_ENABLED=true <your-agent-command>

# 3. Optionally open the live dashboard
clawwall tui
```

That's it. ClawWall will now intercept and evaluate every tool call before it executes.

---

## How It Works

ClawWall runs as a lightweight background daemon. OpenClaw is built to check with ClawWall before executing any sensitive tool — every exec, write, browser call, deploy, and more. The daemon evaluates the request against its rule set and returns a decision in milliseconds, or holds the connection open while you decide in the TUI.

```
OpenClaw  ──(before every tool)──>  before-tool-call hook
                                           │
                                    POST /policy/check
                                           │
                                    ClawWall daemon
                                           │
                                    ┌──────▼───────┐
                                    │ Rule Engine  │──> allow (instant, tool runs)
                                    │              │──> deny  (instant, tool blocked)
                                    │              │──> ask   ──> TUI dashboard
                                    └──────────────┘         └──> [Y] / [N]
```

OpenClaw waits for the final `allow` or `deny`. It never sees "ask" — the daemon holds the HTTP connection open until you decide. If the daemon is unreachable, the fail policy applies (default: `deny`).

---

## What It Protects

ClawWall covers every tool OpenClaw can use — not just coding operations. Whether OpenClaw is writing files, running scripts, accessing the web, or sending messages, ClawWall intercepts it first:

**Your credentials and secrets:**
- `.env` files — blocked from being written or exfiltrated
- SSH private keys — `.ssh/id_rsa`, `id_ed25519`, etc.
- Cloud credentials — `.aws/credentials`, service account keys
- `/etc/passwd`, `/etc/shadow` — system credential files

**Your system:**
- `rm -rf /` and variants — permanently blocked
- `mkfs`, `dd if=` — disk format commands blocked
- `chmod -R /`, `poweroff`, `reboot`, `shutdown` — blocked
- Any command matching your custom patterns

**Your data and files:**
- Writes outside your project directory — blocked
- Custom path deny patterns — your rules, your control

**Your internal network:**
- Requests to `localhost`, `127.0.0.1`, private IP ranges — paused for approval
- Prevents agents from talking to local services you didn't intend to expose

---

## Interactive Dashboard

```bash
clawwall tui
```

```
 ClawWall v0.1.0  ● connected  port 7654  up 2h 14m

  Live Feed                                Stats
  ✓ read  src/index.ts          allow      Allow  ██████████████ 142
  ✓ exec  npm install           allow      Deny   ██              12
  ✗ exec  rm -rf /tmp/.env      deny       Ask    ███              8
  ? browser  http://localhost   ask

  ─── Pending Approval ──────────────────────────────────────────
  → browser: http://localhost:3000
    AI wants to access your local dev server. Allow?
    [Y] Approve  [N] Deny  [↑↓] Navigate

  ─── Active Rules ──────────────────────────────────────────────
  built-in: dangerous commands → deny (exec, bash, shell, process)
  built-in: sensitive paths → deny (write, edit)
  built-in: outside workspace → deny (write, edit)
  built-in: internal URLs → ask (browser, navigate)

  [q] Quit  [r] Reload rules  [c] Clear feed
```

---

## CLI

| Command | Description |
|---------|-------------|
| `clawwall start` | Start the daemon in the background |
| `clawwall start --foreground` | Start in foreground (logs to stdout) |
| `clawwall stop` | Stop the daemon |
| `clawwall status` | Show status, uptime, and decision counts |
| `clawwall tui` | Open the interactive dashboard |
| `clawwall rules list` | Show all active rules |
| `clawwall rules add-command <pattern>` | Add a command deny pattern (regex) |
| `clawwall rules add-path <pattern>` | Add a path deny pattern (substring) |
| `clawwall rules remove-command <index>` | Remove a command deny pattern |
| `clawwall rules remove-path <index>` | Remove a path deny pattern |
| `clawwall logs` | View recent audit log |
| `clawwall logs --follow` | Tail the audit log in real time |
| `clawwall install-launchd` | Install macOS auto-start service |

---

## Custom Rules

Add rules for anything that matters to your environment:

```bash
# Block any use of curl or wget (prevent data exfiltration)
clawwall rules add-command "\\b(curl|wget)\\b"

# Block writes to your production config
clawwall rules add-path "config/production"

# Block writes to any migration file
clawwall rules add-path "migrations/"

# View all active rules
clawwall rules list
```

Rules live in `~/.clawwall/rules.json` and are hot-reloaded — no restart needed.

---

## Audit Log

Every decision ClawWall makes is recorded:

```bash
clawwall logs              # recent entries
clawwall logs --follow     # real-time tail
```

Logs are written to `~/.clawwall/audit/clawwall-YYYY-MM-DD.audit.jsonl`. Each entry includes the timestamp, agent ID, tool name, arguments, decision, and the rule that matched.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAWWALL_ENABLED` | `false` | Enable ClawWall (set to `true`) |
| `CLAWWALL_URL` | `http://localhost:7654` | Daemon URL |
| `CLAWWALL_PORT` | `7654` | Daemon port |
| `CLAWWALL_TIMEOUT_MS` | `130000` | Max wait for approval (ms) |
| `CLAWWALL_RULES_FILE` | `~/.clawwall/rules.json` | Custom rules file |
| `CLAWWALL_AUDIT_DIR` | `~/.clawwall/audit` | Audit log directory |

### Agent Integration (OpenClaw)

```bash
# Enable via environment
CLAWWALL_ENABLED=true openclaw

# Or in your OpenClaw config
```

```json5
{
  "clawwall": {
    "enabled": true,
    "url": "http://localhost:7654",
    "failPolicy": "deny"
  }
}
```

`failPolicy` controls what happens if the ClawWall daemon is unreachable: `"deny"` (safe default) or `"allow"`.

### HTTP API

Any agent can call ClawWall directly. The API is plain HTTP:

```bash
# Check a tool call
curl -X POST http://localhost:7654/policy/check \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "my-agent",
    "tool": { "name": "exec", "args": { "command": "rm -rf /" } },
    "context": { "cwd": "/Users/me/project" }
  }'
# → {"decision":"deny","reason":"dangerous_command: \\brm\\s+-rf\\b"}
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/policy/check` | POST | Evaluate a tool call — returns `allow` or `deny` |
| `/health` | GET | Health check |
| `/stats` | GET | Allow/deny/ask counts |
| `/rules` | GET | List active rules |
| `/rules/reload` | POST | Hot-reload rules from disk |

---

## Auto-Start on Login (macOS)

```bash
clawwall install-launchd
```

Installs a LaunchAgent so ClawWall starts automatically when you log in. To remove:

```bash
launchctl unload ~/Library/LaunchAgents/com.clawwall.agent.plist
rm ~/Library/LaunchAgents/com.clawwall.agent.plist
```

---

## Data Directory

```
~/.clawwall/
  clawwall.pid           # Daemon PID file
  rules.json             # Your custom deny rules
  audit/                 # Rolling daily JSONL audit logs
    clawwall-2026-03-08.audit.jsonl
    clawwall-2026-03-07.audit.jsonl
```

---

## License

MIT
# clawwall
