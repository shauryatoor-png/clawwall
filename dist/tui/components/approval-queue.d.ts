import React from "react";
import type { PendingAsk } from "../hooks/use-websocket.js";
type Props = {
    pending: PendingAsk[];
    onResolve: (id: string, decision: "allow" | "deny") => void;
};
export declare function ApprovalQueue({ pending, onResolve }: Props): React.ReactElement;
export {};
