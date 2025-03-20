import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: {
        'dynamic-import': true
      }
    }
  },
  define: {
    __REACT_ROUTER_FUTURE_FLAGS: JSON.stringify({
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.ASSET_PREFIX': JSON.stringify('')
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: []
    },
    sourcemap: true
  },
});
