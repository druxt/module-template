#!/usr/bin/env bash
# Post a preview URL to the merge request.
#
# Usage: post-live-preview-comment.sh <url> [keep-alive-minutes] [label]
#
# A tunnel URL that appears only in a job log means the reviewer has to know
# the job exists, run it, and watch its output. Posted to the merge request
# with its expiry, it is a link they can click.
#
# Environment:
#   GITLAB_API_TOKEN       required. A token with api scope.
#   CI_API_V4_URL          required. Set by GitLab CI.
#   CI_PROJECT_ID          required. Set by GitLab CI, never defaulted here.
#   CI_MERGE_REQUEST_IID   required. Only set on merge-request pipelines.
#   CI_COMMIT_SHORT_SHA    reported, so a reader knows what is being served.

set -euo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"

url="${1:?usage: post-live-preview-comment.sh <url> [minutes] [label]}"
minutes="${2:-55}"
label="${3:-Preview}"

marker="<!-- preview-live -->"
body_file="$(mktemp)"
{
  echo "$marker"
  echo "### ${label} at \`${CI_COMMIT_SHORT_SHA:-unknown}\`"
  echo
  echo "| Target | URL |"
  echo "| --- | --- |"
  echo "| ${label} | ${url} |"
  echo
  echo "The tunnel closes when the job ends, in about ${minutes} minutes."
  echo "Re-run the manual preview job for a fresh one."
} > "$body_file"

bash "$script_dir/upsert-mr-note.sh" "$marker" "$body_file"
rm -f "$body_file"

echo "Posted preview URL: ${url}"
