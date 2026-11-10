import path from 'node:path'
import { defineConfig } from 'vitest/config'

// Unit tests run in Node. Tests that need Postgres use TEST_DATABASE_URL (a throwaway local
// database) and are skipped when it is unset; they never touch DATABASE_URL.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // `server-only` throws outside a React Server Components bundle; tests import server modules directly.
      'server-only': path.resolve(import.meta.dirname, 'tests/stubs/empty.ts'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
    passWithNoTests: true,
  },
})
