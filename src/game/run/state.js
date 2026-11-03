/* =====================================================
   ОБЩЕЕ СОСТОЯНИЕ ЗАБЕГА
   Текущий экран (state), сам забег (G) и картинки героя.
   Менять их можно только здесь — через setState, setG, setHeroSpr;
   остальные модули читают их напрямую: импорт в JS «живой».
   ===================================================== */
import { ui } from '../store.js';

export let state = 'menu'; // menu | play | levelup | chest | pause | dead
export let G = null;
export let heroSpr = null;
export function setState(s) { state = s; ui.set({ screen: s }); }
export function setG(g) { G = g; }
export function setHeroSpr(s) { heroSpr = s; }

// Передышка после выбора улучшения, сундука или паузы: мир полсекунды стоит,
// потом плавно разгоняется, а герой это время неуязвим — чтобы успеть оглядеться
export const GRACE_FREEZE = 0.35, GRACE_RAMP = 0.55, GRACE_INV = 1.2;
export function resumePlay() {
  if (G) { G.grace = GRACE_FREEZE + GRACE_RAMP; G.p.inv = Math.max(G.p.inv, GRACE_INV); }
  setState('play');
}
