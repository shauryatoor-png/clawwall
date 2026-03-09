#!/usr/bin/env node
import { Command } from "commander";
import { startCommand } from "./commands/start.js";
import { stopCommand } from "./commands/stop.js";
import { statusCommand } from "./commands/status.js";
import { tuiCommand } from "./commands/tui.js";
import { rulesCommand } from "./commands/rules.js";
import { logsCommand } from "./commands/logs.js";
import { installLaunchdCommand } from "./commands/install-launchd.js";

const program = new Command()
  .name("clawwall")
  .description("Firewall for AI coding agents — protect your Mac while using OpenClaw")
  .version("0.1.0");

program
  .command("start")
  .description("Start the ClawWall daemon")
  .option("--foreground", "Run in foreground (don't daemonize)")
  .option("--port <port>", "Port number", "7654")
  .action(startCommand);

program
  .command("stop")
  .description("Stop the ClawWall daemon")
  .action(stopCommand);

program
  .command("status")
  .description("Show daemon status and stats")
  .option("--port <port>", "Port number", "7654")
  .action(statusCommand);

program
  .command("tui")
  .description("Open the interactive dashboard")
  .option("--port <port>", "Port number", "7654")
  .action(tuiCommand);

program
  .command("rules [action] [pattern]")
  .description("Manage policy rules (list, add-command, add-path, remove-command, remove-path)")
  .option("--port <port>", "Port number", "7654")
  .action(rulesCommand);

program
  .command("logs")
  .description("View audit logs")
  .option("--follow, -f", "Tail mode — follow new entries")
  .option("--lines <n>", "Number of lines to show", "50")
  .action(logsCommand);

program
  .command("install-launchd")
  .description("Install macOS launchd service for auto-start on login")
  .option("--port <port>", "Port number", "7654")
  .action(installLaunchdCommand);

// Default: show help
program.action(() => {
  program.help();
});

program.parse();
