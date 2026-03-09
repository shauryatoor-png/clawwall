import React from "react";
import { Box, Text } from "ink";
import type { PolicyEvent } from "../hooks/use-websocket.js";

type Props = {
  events: PolicyEvent[];
  maxVisible?: number;
};

function decisionColor(d: string): string {
  if (d === "allow") return "green";
  if (d === "deny") return "red";
  return "yellow";
}

function decisionLabel(d: string): string {
  if (d === "allow") return "ALLOW";
  if (d === "deny") return "DENY ";
  return "ASK  ";
}

export function LiveFeed({ events, maxVisible = 15 }: Props): React.ReactElement {
  const visible = events.slice(-maxVisible);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1} flexGrow={1}>
      <Text bold> Live Feed </Text>
      {visible.length === 0 ? (
        <Text dimColor>  Waiting for tool calls...</Text>
      ) : (
        visible.map((e) => (
          <Text key={e.id}>
            <Text dimColor>{e.ts.slice(11, 19)} </Text>
            <Text color={decisionColor(e.decision)}>{decisionLabel(e.decision)} </Text>
            <Text bold>{e.tool} </Text>
            <Text dimColor>{truncate(e.reason, 40)}</Text>
          </Text>
        ))
      )}
    </Box>
  );
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + "...";
}
