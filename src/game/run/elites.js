/* =====================================================
   МИНИБОССЫ: элитные враги с умением
   Элита больше, крепче и даёт сундук, а ещё получает одно
   умение из таблицы. Каждое умение сначала предупреждает
   (замах, круг или линия на земле), чтобы от него можно
   было уйти.
   ===================================================== */
import { TYPES } from '../data.js';
import { rnd } from '../gfx.js';
import { G } from './state.js';
import { burst, addFx } from './fx.js';
import { hurtPlayer } from './combat.js';
import { spawnAt } from './enemies.js';

// glow — цвет свечения вокруг (ключ GLOW), cd — секунд между применениями,
// cast — сколько секунд длится предупреждение перед действием
export const ELITE_MODS = {
  dash: { name: 'Рывок', glow: 'red', cd: 5, cast: 0.7 },
  summon: { name: 'Призыв', glow: 'green', cd: 7, cast: 0.5 },
  quake: { name: 'Сотрясение', glow: 'cyan', cd: 4.5, cast: 0.8 }
};
const MOD_KEYS = Object.keys(ELITE_MODS);
export const DASH_LEN = 300, QUAKE_R = 115;
const DASH_TIME = 0.4;

export function makeMiniboss(e) {
  e.mod = MOD_KEYS[Math.floor(Math.random() * MOD_KEYS.length)];
  e.mcd = 2; e.mcast = 0; e.dash = 0; e.dax = 0; e.day = 0;
  return ELITE_MODS[e.mod];
}

// Возвращает множитель скорости, пока умение действует, иначе null —
// тогда враг ведёт себя как обычно для своего вида
export function minibossAI(e, d, mx, my, dt) {
  const M = ELITE_MODS[e.mod];
  if (e.dash > 0) { e.dash -= dt; e.mvx = e.dax; e.mvy = e.day; return DASH_LEN / DASH_TIME / e.spd; }
  if (e.mcast > 0) {
    e.mcast -= dt;
    if (e.mcast <= 0) release(e);
    return 0;
  }
  e.mcd -= dt;
  if (e.mcd > 0 || !inRange(e.mod, d)) return null;
  e.mcd = M.cd; e.mcast = M.cast;
  // направление рывка запоминается в начале замаха: увидел линию — отойди в сторону
  e.dax = mx; e.day = my;
  return 0;
}

function inRange(mod, d) {
  if (mod === 'dash') return d > 120 && d < DASH_LEN + 60;
  if (mod === 'quake') return d < QUAKE_R + 30;
  return d < 520;
}

function release(e) {
  const g = G, p = g.p;
  if (e.mod === 'dash') { e.dash = DASH_TIME; burst(e.x, e.y, '#ff6a7a', 10, 160); return; }
  if (e.mod === 'quake') {
    if (Math.hypot(p.x - e.x, p.y - e.y) < QUAKE_R + p.r && p.inv <= 0) hurtPlayer(e.dmg * 0.75, null, 'quake');
    g.rings.push({ x: e.x, y: e.y, max: QUAKE_R, age: 0, life: 0.4, col: '160,220,255' });
    burst(e.x, e.y, '#bfe6ff', 18, 220);
    addFx({ type: 'decal', x: e.x, y: e.y, r: 70, life: 1.5, T: 1.5 });
    g.shake = Math.max(g.shake, 0.18);
    return;
  }
  // призыв: двое слабых врагов из тех, что уже появляются в этом забеге
  const n = Math.min(3, g.unlocked);
  for (let i = 0; i < 2; i++) spawnAt(TYPES[Math.floor(Math.random() * n)], e.x + rnd(-50, 50), e.y + rnd(-50, 50));
  g.rings.push({ x: e.x, y: e.y, max: 70, age: 0, life: 0.4, col: '120,255,160' });
}
