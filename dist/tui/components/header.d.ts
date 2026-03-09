import React from "react";
import type { DaemonStats } from "../../rules/types.js";
type Props = {
    connected: boolean;
    port: number;
    stats: DaemonStats;
};
export declare function Header({ connected, port, stats }: Props): React.ReactElement;
export {};
