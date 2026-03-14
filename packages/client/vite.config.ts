import { defineConfig } from 'vite';

export default defineConfig({
  // Look for .env file in the root directory
  envDir: '../../',

  server: {
    port: 3000,
    strictPort: true, // fail if 3000 is in use instead of moving to 3001 (reserved for API server)

    // Allow Cloudflare tunnel and other external hosts
    allowedHosts: ['.trycloudflare.com', '.discordsays.com', '.cloudflare.net'],

    // Proxy API requests to the backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
      },
    },

    // Required for Discord iframe - must use port 443 for HMR
    hmr: {
      clientPort: 443,
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
