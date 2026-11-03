/* =====================================================
   ОБРАТНАЯ СВЯЗЬ ИГРОКУ
   Всплывающие сообщения, искры, цифры урона, эффекты на земле.
   ===================================================== */
import { TAU } from '../gfx.js';
import { ui } from '../store.js';
import { G } from './state.js';

/* --- мелочи --- */
let toastN = 0;
export function toast(s) { ui.set({ toast: { id: ++toastN, text: s } }); }
export function burst(x, y, col, n, spd) {
  for (let i = 0; i < n && G.parts.length < 300; i++) {
    const a = Math.random() * TAU, v = spd * (0.4 + Math.random() * 0.8);
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.35 + Math.random() * 0.3, col, s: 2 + Math.random() * 2.5 });
  }
}
export function pop(x, y, s, col, big) { if (G.texts.length < 36) G.texts.push({ x, y, s, col, big, life: 0.6 }); }
export function addFx(f) { if (G.fx.length < 160) G.fx.push(f); }
