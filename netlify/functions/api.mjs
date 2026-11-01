// API игры на Netlify: все запросы /api/* попадают сюда, данные — в Netlify Blobs
import { createHandler } from '../../server/api.js';
import { blobsKv } from '../../server/kv-blobs.js';

let handle = null;
export default async (request, context) => {
  if (!handle) handle = createHandler({ kv: blobsKv() });
  return handle(request, (context && context.ip) || '?');
};

export const config = { path: '/api/*' };
