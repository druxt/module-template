import fs from 'fs'
import path from 'path'

// The Drupal backend this example talks to.
//
// DRUXT_BASE_URL first, so CI can point the example at whatever backend it
// has without editing a tracked file. Then the BASE_URL that
// example/drupal/.devtools/start writes to example/.env, so the Docker-free
// backend is found without copying a URL between terminals. The DDEV host is
// the last resort, and is one of the development domains the private-host
// lint allows.
function readDotenvBaseUrl() {
  try {
    const contents = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    const match = contents.match(/^\s*BASE_URL\s*=\s*(.*?)\s*$/m)
    return match ? match[1].replace(/^(['"])(.*)\1$/, '$2') : null
  } catch {
    return null
  }
}

const baseUrl =
  process.env.DRUXT_BASE_URL ||
  readDotenvBaseUrl() ||
  'http://druxt-module-template.ddev.site'

export default {
  buildModules: ['druxt', 'druxt-module-template'],
  druxt: { baseUrl },
}
