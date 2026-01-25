
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ensuring react-is is correctly mapped if needed by bundler
      'react-is': 'react-is',
      '@': './',
    }
  },
  preview: {
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'recharts'],
          gemini: ['@google/genai']
        }
      }
    }
  },
  // Environment variable handling
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY)
  }
});
