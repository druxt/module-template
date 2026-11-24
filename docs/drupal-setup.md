# Drupal setup

<!-- @TODO - replace this page, and add the pages this module needs. -->

What the Drupal site needs before a Druxt site can use this module. Say which
versions it was written against, so a reader knows how old the page is.

- [Modules](#modules)
- [Permissions](#permissions)
- [Check the site](#check-the-site)

## Modules

What to install, as commands rather than as prose:

```sh
composer require drupal/@TODO
drush pm:install @TODO
```

## Permissions

Which permission the role the site reads as needs, by its machine name, and
what the site does without it. A site that reads as `anonymous` and a site
that authenticates are both worth a line.

## Check the site

The request that proves the setup, and what a correct answer looks like:

```sh
curl -s 'https://cms.example.com/jsonapi/@TODO' | python3 -m json.tool
```

<!--
  How these pages work:

  - They live in docs/ and are read on GitHub as often as on the site, so
    every link between them is a relative path to the .md file.
  - docs-site/nav.js lists them in reading order. A page left out of the list
    still appears, after the listed ones, alphabetically.
  - The README is the site's landing page. Do not repeat it here.
  - Keep each page to one job, and name the errors a reader will search for.
    Troubleshooting works best as a heading per message.
-->
