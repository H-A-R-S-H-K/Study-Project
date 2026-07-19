import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin dashboard dev server on 5173; proxy /api to the backend so cookies/CORS
// stay simple in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Local backend dev port (see backend/.env). Socket.IO upgrades too.
      '/api': { target: 'http://localhost:5055', changeOrigin: true, ws: true },
    },
  },
});
