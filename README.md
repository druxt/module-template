# Druxt module template

[![npm](https://img.shields.io/npm/v/druxt-module-template)](https://www.npmjs.com/package/druxt-module-template)
[![npm@dev](https://img.shields.io/npm/v/druxt-module-template/dev)](https://www.npmjs.com/package/druxt-module-template/v/dev)
[![CI](https://github.com/druxt/module-template/actions/workflows/ci.yml/badge.svg?branch=0.x)](https://github.com/druxt/module-template/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/druxt/module-template/branch/0.x/graph/badge.svg)](https://codecov.io/gh/druxt/module-template)
[![Known Vulnerabilities](https://snyk.io/test/github/druxt/module-template/badge.svg?targetFile=package.json)](https://snyk.io/test/github/druxt/module-template?targetFile=package.json)
[![Discord](https://img.shields.io/discord/753866667590680587?label=discord&logo=discord&logoColor=white)](https://discord.druxtjs.org)

Starting point for a [Druxt](https://druxtjs.org) module, and the reference
for how every Druxt module is set up.

Start something new from it, or bring an existing module up
to the same footing. They are different jobs and the second is the more common
one.

## Starting a new module

1. Create a repository from this template.
2. `npm install`. That installs dependencies and enables the git hooks.
3. Rename things: `package.json`'s `name`, the component in
   `src/components/`, the `@TODO` in it, and the repository and package names
   in the badge row at the top of this file.
4. `npm test` and `npm run lint` should both pass before you change anything.

## Bringing an existing module up

Do not copy this repository over yours. Take the rows of
[What you get](#what-you-get) one at a time, each in its own pull request, so
every change stays small enough to review.

A wholesale copy also brings this template's coverage floor and cspell
dictionary, which describe this template rather than your module. Measure the
floor from your own tests and build the dictionary from your own words.

## What you get

|              |                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Build        | siroc, producing ESM and SSR bundles                                                                 |
| Unit tests   | Jest, with an enforced coverage floor                                                                |
| Visual tests | Playwright against the example application, three viewports, committed baselines                     |
| Lint         | ESLint, Prettier, markdownlint, cspell, yamllint, knip                                               |
| Secrets      | gitleaks, with a canary that proves the scanner still detects                                        |
| Commits      | Conventional Commits, checked by a hook and over the merge-request range                             |
| CI           | GitLab and GitHub Actions, running the same set                                                      |
| Preview      | A manual job serving the example application through a Cloudflare tunnel and posting the URL         |
| Releases     | Changesets, with `dev` snapshots and stable releases published from CI: [RELEASING.md](RELEASING.md) |
| Environment  | A devcontainer for VS Code, Codespaces and DevPod                                                    |

## Commands

```bash
npm install            # dependencies, and enables the git hooks
npm run build          # build the module
npm test               # unit tests, coverage floor enforced
npm run lint           # every linter except prose
npm run lint:prose     # Vale, after `npm run lint:prose:install` once
npm run example:setup  # Drupal 11 backend on SQLite, then the example's dependencies
npm run example:dev    # the example on http://localhost:3000
npm run test:e2e       # Playwright against the example, backend up
```

`.mise.toml` pins the toolchain and defines the same commands as tasks, so with
[mise](https://mise.jdx.dev) installed, `mise run ci` runs what the pipeline
runs.

## The example application

`example/` holds a Drupal 11 backend and a Nuxt application that loads the
module. `npm run example:setup` provisions the backend without Docker, on
SQLite, with PHP 8.3 or later and Composer on the host; the dev container has
both. The end-to-end and visual tests run against the generated example. See
`example/README.md`.

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md) covers getting set up, what to run before
you push, commit messages, the coverage floor and the visual baselines.
[AGENTS.md](AGENTS.md) sets out the same rules for a coding agent working in
this repository.

## Licence

[MIT](LICENSE)
