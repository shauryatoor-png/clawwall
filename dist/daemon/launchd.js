import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve } from "node:path";
const LABEL = "com.clawwall.agent";
const PLIST_DIR = `${homedir()}/Library/LaunchAgents`;
const PLIST_PATH = `${PLIST_DIR}/${LABEL}.plist`;
function generatePlist(port) {
    const nodePath = process.execPath;
    // Find the clawwall bin
    let clawwallPath;
    try {
        clawwallPath = execSync("which clawwall", { encoding: "utf8" }).trim();
    }
    catch {
        clawwallPath = resolve("dist/cli/index.js");
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${clawwallPath}</string>
    <string>start</string>
    <string>--foreground</string>
    <string>--port</string>
    <string>${port}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${homedir()}/.clawwall/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${homedir()}/.clawwall/stderr.log</string>
</dict>
</plist>`;
}
export function installLaunchd(port) {
    if (process.platform !== "darwin") {
        console.error("launchd is only available on macOS");
        process.exit(1);
    }
    mkdirSync(PLIST_DIR, { recursive: true });
    // Unload existing if present
    if (existsSync(PLIST_PATH)) {
        try {
            execSync(`launchctl unload "${PLIST_PATH}"`, { stdio: "ignore" });
        }
        catch { /* may not be loaded */ }
    }
    const plist = generatePlist(port);
    writeFileSync(PLIST_PATH, plist, "utf8");
    try {
        execSync(`launchctl load "${PLIST_PATH}"`);
        console.log(`Installed launchd service: ${LABEL}`);
        console.log(`ClawWall will start automatically on login (port ${port})`);
        console.log(`Plist: ${PLIST_PATH}`);
    }
    catch (err) {
        console.error(`Failed to load launchd service: ${String(err)}`);
        process.exit(1);
    }
}
export function uninstallLaunchd() {
    if (!existsSync(PLIST_PATH)) {
        console.log("No launchd service installed");
        return;
    }
    try {
        execSync(`launchctl unload "${PLIST_PATH}"`, { stdio: "ignore" });
    }
    catch { /* may not be loaded */ }
    try {
        const { unlinkSync } = require("node:fs");
        unlinkSync(PLIST_PATH);
        console.log("Removed launchd service");
    }
    catch (err) {
        console.error(`Failed to remove plist: ${String(err)}`);
    }
}
//# sourceMappingURL=launchd.js.map