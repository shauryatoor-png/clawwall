import { appendFileSync, mkdirSync } from "node:fs";
import type { AuditEntry } from "../rules/types.js";

let auditDir = "/tmp/clawwall";
let fileEnabled = true;

export function configureAudit(opts: { dir?: string; fileEnabled?: boolean }) {
  if (opts.dir) auditDir = opts.dir;
  if (opts.fileEnabled !== undefined) fileEnabled = opts.fileEnabled;
}

function getAuditFilePath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${auditDir}/clawwall-${date}.audit.jsonl`;
}

export function writeAuditEntry(entry: AuditEntry): void {
  const line = JSON.stringify(entry) + "\n";
  process.stdout.write(line);
  if (fileEnabled) {
    try {
      mkdirSync(auditDir, { recursive: true });
      appendFileSync(getAuditFilePath(), line);
    } catch {
      // never block on logging failures
    }
  }
}

export function getAuditDir(): string {
  return auditDir;
}
