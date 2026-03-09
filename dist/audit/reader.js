import { readFileSync, readdirSync, watchFile, unwatchFile } from "node:fs";
import { join } from "node:path";
export function readAuditLog(dir, maxLines = 100) {
    try {
        const files = readdirSync(dir)
            .filter((f) => f.endsWith(".audit.jsonl"))
            .sort()
            .reverse();
        if (files.length === 0)
            return [];
        const content = readFileSync(join(dir, files[0]), "utf8");
        const lines = content.trim().split("\n").filter(Boolean);
        return lines.slice(-maxLines).map((l) => JSON.parse(l));
    }
    catch {
        return [];
    }
}
export function tailAuditLog(dir, onEntry, signal) {
    const date = new Date().toISOString().slice(0, 10);
    const filePath = join(dir, `clawwall-${date}.audit.jsonl`);
    let lastSize = 0;
    try {
        lastSize = readFileSync(filePath, "utf8").length;
    }
    catch {
        // file may not exist yet
    }
    const onChange = () => {
        try {
            const content = readFileSync(filePath, "utf8");
            if (content.length > lastSize) {
                const newContent = content.slice(lastSize);
                lastSize = content.length;
                const lines = newContent.trim().split("\n").filter(Boolean);
                for (const line of lines) {
                    try {
                        onEntry(JSON.parse(line));
                    }
                    catch { /* skip malformed */ }
                }
            }
        }
        catch { /* file may be gone */ }
    };
    watchFile(filePath, { interval: 500 }, onChange);
    const cleanup = () => {
        unwatchFile(filePath, onChange);
    };
    signal?.addEventListener("abort", cleanup, { once: true });
    return cleanup;
}
//# sourceMappingURL=reader.js.map