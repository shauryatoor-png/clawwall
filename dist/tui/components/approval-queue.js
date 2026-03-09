import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { Box, Text, useInput } from "ink";
export function ApprovalQueue({ pending, onResolve }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    useInput((input, key) => {
        if (pending.length === 0)
            return;
        const idx = Math.min(selectedIndex, pending.length - 1);
        const item = pending[idx];
        if (!item)
            return;
        if (input === "y" || input === "Y") {
            onResolve(item.id, "allow");
        }
        else if (input === "n" || input === "N") {
            onResolve(item.id, "deny");
        }
        else if (key.upArrow) {
            setSelectedIndex(Math.max(0, idx - 1));
        }
        else if (key.downArrow) {
            setSelectedIndex(Math.min(pending.length - 1, idx + 1));
        }
    });
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 1, children: [_jsxs(Text, { bold: true, children: [" Approval Queue (", pending.length, " pending) "] }), pending.length === 0 ? (_jsx(Text, { dimColor: true, children: "  No pending approvals" })) : (pending.map((p, i) => {
                const selected = i === Math.min(selectedIndex, pending.length - 1);
                return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [selected ? _jsxs(Text, { color: "cyan", children: [">", " "] }) : _jsx(Text, { children: "  " }), _jsx(Text, { bold: true, color: "yellow", children: p.tool }), _jsxs(Text, { dimColor: true, children: [" ", p.reason] })] }), selected && (_jsxs(Text, { children: ["    ", _jsx(Text, { color: "green", children: "[Y]" }), _jsx(Text, { children: " Approve  " }), _jsx(Text, { color: "red", children: "[N]" }), _jsx(Text, { children: " Deny" })] }))] }, p.id));
            }))] }));
}
//# sourceMappingURL=approval-queue.js.map