import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { render, Box, useApp, useInput } from "ink";
import { Header } from "./components/header.js";
import { LiveFeed } from "./components/live-feed.js";
import { ApprovalQueue } from "./components/approval-queue.js";
import { Stats } from "./components/stats.js";
import { HelpBar } from "./components/help-bar.js";
import { useWebSocket } from "./hooks/use-websocket.js";
function App({ port }) {
    const { connected, events, pending, stats, resolve } = useWebSocket(port);
    const { exit } = useApp();
    useInput((input) => {
        if (input === "q")
            exit();
    });
    return (_jsxs(Box, { flexDirection: "column", width: "100%", children: [_jsx(Header, { connected: connected, port: port, stats: stats }), _jsxs(Box, { flexDirection: "row", flexGrow: 1, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, width: "60%", children: [_jsx(LiveFeed, { events: events }), _jsx(ApprovalQueue, { pending: pending, onResolve: resolve })] }), _jsx(Box, { flexDirection: "column", width: "40%", children: _jsx(Stats, { stats: stats }) })] }), _jsx(HelpBar, {})] }));
}
export async function renderApp(port) {
    const { waitUntilExit } = render(React.createElement(App, { port }));
    await waitUntilExit();
}
//# sourceMappingURL=app.js.map