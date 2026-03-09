import chalk from "chalk";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { getDataDir } from "../../daemon/pid.js";
import type { CustomRules } from "../../rules/types.js";

const RULES_PATH = `${getDataDir()}/rules.json`;

function loadLocalRules(): CustomRules {
  try {
    return JSON.parse(readFileSync(RULES_PATH, "utf8")) as CustomRules;
  } catch {
    return {};
  }
}

function saveLocalRules(rules: CustomRules): void {
  mkdirSync(getDataDir(), { recursive: true });
  writeFileSync(RULES_PATH, JSON.stringify(rules, null, 2) + "\n", "utf8");
}

export async function rulesCommand(action?: string, value?: string, opts?: { port?: string }): Promise<void> {
  const port = Number(opts?.port) || 7654;

  if (!action || action === "list") {
    // List built-in + custom rules
    try {
      const res = await fetch(`http://localhost:${port}/rules`);
      if (res.ok) {
        const data = await res.json() as { builtIn: Array<{ description: string; decision: string; tools: string }>; custom: CustomRules | null };
        console.log(chalk.bold("Built-in rules:"));
        data.builtIn.forEach((r, i) => {
          const tag = r.decision === "deny" ? chalk.red("DENY") : chalk.yellow("ASK");
          console.log(`  ${i + 1}. [${tag}] ${r.description}`);
          console.log(chalk.dim(`     Tools: ${r.tools}`));
        });
        if (data.custom) {
          console.log("");
          console.log(chalk.bold("Custom rules:"));
          if (data.custom.denyCommands?.length) {
            console.log(chalk.dim("  Deny commands:"));
            data.custom.denyCommands.forEach((c) => console.log(`    - ${chalk.red(c)}`));
          }
          if (data.custom.denyPaths?.length) {
            console.log(chalk.dim("  Deny paths:"));
            data.custom.denyPaths.forEach((p) => console.log(`    - ${chalk.red(p)}`));
          }
        }
        return;
      }
    } catch { /* daemon not running, fall through */ }

    // Fallback: show local rules file
    const rules = loadLocalRules();
    console.log(chalk.bold("Custom rules") + chalk.dim(` (${RULES_PATH}):`));
    if (!rules.denyCommands?.length && !rules.denyPaths?.length) {
      console.log(chalk.dim("  (none)"));
    }
    if (rules.denyCommands?.length) {
      console.log("  Deny commands:");
      rules.denyCommands.forEach((c) => console.log(`    - ${c}`));
    }
    if (rules.denyPaths?.length) {
      console.log("  Deny paths:");
      rules.denyPaths.forEach((p) => console.log(`    - ${p}`));
    }
    return;
  }

  if (action === "add-command" && value) {
    const rules = loadLocalRules();
    rules.denyCommands = rules.denyCommands ?? [];
    rules.denyCommands.push(value);
    saveLocalRules(rules);
    console.log(`Added deny command pattern: ${chalk.red(value)}`);
    await reloadDaemonRules(port);
    return;
  }

  if (action === "add-path" && value) {
    const rules = loadLocalRules();
    rules.denyPaths = rules.denyPaths ?? [];
    rules.denyPaths.push(value);
    saveLocalRules(rules);
    console.log(`Added deny path pattern: ${chalk.red(value)}`);
    await reloadDaemonRules(port);
    return;
  }

  if (action === "remove-command" && value) {
    const rules = loadLocalRules();
    rules.denyCommands = (rules.denyCommands ?? []).filter((c) => c !== value);
    saveLocalRules(rules);
    console.log(`Removed deny command pattern: ${value}`);
    await reloadDaemonRules(port);
    return;
  }

  if (action === "remove-path" && value) {
    const rules = loadLocalRules();
    rules.denyPaths = (rules.denyPaths ?? []).filter((p) => p !== value);
    saveLocalRules(rules);
    console.log(`Removed deny path pattern: ${value}`);
    await reloadDaemonRules(port);
    return;
  }

  console.log("Usage: clawwall rules [list|add-command|add-path|remove-command|remove-path] [pattern]");
}

async function reloadDaemonRules(port: number): Promise<void> {
  try {
    await fetch(`http://localhost:${port}/rules/reload`, { method: "POST" });
    console.log(chalk.dim("Daemon rules reloaded"));
  } catch {
    console.log(chalk.dim("(daemon not running, rules saved locally)"));
  }
}
