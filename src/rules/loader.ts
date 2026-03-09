import { readFileSync } from "node:fs";
import type { CustomRules } from "./types.js";

export function loadCustomRules(path?: string): CustomRules | undefined {
  if (!path) return undefined;
  try {
    const raw = readFileSync(path, "utf8");
    return JSON.parse(raw) as CustomRules;
  } catch (err) {
    console.error(`[clawwall] failed to load rules from ${path}: ${String(err)}`);
    return undefined;
  }
}
