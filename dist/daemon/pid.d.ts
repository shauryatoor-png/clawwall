export declare function getDataDir(): string;
export declare function ensureDataDir(): void;
export declare function writePid(pid: number): void;
export declare function readPid(): number | null;
export declare function removePid(): void;
export declare function isProcessAlive(pid: number): boolean;
export declare function getDaemonStatus(): {
    running: boolean;
    pid: number | null;
};
