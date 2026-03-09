import { resolve } from "node:path";
import type { PolicyRequest, PolicyDecision, CustomRules } from "./types.js";

const DANGEROUS_COMMANDS = [/\brm\s+-rf\b/, /\bmkfs\b/, /\bdd\s+if=/, /\bchmod\s+-R\s+\//, /\bpoweroff\b/, /\breboot\b/, /\bshutdown\b/];

const SENSITIVE_PATHS = [".env", ".ssh/", "id_rsa", ".aws/credentials", "/etc/passwd", "/etc/shadow"];

const INTERNAL_URL_PATTERNS = [
  /^https?:\/\/localhost([:\/]|$)/,
  /^https?:\/\/127\.0\.0\.1([:\/]|$)/,
  /^https?:\/\/0\.0\.0\.0([:\/]|$)/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}([:\/]|$)/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}([:\/]|$)/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}([:\/]|$)/,
];

function matchesDangerousCommand(command: string): string | null {
  for (const pattern of DANGEROUS_COMMANDS) {
    if (pattern.test(command)) return pattern.source;
  }
  return null;
}

function matchesSensitivePath(path: string): string | null {
  const normalized = path.replace(/\\/g, "/");
  for (const s of SENSITIVE_PATHS) {
    if (normalized.includes(s)) return s;
  }
  return null;
}

function isOutsideWorkspace(filePath: string, cwd: string): boolean {
  // Resolve ".." and symlinks to prevent path traversal bypass
  const resolved = resolve(cwd, filePath).replace(/\\/g, "/");
  const cwdNorm = cwd.replace(/\\/g, "/").replace(/\/$/, "");
  return !resolved.startsWith(cwdNorm + "/") && resolved !== cwdNorm;
}

function matchesInternalUrl(url: string): boolean {
  return INTERNAL_URL_PATTERNS.some((p) => p.test(url));
}

/** Safely compile a regex with a timeout-like guard against catastrophic backtracking. */
function safeRegexTest(pattern: string, input: string): boolean {
  try {
    // Reject patterns with obvious ReDoS risk: nested quantifiers like (a+)+
    if (/([+*])\)?[+*]/.test(pattern)) return false;
    return new RegExp(pattern).test(input);
  } catch {
    return false; // invalid regex → skip, don't crash
  }
}

export function evaluate(req: PolicyRequest, custom?: CustomRules): PolicyDecision {
  const { tool, context } = req;
  const name = tool.name.toLowerCase();
  const args = tool.args ?? {};

  if (name === "exec" || name === "bash" || name === "shell" || name === "process") {
    const command = String(args.command ?? args.cmd ?? "");
    if (!command) return { decision: "allow", reason: "no_matching_rule" };
    const match = matchesDangerousCommand(command);
    if (match) return { decision: "deny", reason: `dangerous_command: ${match}` };
    if (custom?.denyCommands) {
      for (const pattern of custom.denyCommands) {
        if (safeRegexTest(pattern, command)) return { decision: "deny", reason: `custom_deny_command: ${pattern}` };
      }
    }
  }

  if (name === "write" || name === "edit" || name === "apply_patch") {
    const path = String(args.path ?? args.file_path ?? args.target ?? "");
    if (!path) return { decision: "allow", reason: "no_matching_rule" };
    const sensitive = matchesSensitivePath(path);
    if (sensitive) return { decision: "deny", reason: `sensitive_path: ${sensitive}` };
    if (custom?.denyPaths && path) {
      const normalized = path.replace(/\\/g, "/");
      for (const pattern of custom.denyPaths) {
        if (normalized.includes(pattern)) return { decision: "deny", reason: `custom_deny_path: ${pattern}` };
      }
    }
    if (context.cwd && path && isOutsideWorkspace(path, context.cwd)) {
      return { decision: "deny", reason: `outside_workspace: path=${path} cwd=${context.cwd}` };
    }
  }

  if (name === "browser" || name === "navigate" || name === "web_fetch") {
    const url = String(args.url ?? args.href ?? "");
    if (url && matchesInternalUrl(url)) return { decision: "ask", reason: `internal_url: ${url}` };
  }

  return { decision: "allow", reason: "no_matching_rule" };
}

/** Return the list of built-in rules for display. */
export function getBuiltInRules(): Array<{ description: string; decision: string; tools: string }> {
  return [
    { description: "Dangerous commands (rm -rf, mkfs, dd, chmod -R /, poweroff, reboot, shutdown)", decision: "deny", tools: "exec, bash, shell, process" },
    { description: "Sensitive paths (.env, .ssh/, id_rsa, .aws/credentials, /etc/passwd, /etc/shadow)", decision: "deny", tools: "write, edit, apply_patch" },
    { description: "Writes outside workspace directory", decision: "deny", tools: "write, edit, apply_patch" },
    { description: "Internal URLs (localhost, 127.0.0.1, private IPs)", decision: "ask", tools: "browser, navigate, web_fetch" },
  ];
}
