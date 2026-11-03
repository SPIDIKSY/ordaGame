/* =====================================================
   ОБЩЕЕ СОСТОЯНИЕ КАДРА
   Холст, размеры экрана и камера — то, что нужно всем слоям
   отрисовки. Меняются только здесь: setFrame в начале кадра,
   setCamera, когда известно, куда смотрит камера. Остальные
   модули просто читают их: импорт в JS «живой» и всегда видит
   текущее значение.
   ===================================================== */
export let ctx = null, G = null, state = 'menu', W = 0, H = 0, dpr = 1, hx = 0, hy = 0, stick = null, heroSpr = null;
export let cx = 0, cy = 0;
// Запас за краем экрана: крупные враги и свечение не обрезаются на границе
const MARGIN = 80;

export function setFrame(o) {
  ctx = o.ctx; G = o.G; state = o.state; W = o.W; H = o.H; dpr = o.dpr; hx = o.hx; hy = o.hy; stick = o.stick; heroSpr = o.heroSpr;
}
export function setCamera(x, y) { cx = x; cy = y; }
export const inView = (x, y, r) => x > -MARGIN - r && x < W + MARGIN + r && y > -MARGIN - r && y < H + MARGIN + r;

export const auraR = () => (70 + 12 * G.w.aura) * G.p.area;
export function blitGlow(spr, x, y, size, a) { ctx.globalAlpha = a; ctx.drawImage(spr, x - size / 2, y - size / 2, size, size); }
export function star4(x, y, r) {
  ctx.beginPath(); ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
}
export function rotT(a, x, y) { const c = Math.cos(a), s = Math.sin(a); ctx.setTransform(dpr * c, dpr * s, -dpr * s, dpr * c, dpr * x, dpr * y); }
