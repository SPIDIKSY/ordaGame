// Проверки сервера: npm test
// Каждый тест прогоняется дважды: с SQLite (свой сервер) и с Netlify Blobs (локальный эмулятор)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';
import { createHandler, nickKey, HEROES } from './api.js';
import { SCORE, scoreOf } from './anticheat.js';
import { sqliteKv } from './kv-sqlite.js';
import { blobsKv } from './kv-blobs.js';

async function makeKvs() {
  const dir = mkdtempSync(join(tmpdir(), 'orda-blobs-'));
  const server = new BlobsServer({ directory: dir, token: 'test-token', port: 0 });
  const { port } = await server.start();
  return {
    list: [
      ['SQLite', () => sqliteKv(':memory:')],
      ['Netlify Blobs', () => blobsKv({ name: 'orda-' + Math.random().toString(36).slice(2), siteID: 'test-site', token: 'test-token', edgeURL: 'http://localhost:' + port, uncachedEdgeURL: 'http://localhost:' + port })]
    ],
    close: async () => { await server.stop(); rmSync(dir, { recursive: true, force: true }); }
  };
}

function setup(kv) {
  let clock = 1_000_000_000_000;
  const handle = createHandler({ kv, now: () => clock });
  const call = async (method, path, body, token, runToken) => {
    const res = await handle(new Request('http://x/api/' + path, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...(runToken ? { 'x-run-token': runToken } : {}) },
      body: body ? JSON.stringify(body) : undefined
    }), '1.2.3.4');
    return { status: res.status, body: await res.json() };
  };
  return { call, kv, tick: (sec) => { clock += sec * 1000; } };
}

async function playFair(s, token, hero, seconds, killsPerSec = 3) {
  const { body } = await s.call('POST', 'runs', { hero }, token);
  let t = 0;
  const rep = (tt) => ({ time: tt, kills: Math.floor(tt * killsPerSec), level: 1 + Math.floor(tt / 20), bosses: Math.floor(tt / 150) });
  while (t + 15 <= seconds) {
    s.tick(15); t += 15;
    const r = await s.call('POST', 'runs/' + body.runId + '/beat', rep(t), token);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  s.tick(seconds - t);
  return s.call('POST', 'runs/' + body.runId + '/finish', rep(seconds), token);
}

test('ник: похожие написания считаются одинаковыми', () => {
  assert.equal(nickKey('Вася'), nickKey('вася'));
  assert.equal(nickKey('Вася'), nickKey('Bacя'));
  assert.equal(nickKey('Kот_Сан'), nickKey('кот сан'));
  assert.notEqual(nickKey('Вася'), nickKey('Петя'));
});

const kvs = await makeKvs();
test.after(() => kvs.close());

for (const [name, mk] of kvs.list) {
  test(name + ': регистрация, вход, ник нельзя занять дважды и нельзя сменить', async () => {
    const s = setup(mk());
    let r = await s.call('POST', 'register', { login: 'vasya', password: '123456', nick: 'Вася' });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    r = await s.call('POST', 'register', { login: 'VASYA', password: '123456', nick: 'Другой' });
    assert.equal(r.status, 409, 'логин без учёта регистра');
    r = await s.call('POST', 'register', { login: 'petya', password: '123456', nick: 'Bacя' });
    assert.equal(r.status, 409, 'похожий ник занят');
    r = await s.call('GET', 'check-nick?nick=' + encodeURIComponent('вася'));
    assert.equal(r.body.ok, false);
    r = await s.call('GET', 'check-nick?nick=' + encodeURIComponent('Петя'));
    assert.equal(r.body.ok, true);
    r = await s.call('POST', 'login', { login: 'vasya', password: 'wrong!' });
    assert.equal(r.status, 401);
    r = await s.call('POST', 'login', { login: 'Vasya', password: '123456' });
    assert.equal(r.status, 200);
    const token = r.body.token;
    r = await s.call('PATCH', 'me', { nick: 'Новый' }, token);
    assert.equal(r.status, 403, 'ник менять нельзя');
    r = await s.call('GET', 'me', null, token);
    assert.equal(r.body.user.nick, 'Вася');
    r = await s.call('GET', 'me', null, 'someone-elses-token');
    assert.equal(r.status, 401);
  });

  test(name + ': честные забеги в лидерборде, сортировка время → убийства', async () => {
    const s = setup(mk());
    const a = (await s.call('POST', 'register', { login: 'aaa', password: '123456' })).body.token;
    const b = (await s.call('POST', 'register', { login: 'bbb', password: '123456' })).body.token;
    const c = (await s.call('POST', 'register', { login: 'ccc', password: '123456' })).body.token;
    assert.equal((await playFair(s, a, 'mage', 300, 2)).status, 200);
    assert.equal((await playFair(s, b, 'knight', 300, 4)).status, 200);
    const fin = await playFair(s, c, 'cat', 400, 2);
    assert.equal(fin.status, 200);
    assert.equal(fin.body.place, 1);
    assert.deepEqual((await s.call('GET', 'leaderboard')).body.rows.map((x) => x.nick), ['ccc', 'bbb', 'aaa']);
    assert.deepEqual((await s.call('GET', 'leaderboard?hero=knight')).body.rows.map((x) => x.nick), ['bbb']);
    // худший забег не портит рекорд
    await playFair(s, c, 'mage', 100, 2);
    assert.equal((await s.call('GET', 'leaderboard')).body.rows[0].time, 400);
  });

  test(name + ': лидерборд можно упорядочить по времени, убийствам и очкам', async () => {
    const s = setup(mk());
    const a = (await s.call('POST', 'register', { login: 'aaa', password: '123456' })).body.token;
    const b = (await s.call('POST', 'register', { login: 'bbb', password: '123456' })).body.token;
    const c = (await s.call('POST', 'register', { login: 'ccc', password: '123456' })).body.token;
    await playFair(s, a, 'mage', 300, 2);    // 300 сек, 600 убийств
    await playFair(s, b, 'knight', 300, 4);  // 300 сек, 1200 убийств
    await playFair(s, c, 'cat', 400, 2);     // 400 сек, 800 убийств
    const nicks = async (q) => (await s.call('GET', 'leaderboard' + q)).body.rows.map((x) => x.nick);
    assert.deepEqual(await nicks(''), ['ccc', 'bbb', 'aaa'], 'по умолчанию — по времени');
    assert.deepEqual(await nicks('?sort=time'), ['ccc', 'bbb', 'aaa']);
    assert.deepEqual(await nicks('?sort=kills'), ['bbb', 'ccc', 'aaa']);
    assert.deepEqual(await nicks('?sort=score'), ['ccc', 'bbb', 'aaa']);
    assert.deepEqual(await nicks('?sort=чепуха'), ['ccc', 'bbb', 'aaa'], 'мусор в sort не ломает таблицу');
    // места нумеруются по выбранному порядку
    const byKills = (await s.call('GET', 'leaderboard?sort=kills')).body.rows;
    assert.deepEqual(byKills.map((x) => x.place), [1, 2, 3]);
    // игра берёт числа для пояснения «как считаются очки» с сервера
    const { scoring, rows } = (await s.call('GET', 'leaderboard?sort=score')).body;
    assert.deepEqual(scoring, SCORE);
    assert.equal(rows[0].score, scoreOf({ time: 400, kills: 800, level: 21, bosses: 2 }));
  });

  test(name + ': читы не проходят', async () => {
    const s = setup(mk());
    const tok = (await s.call('POST', 'register', { login: 'cheater', password: '123456' })).body.token;
    let run = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(10);
    assert.equal((await s.call('POST', 'runs/' + run + '/finish', { time: 1800, kills: 5000, level: 60, bosses: 12 }, tok)).status, 422);
    run = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(600);
    assert.equal((await s.call('POST', 'runs/' + run + '/finish', { time: 590, kills: 900, level: 30, bosses: 3 }, tok)).status, 422);
    run = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(15);
    assert.equal((await s.call('POST', 'runs/' + run + '/beat', { time: 15, kills: 99999, level: 2, bosses: 0 }, tok)).status, 422);
    // бессмертный «турист»: 5 минут без убийств, отчёты честные
    run = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    let last;
    for (let t = 15; t <= 300; t += 15) { s.tick(15); last = await s.call('POST', 'runs/' + run + '/beat', { time: t, kills: 3, level: 2, bosses: 0 }, tok); if (last.status !== 200) break; }
    assert.equal(last.status, 422, 'без убийств долго не выжить');
    // отчёты пачкой не засчитываются и забег не отменяют
    run = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(15);
    assert.equal((await s.call('POST', 'runs/' + run + '/beat', { time: 15, kills: 30, level: 2, bosses: 0 }, tok)).status, 200);
    s.tick(1);
    assert.equal((await s.call('POST', 'runs/' + run + '/beat', { time: 16, kills: 31, level: 2, bosses: 0 }, tok)).status, 429);
    s.tick(14);
    assert.equal((await s.call('POST', 'runs/' + run + '/beat', { time: 30, kills: 60, level: 3, bosses: 0 }, tok)).status, 200);
    const ok = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(20);
    assert.equal((await s.call('POST', 'runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 200);
    assert.equal((await s.call('POST', 'runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 404);
    const rows = (await s.call('GET', 'leaderboard')).body.rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].time, 19);
  });
}

for (const [name, mk] of kvs.list) {
  test(name + ': гость умер, зарегистрировался и забрал свой забег', async () => {
    const s = setup(mk());
    const start = await s.call('POST', 'runs', { hero: 'cat' });
    assert.equal(start.status, 200);
    const { runId, runToken } = start.body;
    assert.ok(runToken, 'гостю выдаётся секрет забега');
    const rep = (t) => ({ time: t, kills: t * 2, level: 1 + Math.floor(t / 20), bosses: 0 });
    for (let t = 15; t <= 90; t += 15) { s.tick(15); assert.equal((await s.call('POST', 'runs/' + runId + '/beat', rep(t), null, runToken)).status, 200); }
    // чужой секрет не подходит
    assert.equal((await s.call('POST', 'runs/' + runId + '/beat', rep(91), null, 'wrong')).status, 404);
    s.tick(5);
    const fin = await s.call('POST', 'runs/' + runId + '/finish', rep(95), null, runToken);
    assert.equal(fin.status, 200, JSON.stringify(fin.body));
    assert.equal(fin.body.guest, true);
    assert.equal((await s.call('GET', 'leaderboard')).body.rows.length, 0, 'гость сам в лидерборд не попадает');
    const tok = (await s.call('POST', 'register', { login: 'newbie', password: '123456', nick: 'Новичок' })).body.token;
    assert.equal((await s.call('POST', 'runs/' + runId + '/claim', null, tok, 'wrong')).status, 404);
    const cl = await s.call('POST', 'runs/' + runId + '/claim', null, tok, runToken);
    assert.equal(cl.status, 200, JSON.stringify(cl.body));
    assert.equal(cl.body.place, 1);
    const rows = (await s.call('GET', 'leaderboard')).body.rows;
    assert.equal(rows[0].nick, 'Новичок');
    assert.equal(rows[0].time, 95);
    assert.equal((await s.call('POST', 'runs/' + runId + '/claim', null, tok, runToken)).status, 404, 'второй раз забрать нельзя');
  });

  test(name + ': гость — читы и просроченный забег не проходят', async () => {
    const s = setup(mk());
    let r = (await s.call('POST', 'runs', { hero: 'mage' })).body;
    s.tick(10);
    assert.equal((await s.call('POST', 'runs/' + r.runId + '/finish', { time: 900, kills: 3000, level: 40, bosses: 6 }, null, r.runToken)).status, 422);
    r = (await s.call('POST', 'runs', { hero: 'mage' })).body;
    s.tick(20);
    assert.equal((await s.call('POST', 'runs/' + r.runId + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, null, r.runToken)).status, 200);
    const tok = (await s.call('POST', 'register', { login: 'late', password: '123456' })).body.token;
    s.tick(31 * 60);
    assert.equal((await s.call('POST', 'runs/' + r.runId + '/claim', null, tok, r.runToken)).status, 410);
  });
}

for (const [name, mk] of kvs.list) {
  test(name + ': запрещённые ники не пройти в любом написании', async () => {
    const s = setup(mk());
    for (const nick of ['admin', 'Админ', 'Аdmіn', 'a d m i n', 'adm1n', 'Admin228', 'Модератор', 'xyй', 'Сука']) {
      const r = await s.call('POST', 'register', { login: 'u' + Math.random().toString(36).slice(2, 9), password: '123456', nick });
      assert.equal(r.status, 400, nick + ' должен быть запрещён');
      assert.equal((await s.call('GET', 'check-nick?nick=' + encodeURIComponent(nick))).body.ok, false);
    }
    assert.equal((await s.call('POST', 'register', { login: 'normal', password: '123456', nick: 'Влад Спидиди' })).status, 200);
  });

  test(name + ': старый запрещённый ник заменяется на случайный и в аккаунте, и в лидерборде', async () => {
    const s = setup(mk());
    const reg = (await s.call('POST', 'register', { login: 'oldbad', password: '123456', nick: 'Временный' })).body;
    // забег, чтобы игрок попал в лидерборд
    const run = (await s.call('POST', 'runs', { hero: 'mage' }, reg.token)).body.runId;
    s.tick(20);
    assert.equal((await s.call('POST', 'runs/' + run + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, reg.token)).status, 200);
    // как будто ник «admin» завели раньше, до появления проверки
    const u = await s.kv.get('user/oldbad'); await s.kv.put('user/oldbad', { ...u.value, nick: 'admin' });
    const b = await s.kv.get('board'); b.value.users[reg.user.id].nick = 'admin'; await s.kv.put('board', b.value);
    const rows = (await s.call('GET', 'leaderboard')).body.rows;
    assert.match(rows[0].nick, /^Игрок \d{4}$/);
    const me = (await s.call('GET', 'me', null, reg.token)).body.user;
    assert.equal(me.nick, rows[0].nick, 'в аккаунте тот же новый ник');
    assert.equal((await s.call('GET', 'leaderboard')).body.rows[0].time, 19, 'рекорд сохранился');
  });

  test(name + ': топ героев — забеги, время, игроки и лучший рекорд', async () => {
    const s = setup(mk());
    const a = (await s.call('POST', 'register', { login: 'hero_a', password: '123456', nick: 'Первый' })).body;
    const b = (await s.call('POST', 'register', { login: 'hero_b', password: '123456', nick: 'Второй' })).body;
    assert.equal((await playFair(s, a.token, 'vampire', 60)).status, 200);
    assert.equal((await playFair(s, b.token, 'vampire', 90)).status, 200);
    assert.equal((await playFair(s, a.token, 'mage', 30)).status, 200);
    await s.call('POST', 'runs', { hero: 'cat' });               // гость начал и бросил
    const r = (await s.call('GET', 'heroes')).body;
    assert.equal(r.rows.length, HEROES.length, 'все герои в списке');
    assert.equal(r.totalRuns, 4);
    const v = r.rows[0];
    assert.equal(v.hero, 'vampire', 'больше всего забегов — первый');
    assert.equal(v.runs, 2); assert.equal(v.time, 150); assert.equal(v.players, 2);
    assert.equal(v.best.nick, 'Второй'); assert.equal(v.best.time, 90);
    assert.equal(Math.round(v.share * 100), 50);
    const cat = r.rows.find((x) => x.hero === 'cat');
    assert.equal(cat.runs, 1); assert.equal(cat.time, 0); assert.equal(cat.players, 0); assert.equal(cat.best, null);
  });

  test(name + ': Лилита не атакует — забег без убийств засчитывается, у других героев нет', async () => {
    const s = setup(mk());
    const a = (await s.call('POST', 'register', { login: 'lilita_fan', password: '123456', nick: 'Бегунья' })).body;
    // честный забег без убийств: уровень 1, боссов нет
    const still = async (hero) => {
      const { body } = await s.call('POST', 'runs', { hero }, a.token);
      const rep = (tt) => ({ time: tt, kills: 0, level: 1, bosses: 0 });
      let last = null;
      for (let t = 15; t <= 300; t += 15) { s.tick(15); last = await s.call('POST', 'runs/' + body.runId + (t === 300 ? '/finish' : '/beat'), rep(t), a.token); if (last.status !== 200) break; }
      return last;
    };
    const fin = await still('lilita');
    assert.equal(fin.status, 200, JSON.stringify(fin.body));
    const bad = await still('mage');
    assert.equal(bad.status, 422);
    assert.match(bad.body.error, /мало убийств/);
  });
}
