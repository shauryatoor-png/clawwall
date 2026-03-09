import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0)
        return `${h}h ${m % 60}m`;
    if (m > 0)
        return `${m}m ${s % 60}s`;
    return `${s}s`;
}
export function Header({ connected, port, stats }) {
    return (_jsxs(Box, { borderStyle: "single", paddingX: 1, justifyContent: "space-between", children: [_jsx(Text, { bold: true, children: " ClawWall v0.1.0 " }), _jsx(Text, { children: connected ? (_jsx(Text, { color: "green", children: " CONNECTED " })) : (_jsx(Text, { color: "red", children: " DISCONNECTED " })) }), connected && (_jsxs(Text, { children: [_jsx(Text, { dimColor: true, children: "Up " }), _jsx(Text, { children: formatUptime(stats.uptime) }), _jsx(Text, { dimColor: true, children: " | Port " }), _jsx(Text, { children: port })] }))] }));
}
//# sourceMappingURL=header.js.map