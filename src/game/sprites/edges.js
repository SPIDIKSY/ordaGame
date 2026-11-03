/* =====================================================
   КРАЙ ПОЛЯНЫ
   Крупные камни, деревья и надгробия, которые кольцом
   окружают поляну. В каждой местности свой набор.
   ===================================================== */
import { mk, lg, ell, circ, rrect, line, glowOn, glowOff } from '../gfx.js';

function shadow(x, w, h, y) { x.fillStyle = 'rgba(0,0,0,.38)'; ell(x, 0, y, w, h); }
const ROCK = [[-30, 14], [-33, 0], [-24, -16], [-6, -24], [14, -21], [30, -8], [32, 8], [20, 18], [-12, 20]];
function rockPath(x) { x.beginPath(); ROCK.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }

// Валун: свет сверху слева, тёмная грань и блик. cap — что лежит сверху (мох, снег, лава)
function boulder(c0, c1, lineC, cap) {
  return mk(72, 56, (x) => {
    shadow(x, 31, 8, 18);
    rockPath(x);
    x.fillStyle = lg(x, -20, -22, 18, 20, [[0, c0], [1, c1]]); x.fill();
    x.strokeStyle = lineC; x.lineWidth = 2; x.stroke();
    x.strokeStyle = 'rgba(0,0,0,.28)'; x.lineWidth = 1.4; line(x, -6, -24, 2, 6); line(x, 2, 6, 20, 18);
    x.fillStyle = 'rgba(255,255,255,.18)'; ell(x, -14, -11, 9, 4, -0.5);
    if (cap) cap(x);
  });
}
const moss = (x) => { x.fillStyle = 'rgba(90,150,70,.75)'; ell(x, -12, -17, 12, 4, -0.2); ell(x, 8, -20, 8, 3, 0.2); };
const snowCap = (x) => { x.fillStyle = '#eef6ff'; x.beginPath(); x.moveTo(-26, -12); x.quadraticCurveTo(-8, -30, 16, -22); x.quadraticCurveTo(28, -14, 30, -6); x.quadraticCurveTo(4, -14, -26, -12); x.fill(); };
const lava = (x) => {
  glowOn(x, '#ff7a2e', 4); x.strokeStyle = '#ffb35a'; x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(-20, -6); x.lineTo(-8, -2); x.lineTo(-2, 8); x.moveTo(6, -14); x.lineTo(12, -2); x.lineTo(24, 2); x.stroke();
  glowOff(x);
};

// Ель: три яруса веток. snowy — снег на кончиках
function pine(c0, c1, snowy) {
  return mk(72, 104, (x) => {
    shadow(x, 26, 7, 46);
    x.fillStyle = '#4a2e1c'; x.fillRect(-4, 30, 8, 16);
    for (const [y, hw] of [[36, 30], [16, 24], [-4, 18]]) {
      x.beginPath(); x.moveTo(-hw, y); x.lineTo(hw, y); x.lineTo(0, y - 36); x.closePath();
      x.fillStyle = lg(x, -hw, y - 30, hw, y, [[0, c0], [1, c1]]); x.fill();
      x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1.6; x.stroke();
      if (snowy) { x.fillStyle = '#eef6ff'; x.beginPath(); x.moveTo(-hw * 0.45, y - 22); x.lineTo(0, y - 36); x.lineTo(hw * 0.45, y - 22); x.quadraticCurveTo(0, y - 27, -hw * 0.45, y - 22); x.fill(); }
    }
  });
}

// Надгробие с трещиной и мхом
const tombstone = () => mk(48, 70, (x) => {
  shadow(x, 20, 6, 30);
  rrect(x, -15, -30, 30, 58, 14);
  x.fillStyle = lg(x, -15, -30, 15, 28, [[0, '#9aa0ae'], [1, '#4c505c']]); x.fill();
  x.strokeStyle = '#24262e'; x.lineWidth = 2; x.stroke();
  x.fillStyle = 'rgba(30,32,40,.6)'; x.fillRect(-2, -18, 4, 18); x.fillRect(-8, -12, 16, 4);
  x.strokeStyle = 'rgba(20,20,26,.6)'; x.lineWidth = 1; line(x, 8, -22, 4, -10); line(x, 4, -10, 9, 0);
  x.fillStyle = 'rgba(90,140,80,.7)'; ell(x, -6, 24, 10, 4);
});

// Большой кактус
const bigCactus = () => mk(56, 84, (x) => {
  shadow(x, 18, 6, 38);
  x.fillStyle = lg(x, -9, 0, 9, 0, [[0, '#76b464'], [1, '#2f5a2a']]); x.strokeStyle = '#1a3018'; x.lineWidth = 1.6;
  rrect(x, -7, -34, 14, 72, 7); x.fill(); x.stroke();
  rrect(x, -21, -14, 9, 22, 4.5); x.fill(); x.stroke(); rrect(x, -15, 2, 9, 6, 3); x.fill();
  rrect(x, 12, -24, 9, 18, 4.5); x.fill(); x.stroke(); rrect(x, 6, -10, 9, 6, 3); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 1; line(x, -2, -30, -2, 34);
  x.fillStyle = '#ff7ab0'; circ(x, 0, -35, 3);
});

// Ледяной кристалл
const iceShard = () => mk(56, 80, (x) => {
  shadow(x, 22, 6, 34);
  for (const [dx, h, w, rot] of [[-12, 44, 9, -0.25], [12, 38, 8, 0.3], [0, 60, 11, 0]]) {
    x.save(); x.translate(dx, 34); x.rotate(rot);
    x.beginPath(); x.moveTo(-w, 0); x.lineTo(-w * 0.7, -h * 0.75); x.lineTo(0, -h); x.lineTo(w * 0.7, -h * 0.75); x.lineTo(w, 0); x.closePath();
    x.fillStyle = lg(x, -w, -h, w, 0, [[0, '#e8f8ff'], [0.5, '#9fd6ff'], [1, '#3f86c4']]); x.fill();
    x.strokeStyle = '#1e4a78'; x.lineWidth = 1.4; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 1; line(x, -w * 0.3, -h * 0.8, -w * 0.4, -h * 0.15);
    x.restore();
  }
});

export const EDGE = {
  forest: [boulder('#8a9488', '#3a423c', '#1a201c', moss), pine('#3f7a4a', '#173622'), pine('#356b40', '#122c1c')],
  grave: [boulder('#8c8a98', '#3c3a48', '#1c1a24'), tombstone(), boulder('#7a7888', '#34323e', '#1c1a24', moss)],
  desert: [boulder('#d0a46a', '#7a5430', '#3a2614'), bigCactus(), boulder('#c08c58', '#6a4426', '#3a2614')],
  snow: [boulder('#a8b4c6', '#4c5a70', '#1e2634', snowCap), iceShard(), pine('#3e6a58', '#16302a', true)],
  hell: [boulder('#4a3434', '#1a1012', '#0a0606', lava), boulder('#3c2a2c', '#140c0e', '#0a0606', lava)]
};
