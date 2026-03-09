import chalk from "chalk";
import { readAuditLog, tailAuditLog } from "../../audit/reader.js";
import { getDataDir } from "../../daemon/pid.js";
function formatEntry(e) {
    const time = e.ts.slice(11, 19);
    const decision = e.decision === "allow" ? chalk.green("ALLOW") :
        e.decision === "deny" ? chalk.red("DENY ") :
            chalk.yellow("ASK  ");
    return `${chalk.dim(time)} ${decision} ${chalk.bold(e.tool)} ${chalk.dim(e.reason)}`;
}
export function logsCommand(opts) {
    const auditDir = `${getDataDir()}/audit`;
    const maxLines = Number(opts.lines) || 50;
    if (opts.follow) {
        // Print existing entries first
        const existing = readAuditLog(auditDir, maxLines);
        for (const e of existing) {
            console.log(formatEntry(e));
        }
        console.log(chalk.dim("--- tailing audit log (Ctrl+C to stop) ---"));
        const controller = new AbortController();
        process.on("SIGINT", () => controller.abort());
        tailAuditLog(auditDir, (entry) => {
            console.log(formatEntry(entry));
        }, controller.signal);
        // Keep process alive
        const keepAlive = setInterval(() => { }, 1000);
        controller.signal.addEventListener("abort", () => {
            clearInterval(keepAlive);
            process.exit(0);
        });
    }
    else {
        const entries = readAuditLog(auditDir, maxLines);
        if (entries.length === 0) {
            console.log(chalk.dim("No audit log entries found"));
            console.log(chalk.dim(`Looking in: ${auditDir}`));
            return;
        }
        for (const e of entries) {
            console.log(formatEntry(e));
        }
    }
}
//# sourceMappingURL=logs.js.map