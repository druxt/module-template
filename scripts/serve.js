/**
 * Serve a generated site from a directory, the way a static host does.
 *
 * Used by the pipeline so the end-to-end and visual checks run against the
 * generated example, example/nuxt/dist, rather than the dev server, whose
 * output differs. No dependencies: it runs on the same Node as the module.
 *
 *   node scripts/serve.js <directory> [port]
 */

const { createServer } = require('node:http')
const { createReadStream, existsSync, statSync } = require('node:fs')
const { extname, join, normalize, resolve, sep } = require('node:path')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

/**
 * Resolve a request path to a file under root, or null.
 *
 * A directory resolves to its index.html, which is how Nuxt writes each
 * generated route. Anything that escapes the root resolves to nothing.
 */
function resolveFile(root, urlPath) {
  // A malformed escape such as /%zz throws URIError, and an uncaught throw in
  // the request handler takes the whole server down mid test run.
  let decoded
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0])
  } catch {
    return null
  }
  const candidate = resolve(root, '.' + normalize('/' + decoded))
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, 'index.html')
    return existsSync(index) ? index : null
  }
  return existsSync(candidate) ? candidate : null
}

/**
 * Start serving root on port. Returns the server, listening.
 */
function serve(root, port) {
  const absoluteRoot = resolve(root)
  const server = createServer((request, response) => {
    const file = resolveFile(absoluteRoot, request.url || '/')
    if (!file) {
      const notFound = join(absoluteRoot, '200.html')
      if (existsSync(notFound)) {
        response.writeHead(200, { 'content-type': TYPES['.html'] })
        createReadStream(notFound).pipe(response)
        return
      }
      response.writeHead(404, { 'content-type': TYPES['.txt'] })
      response.end('Not found\n')
      return
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
    })
    createReadStream(file).pipe(response)
  })
  server.listen(port, '127.0.0.1')
  return server
}

if (require.main === module) {
  const [root, port = '3000'] = process.argv.slice(2)
  if (!root || !existsSync(root)) {
    console.error(
      `Usage: node scripts/serve.js <directory> [port]. ${root || 'no directory'} does not exist; run npm run example:generate first.`
    )
    process.exit(2)
  }
  const server = serve(root, Number(port))
  server.on('listening', () =>
    console.log(`Serving ${resolve(root)} at http://127.0.0.1:${port}`)
  )
}

module.exports = { resolveFile, serve }
