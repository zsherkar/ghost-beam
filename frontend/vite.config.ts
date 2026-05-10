import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isPages = process.env.VITE_DEPLOY_TARGET === 'pages' || env.VITE_DEPLOY_TARGET === 'pages'
  return {
    base: isPages ? '/ghost-beam/' : '/',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
  }
})
