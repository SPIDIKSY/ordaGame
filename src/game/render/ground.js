/* =====================================================
   ЗЕМЛЯ: тайлы местности, украшения, оттенок света
   и частицы в воздухе (светлячки, туман, песок, снег, искры)
   ===================================================== */
import { TAU } from '../gfx.js';
import { TILE, SOFT, GLOW } from '../sprites/world.js';
import { BIOMES } from '../sprites/biomes.js';
import { ctx, W, H, dpr, blitGlow } from './frame.js';
import { settings, QUALITY } from '../settings.js';

function hash(x, y) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

// Плитка земли нарисована вдвое крупнее (TILE * 2), чтобы на чётких экранах не было
// мыла. Раньше каждый кадр ~24 плитки рисовались с уменьшением, и пересчёт каждого
// пикселя земли занимал половину времени кадра — особенно там, где браузер рисует
// холст процессором (так бывает в Firefox на Windows). Теперь плитка уменьшается
// один раз под плотность пикселей экрана, а дальше кладётся точно по пикселям,
// без пересчёта: это простое копирование, самое дешёвое, что умеет холст.
let fitDpr = 0, fitted = new Map();
function fittedTile(tile) {
  if (fitDpr !== dpr) { fitDpr = dpr; fitted = new Map(); }
  let c = fitted.get(tile);
  if (!c) {
    const px = Math.round(TILE * dpr);
    c = document.createElement('canvas');
    c.width = c.height = px;
    c.getContext('2d').drawImage(tile, 0, 0, px, px);
    fitted.set(tile, c);
  }
  return c;
}

function drawGround(cx, cy, B, alpha) {
  ctx.globalAlpha = alpha;
  const ox = -(((cx % TILE) + TILE) % TILE), oy = -(((cy % TILE) + TILE) % TILE);
  const tile = fittedTile(B.tile), size = tile.width / dpr;
  // начало — на целом пикселе экрана, иначе браузер снова будет пересчитывать каждый пиксель
  const x0 = Math.round(ox * dpr) / dpr, y0 = Math.round(oy * dpr) / dpr;
  for (let x = x0; x < W; x += size) for (let y = y0; y < H; y += size) ctx.drawImage(tile, x, y, size, size);
  const cs = 120, ix0 = Math.floor(cx / cs) - 1, iy0 = Math.floor(cy / cs) - 1, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const gx = ix0 + i, gy = iy0 + j, h = hash(gx, gy);
    if (h > B.density) continue;
    const spr = B.decor[Math.floor(hash(gx + 3, gy - 9) * B.decor.length)];
    const px = gx * cs + hash(gy + 7, gx - 3) * cs - cx, py = gy * cs + hash(gx + 11, gy + 5) * cs - cy;
    ctx.drawImage(spr, px - spr.w / 2, py - spr.h / 2, spr.w, spr.h);
  }
  const fx = QUALITY[settings.quality].ground;
  if (fx > 1) drawShade(cx, cy, alpha);
  if (fx > 0) drawLights(cx, cy, B, alpha);
  drawLandmarks(cx, cy, B, alpha);
  ctx.globalAlpha = 1;
}

// Большие мягкие тени: разбивают повторяющийся рисунок плитки,
// чтобы земля не выглядела обоями с одним и тем же узором.
function drawShade(cx, cy, alpha) {
  const cs = 520, ix0 = Math.floor(cx / cs) - 1, iy0 = Math.floor(cy / cs) - 1, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const gx = ix0 + i, gy = iy0 + j;
    if (hash(gx + 13, gy + 57) > 0.55) continue;
    const size = 520 + hash(gx - 3, gy + 1) * 380;
    const px = gx * cs + hash(gy + 23, gx - 1) * cs - cx, py = gy * cs + hash(gx + 37, gy - 11) * cs - cy;
    blitGlow(SOFT.shade, px, py, size, alpha * (0.18 + hash(gx + 2, gy + 9) * 0.16));
  }
  ctx.globalAlpha = alpha;
}

// Пятна света на земле: лунный свет в лесу, тёплые блики в пустошах и т. п.
// Мягкое свечение готовой картинкой (GLOW), а не градиентом на каждый кадр.
function drawLights(cx, cy, B, alpha) {
  const cs = 420, ix0 = Math.floor(cx / cs) - 1, iy0 = Math.floor(cy / cs) - 1, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const gx = ix0 + i, gy = iy0 + j;
    if (hash(gx - 17, gy + 31) > 0.55) continue;
    const size = 320 + hash(gx + 5, gy + 5) * 260;
    const px = gx * cs + hash(gy - 2, gx + 9) * cs - cx, py = gy * cs + hash(gx - 6, gy - 4) * cs - cy;
    blitGlow(GLOW[B.light], px, py, size, alpha * (0.11 + hash(gx, gy - 7) * 0.1));
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
}

// Крупные ориентиры посреди поляны: редкие валуны, деревья, надгробия того же вида,
// что и на краю. На ограниченной карте по ним понятно, где ты находишься.
// Рядом с точкой старта их нет, чтобы начало боя было на открытом месте.
function drawLandmarks(cx, cy, B, alpha) {
  const cs = 480, ix0 = Math.floor(cx / cs) - 1, iy0 = Math.floor(cy / cs) - 1, nx = Math.ceil(W / cs) + 2, ny = Math.ceil(H / cs) + 2;
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
    const gx = ix0 + i, gy = iy0 + j;
    if (hash(gx + 41, gy - 13) > 0.42) continue;
    const wx = gx * cs + (0.15 + hash(gy + 3, gx + 21) * 0.7) * cs, wy = gy * cs + (0.15 + hash(gx - 8, gy + 27) * 0.7) * cs;
    if (wx * wx + wy * wy < 300 * 300) continue;
    const spr = B.edge[Math.floor(hash(gx - 29, gy + 2) * B.edge.length)], s = 0.75 + hash(gx + 7, gy + 7) * 0.25;
    const w = spr.w * s, h = spr.h * s;
    ctx.drawImage(spr, wx - cx - w / 2, wy - cy - h * 0.8, w, h);
  }
}
// Земля с плавной сменой местности
export function drawWorld(cx, cy, cur, prev, k) {
  if (prev !== null && prev !== undefined && k < 1) { drawGround(cx, cy, BIOMES[prev], 1); drawGround(cx, cy, BIOMES[cur], k * k * (3 - 2 * k)); }
  else drawGround(cx, cy, BIOMES[cur], 1);
}
export function drawTint(cur, prev, k) {
  const one = (B, a) => { if (B.tint && a > 0) { ctx.globalAlpha = a; ctx.fillStyle = B.tint; ctx.fillRect(0, 0, W, H); } };
  if (prev !== null && prev !== undefined && k < 1) { one(BIOMES[prev], 1 - k); one(BIOMES[cur], k); } else one(BIOMES[cur], 1);
  ctx.globalAlpha = 1;
}

/* --- частицы в воздухе: светлячки, туман, песок, снег, искры --- */
const air = [];
let airCamX = 0, airCamY = 0, airCamSet = false, airLast = 0;
function spawnAir(type, anywhere) {
  const q = { type, x: Math.random() * W, y: Math.random() * H, ph: Math.random() * TAU, life: 4 + Math.random() * 6 };
  if (!anywhere) {
    if (type === 'snow') q.y = -10;
    else if (type === 'embers') q.y = H + 10;
    else if (type === 'dust') q.x = -20;
  }
  if (type === 'fog') { q.r = 70 + Math.random() * 90; q.vx = 6 + Math.random() * 10; q.vy = Math.random() * 4 - 2; q.life = 8 + Math.random() * 8; }
  else if (type === 'dust') { q.vx = 130 + Math.random() * 90; q.vy = 10 + Math.random() * 20; q.r = 8 + Math.random() * 12; }
  else if (type === 'snow') { q.vx = 15 + Math.random() * 25; q.vy = 40 + Math.random() * 40; q.r = 0.9 + Math.random() * 1.8; }
  else if (type === 'embers') { q.vx = Math.random() * 20 - 10; q.vy = -(30 + Math.random() * 50); q.r = 0.8 + Math.random() * 1.6; }
  else { q.vx = Math.random() * 16 - 8; q.vy = Math.random() * 16 - 8; q.r = 1.3 + Math.random(); }
  q.age = 0;
  return q;
}
export function drawAir(now, cx, cy, type) {
  const dt = Math.min(0.05, airLast ? (now - airLast) / 1000 : 0); airLast = now;
  // сколько частиц — зависит от местности и от настройки графики (на низкой их нет)
  const N = Math.round((type === 'fog' ? 14 : type === 'dust' ? 26 : type === 'snow' ? 70 : 40) * QUALITY[settings.quality].air);
  if (!N) { air.length = 0; airCamSet = false; return; }
  const dx = airCamSet ? cx - airCamX : 0, dy = airCamSet ? cy - airCamY : 0;
  airCamX = cx; airCamY = cy; airCamSet = true;
  while (air.length < N) air.push(spawnAir(type, true));
  if (air.length > N + 20) air.length = N + 20;
  for (let i = 0; i < air.length; i++) {
    let q = air[i];
    q.age += dt; q.life -= dt;
    q.x += q.vx * dt - dx; q.y += q.vy * dt - dy;
    if (q.type === 'fireflies') { q.vx += Math.sin(now / 700 + q.ph) * 12 * dt; q.vy += Math.cos(now / 900 + q.ph) * 12 * dt; }
    if (q.type === 'embers') q.vx += Math.sin(now / 300 + q.ph) * 30 * dt;
    const m = (q.r || 2) + 30;
    if (q.life <= 0 || q.x < -m - 60 || q.x > W + m + 60 || q.y < -m - 60 || q.y > H + m + 60 || (q.type !== type && i >= N)) {
      q = air[i] = spawnAir(type, q.life > 0);
      continue;
    }
    // плавное появление и исчезновение
    const fade = Math.min(1, q.age / 0.8, Math.max(0, q.life) / 0.8);
    if (q.type === 'fog') {
      ctx.globalAlpha = 0.07 * fade;
      ctx.drawImage(SOFT.fog, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
    } else if (q.type === 'dust') {
      ctx.globalAlpha = 0.28 * fade; ctx.strokeStyle = '#e8cf9a'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.r, q.y - q.r * 0.12); ctx.stroke();
    } else if (q.type === 'snow') {
      ctx.globalAlpha = 0.85 * fade; ctx.fillStyle = '#f4f8ff';
      ctx.beginPath(); ctx.arc(q.x + Math.sin(now / 500 + q.ph) * 4, q.y, q.r, 0, TAU); ctx.fill();
    } else if (q.type === 'embers') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.6 + 0.4 * Math.sin(now / 90 + q.ph)) * fade; ctx.fillStyle = '#ff8a3a';
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const tw = 0.5 + 0.5 * Math.sin(now / 400 + q.ph * 3);
      ctx.globalCompositeOperation = 'lighter';
      blitGlow(GLOW.green, q.x, q.y, 16, 0.35 * tw * fade);
      ctx.globalAlpha = 0.9 * tw * fade; ctx.fillStyle = '#e8ffb0';
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.globalAlpha = 1;
}
