/* =====================================================
   ЗАПУСК НА СВОЁМ СЕРВЕРЕ: npm start
   Отдаёт собранную игру (папка dist) и API по адресу /api
   (для Netlify это не нужно — там работает netlify/functions/api.mjs)
   ===================================================== */
import express from 'express';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHandler } from './api.js';
import { sqliteKv } from './kv-sqlite.js';
import { toWebHandler } from './node-bridge.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.disable('x-powered-by');
const api = toWebHandler(createHandler({ kv: sqliteKv() }));
app.use('/api', (req, res) => { req.originalUrl = '/api' + req.url; api(req, res); });
if (existsSync(dist)) app.use(express.static(dist, { maxAge: '1h' }));
else app.get('/', (req, res) => res.send('Сначала собери игру: npm run build'));

app.listen(PORT, () => console.log('Игра запущена: http://localhost:' + PORT));
