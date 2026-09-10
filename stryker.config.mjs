/**
 * Mutation testing for the mathematical domain, and nothing else.
 *
 * Coverage says every line of the domain ran. It does not say a test would have
 * noticed if `+` became `-`. Stryker makes that change and asks whether the
 * suite fails, which is the only way to tell a specification from an execution.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // Named explicitly because pnpm's isolated node_modules keeps the runner out
  // of Stryker's own resolution path, where the default plugin scan looks.
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.mutation.config.ts' },

  // Presentation and application code is covered by component and browser
  // tests, which assert behaviour rather than arithmetic. The domain is where a
  // silently surviving operator change would be a defect in the tests.
  mutate: ['src/domain/**/*.ts', '!src/domain/**/*.test.ts'],

  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },

  // A survivor in the core mathematics is a gap in the specification, not a
  // score to tolerate: the build fails until it is killed or documented.
  thresholds: { high: 100, low: 100, break: 100 },

  // Nothing here is timing-dependent, so a generous factor only masks a hang.
  timeoutFactor: 2,

  // Removed even when the run fails. A sandbox left behind carries a nested
  // copy of node_modules that the other quality gates would then walk into.
  cleanTempDir: 'always',
};
