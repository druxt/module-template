# Druxt module template

Starting point for a [Druxt](https://druxtjs.org) module, and the reference
module for the Druxt repository standard.

Start something new from it, or bring an existing module up
to the same footing. They are different jobs and the second is the more common
one.

## Starting a new module

1. Create a repository from this template.
2. `npm install`. That installs dependencies and enables the git hooks.
3. Rename things: `package.json`'s `name`, the component in
   `src/components/`, and the `@TODO` in it.
4. `npm test` and `npm run lint` should both pass before you change anything.

## Bringing an existing module up

Do not copy this repository over yours. Run the conformance checker against
your module and work the gap list it prints:

```bash
python3 check-standards.py --standard standards.yml \
  --repos-root .. --repo <your-module>
```

It reports every requirement, whether your repository meets it, and why not
when it does not. The gaps are independent, so they can be closed one merge
request at a time rather than in one pass that is impossible to review. Copying
wholesale is worse than it looks, because you inherit this template's coverage floor and its dictionary, and neither describes your module. The floor has to be measured from your own tests.

## What you get

|              |                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------- |
| Build        | siroc, producing ESM and SSR bundles                                                         |
| Unit tests   | Jest, with an enforced coverage floor                                                        |
| Visual tests | Playwright against the example application, three viewports, committed baselines             |
| Lint         | ESLint, Prettier, markdownlint, cspell, yamllint, knip                                       |
| Secrets      | gitleaks, with a canary that proves the scanner still detects                                |
| Commits      | Conventional Commits, checked by a hook and over the merge-request range                     |
| CI           | GitLab and GitHub Actions, running the same set                                              |
| Preview      | A manual job serving the example application through a Cloudflare tunnel and posting the URL |
| Releases     | Changesets                                                                                   |
| Environment  | A devcontainer for VS Code, Codespaces and DevPod                                            |

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

## Things worth knowing before you change them

**The coverage floor goes up, never down.** It is measured from the current
tests, not aspirational. If a change drops coverage, the change needs a test.

**Never regenerate visual baselines locally.** Use the manual `visual:update`
pipeline job. Chromium renders differently on ARM, so a baseline generated on an
Apple silicon machine is a permanent false diff for everyone else.

**Title your pull requests like commits.** This repository squash-merges, so the
title becomes the commit subject. A prose title passes review and then breaks
the next push to the target branch.

**Nothing private in a tracked file.** This repository is public.
`npm run lint:private` fails on a URL that only resolves on a private network,
and runs in CI.

## Licence

[MIT](LICENSE)
