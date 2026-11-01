/* =====================================================
   ГЕРОИ
   Тело героя (плащ, броня, голова) рисуется заранее в 4 кадра ходьбы.
   Рука и оружие рисуются «вживую» каждый кадр — поэтому оружие
   может покачиваться, замахиваться и сиять во время атаки.
   ===================================================== */
import { TAU, mk, tint, outline, rg, lg, ell, circ, rrect, star, glowOn, glowOff, line, setGlowScale } from '../gfx.js';

const SKIN0 = '#ffe6cc', SKIN1 = '#e7a37b', SKIN_LINE = '#6b3d2a';
const BODY_W = 48, BODY_H = 76;

/* ---------- общие детали ---------- */
function walkOf(f, walk) {
  return { st: Math.sin(f * TAU) * walk, bob: Math.abs(Math.cos(f * TAU)) * walk * 1.4 };
}
function face(x, s0, s1, lineC) {
  x.beginPath(); x.arc(1, -12, 6.4, 0, TAU);
  x.fillStyle = rg(x, -1, -14, 1, 1, -12, 7, [[0, s0 || SKIN0], [1, s1 || SKIN1]]); x.fill();
  x.strokeStyle = lineC || SKIN_LINE; x.lineWidth = 1.1; x.stroke();
}
function eyes(x, col) {
  x.fillStyle = col || '#1d1420'; ell(x, 2.7, -11.4, 1.1, 1.65); ell(x, 5.8, -11.4, 1.1, 1.65);
  x.fillStyle = '#fff'; circ(x, 2.4, -12.1, 0.45); circ(x, 5.5, -12.1, 0.45);
}
function blush(x, a) { x.fillStyle = 'rgba(255,110,110,' + (a || 0.45) + ')'; circ(x, 6.4, -9.2, 1.2); circ(x, 0.9, -9.2, 1.2); }
function cape(x, st, c0, c1, lineC) {
  x.beginPath(); x.moveTo(-4, -8); x.quadraticCurveTo(-13 - st * 1.5, 2, -12 + st, 15); x.quadraticCurveTo(-5, 17, 1, 14); x.lineTo(3, -6); x.closePath();
  x.fillStyle = lg(x, 0, -8, 0, 16, [[0, c0], [1, c1]]); x.fill();
  x.strokeStyle = lineC || 'rgba(0,0,0,.55)'; x.lineWidth = 1.2; x.stroke();
}
function robe(x, c0, c1, lineC) {
  x.beginPath(); x.moveTo(-5.5, -7); x.lineTo(5.5, -7); x.quadraticCurveTo(9.5, 6, 9.8, 15); x.quadraticCurveTo(0, 18.4, -9.8, 15); x.quadraticCurveTo(-9.5, 6, -5.5, -7); x.closePath();
  x.fillStyle = lg(x, -8, -7, 8, 15, [[0, c0], [1, c1]]); x.fill();
  x.strokeStyle = lineC; x.lineWidth = 1.3; x.stroke();
}
function boots(x, st, bob, c0, c1) {
  x.fillStyle = c1 ? lg(x, 0, 15, 0, 20, [[0, c0], [1, c1]]) : c0;
  ell(x, -3.5 + st * 3, 17.6 + bob, 3.7, 2.2); ell(x, 4 - st * 3, 17.6 + bob, 3.7, 2.2);
}
function leaf(x, cx, cy, rot, col, s) {
  s = s || 1;
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
  x.fillStyle = col; x.beginPath(); x.moveTo(-2.4, 0); x.quadraticCurveTo(0, -1.7, 2.4, 0); x.quadraticCurveTo(0, 1.7, -2.4, 0); x.fill();
  x.strokeStyle = 'rgba(20,60,20,.55)'; x.lineWidth = 0.4; line(x, -2, 0, 2, 0);
  x.restore();
}
function star4(x, cx, cy, r) {
  x.beginPath(); x.moveTo(cx, cy - r);
  x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
  x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill();
}

/* =====================================================
   ТЕЛА ГЕРОЕВ (без руки с оружием)
   ===================================================== */

// Маг — синяя мантия, остроконечная шляпа со звездой
function bodyMage(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  cape(x, st, '#e0566a', '#6e1a33', '#3a0d1c');
  boots(x, st, bob, '#4a2c1d');
  robe(x, '#6d93f2', '#22357e', '#101a42');
  x.strokeStyle = '#ffc24a'; x.lineWidth = 1.4;
  x.beginPath(); x.moveTo(-9.3, 13.6); x.quadraticCurveTo(0, 16.9, 9.3, 13.6); x.stroke();
  line(x, 2.2, -5, 2.8, 15.8);
  // звёздочки на мантии
  x.fillStyle = 'rgba(255,214,110,.7)'; star(x, -4.5, 6, 1.1); x.fill(); star(x, 5.5, 10, 0.9); x.fill(); star(x, -2, 11.5, 0.8); x.fill();
  x.fillStyle = '#6b3a1f'; x.fillRect(-7.4, 2, 15, 2.6);
  x.fillStyle = '#ffc24a'; x.fillRect(1.2, 1.5, 3.2, 3.6);
  face(x); eyes(x); blush(x);
  // шляпа
  x.beginPath(); x.ellipse(0.5, -16, 10.2, 2.9, -0.05, 0, TAU);
  x.fillStyle = '#2b3f96'; x.fill(); x.strokeStyle = '#101a42'; x.lineWidth = 1.2; x.stroke();
  x.beginPath(); x.moveTo(-6, -16.6); x.quadraticCurveTo(-3, -24, -6.5 - st * 0.9, -31.5); x.quadraticCurveTo(2.5, -25, 7, -16.6); x.closePath();
  x.fillStyle = lg(x, -6, -30, 6, -16, [[0, '#6d93f2'], [1, '#2b3f96']]); x.fill(); x.stroke();
  x.strokeStyle = '#ffc24a'; x.lineWidth = 2;
  x.beginPath(); x.moveTo(-5.6, -18.4); x.quadraticCurveTo(0.6, -20, 6.6, -18.4); x.stroke();
  x.fillStyle = '#ffd56e'; star(x, -1.6, -23.4, 2); x.fill();
}

// Рыцарь — латы, синий табард с крестом, шлем с плюмажем и щит
function bodyKnight(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  // плюмаж развевается за шлемом
  x.beginPath(); x.moveTo(1, -21);
  x.bezierCurveTo(-4, -27, -11 - st * 1.5, -27, -15 - st * 2, -19);
  x.quadraticCurveTo(-11 - st, -22, -8, -20.5);
  x.quadraticCurveTo(-12 - st, -18.5, -13 - st * 1.5, -14);
  x.quadraticCurveTo(-6, -20, 0, -18.5); x.closePath();
  x.fillStyle = lg(x, 0, -27, -12, -14, [[0, '#ff7084'], [1, '#a81c34']]); x.fill();
  x.strokeStyle = '#4a0816'; x.lineWidth = 1; x.stroke();
  cape(x, st, '#4f80e6', '#16285e', '#0c1838');
  boots(x, st, bob, '#c9d1dc', '#5d6676');
  x.strokeStyle = '#262c38'; x.lineWidth = 0.8;
  x.beginPath(); x.ellipse(-3.5 + st * 3, 17.6 + bob, 3.7, 2.2, 0, 0, TAU); x.stroke();
  x.beginPath(); x.ellipse(4 - st * 3, 17.6 + bob, 3.7, 2.2, 0, 0, TAU); x.stroke();
  // латы
  x.beginPath(); x.moveTo(-6, -7.5); x.lineTo(6.2, -7.5); x.quadraticCurveTo(9.6, 4, 9.2, 14.5); x.quadraticCurveTo(0, 17.6, -9.2, 14.5); x.quadraticCurveTo(-9.6, 4, -6, -7.5); x.closePath();
  x.fillStyle = lg(x, -8, -7, 8, 15, [[0, '#f6f9fd'], [0.5, '#b9c2d0'], [1, '#5d6676']]); x.fill();
  x.strokeStyle = '#262c38'; x.lineWidth = 1.3; x.stroke();
  // табард
  x.beginPath(); x.moveTo(-3.6, -6.5); x.lineTo(5.8, -6.5); x.lineTo(6.6, 13.2); x.lineTo(1.4, 16.2); x.lineTo(-4.4, 13.2); x.closePath();
  x.fillStyle = lg(x, 0, -6, 0, 16, [[0, '#5a8cf0'], [1, '#1c3270']]); x.fill();
  x.strokeStyle = '#0c1838'; x.lineWidth = 1; x.stroke();
  x.strokeStyle = '#ffc24a'; x.lineWidth = 0.9;
  x.beginPath(); x.moveTo(-3.9, 12.6); x.lineTo(1.4, 15.3); x.lineTo(6.1, 12.6); x.stroke();
  // золотой крест
  x.fillStyle = '#ffc24a'; x.fillRect(0.3, -3.2, 1.9, 9.5); x.fillRect(-1.9, -0.6, 6.3, 1.9);
  // пояс
  x.fillStyle = '#5a3418'; x.fillRect(-8.2, 6.4, 16.8, 2.2);
  x.fillStyle = '#ffd56e'; rrect(x, 0, 5.9, 3, 3.2, 0.6); x.fill();
  // наплечник сзади
  x.beginPath(); x.ellipse(-5.6, -5.6, 3.6, 2.8, -0.3, 0, TAU);
  x.fillStyle = lg(x, -8, -8, -3, -3, [[0, '#c9d1dc'], [1, '#6b7686']]); x.fill(); x.strokeStyle = '#262c38'; x.lineWidth = 1; x.stroke();
  // щит в левой руке
  x.save(); x.translate(0, st * 0.6);
  x.beginPath(); x.moveTo(-13.2, -3.4); x.quadraticCurveTo(-8, -5.6, -2.8, -3.4); x.lineTo(-3, 4); x.quadraticCurveTo(-3.8, 10, -8, 13.2); x.quadraticCurveTo(-12.2, 10, -13, 4); x.closePath();
  x.fillStyle = lg(x, -13, -4, -3, 12, [[0, '#6f9cf5'], [1, '#1c3270']]); x.fill();
  x.strokeStyle = '#ffc24a'; x.lineWidth = 1.5; x.stroke();
  x.strokeStyle = '#3a2400'; x.lineWidth = 0.6; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.92)'; x.fillRect(-8.8, -2.6, 1.7, 12); x.fillRect(-11.6, 1.2, 7.3, 1.7);
  x.fillStyle = 'rgba(255,255,255,.25)'; ell(x, -10.2, -0.6, 1.3, 2.6, 0.3);
  x.restore();
  // шлем-ведро
  x.beginPath(); x.moveTo(-5.8, -8.3); x.lineTo(-6.6, -14); x.quadraticCurveTo(-6.4, -20.9, 1, -21.2); x.quadraticCurveTo(8.4, -20.9, 8.6, -14); x.lineTo(7.8, -8.3); x.quadraticCurveTo(1, -6.6, -5.8, -8.3); x.closePath();
  x.fillStyle = rg(x, -1, -17, 1, 1, -13, 10, [[0, '#ffffff'], [0.45, '#c9d1dc'], [1, '#5d6676']]); x.fill();
  x.strokeStyle = '#262c38'; x.lineWidth = 1.2; x.stroke();
  x.strokeStyle = '#ffc24a'; x.lineWidth = 1.2;
  x.beginPath(); x.moveTo(-6.5, -16.4); x.quadraticCurveTo(1, -18.2, 8.5, -16.4); x.stroke();
  x.strokeStyle = 'rgba(30,36,50,.45)'; x.lineWidth = 0.9; line(x, 1, -21, 1, -16.8);
  // смотровая щель и дырочки для дыхания
  x.fillStyle = '#141820'; rrect(x, -0.4, -14.7, 9, 2.1, 1); x.fill();
  x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0.4, -15.4, 7.4, 0.5);
  x.fillStyle = '#262c38'; circ(x, 4.5, -10.6, 0.45); circ(x, 6.2, -10.6, 0.45); circ(x, 5.3, -9.4, 0.45);
  x.fillStyle = 'rgba(255,255,255,.55)'; ell(x, -3, -17, 1.3, 2.4, 0.4);
}

// Разбойница — кожаная куртка, аккуратный капюшон, шарф-маска, рыжая коса
function bodyRogue(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  // короткий плащ
  x.beginPath(); x.moveTo(-4, -7); x.quadraticCurveTo(-11 - st * 1.5, 0, -10 + st, 9);
  x.lineTo(-8 + st, 7.8); x.lineTo(-6.6 + st, 10); x.lineTo(-4.6, 8.4); x.lineTo(-2.6, 10); x.lineTo(2, -5); x.closePath();
  x.fillStyle = lg(x, 0, -7, 0, 10, [[0, '#3c3f5c'], [1, '#16182a']]); x.fill();
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1; x.stroke();
  // коса за спиной
  x.fillStyle = '#c4632f'; x.strokeStyle = '#5a2410'; x.lineWidth = 0.7;
  for (let i = 0; i < 5; i++) {
    const bx = -5.4 - i * 0.9 - st * i * 0.3, by = -11 + i * 2.4;
    x.beginPath(); x.ellipse(bx, by, 1.8 - i * 0.15, 1.4, 0.4, 0, TAU); x.fill(); x.stroke();
  }
  x.fillStyle = '#e8485c'; circ(x, -9.6 - st * 1.2, 0.6, 0.85);
  // ноги
  x.lineCap = 'round';
  for (const s of [-1, 1]) {
    const fx = s < 0 ? -3.5 + st * 3 : 4 - st * 3, hx = s < 0 ? -2.4 : 3;
    x.strokeStyle = '#151a26'; x.lineWidth = 4.8; line(x, hx, 9, fx, 15.6 + bob);
    x.strokeStyle = '#2f3850'; x.lineWidth = 3.4; line(x, hx, 9, fx, 15.6 + bob);
  }
  x.fillStyle = '#3a2216'; ell(x, -3.5 + st * 3, 17.4 + bob, 3.4, 2.1); ell(x, 4 - st * 3, 17.4 + bob, 3.4, 2.1);
  x.fillStyle = '#6b4428'; x.fillRect(-5.6 + st * 3, 14.3 + bob, 4.2, 1.3); x.fillRect(1.9 - st * 3, 14.3 + bob, 4.2, 1.3);
  // куртка
  x.beginPath(); x.moveTo(-5.2, -7.2); x.lineTo(5.6, -7.2); x.quadraticCurveTo(7.8, 2, 7.6, 9.4); x.lineTo(8.4, 12); x.lineTo(-7.6, 12); x.lineTo(-6.8, 9.4); x.quadraticCurveTo(-7.4, 2, -5.2, -7.2); x.closePath();
  x.fillStyle = lg(x, -7, -7, 7, 12, [[0, '#4f8a6e'], [1, '#1b3328']]); x.fill();
  x.strokeStyle = '#0c1a14'; x.lineWidth = 1.2; x.stroke();
  x.strokeStyle = 'rgba(200,240,210,.35)'; x.lineWidth = 0.6; line(x, 1.6, -5.5, 2, 11.2);
  // ремень через грудь, пояс, ножны на бедре
  x.strokeStyle = '#5a3418'; x.lineWidth = 1.8; line(x, -4.6, -6, 6.4, 8.4);
  x.fillStyle = '#d6dce6'; x.save(); x.translate(0.2, 0.4); x.rotate(0.9); rrect(x, -0.7, -2.6, 1.4, 4, 0.6); x.fill(); x.restore();
  x.fillStyle = '#5a3418'; x.fillRect(-6.9, 6.4, 14.4, 2);
  x.fillStyle = '#c9a46b'; rrect(x, -1.6, 6, 2.6, 2.8, 0.5); x.fill();
  x.save(); x.translate(-5.6, 9.4); x.rotate(-0.25);
  x.fillStyle = '#3a2216'; rrect(x, -1.1, -1, 2.2, 6, 0.8); x.fill();
  x.fillStyle = '#c9a46b'; x.fillRect(-1.8, -1.6, 3.6, 1); circ(x, 0, -2.6, 0.9);
  x.restore();
  // шарф на шее
  x.beginPath(); x.moveTo(-4.4, -8.2); x.quadraticCurveTo(1.6, -5.4, 6.6, -8); x.lineTo(6.4, -6); x.quadraticCurveTo(1.4, -3.6, -4.6, -6.4); x.closePath();
  x.fillStyle = '#c42b40'; x.fill(); x.strokeStyle = '#4a0816'; x.lineWidth = 0.8; x.stroke();
  x.beginPath(); x.moveTo(-4, -7.2); x.quadraticCurveTo(-8 - st, -5.4, -10.4 - st * 1.6, -2.4); x.lineTo(-8.6 - st * 1.4, -1.8); x.quadraticCurveTo(-6.6, -4.6, -3.2, -5.8); x.closePath();
  x.fill(); x.stroke();
  // капюшон: задняя часть с острым кончиком
  x.beginPath();
  x.moveTo(-3.6, -6.8);
  x.quadraticCurveTo(-8.4, -9, -8, -14.6);
  x.quadraticCurveTo(-8.6, -18.6, -10.6 - st * 0.8, -21);
  x.quadraticCurveTo(-4, -21.4, 0.6, -20.6);
  x.quadraticCurveTo(7.4, -19.6, 8.4, -13.4);
  x.quadraticCurveTo(8.8, -9.4, 7, -7.2);
  x.closePath();
  x.fillStyle = lg(x, -6, -21, 6, -7, [[0, '#5a9a7c'], [1, '#1f3d30']]); x.fill();
  x.strokeStyle = '#0c1a14'; x.lineWidth = 1.2; x.stroke();
  // проём для лица (тень)
  x.fillStyle = '#16261e'; ell(x, 2.9, -12.4, 5.3, 5.8);
  // лицо
  x.fillStyle = rg(x, 2.2, -14, 0.5, 2.9, -12, 5.4, [[0, SKIN0], [1, SKIN1]]); ell(x, 3, -12, 4.6, 5.1);
  // рыжая чёлка
  x.fillStyle = '#c4632f';
  x.beginPath(); x.moveTo(-1.4, -14.4); x.quadraticCurveTo(1.6, -18.4, 7.4, -15.6); x.quadraticCurveTo(4.2, -15.8, 2.6, -14.2); x.quadraticCurveTo(1.6, -15.4, -1.4, -14.4); x.fill();
  // глаза и брови
  eyes(x, '#1a3a2a');
  x.strokeStyle = '#7a3418'; x.lineWidth = 0.7; line(x, 1.7, -13.7, 3.6, -13.4); line(x, 4.9, -13.4, 6.8, -13.8);
  // маска закрывает нос и рот
  x.beginPath(); x.moveTo(-1.4, -9.6); x.quadraticCurveTo(3.2, -10.6, 7.6, -9.8); x.quadraticCurveTo(7.2, -7, 3, -6.9); x.quadraticCurveTo(-0.6, -7.2, -1.4, -9.6); x.closePath();
  x.fillStyle = lg(x, 0, -10, 0, -7, [[0, '#ff5d70'], [1, '#a81c34']]); x.fill();
  x.strokeStyle = '#4a0816'; x.lineWidth = 0.8; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 0.5; line(x, 0, -9.2, 6.6, -9.4);
}

// Друид — мантия с лозой, воротник из листьев, борода, рога и венок
function bodyDruid(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  // накидка с листовым краем
  x.beginPath(); x.moveTo(-4, -8); x.quadraticCurveTo(-13 - st * 1.5, 2, -12 + st, 14);
  for (let i = 0; i < 4; i++) { const ax = -12 + st + i * 3.2; x.quadraticCurveTo(ax + 1.6, 17.5, ax + 3.2, 14.5); }
  x.lineTo(3, -6); x.closePath();
  x.fillStyle = lg(x, 0, -8, 0, 16, [[0, '#5fb86a'], [1, '#1e4a26']]); x.fill();
  x.strokeStyle = '#0e2a12'; x.lineWidth = 1.1; x.stroke();
  // волосы сзади
  x.fillStyle = '#6a4224';
  x.beginPath(); x.moveTo(-5.2, -15); x.quadraticCurveTo(-8.4, -9, -6.4, -4.6); x.lineTo(-3.4, -6.4); x.quadraticCurveTo(-4, -10, -2.4, -13); x.closePath(); x.fill();
  boots(x, st, bob, '#5a3a1a');
  robe(x, '#b08a52', '#4a3418', '#2a1a08');
  x.strokeStyle = '#6ad66a'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(2.4, -4.5); x.bezierCurveTo(0.6, 0, 4.4, 5, 2.4, 9); x.bezierCurveTo(1, 12, 3.4, 14, 2.8, 16); x.stroke();
  leaf(x, 0.8, 1.2, -0.8, '#6ad66a', 0.6); leaf(x, 4, 6, 0.8, '#4fbf5a', 0.6); leaf(x, 1.2, 11.6, -0.6, '#6ad66a', 0.6);
  x.strokeStyle = '#2a1a08'; x.lineWidth = 0.9;
  x.beginPath(); x.moveTo(-9.3, 13.6); x.quadraticCurveTo(0, 16.9, 9.3, 13.6); x.stroke();
  // верёвочный пояс и мешочек
  x.fillStyle = '#c9a46b'; x.fillRect(-7.6, 2.4, 15.4, 2);
  x.strokeStyle = '#8a6a3a'; x.lineWidth = 0.5; for (let i = -7; i < 8; i += 1.6) line(x, i, 2.4, i + 1, 4.4);
  x.fillStyle = '#7a5a30'; rrect(x, -6.4, 4, 3.6, 4, 1.2); x.fill();
  x.strokeStyle = '#3a2410'; x.lineWidth = 0.6; x.stroke();
  // воротник из листьев
  const LC = ['#3a8a44', '#4fbf5a', '#6ad66a'];
  for (let k = 0; k < 7; k++) {
    const a = Math.PI * (0.98 + k * 0.17);
    leaf(x, 0.8 + Math.cos(a) * 7.2, -6.2 + Math.sin(a) * 2.4, a + Math.PI / 2, LC[k % 3], 1.05);
  }
  // голова
  face(x); eyes(x); blush(x, 0.3);
  x.strokeStyle = '#5a3a1a'; x.lineWidth = 0.9; line(x, 1.6, -13.6, 3.6, -13.3); line(x, 4.9, -13.3, 6.9, -13.7);
  // усы и короткая борода
  x.beginPath(); x.moveTo(0.4, -8.8); x.quadraticCurveTo(1.4, -4.6, 3.8, -3.8); x.quadraticCurveTo(6.4, -4.8, 7, -8.6);
  x.quadraticCurveTo(5.6, -7.6, 4.2, -8.2); x.quadraticCurveTo(2.6, -7.4, 0.4, -8.8); x.closePath();
  x.fillStyle = lg(x, 0, -9, 0, -4, [[0, '#ece6d6'], [1, '#b0a48c']]); x.fill();
  x.strokeStyle = '#6a604c'; x.lineWidth = 0.6; x.stroke();
  x.fillStyle = '#7a3a2a'; ell(x, 4.2, -7.7, 0.9, 0.45);
  // волосы сверху (не закрывают глаза)
  x.beginPath(); x.moveTo(-5.4, -11.4); x.quadraticCurveTo(-5.6, -18.6, 1.2, -18.8); x.quadraticCurveTo(6.4, -18.6, 7.4, -14.6);
  x.quadraticCurveTo(4.6, -16.4, 1.4, -15.4); x.quadraticCurveTo(-2.4, -15, -3.4, -11.2); x.closePath();
  x.fillStyle = '#7a4e2a'; x.fill(); x.strokeStyle = '#3a2210'; x.lineWidth = 0.7; x.stroke();
  // рога
  const antl = () => {
    for (const s of [-1, 1]) {
      const bx = 1 + s * 2.8;
      x.beginPath(); x.moveTo(bx, -17.6); x.quadraticCurveTo(bx + s * 1.4, -21, bx + s * 2.6, -23.2); x.lineTo(bx + s * 5.2, -25.8);
      x.moveTo(bx + s * 2.6, -23.2); x.lineTo(bx + s * 1.4, -26.6);
      x.moveTo(bx + s * 1.2, -20.4); x.lineTo(bx + s * 4.4, -21); x.stroke();
    }
  };
  x.strokeStyle = '#5a3a1a'; x.lineWidth = 2.4; antl(); x.strokeStyle = '#e6c899'; x.lineWidth = 1.2; antl();
  // венок
  for (let k = 0; k < 5; k++) { const a = Math.PI * (1.12 + k * 0.19); leaf(x, 1 + Math.cos(a) * 6.4, -13 + Math.sin(a) * 5.4, a + Math.PI / 2, k % 2 ? '#4fbf5a' : '#6ad66a', 0.9); }
  x.fillStyle = '#ff9ec1'; circ(x, -3.4, -16.6, 1); circ(x, 5.6, -16.8, 1);
  x.fillStyle = '#ffd36a'; circ(x, -3.4, -16.6, 0.4); circ(x, 5.6, -16.8, 0.4);
}

// Некромант — чёрная мантия с фиолетовыми рунами, высокий воротник,
// бледное лицо и длинные чёрные волосы (без капюшона, чтобы не путать со Жнецом)
function bodyNecro(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  // длинный плащ с рваным краем
  x.beginPath(); x.moveTo(-4, -8); x.quadraticCurveTo(-14 - st * 1.6, 2, -13 + st, 15);
  x.lineTo(-10.5 + st, 13); x.lineTo(-8.5 + st * 0.6, 16); x.lineTo(-6, 13.4); x.lineTo(-3, 16.2); x.lineTo(1, 14); x.lineTo(3, -6); x.closePath();
  x.fillStyle = lg(x, 0, -8, 0, 16, [[0, '#4a2a72'], [1, '#0c0716']]); x.fill();
  x.strokeStyle = '#05030a'; x.lineWidth = 1.1; x.stroke();
  // длинные чёрные волосы за спиной
  x.beginPath(); x.moveTo(-5.4, -16); x.quadraticCurveTo(-9.6 - st, -9, -8 - st * 0.6, -0.6); x.lineTo(-5.2, -2.6); x.lineTo(-4, -0.4); x.quadraticCurveTo(-3.6, -8, -1.4, -12); x.closePath();
  x.fillStyle = lg(x, -8, -16, -4, 0, [[0, '#3a2a52'], [1, '#120a1e']]); x.fill();
  x.strokeStyle = '#05030a'; x.lineWidth = 0.8; x.stroke();
  // высокий воротник за головой
  x.beginPath(); x.moveTo(-4.6, -7); x.lineTo(-8.6, -17); x.quadraticCurveTo(-4.4, -13.6, -1.6, -8.4); x.closePath();
  x.fillStyle = lg(x, -9, -17, -3, -7, [[0, '#8a5ac8'], [1, '#2a1640']]); x.fill(); x.strokeStyle = '#05030a'; x.lineWidth = 1; x.stroke();
  boots(x, st, bob, '#1a1222');
  robe(x, '#3b2a5c', '#120a20', '#05030a');
  glowOn(x, '#b77cff', 3);
  x.strokeStyle = '#c99cff'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(-9.3, 13.6); x.quadraticCurveTo(0, 16.9, 9.3, 13.6); x.stroke();
  line(x, 2.2, -5, 2.8, 15.8);
  x.lineWidth = 0.8;
  x.beginPath(); x.moveTo(-4.6, 6.5); x.lineTo(-3.4, 9); x.lineTo(-5.2, 10.4); x.moveTo(5.2, 8.2); x.lineTo(6.6, 10.6); x.lineTo(5, 12); x.stroke();
  glowOff(x);
  x.fillStyle = '#2a1a3a'; x.fillRect(-7.6, 2, 15.2, 2.4);
  x.fillStyle = '#ece6d6'; circ(x, 2.8, 3.2, 1.9); x.fillRect(1.9, 4, 1.8, 1.2);
  x.fillStyle = '#2a1036'; circ(x, 2.1, 3, 0.5); circ(x, 3.5, 3, 0.5);
  // наплечник-череп сзади
  x.fillStyle = '#d9d0bc'; circ(x, -5.2, -5.4, 2.4);
  x.strokeStyle = '#6a604c'; x.lineWidth = 0.6; x.beginPath(); x.arc(-5.2, -5.4, 2.4, 0, TAU); x.stroke();
  x.fillStyle = '#2a1036'; circ(x, -5.9, -5.6, 0.55); circ(x, -4.5, -5.6, 0.55);
  // лицо
  face(x, '#f6eef0', '#c8b4c4', '#4a3a66');
  x.fillStyle = 'rgba(90,50,130,.3)'; ell(x, 2.7, -11.1, 1.5, 1.1); ell(x, 5.8, -11.1, 1.5, 1.1);
  x.fillStyle = '#6a2ac0'; ell(x, 2.7, -11.4, 0.85, 1.25); ell(x, 5.8, -11.4, 0.85, 1.25);
  x.fillStyle = '#fff'; circ(x, 2.45, -11.9, 0.36); circ(x, 5.55, -11.9, 0.36);
  x.strokeStyle = '#1a0e2a'; x.lineWidth = 0.8; line(x, 1.6, -13.4, 3.7, -13); line(x, 4.8, -13, 6.9, -13.5);
  x.strokeStyle = '#7a4a6a'; x.lineWidth = 0.6; line(x, 3.4, -8.5, 5.4, -8.7);
  // волосы сверху с пробором и прядь у лица
  x.beginPath(); x.moveTo(-5.6, -10); x.quadraticCurveTo(-6.6, -19.4, 1.4, -19.4); x.quadraticCurveTo(7.8, -19, 8, -12.6);
  x.quadraticCurveTo(7.6, -15.2, 5.2, -15.8); x.quadraticCurveTo(2.4, -14.4, -0.4, -15.4); x.quadraticCurveTo(-2.8, -13.6, -3.6, -9.6); x.closePath();
  x.fillStyle = lg(x, -4, -19, 6, -12, [[0, '#4a3a68'], [1, '#160c24']]); x.fill();
  x.strokeStyle = '#05030a'; x.lineWidth = 0.8; x.stroke();
  x.strokeStyle = 'rgba(190,150,255,.55)'; x.lineWidth = 0.6;
  x.beginPath(); x.moveTo(-3, -17.6); x.quadraticCurveTo(0.6, -18.8, 4.4, -17.6); x.stroke();
  x.fillStyle = '#1e1230';
  x.beginPath(); x.moveTo(7.2, -14.6); x.quadraticCurveTo(8.8, -10, 7.8, -6.4); x.lineTo(6.8, -8.4); x.quadraticCurveTo(7.2, -11, 6.2, -14); x.closePath(); x.fill();
  // обруч с камнем
  glowOn(x, '#b77cff', 3); x.fillStyle = '#d4a8ff'; circ(x, 3.2, -16.2, 1); glowOff(x);
  // воротник спереди
  x.beginPath(); x.moveTo(6.2, -7); x.lineTo(8.6, -12.6); x.quadraticCurveTo(6.8, -9.4, 3.8, -7.6); x.closePath();
  x.fillStyle = '#5a3a8a'; x.fill(); x.strokeStyle = '#05030a'; x.lineWidth = 0.9; x.stroke();
}

// Пивной Кот-сан — рыжий кот с чёлкой, соломенная шляпа-конус, синее кимоно, хвост
const FUR0 = '#f0b06a', FUR1 = '#c27a3a', FUR_LINE = '#5a3214', CREAM = '#fbe6c8';
function bodyCat(x, f, walk) {
  const { st, bob } = walkOf(f, walk);
  x.translate(0, -bob);
  // полосатый хвост
  x.lineCap = 'round';
  const tail = () => { x.beginPath(); x.moveTo(-5, 10); x.bezierCurveTo(-13, 10, -15 - st, 0, -11.5 - st * 1.6, -5.5); x.stroke(); };
  x.strokeStyle = FUR_LINE; x.lineWidth = 5; tail();
  x.strokeStyle = FUR0; x.lineWidth = 3.4; tail();
  x.strokeStyle = FUR1; x.lineWidth = 3.4; x.setLineDash([1.6, 2.6]); tail(); x.setLineDash([]);
  x.fillStyle = CREAM; circ(x, -11.5 - st * 1.6, -5.5, 1.7);
  // лапы
  x.fillStyle = FUR0; x.strokeStyle = FUR_LINE; x.lineWidth = 0.9;
  for (const px of [-3.5 + st * 3, 4 - st * 3]) {
    x.beginPath(); x.ellipse(px, 17.4 + bob, 3.6, 2.2, 0, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = CREAM; ell(x, px + 1.4, 18 + bob, 1.6, 1); x.fillStyle = FUR0;
  }
  // кимоно
  robe(x, '#3a56b0', '#141f4a', '#0a1030');
  // запах кимоно (белая окантовка буквой V)
  x.strokeStyle = '#eef2fb'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(-4.2, -6.6); x.lineTo(2.6, 3); x.moveTo(5.6, -6.6); x.lineTo(2.6, 3); x.stroke();
  x.fillStyle = CREAM; x.beginPath(); x.moveTo(-3.2, -6.8); x.lineTo(4.6, -6.8); x.lineTo(2.6, -1.4); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 0.8;
  for (const [cx, cy] of [[-5, 8], [5.5, 11], [-1.6, 12.6]]) { x.beginPath(); x.arc(cx, cy, 1.4, 0, TAU); x.stroke(); }
  // соломенный пояс
  x.fillStyle = '#d9b058'; x.fillRect(-7.6, 2.6, 15.4, 2.2);
  x.strokeStyle = '#8a6420'; x.lineWidth = 0.5; for (let i = -7; i < 8; i += 1.4) line(x, i, 2.6, i + 0.8, 4.8);
  x.fillStyle = '#d9b058'; x.beginPath(); x.moveTo(-4, 4.4); x.lineTo(-5.4, 9); x.lineTo(-3.6, 8.6); x.lineTo(-2.8, 4.6); x.closePath(); x.fill();
  // голова: рыжая морда
  x.beginPath(); x.ellipse(1, -11.6, 7.2, 6.6, 0, 0, TAU);
  x.fillStyle = rg(x, -1, -14, 1, 1, -11.6, 7.6, [[0, '#f8c488'], [1, FUR1]]); x.fill();
  x.strokeStyle = FUR_LINE; x.lineWidth = 1.1; x.stroke();
  // полоски на щеке
  x.strokeStyle = 'rgba(150,80,30,.55)'; x.lineWidth = 0.8;
  line(x, -5.6, -11.5, -3.4, -11.1); line(x, -5.8, -9.6, -3.6, -9.6);
  // светлая мордочка
  x.fillStyle = CREAM; ell(x, 4.4, -8.6, 3.6, 2.6);
  // чёлка «под горшок»
  x.beginPath(); x.moveTo(-6, -12.6); x.quadraticCurveTo(-5.6, -18.2, 1, -18.4); x.quadraticCurveTo(7.6, -18.2, 8, -12.6);
  x.lineTo(6.8, -13.6); x.lineTo(5.6, -12.4); x.lineTo(4.4, -13.6); x.lineTo(3.2, -12.4); x.lineTo(2, -13.6); x.lineTo(0.8, -12.4); x.lineTo(-0.4, -13.6); x.lineTo(-1.6, -12.4); x.lineTo(-2.8, -13.6); x.lineTo(-4, -12.4); x.lineTo(-5, -13.4); x.closePath();
  x.fillStyle = lg(x, 0, -18, 0, -12, [[0, '#d88a44'], [1, '#a65e24']]); x.fill();
  x.strokeStyle = FUR_LINE; x.lineWidth = 0.8; x.stroke();
  // спокойные кошачьи глаза
  x.fillStyle = '#2a1a10'; ell(x, 2.4, -10.9, 1.25, 1.5); ell(x, 6, -10.9, 1.25, 1.5);
  x.fillStyle = '#fff'; circ(x, 2.05, -11.5, 0.45); circ(x, 5.65, -11.5, 0.45);
  x.strokeStyle = FUR_LINE; x.lineWidth = 0.6; line(x, 1.2, -12.3, 3.6, -12.4); line(x, 4.8, -12.4, 7.2, -12.3);
  // нос, рот-«w», усы
  x.fillStyle = '#e88a8a'; x.beginPath(); x.moveTo(3.4, -9); x.lineTo(5.2, -9); x.lineTo(4.3, -7.9); x.closePath(); x.fill();
  x.strokeStyle = '#5a3214'; x.lineWidth = 0.6;
  x.beginPath(); x.moveTo(4.3, -7.9); x.quadraticCurveTo(3.8, -6.9, 3, -7.3); x.moveTo(4.3, -7.9); x.quadraticCurveTo(4.8, -6.9, 5.6, -7.3); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 0.45;
  line(x, 6.6, -8.4, 10.2, -9.2); line(x, 6.6, -7.6, 10.2, -7.4); line(x, 1.6, -8.4, -1.4, -9);
  // завязки шляпы под подбородком
  x.strokeStyle = '#8a6420'; x.lineWidth = 0.6;
  x.beginPath(); x.moveTo(-6.4, -16.4); x.quadraticCurveTo(-4, -6, 1.6, -4.4); x.quadraticCurveTo(6.6, -6, 8.6, -16.4); x.stroke();
  x.fillStyle = '#d9b058'; circ(x, 1.6, -4.4, 0.8);
  // соломенная шляпа-конус
  x.save(); x.translate(0, -1.4); x.scale(1.06, 1);
  x.beginPath(); x.moveTo(-12.6, -15.6); x.quadraticCurveTo(1, -12.4, 14.6, -15.6); x.lineTo(1, -27.6); x.closePath();
  x.fillStyle = lg(x, 0, -28, 0, -14, [[0, '#ffe08a'], [0.6, '#e8b85a'], [1, '#b8862e']]); x.fill();
  x.strokeStyle = '#6b4a14'; x.lineWidth = 1.1; x.stroke();
  x.strokeStyle = 'rgba(107,74,20,.55)'; x.lineWidth = 0.55;
  for (const k of [0.3, 0.55, 0.78]) { x.beginPath(); x.moveTo(1 + (-12.6 - 1) * k, -27.6 + 12 * k); x.quadraticCurveTo(1, -27.6 + 15 * k, 1 + 13.6 * k, -27.6 + 12 * k); x.stroke(); }
  for (const tx of [-7, -3, 5, 9]) line(x, 1, -27.6, tx, -14.6);
  x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.moveTo(1, -27); x.lineTo(-5, -17.4); x.lineTo(-2, -17.2); x.closePath(); x.fill();
  x.restore();
}

// Кружка пива: держим за ручку, кружка справа от лапы
function drawMug(x, fl, t) {
  // ручка
  x.strokeStyle = '#5a3a14'; x.lineWidth = 2.6; x.beginPath(); x.arc(1.6, -4.4, 2.8, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
  x.strokeStyle = '#d9c6a0'; x.lineWidth = 1.4; x.beginPath(); x.arc(1.6, -4.4, 2.8, Math.PI * 0.5, Math.PI * 1.5); x.stroke();
  // стекло и пиво
  rrect(x, 1.4, -10, 8, 10.4, 1.4);
  x.fillStyle = lg(x, 1.4, 0, 9.4, 0, [[0, '#ffcf4a'], [0.5, '#f0a020'], [1, '#c06a10']]); x.fill();
  x.strokeStyle = '#5a3a14'; x.lineWidth = 0.9; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(2.6, -8.6, 1.1, 7.4);
  // пузырьки поднимаются
  x.fillStyle = 'rgba(255,250,220,.85)';
  for (let i = 0; i < 4; i++) { const ph = (t * 0.9 + i * 0.27) % 1; circ(x, 4.4 + i * 1.3, -0.8 - ph * 8, 0.45); }
  // пена
  x.fillStyle = '#fffaf0'; x.strokeStyle = '#c8b898'; x.lineWidth = 0.5;
  x.beginPath(); x.moveTo(0.8, -9.6);
  x.arc(2.6, -10.2, 1.9, Math.PI, 0); x.arc(5.4, -10.9, 2.1, Math.PI, 0); x.arc(8.2, -10.2, 1.8, Math.PI, 0);
  x.lineTo(10, -9.2); x.lineTo(0.8, -9.2); x.closePath(); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(9.6, -7.4, 0.9, 1.6, 0, 0, TAU); x.fill();
  // брызги пены при глотке
  if (fl > 0.25) {
    x.fillStyle = 'rgba(255,250,235,' + fl.toFixed(2) + ')';
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45, d = 3 + fl * 5; circ(x, 5.4 + Math.cos(a) * d, -12 + Math.sin(a) * d, 0.8); }
  }
  return -11;
}
function poseCat(P) {
  let phi = P.phi0 + Math.sin(P.t * 1.6) * 0.04 + P.st * 0.1, th = 0.05 + Math.sin(P.t * 1.6) * 0.05, fl = 0;
  if (P.atk >= 0) { const k = Math.sin(Math.PI * Math.min(1, P.atk * 1.1)); phi += 1.25 * k; th -= 1.05 * k; fl = k; }
  return { phi, th, fl, show: 1 };
}

/* =====================================================
   ОРУЖИЕ В РУКЕ (рисуется каждый кадр)
   Координаты: рукоять в точке (0,0), оружие смотрит вверх.
   ===================================================== */
function drawStaffMage(x, fl, t) {
  x.strokeStyle = '#3d220e'; x.lineWidth = 3; line(x, 0, 12.5, 0, -16);
  x.strokeStyle = '#9a6634'; x.lineWidth = 1.8; line(x, 0, 12.5, 0, -16);
  x.strokeStyle = 'rgba(255,230,190,.4)'; x.lineWidth = 0.5; line(x, -0.4, 11, -0.4, -15);
  x.strokeStyle = '#ffc24a'; x.lineWidth = 0.9; line(x, -1.5, -13.2, 1.5, -13.8); line(x, -1.5, -11.8, 1.5, -12.4);
  x.strokeStyle = '#ffc24a'; x.lineWidth = 1.3;
  x.beginPath(); x.moveTo(-0.6, -15.6); x.quadraticCurveTo(-4.8, -18.4, -2.3, -22.8); x.moveTo(0.6, -15.6); x.quadraticCurveTo(4.8, -18.4, 2.3, -22.8); x.stroke();
  const r = 3.7 * (1 + fl * 0.3);
  glowOn(x, '#ffb02e', 5 + fl * 10);
  x.fillStyle = rg(x, -1, -20.4, 0.5, 0, -19.2, r, [[0, '#fffbe6'], [0.5, '#ffd56e'], [1, '#ff9a1e']]); circ(x, 0, -19.2, r);
  glowOff(x);
  x.fillStyle = 'rgba(255,255,255,.9)'; circ(x, -1.2, -20.4, 1);
  x.fillStyle = '#fff3c0';
  for (let i = 0; i < 3; i++) {
    const a = t * 2.6 + i * TAU / 3, tw = 0.5 + 0.5 * Math.sin(t * 7 + i * 2);
    x.globalAlpha = 0.4 + 0.6 * tw; star4(x, Math.cos(a) * 6.2, -19.2 + Math.sin(a) * 2.6, 0.8 + tw * 0.9 + fl);
  }
  x.globalAlpha = 1;
  return -19.2;
}
function drawSword(x, t) {
  x.beginPath(); x.moveTo(-1.9, -2.4); x.lineTo(-1.7, -20); x.lineTo(0, -24.6); x.lineTo(1.7, -20); x.lineTo(1.9, -2.4); x.closePath();
  x.fillStyle = lg(x, -2, 0, 2, 0, [[0, '#ffffff'], [0.5, '#d6deea'], [1, '#8a96ac']]); x.fill();
  x.strokeStyle = '#2a2f45'; x.lineWidth = 0.9; x.stroke();
  x.strokeStyle = 'rgba(90,105,130,.75)'; x.lineWidth = 0.8; line(x, 0, -3.4, 0, -19);
  x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 0.5; line(x, -1.15, -3.2, -1.05, -19.6);
  // блик бежит по клинку
  const ph = (t * 0.55) % 1.8;
  if (ph < 1) { x.fillStyle = '#ffffff'; x.globalAlpha = Math.sin(ph * Math.PI); star4(x, -0.4, -4 - ph * 17, 1.9); x.globalAlpha = 1; }
  x.fillStyle = lg(x, 0, -3.6, 0, -1.2, [[0, '#fff1a8'], [1, '#c98a1c']]); rrect(x, -5.4, -3.6, 10.8, 2.3, 1.1); x.fill();
  x.strokeStyle = '#6b4300'; x.lineWidth = 0.7; x.stroke();
  x.fillStyle = '#ffc24a'; circ(x, -5.6, -2.45, 1.1); circ(x, 5.6, -2.45, 1.1);
  x.fillStyle = '#ff3d6e'; circ(x, 0, -2.45, 0.85);
  x.fillStyle = '#4a2c1d'; rrect(x, -1.1, -1.4, 2.2, 5.8, 0.8); x.fill();
  x.fillStyle = '#ffc24a'; circ(x, 0, 5.3, 1.6); x.strokeStyle = '#6b4300'; x.lineWidth = 0.6; x.beginPath(); x.arc(0, 5.3, 1.6, 0, TAU); x.stroke();
  return -24.6;
}
function drawDagger(x) {
  x.beginPath(); x.moveTo(-1.3, -1.6); x.quadraticCurveTo(-1.7, -7.5, 0.3, -12.4); x.quadraticCurveTo(1.6, -7.5, 1.3, -1.6); x.closePath();
  x.fillStyle = lg(x, -1.5, 0, 1.5, 0, [[0, '#ffffff'], [1, '#93a0be']]); x.fill();
  x.strokeStyle = '#2a2f45'; x.lineWidth = 0.7; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 0.45; line(x, -0.7, -2.4, -0.5, -10.4);
  x.fillStyle = '#c9a46b'; rrect(x, -3.3, -2.4, 6.6, 1.5, 0.7); x.fill(); x.strokeStyle = '#5a3a14'; x.lineWidth = 0.5; x.stroke();
  x.fillStyle = '#2a1a12'; rrect(x, -0.9, -1, 1.8, 4.6, 0.6); x.fill();
  x.fillStyle = '#c9a46b'; circ(x, 0, 4, 1.2);
  return -12.4;
}
function drawStaffDruid(x, fl, t) {
  const path = () => { x.beginPath(); x.moveTo(0.4, 12.5); x.bezierCurveTo(-1.8, 6, 1.9, 0, -0.4, -6); x.bezierCurveTo(-1.9, -11, 1.4, -13, 0, -16); };
  x.strokeStyle = '#2a1a08'; x.lineWidth = 3.4; path(); x.stroke();
  x.strokeStyle = '#8a5a2c'; x.lineWidth = 2; path(); x.stroke();
  x.strokeStyle = 'rgba(255,220,160,.35)'; x.lineWidth = 0.6; path(); x.stroke();
  x.strokeStyle = '#2a1a08'; x.lineWidth = 2.2;
  x.beginPath(); x.moveTo(0, -16); x.quadraticCurveTo(-4.6, -18.6, -2.6, -24); x.moveTo(0, -16); x.quadraticCurveTo(4.8, -18.2, 2.8, -23.4); x.stroke();
  x.strokeStyle = '#7a4e26'; x.lineWidth = 1.2; x.stroke();
  const s = 1 + fl * 0.3, cy = -19.8;
  glowOn(x, '#7dff6a', 4 + fl * 12);
  x.fillStyle = lg(x, -2, cy - 4, 2, cy + 3, [[0, '#f0ffe0'], [0.5, '#8dff5a'], [1, '#2fa83a']]);
  x.beginPath(); x.moveTo(0, cy - 4.4 * s); x.lineTo(2.5 * s, cy); x.lineTo(0, cy + 3.4 * s); x.lineTo(-2.5 * s, cy); x.closePath(); x.fill();
  glowOff(x);
  x.strokeStyle = '#1d4a21'; x.lineWidth = 0.6; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.moveTo(0, cy - 4.4 * s); x.lineTo(-2.5 * s, cy); x.lineTo(-0.4, cy - 0.4); x.closePath(); x.fill();
  leaf(x, -1.8, -6.2, -0.9, '#4fbf5a', 0.9); leaf(x, 1.9, 1.2, 0.8, '#6ad66a', 0.9); leaf(x, 1.5, -12.8, 0.7, '#4fbf5a', 0.8);
  for (let i = 0; i < 2; i++) {
    const a = t * 2.3 + i * Math.PI, z = Math.sin(a);
    x.globalAlpha = 0.6 + 0.4 * z;
    leaf(x, Math.cos(a) * 6.4, cy + z * 2.4, a * 1.5, '#a8ff7a', 0.75 + fl * 0.3);
  }
  x.globalAlpha = 1;
  return cy;
}
function drawStaffNecro(x, fl, t) {
  x.strokeStyle = '#0c0614'; x.lineWidth = 3; line(x, 0, 12.5, 0, -14);
  x.strokeStyle = '#4a3a5a'; x.lineWidth = 1.7; line(x, 0, 12.5, 0, -14);
  x.fillStyle = '#d9d0bc'; rrect(x, -1.6, -3.6, 3.2, 1.6, 0.6); x.fill(); rrect(x, -1.6, -9.6, 3.2, 1.6, 0.6); x.fill();
  x.strokeStyle = '#d9d0bc'; x.lineWidth = 1.1;
  x.beginPath(); x.moveTo(-0.5, -13.5); x.quadraticCurveTo(-4.4, -15, -3.6, -19.6); x.moveTo(0.5, -13.5); x.quadraticCurveTo(4.4, -15, 3.6, -19.6); x.stroke();
  // пламя душ
  const cy = -18, fh = 6.4 * (1 + fl * 0.9) * (0.88 + 0.12 * Math.sin(t * 13)), sw = Math.sin(t * 9) * 1.3;
  glowOn(x, '#b77cff', 6 + fl * 10);
  x.fillStyle = lg(x, 0, cy - 3 - fh, 0, cy - 2, [[0, 'rgba(183,124,255,0)'], [0.4, '#b77cff'], [1, '#f2e2ff']]);
  x.beginPath(); x.moveTo(-3, cy - 2.4); x.quadraticCurveTo(-3.8, cy - 2.4 - fh * 0.55, sw, cy - 2.4 - fh); x.quadraticCurveTo(3.8, cy - 2.4 - fh * 0.55, 3, cy - 2.4); x.closePath(); x.fill();
  glowOff(x);
  x.fillStyle = 'rgba(255,255,255,.85)';
  x.beginPath(); x.moveTo(-1.3, cy - 2.4); x.quadraticCurveTo(-1.5, cy - 2.4 - fh * 0.35, sw * 0.5, cy - 2.4 - fh * 0.55); x.quadraticCurveTo(1.5, cy - 2.4 - fh * 0.35, 1.3, cy - 2.4); x.closePath(); x.fill();
  // череп
  x.fillStyle = lg(x, 0, cy - 3.8, 0, cy + 3.6, [[0, '#fbf6ea'], [1, '#bdb39c']]);
  circ(x, 0, cy, 3.6); rrect(x, -2.1, cy + 2.2, 4.2, 2.2, 0.6); x.fill();
  x.strokeStyle = '#3a3428'; x.lineWidth = 0.6; x.beginPath(); x.arc(0, cy, 3.6, 0, TAU); x.stroke();
  x.fillStyle = '#1a0a26'; circ(x, -1.3, cy - 0.2, 1.05); circ(x, 1.3, cy - 0.2, 1.05);
  if (fl > 0.05) { glowOn(x, '#d9b8ff', 4); x.fillStyle = 'rgba(230,200,255,' + fl.toFixed(2) + ')'; circ(x, -1.3, cy - 0.2, 0.75); circ(x, 1.3, cy - 0.2, 0.75); glowOff(x); }
  x.strokeStyle = '#3a3428'; x.lineWidth = 0.4; line(x, -1, cy + 2.6, -1, cy + 4); line(x, 0, cy + 2.6, 0, cy + 4.2); line(x, 1, cy + 2.6, 1, cy + 4);
  // души кружат вокруг
  for (let i = 0; i < 2; i++) {
    const a = t * 3 + i * Math.PI, z = Math.sin(a);
    x.globalAlpha = 0.55 + 0.45 * z;
    glowOn(x, '#b77cff', 3); x.fillStyle = '#efe0ff'; circ(x, Math.cos(a) * 6.6, cy + z * 2.6, 0.9 + fl * 0.6); glowOff(x);
  }
  x.globalAlpha = 1;
  return cy;
}

/* ---------- позы: как двигаются рука и оружие ---------- */
const ease = (k) => 1 - Math.pow(1 - k, 3);
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const mix = (a, b, k) => a + (b - a) * k;


// phi — угол руки (0 — вниз, плюс — вперёд), th — наклон оружия (0 — вверх)
function poseCaster(P, base) {
  let phi = P.phi0 + Math.sin(P.t * 1.4) * 0.03 + P.st * 0.08, th = base + Math.sin(P.t * 1.7) * 0.05 + P.st * 0.06, fl = 0;
  if (P.atk >= 0) { const k = Math.sin(Math.PI * Math.min(1, P.atk * 1.15)); phi += 0.75 * k; th += 0.55 * k; fl = k; }
  return { phi, th, fl, show: 1 };
}
function poseKnight(P) {
  const ph0 = 0.7 + P.st * 0.1, th0 = -0.35 + Math.sin(P.t * 1.5) * 0.04 + P.st * 0.08;
  if (P.atk < 0) return { phi: ph0, th: th0, fl: 0, show: 1 };
  const a = P.atk;
  if (a < 0.14) { const k = easeIO(a / 0.14); return { phi: mix(ph0, 2.7, k), th: mix(th0, -2.5, k), fl: 0, show: 1 }; }
  if (a < 0.46) { const k = ease((a - 0.14) / 0.32); return { phi: mix(2.7, 1.0, k), th: mix(-2.5, 2.15, k), fl: 1, show: 1, swing: k }; }
  const k = easeIO((a - 0.46) / 0.54);
  return { phi: mix(1.0, ph0, k), th: mix(2.15, th0, k), fl: 0, show: 1 };
}
function poseRogue(P) {
  const ph0 = P.phi0 + 0.1 + P.st * 0.12, th0 = 0.75 + Math.sin(P.t * 2) * 0.05;
  if (P.atk < 0) return { phi: ph0, th: th0, fl: 0, show: 1 };
  const a = P.atk;
  let phi, th;
  if (a < 0.3) { const k = easeIO(a / 0.3); phi = mix(ph0, -0.6, k); th = mix(th0, -1, k); }
  else if (a < 0.55) { const k = ease((a - 0.3) / 0.25); phi = mix(-0.6, 1.6, k); th = mix(-1, 1.75, k); }
  else { const k = easeIO((a - 0.55) / 0.45); phi = mix(1.6, ph0, k); th = mix(1.75, th0, k); }
  const show = a < 0.44 ? 1 : a < 0.78 ? 0 : (a - 0.78) / 0.22;
  return { phi, th, fl: 0, show };
}

/* ---------- описание каждого героя ---------- */
export const HERO_LOOK = {
  mage:   { body: bodyMage,   ring: '255,194,74',  glow: 'amber',  sleeve: '#4a6ad8', sleeveLine: '#101a42', cuff: '#ffc24a', sh: [7, -5], arm: 8.9, phi0: 0.46, hand: SKIN1, handLine: SKIN_LINE, atk: 0.3,
            pose: (P) => poseCaster(P, 0), weapon: drawStaffMage },
  knight: { body: bodyKnight, ring: '120,170,255', glow: null,     sleeve: '#c9d1dc', sleeveLine: '#262c38', cuff: null, sh: [5, -4.5], arm: 9.2, phi0: 0.7, hand: '#e6ebf2', handLine: '#262c38', atk: 0.34,
            pose: poseKnight, weapon: (x, fl, t) => drawSword(x, t), trail: true },
  rogue:  { body: bodyRogue,  ring: '255,110,130', glow: null,     sleeve: '#3f7a60', sleeveLine: '#0c1a14', cuff: '#5a3418', sh: [6.4, -5], arm: 8.6, phi0: 0.5, hand: SKIN1, handLine: SKIN_LINE, atk: 0.26,
            pose: poseRogue, weapon: (x) => drawDagger(x) },
  druid:  { body: bodyDruid,  ring: '130,255,110', glow: 'green',  sleeve: '#9a7644', sleeveLine: '#2a1a08', cuff: '#4fbf5a', sh: [7, -5], arm: 8.9, phi0: 0.46, hand: SKIN1, handLine: SKIN_LINE, atk: 0.4,
            pose: (P) => poseCaster(P, -0.06), weapon: drawStaffDruid },
  necro:  { body: bodyNecro,  ring: '190,140,255', glow: 'purple', sleeve: '#33244f', sleeveLine: '#05030a', cuff: '#b77cff', sh: [7, -5], arm: 8.9, phi0: 0.46, hand: '#d8d0e8', handLine: '#4a3a66', atk: 0.42,
            pose: (P) => poseCaster(P, -0.05), weapon: drawStaffNecro },
  cat:    { body: bodyCat,    ring: '255,200,90',  glow: null,     sleeve: '#3a56b0', sleeveLine: '#0a1030', cuff: '#eef2fb', sh: [7, -5], arm: 8.9, phi0: 0.46, hand: FUR0, handLine: FUR_LINE, atk: 0.7,
            pose: poseCat, weapon: drawMug }
};

/**
 * Рисует руку и оружие героя. x — контекст, уже повёрнутый так,
 * что герой смотрит вправо и (0,0) — центр спрайта героя.
 * P = { atk: прогресс атаки 0..1 или -1, t: время в секундах, st, bob }
 * Возвращает точку свечения оружия (кончик посоха) в тех же координатах.
 */
export function drawHeroArm(x, id, P) {
  const L = HERO_LOOK[id] || HERO_LOOK.mage;
  const SX = L.sh[0], SY = L.sh[1], ARM = L.arm;
  const pose = L.pose({ ...P, phi0: L.phi0 });
  x.save();
  x.translate(0, -P.bob);
  const hx = SX + Math.sin(pose.phi) * ARM, hy = SY + Math.cos(pose.phi) * ARM;
  // след от взмаха меча
  if (L.trail && pose.swing !== undefined && pose.swing < 1) {
    const s1 = pose.swing, s0 = Math.max(0, s1 - 0.55), N = 12;
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
  // рукав
  x.lineCap = 'round';
  {
    // рукав: шире у плеча, уже у запястья, с манжетой
    const dx = hx - SX, dy = hy - SY, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w0 = 2.5, w1 = 1.8;
    x.beginPath();
    x.moveTo(SX + nx * w0, SY + ny * w0); x.lineTo(hx + nx * w1, hy + ny * w1);
    x.lineTo(hx - nx * w1, hy - ny * w1); x.lineTo(SX - nx * w0, SY - ny * w0);
    x.arc(SX, SY, w0, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
    x.closePath();
    x.fillStyle = L.sleeve; x.fill(); x.strokeStyle = L.sleeveLine; x.lineWidth = 0.9; x.stroke();
    if (L.cuff) {
      const cx0 = hx - dx / d * 1.6, cy0 = hy - dy / d * 1.6;
      x.strokeStyle = L.cuff; x.lineWidth = 1.1; line(x, cx0 + nx * 2, cy0 + ny * 2, cx0 - nx * 2, cy0 - ny * 2);
    }
  }
  // оружие
  let tipY = 0;
  if (pose.show > 0) {
    x.save(); x.translate(hx, hy); x.rotate(pose.th);
    if (pose.show < 1) { x.globalAlpha = pose.show; x.scale(0.4 + 0.6 * pose.show, 0.4 + 0.6 * pose.show); }
    tipY = L.weapon(x, pose.fl, P.t);
    x.restore();
  }
  // кисть поверх рукояти
  x.globalAlpha = 1;
  x.fillStyle = L.hand; x.strokeStyle = L.handLine; x.lineWidth = 0.9;
  x.beginPath(); x.arc(hx, hy, 2.4, 0, TAU); x.fill(); x.stroke();
  x.restore();
  return { x: hx + Math.sin(pose.th) * -tipY, y: hy - P.bob + Math.cos(pose.th) * tipY, fl: pose.fl };
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

// Портреты для экрана выбора героя
export function heroPortrait(id, t) {
  const L = HERO_LOOK[id] || HERO_LOOK.mage;
  return mk(BODY_W, BODY_H, (x) => {
    L.body(x, 0, 0);
    drawHeroArm(x, id, { atk: -1, t: t || 0.6, st: 0, bob: 0 });
  }, 5).toDataURL();
}

// Для рисования оружия «вживую»: размытие свечения зависит от плотности пикселей
export function setLiveGlow(dpr) { setGlowScale(dpr); }

// Маленькая картинка героя для лидерборда (рисуется один раз)
const faceCache = {};
export function heroFace(id) {
  if (!HERO_LOOK[id]) return '';
  return faceCache[id] || (faceCache[id] = heroPortrait(id));
}
