/* =====================================================
   МИР: сундуки, кристаллы опыта, свечения, бонусы,
   декор поляны, тайл травы и снаряды оружия
   ===================================================== */
import { TAU, mk, rg, lg, ell, circ, rrect, star, glowOn, glowOff, line, mulberry } from '../gfx.js';

function drawChest(x, open) {
  const gold = () => lg(x, 0, -16, 0, 12, [[0, '#ffe9a0'], [1, '#c98a1c']]);
  if (open) {
    x.beginPath(); x.moveTo(-15, -4); x.lineTo(-14, -15); x.quadraticCurveTo(0, -20.5, 14, -15); x.lineTo(15, -4); x.closePath();
    x.fillStyle = lg(x, 0, -20, 0, -4, [[0, '#7a3c1c'], [1, '#4a200c']]); x.fill();
    x.strokeStyle = '#2e1408'; x.lineWidth = 1.3; x.stroke();
    x.strokeStyle = '#ffd56e'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-14, -15); x.quadraticCurveTo(0, -20.5, 14, -15); x.stroke();
  }
  rrect(x, -15, -3, 30, 15, 2.5);
  x.fillStyle = lg(x, 0, -3, 0, 12, [[0, '#b0653a'], [1, '#5e2d14']]); x.fill();
  x.strokeStyle = '#2e1408'; x.lineWidth = 1.4; x.stroke();
  x.strokeStyle = 'rgba(40,15,5,.55)'; x.lineWidth = 0.8; line(x, -14, 2.2, 14, 2.2); line(x, -14, 7.2, 14, 7.2);
  x.fillStyle = gold(); x.fillRect(-11.2, -3, 3.6, 15); x.fillRect(7.6, -3, 3.6, 15);
  x.strokeStyle = '#6b4300'; x.lineWidth = 0.7; x.strokeRect(-11.2, -3, 3.6, 15); x.strokeRect(7.6, -3, 3.6, 15);
  if (!open) {
    x.beginPath(); x.moveTo(-15, -3); x.lineTo(-15, -8); x.quadraticCurveTo(0, -16.5, 15, -8); x.lineTo(15, -3); x.closePath();
    x.fillStyle = lg(x, 0, -16, 0, -3, [[0, '#c87444'], [1, '#7a3c1c']]); x.fill();
    x.save(); x.clip(); x.fillStyle = gold(); x.fillRect(-11.2, -18, 3.6, 16); x.fillRect(7.6, -18, 3.6, 16); x.restore();
    x.strokeStyle = '#2e1408'; x.lineWidth = 1.4; x.stroke();
    x.strokeStyle = '#ffd56e'; x.lineWidth = 1.6; line(x, -14.5, -3, 14.5, -3);
    rrect(x, -3.2, -6.5, 6.4, 7.6, 1.3); x.fillStyle = gold(); x.fill(); x.strokeStyle = '#6b4300'; x.lineWidth = 0.8; x.stroke();
    x.fillStyle = '#2a1404'; circ(x, 0, -3.6, 1); x.fillRect(-0.5, -3.4, 1, 2.6);
    x.fillStyle = 'rgba(255,255,255,.25)'; ell(x, -6, -10, 4, 1.2, -0.25);
  } else {
    x.fillStyle = '#1e0c04'; x.fillRect(-14, -4.5, 28, 2.6);
    glowOn(x, '#ffd56e', 6);
    x.fillStyle = '#fff1b0'; ell(x, 0, -4, 10, 1.6);
    glowOff(x);
    x.strokeStyle = '#ffd56e'; x.lineWidth = 1.6; line(x, -14.5, -3, 14.5, -3);
  }
}
function gemSprite(c0, c1, lineC, s) {
  return mk(s * 2.8, s * 3.2, (x) => {
    x.beginPath(); x.moveTo(0, -s * 1.3); x.lineTo(s, -s * 0.2); x.lineTo(0, s * 1.3); x.lineTo(-s, -s * 0.2); x.closePath();
    x.fillStyle = lg(x, -s, -s, s, s, [[0, c0], [1, c1]]); x.fill();
    x.strokeStyle = lineC; x.lineWidth = 0.9; x.stroke();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.moveTo(0, -s * 1.3); x.lineTo(-s, -s * 0.2); x.lineTo(0, -s * 0.05); x.closePath(); x.fill();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.moveTo(0, s * 1.3); x.lineTo(s, -s * 0.2); x.lineTo(0, -s * 0.05); x.closePath(); x.fill();
  });
}
export function glowSprite(col, r) {
  return mk(r * 2, r * 2, (x) => {
    x.fillStyle = rg(x, 0, 0, 0, 0, 0, r, [[0, col + 'ff'], [0.22, col + 'bb'], [0.55, col + '3a'], [1, col + '00']]);
    x.fillRect(-r, -r, r * 2, r * 2);
  }, 1.5);
}

export const GEMS = [gemSprite('#d4efff', '#2f86e8', '#123e7a', 4.2), gemSprite('#d4ffe2', '#22a85a', '#0d4a26', 5), gemSprite('#ffd6df', '#d92d55', '#5a0c22', 5.8)];
export const HEARTSPR = mk(18, 18, (x) => {
  x.beginPath(); x.moveTo(0, 7); x.bezierCurveTo(-11, -1, -5, -9, 0, -3.5); x.bezierCurveTo(5, -9, 11, -1, 0, 7); x.closePath();
  x.fillStyle = lg(x, 0, -7, 0, 7, [[0, '#ff8a98'], [1, '#d42a42']]); x.fill();
  x.strokeStyle = '#6a0c1c'; x.lineWidth = 1; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.7)'; ell(x, -3.6, -2.6, 1.8, 1.1, -0.6);
});
export const CHEST = mk(36, 40, (x) => drawChest(x, false));
export const GLOW = {
  amber: glowSprite('#ffb02e', 24), gold: glowSprite('#ffd56e', 32), cyan: glowSprite('#7fdcff', 24),
  blue: glowSprite('#5ab8ff', 16), green: glowSprite('#4fe08a', 16), red: glowSprite('#ff4a6a', 16), orange: glowSprite('#ff7a2e', 32)
};

/* --- временные бонусы: жетоны --- */
const PD = {
  heart: new Path2D('M16 28C6 21 3 16 3 11.5 3 7.4 6.2 4.5 10 4.5c2.6 0 4.7 1.4 6 3.4 1.3-2 3.4-3.4 6-3.4 3.8 0 7 2.9 7 7 0 4.5-3 9.5-13 16.5z'),
  magnet: new Path2D('M5.5 4h7.5v11a3 3 0 0 0 6 0V4h7.5v11a10.5 10.5 0 0 1-21 0z'),
  sword: new Path2D('M29 3L27.6 8 15.5 20.1 11.9 16.5 24 4.4z'),
  boot: new Path2D('M9 4h8.5v12.5l7.6 3c2.2.9 3.4 2.3 3.4 4.3V26H9z')
};
function puToken(c0, c1, icon) {
  return mk(30, 30, (x) => {
    x.beginPath(); x.arc(0, 0, 12, 0, TAU);
    x.fillStyle = rg(x, -3, -4, 1, 0, 0, 13, [[0, c0], [1, c1]]); x.fill();
    x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.9)'; x.stroke();
    x.beginPath(); x.arc(0, 0, 13.6, 0, TAU); x.lineWidth = 1.2; x.strokeStyle = 'rgba(0,0,0,.4)'; x.stroke();
    x.save(); x.translate(-8, -8); x.scale(0.5, 0.5); icon(x); x.restore();
    x.fillStyle = 'rgba(255,255,255,.35)'; ell(x, -4.5, -6.5, 4, 1.8, -0.5);
  });
}
export const PUS = {
  heal: { name: 'Лечение', col: '#ff7a8a', glow: 'red', icon: 'heart',
    spr: puToken('#ffa3ae', '#c21f3a', (x) => { x.fillStyle = '#fff'; x.fill(PD.heart); }) },
  magnet: { name: 'Магнит', col: '#7fb4ff', glow: 'blue', icon: 'magnet',
    spr: puToken('#a8c8ff', '#2450c8', (x) => { x.fillStyle = '#fff'; x.fill(PD.magnet); x.fillStyle = '#ff5a6e'; x.fillRect(5.5, 4, 7.5, 5); x.fillRect(19, 4, 7.5, 5); }) },
  bomb: { name: 'Бомба', col: '#ffb35a', glow: 'orange', icon: 'bomb',
    spr: puToken('#ffd08a', '#c4501a', (x) => {
      x.fillStyle = '#1b1d26'; circ(x, 14, 19, 9.5);
      x.save(); x.translate(20.5, 9.5); x.rotate(0.7); x.fillRect(-3, -2.5, 6, 5); x.restore();
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 2; x.beginPath(); x.moveTo(22, 7); x.quadraticCurveTo(24, 2, 28, 4); x.stroke();
      x.fillStyle = '#ffe066'; star(x, 28, 4, 4); x.fill();
      x.fillStyle = 'rgba(255,255,255,.45)'; circ(x, 10.5, 15.5, 2.4);
    }) },
  rage: { name: 'Ярость', col: '#ff8a3a', glow: 'amber', icon: 'sword',
    spr: puToken('#ffd27a', '#c2361a', (x) => {
      x.fillStyle = '#fff'; x.fill(PD.sword); x.strokeStyle = '#fff';
      x.lineWidth = 3.4; line(x, 8, 16, 16, 24); x.lineWidth = 3; line(x, 11.6, 20.4, 6.6, 25.4); circ(x, 5.2, 26.8, 2.6);
    }) },
  haste: { name: 'Ускорение', col: '#4fe08a', glow: 'green', icon: 'boot',
    spr: puToken('#a8f7d6', '#169a6e', (x) => { x.fillStyle = '#fff'; x.fill(PD.boot); x.fillRect(8, 25.5, 21, 3.2); }) }
};
export const PU_W = [['heal', 28], ['magnet', 32], ['rage', 18], ['bomb', 12], ['haste', 10]];
export const BUFF_TIME = 10;
export const BEAM = mk(36, 120, (x) => {
  x.fillStyle = lg(x, 0, 60, 0, -60, [[0, '#ffd36acc'], [0.45, '#ffb02e55'], [1, '#ffb02e00']]);
  x.fillRect(-18, -60, 36, 120);
  x.globalCompositeOperation = 'destination-in';
  x.fillStyle = lg(x, -18, 0, 18, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]);
  x.fillRect(-18, -60, 36, 120);
}, 1);

export const DECOR = [
  mk(28, 20, (x) => {
    x.fillStyle = 'rgba(0,0,0,.28)'; ell(x, 1, 6, 12, 3.5);
    x.beginPath(); x.moveTo(-10, 5); x.quadraticCurveTo(-11.5, -3, -5, -5.5); x.quadraticCurveTo(0, -8.5, 5, -4.5); x.quadraticCurveTo(10, -2, 9, 5); x.closePath();
    x.fillStyle = lg(x, -6, -7, 6, 6, [[0, '#7b8a92'], [1, '#353f47']]); x.fill(); x.strokeStyle = '#1b2228'; x.lineWidth = 1; x.stroke();
    x.beginPath(); x.moveTo(6, 6); x.quadraticCurveTo(7, 0.5, 10, 0.5); x.quadraticCurveTo(13.5, 1.5, 12.5, 6); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.2)'; ell(x, -3, -3.5, 3.2, 1.3, -0.3);
    x.fillStyle = '#3f6e4e'; ell(x, -4, -5.3, 3, 1, 0.1);
  }),
  mk(26, 24, (x) => {
    for (const m of [[-5, 4, 1], [4, 6, 0.75], [7, -1, 0.6]]) {
      const dx = m[0], dy = m[1], s = m[2];
      x.fillStyle = '#d9e6dc'; rrect(x, dx - 1.3 * s, dy - 1 * s, 2.6 * s, 6.5 * s, s); x.fill();
      glowOn(x, '#4fe3d0', 5);
      x.fillStyle = rg(x, dx - s, dy - 3 * s, 0, dx, dy - s, 5 * s, [[0, '#c4fff6'], [1, '#22a698']]);
      x.beginPath(); x.ellipse(dx, dy - s, 5.2 * s, 3.6 * s, 0, Math.PI, 0); x.closePath(); x.fill();
      glowOff(x);
      x.fillStyle = 'rgba(255,255,255,.75)'; circ(x, dx - 1.8 * s, dy - 2.8 * s, 0.7 * s); circ(x, dx + 1.4 * s, dy - 3.2 * s, 0.55 * s);
    }
  }),
  mk(34, 26, (x) => {
    x.fillStyle = 'rgba(0,0,0,.3)'; ell(x, 0, 8, 14, 3.5);
    x.fillStyle = '#1c3a2b'; circ(x, -7, 2, 7); circ(x, 6, 2, 7.5); circ(x, 0, -3, 8);
    x.fillStyle = '#28553d'; circ(x, -6, 0, 5); circ(x, 5, -1, 5.5); circ(x, 0, -5, 5.5);
    x.fillStyle = '#3a7a54'; circ(x, -2, -7, 2.4); circ(x, 6, -3, 2); circ(x, -7, -2, 1.8);
    x.fillStyle = '#ff6b7e'; circ(x, -3, 2, 1.2); circ(x, 4, 3, 1.2); circ(x, 1, -1, 1);
  }),
  mk(20, 16, (x) => {
    x.strokeStyle = '#2f5a40'; x.lineWidth = 1; line(x, -4, 6, -4, 0); line(x, 2, 6, 3, -2); line(x, 6, 6, 6, 2);
    for (const fl of [[-4, 0, '#e8ecff'], [3, -2, '#ff9ec1'], [6, 2, '#ffd36a']]) {
      x.fillStyle = fl[2];
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circ(x, fl[0] + Math.cos(a) * 1.7, fl[1] + Math.sin(a) * 1.7, 1.2); }
      x.fillStyle = '#ffb02e'; circ(x, fl[0], fl[1], 0.9);
    }
  })
];

export const TILE = 256;
export const tile = document.createElement('canvas');
(function makeTile() {
  tile.width = tile.height = TILE * 2;
  const t = tile.getContext('2d'); t.scale(2, 2);
  t.fillStyle = '#18271f'; t.fillRect(0, 0, TILE, TILE);
  const R = mulberry(9);
  const wrap = (fn) => { for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) { t.save(); t.translate(dx, dy); fn(); t.restore(); } };
  for (let i = 0; i < 16; i++) {
    const px = R() * TILE, py = R() * TILE, r = 24 + R() * 50, light = i % 2 === 0;
    wrap(() => { const g = t.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, light ? 'rgba(52,86,64,.35)' : 'rgba(8,16,12,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.fillStyle = g; t.fillRect(px - r, py - r, r * 2, r * 2); });
  }
  for (let i = 0; i < 260; i++) {
    const px = R() * TILE, py = R() * TILE, c = R() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.12)', s = 1 + R() * 1.5;
    wrap(() => { t.fillStyle = c; t.fillRect(px, py, s, s); });
  }
  const cols = ['#24402f', '#2b4c38', '#315842', '#203a2b'];
  for (let i = 0; i < 150; i++) {
    const px = R() * TILE, py = R() * TILE, c = cols[Math.floor(R() * cols.length)], h = 4 + R() * 5;
    wrap(() => {
      t.strokeStyle = c; t.lineWidth = 1.3; t.lineCap = 'round'; t.beginPath();
      t.moveTo(px, py); t.quadraticCurveTo(px - 1, py - h * 0.6, px - 2.5, py - h);
      t.moveTo(px + 2, py); t.quadraticCurveTo(px + 2, py - h * 0.6, px + 2.2, py - h * 1.1);
      t.moveTo(px + 4, py); t.quadraticCurveTo(px + 5, py - h * 0.5, px + 6.5, py - h * 0.8);
      t.stroke();
    });
  }
})();

GLOW.purple = glowSprite('#b77cff', 20);
GLOW.poison = glowSprite('#8dff5a', 28);
export const AXE = mk(36, 36, (x) => {
  x.rotate(-0.55);
  x.strokeStyle = '#3d220e'; x.lineWidth = 4.2; line(x, 0, 15, 0, -12);
  x.strokeStyle = '#a8703c'; x.lineWidth = 2.4; line(x, 0, 15, 0, -12);
  x.beginPath();
  x.moveTo(1.5, -13); x.quadraticCurveTo(12, -18, 15, -7); x.quadraticCurveTo(9.5, -5.5, 1.5, -3.5); x.closePath();
  x.moveTo(-1.5, -13); x.quadraticCurveTo(-12, -18, -15, -7); x.quadraticCurveTo(-9.5, -5.5, -1.5, -3.5); x.closePath();
  x.fillStyle = lg(x, 0, -17, 0, -3, [[0, '#ffffff'], [1, '#8d97b3']]); x.fill();
  x.strokeStyle = '#2a2f45'; x.lineWidth = 1.2; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 0.9;
  x.beginPath(); x.moveTo(5, -13.5); x.quadraticCurveTo(12, -14, 13.5, -8); x.stroke();
  x.fillStyle = '#ffc24a'; rrect(x, -2.4, -14, 4.8, 11, 1.3); x.fill();
  x.strokeStyle = '#6b4300'; x.lineWidth = 0.7; x.stroke();
});
export const KNIFE = mk(32, 12, (x) => {
  x.beginPath(); x.moveTo(15, 0); x.lineTo(2, -3.2); x.lineTo(2, 3.2); x.closePath();
  x.fillStyle = lg(x, 0, -3, 0, 3, [[0, '#ffffff'], [1, '#9aa6c4']]); x.fill();
  x.strokeStyle = '#2a2f45'; x.lineWidth = 0.8; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 0.6; line(x, 3, -0.8, 12, -0.2);
  x.fillStyle = '#ffc24a'; x.fillRect(-0.4, -4.4, 2.4, 8.8);
  x.fillStyle = '#4a2c1d'; rrect(x, -9.5, -1.9, 9.2, 3.8, 1.3); x.fill();
  x.fillStyle = '#ffc24a'; circ(x, -10, 0, 1.9);
});
export const FLASK = mk(18, 22, (x) => {
  x.fillStyle = '#c99a5a'; x.fillRect(-2.3, -10, 4.6, 3.2);
  x.beginPath(); x.moveTo(-2.6, -6.8); x.lineTo(2.6, -6.8); x.lineTo(2.6, -3); x.quadraticCurveTo(7.4, -1, 7.4, 3.6);
  x.quadraticCurveTo(7.4, 9.4, 0, 9.4); x.quadraticCurveTo(-7.4, 9.4, -7.4, 3.6); x.quadraticCurveTo(-7.4, -1, -2.6, -3); x.closePath();
  x.fillStyle = 'rgba(220,255,230,.35)'; x.fill();
  x.save(); x.clip(); x.fillStyle = lg(x, 0, 0, 0, 9, [[0, '#a6ff70'], [1, '#2fa83a']]); x.fillRect(-8, 0.4, 16, 10); x.restore();
  x.strokeStyle = '#1d3a2a'; x.lineWidth = 1; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.65)'; ell(x, -3.6, 1, 1.2, 2.3, 0.3);
});
export const BOOMER = mk(32, 32, (x) => {
  x.beginPath();
  x.moveTo(-13, -9); x.quadraticCurveTo(-2, -13, 3, -3); x.quadraticCurveTo(7, 4, 12, 11);
  x.quadraticCurveTo(5, 13, 0, 4); x.quadraticCurveTo(-4, -2.5, -12, -2.5); x.closePath();
  x.fillStyle = lg(x, -12, -10, 12, 12, [[0, '#f2c27a'], [1, '#8a4a1c']]); x.fill();
  x.strokeStyle = '#3d1f0a'; x.lineWidth = 1.3; x.stroke();
  x.strokeStyle = '#ffd56e'; x.lineWidth = 1.6;
  line(x, -8, -9.5, -7, -3.2); line(x, 4.5, 4.5, 8.5, 3); line(x, -2, -8, 0, -4);
});

// Картинки сундука для экрана открытия
export const CHEST_URL = mk(40, 44, (x) => { x.translate(0, 4); drawChest(x, false); }, 7).toDataURL();
export const CHEST_OPEN_URL = mk(40, 44, (x) => { x.translate(0, 4); drawChest(x, true); }, 7).toDataURL();

// Семечко для оружия «Семя»
export const SEED = mk(10, 14, (x) => {
  x.beginPath(); x.moveTo(0, -6); x.bezierCurveTo(3.4, -4, 3.6, 2, 2.6, 4.6); x.quadraticCurveTo(0, 6.6, -2.6, 4.6); x.bezierCurveTo(-3.6, 2, -3.4, -4, 0, -6); x.closePath();
  x.fillStyle = lg(x, -3, 0, 3, 0, [[0, '#3a2a1e'], [0.5, '#1a120c'], [1, '#3a2a1e']]); x.fill();
  x.strokeStyle = '#0c0806'; x.lineWidth = 0.6; x.stroke();
  x.strokeStyle = 'rgba(240,230,210,.85)'; x.lineWidth = 0.7;
  line(x, 0, -4.6, 0, 4.4); line(x, -1.6, -2.6, -1.8, 3.6); line(x, 1.6, -2.6, 1.8, 3.6);
});
