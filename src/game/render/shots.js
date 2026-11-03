/* =====================================================
   СНАРЯДЫ И УДАРЫ: снаряды героя и врагов, флаконы,
   каменные шипы, удары кнута, лучи света, метеориты, молнии
   ===================================================== */
import { TAU, jag } from '../gfx.js';
import { GLOW, AXE, KNIFE, FLASK, BOOMER } from '../sprites/world.js';
import { ctx, G, dpr, cx, cy, inView, blitGlow, star4, rotT } from './frame.js';

export function drawShots(now) {
  const g = G, p = g.p;
  // снаряды всех видов: сначала свечение, потом сами предметы
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < g.shots.length; i++) {
    const s = g.shots[i], x = s.x - cx, y = s.y - cy; if (!inView(x, y, 0)) continue;
    if (s.kind === 'frost') blitGlow(GLOW.cyan, x, y, 24, 0.7);
    else if (s.kind === 'knife') {
      ctx.globalAlpha = 0.55; ctx.strokeStyle = '#dfe8ff'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.06, y - s.vy * 0.06); ctx.stroke();
    } else if (s.kind === 'axe') blitGlow(GLOW.cyan, x, y, 34 * s.size, 0.22);
    else if (s.kind === 'boom') blitGlow(GLOW.amber, x, y, 40 * s.size, 0.35);
    else if (s.kind === 'fire') {
      const fl = 1 + Math.sin(now / 40 + i) * 0.12;
      ctx.globalAlpha = 0.6; ctx.strokeStyle = '#ff6a2e'; ctx.lineWidth = 11;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.1, y - s.vy * 0.1); ctx.stroke();
      blitGlow(GLOW.orange, x, y, 62 * fl, 1);
    } else if (s.kind === 'wisp') {
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#a06cff'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.07, y - s.vy * 0.07); ctx.stroke();
      blitGlow(GLOW.purple, x, y, 36 + Math.sin(now / 60 + i) * 5, 1);
      // искорки-хвост за огоньком
      ctx.fillStyle = '#e2c9ff';
      for (let k = 1; k <= 3; k++) {
        ctx.globalAlpha = 0.5 - k * 0.12;
        const w = Math.sin(now / 80 + i + k) * 3;
        ctx.beginPath(); ctx.arc(x - s.vx * 0.025 * k - s.vy * 0.01 * w, y - s.vy * 0.025 * k + s.vx * 0.01 * w, 2.4 - k * 0.5, 0, TAU); ctx.fill();
      }
    } else {
      // огненный сгусток посоха: хвост-комета и мерцающее ядро
      const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, tl = 24 + Math.sin(now / 35 + i) * 4;
      const gr = ctx.createLinearGradient(x, y, x - ux * tl, y - uy * tl);
      gr.addColorStop(0, 'rgba(255,210,110,.9)'); gr.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x - uy * 5, y + ux * 5); ctx.quadraticCurveTo(x - ux * tl * 0.5 - uy * 3, y - uy * tl * 0.5 + ux * 3, x - ux * tl, y - uy * tl);
      ctx.quadraticCurveTo(x - ux * tl * 0.5 + uy * 3, y - uy * tl * 0.5 - ux * 3, x + uy * 5, y - ux * 5); ctx.closePath(); ctx.fill();
      blitGlow(GLOW.amber, x, y, 30 + Math.sin(now / 45 + i) * 4, 0.95);
    }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (let i = 0; i < g.shots.length; i++) {
    const s = g.shots[i], x = s.x - cx, y = s.y - cy; if (!inView(x, y, 0)) continue;
    if (s.kind === 'frost') {
      rotT(Math.atan2(s.vy, s.vx), x, y);
      ctx.fillStyle = '#effcff'; ctx.strokeStyle = '#7cc8ec'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(0, 3); ctx.lineTo(-8, 0); ctx.lineTo(0, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (s.kind === 'knife') {
      rotT(Math.atan2(s.vy, s.vx), x, y);
      ctx.drawImage(KNIFE, -KNIFE.w / 2, -KNIFE.h / 2, KNIFE.w, KNIFE.h);
    } else if (s.kind === 'axe') {
      rotT(s.rot, x, y);
      ctx.drawImage(AXE, -AXE.w * s.size / 2, -AXE.h * s.size / 2, AXE.w * s.size, AXE.h * s.size);
    } else if (s.kind === 'boom') {
      rotT(s.rot, x, y);
      ctx.drawImage(BOOMER, -BOOMER.w * s.size / 2, -BOOMER.h * s.size / 2, BOOMER.w * s.size, BOOMER.h * s.size);
    } else if (s.kind === 'fire') {
      ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(x - 1.5, y - 1.5, 4, 0, TAU); ctx.fill();
    } else if (s.kind === 'wisp') {
      ctx.fillStyle = '#f6eeff'; ctx.beginPath(); ctx.arc(x, y, 3.8, 0, TAU); ctx.fill();
    } else {
      ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, TAU); ctx.fill();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // летящие флаконы
  for (let i = 0; i < g.flasks.length; i++) {
    const f = g.flasks[i], k = Math.min(1, f.t / f.T);
    const X = f.sx + (f.tx - f.sx) * k - cx, Y = f.sy + (f.ty - f.sy) * k - cy - Math.sin(k * Math.PI) * 70;
    rotT(k * 9, X, Y);
    ctx.drawImage(FLASK, -FLASK.w / 2, -FLASK.h / 2, FLASK.w, FLASK.h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  // каменные шипы
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i]; if (q.type !== 'spike') continue;
    const k = 1 - q.life / q.T, X = q.x - cx, Y = q.y - cy;
    const hk = k < 0.18 ? k / 0.18 : k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(30,20,12,.4)'; ctx.beginPath(); ctx.ellipse(X, Y + 2, q.r, q.r * 0.35, 0, 0, TAU); ctx.fill();
    const offs = [-0.55, -0.25, 0, 0.28, 0.55], hs = [0.55, 0.85, 1.15, 0.8, 0.5];
    for (let j = 0; j < 5; j++) {
      const sx = X + offs[j] * q.r, sh = q.r * 1.1 * hs[j] * hk, sw = q.r * 0.2;
      const gr = ctx.createLinearGradient(sx, Y - sh, sx, Y);
      gr.addColorStop(0, '#f2e6cc'); gr.addColorStop(1, '#6a5440');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(sx - sw, Y + 1); ctx.lineTo(sx, Y - sh); ctx.lineTo(sx + sw, Y + 1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2e2216'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  // удары кнута и лучи света
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i];
    if (q.type === 'slash') {
      // Дуга рубящего удара: клинок проходит сверху вниз перед героем
      const k = 1 - q.life / q.T, X = q.x - cx, Y = q.y - cy, d = q.dir, L = q.len, hh = q.hh;
      const ecx = X + d * L * 0.12, ecy = Y - 4, rx = L * 0.9, ry = hh * 1.2;
      const head = Math.min(1, k * 2.2), tail = Math.max(0, head - 0.8), fade = 1 - Math.max(0, (k - 0.4) / 0.6);
      const a0 = -1.6, a1 = 0.95, N = 16;
      const pt = (u) => { const a = a0 + (a1 - a0) * u; return [ecx + d * rx * Math.cos(a), ecy + ry * Math.sin(a)]; };
      for (const pass of [[1, '255,150,60'], [0.55, '255,235,190'], [0.2, '255,255,255']]) {
        for (let j = 0; j < N; j++) {
          const u0 = tail + (head - tail) * (j / N), u1 = tail + (head - tail) * ((j + 1) / N), q1 = (j + 1) / N;
          const A = pt(u0), B = pt(u1);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'rgba(' + pass[1] + ',' + (0.8 * fade * q1).toFixed(3) + ')';
          ctx.lineWidth = (2 + 15 * q1) * pass[0];
          ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        }
      }
      const P = pt(head);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = fade; star4(P[0], P[1], 7 * fade + 2);
    } else if (q.type === 'beam') {
      const k = 1 - q.life / q.T, X1 = q.x - cx, Y1 = q.y - cy, X2 = q.x2 - cx, Y2 = q.y2 - cy;
      const wv = q.w * (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85 * 0.8) * (1 + Math.sin(now / 25) * 0.08);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.45 * (1 - k * 0.6); ctx.strokeStyle = '#ffcf5a'; ctx.lineWidth = Math.max(1, wv * 1.8);
      ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke();
      ctx.globalAlpha = 0.95 * (1 - k * 0.5); ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = Math.max(1, wv * 0.55);
      ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke();
      blitGlow(GLOW.gold, X1, Y1, wv * 4 + 10, 0.8 * (1 - k));
    }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // снаряды врагов
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.eshots.length; i++) {
    const s = g.eshots[i], x = s.x - cx, y = s.y - cy; if (!inView(x, y, 0)) continue;
    if (s.kind === 'arrow') blitGlow(GLOW.red, x, y, 24, 0.55);
    else if (s.kind === 'web') blitGlow(GLOW.purple, x, y, 30, 0.8);
    else { blitGlow(GLOW.purple, x, y, 40 + Math.sin(now / 60 + i) * 5, 1); blitGlow(GLOW.red, x, y, 18, 0.6); }
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  for (let i = 0; i < g.eshots.length; i++) {
    const s = g.eshots[i], x = s.x - cx, y = s.y - cy; if (!inView(x, y, 0)) continue;
    if (s.kind === 'arrow') {
      rotT(Math.atan2(s.vy, s.vx), x, y);
      ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(6, 0); ctx.stroke();
      ctx.fillStyle = '#e8eef8'; ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(5, -3.5); ctx.lineTo(5, 3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6a78'; ctx.fillRect(-12, -2.5, 4, 5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else if (s.kind === 'web') {
      ctx.strokeStyle = 'rgba(240,230,255,.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.moveTo(x, y - 7); ctx.lineTo(x, y + 7); ctx.stroke();
    } else {
      ctx.fillStyle = '#f6e6ff'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    }
  }
  // метеориты в полёте
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.meteors.length; i++) {
    const q = g.meteors[i], k = Math.min(1, 1 - q.t / q.T), x = q.x - cx + (1 - k) * 220, y = q.y - cy - (1 - k) * 420;
    ctx.globalAlpha = 0.7; ctx.strokeStyle = '#ff7a2e'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 46, y - 88); ctx.stroke();
    blitGlow(GLOW.orange, x, y, 64, 1);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    rotT(now / 110, x, y);
    ctx.fillStyle = '#5a3a2a'; ctx.strokeStyle = '#ffb35a'; ctx.lineWidth = 2; ctx.beginPath();
    for (let k = 0; k < 7; k++) { const aa = k * TAU / 7, rr = 8 + (k % 2) * 2.5; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(2, -2, 2.6, 0, TAU); ctx.fill();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'lighter';
  }
  // молнии
  for (let i = 0; i < g.bolts.length; i++) {
    const b = g.bolts[i], a = Math.min(1, b.life / 0.12);
    if (Math.random() < 0.5) b.pts = jag(b.A[0], b.A[1], b.B[0], b.B[1]);
    ctx.globalAlpha = a;
    for (const pass of [[7, 'rgba(110,190,255,.55)'], [2.2, '#ffffff']]) {
      ctx.lineWidth = pass[0]; ctx.strokeStyle = pass[1]; ctx.beginPath();
      b.pts.forEach((q, j) => { const x = q[0] - cx, y = q[1] - cy; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
    }
    const e = b.pts[b.pts.length - 1]; blitGlow(GLOW.cyan, e[0] - cx, e[1] - cy, 40, a * 0.8);
  }
}
