module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,vue}'],
  coverageDirectory: './coverage/',
  // A floor, not a target. These are the measured baseline of this template's
  // own tests, rounded down: raise them as coverage genuinely improves, and
  // never lower them to make a merge request pass. Collecting coverage without
  // a threshold is the shape this replaces, and it enforces nothing while
  // looking like it does.
  //
  // Branches sits below 100 because esbuild's transform emits interop branches
  // in the compiled output that no test can reach. Measured, not guessed: run
  // `npm test` and read the table before changing these.
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 77,
      functions: 100,
      lines: 100,
    },
  },
  coveragePathIgnorePatterns: ['/dist/', '/node_modules/'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  modulePathIgnorePatterns: ['/example/'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/example/', '/test/e2e/'],
  transform: {
    '^.+\\.(js)$': 'esbuild-jest',
    '^.+\\.(mjs)$': 'esbuild-jest',
    '^.+\\.(vue)$': 'vue-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!(druxt)/)'],
}
