const baseUrl = process.env.GITPOD_WORKSPACE_ID
  ? `https://8080-${process.env.GITPOD_WORKSPACE_ID}.${process.env.GITPOD_WORKSPACE_CLUSTER_HOST}`
  : 'http://druxt-module-template.ddev.site'

export default {
  buildModules: [
    'druxt',
    'druxt-module-template'
  ],
  druxt: { baseUrl }
}
