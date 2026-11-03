/* =====================================================
   ПОЛ: всё, что лежит на земле под существами —
   выжженная земля, лужи, поле «Семя», предупреждения об ударах,
   тени, кольцо под героем, пыль из-под ног
   ===================================================== */
import { TAU } from '../gfx.js';
import { GLOW, SEED, SOFT } from '../sprites/world.js';
import { IMP_R, IMP_FUSE, SLAM_R, SLAM_CAST, ARCHER_AIM } from '../run/enemies.js';
import { ELITE_MODS, DASH_LEN, QUAKE_R } from '../run/elites.js';
import { ctx, G, dpr, heroSpr, cx, cy, inView, auraR, blitGlow, star4, rotT } from './frame.js';

export function drawFloor(now) {
  const g = G, p = g.p;
  // выжженная земля от метеоритов
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i]; if (q.type !== 'decal') continue;
    const x = q.x - cx, y = q.y - cy;
    ctx.globalAlpha = Math.min(1, q.life / 1.2) * 0.6;
    ctx.drawImage(SOFT.decal, x - q.r, y - q.r * 0.62, q.r * 2, q.r * 1.24);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, q.life / 3) * 0.5;
    ctx.fillStyle = '#ff7a2e';
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + q.r, d = q.r * 0.45; star4(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 2.5); }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;

  // ядовитые лужи с пузырями
  for (let i = 0; i < g.puddles.length; i++) {
    const q = g.puddles[i], x = q.x - cx, y = q.y - cy; if (!inView(x, y, q.r)) continue;
    const a = Math.max(0, Math.min(1, q.life / 0.4, (q.T - q.life) / 0.2));
    const grow = Math.min(1, (q.T - q.life) / 0.25);
    const R = q.r * (0.6 + 0.4 * grow);
    if (q.kind === 'fire') {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.85;
      ctx.drawImage(SOFT.fire, x - R, y - R * 0.55, R * 2, R * 1.1);
      for (let k = 0; k < 3; k++) {
        const fx = x + (k - 1) * R * 0.42, fh = R * (0.65 + 0.3 * Math.sin(now / 70 + k * 2 + i)) * a;
        ctx.fillStyle = k === 1 ? 'rgba(255,225,130,.85)' : 'rgba(255,120,40,.75)';
        ctx.beginPath(); ctx.moveTo(fx - R * 0.17, y);
        ctx.quadraticCurveTo(fx - R * 0.2, y - fh * 0.6, fx, y - fh);
        ctx.quadraticCurveTo(fx + R * 0.2, y - fh * 0.6, fx + R * 0.17, y); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      continue;
    }
    ctx.globalAlpha = a;
    ctx.drawImage(SOFT.poison, x - R, y - R * 0.62, R * 2, R * 1.24);
    ctx.strokeStyle = 'rgba(170,255,130,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, R * (0.94 + Math.sin(now / 200 + i) * 0.04), R * 0.58, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(210,255,180,.8)';
    for (let k = 0; k < 7; k++) {
      const ph = (now / 900 + k * 0.37 + i * 0.13) % 1, ang = k * 2.4 + i, d = R * 0.7 * ((k * 0.37 + 0.2) % 1);
      ctx.globalAlpha = a * (1 - ph);
      ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d * 0.6 - ph * 7, 1.4 + ph * 3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // поле «Семя» под всем
  if (g.w.aura) {
    const R = auraR(), x = p.x - cx, y = p.y - cy;
    ctx.globalCompositeOperation = 'lighter';
    blitGlow(GLOW.white, x, y, R * 2.3, 0.28 + 0.06 * Math.sin(now / 200));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.setLineDash([10, 14]); ctx.lineDashOffset = -now * 0.03;
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    // семечки кружат по краю и внутри поля
    for (let k = 0; k < 10; k++) {
      const a = now / 900 + k * TAU / 10;
      rotT(a * 3 + k, x + Math.cos(a) * R, y + Math.sin(a) * R * 0.9);
      ctx.drawImage(SEED, -SEED.w / 2, -SEED.h / 2, SEED.w, SEED.h);
    }
    for (let k = 0; k < 7; k++) {
      const a = -now / 1300 + k * TAU / 7, rr = R * (0.45 + 0.15 * Math.sin(now / 700 + k));
      ctx.globalAlpha = 0.85;
      rotT(-a * 2 + k, x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.9);
      ctx.drawImage(SEED, -SEED.w * 0.4, -SEED.h * 0.4, SEED.w * 0.8, SEED.h * 0.8);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < g.fx.length; i++) {
      const q = g.fx[i]; if (q.type !== 'pulse') continue;
      const k = 1 - q.life / q.T;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, R * (0.2 + 0.8 * k), 0, TAU); ctx.stroke();
    }
  }
  // предупреждения метеоритов
  for (let i = 0; i < g.meteors.length; i++) {
    const q = g.meteors[i], k = 1 - q.t / q.T, x = q.x - cx, y = q.y - cy;
    ctx.fillStyle = 'rgba(255,90,40,' + (0.08 + 0.18 * k).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x, y, q.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,140,70,.7)'; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.arc(x, y, q.r * (0.3 + 0.7 * k), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  // предупреждения на земле: бес вот-вот взорвётся, титан и минибоссы готовят удар
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i], x = e.x - cx, y = e.y - cy;
    if (e.fuse > 0) warnCircle(x, y, IMP_R, 1 - e.fuse / IMP_FUSE, '255,90,40', '255,170,90', 6);
    if (e.cast > 0) warnCircle(x, y, SLAM_R, 1 - e.cast / SLAM_CAST, '120,190,255', '170,220,255', 8);
    if (e.mcast > 0) warnMiniboss(e, x, y);
    // лучник целится: красная линия к герою становится ярче перед выстрелом
    if (e.aim > 0) {
      const k = 1 - e.aim / ARCHER_AIM, px = p.x - cx, py = p.y - cy;
      ctx.strokeStyle = 'rgba(255,70,90,' + (0.15 + 0.55 * k).toFixed(2) + ')'; ctx.lineWidth = 1 + 2 * k; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(px, py - 4); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // тени
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath();
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i], x = e.x - cx, y = e.y - cy;
    if (!inView(x, y, e.r)) continue;
    const sy = y + e.r * (e.T.fly ? 1.25 : 0.82), sr = e.r * (e.T.fly ? 0.65 : 0.95);
    ctx.moveTo(x + sr, sy); ctx.ellipse(x, sy, sr, sr * 0.36, 0, 0, TAU);
  }
  ctx.moveTo(p.x - cx + 12, p.y - cy + 18); ctx.ellipse(p.x - cx, p.y - cy + 18, 12, 4.4, 0, 0, TAU);
  ctx.fill();
  // кольцо под героем — сразу видно, где ты в толпе
  {
    const L = heroSpr.look, rx = p.x - cx, ry = p.y - cy + 18, pulse = 0.5 + 0.5 * Math.sin(now / 380);
    ctx.fillStyle = 'rgba(' + L.ring + ',.12)';
    ctx.beginPath(); ctx.ellipse(rx, ry, 18, 6.6, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(' + L.ring + ',' + (0.5 + 0.25 * pulse).toFixed(2) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(rx, ry, 18, 6.6, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(' + L.ring + ',' + (0.35 * (1 - pulse)).toFixed(2) + ')'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(rx, ry, 18 + pulse * 7, 6.6 + pulse * 2.6, 0, 0, TAU); ctx.stroke();
  }
  // пыль из-под ног и дым
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i]; if (q.type !== 'dust') continue;
    const k = 1 - q.life / q.T;
    ctx.fillStyle = 'rgba(' + q.col + ',' + (0.38 * (1 - k)).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(q.x - cx, q.y - cy, q.r * (1 + k * 1.4), 0, TAU); ctx.fill();
  }

}

// Круг, куда придётся удар, и сжимающийся к нему пунктир: k от 0 до 1 — сколько прошло от замаха
function warnCircle(x, y, R, k, fill, stroke, dash) {
  ctx.fillStyle = 'rgba(' + fill + ',' + (0.08 + 0.2 * k).toFixed(3) + ')';
  ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(' + stroke + ',.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([dash, dash]);
  ctx.beginPath(); ctx.arc(x, y, R * (0.2 + 0.8 * k), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
}

function warnMiniboss(e, x, y) {
  const M = ELITE_MODS[e.mod], k = 1 - e.mcast / M.cast;
  if (e.mod === 'quake') { warnCircle(x, y, QUAKE_R, k, '120,200,255', '190,235,255', 6); return; }
  if (e.mod === 'summon') { warnCircle(x, y, 60, k, '90,255,140', '160,255,190', 5); return; }
  // рывок: полоса по пути, которая наливается красным
  const ex = x + e.dax * DASH_LEN, ey = y + e.day * DASH_LEN;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,70,90,' + (0.12 + 0.25 * k).toFixed(3) + ')'; ctx.lineWidth = e.r * 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,150,160,.85)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (ex - x) * k, y + (ey - y) * k); ctx.stroke(); ctx.setLineDash([]);
}
