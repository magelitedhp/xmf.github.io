import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    proxy: {
      '/gdstudio-api': {
        target: 'https://music-api.gdstudio.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gdstudio-api/, '/api.php'),
      },
    },
  },
})
