#!/bin/bash
# Installs what a reboot dropped, refuses to start when tests fail, then restarts the poller if it hangs or exits.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ ! -d node_modules ]; then
  npm ci
fi

chromium_path="$(node -e "process.stdout.write(require('playwright').chromium.executablePath())" 2>/dev/null || true)"
if [ -z "$chromium_path" ] || [ ! -x "$chromium_path" ]; then
  npx playwright install chromium
fi

npm test

if [[ " $* " == *" --dry "* ]]; then
  exec npx tsx src/index.ts "$@"
fi

pid_file="$(pwd)/worker.pid"
echo $$ > "$pid_file"
child=""

stop_child() {
  if [ -z "$child" ] || ! kill -0 "$child" 2>/dev/null; then
    return
  fi
  kill -TERM "$child" 2>/dev/null || true
  for _ in $(seq 1 60); do
    kill -0 "$child" 2>/dev/null || break
    sleep 1
  done
  if kill -0 "$child" 2>/dev/null; then
    kill -KILL "$child" 2>/dev/null || true
  fi
  wait "$child" 2>/dev/null || true
  child=""
}

cleanup() {
  stop_child
  rm -f "$pid_file"
}
trap cleanup EXIT INT TERM

stale_after=90
while true; do
  echo "worker starting"
  npx tsx src/index.ts "$@" &
  child=$!
  while kill -0 "$child" 2>/dev/null; do
    sleep 15
    if [ -f worker.heartbeat ]; then
      now=$(date +%s)
      beat=$(stat -c %Y worker.heartbeat || echo 0)
      if [ $((now - beat)) -gt "$stale_after" ]; then
        echo "worker heartbeat is stale; restarting"
        kill -KILL "$child" 2>/dev/null || true
        wait "$child" 2>/dev/null || true
        break
      fi
    fi
  done
  wait "$child" 2>/dev/null || true
  child=""
  echo "worker exited; restarting"
  sleep 2
done
