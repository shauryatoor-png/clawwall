import React from "react";
import { Box, Text } from "ink";
import type { DaemonStats } from "../../rules/types.js";

type Props = {
  stats: DaemonStats;
};

function bar(count: number, max: number, width: number = 16): string {
  if (max === 0) return "";
  const filled = Math.round((count / max) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function Stats({ stats }: Props): React.ReactElement {
  const total = stats.allow + stats.deny + stats.ask;
  const max = Math.max(stats.allow, stats.deny, stats.ask, 1);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold> Stats </Text>
      <Text>
        <Text color="green"> Allow: </Text>
        <Text>{String(stats.allow).padStart(5)} </Text>
        <Text color="green">{bar(stats.allow, max)}</Text>
      </Text>
      <Text>
        <Text color="red"> Deny:  </Text>
        <Text>{String(stats.deny).padStart(5)} </Text>
        <Text color="red">{bar(stats.deny, max)}</Text>
      </Text>
      <Text>
        <Text color="yellow"> Ask:   </Text>
        <Text>{String(stats.ask).padStart(5)} </Text>
        <Text color="yellow">{bar(stats.ask, max)}</Text>
      </Text>
      <Text dimColor> Total: {total}</Text>
    </Box>
  );
}
