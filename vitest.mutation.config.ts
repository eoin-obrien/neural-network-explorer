import { defineConfig } from 'vitest/config';

/**
 * The suite Stryker runs against each domain mutant. Only the domain's own
 * tests: a mutated theta cannot be caught by a component test that never
 * exercised it, and running them would multiply the slowest tests by the
 * number of mutants.
 *
 * Node rather than jsdom, and no setup file, for the same reason the domain has
 * no React dependency — there is nothing here that needs a DOM.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/domain/**/*.test.ts'],
  },
});
