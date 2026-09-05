const { defineConfig, devices } = require('@playwright/test')

/**
 * Visual regression against the example application.
 *
 * One project per viewport, because a layout change that breaks one breakpoint
 * passes every unit test and every other viewport. Baselines are committed and
 * are regenerated only by the manual `visual:update` pipeline job: Chromium
 * renders differently on ARM, so a baseline generated on an Apple silicon
 * machine is a permanent false diff for everyone else.
 *
 * `webServer` builds and serves the example application, so a developer runs
 * the same thing CI does with one command rather than remembering a sequence.
 */
module.exports = defineConfig({
  testDir: './test/e2e',
  // Snapshots beside the tests rather than beside the results, so the manual
  // update job can hand back one directory to commit.
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{arg}{ext}',
  outputDir: './test-results',
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list']],
  // Retries in CI only. A retry locally hides a flaky test from the person who
  // just wrote it.
  retries: process.env.CI ? 1 : 0,
  // Serial in CI: the shared runner is not fast enough for parallel Chromium
  // instances to render consistently, and inconsistent rendering is
  // indistinguishable from a real visual regression.
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: {
      // Anti-aliasing differs slightly between runs on the same architecture.
      // Zero tolerance produces failures nobody can act on; this is tight
      // enough to catch a real layout or colour change.
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm --prefix example/nuxt run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },
})
