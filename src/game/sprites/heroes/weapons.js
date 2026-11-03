/* =====================================================
   ОРУЖИЕ В РУКЕ (рисуется каждый кадр)
   Координаты: рукоять в точке (0,0), оружие смотрит вверх.
   Функция возвращает Y кончика — туда движок ставит свечение.
   ===================================================== */
import { TAU, rg, lg, circ, rrect, glowOn, glowOff, line } from '../../gfx.js';
import { leaf, star4 } from './parts.js';

// Кружка пива: держим за ручку, кружка справа от лапы
export function drawMug(x, fl, t) {
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

export function drawStaffMage(x, fl, t) {
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
export function drawSword(x, t) {
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
export function drawDagger(x) {
  x.beginPath(); x.moveTo(-1.3, -1.6); x.quadraticCurveTo(-1.7, -7.5, 0.3, -12.4); x.quadraticCurveTo(1.6, -7.5, 1.3, -1.6); x.closePath();
  x.fillStyle = lg(x, -1.5, 0, 1.5, 0, [[0, '#ffffff'], [1, '#93a0be']]); x.fill();
  x.strokeStyle = '#2a2f45'; x.lineWidth = 0.7; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 0.45; line(x, -0.7, -2.4, -0.5, -10.4);
  x.fillStyle = '#c9a46b'; rrect(x, -3.3, -2.4, 6.6, 1.5, 0.7); x.fill(); x.strokeStyle = '#5a3a14'; x.lineWidth = 0.5; x.stroke();
  x.fillStyle = '#2a1a12'; rrect(x, -0.9, -1, 1.8, 4.6, 0.6); x.fill();
  x.fillStyle = '#c9a46b'; circ(x, 0, 4, 1.2);
  return -12.4;
}
export function drawStaffDruid(x, fl, t) {
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
export function drawStaffNecro(x, fl, t) {
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

