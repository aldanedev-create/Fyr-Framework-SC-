import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['packages/**/*.ts'],
      exclude: ['packages/**/*.test.ts', 'packages/**/__tests__/**'],
      outDir: 'dist',
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
      staticImport: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        'fyr': resolve(__dirname, 'packages/core/src/index.ts'),
        'fyr-python': resolve(__dirname, 'packages/python/src/index.ts'),
        'fyr-wasm': resolve(__dirname, 'packages/wasm/src/index.ts'),
        'fyr-router': resolve(__dirname, 'packages/router/src/index.ts'),
      },
      formats: ['es', 'cjs'],
      name: 'Fyr',
    },
    rollupOptions: {
      external: [],
      output: {
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          return {
            es: `${name}.esm.js`,
            cjs: `${name}.js`,
          } [chunkInfo.format as string] || `${name}.js`;
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'fyr.css';
          return assetInfo.name || 'assets/[name]-[hash][extname]';
        },
        globals: {
          'fyr': 'Fyr',
          'fyr-python': 'FyrPython',
          'fyr-wasm': 'FyrWasm',
          'fyr-router': 'FyrRouter',
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'es2022',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@fyr/core': resolve(__dirname, 'packages/core/src'),
      '@fyr/python': resolve(__dirname, 'packages/python/src'),
      '@fyr/wasm': resolve(__dirname, 'packages/wasm/src'),
      '@fyr/router': resolve(__dirname, 'packages/router/src'),
      '@fyr/test-utils': resolve(__dirname, 'tests/utils'),
    },
  },
  optimizeDeps: {
    include: [],
    exclude: ['fyr-python', 'fyr-wasm', 'fyr-router'],
  },
});