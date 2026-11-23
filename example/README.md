# Example application

A Drupal backend and a Nuxt application that loads the module, so a change to
the module is seen running against a real site.

## Run it

From the repository root, with PHP 8.3 or later, Composer and Node 16:

```sh
npm install              # the module's dependencies, and the git hooks
npm run build            # the example links the module by path, so build first
npm run example:setup    # Drupal 11 on SQLite, druxt enabled, then the example's dependencies
npm run example:dev      # http://localhost:3000
```

The backend is a small Drupal module, `example/drupal/`, built into a site by
[Eddy](https://github.com/drevops/eddy)'s tooling. `example:setup` runs its
commands in order:

- `example:assemble` builds the newest Drupal 11 release in
  `example/drupal/build/`, with `drupal/druxt` and this module.
- `example:start` starts PHP's built-in server on the first free port from
  8000, or on `WEBSERVER_PORT`, and writes the URL to `example/.env` as
  `BASE_URL`. `example/nuxt/nuxt.config.js` reads that file, so nothing is
  copied between terminals.
- `example:provision` installs the standard profile into a throwaway SQLite
  database, enables this module and applies its recipe, which sets up what the
  example reads.
- `example:install` installs the Nuxt application's dependencies.

`npm run example:info` shows where the backend is, `example:login` prints a
one-time login link, and `example:stop` and `example:start` control the
server. Each command first installs Eddy's tooling into
`example/drupal/vendor/`, which takes a moment the first time only.

The dev container does all of this on creation.

## Tests against it

`npm run test:e2e` runs Playwright against the example. With no
`PLAYWRIGHT_BASE_URL` it starts the dev server itself, so the backend has to be
up. The pipelines generate the example (`npm run example:generate`) and serve
`example/nuxt/dist` with `npm run serve` instead, which is what a visitor gets.

## DDEV

`cd example/drupal && ddev start && ddev drupal-install` builds the same site
on DDEV's MySQL. Set `DRUXT_BASE_URL` to the DDEV URL, or leave `example/.env`
absent and the example falls back to it.

## What is in here

| Path                       | Purpose                                                        |
| -------------------------- | -------------------------------------------------------------- |
| `drupal/composer.json`     | The example module, requiring `drupal/druxt`; no site lock     |
| `drupal/composer.dev.json` | Eddy's tooling, Drush and the Drupal major to build            |
| `drupal/recipes/`          | The example's recipe: modules, permissions and default content |
| `drupal/scripts/`          | Eddy's tooling installer, and the start and provision hooks    |
| `nuxt/`                    | The Nuxt 2 application, with the module as `file:../..`        |
| `nuxt/package.json`        | Pins `consola` 2: webpack 4 cannot parse the version 3 build   |

To change what the backend holds, change the recipe, or add default content to
its `content/` directory. The site build is not committed, so each assemble
resolves the newest releases that `composer.json` allows.
