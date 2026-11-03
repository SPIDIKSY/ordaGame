/* =====================================================
   ОБЩИЕ ДЕТАЛИ ГЕРОЕВ
   Палитра и куски, из которых собраны все тела: лицо, глаза,
   плащ, мантия, сапоги. Нужны и телам, и оружию в руке.
   ===================================================== */
import { TAU, rg, lg, ell, circ, line } from '../../gfx.js';

export const SKIN0 = '#ffe6cc', SKIN1 = '#e7a37b', SKIN_LINE = '#6b3d2a';
export const FUR0 = '#f0b06a', FUR1 = '#c27a3a', FUR_LINE = '#5a3214', CREAM = '#fbe6c8';
export const BODY_W = 48, BODY_H = 76;
// Цвет обводки героя: тело получает её готовой (outline), руку обводим вручную
export const OUTLINE = 'rgba(10,13,20,.75)';

export function walkOf(f, walk) {
  return { st: Math.sin(f * TAU) * walk, bob: Math.abs(Math.cos(f * TAU)) * walk * 1.4 };
}
export function face(x, s0, s1, lineC) {
  x.beginPath(); x.arc(1, -12, 6.4, 0, TAU);
  x.fillStyle = rg(x, -1, -14, 1, 1, -12, 7, [[0, s0 || SKIN0], [1, s1 || SKIN1]]); x.fill();
  x.strokeStyle = lineC || SKIN_LINE; x.lineWidth = 1.1; x.stroke();
}
export function eyes(x, col) {
  x.fillStyle = col || '#1d1420'; ell(x, 2.7, -11.4, 1.1, 1.65); ell(x, 5.8, -11.4, 1.1, 1.65);
  x.fillStyle = '#fff'; circ(x, 2.4, -12.1, 0.45); circ(x, 5.5, -12.1, 0.45);
}
export function blush(x, a) { x.fillStyle = 'rgba(255,110,110,' + (a || 0.45) + ')'; circ(x, 6.4, -9.2, 1.2); circ(x, 0.9, -9.2, 1.2); }
export function cape(x, st, c0, c1, lineC) {
  x.beginPath(); x.moveTo(-4, -8); x.quadraticCurveTo(-13 - st * 1.5, 2, -12 + st, 15); x.quadraticCurveTo(-5, 17, 1, 14); x.lineTo(3, -6); x.closePath();
  x.fillStyle = lg(x, 0, -8, 0, 16, [[0, c0], [1, c1]]); x.fill();
  x.strokeStyle = lineC || 'rgba(0,0,0,.55)'; x.lineWidth = 1.2; x.stroke();
}
export function robe(x, c0, c1, lineC) {
  x.beginPath(); x.moveTo(-5.5, -7); x.lineTo(5.5, -7); x.quadraticCurveTo(9.5, 6, 9.8, 15); x.quadraticCurveTo(0, 18.4, -9.8, 15); x.quadraticCurveTo(-9.5, 6, -5.5, -7); x.closePath();
  x.fillStyle = lg(x, -8, -7, 8, 15, [[0, c0], [1, c1]]); x.fill();
  x.strokeStyle = lineC; x.lineWidth = 1.3; x.stroke();
}
export function boots(x, st, bob, c0, c1) {
  x.fillStyle = c1 ? lg(x, 0, 15, 0, 20, [[0, c0], [1, c1]]) : c0;
  ell(x, -3.5 + st * 3, 17.6 + bob, 3.7, 2.2); ell(x, 4 - st * 3, 17.6 + bob, 3.7, 2.2);
}
export function leaf(x, cx, cy, rot, col, s) {
  s = s || 1;
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
  x.fillStyle = col; x.beginPath(); x.moveTo(-2.4, 0); x.quadraticCurveTo(0, -1.7, 2.4, 0); x.quadraticCurveTo(0, 1.7, -2.4, 0); x.fill();
  x.strokeStyle = 'rgba(20,60,20,.55)'; x.lineWidth = 0.4; line(x, -2, 0, 2, 0);
  x.restore();
}
export function star4(x, cx, cy, r) {
  x.beginPath(); x.moveTo(cx, cy - r);
  x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r);
  x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill();
}

