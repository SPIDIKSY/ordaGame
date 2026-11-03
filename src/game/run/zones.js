/* =====================================================
   ОРУЖИЕ, КОТОРОЕ ДЕЙСТВУЕТ ПОСТОЯННО
   След, лезвия, аура, метеориты, лужи.
   ===================================================== */
import { TAU, rnd } from '../gfx.js';
import { G } from './state.js';
import { heroAttack } from './player.js';
import { burst, addFx } from './fx.js';
import { hitEnemy } from './combat.js';
import { compact, alive, notDone } from './compact.js';

const auraR = () => (70 + 12 * G.w.aura) * G.p.area;
// Оружие, которое действует постоянно: след, лезвия, аура, метеориты, лужи
export function updateZoneWeapons(dt) {
  const g = G, p = g.p, A = p.amount;
  zoneTrail(dt, g, p, A);
  zoneBlades(dt, g, p, A);
  zoneAura(dt, g, p, A);
  zoneMeteors(dt, g, p, A);
  zonePoison(dt, g, p, A);
}
// огненный след
function zoneTrail(dt, g, p, A) {
  if (g.w.trail) {
    const l = g.w.trail;
    g.wt.trail = (g.wt.trail || 0) - dt;
    if (g.wt.trail <= 0 && p.moving) {
      g.wt.trail = 0.16;
      const life = (1.6 + (l >= 2 ? 0.6 : 0) + (l >= 6 ? 0.6 : 0)) * p.dur;
      g.puddles.push({ kind: 'fire', x: p.x + rnd(-4, 4), y: p.y + 12, r: (24 + (l >= 4 ? 8 : 0) + (l >= 7 ? 6 : 0) + A * 4) * p.area,
        life, T: life, tick: 0, dmg: p.dmg * (0.35 + 0.12 * l + (l >= 3 ? 0.1 : 0)) });
    }
  }
}
// круговые лезвия
function zoneBlades(dt, g, p, A) {
  if (g.w.blades) {
    const l = g.w.blades, n = [1, 2, 2, 3, 3, 4, 5][l - 1] + A, R = 54 + 10 * p.area;
    const d = p.dmg * [0.9, 0.9, 1.1, 1.1, 1.35, 1.35, 1.65][l - 1];
    g.bladeN = n; g.bladeR = R; p.bladeA += (3.2 + 0.15 * l) * dt;
    for (let i = 0; i < n; i++) {
      const a = p.bladeA + i * TAU / n, bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead || e.bladeCd > 0) continue;
        const dx = e.x - bx, dy = e.y - by, rr = e.r + 10;
        if (dx * dx + dy * dy < rr * rr) { e.bladeCd = 0.3; hitEnemy(e, d, Math.cos(a) * 60, Math.sin(a) * 60); }
      }
    }
  } else g.bladeN = 0;
}
// святая аура
function zoneAura(dt, g, p, A) {
  if (g.w.aura) {
    g.wt.aura = (g.wt.aura || 0) - dt;
    if (g.wt.aura <= 0) {
      g.wt.aura = 0.35;
      addFx({ type: 'pulse', life: 0.5, T: 0.5 });
      const R = auraR(), d = p.dmg * (0.3 + 0.15 * g.w.aura);
      let touched = 0;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i]; if (e.dead) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) { hitEnemy(e, d, 0, 0, true); e.slow = Math.max(e.slow, 0.45); touched++; }
      }
      // Пивной кот отхлёбывает пиво, когда кого-то задел
      g.auraN = (g.auraN || 0) + 1;
      if (touched && g.heroWeapon === 'aura' && g.auraN % 5 === 0) heroAttack();
    }
  }
}
// метеориты
function zoneMeteors(dt, g, p, A) {
  for (let i = 0; i < g.meteors.length; i++) {
    const m = g.meteors[i];
    m.t -= dt;
    if (m.t > 0 && g.parts.length < 260) {
      const k = 1 - m.t / m.T;
      g.parts.push({ x: m.x + (1 - k) * 220 + rnd(-5, 5), y: m.y - (1 - k) * 420 + rnd(-5, 5), vx: rnd(10, 50), vy: rnd(-70, -20), life: 0.45, col: Math.random() < 0.5 ? '#ffb35a' : '#ff6a2e', s: rnd(2, 4.5) });
    }
    if (m.t <= 0 && !m.done) {
      m.done = true;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead) continue;
        const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) || 1;
        if (d < m.r + e.r) hitEnemy(e, m.dmg, dx / d * 260, dy / d * 260);
      }
      g.rings.push({ x: m.x, y: m.y, max: m.r, age: 0, life: 0.45, col: '255,140,60' });
      burst(m.x, m.y, '#ffb35a', 22, 260); burst(m.x, m.y, '#ff6a2e', 12, 180);
      addFx({ type: 'decal', x: m.x, y: m.y, r: m.r * 0.8, life: 3, T: 3 });
      for (let k = 0; k < 8; k++) addFx({ type: 'dust', x: m.x + rnd(-m.r * 0.4, m.r * 0.4), y: m.y + rnd(-m.r * 0.3, m.r * 0.3), vx: rnd(-30, 30), vy: rnd(-50, -15), life: 0.9, T: 0.9, r: rnd(8, 14), col: '80,66,62' });
      g.shake = Math.max(g.shake, 0.15);
    }
  }
  compact(g.meteors, notDone);
}
// ядовитые флаконы и лужи
function zonePoison(dt, g, p, A) {
  for (let i = 0; i < g.flasks.length; i++) {
    const f = g.flasks[i]; f.t += dt;
    if (f.t >= f.T && !f.done) {
      f.done = true;
      g.puddles.push({ x: f.tx, y: f.ty, r: f.r, life: f.life, T: f.life, tick: 0, dmg: f.dmg });
      burst(f.tx, f.ty, '#9dff6a', 12, 160); burst(f.tx, f.ty, '#e6ffe0', 5, 100);
      g.rings.push({ x: f.tx, y: f.ty, max: f.r, age: 0, life: 0.35, col: '150,255,110' });
    }
  }
  compact(g.flasks, notDone);
  for (let i = 0; i < g.puddles.length; i++) {
    const q = g.puddles[i];
    q.life -= dt; q.tick -= dt;
    if (q.tick <= 0) {
      const fire = q.kind === 'fire';
      q.tick = fire ? 0.3 : 0.4;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead) continue;
        const dx = e.x - q.x, dy = (e.y - q.y) / (fire ? 0.55 : 0.62), rr = q.r + e.r;
        if (dx * dx + dy * dy < rr * rr) { hitEnemy(e, q.dmg, 0, 0, true); if (!fire) e.slow = Math.max(e.slow, 0.45); }
      }
    }
  }
  compact(g.puddles, alive);
}
