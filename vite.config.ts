import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { defaultReadCatalog } from './plugins/defaultReadCatalog'
import { pvzLocalResources } from './plugins/pvzLocalResources'

export default defineConfig({
  plugins: [vue(), defaultReadCatalog(), pvzLocalResources()],
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
