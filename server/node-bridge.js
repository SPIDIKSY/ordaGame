// Переводим запрос Node.js в стандартный Request и обратно — чтобы один и тот же API
// работал и в Vite (разработка), и на своём сервере, и на Netlify
export function toWebHandler(handle) {
  return async (req, res) => {
    const chunks = [];
    let size = 0;
    for await (const c of req) { size += c.length; if (size > 16384) break; chunks.push(c); }
    const url = 'http://' + (req.headers.host || 'localhost') + req.originalUrl;
    const request = new Request(url, {
      method: req.method,
      headers: Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === 'string')),
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks)
    });
    const ip = req.headers['x-forwarded-for'] && process.env.TRUST_PROXY ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress || '?';
    const response = await handle(request, ip);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  };
}
