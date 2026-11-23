#!/usr/bin/env bash
##
# Post-start hook: tell the example application where the backend is.
#
# Runs at the end of `eddy-start`, once the server is serving. Writes the
# site URL to ../.env as BASE_URL, which example/nuxt/nuxt.config.js reads,
# so no URL is copied between terminals. The current working directory is
# the project root.

set -eu

site_url="$(vendor/bin/eddy-info site-url)"
dotenv="../.env"

if [ -f "$dotenv" ]; then
  grep -v '^BASE_URL=' "$dotenv" > "$dotenv.tmp" || true
  mv "$dotenv.tmp" "$dotenv"
fi
echo "BASE_URL=$site_url" >> "$dotenv"

echo "[example] BASE_URL=$site_url written to example/.env"
