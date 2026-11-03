/* =====================================================
   API ИГРЫ: регистрация, вход, забеги, лидерборд.
   Один и тот же код работает:
   - на Netlify (данные в Netlify Blobs) — netlify/functions/api.mjs
   - локально и на своём сервере (данные в SQLite) — server/index.js
   Хранилище — простое «ключ → значение» (kv), см. kv-sqlite.js и kv-blobs.js
   ===================================================== */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { parseReport, checkReport, beatTooSoon, scoreOf, SCORE } from './anticheat.js';
import { badNick } from './nickfilter.js';

export const HEROES = ['mage', 'knight', 'rogue', 'druid', 'necro', 'cat', 'vampire'];
const SESSION_DAYS = 30;
const GUEST_CLAIM_MS = 30 * 60000; // сколько гость может «забрать» забег после смерти
const LOGIN_RE = /^[a-zA-Z0-9_]{3,20}$/;
const NICK_RE = /^[\p{L}\p{N}_\- ]{3,16}$/u;

const sha = (s) => createHash('sha256').update(s).digest('hex');
const hashPass = (pass, salt) => scryptSync(pass, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
function passOk(pass, salt, hash) {
  const a = Buffer.from(hashPass(pass, salt), 'hex'), b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
export const cleanNick = (n) => String(n || '').trim().replace(/\s+/g, ' ');

// Ключ уникальности ника: регистр, пробелы, _ и - не важны,
// а латинские буквы, похожие на русские, считаются одинаковыми («Bacя» = «Вася»)
const LOOK = { a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', '0': 'о', 'ё': 'е', '3': 'з', '6': 'б' };
export function nickKey(nick) {
  return cleanNick(nick).toLowerCase().replace(/[\s_\-]/g, '').replace(/./gu, (ch) => LOOK[ch] || ch);
}

export function checkNickFormat(nick) {
  if (!NICK_RE.test(nick)) return 'Ник: 3–16 символов — буквы, цифры, пробел, _ и -';
  if (nickKey(nick).length < 3) return 'Ник слишком короткий';
  return badNick(nick);
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export function createHandler({ kv, now = () => Date.now() }) {
  /* ---------- ограничение частоты (хранится в kv, чтобы работало и на Netlify) ---------- */
  async function limited(key, max, windowMs) {
    const k = 'rate/' + sha(key).slice(0, 32), t = now();
    const cur = await kv.get(k);
    let v = cur && cur.value && cur.value.reset > t ? cur.value : { n: 0, reset: t + windowMs };
    v = { n: v.n + 1, reset: v.reset };
    await kv.put(k, v);
    return v.n > max;
  }

  async function issueSession(user) {
    const token = randomBytes(32).toString('base64url');
    await kv.put('sess/' + sha(token), { login: user.login.toLowerCase(), expires: now() + SESSION_DAYS * 86400000 });
    return token;
  }
  const publicUser = (u) => ({ id: u.id, login: u.login, nick: u.nick });

  async function auth(req) {
    const h = req.headers.get('authorization') || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : '';
    if (!token || token.length > 100) return null;
    const s = await kv.get('sess/' + sha(token));
    if (!s || s.value.expires < now()) return null;
    const u = await kv.get('user/' + s.value.login);
    if (!u) return null;
    // старый запрещённый ник (заведён до проверки) — меняем на случайный
    if (badNick(u.value.nick)) await renameUser(u.value);
    return { user: u.value, tokenKey: 'sess/' + sha(token) };
  }

  /* ---------- замена запрещённых ников на случайные ---------- */
  // Новый ник для игрока выбирается один раз и запоминается (renamed/<id>),
  // чтобы в аккаунте и в лидерборде оказался один и тот же
  async function replacementNick(id) {
    const saved = await kv.get('renamed/' + id);
    if (saved) return saved.value.nick;
    for (let i = 0; i < 20; i++) {
      const nick = 'Игрок ' + (1000 + Math.floor(Math.random() * 9000));
      if (await kv.put('nick/' + sha(nickKey(nick)).slice(0, 40), { renamed: id }, { ifNew: true })) {
        if (await kv.put('renamed/' + id, { nick }, { ifNew: true })) return nick;
        return (await kv.get('renamed/' + id)).value.nick;
      }
    }
    return 'Игрок ' + id.slice(0, 6);
  }
  async function renameUser(user) {
    user.nick = await replacementNick(user.id);
    await kv.put('user/' + user.login.toLowerCase(), user);
  }

  // Владелец забега: аккаунт (по токену входа) или гость (по секрету забега в заголовке x-run-token)
  async function runOwner(req) {
    const a = await auth(req);
    if (a) return { user: a.user, key: a.user.id };
    const rt = req.headers.get('x-run-token') || '';
    if (!rt || rt.length > 100) return null;
    const g = sha(rt);
    return { guest: g, key: 'g' + g.slice(0, 24) };
  }
  const owns = (o, run) => (o.user ? run.user === o.user.id : !run.user && run.guest === o.guest);

  /* ---------- лидерборд: один документ, обновляется «если не изменился» ---------- */
  const better = (a, b) => !b || a.time > b.time || (a.time === b.time && (a.kills > b.kills || (a.kills === b.kills && a.score > b.score)));
  async function saveBest(user, run) {
    const entry = { hero: run.hero, time: run.time, kills: run.kills, level: run.level, bosses: run.bosses, score: run.score, at: run.finished_at };
    for (let i = 0; i < 8; i++) {
      const cur = await kv.get('board');
      const board = cur ? cur.value : { users: {} };
      const me = board.users[user.id] || { nick: user.nick, all: null, heroes: {} };
      me.nick = user.nick;
      if (better(entry, me.all)) me.all = entry;
      if (better(entry, me.heroes[run.hero])) me.heroes[run.hero] = entry;
      board.users[user.id] = me;
      const ok = cur ? await kv.put('board', board, { ifMatch: cur.etag }) : await kv.put('board', board, { ifNew: true });
      if (ok) return board;
    }
    throw new Error('board busy');
  }
  // Порядок в таблице. Главный столбец выбирает игрок, остальные идут
  // следом как запасные — чтобы при равных числах порядок был устойчивым.
  const SORTS = {
    time: ['time', 'kills', 'score'],
    kills: ['kills', 'time', 'score'],
    score: ['score', 'time', 'kills']
  };
  function rowsOf(board, hero, sort) {
    const by = SORTS[sort] || SORTS.time;
    const rows = [];
    for (const id in board.users) {
      const u = board.users[id], r = hero ? u.heroes[hero] : u.all;
      if (r) rows.push({ userId: id, nick: u.nick, ...r });
    }
    rows.sort((a, b) => b[by[0]] - a[by[0]] || b[by[1]] - a[by[1]] || b[by[2]] - a[by[2]] || a.at - b.at);
    return rows.map((r, i) => ({ place: i + 1, ...r }));
  }
  async function placeAfter(user, run) {
    const board = await saveBest(user, run);
    const place = rowsOf(board, null).findIndex((x) => x.userId === user.id) + 1;
    const heroPlace = rowsOf(board, run.hero).findIndex((x) => x.userId === user.id) + 1;
    return { place: place || null, heroPlace: heroPlace || null };
  }
  async function readBoard() {
    const b = await kv.get('board');
    if (!b) return { users: {} };
    const board = b.value;
    let changed = false;
    for (const id in board.users) {
      if (badNick(board.users[id].nick)) { board.users[id].nick = await replacementNick(id); changed = true; }
    }
    // сохраняем исправленные ники; если таблицу как раз обновили — поправим в следующий раз
    if (changed) await kv.put('board', board, { ifMatch: b.etag });
    return board;
  }

  /* ---------- маршруты ---------- */
  const routes = {
    'GET health': async () => json(200, { ok: true }),

    // проверка ника прямо во время ввода
    'GET check-nick': async (req, url) => {
      const nick = cleanNick(url.searchParams.get('nick'));
      const bad = checkNickFormat(nick);
      if (bad) return json(200, { ok: false, error: bad });
      const taken = await kv.get('nick/' + sha(nickKey(nick)).slice(0, 40));
      return json(200, taken ? { ok: false, error: 'Такой ник уже занят' } : { ok: true });
    },

    'POST register': async (req, url, body, ip) => {
      const login = String(body.login || '').trim();
      const password = String(body.password || '');
      const nick = cleanNick(body.nick || login);
      // сначала проверяем ввод: ошибка в нике или пароле не тратит лимит регистраций
      if (!LOGIN_RE.test(login)) return json(400, { error: 'Логин: 3–20 символов, латинские буквы, цифры и _' });
      if (password.length < 6 || password.length > 72) return json(400, { error: 'Пароль: от 6 до 72 символов' });
      const bad = checkNickFormat(nick);
      if (bad) return json(400, { error: bad });
      if (await limited('reg:' + ip, 5, 3600000)) return json(429, { error: 'Слишком много регистраций, попробуй позже' });
      if (await kv.get('user/' + login.toLowerCase())) return json(409, { error: 'Такой логин уже занят' });
      // занимаем ник атомарно: если кто-то успел раньше — запись не пройдёт
      const nk = 'nick/' + sha(nickKey(nick)).slice(0, 40);
      if (!(await kv.put(nk, { login: login.toLowerCase() }, { ifNew: true }))) return json(409, { error: 'Такой ник уже занят' });
      const salt = randomBytes(16).toString('hex');
      const user = { id: randomBytes(8).toString('hex'), login, nick, pass_hash: hashPass(password, salt), salt, created_at: now() };
      if (!(await kv.put('user/' + login.toLowerCase(), user, { ifNew: true }))) {
        await kv.del(nk);
        return json(409, { error: 'Такой логин уже занят' });
      }
      return json(200, { token: await issueSession(user), user: publicUser(user) });
    },

    'POST login': async (req, url, body, ip) => {
      const login = String(body.login || '').trim();
      const password = String(body.password || '');
      if (await limited('login:' + ip + ':' + login.toLowerCase(), 10, 600000)) return json(429, { error: 'Слишком много попыток, подожди 10 минут' });
      const u = login ? await kv.get('user/' + login.toLowerCase()) : null;
      if (!u || !passOk(password, u.value.salt, u.value.pass_hash)) return json(401, { error: 'Неверный логин или пароль' });
      return json(200, { token: await issueSession(u.value), user: publicUser(u.value) });
    },

    'POST logout': async (req) => {
      const a = await auth(req);
      if (a) await kv.del(a.tokenKey);
      return json(200, { ok: true });
    },

    'GET me': async (req) => {
      const a = await auth(req);
      if (!a) return json(401, { error: 'Нужно войти в аккаунт' });
      const board = await readBoard(), mine = board.users[a.user.id];
      return json(200, { user: publicUser(a.user), best: mine ? mine.all : null });
    },

    // Сменить ник нельзя — он выбирается один раз при регистрации
    'PATCH me': async () => json(403, { error: 'Ник нельзя изменить после регистрации' }),

    // Новый забег. Можно и гостем: тогда вместо входа выдаётся секрет забега (runToken),
    // а после смерти гость может зарегистрироваться и «забрать» этот проверенный забег себе
    'POST runs': async (req, url, body, ip) => {
      const a = await auth(req);
      const hero = String(body.hero || '');
      if (!HEROES.includes(hero)) return json(400, { error: 'Неизвестный герой' });
      const id = randomBytes(12).toString('base64url'), t = now();
      const run = { id, user: null, guest: null, hero, status: 'active', started_at: t, last_beat: t, beats: 0, last_t: 0, last_kills: 0, last_level: 1 };
      let runToken = null, key;
      if (a) {
        if (await limited('run:' + a.user.id, 30, 600000)) return json(429, { error: 'Слишком часто' });
        run.user = a.user.id; key = a.user.id;
      } else {
        if (await limited('grun:' + ip, 40, 600000)) return json(429, { error: 'Слишком часто' });
        runToken = randomBytes(24).toString('base64url');
        run.guest = sha(runToken); key = 'g' + run.guest.slice(0, 24);
      }
      // новый забег отменяет предыдущий незаконченный
      await kv.put('active/' + key, { runId: id });
      await kv.put('run/' + id, run);
      return json(200, runToken ? { runId: id, runToken } : { runId: id });
    },

    'POST beat': async (req, url, body, ip, runId) => {
      const o = await runOwner(req);
      if (!o) return json(401, { error: 'Нужно войти в аккаунт' });
      const cur = await kv.get('run/' + runId);
      const run = cur && cur.value;
      if (!run || !owns(o, run) || run.status !== 'active') return json(404, { error: 'Забег не найден' });
      const act = await kv.get('active/' + o.key);
      if (!act || act.value.runId !== runId) return json(404, { error: 'Забег уже не активен' });
      if (beatTooSoon(run, now())) return json(429, { error: 'Слишком частые отчёты' });
      const r = parseReport(body);
      if (!r) return json(400, { error: 'Плохие данные' });
      const t = now(), why = checkReport(run, t, r, false);
      if (why) { await kv.put('run/' + runId, { ...run, status: 'rejected', reason: why, finished_at: t }); return json(422, { error: 'Забег не засчитан: ' + why }); }
      await kv.put('run/' + runId, { ...run, beats: run.beats + 1, last_beat: t, last_t: r.time, last_kills: r.kills, last_level: r.level });
      return json(200, { ok: true });
    },

    'POST finish': async (req, url, body, ip, runId) => {
      const o = await runOwner(req);
      if (!o) return json(401, { error: 'Нужно войти в аккаунт' });
      const cur = await kv.get('run/' + runId);
      const run = cur && cur.value;
      if (!run || !owns(o, run) || run.status !== 'active') return json(404, { error: 'Забег не найден или уже засчитан' });
      const r = parseReport(body);
      if (!r) return json(400, { error: 'Плохие данные' });
      const t = now(), why = checkReport(run, t, r, true);
      if (why) { await kv.put('run/' + runId, { ...run, status: 'rejected', reason: why, finished_at: t }); return json(422, { error: 'Забег не засчитан: ' + why }); }
      // засчитать один забег дважды нельзя: запись проходит, только если забег не менялся
      const done = { ...run, status: o.user ? 'ok' : 'guest-ok', finished_at: t, time: r.time, kills: r.kills, level: r.level, bosses: r.bosses };
      done.score = scoreOf(done);
      if (!(await kv.put('run/' + runId, done, { ifMatch: cur.etag }))) return json(404, { error: 'Забег уже засчитан' });
      if (!o.user) return json(200, { ok: true, guest: true, score: done.score, claimUntil: t + GUEST_CLAIM_MS });
      return json(200, { ok: true, score: done.score, ...(await placeAfter(o.user, done)) });
    },

    // Гость зарегистрировался или вошёл после смерти — переносим проверенный забег в его аккаунт
    'POST claim': async (req, url, body, ip, runId) => {
      const a = await auth(req);
      if (!a) return json(401, { error: 'Нужно войти в аккаунт' });
      const rt = req.headers.get('x-run-token') || '';
      const cur = await kv.get('run/' + runId);
      const run = cur && cur.value;
      if (!run || !rt || run.status !== 'guest-ok' || run.guest !== sha(rt)) return json(404, { error: 'Забег не найден или уже засчитан' });
      if (now() - run.finished_at > GUEST_CLAIM_MS) return json(410, { error: 'Прошло больше 30 минут — этот забег уже не засчитать' });
      const done = { ...run, status: 'ok', user: a.user.id, guest: null, claimed_at: now() };
      if (!(await kv.put('run/' + runId, done, { ifMatch: cur.etag }))) return json(404, { error: 'Забег уже засчитан' });
      return json(200, { ok: true, score: done.score, ...(await placeAfter(a.user, done)) });
    },

    'GET leaderboard': async (req, url) => {
      const hero = HEROES.includes(url.searchParams.get('hero')) ? url.searchParams.get('hero') : null;
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
      const sort = url.searchParams.get('sort');
      const rows = rowsOf(await readBoard(), hero, sort);
      // scoring — чтобы игра могла показать «как считаются очки» и не хранила
      // эти числа у себя второй раз
      return json(200, { rows: rows.slice(0, limit), total: rows.length, scoring: SCORE });
    }
  };

  // request — стандартный Request, ip — адрес игрока (для ограничения попыток)
  return async function handle(request, ip = '?') {
    try {
      const url = new URL(request.url);
      const parts = url.pathname.replace(/^.*?\/api\//, '').split('/').filter(Boolean);
      let name = parts[0] || '', runId = null;
      if (name === 'runs' && parts.length === 3) { runId = parts[1]; name = parts[2]; }
      else if (parts.length !== 1) name = '';
      const fn = routes[request.method + ' ' + name];
      if (!fn) return json(404, { error: 'Нет такого адреса' });
      let body = {};
      if (request.method === 'POST' || request.method === 'PATCH') {
        const text = await request.text();
        if (text.length > 8192) return json(413, { error: 'Слишком большой запрос' });
        try { body = text ? JSON.parse(text) : {}; } catch (_) { return json(400, { error: 'Плохой запрос' }); }
        if (!body || typeof body !== 'object') body = {};
      }
      return await fn(request, url, body, ip, runId);
    } catch (e) {
      console.error(e);
      return json(500, { error: 'Ошибка сервера, попробуй ещё раз' });
    }
  };
}
