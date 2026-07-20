import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PreRenderedAsset } from 'rollup';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        'fyr': resolve(currentDirectory, 'src/core/index.ts'),
        'fyr-python': resolve(currentDirectory, 'src/python/index.ts'),
        'fyr-python.worker': resolve(currentDirectory, 'src/python/python.worker.ts'),
        'fyr-wasm': resolve(currentDirectory, 'src/wasm/index.ts'),
        'fyr-router': resolve(currentDirectory, 'src/router/index.ts'),
        'fyr-socket': resolve(currentDirectory, 'src/socket/index.ts'),
        'fyr-ui': resolve(currentDirectory, 'src/ui/index.ts'),
      },
      formats: ['es', 'cjs'],
      name: 'Fyr',
      fileName: (format, entryName) => format === 'es' ? `${entryName}.esm.js` : `${entryName}.js`,
    },
    rollupOptions: {
      external: [],
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo: PreRenderedAsset) => {
          if (assetInfo.name?.endsWith('.css')) return 'fyr-ui.css';
          return assetInfo.name || 'assets/[name]-[hash][extname]';
        },
        globals: {
          'fyr': 'Fyr',
          'fyr-python': 'FyrPython',
          'fyr-wasm': 'FyrWasm',
          'fyr-router': 'FyrRouter',
        },
        exports: 'named',
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
      '@fyr/core': resolve(currentDirectory, 'src/core'),
      '@fyr/python': resolve(currentDirectory, 'src/python'),
      '@fyr/wasm': resolve(currentDirectory, 'src/wasm'),
      '@fyr/router': resolve(currentDirectory, 'src/router'),
      '@fyr/test-utils': resolve(currentDirectory, 'tests/utils'),
    },
  },
  optimizeDeps: {
    include: [],
    exclude: ['fyr-python', 'fyr-wasm', 'fyr-router'],
  },
});
