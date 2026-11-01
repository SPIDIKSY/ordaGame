/* =====================================================
   ОТРИСОВКА: поляна, враги, герой, снаряды, эффекты
   Вызывается каждый кадр из engine.js
   ===================================================== */
import { TAU, rnd, rg, jag, setGlowScale } from './gfx.js';
import { SPR } from './sprites/enemies.js';
import { GLOW, BEAM, GEMS, HEARTSPR, CHEST, PUS, DECOR, TILE, tile, AXE, KNIFE, FLASK, BOOMER } from './sprites/world.js';
import { drawHeroArm } from './sprites/heroes.js';

let ctx = null, G = null, state = 'menu', W = 0, H = 0, dpr = 1, hx = 0, hy = 0, stick = null, heroSpr = null;
let vig = null, redVig = null;

export function render(o) {
  ctx = o.ctx; G = o.G; state = o.state; W = o.W; H = o.H; dpr = o.dpr; hx = o.hx; hy = o.hy; stick = o.stick; heroSpr = o.heroSpr;
  draw(o.now);
}

// Затемнение по краям экрана (обычное и красное)
export function resizeRender(w, h, heroY) {
  vig = document.createElement('canvas');
  vig.width = Math.max(2, Math.round(w / 2)); vig.height = Math.max(2, Math.round(h / 2));
  const v = vig.getContext('2d'), R = Math.hypot(vig.width, vig.height) * 0.6;
  const g = v.createRadialGradient(vig.width / 2, vig.height * (heroY / h), R * 0.3, vig.width / 2, vig.height * (heroY / h), R);
  g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(1, 'rgba(4,8,12,.66)');
  v.fillStyle = g; v.fillRect(0, 0, vig.width, vig.height);
  redVig = document.createElement('canvas'); redVig.width = vig.width; redVig.height = vig.height;
  const rv = redVig.getContext('2d'), g2 = rv.createRadialGradient(vig.width / 2, vig.height / 2, R * 0.35, vig.width / 2, vig.height / 2, R);
  g2.addColorStop(0, 'rgba(255,30,50,0)'); g2.addColorStop(1, 'rgba(255,30,50,.55)');
  rv.fillStyle = g2; rv.fillRect(0, 0, vig.width, vig.height);
}

const auraR = () => (70 + 12 * G.w.aura) * G.p.area;
function hash(x, y) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

function drawGround(cx, cy) {
  const ox = -(((cx % TILE) + TILE) % TILE), oy = -(((cy % TILE) + TILE) % TILE);
  for (let x = Math.floor(ox); x < W; x += TILE) for (let y = Math.floor(oy); y < H; y += TILE) ctx.drawImage(tile, x, y, TILE + 0.5, TILE + 0.5);
  const cs = 120, ix0 = Math.floor(cx / cs) - 1, iy0 = Math.floor(cy / cs) - 1, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const gx = ix0 + i, gy = iy0 + j, h = hash(gx, gy);
    if (h > 0.17) continue;
    const spr = DECOR[Math.floor(hash(gx + 3, gy - 9) * DECOR.length)];
    const px = gx * cs + hash(gy + 7, gx - 3) * cs - cx, py = gy * cs + hash(gx + 11, gy + 5) * cs - cy;
    ctx.drawImage(spr, px - spr.w / 2, py - spr.h / 2, spr.w, spr.h);
  }
}
function blitGlow(spr, x, y, size, a) { ctx.globalAlpha = a; ctx.drawImage(spr, x - size / 2, y - size / 2, size, size); }
function star4(x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
}
function rotT(a, x, y) { const c = Math.cos(a), s = Math.sin(a); ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * x, dpr * y); }

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (state === 'menu' || !G) {
    drawGround(now * 0.02, now * 0.012);
    if (vig) ctx.drawImage(vig, 0, 0, W, H);
    return;
  }
  const g = G, p = g.p, sk = g.shake > 0 ? g.shake * 26 : 0;
  const cx = p.x - hx + rnd(-sk, sk), cy = p.y - hy + rnd(-sk, sk), m = 80;
  const inView = (x, y, r) => x > -m - r && x < W + m + r && y > -m - r && y < H + m + r;
  drawGround(cx, cy);
  // выжженная земля от метеоритов
  for (let i = 0; i < g.fx.length; i++) {
    const q = g.fx[i]; if (q.type !== 'decal') continue;
    const x = q.x - cx, y = q.y - cy;
    ctx.globalAlpha = Math.min(1, q.life / 1.2) * 0.6;
    ctx.fillStyle = rg(ctx, x, y, 0, x, y, q.r, [[0, 'rgba(18,8,6,.95)'], [0.55, 'rgba(50,22,10,.55)'], [1, 'rgba(0,0,0,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y, q.r, q.r * 0.62, 0, 0, TAU); ctx.fill();
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
      ctx.fillStyle = rg(ctx, x, y, 0, x, y, R, [[0, 'rgba(255,170,60,.55)'], [0.7, 'rgba(255,90,30,.3)'], [1, 'rgba(255,60,20,0)']]);
      ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.55, 0, 0, TAU); ctx.fill();
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
    ctx.fillStyle = rg(ctx, x, y, 0, x, y, R, [[0, 'rgba(130,255,90,.5)'], [0.75, 'rgba(60,200,70,.38)'], [1, 'rgba(40,140,50,0)']]);
    ctx.beginPath(); ctx.ellipse(x, y, R, R * 0.62, 0, 0, TAU); ctx.fill();
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
  // аура под всем
  if (g.w.aura) {
    const R = auraR(), x = p.x - cx, y = p.y - cy;
    ctx.globalCompositeOperation = 'lighter';
    blitGlow(GLOW.gold, x, y, R * 2.3, 0.28 + 0.06 * Math.sin(now / 200));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,224,150,.55)'; ctx.lineWidth = 2; ctx.setLineDash([10, 14]); ctx.lineDashOffset = -now * 0.03;
    ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,232,170,.9)';
    for (let k = 0; k < 8; k++) {
      const a = now / 900 + k * TAU / 8;
      rotT(a, x + Math.cos(a) * R, y + Math.sin(a) * R);
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(3, 0); ctx.lineTo(0, 6); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fill();
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < g.fx.length; i++) {
      const q = g.fx[i]; if (q.type !== 'pulse') continue;
      const k = 1 - q.life / q.T;
      ctx.strokeStyle = 'rgba(255,220,140,' + (0.55 * (1 - k)).toFixed(2) + ')'; ctx.lineWidth = 3;
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
  // предупреждение: титан готовит удар по земле
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (!(e.cast > 0)) continue;
    const x = e.x - cx, y = e.y - cy, k = 1 - e.cast / 1.1;
    ctx.fillStyle = 'rgba(120,190,255,' + (0.08 + 0.2 * k).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x, y, 180, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(170,220,255,.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 8]);
    ctx.beginPath(); ctx.arc(x, y, 180 * (0.2 + 0.8 * k), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
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

  // свечение элиты и заморозки
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (!e.elite && !e.T.boss && !e.T.doom && e.slow <= 0) continue;
    const x = e.x - cx, y = e.y - cy; if (!inView(x, y, e.r)) continue;
    if (e.elite || e.T.boss) blitGlow(GLOW.gold, x, y, e.r * 4, 0.45 + 0.15 * Math.sin(now / 180 + e.ph));
    if (e.T.doom) blitGlow(GLOW.red, x, y, e.r * 4.5, 0.6 + 0.2 * Math.sin(now / 120 + e.ph));
    if (e.slow > 0) blitGlow(GLOW.cyan, x, y, e.r * 3, 0.5);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // враги и герой (сортировка по высоте)
  const order = [];
  for (let i = 0; i < g.enemies.length; i++) { const e = g.enemies[i], x = e.x - cx, y = e.y - cy; if (inView(x, y, e.r * 2)) order.push(e); }
  order.sort((a, b) => a.y - b.y);
  let heroDrawn = false;
  const t = now / 1000;
  for (let i = 0; i <= order.length; i++) {
    const e = order[i];
    if (!heroDrawn && (!e || e.y > p.y)) { drawPlayer(now); heroDrawn = true; }
    if (!e) break;
    const x = e.x - cx, y = e.y - cy;
    const spr = SPR[e.T.key], fi = Math.floor(t * e.T.fps + e.ph) & 3;
    const img = e.flash > 0 ? spr.w[fi] : spr.f[fi];
    const flip = p.x < e.x ? -1 : 1, b = e.born;
    const popK = b < 1 ? 1 - Math.pow(1 - b, 3) * Math.cos(b * 4) : 1;
    const sc = e.scale * popK, sxk = sc * (1 + e.sq * 0.24), syk = sc * (1 - e.sq * 0.2);
    const lift = e.T.fly ? 4 + Math.sin(t * 4 + e.ph) * 3 : 0;
    const rot = e.T.fly ? Math.sin(t * 3 + e.ph) * 0.09 : Math.sin(t * e.T.fps * 0.9 + e.ph * 1.6) * 0.08;
    const co = Math.cos(rot), si = Math.sin(rot);
    if (b < 1) ctx.globalAlpha = Math.min(1, b * 2.5);
    ctx.setTransform(dpr * co * flip * sxk, dpr * si * flip * sxk, -dpr * si * syk, dpr * co * syk, dpr * x, dpr * (y - lift + img.h * e.scale * 0.35));
    ctx.drawImage(img, -img.w / 2, -img.h * 0.85, img.w, img.h);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
    if (e.hp < e.maxHp && (e.r >= 15 || e.elite)) {
      const bw = Math.max(24, e.r * 1.8), by = y - lift - e.r - 12;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - bw / 2 - 1, by - 1, bw + 2, 6);
      ctx.fillStyle = e.elite || e.T.boss ? '#ffc24a' : '#ff5466'; ctx.fillRect(x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 4);
    }
  }

  // лезвия
  for (let i = 0; i < g.bladeN; i++) {
    const a = p.bladeA + i * TAU / g.bladeN, x = p.x + Math.cos(a) * g.bladeR - cx, y = p.y + Math.sin(a) * g.bladeR - cy;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = 'rgba(150,210,255,' + (0.24 - k * 0.05).toFixed(2) + ')'; ctx.lineWidth = 9 - k * 1.8;
      ctx.beginPath(); ctx.arc(p.x - cx, p.y - cy, g.bladeR, a - 0.17 * (k + 1), a - 0.17 * k); ctx.stroke();
    }
    blitGlow(GLOW.cyan, x, y, 34, 0.5);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const c = Math.cos(a * 3), s = Math.sin(a * 3);
    ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * x, dpr * y);
    ctx.fillStyle = '#eef6ff'; ctx.strokeStyle = '#5f86c4'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4, rr = k % 2 ? 4 : 12; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5f86c4'; ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fill();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

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
    ctx.font = (q.big ? '600 ' + Math.round(17 * sp) : '500 ' + Math.round(12 * sp)) + 'px Rubik, system-ui, sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,20,.85)'; ctx.strokeText(q.s, q.x - cx, q.y - cy);
    ctx.fillStyle = q.col; ctx.fillText(q.s, q.x - cx, q.y - cy);
  }
  ctx.globalAlpha = 1;
  if (vig) ctx.drawImage(vig, 0, 0, W, H);

  // новый уровень: столб света
  if (g.lvlFx > 0) {
    const k = g.lvlFx / 0.6, X = p.x - cx, Y = p.y - cy;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.drawImage(BEAM, X - 36, Y - 240, 72, 260);
    blitGlow(GLOW.gold, X, Y, 150 * (1.3 - k * 0.4), Math.min(1, k * 1.5));
    ctx.globalCompositeOperation = 'source-over';
    const ty = Y - 62 - (1 - k) * 34;
    ctx.globalAlpha = Math.min(1, k * 2.2); ctx.textAlign = 'center';
    ctx.font = '400 24px "Russo One", Impact, sans-serif';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(50,25,0,.85)'; ctx.strokeText('Новый уровень!', X, ty);
    ctx.fillStyle = '#ffd56e'; ctx.fillText('Новый уровень!', X, ty);
    ctx.globalAlpha = 1;
  }
  if (g.doom && redVig) { ctx.globalAlpha = 0.4 + 0.15 * Math.sin(now / 300); ctx.drawImage(redVig, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (g.hurtFx > 0 && redVig) { ctx.globalAlpha = Math.min(1, g.hurtFx / 0.4); ctx.drawImage(redVig, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (g.flash > 0) { ctx.fillStyle = 'rgba(255,244,220,' + Math.min(0.7, g.flash * 1.8).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }

  // стрелки к сундукам за краем экрана
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i], x = c.x - cx, y = c.y - cy;
    if (x > 10 && x < W - 10 && y > 10 && y < H - 10) continue;
    const dx = x - hx, dy = y - hy, a = Math.atan2(dy, dx);
    const top = 150, bottom = H - 40, left = 26, right = W - 26;
    let k = Infinity;
    if (dx > 0) k = Math.min(k, (right - hx) / dx); if (dx < 0) k = Math.min(k, (left - hx) / dx);
    if (dy > 0) k = Math.min(k, (bottom - hy) / dy); if (dy < 0) k = Math.min(k, (top - hy) / dy);
    const ax = hx + dx * k, ay = hy + dy * k;
    ctx.globalCompositeOperation = 'lighter'; blitGlow(GLOW.gold, ax, ay, 46, 0.6 + 0.3 * Math.sin(now / 200));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.setTransform(dpr * Math.cos(a), dpr * Math.sin(a), -dpr * Math.sin(a), dpr * Math.cos(a), dpr * ax, dpr * ay);
    ctx.fillStyle = '#ffd56e'; ctx.strokeStyle = '#6b4300'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // джойстик
  if (state === 'play' || state === 'pause') drawStick();
}

function drawPlayer(now) {
  const p = G.p, x = hx, y = hy, L = heroSpr.look;
  if (G.buffs.rage > 0 || G.buffs.haste > 0) {
    ctx.globalCompositeOperation = 'lighter';
    if (G.buffs.rage > 0) blitGlow(GLOW.red, x, y, 100 + Math.sin(now / 110) * 12, 0.6);
    if (G.buffs.haste > 0) blitGlow(GLOW.green, x, y + 10, 74, 0.45);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  const fr = Math.floor(p.walkT * 9) & 3;
  const img = p.moving ? (p.hurt > 0 ? heroSpr.h[fr] : heroSpr.f[fr]) : (p.hurt > 0 ? heroSpr.idleH : heroSpr.idle);
  const atkK = p.atk >= 0 ? Math.sin(Math.PI * p.atk) : 0;
  // дыхание в покое и лёгкое «приседание» при атаке
  const br = (p.moving ? 1 : 1 + Math.sin(now / 350) * 0.025) * (1 - atkK * 0.04);
  if (p.inv > 0 && Math.floor(now / 60) % 2 === 0) ctx.globalAlpha = 0.55;
  const rot = ((p.moving ? 0.07 : 0) + atkK * 0.06) * p.face;
  const co = Math.cos(rot), si = Math.sin(rot);
  ctx.setTransform(dpr * co * p.face, dpr * si * p.face, -dpr * si * br, dpr * co * br, dpr * x, dpr * (y + 18));
  ctx.drawImage(img, -img.w / 2, -img.h / 2 - 18, img.w, img.h);
  // рука с оружием рисуется поверх тела в тех же координатах
  ctx.translate(0, -18);
  setGlowScale(dpr);
  const f = p.moving ? fr / 4 : 0;
  const tip = drawHeroArm(ctx, G.hero, {
    atk: p.atk, t: now / 1000,
    st: p.moving ? Math.sin(f * TAU) : 0, bob: p.moving ? Math.abs(Math.cos(f * TAU)) * 1.4 : 0
  });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
  if (L.glow) {
    const lx = tip.x, ly = tip.y - 18;
    const gx = x + co * p.face * lx - si * br * ly, gy = y + 18 + si * p.face * lx + co * br * ly;
    ctx.globalCompositeOperation = 'lighter';
    blitGlow(GLOW[L.glow], gx, gy, 26 + Math.sin(now / 160) * 3 + tip.fl * 40, 0.5 + tip.fl * 0.45);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  if (p.hp < p.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 19, y + 27, 38, 6);
    ctx.fillStyle = '#ff5466'; ctx.fillRect(x - 18, y + 28, 36 * Math.max(0, p.hp / p.maxHp), 4);
  }
}

function drawStick() {
  const bx = stick.bx, by = stick.by, R = stick.max, on = stick.active;
  ctx.globalAlpha = on ? 1 : 0.75;
  ctx.fillStyle = 'rgba(8,14,18,.45)';
  ctx.beginPath(); ctx.arc(bx, by, R + 14, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(bx, by, R + 14, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(bx, by, R * 0.55, 0, TAU); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, tx = bx + Math.cos(a) * (R + 4), ty = by + Math.sin(a) * (R + 4);
    ctx.beginPath(); ctx.moveTo(tx + Math.cos(a) * 5, ty + Math.sin(a) * 5);
    ctx.lineTo(tx + Math.cos(a + 2.2) * 5, ty + Math.sin(a + 2.2) * 5); ctx.lineTo(tx + Math.cos(a - 2.2) * 5, ty + Math.sin(a - 2.2) * 5);
    ctx.closePath(); ctx.fill();
  }
  const kx = bx + stick.vx * R, ky = by + stick.vy * R;
  const gr = ctx.createRadialGradient(kx - 6, ky - 8, 2, kx, ky, 26);
  if (on) { gr.addColorStop(0, '#fff2c4'); gr.addColorStop(1, '#e6951c'); } else { gr.addColorStop(0, '#f2f5f8'); gr.addColorStop(1, '#8a97a6'); }
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(kx, ky + 3, 25, 0, TAU); ctx.fill();
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(kx, ky, 25, 0, TAU); ctx.fill();
  ctx.strokeStyle = on ? '#7a4a00' : '#4a5563'; ctx.lineWidth = 2; ctx.stroke();
  ctx.globalAlpha = 1;
}
