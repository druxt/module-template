/**
 * Point git at the committed hooks directory.
 *
 * The hooks live in .githooks/ and are activated with
 * `git config core.hooksPath`, which is a per-clone setting rather than
 * something the repository carries. Without this step a fresh clone has the
 * hooks on disk and none of them running, which is worse than having no hooks
 * at all: the repository looks protected and is not.
 *
 * Deliberately not husky. husky needs a package.json and a postinstall of its
 * own, which excludes the Drupal-side repositories in this ecosystem that have
 * neither, and the version in use elsewhere is on a deprecated hook-sourcing
 * style. A committed directory works everywhere and costs no dependency.
 *
 * Quiet on failure. A CI install runs this too, and there is nothing to gain
 * from failing an install because a hook could not be configured in a
 * container that will never make a commit.
 */

import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = realpathSync(fileURLToPath(new URL('..', import.meta.url)))

let top
try {
  // Only git's line terminator is removed, not surrounding whitespace: a
  // checkout directory may legitimately end in a space, and trimming that
  // leaves a path realpathSync then throws on, which fails the install.
  top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).replace(/\r?\n$/, '')
} catch {
  // Not a git checkout: a published tarball, or a vendored copy. Nothing to do.
  process.exit(0)
}

// A vendored copy inside another checkout finds that checkout's repository.
// Its hooks are not this package's to change. Resolving is in the try as
// well, because a path that cannot be resolved is a reason to do nothing
// rather than a reason to fail someone's install.
try {
  if (realpathSync(top) !== root) process.exit(0)
} catch {
  process.exit(0)
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], {
    cwd: root,
    stdio: 'ignore',
  })
  console.log('Git hooks enabled from .githooks/')
} catch (error) {
  console.warn(`Could not enable git hooks: ${error.message}`)
  console.warn('Run `npm run hooks:install` by hand if you intend to commit.')
}
