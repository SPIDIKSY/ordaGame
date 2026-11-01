/* =====================================================
   ЗАПУСК СЕРВЕРА: npm start
   Отдаёт собранную игру (папка dist) и API по адресу /api
   ===================================================== */
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './app.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
// если сервер стоит за nginx/Caddy — чтобы правильно видеть IP игроков
if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY);
app.disable('x-powered-by');
app.use('/api', createApi());

if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: 'index.html' }));
} else {
  app.get('/', (req, res) => res.send('Сначала собери игру: npm run build'));
}

app.listen(PORT, () => {
  console.log('Игра запущена: http://localhost:' + PORT);
});
