#!/bin/bash
# Refuses to start the poller when the import regression suite fails.
set -euo pipefail
cd "$(dirname "$0")"
npm test
exec npx tsx src/index.ts "$@"
