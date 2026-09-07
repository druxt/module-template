#!/usr/bin/env bash
# Sourced by ~/.bashrc inside the dev container. post-create.sh installs the
# line that sources it, so a fresh container gets both halves below.

# The host's locale arrives over SSH: OpenSSH sends LANG and LC_* by default,
# and DevPod's shell inherits them. When the value names a locale this image
# has not generated, every command warns "setlocale: cannot change locale"
# and manpath gives up. Fall back to the image's UTF-8 locale instead.
if [ -n "${LANG:-}" ] && ! locale -a 2>/dev/null | grep -qix "$(printf '%s' "$LANG" | sed 's/UTF-8$/utf8/')"; then
  export LANG=C.UTF-8
  unset LC_ALL LC_CTYPE LC_COLLATE LC_MESSAGES LC_MONETARY LC_NUMERIC LC_TIME
fi

# The rest is for a person at a prompt.
case $- in *i*) ;; *) return 0 2>/dev/null || exit 0 ;; esac

cat <<'EOF'

Druxt module template
  npm run build      Build the module
  npm test           Unit tests, with the coverage floor enforced
  npm run lint       Every linter except prose
  npm run lint:prose Vale, after `npm run lint:prose:install`
  npm run test:e2e   Playwright against the example application

The example application needs a Drupal backend. See example/README.md.

EOF
