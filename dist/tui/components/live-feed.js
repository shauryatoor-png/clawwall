import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
function decisionColor(d) {
    if (d === "allow")
        return "green";
    if (d === "deny")
        return "red";
    return "yellow";
}
function decisionLabel(d) {
    if (d === "allow")
        return "ALLOW";
    if (d === "deny")
        return "DENY ";
    return "ASK  ";
}
export function LiveFeed({ events, maxVisible = 15 }) {
    const visible = events.slice(-maxVisible);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 1, flexGrow: 1, children: [_jsx(Text, { bold: true, children: " Live Feed " }), visible.length === 0 ? (_jsx(Text, { dimColor: true, children: "  Waiting for tool calls..." })) : (visible.map((e) => (_jsxs(Text, { children: [_jsxs(Text, { dimColor: true, children: [e.ts.slice(11, 19), " "] }), _jsxs(Text, { color: decisionColor(e.decision), children: [decisionLabel(e.decision), " "] }), _jsxs(Text, { bold: true, children: [e.tool, " "] }), _jsx(Text, { dimColor: true, children: truncate(e.reason, 40) })] }, e.id))))] }));
}
function truncate(s, max) {
    return s.length <= max ? s : s.slice(0, max - 3) + "...";
}
//# sourceMappingURL=live-feed.js.map