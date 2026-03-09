import { installLaunchd } from "../../daemon/launchd.js";
export function installLaunchdCommand(opts) {
    const port = Number(opts.port) || 7654;
    installLaunchd(port);
}
//# sourceMappingURL=install-launchd.js.map