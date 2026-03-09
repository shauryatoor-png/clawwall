#!/usr/bin/env bash
set -euo pipefail

PORT=${CLAWWALL_PORT:-7654}
BASE="http://localhost:$PORT"

echo "=== ClawWall Demo ==="
echo ""

# Start the policy service in the background
echo "[1/5] Starting ClawWall on port $PORT..."
npx tsx "$(dirname "$0")/src/server/index.ts" &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null' EXIT

# Wait for server to be ready
for i in $(seq 1 20); do
  if curl -sf "$BASE/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo ""
echo "[2/5] Test DENY — dangerous command (rm -rf):"
curl -s -X POST "$BASE/policy/check" \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","tool":{"name":"exec","args":{"command":"rm -rf /"}},"context":{}}' | python3 -m json.tool
echo ""

echo "[3/5] Test DENY — sensitive path (.env):"
curl -s -X POST "$BASE/policy/check" \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","tool":{"name":"write","args":{"path":"/project/.env"}},"context":{}}' | python3 -m json.tool
echo ""

echo "[4/5] Test ALLOW — normal read:"
curl -s -X POST "$BASE/policy/check" \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","tool":{"name":"read","args":{"path":"src/index.ts"}},"context":{}}' | python3 -m json.tool
echo ""

echo "[5/5] Test ASK — internal URL:"
curl -s -X POST "$BASE/policy/check" \
  -H 'Content-Type: application/json' \
  -d '{"agent_id":"demo","tool":{"name":"browser","args":{"url":"http://192.168.1.1/admin"}},"context":{}}' | python3 -m json.tool
echo ""

echo "=== Demo complete ==="
