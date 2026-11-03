/* =====================================================
   СУНДУКИ И НАГРАДЫ
   ===================================================== */
import { RAR, addEff, effText, ITEMS, MAX_WEAPONS, WMAX, WEAPONS, WDEF, WEIGHTS } from '../data.js';
import { ui } from '../store.js';
import { stickReset, hideHint } from '../input.js';
import { state, G, setState, resumePlay } from './state.js';
import { applyEff } from './player.js';
import { toast } from './fx.js';
import { openLevelUp } from './levelup.js';

function rollRarity(kind) {
  const L = G.p.luck, base = WEIGHTS[kind] || WEIGHTS.normal;
  const w = base.map((v, i) => v * Math.pow(1 + L, i));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
function rollReward(kind) {
  const g = G, r = rollRarity(kind);
  if (r === 4 && Math.random() < 0.4) {
    const owned = g.wOrder.filter((id) => g.w[id] < WMAX);
    const fresh = g.wOrder.length < MAX_WEAPONS ? WEAPONS.filter((Wd) => !g.w[Wd.id]).map((Wd) => Wd.id) : [];
    const pool = fresh.length && (Math.random() < 0.5 || !owned.length) ? fresh : owned;
    if (pool.length) { const id = pool[Math.floor(Math.random() * pool.length)]; return { type: 'weapon', r, wp: WDEF[id], lvl: (g.w[id] || 0) + 1 }; }
  }
  // предмет ровно этой редкости; легендарку, которая уже есть, второй раз не даём
  for (let rr = r; rr >= 0; rr--) {
    const pool = ITEMS.filter((it) => it.r === rr && !(it.legend && g.legend && g.legend[it.id]));
    if (!pool.length) continue;
    const it = pool[Math.floor(Math.random() * pool.length)];
    return { type: 'item', r: rr, it, eff: Object.assign({}, it.eff) };
  }
  return { type: 'item', r: 0, it: ITEMS[0], eff: Object.assign({}, ITEMS[0].eff) };
}
function applyReward(rw) {
  const g = G;
  if (rw.type === 'weapon') {
    const id = rw.wp.id;
    if (!g.w[id]) { g.wOrder.push(id); g.wt[id] = 0.4; }
    g.w[id] = rw.lvl;
  } else {
    applyEff(g.p, rw.eff);
    if (rw.it.legend) { g.legend = g.legend || {}; g.legend[rw.it.id] = true; }
    let k = g.inv[rw.it.id];
    if (!k) { k = g.inv[rw.it.id] = { count: 0, total: {}, best: 0 }; g.invOrder.push(rw.it.id); }
    k.count++; addEff(k.total, rw.eff); k.best = Math.max(k.best, rw.r);
  }
}
/* --- открытие сундука: анимацию показывает React (ChestScreen) --- */
let curReward = null;
const ROLL_ICONS = Array.from(new Set(ITEMS.map((i) => i.icon).concat(WEAPONS.map((w) => w.icon))));
export function openChest(kind) {
  stickReset(); hideHint();
  curReward = rollReward(kind);
  const rw = curReward;
  const info = {
    id: Math.random(),
    r: rw.r,
    icon: rw.type === 'weapon' ? rw.wp.icon : rw.it.icon,
    lvlTag: rw.type === 'weapon' && rw.lvl > 1 ? 'ур. ' + rw.lvl : '',
    rarity: RAR[rw.r].name + (rw.type === 'weapon' ? (rw.lvl > 1 ? ' · усиление оружия' : ' · новое оружие') : ' · предмет'),
    name: rw.type === 'weapon' ? rw.wp.name : rw.it.name,
    desc: rw.type === 'weapon'
      ? (rw.lvl === 1 ? rw.wp.desc : 'Уровень ' + rw.lvl + ' из ' + WMAX + ': ' + rw.wp.lv[rw.lvl - 2].toLowerCase() + '.')
      : (rw.it.desc || effText(rw.eff)) + '. Действует до конца забега.',
    rollIcons: ROLL_ICONS
  };
  ui.set({ chest: info });
  setState('chest');
}
export function takeChest() {
  if (state !== 'chest' || !curReward) return;
  applyReward(curReward);
  const rw = curReward; curReward = null;
  ui.set({ chest: null });
  resumePlay();
  toast(rw.type === 'weapon' ? rw.wp.name + (rw.lvl > 1 ? ': уровень ' + rw.lvl : ' в деле!') : rw.it.name + ': ' + (rw.it.desc || effText(rw.eff)));
  if (G.pending > 0) openLevelUp();
}
// Новый забег или выход в меню: недооткрытый сундук не переносится
export function clearReward() { curReward = null; }
