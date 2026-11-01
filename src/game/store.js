/* =====================================================
   МОСТИК МЕЖДУ ИГРОЙ И REACT
   Игра пишет сюда, что показать (экран, HUD, карточки),
   а React-компоненты подписываются и перерисовываются.
   ===================================================== */
import { useSyncExternalStore } from 'react';

function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      let changed = false;
      for (const k in patch) if (state[k] !== patch[k]) { changed = true; break; }
      if (!changed) return;
      state = { ...state, ...patch };
      subs.forEach((f) => f());
    },
    subscribe(f) { subs.add(f); return () => subs.delete(f); }
  };
}

// Экраны и всё, что меняется редко
export const ui = createStore({
  screen: 'menu',      // menu | play | levelup | chest | pause | dead
  heroId: 'mage',
  best: 0,
  hint: false,
  toast: null,         // { id, text }
  inv: null,           // слоты оружия, реликвий и предметов
  choices: [],         // карточки нового уровня
  rerolls: 0,
  chest: null,         // награда из сундука
  pause: null,         // снаряжение для экрана паузы
  dead: null,          // итоги забега
  account: { status: 'checking', user: null }
});

// HUD — обновляется часто, поэтому отдельно
export const hud = createStore({
  lvl: 1, time: '0:00', kills: 0, doom: false,
  hp: 100, maxHp: 100, hpK: 1, xpK: 0,
  boss: null, buffs: []
});

export function useStore(store) {
  return useSyncExternalStore(store.subscribe, store.get);
}
