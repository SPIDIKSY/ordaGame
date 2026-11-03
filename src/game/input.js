/* =====================================================
   ЭКРАН И УПРАВЛЕНИЕ
   Размер холста и положение героя на экране, джойстик,
   клавиатура и подсказка «как бегать».
   ===================================================== */
import { resizeRender } from './render/index.js';
import { ui } from './store.js';
import { settings, QUALITY, renderInfo } from './settings.js';
import { createGLContext } from './gl/canvas2d.js';

export let canvas = null, ctx = null, appEl = null;
export let W = 0, H = 0, dpr = 1, hx = 0, hy = 0;
export const stick = { id: null, bx: 0, by: 0, vx: 0, vy: 0, active: false, max: 50, zone: 120 };
export const keys = new Set();
export const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' };
export function resize() {
  if (!appEl) return;
  // Пока страница не разложилась (а ResizeObserver срабатывает и в этот момент),
  // размеры нулевые. Считать по ним нечего, а деление на ноль ниже роняло
  // всю игру: React ловил исключение и выбрасывал приложение целиком.
  const w = appEl.clientWidth, h = appEl.clientHeight;
  if (w < 1 || h < 1) return;
  W = w; H = h;
  // чёткость холста ограничена настройкой графики: каждая ступень — в разы меньше пикселей
  dpr = Math.min(window.devicePixelRatio || 1, QUALITY[settings.quality].dprMax);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const land = W > H * 1.15;
  hx = W / 2; hy = land ? H * 0.5 : H * 0.42;
  stick.bx = land ? Math.min(150, W * 0.18) : W / 2;
  stick.by = H - (land ? 110 : Math.max(150, H * 0.19));
  ui.set({ hintBottom: H - stick.by + stick.max + 26 });
  resizeRender(W, H, hy, dpr, !!(ctx && ctx.isGL));
}
export function stickReset() { stick.id = null; stick.active = false; stick.vx = 0; stick.vy = 0; }
export function stickSet(px, py) {
  let dx = px - stick.bx, dy = py - stick.by;
  const d = Math.hypot(dx, dy);
  if (d > stick.max) { dx = dx / d * stick.max; dy = dy / d * stick.max; }
  let vx = dx / stick.max, vy = dy / stick.max;
  if (Math.hypot(vx, vy) < 0.14) { vx = 0; vy = 0; }
  stick.vx = vx; stick.vy = vy;
}
export let hintTimer = 0;
export function showHint() { ui.set({ hint: true }); clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 7000); }
export function hideHint() { ui.set({ hint: false }); }
// Холст игры: по умолчанию рисует видеокарта (WebGL). Не вышло — обычный холст.
// У одного холста может быть только один способ рисования, поэтому при смене
// настройки React создаёт новый холст (см. App.jsx).
// Не удалось рисовать видеокартой (или она «отвалилась» и не вернулась) —
// просим React создать новый холст, и игра продолжит обычным способом
function glFail() {
  renderInfo.glFailed = true;
  ui.set({ canvasKey: (ui.get().canvasKey || 0) + 1 });
}
export function attachScreen(cv, app) {
  canvas = cv; appEl = app; ctx = null;
  if (settings.renderer === 'gl' && !renderInfo.glFailed) {
    ctx = createGLContext(canvas, { noAA: settings.quality === 'low', onFail: glFail });
    if (!ctx) renderInfo.glFailed = true;
  }
  if (!ctx) ctx = canvas.getContext('2d');
  // холст уже занят под WebGL, а запустить его не вышло — нужен новый холст
  if (!ctx) { renderInfo.active = 'none'; glFail(); return; }
  renderInfo.active = ctx.isGL ? 'gl' : '2d';
  renderInfo.gl = ctx.isGL ? ctx : null;
}
