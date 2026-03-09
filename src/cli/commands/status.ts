import chalk from "chalk";
import { getDaemonStatus } from "../../daemon/pid.js";

export async function statusCommand(opts: { port?: string }): Promise<void> {
  const port = Number(opts.port) || 7654;
  const { running, pid } = getDaemonStatus();

  console.log(chalk.bold("ClawWall v0.1.0"));
  console.log("");

  if (!running) {
    console.log(`Status: ${chalk.red("stopped")}`);
    console.log("");
    console.log(`Start with: ${chalk.cyan("clawwall start")}`);
    return;
  }

  console.log(`Status: ${chalk.green("running")} (PID ${pid})`);
  console.log(`Port:   ${port}`);

  // Fetch stats from the running daemon
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://localhost:${port}/stats`, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const stats = await res.json() as { allow: number; deny: number; ask: number; uptime: number };
      const uptime = formatUptime(stats.uptime);
      const total = stats.allow + stats.deny + stats.ask;
      console.log(`Uptime: ${uptime}`);
      console.log(`Checks: ${total} total (${chalk.green(stats.allow + " allow")}, ${chalk.red(stats.deny + " deny")}, ${chalk.yellow(stats.ask + " ask")})`);
    }
  } catch {
    console.log(chalk.dim("(could not reach daemon for stats)"));
  }
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
