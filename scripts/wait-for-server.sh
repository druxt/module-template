#!/usr/bin/env bash
# Waits for the static server to answer, or gives up.
#
# Usage: wait-for-server.sh [<url>] [<seconds>]
#
# A fixed sleep is a guess: too short and Playwright starts against a socket
# nothing is listening on, too long and every pipeline pays for it.
set -euo pipefail

url="${1:-http://127.0.0.1:3000/}"
deadline=$(( SECONDS + ${2:-30} ))

until curl -sf -o /dev/null "$url"; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "No answer from ${url} within ${2:-30}s." >&2
    exit 1
  fi
  sleep 0.5
done
echo "${url} is answering."
