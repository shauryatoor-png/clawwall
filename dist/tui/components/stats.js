import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
function bar(count, max, width = 16) {
    if (max === 0)
        return "";
    const filled = Math.round((count / max) * width);
    return "█".repeat(filled) + "░".repeat(width - filled);
}
export function Stats({ stats }) {
    const total = stats.allow + stats.deny + stats.ask;
    const max = Math.max(stats.allow, stats.deny, stats.ask, 1);
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 1, children: [_jsx(Text, { bold: true, children: " Stats " }), _jsxs(Text, { children: [_jsx(Text, { color: "green", children: " Allow: " }), _jsxs(Text, { children: [String(stats.allow).padStart(5), " "] }), _jsx(Text, { color: "green", children: bar(stats.allow, max) })] }), _jsxs(Text, { children: [_jsx(Text, { color: "red", children: " Deny:  " }), _jsxs(Text, { children: [String(stats.deny).padStart(5), " "] }), _jsx(Text, { color: "red", children: bar(stats.deny, max) })] }), _jsxs(Text, { children: [_jsx(Text, { color: "yellow", children: " Ask:   " }), _jsxs(Text, { children: [String(stats.ask).padStart(5), " "] }), _jsx(Text, { color: "yellow", children: bar(stats.ask, max) })] }), _jsxs(Text, { dimColor: true, children: [" Total: ", total] })] }));
}
//# sourceMappingURL=stats.js.map