import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';

/** Emits CDN-friendly minified ESM entry points without replacing the readable builds. */
export default defineConfig(mergeConfig(baseConfig, {
  build: {
    emptyOutDir: false,
    minify: 'esbuild',
    lib: {
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.min.js`,
    },
  },
}));
