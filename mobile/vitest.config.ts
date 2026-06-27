import { defineConfig } from 'vitest/config';

/**
 * Vitest runs the pure logic (reducers, formatters, validators) that doesn't
 * touch native React Native modules. Component/e2e testing would use Detox or a
 * React Native testing setup; the pure units are what give fast, reliable
 * regression coverage here.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
