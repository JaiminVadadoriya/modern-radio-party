import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/',
  base: '/modern-radio-party/',
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: process.env.VITE_SOCKET_URL || 'http://localhost:3001',
        ws: true
      }
    }
  }
})
