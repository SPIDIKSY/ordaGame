/* =====================================================
   СУЩЕСТВА: враги и герой в порядке «кто ниже — тот ближе»,
   свечение элиты и боссов, кружащие лезвия
   ===================================================== */
import { TAU, setGlowScale } from '../gfx.js';
import { SPR } from '../sprites/enemies/index.js';
import { GLOW } from '../sprites/world.js';
import { SLAM_CAST } from '../run/enemies.js';
import { ELITE_MODS } from '../run/elites.js';
import { drawHeroArm } from '../sprites/heroes/index.js';
import { GRACE_FREEZE, GRACE_RAMP } from '../run/state.js';
import { ctx, G, dpr, hx, hy, heroSpr, cx, cy, inView, blitGlow } from './frame.js';

// Враги в кадре по высоте: кто ниже на экране — тот ближе и рисуется поверх.
// Один список на всю игру, а не новый на каждый кадр.
const order = [];
const byY = (a, b) => a.y - b.y;

export function drawActors(now) {
  const g = G, p = g.p;
  // свечение элиты и заморозки
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (!e.elite && !e.T.boss && !e.T.doom && e.slow <= 0) continue;
    const x = e.x - cx, y = e.y - cy; if (!inView(x, y, e.r)) continue;
    // у минибосса свечение цвета его умения, у боссов — золотое
    if (e.elite || e.T.boss) blitGlow(GLOW[e.mod ? ELITE_MODS[e.mod].glow : 'gold'], x, y, e.r * 4, 0.45 + 0.15 * Math.sin(now / 180 + e.ph));
    if (e.T.doom) blitGlow(GLOW.red, x, y, e.r * 4.5, 0.6 + 0.2 * Math.sin(now / 120 + e.ph));
    if (e.slow > 0) blitGlow(GLOW.cyan, x, y, e.r * 3, 0.5);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // враги и герой (сортировка по высоте)
  order.length = 0;
  for (let i = 0; i < g.enemies.length; i++) { const e = g.enemies[i], x = e.x - cx, y = e.y - cy; if (inView(x, y, e.r * 2)) order.push(e); }
  order.sort(byY);
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
    const step = t * e.T.fps * 0.9 + e.ph * 1.6;
    // наземные подпрыгивают на каждом шаге: выше всего между шагами, ниже — в момент шага
    const lift = (e.T.fly ? 4 + Math.sin(t * 4 + e.ph) * 3 : Math.abs(Math.cos(step)) * e.r * 0.12) + windup(e);
    const rot = e.T.fly ? Math.sin(t * 3 + e.ph) * 0.09 : Math.sin(step) * 0.08;
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
    if (e.mod) {
      ctx.font = '700 11px Rubik, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = '#ffd56e';
      const ty = y - lift - e.r - 16;
      ctx.strokeText(ELITE_MODS[e.mod].name, x, ty); ctx.fillText(ELITE_MODS[e.mod].name, x, ty);
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

}

// Замах перед атакой — насколько поднять врага над землёй, чтобы удар читался заранее.
// Титан медленно поднимается (85% каста) и резко падает в момент удара;
// лучник подпрыгивает, натягивая тетиву перед выстрелом.
function windup(e) {
  if (e.T.ab === 'slam' && e.cast > 0) {
    const k = 1 - e.cast / SLAM_CAST;
    return e.r * 0.7 * (k < 0.85 ? k / 0.85 : (1 - k) / 0.15);
  }
  if (e.T.ai === 'ranged' && e.atk < 0.3 && e.atk > 0) return e.r * 0.25 * Math.sin(Math.PI * e.atk / 0.3);
  return 0;
}

// Холст героя для WebGL: 150×170 точек, (ax, ay) — где на нём стоят ноги героя
const HERO_L = { w: 150, h: 170, ax: 75, ay: 112 };
let heroCv = null;
function heroLayer() {
  const w = Math.ceil(HERO_L.w * dpr), h = Math.ceil(HERO_L.h * dpr);
  if (!heroCv || heroCv.width !== w || heroCv.height !== h) {
    heroCv = document.createElement('canvas'); heroCv.width = w; heroCv.height = h; heroCv._glOwn = true;
  }
  return heroCv.getContext('2d');
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
  // на бегу герой пружинит: подлетает между шагами и чуть приседает, когда нога касается земли
  // (два шага на цикл из 4 кадров); в покое — дыхание; при атаке — лёгкое «приседание»
  const up = p.moving ? Math.abs(Math.sin(p.walkT * 9 / 4 * TAU)) : 0, by = y + 18 - up * 2.6;
  const br = (p.moving ? 1 - (1 - up) * 0.045 : 1 + Math.sin(now / 350) * 0.025) * (1 - atkK * 0.04);
  const blink = p.inv > 0 && Math.floor(now / 60) % 2 === 0 ? 0.55 : 1;
  const rot = ((p.moving ? 0.07 : 0) + atkK * 0.06) * p.face;
  const co = Math.cos(rot), si = Math.sin(rot);
  // В WebGL-движке героя рисуем на своём маленьком обычном холсте и отдаём видеокарте
  // картинкой: рука с оружием меняется каждый кадр, а в ней градиенты и свечение
  const x2 = ctx.isGL ? heroLayer() : ctx;
  if (ctx.isGL) { x2.setTransform(1, 0, 0, 1, 0, 0); x2.globalAlpha = 1; x2.clearRect(0, 0, x2.canvas.width, x2.canvas.height); }
  else ctx.globalAlpha = blink;
  const ax = ctx.isGL ? HERO_L.ax : x, ay = ctx.isGL ? HERO_L.ay : by;
  x2.setTransform(dpr * co * p.face, dpr * si * p.face, -dpr * si * br, dpr * co * br, dpr * ax, dpr * ay);
  // рука с оружием и тело рисуются в одних координатах: рукав за телом, оружие поверх
  x2.translate(0, -18);
  setGlowScale(dpr);
  const f = p.moving ? fr / 4 : 0;
  const tip = drawHeroArm(x2, G.hero, {
    atk: p.atk, t: now / 1000,
    st: p.moving ? Math.sin(f * TAU) : 0, bob: p.moving ? Math.abs(Math.cos(f * TAU)) * 1.4 : 0
  }, (c) => c.drawImage(img, -img.w / 2, -img.h / 2, img.w, img.h));
  if (ctx.isGL) {
    x2.canvas._glv = (x2.canvas._glv || 0) + 1;   // картинка обновилась — видеокарте надо взять новую
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = blink;
    ctx.drawImage(x2.canvas, x - HERO_L.ax, by - HERO_L.ay, HERO_L.w, HERO_L.h);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
  if (L.glow) {
    const lx = tip.x, ly = tip.y - 18;
    const gx = x + co * p.face * lx - si * br * ly, gy = by + si * p.face * lx + co * br * ly;
    ctx.globalCompositeOperation = 'lighter';
    blitGlow(GLOW[L.glow], gx, gy, 26 + Math.sin(now / 160) * 3 + tip.fl * 40, 0.5 + tip.fl * 0.45);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  }
  // передышка после выбора: кольцо сжимается к герою, пока мир снова разгоняется
  if (G.grace > 0) {
    const k = Math.min(1, G.grace / (GRACE_FREEZE + GRACE_RAMP));
    ctx.strokeStyle = 'rgba(255,214,110,' + (0.25 + 0.6 * k).toFixed(2) + ')'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 26 + 46 * k, (26 + 46 * k) * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.4 * k).toFixed(2) + ')'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 20 + 30 * k, (20 + 30 * k) * 0.8, 0, 0, TAU); ctx.stroke();
  }
  if (p.hp < p.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - 19, y + 27, 38, 6);
    ctx.fillStyle = '#ff5466'; ctx.fillRect(x - 18, y + 28, 36 * Math.max(0, p.hp / p.maxHp), 4);
  }
}
