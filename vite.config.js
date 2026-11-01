import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В режиме разработки (npm run dev) API работает прямо внутри Vite с базой SQLite,
// поэтому достаточно одной команды. base: './' — чтобы сборка открывалась из любой папки.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'orda-api',
      async configureServer(server) {
        const { createHandler } = await import('./server/api.js');
        const { sqliteKv } = await import('./server/kv-sqlite.js');
        const { toWebHandler } = await import('./server/node-bridge.js');
        const api = toWebHandler(createHandler({ kv: sqliteKv() }));
        server.middlewares.use((req, res, next) => {
          if (!req.url.startsWith('/api/')) return next();
          req.originalUrl = req.url;
          api(req, res).catch(next);
        });
      }
    }
  ]
});
