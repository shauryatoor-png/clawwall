import type { AuditEntry } from "../rules/types.js";
export declare function configureAudit(opts: {
    dir?: string;
    fileEnabled?: boolean;
}): void;
export declare function writeAuditEntry(entry: AuditEntry): void;
export declare function getAuditDir(): string;
