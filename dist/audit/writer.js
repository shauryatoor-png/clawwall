import { appendFileSync, mkdirSync } from "node:fs";
let auditDir = "/tmp/clawwall";
let fileEnabled = true;
export function configureAudit(opts) {
    if (opts.dir)
        auditDir = opts.dir;
    if (opts.fileEnabled !== undefined)
        fileEnabled = opts.fileEnabled;
}
function getAuditFilePath() {
    const date = new Date().toISOString().slice(0, 10);
    return `${auditDir}/clawwall-${date}.audit.jsonl`;
}
export function writeAuditEntry(entry) {
    const line = JSON.stringify(entry) + "\n";
    process.stdout.write(line);
    if (fileEnabled) {
        try {
            mkdirSync(auditDir, { recursive: true });
            appendFileSync(getAuditFilePath(), line);
        }
        catch {
            // never block on logging failures
        }
    }
}
export function getAuditDir() {
    return auditDir;
}
//# sourceMappingURL=writer.js.map