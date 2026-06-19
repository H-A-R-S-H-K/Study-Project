import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000, // first mongod spawn can be slow
    fileParallelism: false, // one shared in-memory DB across files
    env: {
      NODE_ENV: 'test',
      // Use the locally-installed mongod instead of downloading a binary.
      MONGOMS_SYSTEM_BINARY: '/opt/homebrew/bin/mongod',
      // Deterministic secrets for tests (env.ts requires these).
      JWT_ACCESS_SECRET: 'test_access_secret_0123456789',
      JWT_REFRESH_SECRET: 'test_refresh_secret_0123456789',
      MONGO_URI: 'mongodb://127.0.0.1:27017/placeholder',
    },
  },
});
