/* =====================================================
   ЭФФЕКТЫ ПОВЕРХ ВСЕГО: частицы, вспышки попаданий,
   расходящиеся кольца, цифры урона
   ===================================================== */
import { TAU } from '../gfx.js';
import { ctx, G, cx, cy, star4 } from './frame.js';

export function drawEffects(now) {
  const g = G, p = g.p;
  // частицы
  for (let i = 0; i < g.parts.length; i++) {
    const q = g.parts[i], k = Math.min(1, q.life * 3); ctx.globalAlpha = k; ctx.fillStyle = q.col;
    ctx.beginPath(); ctx.arc(q.x - cx, q.y - cy, q.s * (0.35 + 0.65 * k), 0, TAU); ctx.fill();
  }
  // вспышки попаданий
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i]; if (q.type !== 'hit') continue;
    const k = 1 - q.life / q.T;
    ctx.globalAlpha = 1 - k; ctx.fillStyle = q.col;
    star4(q.x - cx, q.y - cy, (q.small ? 7 : 12) * (0.4 + k));
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // кольца
  for (let i = 0; i < g.rings.length; i++) {
    const q = g.rings[i], k = q.age / q.life;
    ctx.strokeStyle = 'rgba(' + q.col + ',' + (0.75 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = 7 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(q.x - cx, q.y - cy, q.max * (0.15 + 0.85 * k), 0, TAU); ctx.stroke();
  }
  // цифры урона
  ctx.textAlign = 'center';
  for (let i = 0; i < g.texts.length; i++) {
    const q = g.texts[i]; ctx.globalAlpha = Math.min(1, q.life * 3);
    const sp = 1 + 0.7 * Math.max(0, 1 - (0.6 - q.life) / 0.12);
    ctx.font = (q.big ? '700 ' + Math.round(19 * sp) : '500 ' + Math.round(12 * sp)) + 'px Rubik, system-ui, sans-serif';
    ctx.lineWidth = q.outline ? 4 : 3; ctx.strokeStyle = q.outline || 'rgba(10,12,20,.85)'; ctx.strokeText(q.s, q.x - cx, q.y - cy);
    ctx.fillStyle = q.col; ctx.fillText(q.s, q.x - cx, q.y - cy);
  }
  ctx.globalAlpha = 1;
}
