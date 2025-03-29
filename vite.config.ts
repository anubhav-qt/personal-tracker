import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2015', // Ensures compatibility with older browsers
  },
  esbuild: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
})
