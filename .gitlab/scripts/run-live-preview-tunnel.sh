#!/usr/bin/env bash
# Serve a built directory through a Cloudflare Quick Tunnel and post the URL.
#
# Usage: run-live-preview-tunnel.sh          (run as a manual job's script)
#
# A Quick Tunnel needs no Cloudflare account and no token, and dies with the
# job that opened it. Manual, because a tunnel on every pipeline is waste and a
# reviewer knows when they want one.
#
# Environment:
#   PREVIEW_DIR                  directory to serve. Default: dist
#                                Set it per repository. The original this
#                                derives from ran a pnpm dev server from a
#                                fixed `nuxt/` path, which is not portable.
#   PREVIEW_PORT                 local port to serve on. Default: 8080
#   PREVIEW_KEEP_ALIVE_MINUTES   how long to hold the tunnel. Default: 55
#                                Keep it under the job timeout.
#   PREVIEW_LABEL                what to call it in the note. Default: Preview
#   CLOUDFLARED_VERSION          pinned release. Default below.
#   GITLAB_API_TOKEN et al       as required by post-live-preview-comment.sh.
#
# The tunnel and the served directory both terminate with the job: everything
# started here is killed on exit, and the note is removed with it, so the merge
# request never shows a link that no longer resolves.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

preview_dir="${PREVIEW_DIR:-dist}"
preview_port="${PREVIEW_PORT:-8080}"
keep_alive_minutes="${PREVIEW_KEEP_ALIVE_MINUTES:-55}"
preview_label="${PREVIEW_LABEL:-Preview}"
cloudflared_version="${CLOUDFLARED_VERSION:-2026.7.3}"

marker="<!-- preview-live -->"
serve_pid=""
tunnel_pid=""

cleanup() {
  [ -n "$serve_pid" ] && kill "$serve_pid" 2>/dev/null || true
  [ -n "$tunnel_pid" ] && kill "$tunnel_pid" 2>/dev/null || true
  # The URL stops resolving the moment this job ends, so the note goes with it.
  bash "$script_dir/delete-mr-note.sh" "$marker" 2>/dev/null || true
}
trap cleanup EXIT
trap 'cleanup; exit' INT TERM

if [ ! -d "$preview_dir" ]; then
  echo "Nothing to serve: ${preview_dir} does not exist." >&2
  echo "Build first, or set PREVIEW_DIR to the built output." >&2
  exit 1
fi

# Checksums are per architecture and pinned: an unverified binary that opens a
# public tunnel to this build is not something to fetch on trust. The runner
# may be ARM or x86_64, so detect rather than assume.
case "$(uname -m)" in
  aarch64|arm64)
    cf_arch="arm64"
    cf_sha256="65259e652a7bea08bf5df603233ab22b8bf3116af8df9f9206209af6a1b955c0"
    ;;
  x86_64)
    cf_arch="amd64"
    cf_sha256="9d71c677db00134c1bd4144b7783486b654ad281b1ea62b4972098d19f770f17"
    ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

bin_dir="$(mktemp -d)"
curl -sL --retry 3 \
  "https://github.com/cloudflare/cloudflared/releases/download/${cloudflared_version}/cloudflared-linux-${cf_arch}" \
  -o "${bin_dir}/cloudflared"
echo "${cf_sha256}  ${bin_dir}/cloudflared" | sha256sum -c - || {
  echo "cloudflared checksum mismatch; refusing to run it." >&2
  exit 1
}
chmod +x "${bin_dir}/cloudflared"

echo "Serving ${preview_dir} on :${preview_port}"
npx --yes serve -l "$preview_port" "$preview_dir" > /dev/null 2>&1 &
serve_pid=$!

# cloudflared self-updates and restarts by default, which kills the tunnel
# whose URL was already posted and quietly opens a new one somewhere else.
export NO_AUTOUPDATE=true

tunnel_log="$(mktemp)"
"${bin_dir}/cloudflared" tunnel --url "http://localhost:${preview_port}" \
  --no-autoupdate > "$tunnel_log" 2>&1 &
tunnel_pid=$!

url=""
for _ in $(seq 1 60); do
  url="$(grep -om1 'https://[a-z0-9-]*\.trycloudflare\.com' "$tunnel_log" || true)"
  [ -n "$url" ] && break
  sleep 2
done

if [ -z "$url" ]; then
  echo "The tunnel did not report a URL within two minutes." >&2
  cat "$tunnel_log" >&2
  exit 1
fi

bash "$script_dir/post-live-preview-comment.sh" \
  "$url" "$keep_alive_minutes" "$preview_label"

echo "Holding the tunnel for ${keep_alive_minutes} minutes."
sleep "$(( keep_alive_minutes * 60 ))"
