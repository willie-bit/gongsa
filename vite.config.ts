import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.holdings.miso.gs',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/ext/v1'),
      },
    },
  },
})
