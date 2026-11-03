/* =====================================================
   МЕЛКИЕ ВРАГИ: слизень, летучая мышь, паук, студень, бес
   ===================================================== */
import { TAU, rg, lg, ell, circ, star, glowOn, glowOff, line } from '../../gfx.js';
import { eyesCute, slimeBody } from './parts.js';

export function drawSlime(x, R, f) {
  slimeBody(x, R, f, '#c6f7a6', '#3f9a3c', '#1d4a21', () => {
    eyesCute(x, R * 0.14, -R * 0.12, R);
    x.strokeStyle = '#141019'; x.lineWidth = R * 0.08;
    x.beginPath(); x.arc(R * 0.14, R * 0.12, R * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  });
}
export function drawBat(x, R, f) {
  const w = Math.sin(f * TAU);
  const ty = -R * (0.5 + 0.8 * w);
  for (const s of [-1, 1]) {
    x.save(); x.scale(s, 1);
    x.beginPath();
    x.moveTo(R * 0.35, -R * 0.35);
    x.quadraticCurveTo(R * 1.15, ty - R * 0.6, R * 2.15, ty);
    x.quadraticCurveTo(R * 1.95, ty * 0.45 + R * 0.25, R * 1.62, ty * 0.25 + R * 0.55);
    x.quadraticCurveTo(R * 1.35, ty * 0.2 + R * 0.2, R * 1.05, R * 0.5);
    x.quadraticCurveTo(R * 0.75, R * 0.2, R * 0.35, R * 0.4);
    x.closePath();
    x.fillStyle = lg(x, 0, ty - R * 0.5, 0, R * 0.6, [[0, '#a77cf0'], [1, '#43247e']]);
    x.fill(); x.lineWidth = R * 0.12; x.strokeStyle = '#1e0f3a'; x.stroke();
    x.strokeStyle = 'rgba(20,8,40,.5)'; x.lineWidth = R * 0.07;
    line(x, R * 0.4, -R * 0.3, R * 1.62, ty * 0.25 + R * 0.55);
    line(x, R * 0.4, -R * 0.3, R * 1.05, R * 0.5);
    x.restore();
  }
  x.fillStyle = '#5b3a9c'; x.strokeStyle = '#1e0f3a'; x.lineWidth = R * 0.12;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * R * 0.58, -R * 0.42); x.lineTo(s * R * 0.48, -R * 1.25); x.lineTo(s * R * 0.1, -R * 0.75); x.closePath(); x.fill(); x.stroke(); }
  x.beginPath(); x.arc(0, 0, R * 0.85, 0, TAU);
  x.fillStyle = rg(x, -R * 0.3, -R * 0.35, R * 0.1, 0, 0, R, [[0, '#9a74dd'], [1, '#3b2170']]); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.12)'; ell(x, 0, R * 0.32, R * 0.45, R * 0.32);
  glowOn(x, '#ff3b5c', R * 0.6);
  x.fillStyle = '#ff5f7a'; ell(x, -R * 0.32, -R * 0.1, R * 0.17, R * 0.12, 0.35); ell(x, R * 0.32, -R * 0.1, R * 0.17, R * 0.12, -0.35);
  glowOff(x);
  x.fillStyle = '#fff'; circ(x, -R * 0.36, -R * 0.14, R * 0.05); circ(x, R * 0.28, -R * 0.14, R * 0.05);
  x.beginPath(); x.moveTo(-R * 0.2, R * 0.22); x.lineTo(-R * 0.1, R * 0.22); x.lineTo(-R * 0.15, R * 0.42); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(R * 0.1, R * 0.22); x.lineTo(R * 0.2, R * 0.22); x.lineTo(R * 0.15, R * 0.42); x.closePath(); x.fill();
}
// Паук: вид чуть сверху, голова справа. 8 ног по 4 с каждой стороны шагают через одну,
// как у настоящего паука, и на шаге стопа приподнимается. Дальние ноги рисуются за
// телом, ближние — поверх брюшка, но под головой. crown — королева: корона, пятна на брюшке, клыки крупнее.
export function drawSpider(x, R, f, c0, c1, crown) {
  const ph = f * TAU, bob = Math.abs(Math.sin(ph * 2)) * R * 0.05, by = -bob;
  x.lineCap = 'round'; x.lineJoin = 'round';
  const leg = (side, i) => {
    const sw = Math.sin(ph + (i % 2 ? Math.PI : 0) + (side > 0 ? Math.PI : 0));
    const ax = R * (0.32 - i * 0.24), ay = side * R * 0.16 + by;
    const phi = side * ([0.72, 1.28, 1.86, 2.42][i] + sw * 0.16), c = Math.cos(phi), s = Math.sin(phi);
    // колено дальних ног торчит вверх над спиной, у ближних — уходит вниз, чтобы не перечёркивать морду
    const kx = ax + c * R * 0.52, ky = ay + s * R * 0.52 + (side < 0 ? -R * 0.3 : R * 0.08);
    const fx = ax + c * R * 1.02, fy = ay + s * R * 0.96 - Math.max(0, sw) * R * 0.14;
    x.strokeStyle = '#120818'; x.lineWidth = R * 0.15;
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(kx, ky); x.lineTo(fx, fy); x.stroke();
    x.strokeStyle = c0; x.globalAlpha = 0.35; x.lineWidth = R * 0.06;
    x.beginPath(); x.moveTo(ax, ay); x.lineTo(kx, ky); x.lineTo(fx, fy); x.stroke();
    x.globalAlpha = 1; x.fillStyle = '#120818'; circ(x, kx, ky, R * 0.09);
  };
  for (let i = 0; i < 4; i++) leg(-1, i);
  // брюшко с узором «песочные часы»
  x.fillStyle = rg(x, -R * 0.62, by - R * 0.3, R * 0.08, -R * 0.45, by, R * 0.85, [[0, c0], [1, c1]]);
  x.beginPath(); x.ellipse(-R * 0.45, by, R * 0.72, R * 0.6, 0, 0, TAU); x.fill();
  x.strokeStyle = '#0c0612'; x.lineWidth = R * 0.08; x.stroke();
  x.fillStyle = '#ff4a6a';
  x.beginPath(); x.moveTo(-R * 0.6, by - R * 0.32); x.lineTo(-R * 0.3, by - R * 0.32); x.lineTo(-R * 0.45, by - R * 0.03); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-R * 0.6, by + R * 0.32); x.lineTo(-R * 0.3, by + R * 0.32); x.lineTo(-R * 0.45, by + R * 0.03); x.closePath(); x.fill();
  if (crown) { x.fillStyle = 'rgba(255,170,220,.85)'; circ(x, -R * 0.82, by - R * 0.12, R * 0.08); circ(x, -R * 0.78, by + R * 0.22, R * 0.07); circ(x, -R * 0.12, by - R * 0.3, R * 0.06); circ(x, -R * 0.14, by + R * 0.3, R * 0.06); }
  x.fillStyle = 'rgba(255,255,255,.3)'; ell(x, -R * 0.66, by - R * 0.34, R * 0.2, R * 0.1, -0.4);
  for (let i = 0; i < 4; i++) leg(1, i);
  // голова
  const hx = R * 0.36, hy = by * 0.6;
  x.fillStyle = rg(x, hx - R * 0.1, hy - R * 0.2, R * 0.05, hx, hy, R * 0.5, [[0, c0], [1, c1]]);
  x.beginPath(); x.arc(hx, hy, R * 0.42, 0, TAU); x.fill(); x.stroke();
  // клыки
  const fl = crown ? 1.4 : 1;
  x.fillStyle = '#f2ecdf';
  for (const dx of [0.08, 0.3]) { x.beginPath(); x.moveTo(hx + R * (dx - 0.06), hy + R * 0.3); x.lineTo(hx + R * dx, hy + R * (0.3 + 0.24 * fl)); x.lineTo(hx + R * (dx + 0.06), hy + R * 0.3); x.closePath(); x.fill(); }
  eyesCute(x, hx + R * 0.06, hy - R * 0.04, R * 0.62);
  glowOn(x, '#ff3b5c', R * 0.3); x.fillStyle = '#ff6a84';
  circ(x, hx - R * 0.08, hy - R * 0.3, R * 0.05); circ(x, hx + R * 0.2, hy - R * 0.32, R * 0.05);
  glowOff(x);
  if (crown) {
    const cy = hy - R * 0.36, cx = hx;
    x.beginPath(); x.moveTo(cx - R * 0.3, cy); x.lineTo(cx - R * 0.34, cy - R * 0.32); x.lineTo(cx - R * 0.15, cy - R * 0.16);
    x.lineTo(cx, cy - R * 0.4); x.lineTo(cx + R * 0.15, cy - R * 0.16); x.lineTo(cx + R * 0.34, cy - R * 0.32); x.lineTo(cx + R * 0.3, cy); x.closePath();
    x.fillStyle = lg(x, 0, cy - R * 0.4, 0, cy, [[0, '#fff1a8'], [1, '#e09a14']]); x.fill();
    x.strokeStyle = '#7a4a00'; x.lineWidth = R * 0.04; x.stroke();
    x.fillStyle = '#ff3d6e'; circ(x, cx, cy - R * 0.1, R * 0.06);
  }
}
export function drawJelly(x, R, f) {
  slimeBody(x, R, f, '#d8f2ff', '#2f6fd0', '#123a7a', () => {
    x.fillStyle = 'rgba(150,235,120,.6)';
    circ(x, -R * 0.38, R * 0.25, R * 0.17); circ(x, R * 0.42, R * 0.3, R * 0.13); circ(x, R * 0.05, R * 0.45, R * 0.11);
    eyesCute(x, R * 0.14, -R * 0.22, R * 0.9);
    x.strokeStyle = '#141019'; x.lineWidth = R * 0.07;
    x.beginPath(); x.arc(R * 0.14, R * 0.02, R * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  });
}
export function drawImp(x, R, f) {
  const b = Math.sin(f * TAU) * R * 0.08, w = Math.sin(f * TAU * 2) * 0.25, o = R * 0.08;
  x.fillStyle = '#6a121e'; x.strokeStyle = '#2a0508'; x.lineWidth = R * 0.07;
  for (const s of [-1, 1]) {
    x.beginPath(); x.moveTo(s * R * 0.55, -R * 0.2 + b); x.lineTo(s * R * 1.4, -R * (0.8 + w)); x.lineTo(s * R * 1.15, -R * 0.15);
    x.lineTo(s * R * 1.3, R * 0.2); x.closePath(); x.fill(); x.stroke();
  }
  x.beginPath(); x.arc(0, b, R * 0.9, 0, TAU);
  x.fillStyle = rg(x, -R * 0.3, -R * 0.4 + b, R * 0.1, 0, b, R, [[0, '#ffa070'], [1, '#b8241e']]); x.fill();
  x.strokeStyle = '#4a0a0a'; x.lineWidth = R * 0.09; x.stroke();
  x.fillStyle = '#ffe8b0';
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * R * 0.3, -R * 0.72 + b); x.lineTo(s * R * 0.58, -R * 1.28 + b); x.lineTo(s * R * 0.62, -R * 0.55 + b); x.closePath(); x.fill(); }
  x.strokeStyle = '#3a2a1a'; x.lineWidth = R * 0.1; line(x, 0, -R * 0.86 + b, R * 0.18, -R * 1.22 + b);
  glowOn(x, '#ffd56e', R * 0.6); x.fillStyle = '#fff2b0'; star(x, R * 0.2, -R * 1.28 + b, R * 0.24); x.fill(); glowOff(x);
  x.fillStyle = '#ffe066'; ell(x, -R * 0.26 + o, -R * 0.12 + b, R * 0.17, R * 0.11, 0.35); ell(x, R * 0.36 + o, -R * 0.12 + b, R * 0.17, R * 0.11, -0.35);
  x.fillStyle = '#1a0505'; circ(x, -R * 0.22 + o, -R * 0.1 + b, R * 0.06); circ(x, R * 0.4 + o, -R * 0.1 + b, R * 0.06);
  x.fillStyle = '#2a0505';
  x.beginPath(); x.moveTo(-R * 0.35 + o, R * 0.22 + b); x.quadraticCurveTo(o + R * 0.05, R * 0.55 + b, R * 0.45 + o, R * 0.22 + b); x.closePath(); x.fill();
  x.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) { const tx = -R * 0.2 + o + i * R * 0.24; x.beginPath(); x.moveTo(tx, R * 0.24 + b); x.lineTo(tx + R * 0.1, R * 0.24 + b); x.lineTo(tx + R * 0.05, R * 0.34 + b); x.closePath(); x.fill(); }
}
