/* =====================================================
   ЛЕГЕНДАРНЫЕ ПРЕДМЕТЫ: новые способности
   Каждая срабатывает сама: на ударе, на убийстве, на ранении
   или по таймеру. Список предметов — ITEMS в data.js (legend: true).
   ===================================================== */
import { jag } from '../gfx.js';
import { G } from './state.js';
import { toast, burst, pop } from './fx.js';
import { hitEnemy } from './combat.js';
import { explode } from './weapons.js';

export const THUNDER_EVERY = 10, FROST_CHANCE = 0.12, FROST_TIME = 1.2, BLAZE_CHANCE = 0.25;
export const CLOCK_EVERY = 25, CLOCK_TIME = 2.5, GRAIL_CD = 90, GRAIL_HEAL = 0.35;

// Способности не должны запускать друг друга по цепочке (взрыв → убийство → взрыв…)
let depth = 0;
const has = (id) => G.legend && G.legend[id];

// Удар по врагу: молния, заморозка, колун
export function onHit(e, d, crit) {
  if (depth || !G.legend) return;
  depth++;
  try {
    const g = G, p = g.p;
    if (has('frost') && !e.dead && Math.random() < FROST_CHANCE) {
      const t = e.T.boss ? FROST_TIME * 0.35 : FROST_TIME;
      e.frozen = Math.max(e.frozen || 0, t); e.slow = Math.max(e.slow, t);
      burst(e.x, e.y, '#d8f6ff', 5, 90);
    }
    if (has('cleave') && crit) {
      for (let i = 0; i < g.enemies.length; i++) {
        const o = g.enemies[i]; if (o === e || o.dead) continue;
        if (Math.hypot(o.x - e.x, o.y - e.y) < 80 + o.r) hitEnemy(o, d * 0.5, 0, 0, true, true);
      }
      g.rings.push({ x: e.x, y: e.y, max: 80, age: 0, life: 0.25, col: '255,90,90' });
    }
    if (has('thunder')) {
      g.hitN = (g.hitN || 0) + 1;
      if (g.hitN % THUNDER_EVERY === 0) {
        let px = e.x, py = e.y;
        const hit = new Set([e]);
        for (let j = 0; j < 4; j++) {
          let best = null, bd = 220 * 220;
          for (let i = 0; i < g.enemies.length; i++) {
            const o = g.enemies[i]; if (o.dead || hit.has(o)) continue;
            const dd = (o.x - px) ** 2 + (o.y - py) ** 2; if (dd < bd) { bd = dd; best = o; }
          }
          if (!best) break;
          hit.add(best);
          g.bolts.push({ pts: jag(px, py, best.x, best.y), A: [px, py], B: [best.x, best.y], life: 0.24 });
          hitEnemy(best, p.dmg * 1.5, 0, 0, false, true);
          px = best.x; py = best.y;
        }
      }
    }
  } finally { depth--; }
}

// Враг погиб: пылающее сердце
export function onKill(e) {
  if (depth || !has('blaze') || Math.random() >= BLAZE_CHANCE) return;
  depth++;
  try { explode(e.x, e.y, 65, G.p.dmg * 1.3); } finally { depth--; }
}

// Герой ранен: святой грааль спасает при низком здоровье (даже от смертельного удара)
export function onHurt() {
  const g = G, p = g.p;
  if (!has('grail') || (g.grailCd || 0) > 0 || p.hp >= p.maxHp * 0.3) return;
  g.grailCd = GRAIL_CD;
  p.hp = Math.max(0, p.hp) + p.maxHp * GRAIL_HEAL;
  p.inv = Math.max(p.inv, 1);
  g.rings.push({ x: p.x, y: p.y, max: 140, age: 0, life: 0.6, col: '255,220,120' });
  burst(p.x, p.y, '#ffe08a', 26, 220);
  pop(p.x, p.y - 34, '+' + Math.round(p.maxHp * GRAIL_HEAL), '#7dff9a', true);
  toast('Святой грааль спас тебя!');
}

// Каждый кадр: таймеры грааля и часов вечности, заморозка врагов
export function tickLegend(dt) {
  const g = G;
  if (!g.legend) return;
  if (g.grailCd > 0) g.grailCd -= dt;
  if (g.timeStop > 0) g.timeStop -= dt;
  if (has('clock')) {
    g.clockT = (g.clockT == null ? CLOCK_EVERY : g.clockT) - dt;
    if (g.clockT <= 0) {
      g.clockT = CLOCK_EVERY; g.timeStop = CLOCK_TIME;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i], tt = e.T.boss ? CLOCK_TIME * 0.4 : CLOCK_TIME;
        e.frozen = Math.max(e.frozen || 0, tt); e.slow = Math.max(e.slow, tt);
      }
      g.rings.push({ x: g.p.x, y: g.p.y, max: 600, age: 0, life: 0.7, col: '140,200,255' });
      toast('Часы вечности: время замерло!');
    }
  }
}
