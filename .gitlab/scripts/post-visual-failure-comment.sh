#!/usr/bin/env bash
# Post failed visual snapshots to the merge request as images.
#
# Usage: post-visual-failure-comment.sh          (run as the visual job's after_script)
#
# A visual diff described in a job log is not reviewable. Baseline, render and
# diff side by side in one note is. Run from after_script so it reports whether
# the job passed or failed: on a pass it removes its own previous note, so a
# fixed failure stops being shown.
#
# Environment:
#   VISUAL_RESULTS_DIR   Playwright's output directory. Default: test-results
#                        Set it per repository. The original this derives from
#                        hardcoded `nuxt/test-results`, which works in exactly
#                        one repository and fails silently everywhere else, by
#                        finding no screenshots and reporting success.
#   GITLAB_API_TOKEN     required. A token with api scope.
#   CI_API_V4_URL        required. Set by GitLab CI.
#   CI_PROJECT_ID        required. Set by GitLab CI, never defaulted here.
#   CI_MERGE_REQUEST_IID required. Only set on merge-request pipelines.
#   CI_JOB_NAME          used to key the marker, so two visual jobs (say
#                        viewports and SEO) do not overwrite each other.
#   CI_COMMIT_SHORT_SHA  reported in the note, so a reader knows which render.

set -uo pipefail

script_dir="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=scaffold/standards/gitlab-scripts/mr-note-lib.sh
. "$script_dir/mr-note-lib.sh"

results_dir="${VISUAL_RESULTS_DIR:-test-results}"
job="${CI_JOB_NAME:-visual}"
marker="<!-- visual-failure:${job} -->"

require_token || exit 1

if [ ! -d "$results_dir" ]; then
  echo "No ${results_dir} directory; nothing to report."
  exit 0
fi

# Playwright writes <name>-actual.png beside the expected and diff images for
# every failing snapshot.
failed_renders=()
while IFS= read -r file; do
  failed_renders+=("$file")
done < <(find "$results_dir" -name '*-actual.png' -type f | sort)

if [ ${#failed_renders[@]} -eq 0 ]; then
  echo "No visual failures."
  # Remove a note left by an earlier run, so a fixed failure stops showing.
  bash "$script_dir/delete-mr-note.sh" "$marker" || true
  exit 0
fi

api="${CI_API_V4_URL:?CI_API_V4_URL is not set}"
project="${CI_PROJECT_ID:?CI_PROJECT_ID is not set}"
uploads_url="${api}/projects/${project}/uploads"

# Upload one image and return the Markdown GitLab gives back for it.
# Same two-interpreter reason as mr-note-lib.sh: this runs on a node image in
# the visual job and on a python one in the workspace's own pipeline.
upload() {
  local response interpreter markdown
  response="$(api_write --request POST --form "file=@$1" "$uploads_url")" || return 1
  interpreter="$(json_interpreter)" || return 1
  if [ "$interpreter" = "python3" ]; then
    markdown="$(printf '%s' "$response" | python3 -c '
import json, sys
try:
    sys.stdout.write(json.load(sys.stdin).get("markdown") or "")
except Exception:
    pass
')"
  else
    markdown="$(printf '%s' "$response" | node -e '
const fs = require("fs");
let markdown = "";
try { markdown = JSON.parse(fs.readFileSync(0, "utf8")).markdown || ""; } catch {}
process.stdout.write(markdown);
')"
  fi
  # No markdown means the upload did not produce a usable link. Returning it
  # anyway puts an empty cell in the table, which reads as a passing check.
  [ -n "$markdown" ] || return 1
  printf '%s' "$markdown"
}

body_file="$(mktemp)"
{
  echo "$marker"
  echo "### Visual failures: \`${job}\` at \`${CI_COMMIT_SHORT_SHA:-unknown}\`"
  echo
  for actual in "${failed_renders[@]}"; do
    label="$(basename "$(dirname "$actual")" | sed 's/-retry[0-9]*$//')"
    expected="${actual%-actual.png}-expected.png"
    diff_image="${actual%-actual.png}-diff.png"

    actual_md="$(upload "$actual")" || actual_md='_upload failed_'

    # A new snapshot has no committed baseline, and that is exactly the case a
    # reviewer needs to see. Report it as missing rather than failing here.
    expected_md="_no committed baseline_"
    if [ -f "$expected" ]; then
      expected_md="$(upload "$expected")" || expected_md='_upload failed_'
    fi

    diff_md="_not produced_"
    if [ -f "$diff_image" ]; then
      diff_md="$(upload "$diff_image")" || diff_md='_upload failed_'
    fi

    echo "#### \`${label}\`"
    echo
    echo "| Baseline | Render | Diff |"
    echo "| --- | --- | --- |"
    echo "| ${expected_md} | ${actual_md} | ${diff_md} |"
    echo
  done
  echo "To accept these renders, run the manual \`visual:update\` job and commit"
  echo "the PNGs it produces. Regenerate on x86_64 only: Chromium renders"
  echo "differently on ARM, and an ARM baseline is a permanent false diff for"
  echo "everyone else."
} > "$body_file"

bash "$script_dir/upsert-mr-note.sh" "$marker" "$body_file"
rm -f "$body_file"
