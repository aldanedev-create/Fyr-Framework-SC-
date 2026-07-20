import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx,js}', 'tests/**/*.{test,spec}.{ts,tsx,js}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/examples/**',
      '**/__snapshots__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'tests/**',
        'examples/**',
        'dist/**',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    reporters: ['default', 'html'],
    testTimeout: 10000,
    hookTimeout: 10000,
    isolate: true,
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true,
      },
    },
    benchmark: {
      reporters: ['default'],
    },
  },
  resolve: {
    alias: {
      '@fyr/core': resolve(currentDirectory, 'src/core'),
      '@fyr/core/*': resolve(currentDirectory, 'src/core/*'),
      '@fyr/python': resolve(currentDirectory, 'src/python'),
      '@fyr/python/*': resolve(currentDirectory, 'src/python/*'),
      '@fyr/wasm': resolve(currentDirectory, 'src/wasm'),
      '@fyr/wasm/*': resolve(currentDirectory, 'src/wasm/*'),
      '@fyr/router': resolve(currentDirectory, 'src/router'),
      '@fyr/router/*': resolve(currentDirectory, 'src/router/*'),
      '@fyr/test-utils': resolve(currentDirectory, 'tests/utils'),
    },
  },
});
