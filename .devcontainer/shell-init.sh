#!/usr/bin/env bash
# Sourced by ~/.bashrc inside the dev container. post-create.sh installs the
# line that sources it, so a fresh container gets both halves below.

# The host's locale arrives over SSH: OpenSSH sends LANG and LC_* by default,
# and DevPod's shell inherits them. When the value names a locale this image
# has not generated, every command warns "setlocale: cannot change locale"
# and manpath gives up. Fall back to the image's UTF-8 locale instead.
# Every forwarded value is checked, not only LANG: a host that sends an
# ungenerated LC_TIME warns just as loudly as one that sends an ungenerated LANG.
available="$(locale -a 2>/dev/null)"
for forwarded in "${LANG:-}" "${LC_ALL:-}" "${LC_CTYPE:-}" "${LC_COLLATE:-}" \
  "${LC_MESSAGES:-}" "${LC_MONETARY:-}" "${LC_NUMERIC:-}" "${LC_TIME:-}"; do
  case "$forwarded" in '' | C | C.* | POSIX) continue ;; esac
  if ! printf '%s\n' "$available" | grep -qix "$(printf '%s' "$forwarded" | sed 's/UTF-8$/utf8/')"; then
    export LANG=C.UTF-8
    unset LC_ALL LC_CTYPE LC_COLLATE LC_MESSAGES LC_MONETARY LC_NUMERIC LC_TIME
    break
  fi
done
unset available forwarded

# The rest is for a person at a prompt.
case $- in *i*) ;; *) return 0 2>/dev/null || exit 0 ;; esac

backend="not started"
if [ -f "${WORKSPACE_ROOT:-$PWD}/example/.env" ]; then
  backend="$(sed -n 's/^BASE_URL=//p' "${WORKSPACE_ROOT:-$PWD}/example/.env" | head -1)"
  backend="${backend:-not started}"
fi

cat <<EOF

Druxt module template
  npm run build         Build the module
  npm test              Unit tests, with the coverage floor enforced
  npm run lint          Every linter except prose
  npm run lint:prose    Vale, after \`npm run lint:prose:install\`

Example application, backend: ${backend}
  npm run example:dev   Nuxt on http://localhost:3000 with the module linked
  npm run test:e2e      Playwright against the example
  npm run example:info  Backend details; example:stop and example:start

EOF
