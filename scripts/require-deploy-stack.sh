#!/bin/bash
# Exit 0 and print the stack name, or exit 1 with usage.
# Refuses a bare deploy and refuses --all.
set -euo pipefail

usage() {
  echo "usage: npm run deploy -- oslynstudio-AppsyncStack --exclusively --profile a1" >&2
  exit 1
}

if [ "$#" -eq 0 ]; then
  usage
fi

stack=""
skip_next=0
for arg in "$@"; do
  if [ "$skip_next" -eq 1 ]; then
    skip_next=0
    continue
  fi
  if [ "$arg" = "--all" ]; then
    echo "refusing --all" >&2
    usage
  fi
  case "$arg" in
    --profile|--require-approval|--outputs-file|--output|--app|--context|-c|--role-arn|--toolkit-stack-name)
      skip_next=1
      ;;
    --profile=*|--require-approval=*|--outputs-file=*|--output=*)
      ;;
    -*)
      ;;
    *)
      stack="$arg"
      ;;
  esac
done

if [ -z "$stack" ]; then
  usage
fi

echo "$stack"
