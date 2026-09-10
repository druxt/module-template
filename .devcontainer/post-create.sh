#!/usr/bin/env bash
# One definition for VS Code, Codespaces and DevPod, replacing the Gitpod
# configuration that drifted in every repository still carrying one.
#
# Idempotent: a devcontainer gets rebuilt, and a post-create step that only
# works on a clean container is a step that fails the second time.
set -euo pipefail

echo "Trusting this repository's .mise.toml..."
mise trust

# PHP comes from the dev container PHP feature, built from source against
# trixie's libsqlite3: Drupal 11 needs 3.45 or later. The feature leaves gd
# out, and Drupal's installer requires it, so gd is built from PHP's own
# source tree below. sqlite3 is the CLI drush uses to reset the throwaway
# database.
echo "Installing build tooling and image libraries..."
sudo apt-get update -qq > /dev/null
# python3-setuptools: trixie's Python 3.13 has no distutils, and the node-gyp
# bundled with Node 16's npm still imports it when vue-jest's deasync builds.
sudo apt-get install -y -qq python3 python3-setuptools build-essential sqlite3 libjpeg-dev libpng-dev libwebp-dev libfreetype-dev zlib1g-dev > /dev/null

CONF_DIR=$(php --ini | grep 'Scan for additional .ini files' | sed 's/.*: *//')

# The feature ships Xdebug active on every request, so each CLI call would
# warn that no debugger is listening. Trigger mode keeps it available on demand.
echo 'xdebug.start_with_request = trigger' | sudo tee "$CONF_DIR/zz-xdebug-trigger.ini" > /dev/null

echo "Building the gd extension from PHP's source tree..."
PHP_FULL_VERSION=$(php -r 'echo PHP_VERSION;')
PHP_SRC_TMP="$(mktemp -d)"
trap 'rm -rf "$PHP_SRC_TMP"' EXIT
mkdir -p "$PHP_SRC_TMP/gd"
curl -fsSL "https://www.php.net/distributions/php-${PHP_FULL_VERSION}.tar.gz" -o "$PHP_SRC_TMP/php-src.tar.gz"
tar -xzf "$PHP_SRC_TMP/php-src.tar.gz" -C "$PHP_SRC_TMP/gd" --strip-components=3 "php-${PHP_FULL_VERSION}/ext/gd"
(
  cd "$PHP_SRC_TMP/gd"
  phpize > /dev/null
  ./configure --with-jpeg --with-webp --with-freetype > /dev/null
  make -j"$(nproc)" > /dev/null
  sudo make install > /dev/null
)
echo 'extension=gd' | sudo tee "$CONF_DIR/gd.ini" > /dev/null
php -r "exit(extension_loaded('gd') && extension_loaded('pdo_sqlite') ? 0 : 1);" || { echo "gd or pdo_sqlite is not loaded" >&2; exit 1; }

echo "Installing dependencies..."
npm install

# Playwright does not know trixie and falls back to a package list from
# Ubuntu 20.04, whose font packages no longer exist. Its Ubuntu 24.04 list
# uses the same t64 names as trixie and every package in it is available here.
# The platform key carries the architecture.
echo "Installing the Playwright browser for the end-to-end tests..."
case "$(uname -m)" in aarch64 | arm64) PLAYWRIGHT_ARCH=arm64 ;; *) PLAYWRIGHT_ARCH=x64 ;; esac
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu24.04-$PLAYWRIGHT_ARCH" npx playwright install --with-deps chromium > /dev/null

echo "Building the module, which the example links to by path..."
npm run build

echo "Provisioning and starting the example backend, then installing the example..."
npm run example:setup

# npm install enables the hooks via scripts/postinstall.mjs. Repeated here for
# the case where the container was built with install scripts disabled, which
# is a common hardening default.
echo "Enabling git hooks..."
git config core.hooksPath .githooks

# OpenSSH forwards the host's LANG and LC_*, and bash warns on every start
# when that locale is not generated here. This covers the usual English
# ones before the shell starts; shell-init.sh falls back for anything else.
echo "Generating the English locales hosts commonly send over SSH..."
sudo apt-get update -qq > /dev/null
sudo apt-get install -y -qq locales > /dev/null
sudo sed -i -E 's/^# (en_(AU|CA|GB|IE|NZ|US)\.UTF-8 UTF-8)/\1/' /etc/locale.gen
sudo locale-gen > /dev/null

# Sourced from ~/.bashrc rather than run once here, so every new terminal
# gets the locale fix and the summary, not only the creation log.
echo "Installing the shell locale fallback and welcome..."
if ! grep -qF '.devcontainer/shell-init.sh' ~/.bashrc; then
  printf '\n# Dev container shell setup: locale fallback and welcome.\nexport WORKSPACE_ROOT=%q\n[ -f "$WORKSPACE_ROOT/.devcontainer/shell-init.sh" ] && . "$WORKSPACE_ROOT/.devcontainer/shell-init.sh"\n' "$PWD" >> ~/.bashrc
fi

echo
echo "Ready. Open a new terminal for the summary of commands."
