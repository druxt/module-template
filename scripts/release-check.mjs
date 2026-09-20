/**
 * Pre-publish gate: refuse a release that would publish a broken package.
 * The release workflow runs it after versioning and building, before any
 * publish.
 *
 *   node scripts/release-check.mjs [--offline] [--skip-files] [--unpublished]
 *
 * --offline      skip the npm registry comparison.
 * --skip-files   skip the built-files check, for when no build has run.
 * --unpublished  print `name@version` when npm does not have this version
 *                yet, and check nothing.
 *
 * It checks three things. A dependency specifier such as `link:` or
 * `workspace:` resolves on the author's machine and nowhere else. A version
 * at or below the published one either fails to publish or, as a snapshot,
 * sorts below the release it was cut after. And a build that emits nothing
 * still exits zero, so a `files` entry has to exist and hold something.
 */

import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FIELDS = ['dependencies', 'peerDependencies', 'optionalDependencies']
const UNPUBLISHABLE =
  /^(workspace|link|file|portal|git|git\+ssh|git\+https|github|https?):/
const REGISTRY_TIMEOUT = 15000
const VERSION = /^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/

/**
 * Splits a version into its numeric core and whether it is a prerelease.
 *
 * @param {string} version - The version to parse.
 * @returns {object|null} `{ core, prerelease }`, or `null` when it is invalid.
 */
export function parseVersion(version) {
  const match = VERSION.exec(version)
  if (!match) return null
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: Boolean(match[4]),
  }
}

// Compares two numeric cores: negative, zero or positive, as a sort would.
const compareCores = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

/**
 * Checks a manifest against the rules.
 *
 * @param {object} options - The check input.
 * @param {object} options.manifest - The parsed package.json.
 * @param {string} options.dir - The package directory.
 * @param {object|null} [options.record] - `{ latest, versions }` from npm, or `null` when unpublished. Omit to skip the registry rule.
 * @param {boolean} [options.files] - Whether to check the `files` entries.
 * @returns {string[]} One message per problem.
 */
export function checkManifest({ manifest, dir, record, files = true }) {
  const problems = []
  const parsed = parseVersion(manifest.version)

  if (!parsed) {
    return [`"${manifest.version}" is not a valid version.`]
  }

  for (const field of FIELDS) {
    for (const [dep, range] of Object.entries(manifest[field] || {})) {
      if (UNPUBLISHABLE.test(range)) {
        problems.push(
          `${field}.${dep} is "${range}", which does not resolve from npm.`
        )
      }
    }
  }

  if (record && !record.versions.includes(manifest.version)) {
    const latest = parseVersion(record.latest)
    const order = latest ? compareCores(parsed.core, latest.core) : 1
    if (
      order < 0 ||
      (order === 0 && (parsed.prerelease || !latest.prerelease))
    ) {
      problems.push(
        `${manifest.version} does not rise above the published ${record.latest}.`
      )
    }
  }

  if (files) {
    for (const entry of manifest.files || []) {
      const target = path.join(dir, entry)
      if (!fs.existsSync(target)) {
        problems.push(`files entry "${entry}" does not exist. Build first.`)
      } else if (
        fs.statSync(target).isDirectory() &&
        fs.readdirSync(target).length === 0
      ) {
        problems.push(`files entry "${entry}" is empty.`)
      }
    }
  }

  return problems
}

/**
 * Fetches the published versions of a package.
 *
 * @param {string} name - The package name.
 * @returns {Promise<object|null>} `{ latest, versions }`, or `null` when npm has no such package.
 */
export function fetchRecord(name) {
  const url = `https://registry.npmjs.org/${name.replace(/\//g, '%2f')}`
  const headers = { accept: 'application/vnd.npm.install-v1+json' }

  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      { headers, timeout: REGISTRY_TIMEOUT },
      (response) => {
        if (response.statusCode === 404) {
          response.resume()
          return resolve(null)
        }
        if (response.statusCode !== 200) {
          response.resume()
          return reject(
            new Error(`npm answered ${response.statusCode} for ${name}.`)
          )
        }

        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          body += chunk
        })
        response.on('end', () => {
          const data = JSON.parse(body)
          resolve({
            latest: data['dist-tags'].latest,
            versions: Object.keys(data.versions),
          })
        })
      }
    )

    // Without this a stalled connection holds the job until its own timeout.
    request.on('timeout', () =>
      request.destroy(
        new Error(`npm did not answer for ${name} within 15 seconds.`)
      )
    )
    request.on('error', reject)
  })
}

export async function main(argv = process.argv.slice(2)) {
  const flags = ['--offline', '--skip-files', '--unpublished']
  const options = argv.filter((arg) => arg.startsWith('--'))
  const unknown = options.filter(
    (arg) => !flags.includes(arg) && !arg.startsWith('--registry-file=')
  )
  if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`)

  const dir = path.resolve(argv.find((arg) => !arg.startsWith('--')) ?? ROOT)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
  )
  if (manifest.private) {
    console.log('release-check: the package is private, nothing to publish.')
    return
  }

  // A recorded registry answer, so the tests never depend on the network.
  const recorded = options.find((arg) => arg.startsWith('--registry-file='))
  let record
  if (recorded) {
    record = JSON.parse(fs.readFileSync(recorded.split('=')[1], 'utf8'))
  } else if (!options.includes('--offline')) {
    record = await fetchRecord(manifest.name)
  }

  if (options.includes('--unpublished')) {
    if (record === undefined) {
      throw new Error('--unpublished needs the registry, so not --offline.')
    }
    if (!record || !record.versions.includes(manifest.version)) {
      console.log(`${manifest.name}@${manifest.version}`)
    }
    return
  }

  const problems = checkManifest({
    manifest,
    dir,
    record,
    files: !options.includes('--skip-files'),
  })
  for (const problem of problems) console.error(`release-check: ${problem}`)
  if (problems.length) process.exit(1)
  console.log(
    `release-check: ${manifest.name}@${manifest.version} can publish.`
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(`release-check: ${error.message}`)
    process.exit(1)
  })
}
