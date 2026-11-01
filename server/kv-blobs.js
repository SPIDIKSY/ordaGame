/* =====================================================
   ХРАНИЛИЩЕ ДЛЯ NETLIFY: Netlify Blobs
   Включается само, когда сайт работает на Netlify.
   ===================================================== */
import { getStore } from '@netlify/blobs';

export function blobsKv(storeOptions) {
  const store = getStore({ name: 'orda', consistency: 'strong', ...(storeOptions || {}) });
  // все ключи — латиница, цифры и / _ - (ники и токены хранятся в виде хеша)
  const safe = (key) => key;
  return {
    async get(key) {
      const r = await store.getWithMetadata(safe(key), { type: 'json', consistency: 'strong' });
      return r ? { value: r.data, etag: r.etag } : null;
    },
    async put(key, value, opt = {}) {
      const o = opt.ifNew ? { onlyIfNew: true } : opt.ifMatch ? { onlyIfMatch: opt.ifMatch } : {};
      const r = await store.setJSON(safe(key), value, o);
      return r ? r.modified !== false : true;
    },
    async del(key) { await store.delete(safe(key)); }
  };
}
