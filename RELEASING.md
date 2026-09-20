# Releasing

The package publishes to npm from `.github/workflows/release.yml`. Nobody runs `npm publish` by hand. A module made from this template inherits the workflow, and turns it on with the [one-time setup](#one-time-setup).

| Channel     | npm dist-tag | When it publishes                                         | What it is for                        |
| ----------- | ------------ | --------------------------------------------------------- | ------------------------------------- |
| Development | `dev`        | Every push to `main` with a pending changeset             | Trying unreleased work on a real site |
| Stable      | `latest`     | When you merge the pull request that versions the package | Everyone else                         |

## Development releases

A push to `main` with a pending changeset cuts a snapshot and publishes it under the `dev` tag:

```bash
npm install <package>@dev
```

A snapshot version reads `0.1.0-dev.20260920005709`: the version the pending changesets add up to, then the tag and a timestamp. Nothing is committed, no git tag is made, and `latest` does not move.

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
4. The push that follows publishes the new version to `latest`. It also pushes a `v<version>` tag, with a GitHub Release.

## Build and publish jobs

Each channel runs as a build job followed by a publish job.

| Job     | Runs repository code          | Can publish to npm |
| ------- | ----------------------------- | ------------------ |
| Build   | Yes, install scripts included | No                 |
| Publish | No, it checks out nothing     | Yes                |

The build job ends by packing a tarball, and the publish job hands that tarball to npm. A pull request rehearses the build job only, so code in a pull request never runs with publishing rights.

## The pre-publish gate

`npm run release:check` runs before every publish, on both channels. It refuses a release when:

- a dependency uses a specifier that only resolves on the author's machine, such as `link:` or `workspace:`
- the version is at or below the one npm already has
- an entry in `files` was not built

## One-time setup

Publishing uses npm trusted publishing, so there is no npm token to store or rotate. Until the setup is complete the workflow stops after packing: the tarball it would have published is attached to the run as an artifact, and nothing reaches npm.

1. Publish the first version by hand, from a clean build: `npm publish --access public`. A package that does not exist on npm yet cannot name a trusted publisher.
2. On the npm website, open the package, then **Settings**, then **Trusted publisher**. Choose GitHub Actions, and enter the organization, the repository and the workflow filename `release.yml`. Leave the environment empty.
3. Create a GitHub App with read and write access to **Contents** and **Pull requests**, and install it on the repository. Store its ID as the repository variable `RELEASE_APP_ID` and its private key as the secret `RELEASE_APP_PRIVATE_KEY`. GitHub doesn't run checks on a pull request opened with the workflow's own token, so a protected `main` would never see them pass.
4. Set the repository variable `NPM_PUBLISH` to `true`.
