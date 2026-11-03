/* =====================================================
   ИНСТРУМЕНТЫ РИСОВАНИЯ: все спрайты рисуются кодом
   один раз при загрузке и складываются в canvas-картинки.
   ===================================================== */
export const TAU = Math.PI * 2;
export const rnd = (a, b) => a + Math.random() * (b - a);

export const SS = 3; // во сколько раз чётче рисуем спрайты
let curSS = SS;
// Масштаб для размытия свечения (shadowBlur не зависит от transform)
export function setGlowScale(s) { curSS = s; }
export function mk(w, h, fn, ss) {
  ss = ss || SS; curSS = ss;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * ss); c.height = Math.ceil(h * ss);
  const x = c.getContext('2d');
  x.scale(ss, ss); x.translate(w / 2, h / 2);
  x.lineJoin = 'round'; x.lineCap = 'round';
  fn(x, w, h);
  c.w = w; c.h = h;
  return c;
}
export function tint(src, col, a) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.globalAlpha = a; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  c.w = src.w; c.h = src.h;
  return c;
}
export function rg(x, x0, y0, r0, x1, y1, r1, stops) { const g = x.createRadialGradient(x0, y0, r0, x1, y1, r1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
export function lg(x, x0, y0, x1, y1, stops) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach((s) => g.addColorStop(s[0], s[1])); return g; }
export function ell(x, cx, cy, rx, ry, rot) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU); x.fill(); }
export function circ(x, cx, cy, r) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
export function rrect(x, rx, ry, w, h, r) {
  x.beginPath(); x.moveTo(rx + r, ry); x.lineTo(rx + w - r, ry); x.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
  x.lineTo(rx + w, ry + h - r); x.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h); x.lineTo(rx + r, ry + h);
  x.quadraticCurveTo(rx, ry + h, rx, ry + h - r); x.lineTo(rx, ry + r); x.quadraticCurveTo(rx, ry, rx + r, ry); x.closePath();
}
export function star(x, cx, cy, r) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); }
// Круглое пятно «из центра наружу»: лужи, туман, выжженная земля.
// Строится один раз, дальше просто растягивается до нужного размера.
// Создавать такой градиент каждый кадр дорого: браузер копит мусор и
// раз в десяток кадров замирает, чтобы его убрать — это видно как рывки.
export function softSprite(stops, px) {
  px = px || 128;
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
  stops.forEach((s) => g.addColorStop(s[0], s[1]));
  x.fillStyle = g; x.fillRect(0, 0, px, px);
  return c;
}

export function glowOn(x, col, b) { x.shadowColor = col; x.shadowBlur = b * curSS; }
export function glowOff(x) { x.shadowBlur = 0; x.shadowColor = 'transparent'; }
export function line(x, a, b, c, d) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); }
export function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Обводка вокруг картинки: помогает отличить героя от монстров
export function outline(src, col, px, alpha) {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const x = c.getContext('2d');
  const sil = tint(src, col, 1);
  x.globalAlpha = alpha == null ? 1 : alpha;
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12;
    x.drawImage(sil, Math.cos(a) * px, Math.sin(a) * px);
  }
  x.globalAlpha = 1;
  x.drawImage(src, 0, 0);
  c.w = src.w; c.h = src.h;
  return c;
}

// Ломаная линия для молнии
export function jag(ax, ay, bx, by) {
  const pts = [[ax, ay]], n = 6, dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  for (let i = 1; i < n; i++) { const k = i / n, off = rnd(-1, 1) * Math.min(14, l * 0.12); pts.push([ax + dx * k + nx * off, ay + dy * k + ny * off]); }
  pts.push([bx, by]);
  return pts;
}
