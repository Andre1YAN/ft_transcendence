import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: '.', // 项目根目录
  publicDir: 'public', // 放置静态资源的文件夹（可选）
  build: {
    outDir: 'dist',           // 打包输出目录，Docker 会拷贝这里
    emptyOutDir: true,        // 清空输出目录
    assetsDir: 'assets',      // 静态资源文件夹
    sourcemap: false,         // 生产环境不开启 source map
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // 允许用 @ 代表 src 目录
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
  },
})
