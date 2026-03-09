export async function tuiCommand(opts) {
    const port = Number(opts.port) || 7654;
    // Dynamic import to avoid loading React/Ink unless TUI is requested
    const { renderApp } = await import("../../tui/app.js");
    await renderApp(port);
}
//# sourceMappingURL=tui.js.map