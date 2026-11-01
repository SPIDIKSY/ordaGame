/* =====================================================
   БАЗА ДАННЫХ (SQLite — один файл data/orda.db)
   Ничего устанавливать не нужно: SQLite встроен в Node.js 22.13+
   ===================================================== */
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function openDb(file) {
  const path = file || process.env.ORDA_DB || resolve(root, 'data', 'orda.db');
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      login      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nick       TEXT NOT NULL UNIQUE COLLATE NOCASE,
      pass_hash  TEXT NOT NULL,
      salt       TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    -- Каждый забег: сервер сам запоминает, когда он начался,
    -- и принимает результат только если он правдоподобен
    CREATE TABLE IF NOT EXISTS runs (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hero        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',   -- active | ok | rejected | abandoned
      started_at  INTEGER NOT NULL,
      last_beat   INTEGER NOT NULL,
      beats       INTEGER NOT NULL DEFAULT 0,
      last_t      REAL NOT NULL DEFAULT 0,
      last_kills  INTEGER NOT NULL DEFAULT 0,
      last_level  INTEGER NOT NULL DEFAULT 1,
      finished_at INTEGER,
      time        REAL,
      kills       INTEGER,
      level       INTEGER,
      bosses      INTEGER,
      score       INTEGER,
      reason      TEXT
    );
    CREATE INDEX IF NOT EXISTS runs_board ON runs(status, time DESC, kills DESC, score DESC);
    CREATE INDEX IF NOT EXISTS runs_user ON runs(user_id, status);
  `);
  return db;
}
