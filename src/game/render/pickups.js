/* =====================================================
   ПРЕДМЕТЫ НА ЗЕМЛЕ: кристаллы опыта, сердечки, сундуки,
   временные бонусы и исчезающие тела врагов
   ===================================================== */
import { TAU } from '../gfx.js';
import { GLOW, BEAM, GEMS, HEARTSPR, CHEST, PUS } from '../sprites/world.js';
import { ctx, G, dpr, cx, cy, inView, blitGlow, star4, rotT } from './frame.js';

export function drawPickups(now) {
  const g = G, p = g.p;
  // кристаллы, сердечки, сундуки
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.gems.length; i++) {
    const q = g.gems[i]; if (q.type !== 'xp' || q.tier === 0) continue;
    const x = q.x - cx, y = q.y - cy; if (!inView(x, y, 0)) continue;
    blitGlow(q.tier === 1 ? GLOW.green : GLOW.red, x, y, 26, 0.5);
  }
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i], x = c.x - cx, y = c.y - cy; if (!inView(x, y, 60)) continue;
    ctx.globalAlpha = 0.65 + 0.25 * Math.sin(now / 250);
    ctx.drawImage(BEAM, x - 18, y - 110, 36, 120);
    blitGlow(GLOW.gold, x, y, 70, 0.45);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (let i = 0; i < g.gems.length; i++) {
    const q = g.gems[i], x = q.x - cx, y = q.y - cy + Math.sin(now / 300 + q.ph) * 1.5;
    if (!inView(x, y, 0)) continue;
    const s = q.type === 'heart' ? HEARTSPR : GEMS[q.tier];
    const sx = q.type === 'heart' ? 1 : 0.5 + 0.5 * Math.abs(Math.cos(now / 420 + q.ph));
    ctx.drawImage(s, x - s.w * sx / 2, y - s.h / 2, s.w * sx, s.h);
    const tw = Math.sin(now / 260 + q.ph * 3);
    if (tw > 0.92) {
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = (tw - 0.92) / 0.08;
      star4(x + 3, y - 4, 4.5);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i], x = c.x - cx, y = c.y - cy - 4 + Math.sin(now / 320) * 2;
    if (!inView(x, y, 40)) continue;
    const wob = Math.sin(now / 70) * 0.07 * Math.max(0, Math.sin(now / 700));
    rotT(wob, x, y + 12);
    ctx.drawImage(CHEST, -CHEST.w / 2, -CHEST.h / 2 - 12, CHEST.w, CHEST.h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff3c0';
    for (let k = 0; k < 3; k++) {
      const a = now / 700 + k * TAU / 3, tw = 0.5 + 0.5 * Math.sin(now / 180 + k * 2);
      ctx.globalAlpha = tw; star4(x + Math.cos(a) * 24, y - 6 + Math.sin(a) * 12, 3 + tw * 2.5);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  // временные бонусы: крутятся как монетки
  for (let i = 0; i < g.pickups.length; i++) {
    const q = g.pickups[i];
    if (q.life < 5 && Math.floor(now / 120) % 2 === 0) continue;
    const x = q.x - cx, y = q.y - cy - 6 + Math.sin(now / 280 + q.ph) * 3;
    if (!inView(x, y, 30)) continue;
    const D = PUS[q.kind], sx = Math.max(0.18, Math.abs(Math.cos(now / 520 + q.ph)));
    ctx.globalCompositeOperation = 'lighter';
    blitGlow(GLOW[D.glow], x, y, 54, 0.65 + 0.25 * Math.sin(now / 150 + q.ph));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(D.spr, x - 15 * sx, y - 15, 30 * sx, 30);
  }

  // исчезающие тела врагов
  for (let i = 0; i < g.corpses.length; i++) {
    const q = g.corpses[i], k = q.t / q.life, x = q.x - cx, y = q.y - cy;
    if (!inView(x, y, 40)) continue;
    const sx = q.sc * (1 + k * 0.55), sy = q.sc * (1 - k * 0.65);
    ctx.globalAlpha = 1 - k;
    ctx.setTransform(dpr * q.flip * sx, 0, 0, dpr * sy, dpr * x, dpr * (y + q.img.h * q.sc * 0.35 - (q.fly ? 4 : 0)));
    ctx.drawImage(q.img, -q.img.w / 2, -q.img.h * 0.85, q.img.w, q.img.h);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;

}
