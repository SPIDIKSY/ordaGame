/* =====================================================
   ВРАГИ И БОССЫ: рисунки и анимация (4 кадра на каждого)
   ===================================================== */
import { TAU, mk, tint, rg, lg, ell, circ, rrect, star, glowOn, glowOff, line } from '../gfx.js';

function eyesCute(x, cx, cy, R) {
  const ex = R * 0.3, ey = R * 0.2, ew = R * 0.13;
  for (const s of [-1, 1]) {
    const px = cx + s * ex;
    x.fillStyle = '#141019'; ell(x, px, cy, ew, ey);
    x.fillStyle = '#fff'; circ(x, px - ew * 0.25, cy - ey * 0.42, ew * 0.48);
  }
}

/* --- враги --- */
function slimeBody(x, R, f, c0, c1, lineC, face) {
  const s = Math.sin(f * TAU) * 0.07;
  x.save(); x.translate(0, R * 0.62); x.scale(1 + s, 1 - s); x.translate(0, -R * 0.62);
  x.beginPath();
  x.moveTo(-R, R * 0.6);
  x.bezierCurveTo(-R * 1.1, -R * 0.4, -R * 0.6, -R * 1.05, 0, -R * 1.05);
  x.bezierCurveTo(R * 0.6, -R * 1.05, R * 1.1, -R * 0.4, R, R * 0.6);
  x.quadraticCurveTo(0, R * 0.86, -R, R * 0.6);
  x.closePath();
  x.fillStyle = rg(x, -R * 0.3, -R * 0.5, R * 0.1, 0, 0, R * 1.25, [[0, c0], [1, c1]]);
  x.fill(); x.lineWidth = Math.max(1.4, R * 0.1); x.strokeStyle = lineC; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.22)';
  circ(x, -R * 0.48, R * 0.3, R * 0.11); circ(x, -R * 0.26, R * 0.47, R * 0.06); circ(x, R * 0.55, R * 0.38, R * 0.07);
  x.fillStyle = 'rgba(255,255,255,.8)'; ell(x, -R * 0.42, -R * 0.6, R * 0.24, R * 0.12, -0.55);
  face();
  x.restore();
}
function drawSlime(x, R, f) {
  slimeBody(x, R, f, '#c6f7a6', '#3f9a3c', '#1d4a21', () => {
    eyesCute(x, R * 0.14, -R * 0.12, R);
    x.strokeStyle = '#141019'; x.lineWidth = R * 0.08;
    x.beginPath(); x.arc(R * 0.14, R * 0.12, R * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  });
}
function drawBoss(x, R, f) {
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
function drawBat(x, R, f) {
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
function drawBrute(x, R, f) {
  const st = Math.sin(f * TAU), o = R * 0.08;
  x.fillStyle = '#3a2416';
  ell(x, -R * 0.45, R * 0.86 - Math.max(0, st) * R * 0.12, R * 0.3, R * 0.19);
  ell(x, R * 0.45, R * 0.86 - Math.max(0, -st) * R * 0.12, R * 0.3, R * 0.19);
  for (const s of [-1, 1]) {
    x.beginPath(); x.moveTo(s * R * 0.45, -R * 0.55);
    x.quadraticCurveTo(s * R * 1.25, -R * 0.75, s * R * 1.05, -R * 1.45);
    x.quadraticCurveTo(s * R * 0.92, -R * 0.95, s * R * 0.15, -R * 0.75); x.closePath();
    x.fillStyle = lg(x, 0, -R * 1.45, 0, -R * 0.5, [[0, '#fff6dc'], [1, '#c9a46b']]); x.fill();
    x.strokeStyle = '#5a3a1a'; x.lineWidth = R * 0.07; x.stroke();
  }
  rrect(x, -R * 0.95, -R * 0.9, R * 1.9, R * 1.78, R * 0.62);
  x.fillStyle = rg(x, -R * 0.3, -R * 0.45, R * 0.1, 0, 0, R * 1.3, [[0, '#ffbe7d'], [1, '#a8481a']]); x.fill();
  x.strokeStyle = '#43200b'; x.lineWidth = R * 0.08; x.stroke();
  x.fillStyle = 'rgba(255,232,196,.32)'; ell(x, 0, R * 0.38, R * 0.55, R * 0.4);
  x.fillStyle = '#d06a2a'; x.strokeStyle = '#43200b'; x.lineWidth = R * 0.07;
  x.beginPath(); x.arc(-R * 1.0, R * 0.22 + st * R * 0.08, R * 0.28, 0, TAU); x.fill(); x.stroke();
  x.beginPath(); x.arc(R * 1.0, R * 0.22 - st * R * 0.08, R * 0.28, 0, TAU); x.fill(); x.stroke();
  x.strokeStyle = '#3a1606'; x.lineWidth = R * 0.12;
  line(x, -R * 0.58 + o, -R * 0.44, -R * 0.12 + o, -R * 0.27); line(x, R * 0.62 + o, -R * 0.44, R * 0.16 + o, -R * 0.27);
  x.fillStyle = '#ffe066'; circ(x, -R * 0.3 + o, -R * 0.13, R * 0.12); circ(x, R * 0.34 + o, -R * 0.13, R * 0.12);
  x.fillStyle = '#1a0a02'; circ(x, -R * 0.26 + o, -R * 0.12, R * 0.06); circ(x, R * 0.38 + o, -R * 0.12, R * 0.06);
  x.fillStyle = '#3a1606'; rrect(x, -R * 0.36 + o, R * 0.1, R * 0.72, R * 0.24, R * 0.1); x.fill();
  x.fillStyle = '#fff8e6';
  x.beginPath(); x.moveTo(-R * 0.3 + o, R * 0.32); x.lineTo(-R * 0.22 + o, R * 0.0); x.lineTo(-R * 0.12 + o, R * 0.32); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(R * 0.12 + o, R * 0.32); x.lineTo(R * 0.22 + o, R * 0.0); x.lineTo(R * 0.3 + o, R * 0.32); x.closePath(); x.fill();
}
function drawGhost(x, R, f) {
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
function drawGolem(x, R, f) {
  const b = Math.sin(f * TAU) * R * 0.05, o = R * 0.06;
  const rock = (cx, cy, s, pts) => {
    x.beginPath(); pts.forEach((q, i) => { const px = cx + q[0] * s, py = cy + q[1] * s; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.closePath();
  };
  const sh = [[0, -1], [0.85, -0.5], [1, 0.4], [0.3, 1], [-0.7, 0.8], [-1, -0.1], [-0.6, -0.85]];
  for (const s of [-1, 1]) {
    rock(s * R * 0.95, -R * 0.15 + s * b, R * 0.4, sh);
    x.fillStyle = lg(x, 0, -R * 0.6, 0, R * 0.3, [[0, '#7f7a8e'], [1, '#423d4c']]); x.fill();
    x.strokeStyle = '#1d1a24'; x.lineWidth = R * 0.07; x.stroke();
  }
  rock(0, 0, R, [[0, -1.0], [0.62, -0.84], [0.98, -0.22], [0.9, 0.5], [0.45, 0.93], [-0.2, 0.99], [-0.78, 0.7], [-1.0, 0.05], [-0.72, -0.72]]);
  x.fillStyle = rg(x, -R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.2, [[0, '#a8a2b6'], [1, '#433d4d']]); x.fill();
  x.strokeStyle = '#1d1a24'; x.lineWidth = R * 0.07; x.stroke();
  x.fillStyle = 'rgba(0,0,0,.18)'; ell(x, R * 0.3, R * 0.55, R * 0.5, R * 0.3, -0.3);
  glowOn(x, '#ff7a2e', R * 0.4);
  x.strokeStyle = '#ffb35a'; x.lineWidth = R * 0.07;
  x.beginPath(); x.moveTo(-R * 0.55, -R * 0.62); x.lineTo(-R * 0.28, -R * 0.36); x.lineTo(-R * 0.4, R * 0.05);
  x.moveTo(R * 0.28, R * 0.42); x.lineTo(R * 0.55, R * 0.18); x.lineTo(R * 0.78, R * 0.32);
  x.moveTo(-R * 0.15, R * 0.62); x.lineTo(R * 0.08, R * 0.82); x.stroke();
  x.fillStyle = '#ffd27a';
  ell(x, -R * 0.26 + o, -R * 0.3, R * 0.16, R * 0.07, 0.25); ell(x, R * 0.32 + o, -R * 0.3, R * 0.16, R * 0.07, -0.25);
  x.strokeStyle = '#ff8a3a'; x.lineWidth = R * 0.06; line(x, -R * 0.16 + o, R * 0.06, R * 0.26 + o, R * 0.06);
  glowOff(x);
  x.fillStyle = '#4c8a5c'; ell(x, -R * 0.32, -R * 0.86, R * 0.24, R * 0.09, 0.1); ell(x, R * 0.28, -R * 0.84, R * 0.16, R * 0.07, 0.3);
}
function drawReaper(x, R, f) {
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

function drawSpider(x, R, f, c0, c1, crown) {
  const ph = f * TAU;
  x.strokeStyle = '#140a1c'; x.lineWidth = R * 0.14;
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
    const sw = Math.sin(ph + i * 1.6 + (s > 0 ? Math.PI : 0)) * 0.18;
    const ky = R * (-0.3 + i * 0.24) + sw * R;
    x.beginPath(); x.moveTo(R * 0.1, R * (-0.1 + i * 0.1));
    x.quadraticCurveTo(s * R * 0.9, ky - R * 0.6, s * R * (1.3 + 0.05 * i), ky + R * 0.35); x.stroke();
  }
  x.fillStyle = rg(x, -R * 0.6, -R * 0.3, R * 0.1, -R * 0.45, 0, R * 0.9, [[0, c0], [1, c1]]);
  x.beginPath(); x.ellipse(-R * 0.45, R * 0.05, R * 0.8, R * 0.66, 0, 0, TAU); x.fill();
  x.strokeStyle = '#0c0612'; x.lineWidth = R * 0.08; x.stroke();
  x.fillStyle = '#ff4a6a';
  x.beginPath(); x.moveTo(-R * 0.45, -R * 0.32); x.lineTo(-R * 0.28, R * 0.05); x.lineTo(-R * 0.45, R * 0.42); x.lineTo(-R * 0.62, R * 0.05); x.closePath(); x.fill();
  x.fillStyle = rg(x, R * 0.3, -R * 0.2, R * 0.05, R * 0.42, 0, R * 0.55, [[0, c0], [1, c1]]);
  x.beginPath(); x.arc(R * 0.42, R * 0.02, R * 0.48, 0, TAU); x.fill(); x.stroke();
  glowOn(x, '#ff3b5c', R * 0.4); x.fillStyle = '#ff6a84';
  circ(x, R * 0.56, -R * 0.1, R * 0.11); circ(x, R * 0.74, -R * 0.02, R * 0.08); circ(x, R * 0.4, -R * 0.17, R * 0.07); circ(x, R * 0.63, R * 0.12, R * 0.07);
  glowOff(x);
  x.fillStyle = '#f2ecdf';
  x.beginPath(); x.moveTo(R * 0.7, R * 0.26); x.lineTo(R * 0.86, R * 0.5); x.lineTo(R * 0.62, R * 0.36); x.closePath(); x.fill();
  if (crown) {
    const by = -R * 0.38, cx = R * 0.42;
    x.beginPath(); x.moveTo(cx - R * 0.3, by); x.lineTo(cx - R * 0.34, by - R * 0.32); x.lineTo(cx - R * 0.15, by - R * 0.16);
    x.lineTo(cx, by - R * 0.4); x.lineTo(cx + R * 0.15, by - R * 0.16); x.lineTo(cx + R * 0.34, by - R * 0.32); x.lineTo(cx + R * 0.3, by); x.closePath();
    x.fillStyle = lg(x, 0, by - R * 0.4, 0, by, [[0, '#fff1a8'], [1, '#e09a14']]); x.fill();
    x.strokeStyle = '#7a4a00'; x.lineWidth = R * 0.04; x.stroke();
    x.fillStyle = '#ff3d6e'; circ(x, cx, by - R * 0.1, R * 0.06);
  }
}
function drawJelly(x, R, f) {
  slimeBody(x, R, f, '#d8f2ff', '#2f6fd0', '#123a7a', () => {
    x.fillStyle = 'rgba(150,235,120,.6)';
    circ(x, -R * 0.38, R * 0.25, R * 0.17); circ(x, R * 0.42, R * 0.3, R * 0.13); circ(x, R * 0.05, R * 0.45, R * 0.11);
    eyesCute(x, R * 0.14, -R * 0.22, R * 0.9);
    x.strokeStyle = '#141019'; x.lineWidth = R * 0.07;
    x.beginPath(); x.arc(R * 0.14, R * 0.02, R * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  });
}
function drawImp(x, R, f) {
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
function drawArcher(x, R, f) {
  const st = Math.sin(f * TAU), bone = '#ece6d6', o = R * 0.06;
  x.strokeStyle = bone; x.lineWidth = R * 0.15;
  line(x, -R * 0.22, R * 0.4, -R * 0.3 + st * R * 0.15, R * 1.0); line(x, R * 0.22, R * 0.4, R * 0.3 - st * R * 0.15, R * 1.0);
  line(x, 0, -R * 0.25, 0, R * 0.42);
  x.lineWidth = R * 0.1;
  for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(0, -R * 0.05 + i * R * 0.16, R * 0.4 - i * R * 0.05, R * 0.08, 0, 0, TAU); x.stroke(); }
  x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = R * 0.04;
  for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(0, -R * 0.05 + i * R * 0.16, R * 0.4 - i * R * 0.05, R * 0.08, 0, 0, TAU); x.stroke(); }
  x.strokeStyle = '#8a5a2c'; x.lineWidth = R * 0.13; x.beginPath(); x.arc(R * 0.45, -R * 0.05, R * 0.7, -1.15, 1.15); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = R * 0.04;
  line(x, R * 0.45 + Math.cos(-1.15) * R * 0.7, -R * 0.05 + Math.sin(-1.15) * R * 0.7, R * 0.45 + Math.cos(1.15) * R * 0.7, -R * 0.05 + Math.sin(1.15) * R * 0.7);
  x.strokeStyle = bone; x.lineWidth = R * 0.11; line(x, 0, -R * 0.15, R * 0.72, -R * 0.08);
  x.fillStyle = lg(x, 0, -R, 0, -R * 0.2, [[0, '#fbf6ea'], [1, '#bdb39c']]);
  circ(x, o, -R * 0.62, R * 0.42); x.fillRect(-R * 0.18 + o, -R * 0.35, R * 0.38, R * 0.16);
  x.strokeStyle = '#3a3428'; x.lineWidth = R * 0.05; x.beginPath(); x.arc(o, -R * 0.62, R * 0.42, 0, TAU); x.stroke();
  x.fillStyle = '#1a1612'; circ(x, -R * 0.12 + o * 2, -R * 0.64, R * 0.1); circ(x, R * 0.16 + o * 2, -R * 0.64, R * 0.1);
  glowOn(x, '#7fdcff', R * 0.4); x.fillStyle = '#bff1ff'; circ(x, -R * 0.12 + o * 2, -R * 0.64, R * 0.045); circ(x, R * 0.16 + o * 2, -R * 0.64, R * 0.045); glowOff(x);
}
function drawDKnight(x, R, f) {
  const st = Math.sin(f * TAU);
  x.fillStyle = '#7a1424';
  x.beginPath(); x.moveTo(-R * 0.4, -R * 0.5); x.quadraticCurveTo(-R * 1.0 - st * R * 0.08, R * 0.2, -R * 0.85, R * 0.9); x.lineTo(R * 0.1, R * 0.85); x.closePath(); x.fill();
  x.fillStyle = '#1e2230';
  ell(x, -R * 0.32, R * 0.9 - Math.max(0, st) * R * 0.1, R * 0.26, R * 0.15); ell(x, R * 0.32, R * 0.9 - Math.max(0, -st) * R * 0.1, R * 0.26, R * 0.15);
  rrect(x, -R * 0.7, -R * 0.45, R * 1.4, R * 1.3, R * 0.32);
  x.fillStyle = lg(x, -R * 0.6, -R * 0.5, R * 0.6, R * 0.8, [[0, '#7a83a0'], [1, '#22273a']]); x.fill();
  x.strokeStyle = '#0b0d16'; x.lineWidth = R * 0.07; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.18)'; ell(x, -R * 0.3, -R * 0.1, R * 0.12, R * 0.35, 0.2);
  x.fillStyle = '#d9d0bc';
  for (const s of [-1, 1]) {
    x.beginPath(); x.moveTo(s * R * 0.3, -R * 0.92); x.quadraticCurveTo(s * R * 0.7, -R * 1.05, s * R * 0.74, -R * 1.38);
    x.quadraticCurveTo(s * R * 0.5, -R * 1.05, s * R * 0.12, -R * 1.02); x.closePath(); x.fill();
  }
  x.beginPath(); x.arc(R * 0.02, -R * 0.62, R * 0.5, 0, TAU);
  x.fillStyle = lg(x, 0, -R * 1.1, 0, -R * 0.2, [[0, '#8a93b0'], [1, '#2a3044']]); x.fill(); x.stroke();
  glowOn(x, '#ff3b4c', R * 0.4); x.fillStyle = '#ff6a78'; rrect(x, -R * 0.02, -R * 0.7, R * 0.46, R * 0.11, R * 0.05); x.fill(); glowOff(x);
  rrect(x, R * 0.3, -R * 0.38, R * 0.62, R * 0.98, R * 0.26);
  x.fillStyle = lg(x, R * 0.3, -R * 0.4, R * 0.9, R * 0.6, [[0, '#a8b0c8'], [1, '#3a4058']]); x.fill();
  x.strokeStyle = '#0b0d16'; x.stroke();
  x.fillStyle = '#b8243a'; x.fillRect(R * 0.56, -R * 0.25, R * 0.1, R * 0.7); x.fillRect(R * 0.4, -R * 0.02, R * 0.42, R * 0.1);
}
function drawWraith(x, R, f) {
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
function drawLich(x, R, f) {
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

export const SPR = {};
function build(key, R, bw, bh, fn) {
  const f = [], w = [];
  for (let i = 0; i < 4; i++) { const c = mk(bw * R, bh * R, (x) => fn(x, R, i / 4)); f.push(c); w.push(tint(c, '#ffffff', 0.85)); }
  SPR[key] = { f, w };
}
build('slime', 11, 2.6, 2.5, drawSlime);
build('bat', 9, 4.6, 3.2, drawBat);
build('brute', 16, 3.0, 3.2, drawBrute);
build('ghost', 12, 2.6, 2.9, drawGhost);
build('golem', 23, 3.0, 2.6, drawGolem);
build('reaper', 15, 4.4, 3.0, drawReaper);
build('boss', 38, 2.6, 3.3, drawBoss);
build('spider', 10, 3.3, 2.7, (x, R, f) => drawSpider(x, R, f, '#7a4aa8', '#22103a', false));
build('jelly', 15, 2.6, 2.5, drawJelly);
build('imp', 11, 3.1, 3.1, drawImp);
build('archer', 12, 3.2, 3.0, drawArcher);
build('dknight', 17, 2.8, 3.0, drawDKnight);
build('wraith', 13, 2.6, 3.0, drawWraith);
build('titan', 42, 3.0, 2.6, drawGolem);
SPR.titan.f = SPR.titan.f.map((c) => tint(c, '#7ab8ff', 0.32));
build('queen', 30, 3.4, 2.9, (x, R, f) => drawSpider(x, R, f, '#c26bff', '#3a1660', true));
build('lich', 30, 3.4, 3.2, drawLich);
// Вестник смерти — тёмно-красный жнец
SPR.doom = { f: SPR.reaper.f.map((c) => tint(c, '#ff1a3c', 0.42)), w: SPR.reaper.w };
