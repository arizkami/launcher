import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import dns from 'node:dns'
import svgr from "vite-plugin-svgr";

dns.setDefaultResultOrder('verbatim')
const apiUrl = "aHR0cHM6Ly9zZy1oeXAtYXBpLmhveW92ZXJzZS5jb20vaHlwL2h5cC1jb25uZWN0Lw==";
const target = atob(apiUrl);


export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), svgr(
    {
      svgrOptions: { exportType: "default", ref: true, svgo: false, titleProp: true },
      include: "**/*.svg",
    }
  )],
  server: {
    proxy: {
      '/api/hoyoplay': {
        target: target,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

