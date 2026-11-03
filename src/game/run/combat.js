/* =====================================================
   БОЙ И ДОБЫЧА
   Урон по врагам и по герою, криты, смерть врага,
   опыт, кристаллы, сундуки и временные бонусы.
   ===================================================== */
import { TAU, rnd } from '../gfx.js';
import { TYPES, xpNeed } from '../data.js';
import { SPR } from '../sprites/enemies/index.js';
import { PUS, PU_W, BUFF_TIME } from '../sprites/world.js';
import { W, H, hx, hy } from '../input.js';
import { G } from './state.js';
import { toast, burst, pop, DMG_COL } from './fx.js';
import { spawnAt } from './enemies.js';
import { die } from './session.js';
import { onHit, onKill, onHurt } from './legend.js';

/* --- опыт, урон, смерть --- */
export function addXp(v) {
  const g = G;
  g.xp += v * g.p.xpMul;
  while (g.xp >= g.need) {
    g.xp -= g.need; g.level++; g.need = xpNeed(g.level); g.pending++;
    if (g.level % 5 === 0) g.rerolls++;
  }
}
function addGem(x, y, v, type) {
  if (type === 'xp' && G.gems.length > 420) { addXp(v); return; }
  G.gems.push({ x, y, v, type, tier: v < 2.5 ? 0 : v < 9 ? 1 : 2, mag: false, sp: 0, ph: Math.random() * TAU });
}
function dropChest(x, y, kind) {
  G.chests.push({ x, y, kind, t: 0 });
  toast(kind === 'boss' ? 'Босс оставил сундук!' : 'Выпал сундук!');
}
function rollPickup() { let r = Math.random() * 100; for (const q of PU_W) { r -= q[1]; if (r <= 0) return q[0]; } return 'heal'; }
function addPickup(x, y, kind) { G.pickups.push({ x, y, kind, life: 30, ph: Math.random() * TAU }); }
export function usePickup(q) {
  const g = G, p = g.p, D = PUS[q.kind];
  burst(q.x, q.y, D.col, 16, 200);
  g.rings.push({ x: q.x, y: q.y, max: 46, age: 0, life: 0.35, col: '255,255,255' });
  if (q.kind === 'heal') {
    const v = Math.round(p.maxHp * 0.3); p.hp = Math.min(p.maxHp, p.hp + v);
    pop(p.x, p.y - 34, '+' + v, '#7dff9a', true);
    for (let i = 0; i < 10; i++) g.parts.push({ x: p.x + rnd(-14, 14), y: p.y + rnd(-6, 14), vx: rnd(-10, 10), vy: rnd(-90, -40), life: 0.7, col: '#7dff9a', s: rnd(2.5, 4) });
  } else if (q.kind === 'magnet') {
    for (const gm of g.gems) gm.mag = true;
    g.rings.push({ x: p.x, y: p.y, max: 460, age: 0, life: 0.7, col: '90,170,255' });
    toast('Магнит: весь опыт летит к тебе');
  } else if (q.kind === 'bomb') {
    g.flash = 0.4; g.shake = 0.45;
    const cx = p.x - hx, cy = p.y - hy;
    for (const e of g.enemies) {
      if (e.dead) continue;
      const x = e.x - cx, y = e.y - cy;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      if (e.elite || e.T.boss) hitEnemy(e, p.dmg * 12, 0, 0); else hitEnemy(e, e.hp + 1, 0, 0, true, true);
    }
    g.rings.push({ x: p.x, y: p.y, max: Math.max(W, H) * 0.8, age: 0, life: 0.6, col: '255,150,60' });
    g.rings.push({ x: p.x, y: p.y, max: Math.max(W, H) * 0.5, age: 0, life: 0.45, col: '255,240,200' });
    toast('Бомба!');
  } else {
    g.buffs[q.kind] = BUFF_TIME * p.dur;
    toast(D.name + ': ' + (q.kind === 'rage' ? 'двойной урон' : 'бег и атака быстрее') + ' на ' + Math.round(BUFF_TIME * p.dur) + ' сек');
  }
}
export function hurtPlayer(d, src, label) {
  const g = G, p = g.p;
  if (g.dmgBy) { const k = label || (src ? src.T.key : '?'); g.dmgBy[k] = (g.dmgBy[k] || 0) + Math.max(d * 0.35, d - p.armor); }
  g.hurtFx = 0.4; g.shake = Math.max(g.shake, 0.12);
  // броня срезает не больше 65% удара
  p.hp -= Math.max(d * 0.35, d - p.armor); p.inv = 0.3; p.hurt = 0.25;
  onHurt();
  burst(p.x, p.y, '#ff6b6b', 6, 120);
  if (src && p.thorns > 0) hitEnemy(src, p.thorns * (1 + p.b.dmg), 0, 0, true, true);
  if (p.hp <= 0) {
    if (p.revive >= 1) {
      p.revive -= 1; p.hp = p.maxHp * 0.5; p.inv = 2; g.flash = 0.5; g.shake = 0.4;
      for (const e of g.enemies) {
        if (e.dead || e.elite || e.T.boss) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < 230) hitEnemy(e, e.hp + 1, 0, 0, true, true);
      }
      g.rings.push({ x: p.x, y: p.y, max: 230, age: 0, life: 0.6, col: '255,120,60' });
      burst(p.x, p.y, '#ffb35a', 40, 300);
      toast('Перо феникса: ты воскрес!');
    } else die();
  }
}
export function killEnemy(e) {
  const g = G, p = g.p;
  e.dead = true; g.kills++;
  onKill(e);
  if (e.T.boss) g.bossKills++;
  if (g.corpses.length < 70) g.corpses.push({ x: e.x, y: e.y, img: SPR[e.T.key].w[0], flip: p.x < e.x ? -1 : 1, sc: e.scale, t: 0, life: e.T.boss ? 0.6 : 0.32, fly: !!e.T.fly });
  burst(e.x, e.y, e.T.pc, e.T.boss ? 34 : e.elite ? 18 : 7, e.T.boss ? 270 : 140);
  if (e.T.boss) {
    for (let i = 0; i < 6; i++) addGem(e.x + rnd(-35, 35), e.y + rnd(-35, 35), e.xp / 6, 'xp');
    addPickup(e.x + 26, e.y, 'heal');
    dropChest(e.x, e.y, 'boss');
  } else if (e.elite) {
    addGem(e.x + 10, e.y, e.xp, 'xp');
    dropChest(e.x - 6, e.y, 'elite');
  } else {
    addGem(e.x, e.y, e.xp, 'xp');
    if (e.T.split) for (let i = 0; i < 3; i++) spawnAt(TYPES[0], e.x + rnd(-16, 16), e.y + rnd(-16, 16));
    if (Math.random() < 0.025 * (1 + p.luck * 0.5) && g.pickups.length < 6) addPickup(e.x + 8, e.y, rollPickup());
    if (Math.random() < 0.0025 * (1 + p.luck) && g.chests.length < 4) dropChest(e.x, e.y, 'normal');
  }
  // вампиризм лечит не быстрее «копилки», которая медленно наполняется
  if (p.vamp > 0 && g.vampBank > 0) { const h = Math.min(p.vamp, g.vampBank); g.vampBank -= h; p.hp = Math.min(p.maxHp, p.hp + h); }
}
// Крит считается здесь, для любого оружия
export function hitEnemy(e, d, kx, ky, quiet, noCrit) {
  if (e.dead) return;
  let crit = false;
  if (!noCrit && Math.random() < G.p.crit) { crit = true; d *= G.p.critDmg; }
  if (G.buffs.rage > 0) d *= 2;
  if (e.T.armored) d *= 0.6;
  e.hp -= d; e.flash = 0.09; e.sq = 1; e.kx += kx || 0; e.ky += ky || 0;
  if (!quiet || crit) {
    const col = crit ? DMG_COL.crit : G.buffs.rage > 0 ? DMG_COL.rage : e.T.armored ? DMG_COL.armor : DMG_COL.normal;
    pop(e.x, e.y - e.r, Math.round(d) + (crit ? '!' : ''), col, crit, crit ? 'rgba(70,0,10,.95)' : null);
  }
  onHit(e, d, crit);
  if (e.hp <= 0) killEnemy(e);
}
