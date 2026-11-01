/* =====================================================
   ДВИЖОК ИГРЫ
   Здесь живёт вся логика: герой, враги, оружие, сундуки,
   уровни. React только показывает экраны и HUD, а игра
   рисуется на canvas (см. render.js).
   ===================================================== */
import { TAU, rnd, jag } from './gfx.js';
import {
  RAR, scaleEff, addEff, effText, ITEMS, MAX_WEAPONS, WMAX, WEAPONS, MAX_RELICS, RMAX, RCOL, RELICS, STATS,
  HEROES, WDEF, SDEF, RDEF, HDEF, TYPES, SPIDER, GHOST, BOSSES, MAXE, DOOM_T, DOOM, WEIGHTS, xpNeed, fmt
} from './data.js';
import { SPR } from './sprites/enemies.js';
import { PUS, PU_W, BUFF_TIME } from './sprites/world.js';
import { HERO_LOOK, getHeroSprites } from './sprites/heroes.js';
import { BIOMES, BIOME_EVERY, HELL } from './sprites/biomes.js';
import { render, resizeRender } from './render.js';
import { ui, hud } from './store.js';
import { api } from '../net/api.js';
import { isLoggedIn, refreshMe } from '../net/account.js';

/* =====================================================
   РАЗМЕРЫ ЭКРАНА, ДЖОЙСТИК, КЛАВИАТУРА
   ===================================================== */
let canvas = null, ctx = null, appEl = null;
let W = 0, H = 0, dpr = 1, hx = 0, hy = 0;
const stick = { id: null, bx: 0, by: 0, vx: 0, vy: 0, active: false, max: 50, zone: 120 };
const keys = new Set();
const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };

function resize() {
  if (!appEl) return;
  W = appEl.clientWidth; H = appEl.clientHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const land = W > H * 1.15;
  hx = W / 2; hy = land ? H * 0.5 : H * 0.42;
  stick.bx = land ? Math.min(150, W * 0.18) : W / 2;
  stick.by = H - (land ? 110 : Math.max(150, H * 0.19));
  ui.set({ hintBottom: H - stick.by + stick.max + 26 });
  resizeRender(W, H, hy);
}

function stickReset() { stick.id = null; stick.active = false; stick.vx = 0; stick.vy = 0; }
function stickSet(px, py) {
  let dx = px - stick.bx, dy = py - stick.by;
  const d = Math.hypot(dx, dy);
  if (d > stick.max) { dx = dx / d * stick.max; dy = dy / d * stick.max; }
  let vx = dx / stick.max, vy = dy / stick.max;
  if (Math.hypot(vx, vy) < 0.14) { vx = 0; vy = 0; }
  stick.vx = vx; stick.vy = vy;
}

let hintTimer = 0;
function showHint() { ui.set({ hint: true }); clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 7000); }
function hideHint() { ui.set({ hint: false }); }

/* =====================================================
   СОСТОЯНИЕ ИГРЫ
   ===================================================== */
let state = 'menu'; // menu | play | levelup | chest | pause | dead
let G = null;
let acceptAt = 0;
let heroSpr = null;

function setState(s) { state = s; ui.set({ screen: s }); }

// Выбранный герой запоминается в браузере
let heroId = (() => { try { return localStorage.getItem('orda-hero') || 'mage'; } catch (_) { return 'mage'; } })();
if (!HDEF[heroId]) heroId = 'mage';

// Все бонусы складываются (а не умножаются), поэтому герой не становится бессмертным
function recalc(p) {
  const b = p.b;
  p.dmg = 14 * Math.max(0.4, 1 + b.dmg);
  p.cdMul = 1 / Math.max(0.5, 1 + b.haste);
  p.speed = p.baseSpeed * Math.max(0.5, 1 + b.speed);
  p.magnet = 84 * Math.max(0.5, 1 + b.magnet);
  p.pspeedMul = Math.max(0.5, 1 + b.pspeed);
  p.rangeMul = Math.max(0.5, 1 + b.range);
  p.maxHp = Math.max(20, p.maxHp);
  p.hp = Math.min(p.hp, p.maxHp);
}
function applyEff(p, eff) {
  for (const k in eff) {
    const v = eff[k];
    if (k === 'dmg' || k === 'haste' || k === 'speed' || k === 'magnet' || k === 'pspeed' || k === 'range') p.b[k] += v;
    else if (k === 'hp') { p.maxHp += v; if (v > 0) p.hp += v; }
    else if (k === 'xp') p.xpMul += v;
    else p[k] += v;
  }
  recalc(p);
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function newGame() {
  const h = HDEF[heroId] || HEROES[0];
  G = {
    t: 0, kills: 0, level: 1, xp: 0, need: xpNeed(1), pending: 0, rerolls: 3, hero: h.id, heroWeapon: h.weapon,
    p: {
      x: 0, y: 0, r: 14, hp: h.hp, maxHp: h.hp, baseSpeed: h.speed, b: { dmg: 0, haste: 0, speed: 0, magnet: 0, pspeed: 0, range: 0 },
      area: 1, dur: 1, amount: 0, regen: 0, crit: 0.05, critDmg: 2, vamp: 0, armor: 0, luck: 0, xpMul: 1, dodge: 0, thorns: 0, revive: 0,
      inv: 0, hurt: 0, face: 1, dirX: 1, dirY: 0, walkT: 0, moving: false, bladeA: 0, webT: 0,
      atk: -1, faceLock: 0, atkDur: (HERO_LOOK[h.id] || HERO_LOOK.mage).atk
    },
    w: { [h.weapon]: 1 }, wOrder: [h.weapon], wt: { [h.weapon]: 0.2 }, r: {}, rOrder: [], st: {}, stOrder: [], inv: {}, invOrder: [], frostA: 0,
    doom: false, doomWarn: false, doomMin: 0, vampBank: 0, eshots: [], bossN: 0,
    enemies: [], shots: [], gems: [], chests: [], parts: [], texts: [], rings: [], bolts: [], meteors: [], puddles: [], flasks: [],
    spawnAcc: 0, nextId: 1, waveT: 25, bossT: 150, eliteT: 45, unlocked: 1,
    pickups: [], buffs: { rage: 0, haste: 0 }, flash: 0, shake: 0, corpses: [], fx: [],
    lvlFx: 0, lvlArm: false, hurtFx: 0, dustT: 0, bladeN: 0, bladeR: 64, bossKills: 0,
    run: { id: null, chain: Promise.resolve(), nextBeat: 15, rejected: null },
    // порядок местностей в этом забеге (Пекло всегда в конце)
    biomeOrder: shuffle([0, 1, 2, 3]), biome: 0, biomePrev: null, biomeK: 1
  };
  G.biome = G.biomeOrder[0];
  applyEff(G.p, h.eff);
  heroSpr = getHeroSprites(h.id);
}

// Анимация атаки рукой (замах мечом, взмах посохом, бросок кинжала)
function heroAttack() {
  const p = G.p;
  if (p.atk < 0 || p.atk > 0.6) p.atk = 0;
  p.faceLock = p.atkDur * 0.8; // смотрим на цель, пока бьём
}

/* --- рост врагов и Волна смерти --- */
function scaling(t) {
  let hp = 1 + t / 150 + Math.pow(t / 240, 2), dmg = 1 + t / 220, spd = 1 + Math.min(t / 700, 0.22);
  if (t > DOOM_T) {
    const k = (t - DOOM_T) / 60;
    hp *= 2 * Math.pow(1.7, k); dmg *= 1.8 * Math.pow(1.45, k); spd *= 1.2 + 0.08 * k;
  }
  return { hp, dmg, spd };
}

/* --- мелочи --- */
let toastN = 0;
function toast(s) { ui.set({ toast: { id: ++toastN, text: s } }); }
function burst(x, y, col, n, spd) {
  for (let i = 0; i < n && G.parts.length < 300; i++) {
    const a = Math.random() * TAU, v = spd * (0.4 + Math.random() * 0.8);
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + Math.random() * 0.3, col, s: 2 + Math.random() * 2.5 });
  }
}
function pop(x, y, s, col, big) { if (G.texts.length < 36) G.texts.push({ x, y, s, col, big, life: 0.6 }); }
const spawnDist = () => Math.hypot(Math.max(hx, W - hx), Math.max(hy, H - hy)) + 40;

/* --- спавн, опыт, урон, смерть --- */
function pickType(t) {
  const w = []; let tot = 0;
  for (let i = 0; i < TYPES.length; i++) {
    const T = TYPES[i];
    if (t < T.from) { w.push(0); continue; }
    const x = Math.max(0.22, Math.min(1, 1.25 - (t - T.from) / 260));
    w.push(x); tot += x;
  }
  let r = Math.random() * tot;
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0 && w[i] > 0) return TYPES[i]; }
  return TYPES[0];
}
function spawnEnemy(T, ang, dist, elite) {
  const g = G, p = g.p, t = g.t;
  const a = ang !== undefined ? ang : Math.random() * TAU;
  const d = dist !== undefined ? dist : spawnDist();
  const S = scaling(t), hpM = S.hp, dmgM = S.dmg, spM = S.spd;
  const k = elite ? 1.35 : 1;
  const hp = T.hp * hpM * (elite ? 7 : 1);
  g.enemies.push({
    id: g.nextId++, T, elite: !!elite, scale: k,
    x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: T.r * k,
    hp, maxHp: hp, spd: T.spd * spM * (0.9 + Math.random() * 0.2) * (elite ? 1.05 : 1),
    dmg: T.dmg * dmgM * (elite ? 1.5 : 1), xp: T.xp * (1 + t / 300) * (elite ? 5 : 1),
    hitCd: 0, flash: 0, bladeCd: 0, slow: 0, kx: 0, ky: 0, ph: Math.random() * 4, dead: false, born: 0, sq: 0, atk: 1 + Math.random() * 1.5, cast: 0, fuse: 0
  });
}

/* --- опыт, урон, смерть --- */
function addXp(v) {
  const g = G;
  g.xp += v * g.p.xpMul;
  while (g.xp >= g.need) {
    g.xp -= g.need; g.level++; g.need = xpNeed(g.level); g.pending++;
    if (g.level % 5 === 0) g.rerolls++;
  }
}
function addGem(x, y, v, type) {
  if (type === 'xp' && G.gems.length > 420) { addXp(v); return; }
  G.gems.push({ x, y, v, type, tier: v < 2.5 ? 0 : v < 9 ? 1 : 2, mag: false, sp: 0, ph: Math.random() * TAU });
}
function dropChest(x, y, kind) {
  G.chests.push({ x, y, kind, t: 0 });
  toast(kind === 'boss' ? 'Босс оставил сундук!' : 'Выпал сундук!');
}
function addFx(f) { if (G.fx.length < 160) G.fx.push(f); }
function rollPickup() { let r = Math.random() * 100; for (const q of PU_W) { r -= q[1]; if (r <= 0) return q[0]; } return 'heal'; }
function addPickup(x, y, kind) { G.pickups.push({ x, y, kind, life: 30, ph: Math.random() * TAU }); }
function usePickup(q) {
  const g = G, p = g.p, D = PUS[q.kind];
  burst(q.x, q.y, D.col, 16, 200);
  g.rings.push({ x: q.x, y: q.y, max: 46, age: 0, life: 0.35, col: '255,255,255' });
  if (q.kind === 'heal') {
    const v = Math.round(p.maxHp * 0.3); p.hp = Math.min(p.maxHp, p.hp + v);
    pop(p.x, p.y - 34, '+' + v, '#7dff9a', true);
    for (let i = 0; i < 10; i++) g.parts.push({ x: p.x + rnd(-14, 14), y: p.y + rnd(-6, 14), vx: rnd(-10, 10), vy: rnd(-90, -40), life: 0.7, col: '#7dff9a', s: rnd(2.5, 4) });
  } else if (q.kind === 'magnet') {
    for (const gm of g.gems) gm.mag = true;
    g.rings.push({ x: p.x, y: p.y, max: 460, age: 0, life: 0.7, col: '90,170,255' });
    toast('Магнит: весь опыт летит к тебе');
  } else if (q.kind === 'bomb') {
    g.flash = 0.4; g.shake = 0.45;
    const cx = p.x - hx, cy = p.y - hy;
    for (const e of g.enemies) {
      if (e.dead) continue;
      const x = e.x - cx, y = e.y - cy;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      if (e.elite || e.T.boss) hitEnemy(e, p.dmg * 12, 0, 0); else hitEnemy(e, e.hp + 1, 0, 0, true, true);
    }
    g.rings.push({ x: p.x, y: p.y, max: Math.max(W, H) * 0.8, age: 0, life: 0.6, col: '255,150,60' });
    g.rings.push({ x: p.x, y: p.y, max: Math.max(W, H) * 0.5, age: 0, life: 0.45, col: '255,240,200' });
    toast('Бомба!');
  } else {
    g.buffs[q.kind] = BUFF_TIME * p.dur;
    toast(D.name + ': ' + (q.kind === 'rage' ? 'двойной урон' : 'бег и атака быстрее') + ' на ' + Math.round(BUFF_TIME * p.dur) + ' сек');
  }
}
function hurtPlayer(d, src, label) {
  const g = G, p = g.p;
  if (g.dmgBy) { const k = label || (src ? src.T.key : '?'); g.dmgBy[k] = (g.dmgBy[k] || 0) + Math.max(d * 0.35, d - p.armor); }
  g.hurtFx = 0.4; g.shake = Math.max(g.shake, 0.12);
  // броня срезает не больше 65% удара
  p.hp -= Math.max(d * 0.35, d - p.armor); p.inv = 0.3; p.hurt = 0.25;
  burst(p.x, p.y, '#ff6b6b', 6, 120);
  if (src && p.thorns > 0) hitEnemy(src, p.thorns * (1 + p.b.dmg), 0, 0, true, true);
  if (p.hp <= 0) {
    if (p.revive >= 1) {
      p.revive -= 1; p.hp = p.maxHp * 0.5; p.inv = 2; g.flash = 0.5; g.shake = 0.4;
      for (const e of g.enemies) {
        if (e.dead || e.elite || e.T.boss) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < 230) hitEnemy(e, e.hp + 1, 0, 0, true, true);
      }
      g.rings.push({ x: p.x, y: p.y, max: 230, age: 0, life: 0.6, col: '255,120,60' });
      burst(p.x, p.y, '#ffb35a', 40, 300);
      toast('Перо феникса: ты воскрес!');
    } else die();
  }
}
function killEnemy(e) {
  const g = G, p = g.p;
  e.dead = true; g.kills++;
  if (e.T.boss) g.bossKills++;
  if (g.corpses.length < 70) g.corpses.push({ x: e.x, y: e.y, img: SPR[e.T.key].w[0], flip: p.x < e.x ? -1 : 1, sc: e.scale, t: 0, life: e.T.boss ? 0.6 : 0.32, fly: !!e.T.fly });
  burst(e.x, e.y, e.T.pc, e.T.boss ? 34 : e.elite ? 18 : 7, e.T.boss ? 270 : 140);
  if (e.T.boss) {
    for (let i = 0; i < 6; i++) addGem(e.x + rnd(-35, 35), e.y + rnd(-35, 35), e.xp / 6, 'xp');
    addPickup(e.x + 26, e.y, 'heal');
    dropChest(e.x, e.y, 'boss');
  } else if (e.elite) {
    addGem(e.x + 10, e.y, e.xp, 'xp');
    dropChest(e.x - 6, e.y, 'elite');
  } else {
    addGem(e.x, e.y, e.xp, 'xp');
    if (e.T.split) for (let i = 0; i < 3; i++) spawnAt(TYPES[0], e.x + rnd(-16, 16), e.y + rnd(-16, 16));
    if (Math.random() < 0.025 * (1 + p.luck * 0.5) && g.pickups.length < 6) addPickup(e.x + 8, e.y, rollPickup());
    if (Math.random() < 0.0025 * (1 + p.luck) && g.chests.length < 4) dropChest(e.x, e.y, 'normal');
  }
  // вампиризм лечит не быстрее «копилки», которая медленно наполняется
  if (p.vamp > 0 && g.vampBank > 0) { const h = Math.min(p.vamp, g.vampBank); g.vampBank -= h; p.hp = Math.min(p.maxHp, p.hp + h); }
}
// Крит считается здесь, для любого оружия
function hitEnemy(e, d, kx, ky, quiet, noCrit) {
  if (e.dead) return;
  let crit = false;
  if (!noCrit && Math.random() < G.p.crit) { crit = true; d *= G.p.critDmg; }
  if (G.buffs.rage > 0) d *= 2;
  if (e.T.armored) d *= 0.6;
  e.hp -= d; e.flash = 0.09; e.sq = 1; e.kx += kx || 0; e.ky += ky || 0;
  if (!quiet || crit) pop(e.x, e.y - e.r, String(Math.round(d)), crit ? '#ffd45e' : (G.buffs.rage > 0 ? '#ffb07a' : '#ffffff'), crit);
  if (e.hp <= 0) killEnemy(e);
}

/* =====================================================
   ОРУЖИЕ
   ===================================================== */
const cdK = () => G.p.cdMul * (G.buffs.haste > 0 ? 0.6 : 1);
const auraR = () => (70 + 12 * G.w.aura) * G.p.area;
const TRAIL = { bolt: 0.5, frost: 0.5, knife: 0.25, axe: 0, fire: 0.9, wisp: 0.7, boom: 0.15 };
const TRAILC = { bolt: '#ffc46a', frost: '#bdf0ff', knife: '#e8eeff', axe: '#ffffff', fire: '#ff8a3a', wisp: '#c9a0ff', boom: '#ffd27a' };
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function nearest(x, y, range) {
  let best = null, bd = range * range;
  for (let i = 0; i < G.enemies.length; i++) {
    const e = G.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function enemiesWithin(range) {
  const p = G.p, out = [];
  for (let i = 0; i < G.enemies.length; i++) { const e = G.enemies[i]; if (!e.dead && Math.hypot(e.x - p.x, e.y - p.y) < range) out.push(e); }
  return out;
}
// Целимся с упреждением: туда, где враг будет, когда снаряд долетит
function leadAim(ox, oy, t, speed) {
  const p = G.p, sp = t.spd * (t.slow > 0 ? 0.5 : 1), td = Math.hypot(p.x - t.x, p.y - t.y) || 1;
  const vx = (p.x - t.x) / td * sp, vy = (p.y - t.y) / td * sp;
  let tx = t.x, ty = t.y;
  for (let k = 0; k < 3; k++) { const tt = Math.hypot(tx - ox, ty - oy) / speed; tx = t.x + vx * tt; ty = t.y + vy * tt; }
  return Math.atan2(ty - oy, tx - ox);
}
function shoot(o) { if (G.shots.length < 700) { o.hit = []; G.shots.push(o); } }
function fireStaff(target, l) {
  const g = G, p = g.p;
  const base = Math.atan2(target.y - p.y, target.x - p.x);
  p.face = Math.cos(base) >= 0 ? 1 : -1;
  const ox = p.x + 12 * p.face, oy = p.y - 15;
  burst(ox, oy, '#ffd27a', 3, 110);
  const n = 1 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0) + (l >= 7 ? 1 : 0) + p.amount;
  const sp = 460 * p.pspeedMul, aim = leadAim(ox, oy, target, sp);
  const dmg = p.dmg * (l >= 3 ? 1.3 : 1), pierce = (l >= 4 ? 1 : 0) + (l >= 7 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const a = aim + (i - (n - 1) / 2) * 0.15;
    shoot({ kind: 'bolt', x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, pierce, life: 380 * p.rangeMul / sp + 0.15, r: 7 });
  }
}
function castChain(l) {
  const g = G, p = g.p, cand = enemiesWithin(380);
  if (!cand.length) return false;
  let cur = cand[Math.floor(Math.random() * cand.length)];
  const hit = [cur.id], dmg = p.dmg * (1.45 + 0.4 * l), jumps = 3 + l + p.amount;
  let px = p.x + 12 * p.face, py = p.y - 15;
  for (let j = 0; j <= jumps && cur; j++) {
    g.bolts.push({ pts: jag(px, py, cur.x, cur.y), A: [px, py], B: [cur.x, cur.y], life: 0.24 });
    hitEnemy(cur, dmg, 0, 0);
    burst(cur.x, cur.y, '#bfe9ff', 4, 120);
    px = cur.x; py = cur.y;
    let best = null, bd = 170 * 170;
    for (let i = 0; i < g.enemies.length; i++) {
      const e = g.enemies[i]; if (e.dead || hit.indexOf(e.id) >= 0) continue;
      const dx = e.x - px, dy = e.y - py, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = e; }
    }
    cur = best; if (cur) hit.push(cur.id);
  }
  return true;
}
function explode(x, y, r, dmg) {
  const g = G;
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i]; if (e.dead) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
    if (d < r + e.r) hitEnemy(e, dmg, dx / d * 220, dy / d * 220);
  }
  g.rings.push({ x, y, max: r, age: 0, life: 0.4, col: '255,150,60' });
  burst(x, y, '#ffb35a', 14, 220); burst(x, y, '#ff6a2e', 8, 150);
  addFx({ type: 'decal', x, y, r: r * 0.6, life: 1.6, T: 1.6 });
  g.shake = Math.max(g.shake, 0.06);
}

/* =====================================================
   ОРУЖИЕ
   ===================================================== */
function updateWeapons(dt) {
  const g = G, p = g.p, A = p.amount;
  for (let wi = 0; wi < g.wOrder.length; wi++) {
    const id = g.wOrder[wi], l = g.w[id];
    if (id === 'blades' || id === 'aura' || id === 'trail') continue;
    g.wt[id] = (g.wt[id] || 0) - dt;
    if (g.wt[id] > 0) continue;
    // Если выстрелило «родное» оружие героя — играем анимацию атаки рукой
    if (id === g.heroWeapon) {
      const sig = g.shots.length + g.fx.length + g.flasks.length;
      fireWeapon(id, l);
      if (g.shots.length + g.fx.length + g.flasks.length !== sig) heroAttack();
    } else fireWeapon(id, l);
  }
  updateZoneWeapons(dt);
}

// Выстрел одного оружия
function fireWeapon(id, l) {
  const g = G, p = g.p, A = p.amount;
  {
    if (id === 'staff') {
      const t = nearest(p.x, p.y, 380 * p.rangeMul);
      if (t) { fireStaff(t, l); g.wt[id] = 0.55 * (l >= 6 ? 0.8 : 1) * cdK(); } else g.wt[id] = 0.05;
    } else if (id === 'nova') {
      g.wt[id] = Math.max(2, 4.4 - 0.4 * l) * cdK();
      const rad = (100 + 14 * l) * p.area, d = p.dmg * (1.5 + 0.55 * l);
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i]; if (e.dead) continue;
        const dx = e.x - p.x, dy = e.y - p.y, dd = Math.hypot(dx, dy) || 1;
        if (dd < rad + e.r) hitEnemy(e, d, dx / dd * 320, dy / dd * 320);
      }
      g.rings.push({ x: p.x, y: p.y, max: rad, age: 0, life: 0.45, col: '255,194,74' });
      g.rings.push({ x: p.x, y: p.y, max: rad * 0.65, age: 0, life: 0.3, col: '255,255,255' });
      for (let k = 0; k < 18; k++) { const a = k * TAU / 18; g.parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * rad * 2.2, vy: Math.sin(a) * rad * 2.2, life: 0.35, col: '#ffd27a', s: 3 }); }
    } else if (id === 'chain') {
      g.wt[id] = castChain(l) ? Math.max(0.8, 1.9 - 0.16 * (l - 1)) * cdK() : 0.2;
    } else if (id === 'meteor') {
      const cand = enemiesWithin(Math.max(W, H) * 0.6);
      if (!cand.length) { g.wt[id] = 0.3; return; }
      g.wt[id] = Math.max(1.6, 3.6 - 0.3 * l) * cdK();
      const n = 1 + Math.floor(l / 2) + A;
      for (let i = 0; i < n; i++) {
        const e = cand[Math.floor(Math.random() * cand.length)], T = 0.75 + i * 0.12;
        g.meteors.push({ x: e.x + rnd(-20, 20), y: e.y + rnd(-20, 20), t: T, T, r: (70 + 8 * l) * p.area, dmg: p.dmg * (3 + l) });
      }
    } else if (id === 'frost') {
      g.wt[id] = Math.max(1.1, 2.2 - 0.18 * l) * cdK();
      const n = 6 + 2 * l + 2 * A, sp = 360 * p.pspeedMul; g.frostA += 0.37;
      for (let i = 0; i < n; i++) {
        const a = g.frostA + i * TAU / n;
        shoot({ kind: 'frost', x: p.x, y: p.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: p.dmg * (0.7 + 0.26 * l), pierce: 1 + l, life: 0.95, r: 7 });
      }
    } else if (id === 'axe') {
      g.wt[id] = Math.max(0.9, 1.9 - 0.14 * l) * cdK();
      const n = 1 + Math.floor(l / 3) + A, size = Math.sqrt(p.area);
      for (let i = 0; i < n; i++) {
        shoot({ kind: 'axe', x: p.x, y: p.y - 10, vx: p.face * 50 + (i - (n - 1) / 2) * 110 + rnd(-25, 25), vy: -(470 + rnd(0, 70)) * Math.sqrt(p.pspeedMul),
          grav: 950, rot: 0, spin: p.face * 13, size, dmg: p.dmg * (2.2 + 0.45 * l), pierce: 999, life: 1.9, r: 12 * size });
      }
    } else if (id === 'knife') {
      g.wt[id] = Math.max(0.3, 0.95 - 0.08 * l) * cdK();
      const n = 1 + Math.floor(l / 2) + A, sp = 650 * p.pspeedMul;
      let dx = p.dirX, dy = p.dirY;
      // стоя на месте — кидаем в ближайшего врага, на бегу — куда бежим
      if (!p.moving) { const t = nearest(p.x, p.y, 420); if (t) { const a = Math.atan2(t.y - p.y, t.x - p.x); dx = Math.cos(a); dy = Math.sin(a); p.face = dx >= 0 ? 1 : -1; } }
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 9;
        shoot({ kind: 'knife', x: p.x - dy * off, y: p.y - 4 + dx * off, vx: dx * sp, vy: dy * sp, dmg: p.dmg * (0.9 + 0.22 * l), pierce: Math.floor(l / 3), life: 0.7 * p.rangeMul, r: 6 });
      }
    } else if (id === 'fireball') {
      const cand = enemiesWithin(420);
      if (!cand.length) { g.wt[id] = 0.2; return; }
      g.wt[id] = Math.max(1.2, 2.7 - 0.2 * l) * cdK();
      const n = 1 + Math.floor(l / 3) + A, sp = 260 * p.pspeedMul;
      for (let i = 0; i < n; i++) {
        const t = cand[Math.floor(Math.random() * cand.length)], a = leadAim(p.x, p.y - 8, t, sp) + rnd(-0.08, 0.08);
        shoot({ kind: 'fire', x: p.x, y: p.y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: p.dmg * (2.1 + 0.55 * l), boom: (55 + 8 * l) * p.area, pierce: 0, life: 2.2, r: 10 });
      }
    } else if (id === 'puddle') {
      g.wt[id] = Math.max(1.8, 3.4 - 0.24 * l) * cdK();
      const n = 1 + Math.floor(l / 3) + A, cand = enemiesWithin(320);
      for (let i = 0; i < n; i++) {
        let tx, ty;
        if (cand.length) { const e = cand[Math.floor(Math.random() * cand.length)]; tx = e.x; ty = e.y; }
        else { const a = Math.random() * TAU; tx = p.x + Math.cos(a) * 110; ty = p.y + Math.sin(a) * 110; }
        g.flasks.push({ sx: p.x, sy: p.y - 10, tx, ty, t: 0, T: 0.5 + i * 0.08, r: (52 + 7 * l) * p.area, life: (2.6 + 0.3 * l) * p.dur, dmg: p.dmg * (0.75 + 0.18 * l) });
      }
    } else if (id === 'whip') {
      g.wt[id] = (l >= 6 ? 0.95 : 1.2) * cdK();
      const dmgF = [1.9, 1.9, 2.5, 2.5, 3.2, 3.2, 4.4][l - 1], len = 150 * p.area * (l >= 4 ? 1.3 : 1), hh = 36 * Math.sqrt(p.area);
      // меч бьёт в сторону ближайшего врага; если рядом никого — не машет впустую
      const tgt = nearest(p.x, p.y, len + 60);
      if (!tgt) { g.wt[id] = 0.1; return; }
      const front = tgt.x >= p.x ? 1 : -1, aimY = Math.max(-30, Math.min(30, tgt.y - p.y));
      p.face = front;
      const sides = l >= 2 ? 2 : 1, n = 1 + A;
      for (let k = 0; k < sides; k++) {
        const dir = k === 0 ? front : -front;
        for (let j = 0; j < n; j++) {
          const oy = (j - (n - 1) / 2) * hh * 0.9 + (k === 0 ? aimY : 0), cx0 = p.x + dir * len / 2, cy0 = p.y - 4 + oy;
          for (let q = 0; q < g.enemies.length; q++) {
            const e = g.enemies[q]; if (e.dead) continue;
            if (Math.abs(e.x - cx0) < len / 2 + e.r && Math.abs(e.y - cy0) < hh / 2 + e.r) hitEnemy(e, p.dmg * dmgF, dir * 140, 0);
          }
          addFx({ type: 'slash', x: p.x, y: p.y - 4 + oy, dir, len, hh, life: 0.22, T: 0.22 });
        }
      }
    } else if (id === 'boomer') {
      const t0 = nearest(p.x, p.y, 420);
      g.wt[id] = Math.max(1.0, 2.0 - 0.14 * l) * cdK();
      const n = 1 + Math.floor(l / 3) + A, v0 = 520 * p.pspeedMul * (l >= 4 ? 1.2 : 1), size = Math.sqrt(p.area);
      const base = t0 ? Math.atan2(t0.y - p.y, t0.x - p.x) : Math.atan2(p.dirY, p.dirX);
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n - 1) / 2) * 0.35;
        shoot({ kind: 'boom', x: p.x, y: p.y - 6, dx: Math.cos(a), dy: Math.sin(a), v: v0, vx: 0, vy: 0, back: false, rot: 0,
          dmg: p.dmg * (1.5 + 0.35 * l), pierce: 999, life: 4, r: 12 * size, size });
      }
    } else if (id === 'laser') {
      const cand = enemiesWithin(450 * p.rangeMul);
      if (!cand.length) { g.wt[id] = 0.2; return; }
      g.wt[id] = Math.max(1.4, 3.0 - 0.22 * l) * cdK() * (l >= 6 ? 0.85 : 1);
      const n = 1 + (l >= 4 ? 1 : 0) + (l >= 7 ? 1 : 0) + A, len = 480 * p.rangeMul;
      const w = (14 + (l >= 2 ? 6 : 0) + (l >= 6 ? 6 : 0)) * p.area, d = p.dmg * (2 + 0.5 * l);
      cand.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      for (let i = 0; i < n; i++) {
        const t = cand[i % cand.length], a = Math.atan2(t.y - p.y, t.x - p.x) + (i >= cand.length ? i * 0.5 : 0);
        const ox = p.x + Math.cos(a) * 14, oy = p.y - 8 + Math.sin(a) * 14, ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
        for (let q = 0; q < g.enemies.length; q++) {
          const e = g.enemies[q]; if (e.dead) continue;
          if (segDist(e.x, e.y, ox, oy, ex, ey) < w / 2 + e.r) hitEnemy(e, d, Math.cos(a) * 80, Math.sin(a) * 80);
        }
        addFx({ type: 'beam', x: ox, y: oy, x2: ex, y2: ey, w, life: 0.35, T: 0.35 });
      }
    } else if (id === 'spikes') {
      const cand = enemiesWithin(380);
      if (!cand.length) { g.wt[id] = 0.25; return; }
      g.wt[id] = Math.max(1.2, 2.6 - 0.18 * l) * cdK() * (l >= 7 ? 0.85 : 1);
      const n = [3, 4, 4, 5, 5, 6, 6][l - 1] + A, R = 34 * p.area * (l >= 5 ? 1.25 : 1), d = p.dmg * (1.8 + 0.45 * l);
      for (let i = 0; i < n; i++) {
        const t = cand[Math.floor(Math.random() * cand.length)], sx = t.x + rnd(-10, 10), sy = t.y + rnd(-6, 6);
        addFx({ type: 'spike', x: sx, y: sy, r: R, life: 0.55, T: 0.55 });
        for (let q = 0; q < g.enemies.length; q++) {
          const e = g.enemies[q]; if (e.dead) continue;
          if (Math.hypot(e.x - sx, e.y - sy) < R + e.r) { hitEnemy(e, d, 0, 0); e.slow = Math.max(e.slow, 0.6); }
        }
        for (let k = 0; k < 3; k++) addFx({ type: 'dust', x: sx + rnd(-R / 2, R / 2), y: sy + rnd(-4, 6), vx: rnd(-25, 25), vy: rnd(-30, -10), life: 0.5, T: 0.5, r: rnd(4, 7), col: '120,105,90' });
      }
    } else if (id === 'wisp') {
      g.wt[id] = Math.max(0.9, 1.8 - 0.13 * l) * cdK();
      const n = 3 + Math.floor(l / 2) + A, sp = 300 * p.pspeedMul;
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n + rnd(-0.3, 0.3);
        shoot({ kind: 'wisp', x: p.x, y: p.y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, spd: sp, dmg: p.dmg * (1.3 + 0.32 * l), pierce: 1, life: 3.2, r: 9, tgt: null });
      }
    }
  }
}

// Оружие, которое действует постоянно: след, лезвия, аура, метеориты, лужи
function updateZoneWeapons(dt) {
  const g = G, p = g.p, A = p.amount;
  // огненный след
  if (g.w.trail) {
    const l = g.w.trail;
    g.wt.trail = (g.wt.trail || 0) - dt;
    if (g.wt.trail <= 0 && p.moving) {
      g.wt.trail = 0.16;
      const life = (1.6 + (l >= 2 ? 0.6 : 0) + (l >= 6 ? 0.6 : 0)) * p.dur;
      g.puddles.push({ kind: 'fire', x: p.x + rnd(-4, 4), y: p.y + 12, r: (24 + (l >= 4 ? 8 : 0) + (l >= 7 ? 6 : 0) + A * 4) * p.area,
        life, T: life, tick: 0, dmg: p.dmg * (0.35 + 0.12 * l + (l >= 3 ? 0.1 : 0)) });
    }
  }

  // круговые лезвия
  if (g.w.blades) {
    const l = g.w.blades, n = [1, 2, 2, 3, 3, 4, 5][l - 1] + A, R = 54 + 10 * p.area;
    const d = p.dmg * [0.9, 0.9, 1.1, 1.1, 1.35, 1.35, 1.65][l - 1];
    g.bladeN = n; g.bladeR = R; p.bladeA += (3.2 + 0.15 * l) * dt;
    for (let i = 0; i < n; i++) {
      const a = p.bladeA + i * TAU / n, bx = p.x + Math.cos(a) * R, by = p.y + Math.sin(a) * R;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead || e.bladeCd > 0) continue;
        const dx = e.x - bx, dy = e.y - by, rr = e.r + 10;
        if (dx * dx + dy * dy < rr * rr) { e.bladeCd = 0.3; hitEnemy(e, d, Math.cos(a) * 60, Math.sin(a) * 60); }
      }
    }
  } else g.bladeN = 0;

  // святая аура
  if (g.w.aura) {
    g.wt.aura = (g.wt.aura || 0) - dt;
    if (g.wt.aura <= 0) {
      g.wt.aura = 0.35;
      addFx({ type: 'pulse', life: 0.5, T: 0.5 });
      const R = auraR(), d = p.dmg * (0.3 + 0.15 * g.w.aura);
      let touched = 0;
      for (let i = 0; i < g.enemies.length; i++) {
        const e = g.enemies[i]; if (e.dead) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < R + e.r) { hitEnemy(e, d, 0, 0, true); e.slow = Math.max(e.slow, 0.45); touched++; }
      }
      // Кот-сан отхлёбывает пиво, когда кого-то задел
      g.auraN = (g.auraN || 0) + 1;
      if (touched && g.heroWeapon === 'aura' && g.auraN % 5 === 0) heroAttack();
    }
  }

  // метеориты
  for (let i = 0; i < g.meteors.length; i++) {
    const m = g.meteors[i];
    m.t -= dt;
    if (m.t > 0 && g.parts.length < 260) {
      const k = 1 - m.t / m.T;
      g.parts.push({ x: m.x + (1 - k) * 220 + rnd(-5, 5), y: m.y - (1 - k) * 420 + rnd(-5, 5), vx: rnd(10, 50), vy: rnd(-70, -20), life: 0.45, col: Math.random() < 0.5 ? '#ffb35a' : '#ff6a2e', s: rnd(2, 4.5) });
    }
    if (m.t <= 0 && !m.done) {
      m.done = true;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead) continue;
        const dx = e.x - m.x, dy = e.y - m.y, d = Math.hypot(dx, dy) || 1;
        if (d < m.r + e.r) hitEnemy(e, m.dmg, dx / d * 260, dy / d * 260);
      }
      g.rings.push({ x: m.x, y: m.y, max: m.r, age: 0, life: 0.45, col: '255,140,60' });
      burst(m.x, m.y, '#ffb35a', 22, 260); burst(m.x, m.y, '#ff6a2e', 12, 180);
      addFx({ type: 'decal', x: m.x, y: m.y, r: m.r * 0.8, life: 3, T: 3 });
      for (let k = 0; k < 8; k++) addFx({ type: 'dust', x: m.x + rnd(-m.r * 0.4, m.r * 0.4), y: m.y + rnd(-m.r * 0.3, m.r * 0.3), vx: rnd(-30, 30), vy: rnd(-50, -15), life: 0.9, T: 0.9, r: rnd(8, 14), col: '80,66,62' });
      g.shake = Math.max(g.shake, 0.15);
    }
  }
  g.meteors = g.meteors.filter((m) => !m.done);

  // ядовитые флаконы и лужи
  for (let i = 0; i < g.flasks.length; i++) {
    const f = g.flasks[i]; f.t += dt;
    if (f.t >= f.T && !f.done) {
      f.done = true;
      g.puddles.push({ x: f.tx, y: f.ty, r: f.r, life: f.life, T: f.life, tick: 0, dmg: f.dmg });
      burst(f.tx, f.ty, '#9dff6a', 12, 160); burst(f.tx, f.ty, '#e6ffe0', 5, 100);
      g.rings.push({ x: f.tx, y: f.ty, max: f.r, age: 0, life: 0.35, col: '150,255,110' });
    }
  }
  g.flasks = g.flasks.filter((f) => !f.done);
  for (let i = 0; i < g.puddles.length; i++) {
    const q = g.puddles[i];
    q.life -= dt; q.tick -= dt;
    if (q.tick <= 0) {
      const fire = q.kind === 'fire';
      q.tick = fire ? 0.3 : 0.4;
      for (let j = 0; j < g.enemies.length; j++) {
        const e = g.enemies[j]; if (e.dead) continue;
        const dx = e.x - q.x, dy = (e.y - q.y) / (fire ? 0.55 : 0.62), rr = q.r + e.r;
        if (dx * dx + dy * dy < rr * rr) { hitEnemy(e, q.dmg, 0, 0, true); if (!fire) e.slow = Math.max(e.slow, 0.45); }
      }
    }
  }
  g.puddles = g.puddles.filter((q) => q.life > 0);
}

/* --- поведение особых врагов и атаки боссов --- */
function spawnAt(T, x, y) {
  spawnEnemy(T, 0, 0);
  const e = G.enemies[G.enemies.length - 1]; e.x = x; e.y = y; e.born = 0.3;
  return e;
}
function eShoot(e, a, sp, kind) {
  if (G.eshots.length < 220) G.eshots.push({ x: e.x, y: e.y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind, r: kind === 'orb' ? 8 : 6, dmg: e.dmg * (kind === 'arrow' ? 0.7 : 0.55), life: 4 });
}
// Пороховой бес: радиус взрыва и сколько секунд горит фитиль
export const IMP_R = 72, IMP_FUSE = 0.9;
function impBoom(e) {
  const g = G, p = g.p, R = IMP_R;
  if (Math.hypot(p.x - e.x, p.y - e.y) < R + p.r && p.inv <= 0) hurtPlayer(e.dmg * 1.15, null, 'imp-boom');
  g.rings.push({ x: e.x, y: e.y, max: R, age: 0, life: 0.4, col: '255,120,60' });
  burst(e.x, e.y, '#ffb35a', 20, 260); burst(e.x, e.y, '#ff4a2e', 10, 180);
  addFx({ type: 'decal', x: e.x, y: e.y, r: 50, life: 1.5, T: 1.5 });
  g.shake = Math.max(g.shake, 0.12);
  if (!e.dead) killEnemy(e);
}
// Возвращает множитель скорости; может задать своё направление через e.mvx / e.mvy
function enemyAI(e, d, mx, my, dt) {
  const g = G, p = g.p, T = e.T;
  e.atk -= dt;
  switch (T.ai || T.ab) {
    case 'zigzag': { const s = Math.sin(g.t * 6 + e.ph * 3) * 0.9; e.mvx = mx - my * s; e.mvy = my + mx * s; return 1; }
    case 'ranged':
      if (e.atk <= 0 && d < 430) { e.atk = 2.4; eShoot(e, Math.atan2(p.y - e.y, p.x - e.x), 280, 'arrow'); }
      if (d < 200) { e.mvx = -mx; e.mvy = -my; return 0.8; }
      if (d < 270) { e.mvx = -my; e.mvy = mx; return 0.6; }
      return 1;
    case 'bomber':
      if (e.fuse > 0) { e.fuse -= dt; if (Math.floor(e.fuse * 14) % 2 === 0) e.flash = 0.05; if (e.fuse <= 0) impBoom(e); return 0; }
      if (d < 70) { e.fuse = IMP_FUSE; return 0; }
      return 1;
    case 'blink':
      if (e.atk <= 0 && d > 150 && d < 650) {
        e.atk = 3.2; burst(e.x, e.y, '#b77cff', 10, 140);
        const k = (d - 95) / d; e.x += (p.x - e.x) * k; e.y += (p.y - e.y) * k;
        burst(e.x, e.y, '#d9b8ff', 12, 160); e.born = 0.4;
      }
      return 1;
    case 'summon':
      if (e.atk <= 0) {
        e.atk = 4;
        for (let i = 0; i < 3; i++) spawnAt(TYPES[0], e.x + rnd(-45, 45), e.y + rnd(-45, 45));
        g.rings.push({ x: e.x, y: e.y, max: 80, age: 0, life: 0.4, col: '200,140,255' });
      }
      return 1;
    case 'slam':
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) {
          const R = 180;
          if (Math.hypot(p.x - e.x, p.y - e.y) < R && p.inv <= 0) hurtPlayer(e.dmg, null, 'slam');
          g.rings.push({ x: e.x, y: e.y, max: R, age: 0, life: 0.5, col: '160,210,255' });
          g.rings.push({ x: e.x, y: e.y, max: R * 0.6, age: 0, life: 0.35, col: '255,255,255' });
          burst(e.x, e.y, '#bfe6ff', 30, 300);
          addFx({ type: 'decal', x: e.x, y: e.y, r: 120, life: 2, T: 2 });
          g.shake = Math.max(g.shake, 0.35);
        }
        return 0;
      }
      if (e.atk <= 0 && d < 420) { e.atk = 5; e.cast = 1.1; }
      return 1;
    case 'brood':
      if (e.atk <= 0) {
        e.atk = 3.2;
        if (Math.random() < 0.5) { for (let i = 0; i < 3; i++) spawnAt(SPIDER, e.x + rnd(-30, 30), e.y + rnd(-30, 30)); }
        else { const a = Math.atan2(p.y - e.y, p.x - e.x); for (let i = -2; i <= 2; i++) eShoot(e, a + i * 0.22, 220, 'web'); }
      }
      return 1;
    case 'bullets':
      if (e.atk <= 0) {
        e.atk = 2.8; e.wave = (e.wave || 0) + 1;
        if (e.wave % 3 === 0) { for (let i = 0; i < 4; i++) spawnAt(GHOST, e.x + rnd(-60, 60), e.y + rnd(-60, 60)); }
        else { const n = 14, off = Math.random() * TAU; for (let i = 0; i < n; i++) eShoot(e, off + i * TAU / n, 170, 'orb'); }
      }
      return 1;
  }
  return 1;
}

/* --- раздвигаем врагов, чтобы не слипались --- */
const sgrid = new Map();
function separate(dt) {
  const E = G.enemies, cs = 40;
  sgrid.clear();
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; e.cx = Math.floor(e.x / cs); e.cy = Math.floor(e.y / cs);
    const k = e.cx * 100003 + e.cy, a = sgrid.get(k);
    if (a) a.push(e); else sgrid.set(k, [e]);
  }
  for (let i = 0; i < E.length; i++) {
    const e = E[i]; let px = 0, py = 0;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const a = sgrid.get((e.cx + ox) * 100003 + (e.cy + oy)); if (!a) continue;
      for (let j = 0; j < a.length; j++) {
        const o = a[j]; if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, md = (e.r + o.r) * 0.85, d2 = dx * dx + dy * dy;
        if (d2 < md * md) {
          if (d2 > 0.01) { const d = Math.sqrt(d2), f = (md - d) / md; px += dx / d * f; py += dy / d * f; }
          else { px += Math.random() - 0.5; py += Math.random() - 0.5; }
        }
      }
    }
    e.x += px * 90 * dt; e.y += py * 90 * dt;
  }
}

/* =====================================================
   ОБНОВЛЕНИЕ МИРА (каждый кадр)
   ===================================================== */
function update(dt) {
  const g = G, p = g.p, t = (g.t += dt);
  if (t >= g.run.nextBeat) { g.run.nextBeat += 15; sendBeat(g); }

  let ix = 0, iy = 0;
  if (keys.size) {
    ix = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    iy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    const m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; }
  } else { ix = stick.vx; iy = stick.vy; }
  const hasteK = (g.buffs.haste > 0 ? 1.4 : 1) * (p.webT > 0 ? 0.6 : 1);
  if (p.webT > 0) p.webT -= dt;
  p.x += ix * p.speed * hasteK * dt; p.y += iy * p.speed * hasteK * dt;
  p.moving = Math.hypot(ix, iy) > 0.05;
  if (p.moving) { p.walkT += dt * (0.6 + Math.hypot(ix, iy) * 0.6); const m = Math.hypot(ix, iy); p.dirX = ix / m; p.dirY = iy / m; }
  if (p.faceLock > 0) p.faceLock -= dt;
  else if (ix > 0.2) p.face = 1; else if (ix < -0.2) p.face = -1;
  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (p.inv > 0) p.inv -= dt;
  if (p.hurt > 0) p.hurt -= dt;
  if (p.atk >= 0) { p.atk += dt / p.atkDur; if (p.atk >= 1) p.atk = -1; }
  if (p.moving) {
    g.dustT -= dt;
    if (g.dustT <= 0) {
      const fast = g.buffs.haste > 0;
      g.dustT = fast ? 0.06 : 0.13;
      addFx({ type: 'dust', x: p.x + rnd(-5, 5), y: p.y + 17, vx: -ix * 30, vy: -iy * 20 - 8, life: 0.45, T: 0.45, r: rnd(3, 5), col: fast ? '122,240,192' : '170,190,170' });
    }
  }

  while (g.unlocked < TYPES.length && t >= TYPES[g.unlocked].from) { toast('Новый враг: ' + TYPES[g.unlocked].name); g.unlocked++; }

  // Волна смерти
  if (!g.doomWarn && t >= DOOM_T - 30) { g.doomWarn = true; toast('Через 30 секунд начнётся Волна смерти!'); }
  if (!g.doom && t >= DOOM_T) { g.doom = true; g.flash = 0.35; g.shake = 0.6; toast('ВОЛНА СМЕРТИ! Враги сильнее с каждой минутой'); }
  if (g.doom) {
    const m = Math.floor((t - DOOM_T) / 60);
    if (m > g.doomMin) { g.doomMin = m; g.shake = 0.3; toast('Волна смерти усилилась: ' + (m + 1) + '-я минута'); }
  }
  // смена местности
  {
    const want = g.doom ? HELL : g.biomeOrder[Math.min(g.biomeOrder.length - 1, Math.floor(t / BIOME_EVERY))];
    if (want !== g.biome) {
      g.biomePrev = g.biome; g.biome = want; g.biomeK = 0;
      if (want !== HELL) toast('Местность: ' + BIOMES[want].name);
    }
    if (g.biomeK < 1) g.biomeK = Math.min(1, g.biomeK + dt / 3);
  }
  g.vampBank = Math.min(p.maxHp * 0.04, g.vampBank + p.maxHp * 0.03 * dt);

  const maxE = g.doom ? 320 : MAXE;
  const rate = g.doom ? 16 + (t - DOOM_T) / 60 * 5 : Math.min(13, 0.9 + t * 0.028);
  if (g.enemies.length < maxE) {
    g.spawnAcc += rate * dt;
    while (g.spawnAcc >= 1) { g.spawnAcc -= 1; spawnEnemy(g.doom && Math.random() < 0.35 ? DOOM : pickType(t)); }
  } else g.spawnAcc = 0;

  g.waveT -= dt;
  if (g.waveT <= 0) {
    g.waveT = 28;
    const n = Math.min(40, Math.round(10 + t / 9)), a = Math.random() * TAU, T = pickType(t), d = spawnDist() + 10;
    for (let i = 0; i < n && g.enemies.length < MAXE + 60; i++) spawnEnemy(T, a + rnd(-0.45, 0.45), d + Math.random() * 60);
    toast('Волна врагов!');
  }
  g.eliteT -= dt;
  if (g.eliteT <= 0) {
    g.eliteT = 50;
    spawnEnemy(TYPES[Math.max(0, g.unlocked - 1 - Math.floor(Math.random() * Math.min(2, g.unlocked)))], undefined, undefined, true);
    toast('Элитный враг! Победи его и получи сундук');
  }
  g.bossT -= dt;
  if (g.bossT <= 0) { g.bossT = 150; const Bs = BOSSES[g.bossN % BOSSES.length]; g.bossN++; spawnEnemy(Bs); g.shake = 0.3; toast('Появился босс: ' + Bs.name); }

  const far = spawnDist() + 480;
  for (let i = 0; i < g.enemies.length; i++) {
    const e = g.enemies[i];
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    let sp = e.spd * (e.slow > 0 ? 0.5 : 1), mx = dx / d, my = dy / d;
    if (e.T.ai || e.T.ab) {
      sp *= enemyAI(e, d, mx, my, dt);
      if (e.mvx !== undefined) { mx = e.mvx; my = e.mvy; e.mvx = undefined; }
    }
    e.x += (mx * sp + e.kx) * dt; e.y += (my * sp + e.ky) * dt;
    const decay = Math.max(0, 1 - 8 * dt); e.kx *= decay; e.ky *= decay;
    if (e.flash > 0) e.flash -= dt;
    if (e.born < 1) e.born = Math.min(1, e.born + dt / 0.35);
    if (e.sq > 0) e.sq = Math.max(0, e.sq - dt * 6);
    if (e.hitCd > 0) e.hitCd -= dt;
    if (e.bladeCd > 0) e.bladeCd -= dt;
    if (e.slow > 0) e.slow -= dt;
    if (d > far && !e.T.boss && !e.elite) { const a = Math.random() * TAU, rr = spawnDist(); e.x = p.x + Math.cos(a) * rr; e.y = p.y + Math.sin(a) * rr; }
    if (d < e.r + p.r && e.hitCd <= 0 && p.inv <= 0 && state === 'play') {
      e.hitCd = 0.6;
      if (Math.random() < Math.min(0.4, p.dodge)) { pop(p.x, p.y - 30, 'Уклон', '#9fe8ff', false); p.inv = 0.15; }
      else hurtPlayer(e.dmg, e);
    }
  }
  separate(dt);
  updateWeapons(dt);

  // снаряды: движение и попадания
  for (let i = 0; i < g.shots.length; i++) {
    const s = g.shots[i];
    if (s.kind === 'axe') { s.vy += s.grav * dt; s.rot += s.spin * dt; }
    else if (s.kind === 'boom') {
      s.rot += 18 * dt;
      if (!s.back) {
        s.v -= 900 * dt;
        if (s.v <= 0) { s.back = true; s.hit = []; s.v = 0; }
        s.vx = s.dx * s.v; s.vy = s.dy * s.v;
      } else {
        s.v = Math.min(900, s.v + 1100 * dt);
        const ddx = p.x - s.x, ddy = p.y - 6 - s.y, dl = Math.hypot(ddx, ddy) || 1;
        s.vx = ddx / dl * s.v; s.vy = ddy / dl * s.v;
        if (dl < 20) s.life = 0;
      }
    }
    else if (s.kind === 'wisp') {
      if (!s.tgt || s.tgt.dead || s.hit.indexOf(s.tgt.id) >= 0) {
        // новая цель — ближайший враг, которого этот огонёк ещё не задел
        let best = null, bd = 520 * 520;
        for (let j = 0; j < g.enemies.length; j++) {
          const e = g.enemies[j]; if (e.dead || s.hit.indexOf(e.id) >= 0) continue;
          const d2 = (e.x - s.x) ** 2 + (e.y - s.y) ** 2; if (d2 < bd) { bd = d2; best = e; }
        }
        s.tgt = best;
      }
      if (s.tgt) {
        const want = Math.atan2(s.tgt.y - s.y, s.tgt.x - s.x), cur = Math.atan2(s.vy, s.vx);
        let da = want - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        const na = cur + Math.max(-7 * dt, Math.min(7 * dt, da));
        s.vx = Math.cos(na) * s.spd; s.vy = Math.sin(na) * s.spd;
      }
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life <= 0) continue;
    if (g.parts.length < 220 && Math.random() < TRAIL[s.kind]) g.parts.push({ x: s.x, y: s.y, vx: rnd(-20, 20), vy: rnd(-20, 20), life: 0.22, col: TRAILC[s.kind], s: s.kind === 'fire' ? 3.5 : 2.2 });
    for (let j = 0; j < g.enemies.length; j++) {
      const e = g.enemies[j]; if (e.dead) continue;
      const dx = e.x - s.x, dy = e.y - s.y, rr = e.r + s.r;
      if (dx * dx + dy * dy < rr * rr && s.hit.indexOf(e.id) < 0) {
        s.hit.push(e.id);
        if (s.kind === 'fire') { explode(s.x, s.y, s.boom, s.dmg); s.life = 0; break; }
        addFx({ type: 'hit', x: s.x, y: s.y, life: 0.16, T: 0.16, col: s.kind === 'frost' ? '#d8f6ff' : s.kind === 'wisp' ? '#e2c9ff' : '#ffe2a0' });
        const k = 90 / (1 + e.r / 14), l = Math.hypot(s.vx, s.vy) || 1;
        if (s.kind === 'frost') { e.slow = 1.6; burst(s.x, s.y, '#d8f6ff', 3, 90); }
        hitEnemy(e, s.dmg, s.vx / l * k, s.vy / l * k);
        if (s.pierce-- <= 0) { s.life = 0; break; }
      }
    }
  }

  // снаряды врагов
  for (let i = 0; i < g.eshots.length; i++) {
    const s = g.eshots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.life > 0 && p.inv <= 0 && state === 'play' && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r - 2) {
      s.life = 0;
      if (Math.random() < Math.min(0.4, p.dodge)) pop(p.x, p.y - 30, 'Уклон', '#9fe8ff', false);
      else { hurtPlayer(s.dmg, null, 'shot-' + s.kind); if (s.kind === 'web') { p.webT = 1.6; pop(p.x, p.y - 30, 'Паутина', '#e2c9ff', false); } }
    }
  }
  g.eshots = g.eshots.filter((s) => s.life > 0);

  for (let i = 0; i < g.gems.length; i++) {
    const gm = g.gems[i];
    const dx = p.x - gm.x, dy = p.y - gm.y, d = Math.hypot(dx, dy) || 1;
    if (!gm.mag && d < p.magnet) gm.mag = true;
    if (gm.mag) { gm.sp = Math.min(700, gm.sp + 1400 * dt); gm.x += dx / d * (240 + gm.sp) * dt; gm.y += dy / d * (240 + gm.sp) * dt; }
    if (d < p.r + 9) {
      gm.take = true;
      if (gm.type === 'heart') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.2); pop(p.x, p.y - 26, '+HP', '#ff8d8d', false); }
      else {
        addXp(gm.v);
        if (g.fx.length < 120) addFx({ type: 'hit', x: gm.x, y: gm.y, life: 0.14, T: 0.14, small: true, col: gm.tier === 0 ? '#9fd6ff' : gm.tier === 1 ? '#9fffc0' : '#ffaabb' });
      }
    }
  }
  for (let i = 0; i < g.pickups.length; i++) {
    const q = g.pickups[i]; q.life -= dt;
    if (q.life <= 0) { q.take = true; continue; }
    if (!q.take && Math.hypot(p.x - q.x, p.y - q.y) < p.r + 16) { q.take = true; usePickup(q); }
  }
  g.pickups = g.pickups.filter((q) => !q.take);
  for (const k in g.buffs) if (g.buffs[k] > 0) g.buffs[k] = Math.max(0, g.buffs[k] - dt);
  if (g.flash > 0) g.flash -= dt;
  if (g.shake > 0) g.shake -= dt;
  if (g.buffs.haste > 0 && p.moving && g.parts.length < 260) g.parts.push({ x: p.x + rnd(-6, 6), y: p.y + rnd(-4, 14), vx: -ix * 60, vy: -iy * 60, life: 0.3, col: '#7af0c0', s: 3 });
  if (g.buffs.rage > 0 && g.parts.length < 260 && Math.random() < 0.4) g.parts.push({ x: p.x + rnd(-12, 12), y: p.y + rnd(-10, 14), vx: rnd(-10, 10), vy: rnd(-80, -40), life: 0.4, col: '#ff7a4a', s: 2.5 });

  let chestHit = null;
  for (let i = 0; i < g.chests.length; i++) {
    const c = g.chests[i]; c.t += dt;
    if (!chestHit && Math.hypot(p.x - c.x, p.y - c.y) < p.r + 18) { chestHit = c; c.take = true; }
  }

  g.enemies = g.enemies.filter((e) => !e.dead);
  g.shots = g.shots.filter((s) => s.life > 0);
  g.gems = g.gems.filter((q) => !q.take);
  g.chests = g.chests.filter((q) => !q.take);
  for (let i = 0; i < g.parts.length; i++) { const q = g.parts[i]; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.9; q.vy *= 0.9; q.life -= dt; }
  g.parts = g.parts.filter((q) => q.life > 0);
  for (let i = 0; i < g.corpses.length; i++) g.corpses[i].t += dt;
  g.corpses = g.corpses.filter((q) => q.t < q.life);
  for (let i = 0; i < g.fx.length; i++) { const q = g.fx[i]; q.life -= dt; if (q.vx !== undefined) { q.x += q.vx * dt; q.y += q.vy * dt; } }
  g.fx = g.fx.filter((q) => q.life > 0);
  if (g.lvlFx > 0) g.lvlFx -= dt;
  if (g.hurtFx > 0) g.hurtFx -= dt;
  for (let i = 0; i < g.texts.length; i++) { const q = g.texts[i]; q.y -= 42 * dt; q.life -= dt; }
  g.texts = g.texts.filter((q) => q.life > 0);
  for (let i = 0; i < g.rings.length; i++) g.rings[i].age += dt;
  g.rings = g.rings.filter((q) => q.age < q.life);
  for (let i = 0; i < g.bolts.length; i++) g.bolts[i].life -= dt;
  g.bolts = g.bolts.filter((q) => q.life > 0);

  if (state === 'play' && chestHit) openChest(chestHit.kind);
  else if (state === 'play' && g.pending > 0) {
    if (!g.lvlArm) {
      g.lvlArm = true; g.lvlFx = 0.6;
      g.rings.push({ x: p.x, y: p.y, max: 160, age: 0, life: 0.55, col: '255,214,110' });
      burst(p.x, p.y, '#ffe08a', 28, 260);
    } else if (g.lvlFx <= 0) openLevelUp();
  }
}

/* =====================================================
   СУНДУКИ И НАГРАДЫ
   ===================================================== */
function rollRarity(kind) {
  const L = G.p.luck, base = WEIGHTS[kind] || WEIGHTS.normal;
  const w = base.map((v, i) => v * Math.pow(1 + L, i));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
function rollReward(kind) {
  const g = G, r = rollRarity(kind);
  if (r === 4 && Math.random() < 0.6) {
    const owned = g.wOrder.filter((id) => g.w[id] < WMAX);
    const fresh = g.wOrder.length < MAX_WEAPONS ? WEAPONS.filter((Wd) => !g.w[Wd.id]).map((Wd) => Wd.id) : [];
    const pool = fresh.length && (Math.random() < 0.5 || !owned.length) ? fresh : owned;
    if (pool.length) { const id = pool[Math.floor(Math.random() * pool.length)]; return { type: 'weapon', r, wp: WDEF[id], lvl: (g.w[id] || 0) + 1 }; }
  }
  const pool = ITEMS.filter((it) => (it.minR || 0) <= r);
  const it = pool[Math.floor(Math.random() * pool.length)];
  return { type: 'item', r, it, eff: it.fixed ? Object.assign({}, it.eff) : scaleEff(it.eff, RAR[r].mult) };
}
function applyReward(rw) {
  const g = G;
  if (rw.type === 'weapon') {
    const id = rw.wp.id;
    if (!g.w[id]) { g.wOrder.push(id); g.wt[id] = 0.4; }
    g.w[id] = rw.lvl;
  } else {
    applyEff(g.p, rw.eff);
    let k = g.inv[rw.it.id];
    if (!k) { k = g.inv[rw.it.id] = { count: 0, total: {}, best: 0 }; g.invOrder.push(rw.it.id); }
    k.count++; addEff(k.total, rw.eff); k.best = Math.max(k.best, rw.r);
  }
  publishInv(rw.type === 'weapon' ? 'w:' + rw.wp.id : rw.it.id);
}

function rollStatRarity() {
  const L = G.p.luck, w = [60, 25, 10, 4, 1].map((v, i) => v * Math.pow(1 + L, i));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
function buildChoices() {
  const g = G, pool = [];
  g.wOrder.forEach((id) => { if (g.w[id] < WMAX) pool.push({ type: 'wup', id, w: 3 }); });
  if (g.wOrder.length < MAX_WEAPONS) WEAPONS.forEach((Wd) => { if (!g.w[Wd.id]) pool.push({ type: 'wnew', id: Wd.id, w: 1.1 }); });
  g.rOrder.forEach((id) => { if (g.r[id] < RMAX) pool.push({ type: 'rup', id, w: 2 }); });
  if (g.rOrder.length < MAX_RELICS) RELICS.forEach((R) => { if (!g.r[R.id]) pool.push({ type: 'rnew', id: R.id, w: 0.9 }); });
  STATS.forEach((S) => { const n = g.st[S.id] ? g.st[S.id].n : 0; if (n < S.max) pool.push({ type: 'stat', id: S.id, w: S.fixed ? 0.3 : 0.8 }); });
  const out = [];
  while (out.length < 3 && pool.length) {
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0), idx = 0;
    for (; idx < pool.length - 1; idx++) { r -= pool[idx].w; if (r <= 0) break; }
    const c = pool.splice(idx, 1)[0];
    if (c.type === 'stat') {
      const S = SDEF[c.id];
      c.r = Math.max(rollStatRarity(), S.minR || 0);
      c.eff = S.fixed ? Object.assign({}, S.eff) : scaleEff(S.eff, RAR[c.r].mult);
    }
    out.push(c);
  }
  if (!out.length) out.push({ type: 'heal' });
  return out;
}

/* --- открытие сундука: анимацию показывает React (ChestScreen) --- */
let curReward = null;
const ROLL_ICONS = Array.from(new Set(ITEMS.map((i) => i.icon).concat(WEAPONS.map((w) => w.icon))));
function openChest(kind) {
  stickReset(); hideHint();
  curReward = rollReward(kind);
  const rw = curReward;
  const info = {
    id: Math.random(),
    r: rw.r,
    icon: rw.type === 'weapon' ? rw.wp.icon : rw.it.icon,
    lvlTag: rw.type === 'weapon' && rw.lvl > 1 ? 'ур. ' + rw.lvl : '',
    rarity: RAR[rw.r].name + (rw.type === 'weapon' ? (rw.lvl > 1 ? ' · усиление оружия' : ' · новое оружие') : ' · предмет'),
    name: rw.type === 'weapon' ? rw.wp.name : rw.it.name,
    desc: rw.type === 'weapon'
      ? (rw.lvl === 1 ? rw.wp.desc : 'Уровень ' + rw.lvl + ' из ' + WMAX + ': ' + rw.wp.lv[rw.lvl - 2].toLowerCase() + '.')
      : effText(rw.eff) + '. Действует до конца забега.',
    rollIcons: ROLL_ICONS
  };
  ui.set({ chest: info });
  setState('chest');
}
function takeChest() {
  if (state !== 'chest' || !curReward) return;
  applyReward(curReward);
  const rw = curReward; curReward = null;
  ui.set({ chest: null });
  setState('play');
  toast(rw.type === 'weapon' ? rw.wp.name + (rw.lvl > 1 ? ': уровень ' + rw.lvl : ' в деле!') : rw.it.name + ': ' + effText(rw.eff));
  if (G.pending > 0) openLevelUp();
}

/* --- оружие, реликвии и предметы: данные для HUD, паузы и итогов --- */
function invSnapshot(newId) {
  const weapons = [], relics = [];
  for (let i = 0; i < MAX_WEAPONS; i++) {
    const id = G.wOrder[i];
    weapons.push(id ? { key: 'w:' + id, icon: WDEF[id].icon, col: RAR[4].col, badge: G.w[id] >= WMAX ? 'MAX' : String(G.w[id]), isNew: newId === 'w:' + id } : null);
  }
  for (let i = 0; i < MAX_RELICS; i++) {
    const id = G.rOrder[i];
    relics.push(id ? { key: 'r:' + id, icon: RDEF[id].icon, col: RCOL, badge: G.r[id] >= RMAX ? 'MAX' : String(G.r[id]), isNew: newId === 'r:' + id } : null);
  }
  const items = G.invOrder.map((id) => {
    const it = ITEMS.find((q) => q.id === id), k = G.inv[id];
    return { key: id, icon: it.icon, col: RAR[k.best].col, badge: k.count > 1 ? '×' + k.count : '', isNew: newId === id };
  });
  return { weapons, relics, items, stamp: Math.random() };
}
function publishInv(newId) { ui.set({ inv: invSnapshot(newId) }); }

function pauseSnapshot() {
  const p = G.p, H0 = HDEF[G.hero] || HEROES[0];
  const pc = (v) => Math.round(v * 100);
  const mod = (v) => (Math.abs(v) < 0.005 ? '0%' : (v > 0 ? '+' : '−') + Math.abs(pc(v)) + '%');
  const tone = (v) => (v > 0.001 ? 'up' : v < -0.001 ? 'down' : '');
  const dec1 = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
  const stats = [
    { id: 'hp', label: 'Здоровье', value: Math.ceil(Math.max(0, p.hp)) + ' / ' + p.maxHp, tone: tone(p.maxHp - H0.hp) },
    { id: 'dmg', label: 'Урон', value: mod(p.b.dmg), tone: tone(p.b.dmg) },
    { id: 'haste', label: 'Скорость атаки', value: mod(p.b.haste), tone: tone(p.b.haste) },
    { id: 'area', label: 'Площадь', value: mod(p.area - 1), tone: tone(p.area - 1) },
    { id: 'amount', label: 'Снаряды', value: '+' + p.amount, tone: tone(p.amount) },
    { id: 'pspeed', label: 'Скорость снарядов', value: mod(p.b.pspeed), tone: tone(p.b.pspeed) },
    { id: 'range', label: 'Дальность', value: mod(p.b.range), tone: tone(p.b.range) },
    { id: 'dur', label: 'Длительность', value: mod(p.dur - 1), tone: tone(p.dur - 1) },
    { id: 'armor', label: 'Броня', value: String(p.armor), tone: tone(p.armor) },
    { id: 'regen', label: 'Регенерация', value: dec1(p.regen) + '/с', tone: tone(p.regen) },
    { id: 'speed', label: 'Скорость бега', value: mod(p.b.speed), tone: tone(p.b.speed) },
    { id: 'magnet', label: 'Притяжение', value: mod(p.b.magnet), tone: tone(p.b.magnet) },
    { id: 'crit', label: 'Шанс крита', value: pc(p.crit) + '%', tone: tone(p.crit - 0.05) },
    { id: 'critDmg', label: 'Сила крита', value: '×' + dec1(p.critDmg), tone: tone(p.critDmg - 2) },
    { id: 'xp', label: 'Опыт', value: mod(p.xpMul - 1), tone: tone(p.xpMul - 1) },
    { id: 'luck', label: 'Удача', value: mod(p.luck), tone: tone(p.luck) },
    { id: 'vamp', label: 'Вампиризм', value: dec1(p.vamp), tone: tone(p.vamp) },
    { id: 'dodge', label: 'Уклонение', value: pc(Math.min(0.4, p.dodge)) + '%', tone: tone(p.dodge) },
    { id: 'thorns', label: 'Шипы', value: String(Math.round(p.thorns)), tone: tone(p.thorns) },
    { id: 'revive', label: 'Воскрешения', value: String(p.revive), tone: tone(p.revive) }
  ];
  const gear = [];
  G.wOrder.forEach((id) => gear.push({ key: 'w' + id, icon: WDEF[id].icon, col: RAR[4].col, badge: G.w[id] >= WMAX ? 'MAX' : String(G.w[id]), title: WDEF[id].name + ' · ур. ' + G.w[id] }));
  G.rOrder.forEach((id) => gear.push({ key: 'r' + id, icon: RDEF[id].icon, col: RCOL, badge: G.r[id] >= RMAX ? 'MAX' : String(G.r[id]), title: RDEF[id].name + ' · ур. ' + G.r[id] }));
  G.invOrder.forEach((id) => {
    const it = ITEMS.find((q) => q.id === id), k = G.inv[id];
    gear.push({ key: 'i' + id, icon: it.icon, col: RAR[k.best].col, badge: k.count > 1 ? '×' + k.count : '', title: it.name + ': ' + effText(k.total) });
  });
  return { stats, gear, hero: H0.name, time: fmt(G.t), level: G.level, kills: G.kills };
}

/* =====================================================
   НОВЫЙ УРОВЕНЬ: ОРУЖИЕ, РЕЛИКВИИ, ХАРАКТЕРИСТИКИ, ПЕРЕБРОС
   ===================================================== */
let curChoices = [];
function cardParts(c) {
  let cc, cat, lv, icon, name, desc, cls = '';
  if (c.type === 'wnew' || c.type === 'wup') {
    const Wd = WDEF[c.id], n = G.w[c.id] || 0;
    icon = Wd.icon; name = Wd.name;
    if (c.type === 'wnew') { cc = '#ffb02e'; cat = 'Новое оружие'; lv = 'слот ' + (G.wOrder.length + 1) + ' из ' + MAX_WEAPONS; desc = Wd.desc; cls = 'weap'; }
    else { cc = '#ffd56e'; cat = 'Оружие'; lv = 'ур. ' + (n + 1) + ' из ' + WMAX; desc = Wd.lv[n - 1]; cls = 'wup'; }
  } else if (c.type === 'rnew' || c.type === 'rup') {
    const R = RDEF[c.id], n = G.r[c.id] || 0;
    cc = RCOL; icon = R.icon; name = R.name; desc = (c.type === 'rnew' ? '' : 'Ещё ') + effText(R.eff); cls = 'relic';
    if (c.type === 'rnew') { cat = 'Новая реликвия'; lv = 'слот ' + (G.rOrder.length + 1) + ' из ' + MAX_RELICS; }
    else { cat = 'Реликвия'; lv = 'ур. ' + (n + 1) + ' из ' + RMAX; }
  } else if (c.type === 'stat') {
    const S = SDEF[c.id], n = G.st[c.id] ? G.st[c.id].n : 0;
    cc = RAR[c.r].col; icon = S.icon; name = S.name; cat = RAR[c.r].name; lv = 'ур. ' + (n + 1) + ' из ' + S.max; desc = effText(c.eff); cls = 'r' + c.r;
  } else { cc = '#ff7a8a'; icon = 'heart'; name = 'Лечение'; cat = 'Всё прокачано'; lv = ''; desc = 'Восстановить 50 здоровья.'; }
  return { cc, cls, icon, cat, lv, name, desc };
}
function publishChoices() {
  ui.set({ choices: curChoices.map((c, i) => ({ ...cardParts(c), key: Math.random() + ':' + i })), rerolls: G.rerolls });
}
function openLevelUp() {
  G.lvlArm = false; G.lvlFx = 0; hideHint();
  stickReset(); acceptAt = performance.now() + 350;
  curChoices = buildChoices(); publishChoices();
  setState('levelup');
}
function pickChoice(i) {
  const c = curChoices[i];
  if (!c || performance.now() < acceptAt || state !== 'levelup') return;
  const g = G, p = g.p;
  if (c.type === 'wnew') { g.w[c.id] = 1; g.wOrder.push(c.id); g.wt[c.id] = 0.3; publishInv('w:' + c.id); }
  else if (c.type === 'wup') { g.w[c.id]++; publishInv('w:' + c.id); }
  else if (c.type === 'rnew') { g.r[c.id] = 1; g.rOrder.push(c.id); applyEff(p, RDEF[c.id].eff); publishInv('r:' + c.id); }
  else if (c.type === 'rup') { g.r[c.id]++; applyEff(p, RDEF[c.id].eff); publishInv('r:' + c.id); }
  else if (c.type === 'stat') {
    applyEff(p, c.eff);
    let k = g.st[c.id];
    if (!k) { k = g.st[c.id] = { n: 0, total: {}, best: 0 }; g.stOrder.push(c.id); }
    k.n++; addEff(k.total, c.eff); k.best = Math.max(k.best, c.r);
  } else p.hp = Math.min(p.maxHp, p.hp + 50);
  g.pending--;
  if (g.pending > 0) openLevelUp(); else setState('play');
}
function reroll() {
  if (state !== 'levelup' || G.rerolls <= 0) return;
  G.rerolls--; acceptAt = performance.now() + 250;
  curChoices = buildChoices(); publishChoices();
}

/* =====================================================
   ЭКРАНЫ
   ===================================================== */
function readBest() { try { return Number(localStorage.getItem('orda-best')) || 0; } catch (_) { return 0; } }
function writeBest(v) { try { localStorage.setItem('orda-best', String(v)); } catch (_) {} }

/* --- забег на сервере: старт, отчёты каждые 15 сек, финиш --- */
const runReport = (g) => ({ time: Math.floor(g.t * 10) / 10, kills: g.kills, level: g.level, bosses: g.bossKills });
function startOnlineRun(g) {
  if (!isLoggedIn()) return;
  g.run.chain = api.startRun(g.hero).then((r) => { g.run.id = r.runId; }).catch((e) => { g.run.rejected = e.message; });
}
function sendBeat(g) {
  if (!isLoggedIn()) return;
  const rep = runReport(g);
  // отчёты уходят строго по очереди, чтобы сервер видел их в правильном порядке
  g.run.chain = g.run.chain.then(() => (g.run.id && !g.run.rejected ? api.beat(g.run.id, rep) : null))
    .catch((e) => { if (e.status === 422 || e.status === 404) g.run.rejected = e.message; });
}
function finishOnlineRun(g) {
  const acc = ui.get().account || {};
  if (acc.status !== 'user') return { status: acc.status === 'offline' ? 'offline' : 'guest' };
  const rep = runReport(g);
  const upd = (online) => { const d = ui.get().dead; if (d && d.g === g) ui.set({ dead: { ...d, online } }); };
  g.run.chain.then(() => {
    if (g.run.rejected) throw new Error(g.run.rejected);
    if (!g.run.id) throw new Error('Забег не начался на сервере');
    return api.finish(g.run.id, rep);
  }).then((r) => { upd({ status: 'ok', place: r.place, heroPlace: r.heroPlace, score: r.score }); refreshMe(); })
    .catch((e) => upd({ status: 'error', msg: e.message }));
  return { status: 'sending' };
}

function die() {
  stickReset(); hideHint();
  const t = Math.floor(G.t), best = readBest();
  let bestText;
  if (t > best) { writeBest(t); bestText = 'Новый рекорд!'; }
  else bestText = best ? 'Рекорд: ' + fmt(best) : '';
  const g = G;
  ui.set({ dead: { g, time: fmt(t), kills: G.kills, level: G.level, bestText, inv: invSnapshot(), online: null }, best: readBest() });
  ui.set({ dead: { ...ui.get().dead, online: finishOnlineRun(g) } });
  setState('dead');
}
function startGame() {
  newGame(); stickReset();
  startOnlineRun(G);
  curReward = null;
  ui.set({ chest: null, dead: null, pause: null, toast: null });
  lastHudKey = '';
  publishInv(); showHint();
  setState('play');
}
function setPause(on) {
  if (on && state === 'play') { stickReset(); hideHint(); ui.set({ pause: pauseSnapshot() }); setState('pause'); }
  else if (!on && state === 'pause') setState('play');
}
// Возврат в главное меню (там можно сменить героя)
function goMenu() {
  stickReset(); hideHint();
  G = null; curReward = null;
  ui.set({ toast: null, best: readBest() });
  setState('menu');
}
function selectHero(id) {
  if (!HDEF[id]) return;
  heroId = id;
  try { localStorage.setItem('orda-hero', heroId); } catch (_) {}
  ui.set({ heroId });
}

/* --- HUD: отправляем в React только когда что-то поменялось --- */
let lastHudKey = '';
function updateHud() {
  const g = G, p = g.p;
  const boss = g.enemies.find((e) => e.T.boss && !e.dead);
  const hpK = Math.round(Math.max(0, p.hp / p.maxHp) * 200) / 200;
  const xpK = Math.round(Math.min(1, g.xp / g.need) * 200) / 200;
  const bossK = boss ? Math.round(Math.max(0, boss.hp / boss.maxHp) * 200) / 200 : 0;
  const hp = Math.ceil(Math.max(0, p.hp));
  const rage = g.buffs.rage > 0 ? Math.ceil(g.buffs.rage) : 0, haste = g.buffs.haste > 0 ? Math.ceil(g.buffs.haste) : 0;
  const time = fmt(g.t);
  const key = [g.level, time, g.kills, g.doom, hp, p.maxHp, hpK, xpK, boss ? boss.T.name : '', bossK, rage, haste].join('|');
  if (key === lastHudKey) return;
  lastHudKey = key;
  const buffs = [];
  if (rage) buffs.push({ id: 'rage', name: PUS.rage.name, col: PUS.rage.col, icon: PUS.rage.icon, left: rage });
  if (haste) buffs.push({ id: 'haste', name: PUS.haste.name, col: PUS.haste.col, icon: PUS.haste.icon, left: haste });
  hud.set({
    lvl: g.level, time, kills: g.kills, doom: g.doom, hp, maxHp: p.maxHp, hpK, xpK,
    boss: boss ? { name: boss.T.name, k: bossK } : null, buffs
  });
}

/* =====================================================
   ЗАПУСК: React вызывает mountGame(canvas, app)
   ===================================================== */
let raf = 0, last = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  if (state === 'play') update(dt);
  render({ ctx, G, state, W, H, dpr, hx, hy, stick, now, heroSpr });
  if (G && state !== 'menu') updateHud();
}

export function mountGame(cv, app) {
  canvas = cv; appEl = app; ctx = canvas.getContext('2d');
  const onDown = (e) => {
    if (state !== 'play' || stick.id !== null) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (Math.hypot(px - stick.bx, py - stick.by) > stick.zone) return;
    e.preventDefault();
    stick.id = e.pointerId; stick.active = true; stickSet(px, py);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    hideHint();
  };
  const onMove = (e) => {
    if (e.pointerId !== stick.id) return;
    const r = canvas.getBoundingClientRect();
    stickSet(e.clientX - r.left, e.clientY - r.top);
  };
  const onUp = (e) => { if (e.pointerId === stick.id) stickReset(); };
  const onCtx = (e) => e.preventDefault();
  const onKeyDown = (e) => {
    const k = KEYMAP[e.code];
    if (k) { keys.add(k); if (state === 'play') e.preventDefault(); }
    if (e.code === 'Escape' || e.code === 'KeyP') setPause(state === 'play');
  };
  const onKeyUp = (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); };
  const onVis = () => { if (document.hidden) setPause(true); };
  const onBlur = () => keys.clear();

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', onCtx);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVis);
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(appEl);
  resize();
  ui.set({ heroId, best: readBest(), screen: state });
  last = performance.now();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    canvas.removeEventListener('contextmenu', onCtx);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    if (ro) ro.disconnect();
    clearTimeout(hintTimer);
  };
}

// Команды, которые вызывают кнопки интерфейса
export const game = {
  start: startGame,
  pause: () => setPause(true),
  resume: () => setPause(false),
  menu: goMenu,
  selectHero,
  pickChoice,
  reroll,
  takeChest
};

// Только для разработки (npm run dev): доступ к игре из консоли браузера — window.__orda
if (import.meta.env && import.meta.env.DEV) {
  // Бот для проверки баланса: убегает от врагов, собирает опыт, сам выбирает улучшения
  const botInput = () => {
    const p = G.p; let ax = 0, ay = 0;
    for (const e of G.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.fuse > 0 && d < 130) { ax += dx / d * 40; ay += dy / d * 40; continue; }
      if (d > 150) continue;
      const w = (e.T.boss ? 4 : e.elite ? 2 : 1) * 2500 / Math.max(12, d - e.r) ** 2;
      ax += dx / d * w; ay += dy / d * w;
    }
    for (const sh of G.eshots) {
      const dx = p.x - sh.x, dy = p.y - sh.y, d = Math.hypot(dx, dy) || 1;
      if (d < 140) { const w = 6000 / Math.max(10, d) ** 2; ax += dx / d * w; ay += dy / d * w; }
    }
    const danger = Math.hypot(ax, ay);
    let tx = 0, ty = 0, best = 300 * 300;
    for (const c of G.chests) { const d2 = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d2 < 600 * 600) { best = -1; tx = c.x - p.x; ty = c.y - p.y; break; } }
    if (best > 0) for (const gm of G.gems) { const d2 = (gm.x - p.x) ** 2 + (gm.y - p.y) ** 2; if (d2 < best) { best = d2; tx = gm.x - p.x; ty = gm.y - p.y; } }
    // если опыта рядом нет — подходим к врагам на расстояние удара
    if (best === 300 * 300) {
      const e = nearest(p.x, p.y, 700);
      const near = G.heroWeapon === 'aura' ? 60 : 110;
      if (e) { const ex = e.x - p.x, ey = e.y - p.y, d = Math.hypot(ex, ey) || 1; if (d > near) { tx = ex; ty = ey; } }
    }
    const tl = Math.hypot(tx, ty) || 1;
    let vx = ax + tx / tl * (danger < 1.2 ? 1.2 : 0.3), vy = ay + ty / tl * (danger < 1.2 ? 1.2 : 0.3);
    // немного кружим, чтобы не упираться в толпу
    vx += -ay * 0.4; vy += ax * 0.4;
    const l = Math.hypot(vx, vy);
    if (l < 0.05) { stick.vx = 0; stick.vy = 0; return; }
    stick.vx = vx / l; stick.vy = vy / l;
  };
  let soloMode = false;
  const botPick = () => {
    const owned = G.wOrder.length;
    let bi = 0, bs = -1;
    curChoices.forEach((c, i) => {
      let sc = Math.random();
      if (soloMode && c.type === 'wnew') sc -= 10;
      if (c.type === 'wup') sc += 3;
      else if (c.type === 'wnew') sc += owned < 4 ? 2.5 : 0.5;
      else if (c.type === 'rnew' || c.type === 'rup') sc += 1.5;
      else if (c.type === 'stat') sc += 1 + c.r * 0.3;
      if (sc > bs) { bs = sc; bi = i; }
    });
    acceptAt = 0; pickChoice(bi);
  };
  window.__orda = {
    get G() { return G; },
    get state() { return state; },
    openChest: (kind) => openChest(kind || 'boss'),
    levelUp: () => { if (G) { G.pending++; } },
    heroAttack: () => G && heroAttack(),
    // Прогон забега без отрисовки. Пример: __orda.sim({ hero: 'knight', max: 900 })
    sim(o) {
      const opt = Object.assign({ hero: 'mage', max: 900, dt: 1 / 30, weapon: null }, o);
      selectHero(opt.hero);
      startGame();
      if (opt.weapon) { G.w = { [opt.weapon]: 1 }; G.wOrder = [opt.weapon]; G.wt = { [opt.weapon]: 0.2 }; G.heroWeapon = opt.weapon; }
      G.dmgBy = {}; soloMode = !!opt.solo;
      let steps = 0;
      const t0 = performance.now();
      while (state !== 'dead' && G.t < opt.max) {
        if (state === 'levelup') { botPick(); continue; }
        if (state === 'chest') { takeChest(); continue; }
        botInput();
        update(opt.dt); steps++;
      }
      const r = { hero: opt.hero, time: Math.round(G.t), kills: G.kills, level: G.level, weapons: G.wOrder.map((id) => id + G.w[id]).join(','),
        dmgBy: G.dmgBy, hp: Math.round(G.p.hp), ms: Math.round(performance.now() - t0), dead: state === 'dead' };
      stickReset(); goMenu();
      return r;
    }
  };
}
