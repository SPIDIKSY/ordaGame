/* =====================================================
   ХРАНИЛИЩЕ ДЛЯ СВОЕГО СЕРВЕРА И РАЗРАБОТКИ:
   SQLite (встроен в Node.js 22.13+), один файл data/orda.db
   ===================================================== */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function sqliteKv(file) {
  const path = file || process.env.ORDA_DB || resolve(root, 'data', 'orda.db');
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, ver INTEGER NOT NULL DEFAULT 1);
  `);
  const qGet = db.prepare('SELECT value, ver FROM kv WHERE key = ?');
  const qNew = db.prepare('INSERT OR IGNORE INTO kv (key, value, ver) VALUES (?, ?, 1)');
  const qMatch = db.prepare('UPDATE kv SET value = ?, ver = ver + 1 WHERE key = ? AND ver = ?');
  const qPut = db.prepare('INSERT INTO kv (key, value, ver) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET value = excluded.value, ver = kv.ver + 1');
  const qDel = db.prepare('DELETE FROM kv WHERE key = ?');
  return {
    async get(key) { const r = qGet.get(key); return r ? { value: JSON.parse(r.value), etag: String(r.ver) } : null; },
    // ifNew — записать, только если ключа ещё нет; ifMatch — только если версия не изменилась
    async put(key, value, opt = {}) {
      const v = JSON.stringify(value);
      if (opt.ifNew) return qNew.run(key, v).changes === 1;
      if (opt.ifMatch) return qMatch.run(v, key, Number(opt.ifMatch)).changes === 1;
      qPut.run(key, v); return true;
    },
    async del(key) { qDel.run(key); }
  };
}
