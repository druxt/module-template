# Releasing

The package publishes to npm from `.github/workflows/release.yml`. Nobody runs `npm publish` by hand. A module made from this template inherits the workflow, and turns it on with the [one-time setup](#one-time-setup).

| Channel     | npm dist-tag | When it publishes                                         | What it is for                        |
| ----------- | ------------ | --------------------------------------------------------- | ------------------------------------- |
| Development | `dev`        | A push to a release branch that changes a changeset       | Trying unreleased work on a real site |
| Stable      | `latest`     | When you merge the pull request that versions the package | Everyone else                         |

A release branch is named for its major, such as `0.x` or `1.x`. The workflow matches them by pattern, so a branch cut on demand releases too. Set `baseBranch` in `.changeset/config.json` to the branch your releases come from.

## Development releases

A push to a release branch that adds or changes a changeset cuts a snapshot and publishes it under the `dev` tag:

```bash
npm install <package>@dev
```

A snapshot version reads `0.1.0-dev.20261030024907`: the version the pending changesets add up to, then the tag and a timestamp. Nothing is committed, no git tag is made, and `latest` does not move. A changeset that releases nothing, such as an empty one, cuts no snapshot.

To follow the channel on a site, let Renovate track the tag:

```json
{
  "packageRules": [{ "matchPackageNames": ["<package>"], "followTag": "dev" }]
}
```

## Stable releases

1. Merge pull requests that carry a changeset. Add one with `npm run changeset`.
2. The workflow opens a pull request titled `chore(release): version packages`, and keeps it up to date. It holds the version bump and the changelog entry.
3. Merge that pull request when the release is ready. This is the release decision.
4. The push that follows waits for a reviewer to approve the `release` environment, then publishes the new version to `latest`. It also creates a `<package>@<version>` tag, with a GitHub Release whose notes are that version's CHANGELOG entry.

A release from an older major's branch publishes under its own tag: `1.9.1`, cut on `1.x` after `2.0.0`, goes to `latest-1`. GitHub does not mark its Release as the latest one. A prerelease publishes under `next`.

A version counts as released once npm has it and its GitHub Release exists. If a run fails between the two, rerun it: it skips the publish and creates the missing Release.

## Build and publish jobs

| Job                | Runs repository code                                   | Can write to the repository           | Can publish to npm |
| ------------------ | ------------------------------------------------------ | ------------------------------------- | ------------------ |
| `snapshot`, `pack` | Yes, install scripts included                          | No                                    | No                 |
| `version`          | Only the changesets tooling, installed without scripts | Yes, to open the version pull request | No                 |
| `dev`, `release`   | No, they check out nothing                             | `release` creates the tag and Release | Yes                |

The build jobs end by packing a tarball, and the publish jobs hand that tarball to npm. A pull request rehearses the `snapshot` job only, so code in a pull request never runs with publishing rights. A fork's own pushes skip the workflow.

## The pre-publish gate

`npm run release:check` runs before every publish, on both channels. It refuses a release when:

- a dependency uses a specifier that only resolves on the author's machine, such as `link:` or `workspace:`
- the version is at or below the highest one npm already has for its major
- an entry in `files` was not built

## One-time setup

Publishing uses npm trusted publishing, so there is no npm token to store or rotate. Until the setup is complete the workflow stops after packing: the tarball it would have published is attached to the run as an artifact, and nothing reaches npm.

1. Publish the first version by hand, from a clean build: `npm publish --access public`. A package that does not exist on npm yet cannot name a trusted publisher.
2. On the npm website, open the package, then **Settings**, then **Trusted publisher**. Choose GitHub Actions, and enter the organization, the repository and the workflow filename `release.yml`. Leave the environment empty, because the `dev` job publishes without one. Under **Allowed actions**, tick **Allow npm publish**: the workflow publishes directly, and a publisher limited to staged publishing refuses it.
3. Under the repository's **Settings**, then **Environments**, create the `release` environment and add yourself, or the people who cut releases, as required reviewers. Without a rule the environment still works, but nothing pauses before a stable publish.
4. Create a GitHub App with read and write access to **Contents** and **Pull requests**, and install it on the repository. Store its ID as the repository variable `RELEASE_APP_ID` and its private key as the secret `RELEASE_APP_PRIVATE_KEY`. GitHub doesn't run checks on a pull request opened with the workflow's own token, so a protected branch would never see them pass.
5. Set the repository variable `NPM_PUBLISH` to `true`.
