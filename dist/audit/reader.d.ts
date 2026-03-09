import type { AuditEntry } from "../rules/types.js";
export declare function readAuditLog(dir: string, maxLines?: number): AuditEntry[];
export declare function tailAuditLog(dir: string, onEntry: (entry: AuditEntry) => void, signal?: AbortSignal): () => void;
