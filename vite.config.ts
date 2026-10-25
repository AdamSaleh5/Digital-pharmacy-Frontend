import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://144.91.111.63:5002',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
