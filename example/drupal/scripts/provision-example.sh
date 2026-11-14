#!/usr/bin/env bash
##
# Post-provision hook: apply the example's recipe.
#
# Runs at the end of `eddy-provision`, once the site is installed and this
# module is enabled. The recipe holds everything the example application
# reads: modules, permissions, config and default content. The current
# working directory is the project root.

set -eu

recipe="$PWD/recipes/druxt_module_template_example"

echo "[example] Applying $recipe"
build/vendor/bin/drush -r "$PWD/build/web" -y recipe:apply "$recipe"
build/vendor/bin/drush -r "$PWD/build/web" -y cache:rebuild
