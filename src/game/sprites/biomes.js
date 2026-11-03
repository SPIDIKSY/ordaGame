/* =====================================================
   МЕСТНОСТИ (карты)
   Каждая местность: свой тайл земли, свои украшения,
   свои частицы в воздухе и оттенок света.
   По ходу забега местность сменяется каждые 2 минуты,
   а с Волной смерти начинается Пекло.
   ===================================================== */
import { TAU, mk, rg, lg, ell, circ, rrect, glowOn, glowOff, line, mulberry } from '../gfx.js';
import { DECOR, TILE, tile as forestTile } from './world.js';
import { EDGE } from './edges.js';

// Рисует бесшовный тайл земли 256×256
function makeTile(seed, base, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = TILE * 2;
  const t = c.getContext('2d'); t.scale(2, 2);
  t.fillStyle = base; t.fillRect(0, 0, TILE, TILE);
  const R = mulberry(seed);
  // повторяем рисунок со сдвигом, чтобы края тайла совпадали
  const wrap = (fn) => { for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) { t.save(); t.translate(dx, dy); fn(); t.restore(); } };
  const blobs = (n, light, dark, r0, r1) => {
    for (let i = 0; i < n; i++) {
      const px = R() * TILE, py = R() * TILE, r = r0 + R() * r1, col = i % 2 === 0 ? light : dark;
      wrap(() => { const g = t.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); t.fillStyle = g; t.fillRect(px - r, py - r, r * 2, r * 2); });
    }
  };
  const specks = (n, a, b) => {
    for (let i = 0; i < n; i++) {
      const px = R() * TILE, py = R() * TILE, col = R() < 0.5 ? a : b, s = 1 + R() * 1.5;
      wrap(() => { t.fillStyle = col; t.fillRect(px, py, s, s); });
    }
  };
  paint({ t, R, wrap, blobs, specks });
  return c;
}

/* ---------- тайлы ---------- */
const graveTile = makeTile(21, '#1e2028', ({ t, R, wrap, blobs, specks }) => {
  blobs(14, 'rgba(70,64,92,.35)', 'rgba(6,6,12,.4)', 26, 50);
  specks(240, 'rgba(255,255,255,.03)', 'rgba(0,0,0,.14)');
  // земляные проплешины
  for (let i = 0; i < 10; i++) {
    const px = R() * TILE, py = R() * TILE, rx = 8 + R() * 16;
    wrap(() => { t.fillStyle = 'rgba(48,38,34,.45)'; t.beginPath(); t.ellipse(px, py, rx, rx * 0.5, R(), 0, TAU); t.fill(); });
  }
  // сухая трава
  const cols = ['#33343f', '#3c3c4a', '#2a2b34'];
  for (let i = 0; i < 110; i++) {
    const px = R() * TILE, py = R() * TILE, c = cols[Math.floor(R() * cols.length)], h = 3 + R() * 4;
    wrap(() => { t.strokeStyle = c; t.lineWidth = 1.1; t.lineCap = 'round'; t.beginPath(); t.moveTo(px, py); t.lineTo(px - 2, py - h); t.moveTo(px + 2, py); t.lineTo(px + 3, py - h * 0.9); t.stroke(); });
  }
});

const desertTile = makeTile(33, '#4a3a26', ({ t, R, wrap, blobs, specks }) => {
  blobs(16, 'rgba(140,110,64,.35)', 'rgba(30,20,10,.35)', 30, 60);
  specks(300, 'rgba(255,240,200,.05)', 'rgba(0,0,0,.12)');
  // песчаная рябь
  for (let i = 0; i < 46; i++) {
    const px = R() * TILE, py = R() * TILE, w = 18 + R() * 26;
    wrap(() => {
      t.strokeStyle = 'rgba(120,92,52,.55)'; t.lineWidth = 1.4; t.lineCap = 'round';
      t.beginPath(); t.moveTo(px, py); t.quadraticCurveTo(px + w / 2, py - 4, px + w, py); t.stroke();
      t.strokeStyle = 'rgba(30,20,10,.3)'; t.lineWidth = 1; t.beginPath(); t.moveTo(px + 1, py + 2); t.quadraticCurveTo(px + w / 2, py - 2, px + w - 1, py + 2); t.stroke();
    });
  }
  // камешки
  for (let i = 0; i < 40; i++) {
    const px = R() * TILE, py = R() * TILE, r = 1 + R() * 2;
    wrap(() => { t.fillStyle = '#6a5638'; t.beginPath(); t.ellipse(px, py, r * 1.3, r, 0, 0, TAU); t.fill(); });
  }
});

const snowTile = makeTile(47, '#4c5a6c', ({ t, R, wrap, blobs, specks }) => {
  blobs(16, 'rgba(200,220,240,.32)', 'rgba(20,30,50,.32)', 30, 60);
  specks(260, 'rgba(255,255,255,.12)', 'rgba(20,30,50,.12)');
  // сугробы
  for (let i = 0; i < 24; i++) {
    const px = R() * TILE, py = R() * TILE, w = 14 + R() * 22;
    wrap(() => {
      t.fillStyle = 'rgba(220,234,248,.25)'; t.beginPath(); t.ellipse(px, py, w, w * 0.32, 0, Math.PI, 0); t.fill();
      t.strokeStyle = 'rgba(140,170,210,.35)'; t.lineWidth = 1; t.beginPath(); t.ellipse(px, py, w, w * 0.32, 0, Math.PI * 1.1, Math.PI * 1.9); t.stroke();
    });
  }
  // лёд
  for (let i = 0; i < 6; i++) {
    const px = R() * TILE, py = R() * TILE, rx = 10 + R() * 16;
    wrap(() => { t.fillStyle = 'rgba(150,200,240,.18)'; t.beginPath(); t.ellipse(px, py, rx, rx * 0.45, 0, 0, TAU); t.fill(); t.strokeStyle = 'rgba(255,255,255,.2)'; t.lineWidth = 0.8; t.stroke(); });
  }
});

const hellTile = makeTile(59, '#2a1411', ({ t, R, wrap, blobs, specks }) => {
  blobs(16, 'rgba(110,30,14,.35)', 'rgba(0,0,0,.45)', 26, 56);
  specks(260, 'rgba(255,140,80,.05)', 'rgba(0,0,0,.18)');
  // раскалённые трещины
  for (let i = 0; i < 14; i++) {
    let px = R() * TILE, py = R() * TILE;
    const pts = [[px, py]];
    for (let k = 0; k < 4; k++) { px += (R() - 0.5) * 30; py += (R() - 0.5) * 30; pts.push([px, py]); }
    wrap(() => {
      for (const pass of [[5, 'rgba(255,80,20,.12)'], [2, 'rgba(255,110,30,.5)'], [0.7, 'rgba(255,210,120,.65)']]) {
        t.strokeStyle = pass[1]; t.lineWidth = pass[0]; t.lineCap = 'round'; t.lineJoin = 'round';
        t.beginPath(); pts.forEach((q, j) => (j ? t.lineTo(q[0], q[1]) : t.moveTo(q[0], q[1]))); t.stroke();
      }
    });
  }
  // пепел и камни
  for (let i = 0; i < 40; i++) {
    const px = R() * TILE, py = R() * TILE, r = 1 + R() * 2.4;
    wrap(() => { t.fillStyle = '#140a08'; t.beginPath(); t.ellipse(px, py, r * 1.4, r, 0, 0, TAU); t.fill(); });
  }
});

/* ---------- украшения ---------- */
const shadow = (x, w, y) => { x.fillStyle = 'rgba(0,0,0,.3)'; ell(x, 0, y, w, w * 0.28); };

const GRAVE_DECOR = [
  // надгробие
  mk(24, 30, (x) => {
    shadow(x, 10, 12);
    x.beginPath(); x.moveTo(-7, 12); x.lineTo(-7, -4); x.quadraticCurveTo(-7, -12, 0, -12); x.quadraticCurveTo(7, -12, 7, -4); x.lineTo(7, 12); x.closePath();
    x.fillStyle = lg(x, -7, -12, 7, 12, [[0, '#8a8a9a'], [1, '#43434f']]); x.fill(); x.strokeStyle = '#1c1c24'; x.lineWidth = 1; x.stroke();
    x.strokeStyle = 'rgba(20,20,30,.6)'; x.lineWidth = 1.2; line(x, 0, -7, 0, 2); line(x, -3, -4, 3, -4);
    x.fillStyle = 'rgba(255,255,255,.18)'; ell(x, -3.4, -6, 1.2, 3.4, 0.2);
    x.fillStyle = '#3f6e4e'; ell(x, -4, 11, 3, 1.2); ell(x, 4, 11.4, 2.4, 1);
  }),
  // деревянный крест
  mk(20, 30, (x) => {
    shadow(x, 7, 12);
    x.save(); x.rotate(0.12);
    x.fillStyle = '#5a3a22'; x.strokeStyle = '#24140a'; x.lineWidth = 0.9;
    rrect(x, -1.6, -12, 3.2, 24, 0.8); x.fill(); x.stroke(); rrect(x, -6.5, -6.5, 13, 3, 0.8); x.fill(); x.stroke();
    x.restore();
    x.fillStyle = '#4a3a2a'; ell(x, 0, 12, 6, 2);
  }),
  // сухое дерево
  mk(40, 44, (x) => {
    shadow(x, 12, 19);
    x.strokeStyle = '#1a1418'; x.lineCap = 'round';
    x.lineWidth = 4; line(x, 0, 19, 1, 0);
    x.lineWidth = 2.6; line(x, 1, 2, -9, -10); line(x, 1, 0, 10, -12); line(x, 1, 4, 13, -2);
    x.lineWidth = 1.4; line(x, -9, -10, -14, -12); line(x, -9, -10, -8, -18); line(x, 10, -12, 9, -19); line(x, 10, -12, 16, -15); line(x, 13, -2, 17, -6);
    x.strokeStyle = '#3a2e36'; x.lineWidth = 1.6; line(x, -0.4, 17, 0.4, 2);
  }),
  // свеча на камне
  mk(18, 22, (x) => {
    shadow(x, 7, 8);
    x.fillStyle = '#4a4a56'; ell(x, 0, 6, 7, 3);
    x.fillStyle = '#ece6d6'; rrect(x, -1.6, -3, 3.2, 8, 0.8); x.fill();
    glowOn(x, '#ffb84a', 6); x.fillStyle = '#ffd56e'; ell(x, 0, -5, 1.4, 2.4); glowOff(x);
    x.fillStyle = '#fff6d8'; ell(x, 0, -4.6, 0.6, 1.1);
  }),
  // череп и кости
  mk(22, 16, (x) => {
    x.strokeStyle = '#d9d0bc'; x.lineWidth = 1.8; x.lineCap = 'round'; line(x, -8, 5, 7, 2); line(x, -6, 1, 8, 6);
    x.fillStyle = '#ece6d6'; circ(x, 0, -1, 4.2); rrect(x, -2.4, 1.6, 4.8, 2.6, 0.8); x.fill();
    x.fillStyle = '#1a1418'; circ(x, -1.6, -1.2, 1.1); circ(x, 1.6, -1.2, 1.1);
  })
];

const DESERT_DECOR = [
  // кактус
  mk(26, 34, (x) => {
    shadow(x, 8, 14);
    x.fillStyle = lg(x, -5, 0, 5, 0, [[0, '#6aa85a'], [1, '#2f5a2a']]); x.strokeStyle = '#1a3018'; x.lineWidth = 1;
    rrect(x, -3.4, -13, 6.8, 27, 3.4); x.fill(); x.stroke();
    rrect(x, -10, -5, 4.6, 9, 2.3); x.fill(); x.stroke(); rrect(x, -7, 1, 4, 3, 1.4); x.fill();
    rrect(x, 5.4, -9, 4.6, 8, 2.3); x.fill(); x.stroke(); rrect(x, 3, -3, 4, 3, 1.4); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 0.6; line(x, -1, -11, -1, 12);
    x.fillStyle = '#ff7ab0'; circ(x, 0, -13.4, 1.6);
  }),
  // череп быка
  mk(26, 18, (x) => {
    shadow(x, 9, 6);
    x.fillStyle = '#ece4d0'; x.strokeStyle = '#7a6a50'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(-4, -4); x.quadraticCurveTo(0, -6, 4, -4); x.lineTo(2.6, 5); x.quadraticCurveTo(0, 6.4, -2.6, 5); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(-4, -3); x.quadraticCurveTo(-10, -4, -11, -9); x.quadraticCurveTo(-8, -5, -3.4, -5); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(4, -3); x.quadraticCurveTo(10, -4, 11, -9); x.quadraticCurveTo(8, -5, 3.4, -5); x.fill(); x.stroke();
    x.fillStyle = '#2a2016'; circ(x, -1.8, -1.6, 1.1); circ(x, 1.8, -1.6, 1.1);
  }),
  // валун
  mk(30, 22, (x) => {
    shadow(x, 12, 7);
    x.beginPath(); x.moveTo(-11, 6); x.quadraticCurveTo(-12, -4, -4, -7); x.quadraticCurveTo(4, -9, 9, -3); x.quadraticCurveTo(12, 3, 10, 6); x.closePath();
    x.fillStyle = lg(x, -6, -8, 6, 6, [[0, '#a8865a'], [1, '#5a4228']]); x.fill(); x.strokeStyle = '#2e2014'; x.lineWidth = 1; x.stroke();
    x.strokeStyle = 'rgba(46,32,20,.5)'; line(x, -3, -6, 0, 1);
    x.fillStyle = 'rgba(255,240,200,.22)'; ell(x, -4, -4, 3.4, 1.4, -0.3);
  }),
  // сухой куст
  mk(24, 18, (x) => {
    x.strokeStyle = '#8a6a3a'; x.lineWidth = 1; x.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + i * 0.1); line(x, 0, 5, Math.cos(a) * 10, 5 + Math.sin(a) * 9); }
    x.strokeStyle = '#5a4022'; for (let i = 0; i < 5; i++) { const a = Math.PI * (1.2 + i * 0.15); line(x, 0, 5, Math.cos(a) * 7, 5 + Math.sin(a) * 6); }
  })
];

const SNOW_DECOR = [
  // ёлка в снегу
  mk(30, 40, (x) => {
    shadow(x, 10, 16);
    x.fillStyle = '#3a2a1a'; x.fillRect(-1.6, 10, 3.2, 6);
    const tier = (y, w, h) => {
      x.beginPath(); x.moveTo(0, y - h); x.lineTo(w, y); x.lineTo(-w, y); x.closePath();
      x.fillStyle = lg(x, 0, y - h, 0, y, [[0, '#2f6a52'], [1, '#173a2c']]); x.fill(); x.strokeStyle = '#0c2018'; x.lineWidth = 0.9; x.stroke();
      x.fillStyle = 'rgba(235,245,255,.92)'; x.beginPath(); x.moveTo(0, y - h); x.lineTo(w * 0.5, y - h * 0.5); x.quadraticCurveTo(0, y - h * 0.38, -w * 0.5, y - h * 0.5); x.closePath(); x.fill();
    };
    tier(11, 11, 10); tier(4, 8.6, 10); tier(-3, 6, 10);
  }),
  // ледяные кристаллы
  mk(24, 26, (x) => {
    shadow(x, 8, 10);
    glowOn(x, '#9fe8ff', 5);
    for (const q of [[-4, 0.4, 13], [1, 0, 17], [5, -0.3, 11]]) {
      x.save(); x.translate(q[0], 10); x.rotate(q[1]);
      x.beginPath(); x.moveTo(0, -q[2]); x.lineTo(2.6, -q[2] * 0.6); x.lineTo(2, 0); x.lineTo(-2, 0); x.lineTo(-2.6, -q[2] * 0.6); x.closePath();
      x.fillStyle = lg(x, -2, -q[2], 2, 0, [[0, '#ffffff'], [1, '#5ab8e8']]); x.fill();
      x.restore();
    }
    glowOff(x);
  }),
  // камень под снегом
  mk(30, 20, (x) => {
    shadow(x, 12, 6);
    x.beginPath(); x.moveTo(-11, 6); x.quadraticCurveTo(-12, -3, -4, -6); x.quadraticCurveTo(5, -8, 10, -2); x.quadraticCurveTo(12, 3, 10, 6); x.closePath();
    x.fillStyle = lg(x, -6, -7, 6, 6, [[0, '#7a8494'], [1, '#3a404c']]); x.fill(); x.strokeStyle = '#1a1e26'; x.lineWidth = 1; x.stroke();
    x.fillStyle = '#eef5ff'; x.beginPath(); x.moveTo(-10, -1); x.quadraticCurveTo(-8, -7, 0, -7); x.quadraticCurveTo(8, -7, 10, -2); x.quadraticCurveTo(2, -3, -10, -1); x.fill();
  }),
  // замёрзший куст
  mk(24, 18, (x) => {
    x.fillStyle = '#2a4a5a'; circ(x, -5, 2, 5); circ(x, 4, 2, 5.4); circ(x, 0, -2, 5.6);
    x.fillStyle = 'rgba(235,245,255,.85)'; ell(x, -4, -1, 3.4, 1.4); ell(x, 4, -1.4, 3, 1.2); ell(x, 0, -5, 3.4, 1.4);
    x.fillStyle = '#9fe8ff'; circ(x, -2, 3, 0.8); circ(x, 5, 4, 0.8);
  })
];

const HELL_DECOR = [
  // обсидиановые шипы
  mk(28, 32, (x) => {
    shadow(x, 10, 12);
    for (const q of [[-5, 10, 4], [2, 16, 5], [7, 9, 3.4]]) {
      x.beginPath(); x.moveTo(q[0] - q[2], 12); x.lineTo(q[0], 12 - q[1] - 6); x.lineTo(q[0] + q[2], 12); x.closePath();
      x.fillStyle = lg(x, q[0] - q[2], 0, q[0] + q[2], 0, [[0, '#4a3a5a'], [1, '#100a18']]); x.fill(); x.strokeStyle = '#05030a'; x.lineWidth = 0.8; x.stroke();
      x.strokeStyle = 'rgba(255,90,40,.6)'; x.lineWidth = 0.6; line(x, q[0] - 0.6, 11, q[0] - 0.2, 12 - q[1]);
    }
  }),
  // лужа лавы
  mk(40, 22, (x) => {
    x.fillStyle = '#140806'; ell(x, 0, 1, 18, 8);
    glowOn(x, '#ff6a1a', 8);
    x.fillStyle = rg(x, 0, 0, 1, 0, 0, 15, [[0, '#ffe08a'], [0.4, '#ff8a2a'], [1, '#b8240a']]); ell(x, 0, 0, 15, 6);
    glowOff(x);
    x.fillStyle = 'rgba(40,10,4,.6)'; ell(x, -5, 1, 3, 1.2); ell(x, 6, -1, 2.4, 1);
  }),
  // груда костей
  mk(26, 18, (x) => {
    shadow(x, 10, 6);
    x.strokeStyle = '#cfc4a8'; x.lineWidth = 1.8; x.lineCap = 'round';
    line(x, -9, 5, 6, 0); line(x, -7, 0, 9, 5); line(x, -3, 6, 2, -3);
    x.fillStyle = '#e0d6bc'; circ(x, 4, -2, 3.6); x.fillStyle = '#1a0a08'; circ(x, 2.8, -2.4, 0.9); circ(x, 5.2, -2.4, 0.9);
  }),
  // огненная жаровня
  mk(20, 30, (x) => {
    shadow(x, 7, 12);
    x.fillStyle = '#2a1e1a'; x.beginPath(); x.moveTo(-6, 2); x.lineTo(6, 2); x.lineTo(3, 12); x.lineTo(-3, 12); x.closePath(); x.fill();
    x.strokeStyle = '#5a4030'; x.lineWidth = 0.8; x.stroke();
    glowOn(x, '#ff6a1a', 8);
    x.fillStyle = '#ff7a2e'; x.beginPath(); x.moveTo(-5, 2); x.quadraticCurveTo(-5, -6, 0, -12); x.quadraticCurveTo(5, -6, 5, 2); x.closePath(); x.fill();
    glowOff(x);
    x.fillStyle = '#ffd56e'; x.beginPath(); x.moveTo(-2.4, 2); x.quadraticCurveTo(-2.4, -3, 0, -6); x.quadraticCurveTo(2.4, -3, 2.4, 2); x.closePath(); x.fill();
  })
];

/* ---------- список местностей ---------- */
export const BIOMES = [
  { id: 'forest', name: 'Ночной лес', tile: forestTile, decor: DECOR, density: 0.17, air: 'fireflies', tint: null, edge: EDGE.forest, light: 'cyan' },
  { id: 'grave', name: 'Старое кладбище', tile: graveTile, decor: GRAVE_DECOR, density: 0.2, air: 'fog', tint: 'rgba(80,60,140,.10)', edge: EDGE.grave, light: 'purple' },
  { id: 'desert', name: 'Пустоши', tile: desertTile, decor: DESERT_DECOR, density: 0.13, air: 'dust', tint: 'rgba(255,170,60,.07)', edge: EDGE.desert, light: 'amber' },
  { id: 'snow', name: 'Ледяная тундра', tile: snowTile, decor: SNOW_DECOR, density: 0.15, air: 'snow', tint: 'rgba(120,180,255,.08)', edge: EDGE.snow, light: 'blue' },
  { id: 'hell', name: 'Пекло', tile: hellTile, decor: HELL_DECOR, density: 0.15, air: 'embers', tint: 'rgba(255,60,20,.08)', edge: EDGE.hell, light: 'orange' }
];
export const BIOME_EVERY = 120;      // смена местности каждые 2 минуты
export const HELL = BIOMES.length - 1;
