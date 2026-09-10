# Contributing

Thanks for helping. This template is the reference module for the Druxt
repository standard, so a change here is a change to what every Druxt module
starts from.

## Getting set up

```bash
npm install
```

That installs dependencies and enables the git hooks. If you skipped install
scripts, run `npm run hooks:install` by hand, or the hooks stay on disk doing
nothing.

The toolchain is pinned in `.mise.toml`. With [mise](https://mise.jdx.dev)
installed, `mise install` gives you the same Node the pipeline uses.

## Before you push

```bash
npm run lint     # every check below except prose, which needs Vale installed
npm test         # jest, with the coverage floor enforced
```

The pre-commit hook runs both, so this is usually already done. The end-to-end
and visual suites are not in the hook, because they need the example
application built and served.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org). The commit-msg
hook checks them, and the pipeline checks the whole merge-request range.

This matters more than it looks: these repositories squash-merge, so the pull
request or merge request **title** becomes the commit subject. A prose title
passes the commit check and then breaks the next push to the target branch for
everyone. Title your pull request the same way you would title a commit.

## Coverage

`jest.config.js` carries a coverage floor measured from the current tests. It
is a floor. Raise it when coverage improves. Do not
lower it to make a change pass: if a change drops coverage, the change needs a
test.

## Visual baselines

Visual regression baselines are committed. Regenerate them with the manual
`visual:update` pipeline job, never locally.

Chromium renders differently on ARM, so a baseline generated on an Apple
silicon machine is a permanent false diff for everyone else. The manual job
runs on the reference architecture and hands back the PNGs to commit.

## What not to put in a file

This repository is public. Nothing that only resolves on a private network may
reach a tracked file, whether as a URL, in a comment or in a patch description.
`npm run lint:private` checks this and runs in the pipeline. When you need to
cite something internal, describe it without the URL or point at a public
equivalent.
