import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Prefer a locally-installed mongod (skips a download); on CI it's absent, so
// mongodb-memory-server downloads its own binary.
const LOCAL_MONGOD = '/opt/homebrew/bin/mongod';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000, // first mongod spawn/download can be slow
    fileParallelism: false, // one shared in-memory DB across files
    env: {
      NODE_ENV: 'test',
      ...(existsSync(LOCAL_MONGOD) ? { MONGOMS_SYSTEM_BINARY: LOCAL_MONGOD } : {}),
      // Deterministic secrets for tests (env.ts requires these).
      JWT_ACCESS_SECRET: 'test_access_secret_0123456789',
      JWT_REFRESH_SECRET: 'test_refresh_secret_0123456789',
      MONGO_URI: 'mongodb://127.0.0.1:27017/placeholder',
    },
  },
});
