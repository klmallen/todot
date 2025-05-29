/*
 * @Author: lvyang 13386341673@163.com
 * @Date: 2025-04-08 10:25:47
 * @LastEditors: lvyang 13386341673@163.com
 * @LastEditTime: 2025-04-10 17:37:46
 * @FilePath: \todot\vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */



// vite.config.js

import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import react from '@vitejs/plugin-react'

export default defineConfig({
  // For issues with the Three.js WebGPU build, refer to this link:
  // https://github.com/mrdoob/three.js/pull/28650#issuecomment-2198568721
  resolve: {
    // alias: {
    //   'three/addons': 'three/examples/jsm',
    //   'three/tsl': 'three/webgpu',
    //   'three': 'three/webgpu'
    // }
  },
  plugins: [
    react(),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    })
  ],
  server: {
    port: 9999,
    open: true,
      host: "0.0.0.0",
    historyApiFallback: true
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        examples: './examples.html'
      }
    }
  }
});
