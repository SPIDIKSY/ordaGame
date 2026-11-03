/* =====================================================
   НОВЫЙ УРОВЕНЬ: оружие, реликвии, характеристики, переброс
   ===================================================== */
import { RAR, scaleEff, addEff, effText, effHint, MAX_WEAPONS, WMAX, WEAPONS, MAX_RELICS, RMAX, RCOL, RELICS, STATS, WDEF, SDEF, RDEF, HDEF, wDesc, wLv, weaponFacts } from '../data.js';
import { ui } from '../store.js';
import { stickReset, hideHint } from '../input.js';
import { state, G, setState, resumePlay } from './state.js';
import { applyEff } from './player.js';

let acceptAt = 0;
function rollStatRarity() {
  const L = G.p.luck, w = [60, 25, 10, 4, 1].map((v, i) => v * Math.pow(1 + L, i));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i; }
  return 0;
}
function buildChoices() {
  const g = G, pool = [];
  g.wOrder.forEach((id) => { if (g.w[id] < WMAX) pool.push({ type: 'wup', id, w: 3 }); });
  if (g.wOrder.length < MAX_WEAPONS) WEAPONS.forEach((Wd) => { if (!g.w[Wd.id]) pool.push({ type: 'wnew', id: Wd.id, w: 1.1 }); });
  g.rOrder.forEach((id) => { if (g.r[id] < RMAX) pool.push({ type: 'rup', id, w: 2 }); });
  if (g.rOrder.length < MAX_RELICS) RELICS.forEach((R) => { if (!g.r[R.id]) pool.push({ type: 'rnew', id: R.id, w: 0.9 }); });
  STATS.forEach((S) => { const n = g.st[S.id] ? g.st[S.id].n : 0; if (n < S.max) pool.push({ type: 'stat', id: S.id, w: S.fixed ? 0.3 : 0.8 }); });
  const out = [];
  while (out.length < 3 && pool.length) {
    let r = Math.random() * pool.reduce((a, b) => a + b.w, 0), idx = 0;
    for (; idx < pool.length - 1; idx++) { r -= pool[idx].w; if (r <= 0) break; }
    const c = pool.splice(idx, 1)[0];
    if (c.type === 'stat') {
      const S = SDEF[c.id];
      c.r = Math.max(rollStatRarity(), S.minR || 0);
      c.eff = S.fixed ? Object.assign({}, S.eff) : scaleEff(S.eff, RAR[c.r].mult);
    }
    out.push(c);
  }
  if (!out.length) out.push({ type: 'heal' });
  return out;
}
export let curChoices = [];
function cardParts(c) {
  let cc, cat, lv, icon, name, desc, hint = '', cls = '', pips = null; // hint — что значат эти бонусы; pips — [какой уровень берём, сколько всего]
  if (c.type === 'wnew' || c.type === 'wup') {
    const Wd = WDEF[c.id], n = G.w[c.id] || 0;
    icon = Wd.icon; name = Wd.name;
    if (c.type === 'wnew') { cc = '#ffb02e'; cat = 'Новое оружие'; lv = 'слот ' + (G.wOrder.length + 1) + ' из ' + MAX_WEAPONS; desc = weaponFacts(c.id, 1, G.p); hint = wDesc(Wd); cls = 'weap'; }
    else { cc = '#ffd56e'; cat = 'Оружие'; lv = 'ур. ' + (n + 1) + ' из ' + WMAX; desc = wLv(Wd, n - 1, G.p.steal); cls = 'wup'; pips = [n + 1, WMAX]; }
  } else if (c.type === 'rnew' || c.type === 'rup') {
    const R = RDEF[c.id], n = G.r[c.id] || 0;
    cc = RCOL; icon = R.icon; name = R.name; desc = (c.type === 'rnew' ? '' : 'Ещё ') + effText(R.eff).split(', ').join(' · '); hint = effHint(R.eff); cls = 'relic';
    if (c.type === 'rnew') { cat = 'Новая реликвия'; lv = 'слот ' + (G.rOrder.length + 1) + ' из ' + MAX_RELICS; }
    else { cat = 'Реликвия'; lv = 'ур. ' + (n + 1) + ' из ' + RMAX; pips = [n + 1, RMAX]; }
  } else if (c.type === 'stat') {
    const S = SDEF[c.id], n = G.st[c.id] ? G.st[c.id].n : 0;
    cc = RAR[c.r].col; icon = S.icon; name = S.name; cat = RAR[c.r].name; lv = 'ур. ' + (n + 1) + ' из ' + S.max; desc = effText(c.eff).split(', ').join(' · '); hint = effHint(c.eff); cls = 'r' + c.r; pips = [n + 1, S.max];
  } else { cc = '#ff7a8a'; icon = 'heart'; name = 'Лечение'; cat = 'Всё прокачано'; lv = ''; desc = 'Восстановить 50 здоровья.'; }
  return { cc, cls, icon, cat, lv, name, desc, hint, pips };
}
// Счётчик для ключей карточек: новый набор — новые ключи, и React заново проигрывает
// их появление. Не Math.random: интерфейс не должен тратить игровую случайность.
let choiceStamp = 0;
// Способность героя на экране нового уровня: сколько дал этот уровень и сколько уже набралось
export function growInfo() {
  const gr = HDEF[G.hero] && HDEF[G.hero].grow;
  if (!gr) return null;
  return { name: gr.name, now: G.growN > 0 ? effText(gr.eff) : '', total: G.growN > 0 ? effText(scaleEff(gr.eff, G.growN)) : '' };
}
function publishChoices() {
  choiceStamp++;
  ui.set({ choices: curChoices.map((c, i) => ({ ...cardParts(c), key: choiceStamp + ':' + i })), rerolls: G.rerolls, grow: growInfo() });
}
export function openLevelUp() {
  G.lvlArm = false; G.lvlFx = 0; hideHint();
  stickReset(); acceptAt = performance.now() + 350;
  curChoices = buildChoices(); publishChoices();
  setState('levelup');
}
export function pickChoice(i) {
  const c = curChoices[i];
  if (!c || performance.now() < acceptAt || state !== 'levelup') return;
  const g = G, p = g.p;
  if (c.type === 'wnew') { g.w[c.id] = 1; g.wOrder.push(c.id); g.wt[c.id] = 0.3; }
  else if (c.type === 'wup') { g.w[c.id]++; }
  else if (c.type === 'rnew') { g.r[c.id] = 1; g.rOrder.push(c.id); applyEff(p, RDEF[c.id].eff); }
  else if (c.type === 'rup') { g.r[c.id]++; applyEff(p, RDEF[c.id].eff); }
  else if (c.type === 'stat') {
    applyEff(p, c.eff);
    let k = g.st[c.id];
    if (!k) { k = g.st[c.id] = { n: 0, total: {}, best: 0 }; g.stOrder.push(c.id); }
    k.n++; addEff(k.total, c.eff); k.best = Math.max(k.best, c.r);
  } else p.hp = Math.min(p.maxHp, p.hp + 50);
  g.pending--;
  if (g.pending > 0) openLevelUp(); else resumePlay();
}
export function reroll() {
  if (state !== 'levelup' || G.rerolls <= 0) return;
  G.rerolls--; acceptAt = performance.now() + 250;
  curChoices = buildChoices(); publishChoices();
}
// Для бота: выбирать сразу, без защиты от случайного двойного нажатия
export function skipAcceptDelay() { acceptAt = 0; }
