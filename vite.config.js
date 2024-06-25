import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { svgBuilder } from "./src/plugins/svgBuilder"

function resolve(dir) {
  return path.join(__dirname, dir)
}

// https://vitejs.dev/config/
export default defineConfig(( {command} ) =>{
  return {
    // base: command == 'build' ? '/dist/' : '/',
    base: './',
    build: {
      outDir: "docs"
    },
    publicPath:process.env.NODE_ENV === "production" ? "/xmf/" : "/",
    resolve: {
      alias: {
        '@': resolve('src'),
        '@c': resolve('src/components'),
        '@v': resolve('src/views'),
        '@api': resolve('src/api'),
        '@as': resolve('src/assets'),
      }
    },
    plugins: [
      vue(),
      svgBuilder("./src/icons/svg/"),
      AutoImport({
        // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
        imports: ['vue'],
        resolvers: [
          ElementPlusResolver(),
          IconsResolver({
            prefix: 'i',
            // 别名 i-ep-delete
            enabledCollections: ["ep"],
          }),
        ],
      }),
      Components({
        resolvers: [
          ElementPlusResolver(),
          // 自动注册图标组件
          IconsResolver({
            prefix: "i", // 默认为i,设置为false则不显示前缀
            enabledCollections: ["ep"],
          }),
        ],
      }),
      Icons({
        autoInstall: true,
      }),
    ],
  }
})
