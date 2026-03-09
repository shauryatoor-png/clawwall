import React from "react";
import type { PolicyEvent } from "../hooks/use-websocket.js";
type Props = {
    events: PolicyEvent[];
    maxVisible?: number;
};
export declare function LiveFeed({ events, maxVisible }: Props): React.ReactElement;
export {};
