export async function tuiCommand(opts: { port?: string }): Promise<void> {
  const port = Number(opts.port) || 7654;

  // Dynamic import to avoid loading React/Ink unless TUI is requested
  const { renderApp } = await import("../../tui/app.js");
  await renderApp(port);
}
