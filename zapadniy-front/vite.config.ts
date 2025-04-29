import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  resolve: {
    alias: {
      'socket.io-client': 'socket.io-client/dist/socket.io.js',
    }
  },
  server: {
    host: true, // Listen on all network interfaces
    port: 5173, // Default Vite port
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:21341',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://127.0.0.1:21341',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
