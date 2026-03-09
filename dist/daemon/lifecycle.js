import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writePid, removePid, getDaemonStatus, getDataDir } from "./pid.js";
import { startServer } from "../server/index.js";
/**
 * Start the daemon in the foreground (blocking).
 * Writes PID, registers signal handlers, starts server.
 */
export function startForeground(port) {
    const { running, pid } = getDaemonStatus();
    if (running) {
        console.error(`[clawwall] already running (PID ${pid})`);
        process.exit(1);
    }
    writePid(process.pid);
    const cleanup = () => {
        removePid();
        process.exit(0);
    };
    process.on("SIGTERM", cleanup);
    process.on("SIGINT", cleanup);
    startServer({
        port,
        auditDir: `${getDataDir()}/audit`,
    });
}
/**
 * Start the daemon in the background (detached).
 * Spawns a child process and exits.
 */
export function startBackground(port) {
    const { running, pid } = getDaemonStatus();
    if (running) {
        console.log(`ClawWall already running (PID ${pid})`);
        return;
    }
    // Resolve the CLI entry point
    const thisFile = fileURLToPath(import.meta.url);
    const cliEntry = join(dirname(thisFile), "..", "cli", "index.js");
    const child = spawn(process.execPath, [cliEntry, "start", "--foreground", "--port", String(port)], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env },
    });
    child.unref();
    if (child.pid) {
        console.log(`ClawWall started (PID ${child.pid}) on port ${port}`);
    }
    else {
        console.error("Failed to start ClawWall daemon");
        process.exit(1);
    }
}
/**
 * Stop the running daemon.
 * Sends SIGTERM, polls until the process exits (up to 3s), then SIGKILL if needed.
 * Always cleans up the PID file.
 */
export function stopDaemon() {
    const { running, pid } = getDaemonStatus();
    if (!running || pid === null) {
        console.log("ClawWall is not running");
        return;
    }
    // Send SIGTERM — handle case where process is already dead (stale PID)
    try {
        process.kill(pid, "SIGTERM");
    }
    catch (err) {
        const code = err.code;
        if (code === "ESRCH") {
            removePid();
            console.log("ClawWall was not running (removed stale PID file)");
        }
        else {
            console.error(`Failed to stop ClawWall: ${String(err)}`);
        }
        return;
    }
    // Poll up to 3 seconds for the process to actually exit
    const deadline = Date.now() + 3_000;
    let confirmed = false;
    while (Date.now() < deadline) {
        try {
            process.kill(pid, 0); // signal 0 = existence check; throws ESRCH when gone
        }
        catch {
            confirmed = true; // process exited cleanly
            break;
        }
    }
    // SIGTERM wasn't enough in 3s — force kill
    if (!confirmed) {
        try {
            process.kill(pid, "SIGKILL");
        }
        catch { }
    }
    removePid(); // ensure PID file is cleaned up (daemon may have already done this)
    console.log(`ClawWall stopped (PID ${pid})`);
}
//# sourceMappingURL=lifecycle.js.map