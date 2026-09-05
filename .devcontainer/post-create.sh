#!/usr/bin/env bash
# One definition for VS Code, Codespaces and DevPod, replacing the Gitpod
# configuration that drifted in every repository still carrying one.
#
# Idempotent: a devcontainer gets rebuilt, and a post-create step that only
# works on a clean container is a step that fails the second time.
set -euo pipefail

echo "Installing dependencies..."
npm install

# npm install enables the hooks via scripts/postinstall.mjs. Repeated here for
# the case where the container was built with install scripts disabled, which
# is a common hardening default.
echo "Enabling git hooks..."
git config core.hooksPath .githooks

echo
echo "Ready."
echo
echo "  npm run build     build the module"
echo "  npm test          unit tests, with the coverage floor enforced"
echo "  npm run lint      every linter"
echo "  npm run test:e2e  Playwright against the example application"
echo
echo "The example application needs a Drupal backend. See example/README.md."
