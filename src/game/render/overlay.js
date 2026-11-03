/* =====================================================
   ПОВЕРХ МИРА: воздух и оттенок местности, затемнение краёв,
   столб света нового уровня, красные вспышки, стрелки к
   сундукам и боссам за краем экрана, джойстик
   ===================================================== */
import { TAU, mk, rg } from '../gfx.js';
import { GLOW, BEAM } from '../sprites/world.js';
import { BIOMES } from '../sprites/biomes.js';
import { ctx, G, state, W, H, dpr, hx, hy, stick, cx, cy, blitGlow } from './frame.js';
import { drawAir, drawTint } from './ground.js';

export let vig = null, redVig = null;

// Затемнение по краям экрана (обычное и красное). Рисуется сразу в полный размер
// экрана в пикселях (scale — их плотность): каждый кадр его надо только скопировать
// 1:1. Раньше оно хранилось вдвое меньше и каждый кадр растягивалось — это стоило
// около 3 мс на кадр там, где браузер рисует холст процессором.
export function resizeRender(w, h, heroY, scale, gl) {
  if (!(w > 0) || !(h > 0)) return;
  // Доля высоты, на которой стоит герой: центр затемнения. Если сюда придёт
  // мусор, createRadialGradient бросает исключение и игра не запускается.
  const fy = Number.isFinite(heroY / h) ? Math.min(1, Math.max(0, heroY / h)) : 0.5;
  vig = document.createElement('canvas');
  // видеокарта растягивает картинку бесплатно и гладко — ей хватит затемнения вчетверо меньше
  const k = (scale > 0 ? scale : 1) * (gl ? 0.25 : 1);
  vig.width = Math.max(2, Math.round(w * k)); vig.height = Math.max(2, Math.round(h * k));
  const v = vig.getContext('2d'), R = Math.hypot(vig.width, vig.height) * 0.6;
  const g = v.createRadialGradient(vig.width / 2, vig.height * fy, R * 0.3, vig.width / 2, vig.height * fy, R);
  g.addColorStop(0, 'rgba(4,8,12,0)'); g.addColorStop(1, 'rgba(4,8,12,.66)');
  v.fillStyle = g; v.fillRect(0, 0, vig.width, vig.height);
  redVig = document.createElement('canvas'); redVig.width = vig.width; redVig.height = vig.height;
  const rv = redVig.getContext('2d'), g2 = rv.createRadialGradient(vig.width / 2, vig.height / 2, R * 0.35, vig.width / 2, vig.height / 2, R);
  g2.addColorStop(0, 'rgba(255,30,50,0)'); g2.addColorStop(1, 'rgba(255,30,50,.55)');
  rv.fillStyle = g2; rv.fillRect(0, 0, vig.width, vig.height);
}

// Шарик джойстика рисуется каждый кадр — держим его готовой картинкой
function knobSprite(on) {
  return mk(54, 54, (x) => {
    x.fillStyle = rg(x, -6, -8, 2, 0, 0, 26, on ? [[0, '#fff2c4'], [1, '#e6951c']] : [[0, '#f2f5f8'], [1, '#8a97a6']]);
    x.beginPath(); x.arc(0, 0, 25, 0, TAU); x.fill();
    x.strokeStyle = on ? '#7a4a00' : '#4a5563'; x.lineWidth = 2; x.stroke();
  });
}
const KNOB = { on: knobSprite(true), off: knobSprite(false) };

export function drawOverlay(now) {
  const g = G, p = g.p;
  drawAir(now, cx, cy, BIOMES[g.biome].air);
  drawTint(g.biome, g.biomePrev, g.biomeK);
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
  // часы вечности: время замерло — экран слегка синеет
  if (g.timeStop > 0) { ctx.fillStyle = 'rgba(120,180,255,' + (0.16 * Math.min(1, g.timeStop / 0.4)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (g.hurtFx > 0 && redVig) { ctx.globalAlpha = Math.min(1, g.hurtFx / 0.4); ctx.drawImage(redVig, 0, 0, W, H); ctx.globalAlpha = 1; }
  if (g.flash > 0) { ctx.fillStyle = 'rgba(255,244,220,' + Math.min(0.7, g.flash * 1.8).toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }

  // стрелки к сундукам и боссам за краем экрана
  const edgePoint = (x, y) => {
    const dx = x - hx, dy = y - hy, a = Math.atan2(dy, dx);
    const top = 150, bottom = H - 40, left = 26, right = W - 26;
    let k = Infinity;
    if (dx > 0) k = Math.min(k, (right - hx) / dx); if (dx < 0) k = Math.min(k, (left - hx) / dx);
    if (dy > 0) k = Math.min(k, (bottom - hy) / dy); if (dy < 0) k = Math.min(k, (top - hy) / dy);
    return { ax: hx + dx * k, ay: hy + dy * k, a };
  };
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i], x = c.x - cx, y = c.y - cy;
    if (x > 10 && x < W - 10 && y > 10 && y < H - 10) continue;
    const { ax, ay, a } = edgePoint(x, y);
    ctx.globalCompositeOperation = 'lighter'; blitGlow(GLOW.gold, ax, ay, 46, 0.6 + 0.3 * Math.sin(now / 200));
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.setTransform(dpr * Math.cos(a), dpr * Math.sin(a), -dpr * Math.sin(a), dpr * Math.cos(a), dpr * ax, dpr * ay);
    ctx.fillStyle = '#ffd56e'; ctx.strokeStyle = '#6b4300'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(11, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (!e.T.boss || e.dead) continue;
    const x = e.x - cx, y = e.y - cy;
    if (x > -e.r && x < W + e.r && y > -e.r && y < H + e.r) continue;
    const { ax, ay, a } = edgePoint(x, y), pulse = 0.5 + 0.5 * Math.sin(now / 160);
    ctx.globalCompositeOperation = 'lighter'; blitGlow(GLOW.red, ax, ay, 64 + pulse * 14, 0.7 + 0.3 * pulse);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // стрелка
    ctx.setTransform(dpr * Math.cos(a), dpr * Math.sin(a), -dpr * Math.sin(a), dpr * Math.cos(a), dpr * ax, dpr * ay);
    ctx.fillStyle = '#ff4a5e'; ctx.strokeStyle = '#4a0612'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(9, -9); ctx.lineTo(12, 0); ctx.lineTo(9, 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // кружок с черепом
    ctx.fillStyle = '#2a0610'; ctx.strokeStyle = '#ff4a5e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ax, ay, 12, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe6ea';
    ctx.beginPath(); ctx.arc(ax, ay - 1.5, 5.6, 0, TAU); ctx.fill(); ctx.fillRect(ax - 3.4, ay + 2, 6.8, 3.6);
    ctx.fillStyle = '#2a0610'; ctx.beginPath(); ctx.arc(ax - 2.2, ay - 1.6, 1.5, 0, TAU); ctx.arc(ax + 2.2, ay - 1.6, 1.5, 0, TAU); ctx.fill();
    // сколько до босса
    const dist = Math.round(Math.hypot(e.x - G.p.x, e.y - G.p.y) / 10);
    ctx.font = '600 11px Rubik, system-ui, sans-serif'; ctx.textAlign = 'center';
    const ty = ay + (ay > H / 2 ? -20 : 26);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(10,12,20,.85)'; ctx.strokeText(dist + ' м', ax, ty);
    ctx.fillStyle = '#ffb0b8'; ctx.fillText(dist + ' м', ax, ty);
  }

  // джойстик
  if (state === 'play' || state === 'pause') drawStick();
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
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(kx, ky + 3, 25, 0, TAU); ctx.fill();
  const kn = on ? KNOB.on : KNOB.off;
  ctx.drawImage(kn, kx - kn.w / 2, ky - kn.h / 2, kn.w, kn.h);
  ctx.globalAlpha = 1;
}
