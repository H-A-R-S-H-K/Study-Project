import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin dashboard dev server on 5173; proxy /api to the backend so cookies/CORS
// stay simple in development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
