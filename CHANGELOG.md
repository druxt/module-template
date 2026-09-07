# Changelog

Changes to this template are recorded here. The format is
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Committed git hooks in `.githooks/`, enabled on install, running the linters
  and unit tests before a commit and Conventional Commits on the message.
- A GitLab pipeline covering lint, unit tests, visual regression, secret
  scanning with a detection canary, and a manual preview tunnel.
- Spell check, Markdown lint, YAML lint, formatting, dead-code detection and a
  production dependency audit.
- An enforced coverage floor, measured from this template's own tests rather
  than aspirational.
- A private-host lint, so a URL only the author can reach cannot reach a
  tracked file in a public repository.
- An attribution check, in the commit-msg hook and in the pipeline, so that no
  commit, merge request description or tracked file credits an AI tool as
  author, co-author or generator.
- Prose linting with Vale and the ai-tells style, over the markdown a change
  touches, its commit messages and the merge request description.
- Visual regression with Playwright, and merge-request automation that posts
  baseline, render and diff for each failure.
- A devcontainer covering VS Code, Codespaces and DevPod.
- The example backend on Drupal 11, provisioned without Docker from a fresh
  `site:install` on SQLite, and generated and tested in both pipelines. The
  Drupal 9 site with its committed Tome export is gone.
- `AGENTS.md` and `CONTRIBUTING.md`.

### Changed

- **BREAKING (for forks).** The toolchain is replaced rather than extended. The
  Node 14.x/16.x GitHub Actions matrix and the `npm i` install path are gone,
  replaced by a version pinned in `.mise.toml` and an install driven by the
  `packageManager` field through corepack.

  A fork that predates this change cannot fast-forward onto it. Rebase your
  module's own commits onto the new base instead:

  ```bash
  git remote add template https://github.com/druxt/module-template.git
  git fetch template
  git rebase --onto template/main <the commit you branched from>
  ```

  Then run `npm install` once, which enables the hooks.

- Renovate no longer extends the stale `@nuxtjs` preset. Updates are grouped
  into one pull request, majors are not automated, and GitHub Actions are
  pinned to commit SHAs.
- ESLint sets `root: true`, so a checkout inside another workspace no longer
  inherits that workspace's rules.

### Removed

- The Gitpod configuration. It was provably unmaintained: `.gitpod.yml`
  configured prebuilds for a `master` branch this repository has not had, and
  its setup scripts drive `yarn` where the repository now uses npm. The
  devcontainer replaces it and covers VS Code, Codespaces and DevPod.

### Fixed

- `vue-template-compiler` was pinned a patch behind `vue`, which made the test
  suite refuse to run with a version-mismatch error. Both are now on 2.7.16.

[Unreleased]: https://github.com/druxt/module-template/commits/main
