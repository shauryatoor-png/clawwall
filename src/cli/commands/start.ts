import { startForeground, startBackground } from "../../daemon/lifecycle.js";

export function startCommand(opts: { foreground?: boolean; port?: string }): void {
  const port = Number(opts.port) || 7654;

  if (opts.foreground) {
    startForeground(port);
  } else {
    startBackground(port);
  }
}
