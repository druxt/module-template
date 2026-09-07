#!/usr/bin/env bash
# One definition for VS Code, Codespaces and DevPod, replacing the Gitpod
# configuration that drifted in every repository still carrying one.
#
# Idempotent: a devcontainer gets rebuilt, and a post-create step that only
# works on a clean container is a step that fails the second time.
set -euo pipefail

echo "Trusting this repository's .mise.toml..."
mise trust

# The php image has the core extensions Drupal needs except gd, intl and
# zip. sqlite3 is the CLI drush uses to reset the throwaway database.
echo "Installing PHP extensions and system packages..."
# The php image ships a Yarn apt source whose signing key has rotated, and
# apt-get update fails on it. Nothing here uses apt's Yarn; corepack does that.
sudo rm -f /etc/apt/sources.list.d/yarn.list
sudo apt-get update -qq > /dev/null
sudo apt-get install -y -qq libpng-dev libjpeg-dev libfreetype6-dev libicu-dev libzip-dev sqlite3 > /dev/null
# sudo resets the environment, and the extension scripts need PHP_INI_DIR to
# find conf.d.
PHP_INI_DIR="${PHP_INI_DIR:-/usr/local/etc/php}"
sudo env PHP_INI_DIR="$PHP_INI_DIR" docker-php-ext-configure gd --with-freetype --with-jpeg > /dev/null
sudo env PHP_INI_DIR="$PHP_INI_DIR" docker-php-ext-install -j"$(nproc)" gd intl zip > /dev/null
# The image starts Xdebug on every request, so each CLI call warns that no
# debugger is listening. Trigger mode keeps it available on demand.
echo 'xdebug.start_with_request = trigger' | sudo tee "$PHP_INI_DIR/conf.d/zz-xdebug-trigger.ini" > /dev/null
php -r "exit(extension_loaded('gd') && extension_loaded('intl') && extension_loaded('zip') ? 0 : 1);" || { echo "PHP extensions failed to load" >&2; exit 1; }

echo "Installing dependencies..."
npm install

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
