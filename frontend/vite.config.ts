import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '5173'),
    host: process.env.TEMPO === "true" ? '0.0.0.0' : undefined,
    // @ts-ignore
    allowedHosts: process.env.TEMPO === "true" ? true : undefined
  }
});