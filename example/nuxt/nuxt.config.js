// The Drupal backend this example talks to.
//
// DRUXT_BASE_URL first, so CI and the devcontainer can point the example at
// whatever backend they have without editing a tracked file. The DDEV host is
// the local default, and is one of the development domains the private-host
// lint allows.
//
// The previous Gitpod branch is gone with the Gitpod configuration: it built a
// URL from GITPOD_WORKSPACE_ID, which is unset everywhere the example now runs.
const baseUrl =
  process.env.DRUXT_BASE_URL || 'http://druxt-module-template.ddev.site'

export default {
  buildModules: ['druxt', 'druxt-module-template'],
  druxt: { baseUrl },
}
