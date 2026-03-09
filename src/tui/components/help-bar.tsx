import React from "react";
import { Box, Text } from "ink";

export function HelpBar(): React.ReactElement {
  return (
    <Box paddingX={1} justifyContent="center" gap={2}>
      <Text dimColor>[q] Quit</Text>
      <Text dimColor>[y/n] Approve/Deny</Text>
      <Text dimColor>[↑↓] Navigate</Text>
    </Box>
  );
}
