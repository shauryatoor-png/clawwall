import React from "react";
import { Box, Text } from "ink";
import type { DaemonStats } from "../../rules/types.js";

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

type Props = {
  connected: boolean;
  port: number;
  stats: DaemonStats;
};

export function Header({ connected, port, stats }: Props): React.ReactElement {
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text bold> ClawWall v0.1.0 </Text>
      <Text>
        {connected ? (
          <Text color="green"> CONNECTED </Text>
        ) : (
          <Text color="red"> DISCONNECTED </Text>
        )}
      </Text>
      {connected && (
        <Text>
          <Text dimColor>Up </Text>
          <Text>{formatUptime(stats.uptime)}</Text>
          <Text dimColor> | Port </Text>
          <Text>{port}</Text>
        </Text>
      )}
    </Box>
  );
}
