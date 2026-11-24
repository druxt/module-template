import { ORDER } from './nav'

/*
 * The documentation site for this module.
 *
 * Everything about how it looks comes from @druxt/dui. What is left here is
 * this module's own name, where its pages are, and the base path GitHub Pages
 * serves it from.
 *
 * @TODO - the five values marked below are this module's. Everything else is
 * the same in every Druxt module and is better left alone.
 */

// GitHub Pages serves a project site from /<repository>/, so every asset and
// route has to be built under that prefix. It is read from the environment
// rather than written down, because a value written down is a value that is
// wrong on the next repository that copies this file.
const repository = (process.env.GITHUB_REPOSITORY || '').split('/')[1]
const base = repository ? `/${repository}/` : '/'

export default {
  target: 'static',
  ssr: true,

  router: { base },

  publicRuntimeConfig: {
    // @TODO - the module's name, as a reader says it.
    docsTitle: 'Druxt module template',
    // @TODO - one sentence, what the module does.
    docsTagline: 'Starting point for a Druxt module.',
    // @TODO - this repository.
    docsRepoUrl: 'https://github.com/druxt/module-template',
    docsBadges: [
      {
        text: 'npm',
        // @TODO - the published package.
        href: 'https://www.npmjs.com/package/druxt-module-template',
      },
    ],

    /*
     * The links every Druxt site shows, plus this module's own source. A site
     * with a Drupal backend fills the same store state from its menu instead.
     */
    docsLinks: [
      {
        text: 'GitHub',
        icon: 'github',
        href: 'https://github.com/druxt/module-template',
      },
      { text: 'Discord', icon: 'discord', href: 'https://discord.druxtjs.org' },
    ],

    /*
     * The runnable example, linked from the sidebar and embedded on the
     * landing page. Leave it out where the example needs a Drupal backend
     * that StackBlitz cannot bring up, such as one that runs on DDEV: a link
     * would open a container that never serves the site.
     */
    // docsDemo: {
    //   repo: 'druxt/module-template',
    //   gitRef: '0.x',
    //   dir: 'example/nuxt',
    //   file: 'nuxt.config.js',
    // },
  },

  head: {
    // @TODO - the module's name again, appended to every page's title.
    titleTemplate: '%s - Druxt module template',
    htmlAttrs: { lang: 'en' },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    script: [
      {
        // The theme is set before the first paint, so a reader who prefers
        // dark does not see a white page first.
        hid: 'druxt-theme-init',
        innerHTML:
          "(function(){try{var k='druxt-color-mode';var p=localStorage.getItem(k)||'system';var v=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;document.documentElement.setAttribute('data-theme',v)}catch(e){}})()",
      },
    ],
    __dangerouslyDisableSanitizersByTagID: {
      'druxt-theme-init': ['innerHTML'],
    },
  },

  // No @nuxt/postcss8: Nuxt 2.18 is already on postcss 8, and the module
  // drags in css-loader 5, whose webpack 5 is hoisted over the webpack 4
  // that Nuxt 2 builds with. The build then fails inside
  // html-webpack-plugin, nowhere near the cause.
  buildModules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],

  colorMode: {
    classSuffix: '',
    dataValue: 'theme',
    storageKey: 'druxt-color-mode',
  },

  // @druxt/dui before @nuxt/content, deliberately. Content parses every file
  // while it starts up, so a hook registered by a module listed after it is
  // registered too late and never runs.
  modules: [
    [
      '@druxt/dui',
      {
        // Where a link that leaves docs/ points instead: the same file on
        // GitHub, which is the only place the site can send a reader for it.
        repoUrl: 'https://github.com/druxt/module-template',
        gitRef: '0.x',
        // Where this site is published, for the sitemap and llms.txt. It has
        // no default: a build's own environment could answer it, and that
        // answer goes wrong the moment a custom domain is set.
        // @TODO - a module in the druxt-contrib organisation is served from
        // https://contrib.druxtjs.org.
        siteUrl: 'https://druxt.github.io',
        order: ORDER,
      },
    ],
    '@nuxt/content',
  ],

  generate: { fallback: '404.html' },
}
