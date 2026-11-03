/* =====================================================
   БОССЫ: король слизней, ледяной титан, король-лич
   ===================================================== */
import { TAU, lg, ell, circ, rrect, glowOn, glowOff, line } from '../../gfx.js';
import { eyesCute, slimeBody } from './parts.js';

export function drawBoss(x, R, f) {
  slimeBody(x, R, f, '#f0c2ff', '#7a2fb3', '#2e0c48', () => {
    // сердитые брови
    x.strokeStyle = '#2e0c48'; x.lineWidth = R * 0.07;
    line(x, -R * 0.42, -R * 0.42, -R * 0.08, -R * 0.3); line(x, R * 0.56, -R * 0.42, R * 0.22, -R * 0.3);
    eyesCute(x, R * 0.07, -R * 0.14, R * 0.95);
    // рот с зубами
    x.fillStyle = '#2a0838'; x.beginPath(); x.ellipse(R * 0.07, R * 0.2, R * 0.26, R * 0.13, 0, 0, Math.PI); x.fill();
    x.fillStyle = '#fff';
    for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(R * (0.07 + i * 0.12) - R * 0.05, R * 0.2); x.lineTo(R * (0.07 + i * 0.12) + R * 0.05, R * 0.2); x.lineTo(R * (0.07 + i * 0.12), R * 0.29); x.closePath(); x.fill(); }
    // корона
    const by = -R * 0.98;
    x.beginPath();
    x.moveTo(-R * 0.46, by); x.lineTo(-R * 0.52, by - R * 0.48); x.lineTo(-R * 0.25, by - R * 0.24);
    x.lineTo(0, by - R * 0.58); x.lineTo(R * 0.25, by - R * 0.24); x.lineTo(R * 0.52, by - R * 0.48); x.lineTo(R * 0.46, by);
    x.closePath();
    x.fillStyle = lg(x, 0, by - R * 0.6, 0, by, [[0, '#fff1a8'], [1, '#e09a14']]); x.fill();
    x.strokeStyle = '#7a4a00'; x.lineWidth = R * 0.05; x.stroke();
    x.fillStyle = '#ff3d6e'; circ(x, 0, by - R * 0.12, R * 0.07);
    x.fillStyle = '#3ad1ff'; circ(x, -R * 0.3, by - R * 0.09, R * 0.05); circ(x, R * 0.3, by - R * 0.09, R * 0.05);
    x.fillStyle = '#fff6c8'; circ(x, -R * 0.52, by - R * 0.5, R * 0.05); circ(x, 0, by - R * 0.6, R * 0.05); circ(x, R * 0.52, by - R * 0.5, R * 0.05);
  });
}
export function drawLich(x, R, f) {
  const ph = f * TAU;
  x.strokeStyle = '#2a1f17'; x.lineWidth = R * 0.13; line(x, R * 0.78, R * 0.95, R * 0.88, -R * 1.15);
  glowOn(x, '#7dff9a', R * 0.6); x.fillStyle = '#c8ffd6'; circ(x, R * 0.9, -R * 1.28, R * 0.2); glowOff(x);
  x.beginPath(); x.moveTo(0, -R * 1.0); x.quadraticCurveTo(R * 0.9, -R * 0.9, R * 0.82, -R * 0.1); x.lineTo(R * 0.98, R * 0.95);
  for (let i = 1; i <= 5; i++) x.lineTo(R * 0.98 - i * (1.96 * R / 5), R * (0.95 + (i % 2 ? -0.2 : 0.04) + Math.sin(ph + i) * 0.07));
  x.lineTo(-R * 0.82, -R * 0.1); x.quadraticCurveTo(-R * 0.9, -R * 0.9, 0, -R * 1.0); x.closePath();
  x.fillStyle = lg(x, 0, -R, 0, R, [[0, '#4a5aa8'], [1, '#140c2a']]); x.fill();
  x.strokeStyle = '#0a0616'; x.lineWidth = R * 0.06; x.stroke();
  x.strokeStyle = '#ffc24a'; x.lineWidth = R * 0.05; line(x, 0, -R * 0.2, 0, R * 0.9);
  x.fillStyle = '#07050d'; ell(x, R * 0.1, -R * 0.5, R * 0.46, R * 0.42);
  x.fillStyle = lg(x, 0, -R * 0.9, 0, -R * 0.15, [[0, '#fbf6ea'], [1, '#bdb39c']]);
  circ(x, R * 0.1, -R * 0.52, R * 0.34); x.fillRect(-R * 0.06, -R * 0.3, R * 0.32, R * 0.14);
  x.fillStyle = '#140a20'; circ(x, R * 0.0, -R * 0.54, R * 0.09); circ(x, R * 0.22, -R * 0.54, R * 0.09);
  glowOn(x, '#7dff9a', R * 0.4); x.fillStyle = '#b8ffcc'; circ(x, R * 0.0, -R * 0.54, R * 0.045); circ(x, R * 0.22, -R * 0.54, R * 0.045); glowOff(x);
  const by = -R * 0.8;
  x.beginPath(); x.moveTo(-R * 0.22, by); x.lineTo(-R * 0.26, by - R * 0.3); x.lineTo(-R * 0.08, by - R * 0.14); x.lineTo(R * 0.1, by - R * 0.38);
  x.lineTo(R * 0.28, by - R * 0.14); x.lineTo(R * 0.46, by - R * 0.3); x.lineTo(R * 0.42, by); x.closePath();
  x.fillStyle = lg(x, 0, by - R * 0.4, 0, by, [[0, '#fff1a8'], [1, '#e09a14']]); x.fill();
  x.strokeStyle = '#7a4a00'; x.lineWidth = R * 0.03; x.stroke();
  x.fillStyle = '#7dff9a'; circ(x, R * 0.1, by - R * 0.08, R * 0.05);
  x.fillStyle = '#efe8d8'; circ(x, R * 0.8, R * 0.15, R * 0.12);
}

// Ледяной титан: глыба голубого льда с кристаллами за спиной, сосульками на
// кулаках и холодным светом в трещинах. Раньше это был перекрашенный голем.
const TITAN_BODY = [[0, -0.95], [0.6, -0.86], [0.96, -0.34], [0.92, 0.45], [0.5, 0.85], [-0.15, 0.93], [-0.75, 0.7], [-0.98, 0], [-0.7, -0.76]];
const TITAN_FIST = [[0, -1], [0.85, -0.5], [1, 0.4], [0.3, 1], [-0.7, 0.8], [-1, -0.1], [-0.6, -0.85]];
const TITAN_SHARDS = [[-0.55, 0.75, 0.16, -0.45], [0.6, 0.66, 0.14, 0.5], [-0.18, 0.58, 0.12, -0.12], [0.26, 0.62, 0.13, 0.22]];
function poly(x, pts, cx, cy, s) {
  x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(cx + a * s, cy + b * s) : x.moveTo(cx + a * s, cy + b * s))); x.closePath();
}
function iceShard(x, dx, dy, h, w, rot) {
  x.save(); x.translate(dx, dy); x.rotate(rot);
  x.beginPath(); x.moveTo(-w, 0); x.lineTo(-w * 0.6, -h * 0.7); x.lineTo(0, -h); x.lineTo(w * 0.6, -h * 0.7); x.lineTo(w, 0); x.closePath();
  x.fillStyle = lg(x, -w, -h, w, 0, [[0, '#ffffff'], [0.5, '#a8dcff'], [1, '#3f86c4']]); x.fill(); x.stroke();
  x.restore();
}
export function drawTitan(x, R, f) {
  const st = Math.sin(f * TAU), b = st * R * 0.12, o = R * 0.05;
  x.strokeStyle = '#0d1f3a'; x.lineWidth = R * 0.05;
  // ноги-глыбы переступают
  x.fillStyle = '#2a4a76';
  for (const s of [-1, 1]) { rrect(x, s * R * 0.42 - R * 0.24, R * 0.6 - Math.max(0, s * st) * R * 0.14, R * 0.48, R * 0.36, R * 0.12); x.fill(); x.stroke(); }
  x.strokeStyle = '#163a66'; x.lineWidth = R * 0.04;
  for (const [dx, h, w, rot] of TITAN_SHARDS) iceShard(x, dx * R, -R * 0.62, h * R, w * R, rot);
  poly(x, TITAN_BODY, 0, 0, R);
  x.fillStyle = lg(x, -R * 0.4, -R, R * 0.4, R, [[0, '#f2fbff'], [0.45, '#8fc6f0'], [1, '#2c5688']]); x.fill();
  x.strokeStyle = '#0d1f3a'; x.lineWidth = R * 0.07; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.35)'; ell(x, -R * 0.45, -R * 0.35, R * 0.16, R * 0.4, 0.4);
  x.fillStyle = 'rgba(10,30,70,.22)'; ell(x, R * 0.35, R * 0.55, R * 0.45, R * 0.28, -0.3);
  // снежная шапка на макушке
  x.fillStyle = '#f4faff';
  x.beginPath(); x.moveTo(-R * 0.72, -R * 0.66); x.quadraticCurveTo(-R * 0.2, -R * 1.12, R * 0.62, -R * 0.84);
  x.quadraticCurveTo(R * 0.3, -R * 0.62, -R * 0.1, -R * 0.7); x.quadraticCurveTo(-R * 0.4, -R * 0.56, -R * 0.72, -R * 0.66); x.fill();
  // трещины, глаза и рот светятся холодом
  glowOn(x, '#7fe0ff', R * 0.4);
  x.strokeStyle = '#c8f4ff'; x.lineWidth = R * 0.05;
  x.beginPath(); x.moveTo(-R * 0.6, R * 0.1); x.lineTo(-R * 0.35, R * 0.3); x.lineTo(-R * 0.42, R * 0.6);
  x.moveTo(R * 0.3, R * 0.4); x.lineTo(R * 0.55, R * 0.22); x.lineTo(R * 0.8, R * 0.3); x.stroke();
  x.fillStyle = '#e8fbff';
  ell(x, -R * 0.26 + o, -R * 0.32, R * 0.15, R * 0.065, 0.3); ell(x, R * 0.32 + o, -R * 0.32, R * 0.15, R * 0.065, -0.3);
  x.strokeStyle = '#9fe6ff'; x.lineWidth = R * 0.06; line(x, -R * 0.14 + o, R * 0.04, R * 0.24 + o, R * 0.04);
  glowOff(x);
  x.strokeStyle = '#0d1f3a'; x.lineWidth = R * 0.07;
  line(x, -R * 0.46 + o, -R * 0.5, -R * 0.1 + o, -R * 0.38); line(x, R * 0.54 + o, -R * 0.5, R * 0.18 + o, -R * 0.38);
  // кулаки с сосульками, ходят навстречу друг другу
  for (const s of [-1, 1]) {
    const fx = s * R * 1.02, fy = -R * 0.02 + s * b;
    poly(x, TITAN_FIST, fx, fy, R * 0.42);
    x.fillStyle = lg(x, 0, fy - R * 0.4, 0, fy + R * 0.4, [[0, '#d8f0ff'], [1, '#3a6aa0']]); x.fill();
    x.strokeStyle = '#0d1f3a'; x.lineWidth = R * 0.06; x.stroke();
    x.fillStyle = '#e8f8ff';
    for (let i = -1; i <= 1; i++) { const ix = fx + i * R * 0.16; x.beginPath(); x.moveTo(ix - R * 0.06, fy + R * 0.32); x.lineTo(ix + R * 0.06, fy + R * 0.32); x.lineTo(ix, fy + R * (0.56 - Math.abs(i) * 0.1)); x.closePath(); x.fill(); }
  }
}
