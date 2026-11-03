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
