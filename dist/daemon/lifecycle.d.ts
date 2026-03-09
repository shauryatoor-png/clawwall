/**
 * Start the daemon in the foreground (blocking).
 * Writes PID, registers signal handlers, starts server.
 */
export declare function startForeground(port: number): void;
/**
 * Start the daemon in the background (detached).
 * Spawns a child process and exits.
 */
export declare function startBackground(port: number): void;
/**
 * Stop the running daemon.
 * Sends SIGTERM, polls until the process exits (up to 3s), then SIGKILL if needed.
 * Always cleans up the PID file.
 */
export declare function stopDaemon(): void;
