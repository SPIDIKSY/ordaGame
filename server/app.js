/* =====================================================
   API СЕРВЕРА: регистрация, вход, ник, забеги, лидерборд
   ===================================================== */
import express from 'express';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { openDb } from './db.js';
import { parseReport, checkReport, scoreOf } from './anticheat.js';

const HEROES = ['mage', 'knight', 'rogue', 'druid', 'necro', 'cat'];
const SESSION_DAYS = 30;
const LOGIN_RE = /^[a-zA-Z0-9_]{3,20}$/;
const NICK_RE = /^[\p{L}\p{N}_\- ]{3,16}$/u;

const sha = (s) => createHash('sha256').update(s).digest('hex');
function hashPass(pass, salt) { return scryptSync(pass, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex'); }
function passOk(pass, salt, hash) {
  const a = Buffer.from(hashPass(pass, salt), 'hex'), b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
function cleanNick(n) { return String(n || '').trim().replace(/\s+/g, ' '); }

// Простое ограничение частоты запросов (защита от перебора паролей и спама)
function limiter(max, windowMs) {
  const hits = new Map();
  return (key) => {
    const now = Date.now();
    let h = hits.get(key);
    if (!h || h.reset < now) { h = { n: 0, reset: now + windowMs }; hits.set(key, h); }
    h.n++;
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return h.n <= max;
  };
}

export function createApi(opts = {}) {
  const db = opts.db || openDb(opts.dbFile);
  const now = opts.now || (() => Date.now());
  const api = express.Router();
  api.use(express.json({ limit: '8kb' }));

  const loginLimit = limiter(10, 10 * 60 * 1000);
  const registerLimit = limiter(5, 60 * 60 * 1000);
  const runLimit = limiter(30, 10 * 60 * 1000);
  const ipOf = (req) => req.ip || req.socket.remoteAddress || '?';

  const q = {
    userByLogin: db.prepare('SELECT * FROM users WHERE login = ?'),
    userByNick: db.prepare('SELECT id FROM users WHERE nick = ?'),
    addUser: db.prepare('INSERT INTO users (login, nick, pass_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)'),
    setNick: db.prepare('UPDATE users SET nick = ? WHERE id = ?'),
    addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'),
    session: db.prepare('SELECT u.id, u.login, u.nick FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'),
    delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    dropOld: db.prepare("UPDATE runs SET status = 'abandoned' WHERE user_id = ? AND status = 'active'"),
    addRun: db.prepare('INSERT INTO runs (id, user_id, hero, started_at, last_beat) VALUES (?, ?, ?, ?, ?)'),
    run: db.prepare("SELECT * FROM runs WHERE id = ? AND user_id = ?"),
    beat: db.prepare('UPDATE runs SET beats = beats + 1, last_beat = ?, last_t = ?, last_kills = ?, last_level = ? WHERE id = ?'),
    finish: db.prepare('UPDATE runs SET status = ?, finished_at = ?, time = ?, kills = ?, level = ?, bosses = ?, score = ?, reason = ? WHERE id = ?'),
    reject: db.prepare("UPDATE runs SET status = 'rejected', finished_at = ?, reason = ? WHERE id = ?")
  };

  function issueSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const t = now();
    q.addSession.run(sha(token), userId, t, t + SESSION_DAYS * 86400000);
    return token;
  }
  const publicUser = (u) => ({ id: u.id, login: u.login, nick: u.nick });

  function auth(req, res, next) {
    const h = req.get('authorization') || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    const u = token ? q.session.get(sha(token), now()) : null;
    if (!u) return res.status(401).json({ error: 'Нужно войти в аккаунт' });
    req.user = u; req.tokenHash = sha(token);
    next();
  }

  /* ---------- аккаунт ---------- */
  api.post('/register', (req, res) => {
    if (!registerLimit(ipOf(req))) return res.status(429).json({ error: 'Слишком много регистраций, попробуй позже' });
    const login = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '');
    const nick = cleanNick(req.body?.nick || login);
    if (!LOGIN_RE.test(login)) return res.status(400).json({ error: 'Логин: 3–20 символов, латинские буквы, цифры и _' });
    if (password.length < 6 || password.length > 72) return res.status(400).json({ error: 'Пароль: от 6 до 72 символов' });
    if (!NICK_RE.test(nick)) return res.status(400).json({ error: 'Ник: 3–16 символов, буквы, цифры, пробел, _ и -' });
    if (q.userByLogin.get(login)) return res.status(409).json({ error: 'Такой логин уже занят' });
    if (q.userByNick.get(nick)) return res.status(409).json({ error: 'Такой ник уже занят' });
    const salt = randomBytes(16).toString('hex');
    const info = q.addUser.run(login, nick, hashPass(password, salt), salt, now());
    const id = Number(info.lastInsertRowid);
    res.json({ token: issueSession(id), user: { id, login, nick } });
  });

  api.post('/login', (req, res) => {
    const login = String(req.body?.login || '').trim();
    const password = String(req.body?.password || '');
    if (!loginLimit(ipOf(req) + ':' + login.toLowerCase())) return res.status(429).json({ error: 'Слишком много попыток, подожди 10 минут' });
    const u = q.userByLogin.get(login);
    if (!u || !passOk(password, u.salt, u.pass_hash)) return res.status(401).json({ error: 'Неверный логин или пароль' });
    res.json({ token: issueSession(u.id), user: publicUser(u) });
  });

  api.post('/logout', auth, (req, res) => { q.delSession.run(req.tokenHash); res.json({ ok: true }); });

  api.get('/me', auth, (req, res) => {
    const best = db.prepare("SELECT hero, time, kills, level, score FROM runs WHERE user_id = ? AND status = 'ok' ORDER BY time DESC, kills DESC, score DESC LIMIT 1").get(req.user.id);
    res.json({ user: publicUser(req.user), best: best || null });
  });

  api.patch('/me', auth, (req, res) => {
    const nick = cleanNick(req.body?.nick);
    if (!NICK_RE.test(nick)) return res.status(400).json({ error: 'Ник: 3–16 символов, буквы, цифры, пробел, _ и -' });
    const taken = q.userByNick.get(nick);
    if (taken && taken.id !== req.user.id) return res.status(409).json({ error: 'Такой ник уже занят' });
    q.setNick.run(nick, req.user.id);
    res.json({ user: { ...publicUser(req.user), nick } });
  });

  /* ---------- забеги ---------- */
  api.post('/runs', auth, (req, res) => {
    if (!runLimit(String(req.user.id))) return res.status(429).json({ error: 'Слишком часто' });
    const hero = String(req.body?.hero || '');
    if (!HEROES.includes(hero)) return res.status(400).json({ error: 'Неизвестный герой' });
    const id = randomBytes(12).toString('base64url'), t = now();
    q.dropOld.run(req.user.id);
    q.addRun.run(id, req.user.id, hero, t, t);
    res.json({ runId: id });
  });

  api.post('/runs/:id/beat', auth, (req, res) => {
    const run = q.run.get(req.params.id, req.user.id);
    if (!run || run.status !== 'active') return res.status(404).json({ error: 'Забег не найден' });
    const r = parseReport(req.body);
    if (!r) return res.status(400).json({ error: 'Плохие данные' });
    const t = now(), why = checkReport(run, t, r, false);
    if (why) { q.reject.run(t, why, run.id); return res.status(422).json({ error: 'Забег не засчитан: ' + why }); }
    q.beat.run(t, r.time, r.kills, r.level, run.id);
    res.json({ ok: true });
  });

  api.post('/runs/:id/finish', auth, (req, res) => {
    const run = q.run.get(req.params.id, req.user.id);
    if (!run || run.status !== 'active') return res.status(404).json({ error: 'Забег не найден или уже засчитан' });
    const r = parseReport(req.body);
    if (!r) return res.status(400).json({ error: 'Плохие данные' });
    const t = now(), why = checkReport(run, t, r, true);
    if (why) { q.reject.run(t, why, run.id); return res.status(422).json({ error: 'Забег не засчитан: ' + why }); }
    const score = scoreOf(r);
    q.finish.run('ok', t, r.time, r.kills, r.level, r.bosses, score, null, run.id);
    res.json({ ok: true, score, ...placeOf(req.user.id, run.hero) });
  });

  /* ---------- лидерборд ---------- */
  // Лучший забег каждого игрока: сначала время, потом убийства, потом очки
  const boardSql = (byHero) => `
    WITH ranked AS (
      SELECT r.*, ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.time DESC, r.kills DESC, r.score DESC) AS rn
      FROM runs r WHERE r.status = 'ok' ${byHero ? 'AND r.hero = ?' : ''}
    )
    SELECT u.id AS userId, u.nick, k.hero, k.time, k.kills, k.level, k.bosses, k.score, k.finished_at AS at
    FROM ranked k JOIN users u ON u.id = k.user_id
    WHERE k.rn = 1
    ORDER BY k.time DESC, k.kills DESC, k.score DESC, k.finished_at ASC`;
  const boardAll = db.prepare(boardSql(false));
  const boardHero = db.prepare(boardSql(true));
  const board = (hero) => (hero ? boardHero.all(hero) : boardAll.all());

  function placeOf(userId, hero) {
    const all = board(null), mine = hero ? board(hero) : [];
    const p = all.findIndex((x) => x.userId === userId);
    const ph = mine.findIndex((x) => x.userId === userId);
    return { place: p >= 0 ? p + 1 : null, heroPlace: ph >= 0 ? ph + 1 : null };
  }

  api.get('/leaderboard', (req, res) => {
    const hero = HEROES.includes(req.query.hero) ? req.query.hero : null;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const rows = board(hero).map((x, i) => ({ place: i + 1, ...x }));
    res.json({ rows: rows.slice(0, limit), total: rows.length });
  });

  api.get('/health', (req, res) => res.json({ ok: true }));
  api.use((req, res) => res.status(404).json({ error: 'Нет такого адреса' }));
  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => res.status(400).json({ error: 'Плохой запрос' }));
  return api;
}
