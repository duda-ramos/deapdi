import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Production optimizations
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: mode === 'production' ? false : true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Security: Remove comments and console logs in production
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    } : undefined
  },
  server: {
    // Security headers for development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  }
}));
