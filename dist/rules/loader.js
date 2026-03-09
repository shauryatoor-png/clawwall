import { readFileSync } from "node:fs";
export function loadCustomRules(path) {
    if (!path)
        return undefined;
    try {
        const raw = readFileSync(path, "utf8");
        return JSON.parse(raw);
    }
    catch (err) {
        console.error(`[clawwall] failed to load rules from ${path}: ${String(err)}`);
        return undefined;
    }
}
//# sourceMappingURL=loader.js.map