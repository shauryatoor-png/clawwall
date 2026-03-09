import { installLaunchd } from "../../daemon/launchd.js";

export function installLaunchdCommand(opts: { port?: string }): void {
  const port = Number(opts.port) || 7654;
  installLaunchd(port);
}
