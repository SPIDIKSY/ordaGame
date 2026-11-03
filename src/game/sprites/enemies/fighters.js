/* =====================================================
   БОЙЦЫ: рогач, голем, скелет-лучник, тёмный рыцарь
   ===================================================== */
import { TAU, rg, lg, ell, circ, rrect, glowOn, glowOff, line } from '../../gfx.js';

export function drawBrute(x, R, f) {
  const st = Math.sin(f * TAU), o = R * 0.08;
  x.fillStyle = '#3a2416';
  ell(x, -R * 0.45, R * 0.86 - Math.max(0, st) * R * 0.22, R * 0.3, R * 0.19);
  ell(x, R * 0.45, R * 0.86 - Math.max(0, -st) * R * 0.22, R * 0.3, R * 0.19);
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
  x.beginPath(); x.arc(-R * 1.0 - st * R * 0.06, R * 0.22 + st * R * 0.2, R * 0.28, 0, TAU); x.fill(); x.stroke();
  x.beginPath(); x.arc(R * 1.0 - st * R * 0.06, R * 0.22 - st * R * 0.2, R * 0.28, 0, TAU); x.fill(); x.stroke();
  x.strokeStyle = '#3a1606'; x.lineWidth = R * 0.12;
  line(x, -R * 0.58 + o, -R * 0.44, -R * 0.12 + o, -R * 0.27); line(x, R * 0.62 + o, -R * 0.44, R * 0.16 + o, -R * 0.27);
  x.fillStyle = '#ffe066'; circ(x, -R * 0.3 + o, -R * 0.13, R * 0.12); circ(x, R * 0.34 + o, -R * 0.13, R * 0.12);
  x.fillStyle = '#1a0a02'; circ(x, -R * 0.26 + o, -R * 0.12, R * 0.06); circ(x, R * 0.38 + o, -R * 0.12, R * 0.06);
  x.fillStyle = '#3a1606'; rrect(x, -R * 0.36 + o, R * 0.1, R * 0.72, R * 0.24, R * 0.1); x.fill();
  x.fillStyle = '#fff8e6';
  x.beginPath(); x.moveTo(-R * 0.3 + o, R * 0.32); x.lineTo(-R * 0.22 + o, R * 0.0); x.lineTo(-R * 0.12 + o, R * 0.32); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(R * 0.12 + o, R * 0.32); x.lineTo(R * 0.22 + o, R * 0.0); x.lineTo(R * 0.3 + o, R * 0.32); x.closePath(); x.fill();
}
export function drawGolem(x, R, f) {
  const b = Math.sin(f * TAU) * R * 0.13, o = R * 0.06;
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
export function drawArcher(x, R, f) {
  const st = Math.sin(f * TAU), bone = '#ece6d6', o = R * 0.06;
  x.strokeStyle = bone; x.lineWidth = R * 0.15;
  line(x, -R * 0.22, R * 0.4, -R * 0.3 + st * R * 0.26, R * 1.0); line(x, R * 0.22, R * 0.4, R * 0.3 - st * R * 0.26, R * 1.0);
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
export function drawDKnight(x, R, f) {
  const st = Math.sin(f * TAU);
  x.fillStyle = '#7a1424';
  x.beginPath(); x.moveTo(-R * 0.4, -R * 0.5); x.quadraticCurveTo(-R * 1.05 - st * R * 0.2, R * 0.2, -R * 0.9 - st * R * 0.12, R * 0.9); x.lineTo(R * 0.1, R * 0.85); x.closePath(); x.fill();
  x.fillStyle = '#1e2230';
  ell(x, -R * 0.32, R * 0.9 - Math.max(0, st) * R * 0.2, R * 0.26, R * 0.15); ell(x, R * 0.32, R * 0.9 - Math.max(0, -st) * R * 0.2, R * 0.26, R * 0.15);
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
