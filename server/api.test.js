// Проверки сервера: npm test
// Каждый тест прогоняется дважды: с SQLite (свой сервер) и с Netlify Blobs (локальный эмулятор)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';
import { createHandler, nickKey } from './api.js';
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
  const call = async (method, path, body, token) => {
    const res = await handle(new Request('http://x/api/' + path, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    }), '1.2.3.4');
    return { status: res.status, body: await res.json() };
  };
  return { call, tick: (sec) => { clock += sec * 1000; } };
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
    const ok = (await s.call('POST', 'runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(20);
    assert.equal((await s.call('POST', 'runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 200);
    assert.equal((await s.call('POST', 'runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 404);
    const rows = (await s.call('GET', 'leaderboard')).body.rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].time, 19);
  });
}
