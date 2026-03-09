import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { PendingAsk } from "../hooks/use-websocket.js";

type Props = {
  pending: PendingAsk[];
  onResolve: (id: string, decision: "allow" | "deny") => void;
};

export function ApprovalQueue({ pending, onResolve }: Props): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (pending.length === 0) return;
    const idx = Math.min(selectedIndex, pending.length - 1);
    const item = pending[idx];
    if (!item) return;

    if (input === "y" || input === "Y") {
      onResolve(item.id, "allow");
    } else if (input === "n" || input === "N") {
      onResolve(item.id, "deny");
    } else if (key.upArrow) {
      setSelectedIndex(Math.max(0, idx - 1));
    } else if (key.downArrow) {
      setSelectedIndex(Math.min(pending.length - 1, idx + 1));
    }
  });

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold> Approval Queue ({pending.length} pending) </Text>
      {pending.length === 0 ? (
        <Text dimColor>  No pending approvals</Text>
      ) : (
        pending.map((p, i) => {
          const selected = i === Math.min(selectedIndex, pending.length - 1);
          return (
            <Box key={p.id} flexDirection="column">
              <Text>
                {selected ? <Text color="cyan">{">"} </Text> : <Text>  </Text>}
                <Text bold color="yellow">{p.tool}</Text>
                <Text dimColor> {p.reason}</Text>
              </Text>
              {selected && (
                <Text>
                  {"    "}
                  <Text color="green">[Y]</Text><Text> Approve  </Text>
                  <Text color="red">[N]</Text><Text> Deny</Text>
                </Text>
              )}
            </Box>
          );
        })
      )}
    </Box>
  );
}
