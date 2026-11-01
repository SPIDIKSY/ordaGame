import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — чтобы игра открывалась и на GitHub Pages, и локально
export default defineConfig({
  base: './',
  plugins: [react()],
});
