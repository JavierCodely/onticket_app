import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // No generar source maps en producción (seguridad)
    sourcemap: false,
    
    // Minificación agresiva
    minify: 'terser',
    
    // Optimización de chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React en su propio chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar Supabase en su propio chunk
          'supabase-vendor': ['@supabase/supabase-js'],
          // UI components en otro chunk
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    
    // Optimizar el tamaño del chunk
    chunkSizeWarningLimit: 1000,
  },
})
