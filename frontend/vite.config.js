import { env } from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const host = env.VITE_HOST ?? '0.0.0.0';
const port = Number(env.VITE_PORT ?? 5173);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port,
    strictPort: true,
  },
});
