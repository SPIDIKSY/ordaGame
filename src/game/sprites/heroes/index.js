/* =====================================================
   ГЕРОИ: сборка
   Тело (плащ, броня, голова) рисуется заранее в 4 кадра ходьбы.
   Рука и оружие рисуются «вживую» каждый кадр — поэтому оружие
   может покачиваться, замахиваться и сиять во время атаки.
   Здесь же таблица HERO_LOOK: единое описание внешности каждого героя.
   ===================================================== */
import { TAU, mk, tint, outline, setGlowScale, line } from '../../gfx.js';
import { BODY_W, BODY_H, OUTLINE, SKIN1, SKIN_LINE, FUR0, FUR_LINE } from './parts.js';
import { bodyMage, bodyKnight, bodyRogue, bodyDruid, bodyNecro, bodyCat, bodyVampire } from './bodies.js';
import { drawStaffMage, drawSword, drawDagger, drawStaffDruid, drawStaffNecro, drawMug, drawSoulOrb } from './weapons.js';
import { poseCaster, poseKnight, poseRogue, poseCat, mix } from './poses.js';

/* ---------- описание каждого героя ---------- */
export const HERO_LOOK = {
  mage:   { body: bodyMage,   ring: '255,194,74',  glow: 'amber',  sleeve: '#4a6ad8', sleeveLine: '#101a42', cuff: '#ffc24a', sh: [4.8, -5.2], arm: 10.23, phi0: 0.645, hand: SKIN1, handLine: SKIN_LINE, atk: 0.3,
            pose: (P) => poseCaster(P, 0), weapon: drawStaffMage },
  knight: { body: bodyKnight, ring: '120,170,255', glow: null,     sleeve: '#c9d1dc', sleeveLine: '#262c38', cuff: null, sh: [5, -4.5], arm: 9.2, phi0: 0.7, hand: '#e6ebf2', handLine: '#262c38', atk: 0.34,
            pose: poseKnight, weapon: (x, fl, t) => drawSword(x, t), trail: true },
  rogue:  { body: bodyRogue,  ring: '255,110,130', glow: null,     sleeve: '#3f7a60', sleeveLine: '#0c1a14', cuff: '#5a3418', sh: [4.8, -5.2], arm: 9.74, phi0: 0.624, hand: SKIN1, handLine: SKIN_LINE, atk: 0.26,
            pose: poseRogue, weapon: (x) => drawDagger(x) },
  druid:  { body: bodyDruid,  ring: '130,255,110', glow: 'green',  sleeve: '#9a7644', sleeveLine: '#2a1a08', cuff: '#4fbf5a', sh: [4.8, -5.2], arm: 10.23, phi0: 0.645, hand: SKIN1, handLine: SKIN_LINE, atk: 0.4,
            pose: (P) => poseCaster(P, -0.06), weapon: drawStaffDruid },
  necro:  { body: bodyNecro,  ring: '190,140,255', glow: 'purple', sleeve: '#33244f', sleeveLine: '#05030a', cuff: '#b77cff', sh: [4.8, -5.2], arm: 10.23, phi0: 0.645, hand: '#d8d0e8', handLine: '#4a3a66', atk: 0.42,
            pose: (P) => poseCaster(P, -0.05), weapon: drawStaffNecro },
  cat:    { body: bodyCat,    ring: '255,200,90',  glow: null,     sleeve: '#3a56b0', sleeveLine: '#0a1030', cuff: '#eef2fb', sh: [4.8, -5.2], arm: 10.23, phi0: 0.645, hand: FUR0, handLine: FUR_LINE, atk: 0.7,
            pose: poseCat, weapon: drawMug },
  vampire: { body: bodyVampire, ring: '170,20,50', glow: 'soul', sleeve: '#4a1220', sleeveLine: '#0a0204', cuff: '#f2ecef', sh: [4.8, -5.2], arm: 10.23, phi0: 0.645, hand: '#f0ecf2', handLine: '#5a4a62', atk: 0.32,
            pose: (P) => poseCaster(P, 0), weapon: drawSoulOrb }
};

/**
 * Рисует героя целиком: рукав, тело, оружие и кисть. x — контекст, уже повёрнутый так,
 * что герой смотрит вправо и (0,0) — центр спрайта героя.
 * Рукав рисуется ДО тела: плечо уходит за туловище, и рука растёт из бока, а не
 * лежит на груди наклейкой с тёмной дугой обводки. Кисть и оружие — поверх тела.
 * drawBody(x) рисует тело в тех же координатах.
 * P = { atk: прогресс атаки 0..1 или -1, t: время в секундах, st, bob }
 * Возвращает точку свечения оружия (кончик посоха) в тех же координатах.
 */
export function drawHeroArm(x, id, P, drawBody) {
  const L = HERO_LOOK[id] || HERO_LOOK.mage;
  const SX = L.sh[0], SY = L.sh[1], ARM = L.arm;
  const pose = L.pose({ ...P, phi0: L.phi0 });
  const hx = SX + Math.sin(pose.phi) * ARM, hy = SY + Math.cos(pose.phi) * ARM;
  x.save(); x.translate(0, -P.bob); drawSleeve(x, L, hx, hy); x.restore();
  drawBody(x);
  x.save();
  x.translate(0, -P.bob);
  if (L.trail && pose.swing !== undefined && pose.swing < 1) drawSwingTrail(x, L, pose.swing);
  let tipY = 0;
  if (pose.show > 0) {
    x.save(); x.translate(hx, hy); x.rotate(pose.th);
    if (pose.show < 1) { x.globalAlpha *= pose.show; x.scale(0.4 + 0.6 * pose.show, 0.4 + 0.6 * pose.show); }
    tipY = L.weapon(x, pose.fl, P.t);
    x.restore();
  }
  // кисть поверх рукояти
  x.beginPath(); x.arc(hx, hy, 2.5, 0, TAU);
  x.strokeStyle = OUTLINE; x.lineWidth = 2.2; x.stroke();
  x.fillStyle = L.hand; x.fill(); x.strokeStyle = L.handLine; x.lineWidth = 0.9; x.stroke();
  x.restore();
  return { x: hx + Math.sin(pose.th) * -tipY, y: hy - P.bob + Math.cos(pose.th) * tipY, fl: pose.fl };
}

// Рукав: шире у плеча, уже у запястья, с манжетой
function drawSleeve(x, L, hx, hy) {
  const SX = L.sh[0], SY = L.sh[1];
  const dx = hx - SX, dy = hy - SY, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w0 = 3.4, w1 = 2;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(SX + nx * w0, SY + ny * w0); x.lineTo(hx + nx * w1, hy + ny * w1);
  x.lineTo(hx - nx * w1, hy - ny * w1); x.lineTo(SX - nx * w0, SY - ny * w0);
  x.arc(SX, SY, w0, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
  x.closePath();
  // Тёмный контур такой же, как запечён вокруг тела: без него торчащая из-за тела
  // часть руки выглядит наклейкой. Обводим до заливки — наружу уходит половина линии.
  x.strokeStyle = OUTLINE; x.lineWidth = 2.2; x.stroke();
  x.fillStyle = L.sleeve; x.fill(); x.strokeStyle = L.sleeveLine; x.lineWidth = 0.9; x.stroke();
  if (L.cuff) {
    const cx0 = hx - dx / d * 1.6, cy0 = hy - dy / d * 1.6;
    x.strokeStyle = L.cuff; x.lineWidth = 1.1; line(x, cx0 + nx * 2, cy0 + ny * 2, cx0 - nx * 2, cy0 - ny * 2);
  }
}

// След от взмаха меча: дуга по пути кончика клинка за последнюю часть удара
function drawSwingTrail(x, L, s1) {
  const SX = L.sh[0], SY = L.sh[1], ARM = L.arm, s0 = Math.max(0, s1 - 0.55), N = 12;
  x.save();
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const k0 = s0 + (s1 - s0) * (i / N), k1 = s0 + (s1 - s0) * ((i + 1) / N);
    const pa = mix(2.7, 1.0, k0), ta = mix(-2.5, 2.15, k0), pb = mix(2.7, 1.0, k1), tb = mix(-2.5, 2.15, k1);
    const ax = SX + Math.sin(pa) * ARM + Math.sin(ta) * 23, ay = SY + Math.cos(pa) * ARM - Math.cos(ta) * 23;
    const bx = SX + Math.sin(pb) * ARM + Math.sin(tb) * 23, by = SY + Math.cos(pb) * ARM - Math.cos(tb) * 23;
    const q = (i + 1) / N;
    x.strokeStyle = 'rgba(190,225,255,' + (0.55 * q * (1 - s1 * 0.5)).toFixed(3) + ')';
    x.lineWidth = 2 + q * 5; line(x, ax, ay, bx, by);
    x.strokeStyle = 'rgba(255,255,255,' + (0.8 * q).toFixed(3) + ')';
    x.lineWidth = 0.6 + q * 1.4; line(x, ax, ay, bx, by);
  }
  x.restore();
}

/* ---------- готовые спрайты ---------- */
const cache = {};
export function getHeroSprites(id) {
  if (cache[id]) return cache[id];
  const L = HERO_LOOK[id] || HERO_LOOK.mage;
  const make = (f, walk) => outline(mk(BODY_W, BODY_H, (x) => L.body(x, f, walk)), '#0a0d14', 2, 0.75);
  const o = { f: [], h: [], look: L };
  for (let i = 0; i < 4; i++) { const c = make(i / 4, 1); o.f.push(c); o.h.push(tint(c, '#ff4a4a', 0.5)); }
  o.idle = make(0, 0);
  o.idleH = tint(o.idle, '#ff4a4a', 0.5);
  cache[id] = o;
  return o;
}

// Портрет героя прямо на видимом холсте страницы: карточки выбора героя, лидерборд.
// Раньше портрет превращался в картинку через toDataURL — а Firefox с защитой от
// слежки (fingerprinting) отдаёт вместо такой картинки пустую, и карточки были пустыми.
// Рисование прямо на холсте эта защита не трогает.
export function paintPortrait(canvas, id, cssW, cssH) {
  const L = HERO_LOOK[id] || HERO_LOOK.mage, dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  const x = canvas.getContext('2d'), s = Math.min(cssW / BODY_W, cssH / BODY_H) * dpr;
  x.setTransform(s, 0, 0, s, canvas.width / 2, canvas.height / 2);
  x.lineJoin = 'round'; x.lineCap = 'round';
  setGlowScale(s);
  drawHeroArm(x, id, { atk: -1, t: 0.6, st: 0, bob: 0 }, (c) => L.body(c, 0, 0));
}
