import { defineConfig } from 'vite';

export default defineConfig({
  // Set the root directory
  root: '.',
  base: './',

  // Configure the development server
  server: {
    port: 3000,
    open: true, // Automatically open browser
    host: true, // Allow external connections
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['d3', 'topojson-client'],
  },

  // Configure how modules are resolved
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  // TypeScript configuration
  esbuild: {
    target: 'es2020',
  },

  // Vitest configuration
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
