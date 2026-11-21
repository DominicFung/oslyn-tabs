#!/bin/bash
# Guards npm run deploy so a missing stack name or --all cannot start CDK.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
CHECK="$ROOT/scripts/require-deploy-stack.sh"
USAGE="npm run deploy -- oslynstudio-AppsyncStack --exclusively --profile a1"

expect_fail() {
  local name="$1"
  shift
  local out
  set +e
  out=$("$CHECK" "$@" 2>&1)
  local code=$?
  set -e
  if [ "$code" -eq 0 ]; then
    echo "expected $name to be refused, but it was allowed" >&2
    exit 1
  fi
  if ! printf '%s\n' "$out" | grep -F -q "$USAGE"; then
    echo "expected $name to print the usage line" >&2
    printf '%s\n' "$out" >&2
    exit 1
  fi
}

expect_fail "no arguments"
expect_fail "--all" --all
expect_fail "stack plus --all" oslynstudio-AppsyncStack --all
expect_fail "flags without a stack" --exclusively --profile a1

got=$("$CHECK" oslynstudio-AppsyncStack --exclusively --profile a1)
if [ "$got" != "oslynstudio-AppsyncStack" ]; then
  echo "expected the stack name, got: $got" >&2
  exit 1
fi

echo "deploy stack guard ok"
