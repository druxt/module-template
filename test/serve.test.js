const { get } = require('node:http')
const { mkdtempSync, mkdirSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')

const { resolveFile, serve } = require('../scripts/serve.js')

const root = mkdtempSync(join(tmpdir(), 'serve-'))
mkdirSync(join(root, 'about'))
writeFileSync(join(root, 'index.html'), '<h1>home</h1>')
writeFileSync(join(root, 'about', 'index.html'), '<h1>about</h1>')
writeFileSync(join(root, 'robots.txt'), 'User-agent: *')

const request = (url) =>
  new Promise((resolve, reject) => {
    get(url, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => (body += chunk))
      response.on('end', () =>
        resolve({
          status: response.statusCode,
          type: response.headers['content-type'],
          body,
        })
      )
    }).on('error', reject)
  })

describe('resolveFile', () => {
  test('a directory resolves to its index.html', () => {
    expect(resolveFile(root, '/about/')).toBe(join(root, 'about', 'index.html'))
    expect(resolveFile(root, '/about')).toBe(join(root, 'about', 'index.html'))
  })

  test('a file resolves to itself, without its query string', () => {
    expect(resolveFile(root, '/robots.txt?v=1')).toBe(join(root, 'robots.txt'))
  })

  test('a path that escapes the root resolves to nothing', () => {
    expect(resolveFile(root, '/../../etc/passwd')).toBeNull()
    expect(resolveFile(root, '/%2e%2e/%2e%2e/etc/passwd')).toBeNull()
  })

  test('a missing path resolves to nothing', () => {
    expect(resolveFile(root, '/missing')).toBeNull()
  })
})

describe('serve', () => {
  let server
  let base

  beforeAll(async () => {
    server = serve(root, 0)
    await new Promise((done) => server.on('listening', done))
    base = `http://127.0.0.1:${server.address().port}`
  })

  afterAll(() => server.close())

  test('serves generated routes with an HTML content type', async () => {
    const about = await request(`${base}/about/`)
    expect(about.status).toBe(200)
    expect(about.type).toMatch(/text\/html/)
    expect(about.body).toBe('<h1>about</h1>')
  })

  test('answers 404 for a route that was not generated', async () => {
    const missing = await request(`${base}/nope`)
    expect(missing.status).toBe(404)
  })
})
