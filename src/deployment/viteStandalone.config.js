import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import process from 'node:process';
export default defineConfig({
  root: process.cwd(),
  resolve: { alias: { '@': resolve(process.cwd(), 'src') }, extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'] },
  plugins: [react()],
  define: { 'import.meta.env.VITE_STANDALONE': JSON.stringify('true') },
  build: { outDir: '.standalone/dist', emptyOutDir: true, sourcemap: false },
});