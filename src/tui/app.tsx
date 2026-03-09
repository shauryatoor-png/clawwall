import React from "react";
import { render, Box, useApp, useInput } from "ink";
import { Header } from "./components/header.js";
import { LiveFeed } from "./components/live-feed.js";
import { ApprovalQueue } from "./components/approval-queue.js";
import { Stats } from "./components/stats.js";
import { HelpBar } from "./components/help-bar.js";
import { useWebSocket } from "./hooks/use-websocket.js";

type AppProps = { port: number };

function App({ port }: AppProps): React.ReactElement {
  const { connected, events, pending, stats, resolve } = useWebSocket(port);
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") exit();
  });

  return (
    <Box flexDirection="column" width="100%">
      <Header connected={connected} port={port} stats={stats} />

      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1} width="60%">
          <LiveFeed events={events} />
          <ApprovalQueue pending={pending} onResolve={resolve} />
        </Box>
        <Box flexDirection="column" width="40%">
          <Stats stats={stats} />
        </Box>
      </Box>

      <HelpBar />
    </Box>
  );
}

export async function renderApp(port: number): Promise<void> {
  const { waitUntilExit } = render(React.createElement(App, { port }));
  await waitUntilExit();
}
