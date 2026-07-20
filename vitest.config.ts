import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

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
    include: ['packages/**/*.{test,spec}.{ts,tsx,js}', 'tests/**/*.{test,spec}.{ts,tsx,js}'],
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
      include: ['packages/**/*.ts'],
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
      '@fyr/core': resolve(__dirname, 'packages/core/src'),
      '@fyr/core/*': resolve(__dirname, 'packages/core/src/*'),
      '@fyr/python': resolve(__dirname, 'packages/python/src'),
      '@fyr/python/*': resolve(__dirname, 'packages/python/src/*'),
      '@fyr/wasm': resolve(__dirname, 'packages/wasm/src'),
      '@fyr/wasm/*': resolve(__dirname, 'packages/wasm/src/*'),
      '@fyr/router': resolve(__dirname, 'packages/router/src'),
      '@fyr/router/*': resolve(__dirname, 'packages/router/src/*'),
      '@fyr/test-utils': resolve(__dirname, 'tests/utils'),
    },
  },
});