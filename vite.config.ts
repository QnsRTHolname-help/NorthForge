import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { spawn } from 'node:child_process'

// Auto-start the local API server (serves /api/chat on :3000) during dev so
// the AI widget works with a single `npm run dev`. Deployments use Vercel
// functions instead — this plugin only runs for `vite` / `vite dev`.
function apiDevServer() {
  let proc: ReturnType<typeof spawn> | null = null;
  return {
    name: 'northforge-dev-api',
    configureServer() {
      proc = spawn(process.execPath, ['node_modules/tsx/dist/cli.mjs', '--env-file=.env.local', 'api/dev-server.ts'], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      });
      const stop = () => proc?.kill();
      process.on('exit', stop);
      process.on('SIGINT', () => { stop(); process.exit(0); });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServer()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    // Proxy /api to the serverless functions during local development
    // (run `npx vercel dev` or any host serving the /api folder).
    proxy: {
      '/api': {
        target: process.env.API_DEV_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})
