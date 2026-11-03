/* =====================================================
   ОРУЖИЕ: ВЫСТРЕЛЫ
   Прицеливание и выстрелы оружия, которое стреляет по перезарядке.
   ===================================================== */
import { TAU, rnd, jag } from '../gfx.js';
import { W, H } from '../input.js';
import { G } from './state.js';
import { topK } from '../data.js';
import { heroAttack } from './player.js';
import { burst, addFx } from './fx.js';
import { hitEnemy } from './combat.js';
import { updateZoneWeapons } from './zones.js';

const cdK = () => G.p.cdMul * (G.buffs.haste > 0 ? 0.6 : 1);
export const TRAIL = { bolt: 0.5, frost: 0.5, knife: 0.25, axe: 0, fire: 0.9, wisp: 0.7, boom: 0.15 };
export const TRAILC = { bolt: '#ffc46a', frost: '#bdf0ff', knife: '#e8eeff', axe: '#ffffff', fire: '#ff8a3a', wisp: '#c9a0ff', boom: '#ffd27a' };
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
export function nearest(x, y, range) {
  let best = null, bd = range * range;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function enemiesWithin(range) {
  const p = G.p, out = [];
  for (let i = 0; i < G.enemies.length; i++) { const e = G.enemies[i]; if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < range) out.push(e); }
  return out;
}
// Целимся с упреждением: туда, где враг будет, когда снаряд долетит
function leadAim(ox, oy, t, speed) {
  const p = G.p, sp = t.spd * (t.slow > 0 ? 0.5 : 1), td = Math.hypot(p.x - t.x, p.y - t.y) || 1;
  const vx = (p.x - t.x) / td * sp, vy = (p.y - t.y) / td * sp;
  let tx = t.x, ty = t.y;
  for (let k = 0; k < 3; k++) { const tt = Math.hypot(tx - ox, ty - oy) / speed; tx = t.x + vx * tt; ty = t.y + vy * tt; }
  return Math.atan2(ty - oy, tx - ox);
}
function shoot(o) { if (G.shots.length < 700) { o.hit = []; G.shots.push(o); } }
function fireStaff(target, l) {
  const g = G, p = g.p;
  const base = Math.atan2(target.y - p.y, target.x - p.x);
  p.face = Math.cos(base) >= 0 ? 1 : -1;
  const ox = p.x + 12 * p.face, oy = p.y - 15;
  burst(ox, oy, '#ffd27a', 3, 110);
  const n = 1 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0) + (l >= 7 ? 1 : 0) + (l >= 9 ? 1 : 0) + p.amount;
  const sp = 460 * p.pspeedMul, aim = leadAim(ox, oy, target, sp);
  const dmg = p.dmg * (l >= 3 ? 1.3 : 1) * (l >= 8 ? 1.25 : 1) * topK(l), pierce = (l >= 4 ? 1 : 0) + (l >= 7 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const a = aim + (i - (n - 1) / 2) * 0.15;
    shoot({ kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, pierce, life: 380 * p.rangeMul / sp + 0.15, r: 7 });
  }
}
function castChain(l) {
  const g = G, p = g.p, cand = enemiesWithin(380);
  if (!cand.length) return false;
  let cur = cand[Math.floor(Math.random() * cand.length)];
  const hit = [cur.id], dmg = p.dmg * (1.45 + 0.4 * l) * topK(l), jumps = 3 + l + p.amount;
  let px = p.x + 12 * p.face, py = p.y - 15;
  for (let j = 0; j <= jumps && cur; j++) {
    g.bolts.push({ pts: jag(px, py, cur.x, cur.y), A: [px, py], B: [cur.x, cur.y], life: 0.24 });
    hitEnemy(cur, dmg, 0, 0);
    burst(cur.x, cur.y, '#bfe9ff', 4, 120);
    px = cur.x; py = cur.y;
    let best = null, bd = 170 * 170;
    for (let i = 0; i < g.enemies.length; i++) {
      const e = g.enemies[i]; if (e.dead || hit.indexOf(e.id) >= 0) continue;
      const dx = e.x - px, dy = e.y - py, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = e; }
    }
    cur = best; if (cur) hit.push(cur.id);
  }
  return true;
}
export function explode(x, y, r, dmg) {
  const g = G;
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
    if (d < r + e.r) hitEnemy(e, dmg, dx / d * 220, dy / d * 220);
  }
  g.rings.push({ x, y, max: r, age: 0, life: 0.4, col: '255,150,60' });
  burst(x, y, '#ffb35a', 14, 220); burst(x, y, '#ff6a2e', 8, 150);
  addFx({ type: 'decal', x, y, r: r * 0.6, life: 1.6, T: 1.6 });
  g.shake = Math.max(g.shake, 0.06);
}
export function updateWeapons(dt) {
  const g = G, p = g.p, A = p.amount;
  for (let wi = 0; wi < g.wOrder.length; wi++) {
    const id = g.wOrder[wi], l = g.w[id];
    if (id === 'blades' || id === 'aura' || id === 'trail') continue;
    g.wt[id] = (g.wt[id] || 0) - dt;
    if (g.wt[id] > 0) continue;
    // Если выстрелило «родное» оружие героя — играем анимацию атаки рукой
    if (id === g.heroWeapon) {
      const sig = g.shots.length + g.fx.length + g.flasks.length;
      fireWeapon(id, l);
      if (g.shots.length + g.fx.length + g.flasks.length !== sig) heroAttack();
    } else fireWeapon(id, l);
  }
  updateZoneWeapons(dt);
}
// Выстрел одного оружия
function fireWeapon(id, l) {
  const g = G, p = g.p, A = p.amount;
  const fn = FIRE[id];
  if (fn) fn(id, l, g, p, A);
}
// Выстрел каждого оружия. id нужен веткам, чтобы ставить перезарядку g.wt[id]
const FIRE = {
  staff(id, l, g, p, A) {
  const t = nearest(p.x, p.y, 380 * p.rangeMul);
  if (t) { fireStaff(t, l); g.wt[id] = 0.55 * (l >= 6 ? 0.8 : 1) * cdK(); } else g.wt[id] = 0.05;
  },
  nova(id, l, g, p, A) {
  g.wt[id] = Math.max(2, 4.4 - 0.4 * l) * cdK();
  const rad = (100 + 14 * l) * p.area, d = p.dmg * (1.5 + 0.55 * l) * topK(l);
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (e.dead) continue;
    const dx = e.x - p.x, dy = e.y - p.y, dd = Math.hypot(dx, dy) || 1;
    if (dd < rad + e.r) hitEnemy(e, d, dx / dd * 320, dy / dd * 320);
  }
  g.rings.push({ x: p.x, y: p.y, max: rad, age: 0, life: 0.45, col: '255,194,74' });
  g.rings.push({ x: p.x, y: p.y, max: rad * 0.65, age: 0, life: 0.3, col: '255,255,255' });
  for (let k = 0; k < 18; k++) { const a = k * TAU / 18; g.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * rad * 2.2, vy: Math.sin(a) * rad * 2.2, life: 0.35, col: '#ffd27a', s: 3 }); }
  },
  chain(id, l, g, p, A) {
  g.wt[id] = castChain(l) ? Math.max(0.8, 1.9 - 0.16 * (l - 1)) * cdK() : 0.2;
  },
  meteor(id, l, g, p, A) {
  const cand = enemiesWithin(Math.max(W, H) * 0.6);
  if (!cand.length) { g.wt[id] = 0.3; return; }
  g.wt[id] = Math.max(1.6, 3.6 - 0.3 * l) * cdK();
  const n = 1 + Math.floor(l / 2) + A;
  for (let i = 0; i < n; i++) {
    const e = cand[Math.floor(Math.random() * cand.length)], T = 0.75 + i * 0.12;
    g.meteors.push({ x: e.x + rnd(-20, 20), y: e.y + rnd(-20, 20), t: T, T, r: (70 + 8 * l) * p.area, dmg: p.dmg * (3 + l) * topK(l) });
  }
  },
  frost(id, l, g, p, A) {
  g.wt[id] = Math.max(1.1, 2.2 - 0.18 * l) * cdK();
  const n = 6 + 2 * l + 2 * A, sp = 360 * p.pspeedMul; g.frostA += 0.37;
  for (let i = 0; i < n; i++) {
    const a = g.frostA + i * TAU / n;
    shoot({ kind: 'frost', x: p.x, y: p.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: p.dmg * (0.7 + 0.26 * l) * topK(l), pierce: 1 + l, life: 0.95, r: 7 });
  }
  },
  axe(id, l, g, p, A) {
  g.wt[id] = Math.max(0.9, 1.9 - 0.14 * l) * cdK();
  const n = 1 + Math.floor(l / 3) + A, size = Math.sqrt(p.area);
  // топоры летят в сторону ближайшего врага, а не туда, куда бежит герой
  const tgt = nearest(p.x, p.y, 480), side = tgt ? (tgt.x >= p.x ? 1 : -1) : p.face;
  for (let i = 0; i < n; i++) {
    shoot({ kind: 'axe', x: p.x, y: p.y - 10, vx: side * 50 + (i - (n - 1) / 2) * 110 + rnd(-25, 25), vy: -(470 + rnd(0, 70)) * Math.sqrt(p.pspeedMul),
      grav: 950, rot: 0, spin: side * 13, size, dmg: p.dmg * (2.2 + 0.45 * l) * topK(l), pierce: 999, life: 1.9, r: 12 * size });
  }
  },
  knife(id, l, g, p, A) {
  g.wt[id] = Math.max(0.3, 0.95 - 0.08 * l) * cdK();
  const n = 1 + Math.floor(l / 2) + A, sp = 650 * p.pspeedMul;
  // Авто-прицел, как у остального оружия: ножи летят в ближайшего врага с упреждением,
  // даже когда герой бежит в другую сторону. Врагов рядом нет — летят, куда бежим.
  let dx = p.dirX, dy = p.dirY;
  const t = nearest(p.x, p.y, 420 * p.rangeMul);
  if (t) { const a = leadAim(p.x, p.y - 4, t, sp); dx = Math.cos(a); dy = Math.sin(a); p.face = dx >= 0 ? 1 : -1; }
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * 9;
    shoot({ kind: 'knife', x: p.x - dy * off, y: p.y - 4 + dx * off, vx: dx * sp, vy: dy * sp, dmg: p.dmg * (0.9 + 0.22 * l) * topK(l), pierce: Math.floor(l / 3), life: 0.7 * p.rangeMul, r: 6 });
  }
  },
  fireball(id, l, g, p, A) {
  const cand = enemiesWithin(420);
  if (!cand.length) { g.wt[id] = 0.2; return; }
  g.wt[id] = Math.max(1.2, 2.7 - 0.2 * l) * cdK();
  const n = 1 + Math.floor(l / 3) + A, sp = 260 * p.pspeedMul;
  for (let i = 0; i < n; i++) {
    const t = cand[Math.floor(Math.random() * cand.length)], a = leadAim(p.x, p.y - 8, t, sp) + rnd(-0.08, 0.08);
    shoot({ kind: 'fire', x: p.x, y: p.y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: p.dmg * (2.1 + 0.55 * l) * topK(l), boom: (55 + 8 * l) * p.area, pierce: 0, life: 2.2, r: 10 });
  }
  },
  puddle(id, l, g, p, A) {
  g.wt[id] = Math.max(1.8, 3.4 - 0.24 * l) * cdK();
  const n = 1 + Math.floor(l / 3) + A, cand = enemiesWithin(320);
  for (let i = 0; i < n; i++) {
    let tx, ty;
    if (cand.length) { const e = cand[Math.floor(Math.random() * cand.length)]; tx = e.x; ty = e.y; }
    else { const a = Math.random() * TAU; tx = p.x + Math.cos(a) * 110; ty = p.y + Math.sin(a) * 110; }
    g.flasks.push({ sx: p.x, sy: p.y - 10, tx, ty, t: 0, T: 0.5 + i * 0.08, r: (52 + 7 * l) * p.area, life: (2.6 + 0.3 * l) * p.dur, dmg: p.dmg * (0.75 + 0.18 * l) * topK(l) });
  }
  },
  whip(id, l, g, p, A) {
  g.wt[id] = (l >= 6 ? 0.95 : 1.2) * cdK();
  const dmgF = [1.9, 1.9, 2.5, 2.5, 3.2, 3.2, 4.4, 4.4, 5.2, 5.2][l - 1] * topK(l), len = 150 * p.area * (l >= 4 ? 1.3 : 1) * (l >= 8 ? 1.15 : 1), hh = 36 * Math.sqrt(p.area);
  // меч бьёт в сторону ближайшего врага; если рядом никого — не машет впустую
  const tgt = nearest(p.x, p.y, len + 60);
  if (!tgt) { g.wt[id] = 0.1; return; }
  const front = tgt.x >= p.x ? 1 : -1, aimY = Math.max(-30, Math.min(30, tgt.y - p.y));
  p.face = front;
  const sides = l >= 2 ? 2 : 1, n = 1 + A;
  for (let k = 0; k < sides; k++) {
    const dir = k === 0 ? front : -front;
    for (let j = 0; j < n; j++) {
      const oy = (j - (n - 1) / 2) * hh * 0.9 + (k === 0 ? aimY : 0), cx0 = p.x + dir * len / 2, cy0 = p.y - 4 + oy;
      for (let q = 0; q < g.enemies.length; q++) {
        const e = g.enemies[q]; if (e.dead) continue;
        if (Math.abs(e.x - cx0) < len / 2 + e.r && Math.abs(e.y - cy0) < hh / 2 + e.r) hitEnemy(e, p.dmg * dmgF, dir * 140, 0);
      }
      addFx({ type: 'slash', x: p.x, y: p.y - 4 + oy, dir, len, hh, life: 0.22, T: 0.22 });
    }
  }
  },
  boomer(id, l, g, p, A) {
  const t0 = nearest(p.x, p.y, 420);
  g.wt[id] = Math.max(1.0, 2.0 - 0.14 * l) * cdK();
  const n = 1 + Math.floor(l / 3) + A, v0 = 520 * p.pspeedMul * (l >= 4 ? 1.2 : 1), size = Math.sqrt(p.area);
  const base = t0 ? Math.atan2(t0.y - p.y, t0.x - p.x) : Math.atan2(p.dirY, p.dirX);
  for (let i = 0; i < n; i++) {
    const a = base + (i - (n - 1) / 2) * 0.35;
    shoot({ kind: 'boom', x: p.x, y: p.y - 6, dx: Math.cos(a), dy: Math.sin(a), v: v0, vx: 0, vy: 0, back: false, rot: 0,
      dmg: p.dmg * (1.5 + 0.35 * l) * topK(l), pierce: 999, life: 4, r: 12 * size, size });
  }
  },
  laser(id, l, g, p, A) {
  const cand = enemiesWithin(450 * p.rangeMul);
  if (!cand.length) { g.wt[id] = 0.2; return; }
  g.wt[id] = Math.max(1.4, 3.0 - 0.22 * l) * cdK() * (l >= 6 ? 0.85 : 1);
  const n = 1 + (l >= 4 ? 1 : 0) + (l >= 7 ? 1 : 0) + (l >= 10 ? 1 : 0) + A, len = 480 * p.rangeMul;
  const w = (14 + (l >= 2 ? 6 : 0) + (l >= 6 ? 6 : 0) + (l >= 8 ? 6 : 0)) * p.area, d = p.dmg * (2 + 0.5 * l) * topK(l);
  cand.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
  for (let i = 0; i < n; i++) {
    const t = cand[i % cand.length], a = Math.atan2(t.y - p.y, t.x - p.x) + (i >= cand.length ? i * 0.5 : 0);
    const ox = p.x + Math.cos(a) * 14, oy = p.y - 8 + Math.sin(a) * 14, ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
    for (let q = 0; q < g.enemies.length; q++) {
      const e = g.enemies[q]; if (e.dead) continue;
      if (segDist(e.x, e.y, ox, oy, ex, ey) < w / 2 + e.r) hitEnemy(e, d, Math.cos(a) * 80, Math.sin(a) * 80);
    }
    addFx({ type: 'beam', x: ox, y: oy, x2: ex, y2: ey, w, life: 0.35, T: 0.35 });
  }
  },
  spikes(id, l, g, p, A) {
  const cand = enemiesWithin(380);
  if (!cand.length) { g.wt[id] = 0.25; return; }
  g.wt[id] = Math.max(1.2, 2.6 - 0.18 * l) * cdK() * (l >= 7 ? 0.85 : 1);
  const n = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8][l - 1] + A, R = 34 * p.area * (l >= 5 ? 1.25 : 1) * (l >= 9 ? 1.15 : 1), d = p.dmg * (1.8 + 0.45 * l) * topK(l);
  for (let i = 0; i < n; i++) {
    const t = cand[Math.floor(Math.random() * cand.length)], sx = t.x + rnd(-10, 10), sy = t.y + rnd(-6, 6);
    addFx({ type: 'spike', x: sx, y: sy, r: R, life: 0.55, T: 0.55 });
    for (let q = 0; q < g.enemies.length; q++) {
      const e = g.enemies[q]; if (e.dead) continue;
      if (Math.hypot(e.x - sx, e.y - sy) < R + e.r) { hitEnemy(e, d, 0, 0); e.slow = Math.max(e.slow, 0.6); }
    }
    for (let k = 0; k < 3; k++) addFx({ type: 'dust', x: sx + rnd(-R / 2, R / 2), y: sy + rnd(-4, 6), vx: rnd(-25, 25), vy: rnd(-30, -10), life: 0.5, T: 0.5, r: rnd(4, 7), col: '120,105,90' });
  }
  },
  wisp(id, l, g, p, A) {
  g.wt[id] = Math.max(0.9, 1.8 - 0.13 * l) * cdK();
  const n = 3 + Math.floor(l / 2) + A, sp = 300 * p.pspeedMul;
  for (let i = 0; i < n; i++) {
    const a = i * TAU / n + rnd(-0.3, 0.3);
    shoot({ kind: 'wisp', x: p.x, y: p.y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, spd: sp, dmg: p.dmg * (1.3 + 0.32 * l) * topK(l), pierce: 1, life: 3.2, r: 9, tgt: null });
  }
  }
};
