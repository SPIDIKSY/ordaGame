// Проверки сервера: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { openDb } from './db.js';
import { createApi } from './app.js';

// Сервер с базой в памяти и «подкручиваемыми» часами
async function setup() {
  let clock = 1_000_000_000_000;
  const app = express();
  app.use('/api', createApi({ db: openDb(':memory:'), now: () => clock }));
  const srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  const base = 'http://127.0.0.1:' + srv.address().port + '/api';
  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    return { status: res.status, body: await res.json() };
  };
  return { call, tick: (sec) => { clock += sec * 1000; }, close: () => srv.close() };
}

// Честный забег: отчёты каждые 15 секунд
async function playFair(s, token, hero, seconds, killsPerSec = 3) {
  const { body } = await s.call('POST', '/runs', { hero }, token);
  let t = 0;
  while (t + 15 <= seconds) {
    s.tick(15); t += 15;
    const r = await s.call('POST', '/runs/' + body.runId + '/beat', { time: t, kills: Math.floor(t * killsPerSec), level: 1 + Math.floor(t / 20), bosses: Math.floor(t / 150) }, token);
    assert.equal(r.status, 200, JSON.stringify(r.body));
  }
  s.tick(seconds - t);
  return s.call('POST', '/runs/' + body.runId + '/finish', { time: seconds, kills: Math.floor(seconds * killsPerSec), level: 1 + Math.floor(seconds / 20), bosses: Math.floor(seconds / 150) }, token);
}

test('регистрация, вход, смена ника', async () => {
  const s = await setup();
  try {
    let r = await s.call('POST', '/register', { login: 'vasya', password: '123456', nick: 'Вася' });
    assert.equal(r.status, 200);
    assert.equal(r.body.user.nick, 'Вася');
    r = await s.call('POST', '/register', { login: 'VASYA', password: '123456' });
    assert.equal(r.status, 409, 'логин без учёта регистра');
    r = await s.call('POST', '/login', { login: 'vasya', password: 'wrong!' });
    assert.equal(r.status, 401);
    r = await s.call('POST', '/login', { login: 'vasya', password: '123456' });
    assert.equal(r.status, 200);
    const token = r.body.token;
    r = await s.call('PATCH', '/me', { nick: 'Убийца Орды' }, token);
    assert.equal(r.status, 200);
    r = await s.call('PATCH', '/me', { nick: '<script>' }, token);
    assert.equal(r.status, 400);
    r = await s.call('GET', '/me', null, 'someone-elses-token');
    assert.equal(r.status, 401);
  } finally { s.close(); }
});

test('честный забег попадает в лидерборд, сортировка: время, потом убийства', async () => {
  const s = await setup();
  try {
    const a = (await s.call('POST', '/register', { login: 'aaa', password: '123456' })).body.token;
    const b = (await s.call('POST', '/register', { login: 'bbb', password: '123456' })).body.token;
    const c = (await s.call('POST', '/register', { login: 'ccc', password: '123456' })).body.token;
    assert.equal((await playFair(s, a, 'mage', 300, 2)).status, 200);
    assert.equal((await playFair(s, b, 'knight', 300, 4)).status, 200);
    const fin = await playFair(s, c, 'rogue', 400, 2);
    assert.equal(fin.status, 200);
    assert.equal(fin.body.place, 1);
    const lb = (await s.call('GET', '/leaderboard')).body.rows.map((x) => x.nick);
    assert.deepEqual(lb, ['ccc', 'bbb', 'aaa']);
    const knights = (await s.call('GET', '/leaderboard?hero=knight')).body.rows.map((x) => x.nick);
    assert.deepEqual(knights, ['bbb']);
  } finally { s.close(); }
});

test('читы: время больше реального, нет отчётов, лишние убийства', async () => {
  const s = await setup();
  try {
    const tok = (await s.call('POST', '/register', { login: 'cheater', password: '123456' })).body.token;
    // 1) сразу прислать «выжил 30 минут»
    let run = (await s.call('POST', '/runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(10);
    let r = await s.call('POST', '/runs/' + run + '/finish', { time: 1800, kills: 5000, level: 60, bosses: 12 }, tok);
    assert.equal(r.status, 422);
    // 2) подождать реальное время, но без отчётов по ходу игры
    run = (await s.call('POST', '/runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(600);
    r = await s.call('POST', '/runs/' + run + '/finish', { time: 590, kills: 900, level: 30, bosses: 3 }, tok);
    assert.equal(r.status, 422);
    // 3) отчёты есть, но убийств невозможно много
    run = (await s.call('POST', '/runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(15);
    r = await s.call('POST', '/runs/' + run + '/beat', { time: 15, kills: 99999, level: 2, bosses: 0 }, tok);
    assert.equal(r.status, 422);
    // 4) повторно засчитать тот же забег нельзя
    const ok = (await s.call('POST', '/runs', { hero: 'mage' }, tok)).body.runId;
    s.tick(20);
    assert.equal((await s.call('POST', '/runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 200);
    assert.equal((await s.call('POST', '/runs/' + ok + '/finish', { time: 19, kills: 30, level: 2, bosses: 0 }, tok)).status, 404);
    // в лидерборде только честный короткий забег
    const rows = (await s.call('GET', '/leaderboard')).body.rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].time, 19);
  } finally { s.close(); }
});
