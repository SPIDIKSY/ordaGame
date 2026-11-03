/* =====================================================
   ДУХИ: призрак, жнец, тень
   ===================================================== */
import { TAU, lg, ell, circ, glowOn, glowOff, line } from '../../gfx.js';

export function drawGhost(x, R, f) {
  const ph = f * TAU, o = R * 0.06;
  x.beginPath();
  x.moveTo(-R, R * 0.8); x.lineTo(-R, -R * 0.1);
  x.arc(0, -R * 0.1, R, Math.PI, 0);
  x.lineTo(R, R * 0.8);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const x0 = R - i * (2 * R / n), x1 = R - (i + 1) * (2 * R / n);
    const yy = R * 0.8 + Math.sin(ph + i * 1.7) * R * 0.12;
    x.quadraticCurveTo((x0 + x1) / 2, yy + R * 0.4, x1, yy);
  }
  x.closePath();
  glowOn(x, 'rgba(120,220,255,.9)', R * 0.8);
  x.fillStyle = lg(x, 0, -R, 0, R * 1.1, [[0, '#f2fdff'], [1, 'rgba(110,200,240,.82)']]); x.fill();
  glowOff(x);
  x.strokeStyle = 'rgba(40,110,150,.75)'; x.lineWidth = R * 0.07; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.7)'; ell(x, -R * 0.45, -R * 0.62, R * 0.2, R * 0.1, -0.6);
  x.fillStyle = '#16264a'; ell(x, -R * 0.28 + o, -R * 0.12, R * 0.15, R * 0.24); ell(x, R * 0.34 + o, -R * 0.12, R * 0.15, R * 0.24);
  x.fillStyle = '#bff4ff'; circ(x, -R * 0.31 + o, -R * 0.22, R * 0.05); circ(x, R * 0.31 + o, -R * 0.22, R * 0.05);
  x.fillStyle = '#16264a'; ell(x, R * 0.05 + o, R * 0.32, R * 0.1, R * 0.14);
  x.fillStyle = 'rgba(255,150,190,.45)'; circ(x, -R * 0.55 + o, R * 0.14, R * 0.1); circ(x, R * 0.6 + o, R * 0.14, R * 0.1);
}
export function drawReaper(x, R, f) {
  const ph = f * TAU;
  x.save(); x.translate(R * 0.72, R * 0.05); x.rotate(0.18 + Math.sin(ph) * 0.05);
  x.strokeStyle = '#2a1f17'; x.lineWidth = R * 0.18; line(x, 0, R * 1.0, 0, -R * 1.25);
  x.strokeStyle = '#6b5440'; x.lineWidth = R * 0.1; line(x, 0, R * 1.0, 0, -R * 1.25);
  x.beginPath(); x.moveTo(0, -R * 1.25); x.quadraticCurveTo(R * 1.25, -R * 1.45, R * 1.55, -R * 0.5); x.quadraticCurveTo(R * 1.0, -R * 1.05, 0, -R * 0.98); x.closePath();
  glowOn(x, 'rgba(160,200,255,.6)', R * 0.3);
  x.fillStyle = lg(x, 0, -R * 1.4, R * 1.4, -R * 0.6, [[0, '#ffffff'], [1, '#8d97b3']]); x.fill();
  glowOff(x);
  x.strokeStyle = '#2a2f45'; x.lineWidth = R * 0.06; x.stroke();
  x.restore();
  x.beginPath(); x.moveTo(0, -R * 1.15);
  x.quadraticCurveTo(R * 0.86, -R * 1.05, R * 0.8, -R * 0.2); x.lineTo(R * 0.95, R * 0.95);
  for (let i = 1; i <= 5; i++) x.lineTo(R * 0.95 - i * (1.9 * R / 5), R * (0.95 + (i % 2 ? -0.2 : 0.04) + Math.sin(ph + i) * 0.07));
  x.lineTo(-R * 0.8, -R * 0.2); x.quadraticCurveTo(-R * 0.86, -R * 1.05, 0, -R * 1.15); x.closePath();
  x.fillStyle = lg(x, 0, -R * 1.1, 0, R, [[0, '#544778'], [1, '#191428']]); x.fill();
  x.strokeStyle = '#0b0814'; x.lineWidth = R * 0.07; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = R * 0.05;
  line(x, -R * 0.3, -R * 0.1, -R * 0.42, R * 0.8); line(x, R * 0.3, -R * 0.1, R * 0.4, R * 0.75);
  x.fillStyle = '#07050d'; ell(x, R * 0.12, -R * 0.48, R * 0.46, R * 0.4);
  glowOn(x, '#9fe8ff', R * 0.5);
  x.fillStyle = '#e0faff'; circ(x, -R * 0.02, -R * 0.5, R * 0.09); circ(x, R * 0.3, -R * 0.5, R * 0.09);
  glowOff(x);
  x.fillStyle = '#e9e3d0'; circ(x, R * 0.78, R * 0.18, R * 0.15);
}
export function drawWraith(x, R, f) {
  const ph = f * TAU, o = R * 0.06;
  x.beginPath(); x.moveTo(-R * 0.9, R * 0.6); x.lineTo(-R * 0.9, -R * 0.1); x.arc(0, -R * 0.1, R * 0.9, Math.PI, 0); x.lineTo(R * 0.9, R * 0.6);
  for (let i = 0; i < 5; i++) {
    const x0 = R * 0.9 - i * (1.8 * R / 5), x1 = R * 0.9 - (i + 1) * (1.8 * R / 5);
    const yy = R * (0.65 + (i % 2 ? 0.35 : 0)) + Math.sin(ph + i * 1.3) * R * 0.15;
    x.quadraticCurveTo((x0 + x1) / 2, yy + R * 0.3, x1, yy);
  }
  x.closePath();
  glowOn(x, 'rgba(170,110,255,.9)', R * 0.9);
  x.fillStyle = lg(x, 0, -R, 0, R * 1.2, [[0, 'rgba(78,50,120,.97)'], [1, 'rgba(25,12,45,.55)']]); x.fill();
  glowOff(x);
  x.strokeStyle = 'rgba(190,140,255,.6)'; x.lineWidth = R * 0.06; x.stroke();
  glowOn(x, '#d9b8ff', R * 0.5); x.fillStyle = '#f4e8ff';
  ell(x, -R * 0.25 + o, -R * 0.15, R * 0.15, R * 0.07, 0.3); ell(x, R * 0.3 + o, -R * 0.15, R * 0.15, R * 0.07, -0.3);
  glowOff(x);
}
