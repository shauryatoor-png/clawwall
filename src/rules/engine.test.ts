import { describe, expect, it } from "vitest";
import { evaluate } from "./engine.js";
import type { PolicyRequest } from "./types.js";

function req(tool: string, args: Record<string, unknown>, ctx?: Partial<PolicyRequest["context"]>): PolicyRequest {
  return { agent_id: "test", tool: { name: tool, args }, context: ctx ?? {} };
}

describe("ClawWall rules — exec deny", () => {
  it.each([
    ["rm -rf /", "rm -rf"],
    ["sudo rm -rf /tmp", "rm -rf"],
    ["mkfs.ext4 /dev/sda", "mkfs"],
    ["dd if=/dev/zero of=/dev/sda", "dd if="],
    ["chmod -R / 777", "chmod -R /"],
    ["poweroff", "poweroff"],
    ["reboot", "reboot"],
    ["shutdown -h now", "shutdown"],
  ])("denies dangerous command: %s", (command, _pattern) => {
    const result = evaluate(req("exec", { command }));
    expect(result.decision).toBe("deny");
    expect(result.reason).toMatch(/dangerous_command/);
  });

  it("allows safe exec commands", () => {
    expect(evaluate(req("exec", { command: "ls -la" })).decision).toBe("allow");
    expect(evaluate(req("bash", { command: "npm install" })).decision).toBe("allow");
    expect(evaluate(req("shell", { command: "git status" })).decision).toBe("allow");
  });

  it("treats process tool the same as exec", () => {
    expect(evaluate(req("process", { command: "rm -rf /" })).decision).toBe("deny");
    expect(evaluate(req("process", { command: "shutdown -h now" })).decision).toBe("deny");
    expect(evaluate(req("process", { command: "ls -la" })).decision).toBe("allow");
  });
});

describe("ClawWall rules — sensitive path deny", () => {
  it.each([
    [".env"],
    ["/home/user/.ssh/id_rsa"],
    ["/project/.aws/credentials"],
    ["/etc/passwd"],
    ["/etc/shadow"],
  ])("denies write to sensitive path: %s", (path) => {
    const result = evaluate(req("write", { path }));
    expect(result.decision).toBe("deny");
    expect(result.reason).toMatch(/sensitive_path/);
  });

  it("denies edit to sensitive path", () => {
    expect(evaluate(req("edit", { file_path: "/app/.env" })).decision).toBe("deny");
  });

  it("denies apply_patch to sensitive path", () => {
    expect(evaluate(req("apply_patch", { target: "/root/.ssh/config" })).decision).toBe("deny");
  });

  it("allows write to normal paths", () => {
    expect(evaluate(req("write", { path: "/project/src/index.ts" })).decision).toBe("allow");
  });
});

describe("ClawWall rules — workspace boundary", () => {
  it("denies write outside cwd", () => {
    const result = evaluate(req("write", { path: "/etc/nginx/nginx.conf" }, { cwd: "/home/user/project" }));
    expect(result.decision).toBe("deny");
    expect(result.reason).toMatch(/outside_workspace/);
  });

  it("allows write inside cwd", () => {
    const result = evaluate(req("write", { path: "/home/user/project/src/file.ts" }, { cwd: "/home/user/project" }));
    expect(result.decision).toBe("allow");
  });

  it("skips workspace check when no cwd", () => {
    const result = evaluate(req("write", { path: "/some/random/path.ts" }));
    expect(result.decision).toBe("allow");
  });
});

describe("ClawWall rules — internal URL ask", () => {
  it.each([
    ["http://localhost:3000"],
    ["http://127.0.0.1:8080/api"],
    ["http://0.0.0.0:5000"],
    ["http://10.0.0.1/admin"],
    ["http://192.168.1.1/dashboard"],
    ["http://172.16.0.1/internal"],
    ["http://172.31.255.255/test"],
  ])("returns ask for internal URL: %s", (url) => {
    const result = evaluate(req("browser", { url }));
    expect(result.decision).toBe("ask");
    expect(result.reason).toMatch(/internal_url/);
  });

  it("allows external URLs", () => {
    expect(evaluate(req("browser", { url: "https://example.com" })).decision).toBe("allow");
    expect(evaluate(req("navigate", { url: "https://github.com" })).decision).toBe("allow");
  });

  it("allows browser with no URL", () => {
    expect(evaluate(req("browser", {})).decision).toBe("allow");
  });
});

describe("ClawWall rules — custom rules", () => {
  it("denies custom command patterns", () => {
    const custom = { denyCommands: ["\\bcurl\\b.*-k"] };
    const result = evaluate(req("exec", { command: "curl -k https://example.com" }), custom);
    expect(result.decision).toBe("deny");
    expect(result.reason).toMatch(/custom_deny_command/);
  });

  it("denies custom path patterns", () => {
    const custom = { denyPaths: [".secret", "deploy/"] };
    const result = evaluate(req("write", { path: "/app/.secret/key" }), custom);
    expect(result.decision).toBe("deny");
    expect(result.reason).toMatch(/custom_deny_path/);
  });

  it("built-in rules take precedence over custom", () => {
    const custom = { denyCommands: ["ls"] };
    const result = evaluate(req("exec", { command: "rm -rf /" }), custom);
    expect(result.reason).toMatch(/dangerous_command/);
  });

  it("allows when custom rules don't match", () => {
    const custom = { denyCommands: ["\\bdanger\\b"] };
    expect(evaluate(req("exec", { command: "ls -la" }), custom).decision).toBe("allow");
  });
});

describe("ClawWall rules — default allow", () => {
  it("allows non-sensitive tools", () => {
    expect(evaluate(req("read", { path: "/any/file" })).decision).toBe("allow");
    expect(evaluate(req("search", { query: "test" })).decision).toBe("allow");
    expect(evaluate(req("unknown_tool", {})).decision).toBe("allow");
  });
});
