#!/usr/bin/env bash
set -euo pipefail

# ── ClawWall installer ──
# Runtime policy firewall for AI agents.
# curl -fsSL https://clawwall.dev/install.sh | bash

BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
RESET="\033[0m"

info()  { echo -e "${BOLD}${GREEN}[clawwall]${RESET} $1"; }
warn()  { echo -e "${BOLD}${YELLOW}[clawwall]${RESET} $1"; }
error() { echo -e "${BOLD}${RED}[clawwall]${RESET} $1" >&2; }

# ── Check prerequisites ──

if ! command -v node &>/dev/null; then
  error "Node.js is required but not found."
  error "Install it: https://nodejs.org (v20+ required)"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  error "Node.js v20+ is required (found v$(node -v | sed 's/v//'))"
  error "Upgrade: https://nodejs.org"
  exit 1
fi

info "Node.js $(node -v) detected"

# ── Install ClawWall ──

info "Installing ClawWall..."
npm install -g clawwall

# ── Create data directory ──

CLAWWALL_DIR="$HOME/.clawwall"
mkdir -p "$CLAWWALL_DIR/audit"

info "Data directory: $CLAWWALL_DIR"

# ── Verify installation ──

if ! command -v clawwall &>/dev/null; then
  error "Installation failed — 'clawwall' command not found in PATH."
  error "You may need to add npm's global bin to your PATH."
  error "Try: npm config get prefix"
  exit 1
fi

VERSION=$(clawwall --version 2>/dev/null || echo "unknown")
info "Installed ClawWall v$VERSION"

# ── Optional: install as launchd service ──

echo ""
echo -e "${BOLD}Would you like ClawWall to start automatically on login?${RESET}"
echo "  This installs a macOS launchd service."
echo ""
read -rp "  Install auto-start service? [y/N] " INSTALL_LAUNCHD

if [[ "$INSTALL_LAUNCHD" =~ ^[Yy]$ ]]; then
  clawwall install-launchd
  info "LaunchAgent installed — ClawWall will start on login."
else
  info "Skipped auto-start. You can run it later with: clawwall install-launchd"
fi

# ── Done ──

echo ""
echo -e "${BOLD}${GREEN}ClawWall is ready!${RESET}"
echo ""
echo "  ClawWall blocks dangerous AI operations before they execute:"
echo "  destructive commands, credential access, writes outside your project,"
echo "  and anything else you configure. Whatever the agent is doing."
echo ""
echo "  Quick start:"
echo "    clawwall start        Start the firewall daemon (background)"
echo "    clawwall tui          Open the real-time dashboard"
echo "    clawwall status       Check daemon status and stats"
echo ""
echo "  Enable for your AI agent:"
echo "    CLAWWALL_ENABLED=true <your-agent-command>"
echo ""
echo "  Docs: https://clawwall.dev"
echo ""
