import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(async ({ command }) => ({ 
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
    extensions: [".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"]
  },
  plugins: [
    ...(command === 'serve' ? [(await import('@base44/vite-plugin')).default({ legacySDKImports: false, hmrNotifier: true, navigationNotifier: true, analyticsTracker: false, visualEditAgent: true })] : []),
    react(),
  ]
}));