const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const { join } = require('node:path')

// The gate is an ES module and the package is CommonJS, so it runs in a real
// node process here, which is also how the release workflow runs it.
const SCRIPT = join(__dirname, '..', 'scripts', 'release-check.mjs')

let dir

const write = (manifest, record) => {
  fs.writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest))
  if (record !== undefined) {
    fs.writeFileSync(join(dir, 'registry.json'), JSON.stringify(record))
  }
}

const run = (...flags) => {
  const registry = fs.existsSync(join(dir, 'registry.json'))
    ? [`--registry-file=${join(dir, 'registry.json')}`]
    : ['--offline']
  const result = spawnSync(
    process.execPath,
    [SCRIPT, dir, ...registry, ...flags],
    { encoding: 'utf8' }
  )
  return { status: result.status, out: result.stdout + result.stderr }
}

beforeEach(() => {
  dir = fs.mkdtempSync(join(os.tmpdir(), 'release-check-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('release-check', () => {
  test('passes a publishable package', () => {
    write({ name: 'x', version: '1.0.0', dependencies: { druxt: '^0.24.0' } })
    expect(run('--skip-files')).toEqual({
      status: 0,
      out: 'release-check: x@1.0.0 can publish.\n',
    })
  })

  test.each(['workspace:*', 'link:../druxt', 'file:../druxt'])(
    'refuses the specifier %s',
    (range) => {
      write({ name: 'x', version: '1.0.0', peerDependencies: { druxt: range } })
      const result = run('--skip-files')
      expect(result.status).toBe(1)
      expect(result.out).toContain('does not resolve from npm')
    }
  )

  test('refuses an invalid version', () => {
    write({ name: 'x', version: '1.0' })
    expect(run('--skip-files').out).toContain('is not a valid version')
  })

  test('refuses a version below the published one', () => {
    write(
      { name: 'x', version: '1.1.9' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    const result = run('--skip-files')
    expect(result.status).toBe(1)
    expect(result.out).toContain('does not rise above the published 1.2.0')
  })

  test('refuses a snapshot of an already published version', () => {
    write(
      { name: 'x', version: '1.2.0-dev.20260920004838' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    expect(run('--skip-files').status).toBe(1)
  })

  test('passes a snapshot above the published version', () => {
    write(
      { name: 'x', version: '1.2.1-dev.20260920004838' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    expect(run('--skip-files').status).toBe(0)
  })

  test('passes a stable release over its own prerelease', () => {
    write(
      { name: 'x', version: '2.0.0' },
      { latest: '2.0.0-beta.1', versions: ['2.0.0-beta.1'] }
    )
    expect(run('--skip-files').status).toBe(0)
  })

  test('passes an already published version, because publish skips it', () => {
    write(
      { name: 'x', version: '1.2.0' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    expect(run('--skip-files').status).toBe(0)
  })

  test('passes a package npm has never seen', () => {
    write({ name: 'x', version: '0.0.1' }, null)
    expect(run('--skip-files').status).toBe(0)
  })

  test('refuses a files entry that was not built, or is empty', () => {
    write({ name: 'x', version: '1.0.0', files: ['dist', 'templates'] })
    fs.mkdirSync(join(dir, 'dist'))
    const result = run()
    expect(result.status).toBe(1)
    expect(result.out).toContain('files entry "dist" is empty')
    expect(result.out).toContain('files entry "templates" does not exist')

    fs.writeFileSync(join(dir, 'dist', 'index.js'), '')
    fs.mkdirSync(join(dir, 'templates'))
    fs.writeFileSync(join(dir, 'templates', 'plugin.js'), '')
    expect(run().status).toBe(0)
  })

  test.each([undefined, []])('refuses a files list of %p', (list) => {
    write({ name: 'x', version: '1.0.0', files: list })
    const result = run()
    expect(result.status).toBe(1)
    expect(result.out).toContain('has no "files" list')
    expect(run('--skip-files').status).toBe(0)
  })

  test('skips a private package', () => {
    write({ name: 'x', version: 'nope', private: true })
    expect(run()).toEqual({
      status: 0,
      out: 'release-check: the package is private, nothing to publish.\n',
    })
  })

  test('--unpublished prints the version only when npm lacks it', () => {
    write(
      { name: 'x', version: '1.2.1' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    expect(run('--unpublished').out).toBe('x@1.2.1\n')

    write(
      { name: 'x', version: '1.2.0' },
      { latest: '1.2.0', versions: ['1.2.0'] }
    )
    expect(run('--unpublished').out).toBe('')
  })

  test('refuses an unknown option', () => {
    write({ name: 'x', version: '1.0.0' })
    const result = run('--nope')
    expect(result.status).toBe(1)
    expect(result.out).toContain('Unknown option: --nope')
  })
})
