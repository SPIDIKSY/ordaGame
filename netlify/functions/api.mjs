// API игры на Netlify: все запросы /api/* попадают сюда, данные — в Netlify Blobs.
// Важно: подключение к хранилищу создаём заново на каждый запрос —
// Netlify выдаёт доступ к Blobs на время конкретного запроса, и старое подключение «протухает».
import { createHandler } from '../../server/api.js';
import { blobsKv } from '../../server/kv-blobs.js';

export default async (request, context) => {
  const handle = createHandler({ kv: blobsKv() });
  return handle(request, (context && context.ip) || '?');
};

export const config = { path: '/api/*' };
