import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { homedir } from "node:os";

const DATA_DIR = `${homedir()}/.clawwall`;
const PID_FILE = `${DATA_DIR}/clawwall.pid`;

export function getDataDir(): string {
  return DATA_DIR;
}

export function ensureDataDir(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(`${DATA_DIR}/audit`, { recursive: true });
}

export function writePid(pid: number): void {
  ensureDataDir();
  writeFileSync(PID_FILE, String(pid), "utf8");
}

export function readPid(): number | null {
  try {
    const raw = readFileSync(PID_FILE, "utf8").trim();
    const pid = parseInt(raw, 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

export function removePid(): void {
  try {
    unlinkSync(PID_FILE);
  } catch {
    // already gone
  }
}

export function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getDaemonStatus(): { running: boolean; pid: number | null } {
  const pid = readPid();
  if (pid === null) return { running: false, pid: null };
  if (isProcessAlive(pid)) return { running: true, pid };
  // Stale PID file
  removePid();
  return { running: false, pid: null };
}
