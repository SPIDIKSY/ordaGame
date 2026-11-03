import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// В режиме разработки (npm run dev) API работает прямо внутри Vite с базой SQLite,
// поэтому достаточно одной команды. base: './' — чтобы сборка открывалась из любой папки.
// Метка сборки на главном экране: по ней видно, обновилась ли игра на сервере.
// Время в UTC — Netlify собирает именно в нём. COMMIT_REF Netlify подставляет сам,
// локально его нет, и тогда остаётся только время запуска.
const BUILD = (() => {
  const t = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const commit = (process.env.COMMIT_REF || '').slice(0, 7);
  return commit ? t + ' · ' + commit : t;
})();

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  // На Windows «localhost» у разных браузеров означает разные адреса: Firefox
  // идёт на 127.0.0.1, а сервер по умолчанию поднимался только на IPv6 [::1] —
  // и страница не открывалась. Привязываемся к 127.0.0.1 явно: так работают все
  // браузеры, и наружу, в сеть, сервер при этом не выходит.
  server: { host: '127.0.0.1' },
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
