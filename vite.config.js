import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В режиме разработки (npm run dev) API сервера работает прямо внутри Vite,
// поэтому достаточно одной команды. base: './' — чтобы сборка открывалась из любой папки.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'orda-api',
      async configureServer(server) {
        const { default: express } = await import('express');
        const { createApi } = await import('./server/app.js');
        const app = express();
        app.use('/api', createApi());
        server.middlewares.use(app);
      }
    }
  ]
});
