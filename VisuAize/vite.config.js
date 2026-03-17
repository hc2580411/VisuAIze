import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],

    // Build Optimizations
    build: {
      // Enable code splitting for better caching
      rollupOptions: {
        output: {
          // Manual chunk splitting for optimal caching
          manualChunks: {
            // Vendor chunks - rarely change, cached long-term
            'react-vendor': ['react', 'react-dom'],
            'd3-vendor': ['d3'],
            'ui-icons': ['lucide-react'],
            'syntax-highlight': ['prismjs'],
            'ai-services': ['@google/genai'],
            'markdown': ['react-markdown'],
          },
        },
      },
      // Minification settings
      minify: 'esbuild',
      // Generate source maps for production debugging (optional)
      sourcemap: false,
      // Target modern browsers for smaller bundle
      target: 'es2020',
      // Chunk size warning limit
      chunkSizeWarningLimit: 500,
    },

    // Development optimizations
    server: {
      // Enable HMR for fast development
      hmr: true,
    },

    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'd3',
        'lucide-react',
        'prismjs',
      ],
    },

    // Enable CSS code splitting
    css: {
      devSourcemap: true,
    },

    // Performance hints
    esbuild: {
      // Remove console.log in production (except errors)
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
  };
});
