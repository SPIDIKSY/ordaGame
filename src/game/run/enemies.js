/* =====================================================
   ВРАГИ
   Кто и где появляется, как враги растут со временем,
   как ведут себя (поведение по типам) и как расталкивают друг друга.
   ===================================================== */
import { TAU, rnd } from '../gfx.js';
import { TYPES, SPIDER, GHOST, DOOM_T } from '../data.js';
import { W, H, hx, hy } from '../input.js';
import { G } from './state.js';
import { burst, addFx } from './fx.js';
import { hurtPlayer, killEnemy } from './combat.js';
import { arenaSpot } from './arena.js';
import { minibossAI } from './elites.js';

/* --- рост врагов и Волна смерти --- */
function scaling(t) {
  let hp = 1 + t / 150 + Math.pow(t / 240, 2), dmg = 1 + t / 220, spd = 1 + Math.min(t / 700, 0.22);
  if (t > DOOM_T) {
    const k = (t - DOOM_T) / 60;
    hp *= 2 * Math.pow(1.7, k); dmg *= 1.8 * Math.pow(1.45, k); spd *= 1.2 + 0.08 * k;
  }
  return { hp, dmg, spd };
}
export const spawnDist = () => Math.hypot(Math.max(hx, W - hx), Math.max(hy, H - hy)) + 40;
/* --- спавн, опыт, урон, смерть --- */
export function pickType(t) {
  const w = []; let tot = 0;
  for (let i = 0; i < TYPES.length; i++) {
    const T = TYPES[i];
    if (t < T.from) { w.push(0); continue; }
    const x = Math.max(0.22, Math.min(1, 1.25 - (t - T.from) / 260));
    w.push(x); tot += x;
  }
  let r = Math.random() * tot;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0 && w[i] > 0) return TYPES[i]; }
  return TYPES[0];
}
export function spawnEnemy(T, ang, dist, elite) {
  const g = G, p = g.p, t = g.t;
  const a = ang !== undefined ? ang : Math.random() * TAU;
  const d = dist !== undefined ? dist : spawnDist();
  const S = scaling(t), hpM = S.hp, dmgM = S.dmg, spM = S.spd;
  const k = elite ? 1.35 : 1;
  const hp = T.hp * hpM * (elite ? 7 : 1);
  const at = arenaSpot(p.x, p.y, a, d, T.r * k + 10);
  g.enemies.push({
    id: g.nextId++, T, elite: !!elite, scale: k,
    x: at.x, y: at.y, r: T.r * k,
    hp, maxHp: hp, spd: T.spd * spM * (0.9 + Math.random() * 0.2) * (elite ? 1.05 : 1),
    dmg: T.dmg * dmgM * (elite ? 1.5 : 1), xp: T.xp * (1 + t / 300) * (elite ? 5 : 1),
    hitCd: 0, flash: 0, bladeCd: 0, slow: 0, kx: 0, ky: 0, ph: Math.random() * 4, dead: false, born: 0, sq: 0, atk: 1 + Math.random() * 1.5, cast: 0, fuse: 0
  });
}
/* --- поведение особых врагов и атаки боссов --- */
export function spawnAt(T, x, y) {
  spawnEnemy(T, 0, 0);
  const e = G.enemies[G.enemies.length - 1]; e.x = x; e.y = y; e.born = 0.3;
  return e;
}
// Снаряды врагов: скорость (пикс/с), доля урона врага и размер. Подобрано так, чтобы
// от одиночного выстрела можно было увернуться, а толпа стрелков не убивала мгновенно.
const ESHOT = { arrow: { sp: 220, dmg: 0.45, r: 6 }, web: { sp: 200, dmg: 0.35, r: 6 }, orb: { sp: 150, dmg: 0.35, r: 8 } };
function eShoot(e, a, kind) {
  const S = ESHOT[kind];
  if (G.eshots.length < 220) G.eshots.push({ x: e.x, y: e.y - 6, vx: Math.cos(a) * S.sp, vy: Math.sin(a) * S.sp, kind, r: S.r, dmg: e.dmg * S.dmg, life: 4 });
}
// Пороховой бес: радиус взрыва и сколько секунд горит фитиль
export const IMP_R = 72, IMP_FUSE = 0.9;
// Ледяной титан: сколько секунд замахивается перед ударом о землю
export const SLAM_CAST = 1.1, SLAM_R = 180;
function impBoom(e) {
  const g = G, p = g.p, R = IMP_R;
  if (Math.hypot(p.x - e.x, p.y - e.y) < R + p.r && p.inv <= 0) hurtPlayer(e.dmg * 1.15, null, 'imp-boom');
  g.rings.push({ x: e.x, y: e.y, max: R, age: 0, life: 0.4, col: '255,120,60' });
  burst(e.x, e.y, '#ffb35a', 20, 260); burst(e.x, e.y, '#ff4a2e', 10, 180);
  addFx({ type: 'decal', x: e.x, y: e.y, r: 50, life: 1.5, T: 1.5 });
  g.shake = Math.max(g.shake, 0.12);
  if (!e.dead) killEnemy(e);
}
// Возвращает множитель скорости; может задать своё направление через e.mvx / e.mvy
export function enemyAI(e, d, mx, my, dt) {
  const g = G, p = g.p, T = e.T;
  e.atk -= dt;
  if (e.mod) { const k = minibossAI(e, d, mx, my, dt); if (k !== null) return k; }
  switch (T.ai || T.ab) {
    case 'zigzag': { const s = Math.sin(g.t * 6 + e.ph * 3) * 0.9; e.mvx = mx - my * s; e.mvy = my + mx * s; return 1; }
    case 'ranged':
      if (e.atk <= 0 && d < 430) { e.atk = 3; eShoot(e, Math.atan2(p.y - e.y, p.x - e.x), 'arrow'); }
      if (d < 200) { e.mvx = -mx; e.mvy = -my; return 0.8; }
      if (d < 270) { e.mvx = -my; e.mvy = mx; return 0.6; }
      return 1;
    case 'bomber':
      if (e.fuse > 0) { e.fuse -= dt; if (Math.floor(e.fuse * 14) % 2 === 0) e.flash = 0.05; if (e.fuse <= 0) impBoom(e); return 0; }
      if (d < 70) { e.fuse = IMP_FUSE; return 0; }
      return 1;
    case 'blink':
      if (e.atk <= 0 && d > 150 && d < 650) {
        e.atk = 3.2; burst(e.x, e.y, '#b77cff', 10, 140);
        const k = (d - 95) / d; e.x += (p.x - e.x) * k; e.y += (p.y - e.y) * k;
        burst(e.x, e.y, '#d9b8ff', 12, 160); e.born = 0.4;
      }
      return 1;
    case 'summon':
      if (e.atk <= 0) {
        e.atk = 4;
        for (let i = 0; i < 3; i++) spawnAt(TYPES[0], e.x + rnd(-45, 45), e.y + rnd(-45, 45));
        g.rings.push({ x: e.x, y: e.y, max: 80, age: 0, life: 0.4, col: '200,140,255' });
      }
      return 1;
    case 'slam':
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) {
          const R = SLAM_R;
          if (Math.hypot(p.x - e.x, p.y - e.y) < R && p.inv <= 0) hurtPlayer(e.dmg, null, 'slam');
          g.rings.push({ x: e.x, y: e.y, max: R, age: 0, life: 0.5, col: '160,210,255' });
          g.rings.push({ x: e.x, y: e.y, max: R * 0.6, age: 0, life: 0.35, col: '255,255,255' });
          burst(e.x, e.y, '#bfe6ff', 30, 300);
          addFx({ type: 'decal', x: e.x, y: e.y, r: 120, life: 2, T: 2 });
          g.shake = Math.max(g.shake, 0.35);
        }
        return 0;
      }
      if (e.atk <= 0 && d < 420) { e.atk = 5; e.cast = SLAM_CAST; }
      return 1;
    case 'brood':
      if (e.atk <= 0) {
        e.atk = 3.2;
        if (Math.random() < 0.5) { for (let i = 0; i < 3; i++) spawnAt(SPIDER, e.x + rnd(-30, 30), e.y + rnd(-30, 30)); }
        else { const a = Math.atan2(p.y - e.y, p.x - e.x); for (let i = -2; i <= 2; i++) eShoot(e, a + i * 0.22, 'web'); }
      }
      return 1;
    case 'bullets':
      if (e.atk <= 0) {
        e.atk = 2.8; e.wave = (e.wave || 0) + 1;
        if (e.wave % 3 === 0) { for (let i = 0; i < 4; i++) spawnAt(GHOST, e.x + rnd(-60, 60), e.y + rnd(-60, 60)); }
        else { const n = 14, off = Math.random() * TAU; for (let i = 0; i < n; i++) eShoot(e, off + i * TAU / n, 'orb'); }
      }
      return 1;
  }
  return 1;
}
/* --- раздвигаем врагов, чтобы не слипались --- */
const sgrid = new Map();
export function separate(dt) {
  const E = G.enemies, cs = 40;
  sgrid.clear();
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; e.cx = Math.floor(e.x / cs); e.cy = Math.floor(e.y / cs);
    const k = e.cx * 100003 + e.cy, a = sgrid.get(k);
    if (a) a.push(e); else sgrid.set(k, [e]);
  }
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; let px = 0, py = 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const a = sgrid.get((e.cx + ox) * 100003 + (e.cy + oy)); if (!a) continue;
      for (let j = 0; j < a.length; j++) {
        const o = a[j]; if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, md = (e.r + o.r) * 0.85, d2 = dx * dx + dy * dy;
        if (d2 < md * md) {
          if (d2 > 0.01) { const d = Math.sqrt(d2), f = (md - d) / md; px += dx / d * f; py += dy / d * f; }
          else { px += Math.random() - 0.5; py += Math.random() - 0.5; }
        }
      }
    }
    e.x += px * 90 * dt; e.y += py * 90 * dt;
  }
}
