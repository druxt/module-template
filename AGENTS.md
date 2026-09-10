# Agent instructions

Starting point for a Druxt module, and the reference module for the
Druxt repository standard.

## Rules

- **This repository is public.** Nothing that resolves only on a private
  network may reach a tracked file: no internal URLs, hostnames, repository
  names or issue links, in any file including comments and patch descriptions.
  `npm run lint:private` enforces the URL-shaped half of this and runs in the
  pipeline. It cannot catch an internal name written as prose, so that part is
  on you.
- **Conventional Commits**, and the same for pull request and merge request
  titles. These repositories squash-merge, so the title becomes the commit
  subject, and a prose title breaks the next push to the target branch.
- **The coverage floor in `jest.config.js` goes up, never down.** If a change
  drops coverage, the change needs a test.
- **No AI tool is credited.** No co-author trailer naming an assistant, no
  generated-with footer, no session link, in commits, merge request
  descriptions or tracked files. The work is the author's. The commit-msg hook
  rejects it locally, and `npm run lint:attribution` and the pipeline check
  the rest.
- **Prose is linted with Vale.** The ai-tells style is the minimum, and it
  covers the markdown a change touches, its commit messages and the merge
  request description. `npm run lint:prose:install` once, then
  `npm run lint:prose`.
- **Never regenerate visual baselines locally.** Use the manual `visual:update`
  job. Chromium renders differently on ARM and a locally generated baseline is
  a permanent false diff for everyone else.

## Layout

| Path               | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `src/`             | The module. `index.js` is the Nuxt module, `components/` its components |
| `test/`            | Unit tests. `test/e2e/` is Playwright, and is not run by `npm test`     |
| `example/`         | Drupal 11 on SQLite and a Nuxt application that loads the module        |
| `scripts/`         | Repository tooling, excluded from the package                           |
| `.githooks/`       | Committed hooks, enabled by `npm install`                               |
| `.gitlab/scripts/` | Content checks and merge-request automation, copied from the standard   |

## Commands

```bash
npm install          # dependencies, and enables the git hooks
npm run build        # siroc
npm test             # jest, coverage floor enforced
npm run lint         # every linter except prose
npm run lint:prose   # Vale, after `npm run lint:prose:install`
npm run example:setup  # Drupal 11 backend on SQLite, then the example's dependencies
npm run example:dev    # the example on http://localhost:3000
npm run test:e2e       # Playwright against the example, backend up
```

## Toolchain

Pinned in `.mise.toml`. Node is deliberately held at 16.20.1 to match what the
module's own dependencies support; the lint tooling is pinned to versions that
still run there. Bumping either is a deliberate, coordinated change, not a
routine dependency update, so Renovate is configured not to offer it.
