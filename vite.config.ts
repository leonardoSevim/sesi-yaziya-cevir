import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dropzone',
      'lucide-react'
    ],
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
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-dropzone'],
          ui: ['lucide-react']
        }
      }
    },
    sourcemap: true
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    fs: {
      strict: false
    }
  }
});
