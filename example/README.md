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

`example:setup` installs a fresh standard-profile Drupal 11 into a throwaway
SQLite database with `druxt` enabled and anonymous read access to its
resources, starts PHP's built-in server on the first free port from 8888, and
writes the URL to `example/.env` as `BASE_URL`. `example/nuxt/nuxt.config.js`
reads that file, so nothing is copied between terminals. `npm run example:info`
shows where the backend is, and `example:stop` and `example:start` control it.

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

| Path                   | Purpose                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `drupal/composer.json` | Drupal 11 with `drupal/druxt`; the lock is committed             |
| `drupal/.devtools/`    | Docker-free provisioning: assemble, provision, start, stop, info |
| `nuxt/`                | The Nuxt 2 application, with the module as `file:../..`          |
| `nuxt/package.json`    | Pins `consola` 2: webpack 4 cannot parse the version 3 build     |
