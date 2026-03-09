import { createServer } from "node:http";
export type ServerOptions = {
    port?: number;
    rulesFile?: string;
    auditDir?: string;
    auditFileEnabled?: boolean;
    askTimeoutMs?: number;
};
export declare function startServer(opts?: ServerOptions): ReturnType<typeof createServer>;
