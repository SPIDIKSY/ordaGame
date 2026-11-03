/* =====================================================
   ЗАБЕГ ЦЕЛИКОМ
   Старт, смерть, пауза, выход в меню, выбор героя, рекорд
   и отчёты забега на сервер.
   ===================================================== */
import { HDEF, fmt } from '../data.js';
import { ui } from '../store.js';
import { api } from '../../net/api.js';
import { refreshMe } from '../../net/account.js';
import { stickReset, showHint, hideHint } from '../input.js';
import { state, G, setState, setG } from './state.js';
import { newGame } from './player.js';
import { toast } from './fx.js';
import { invSnapshot, pauseSnapshot, resetHud } from './hud.js';
import { clearReward } from './chests.js';

// Выбранный герой запоминается в браузере
export let heroId = (() => { try { return localStorage.getItem('orda-hero') || 'mage'; } catch (_) { return 'mage'; } })();
if (!HDEF[heroId]) heroId = 'mage';
export function readBest() { try { return Number(localStorage.getItem('orda-best')) || 0; } catch (_) { return 0; } }
function writeBest(v) { try { localStorage.setItem('orda-best', String(v)); } catch (_) {} }
/* --- забег на сервере: старт, отчёты каждые 15 сек, финиш ---
   Отслеживаем и гостей: если гость умрёт и зарегистрируется, этот забег можно засчитать */
const runReport = (g) => ({ time: Math.floor(g.t * 10) / 10, kills: g.kills, level: g.level, bosses: g.bossKills });
function startOnlineRun(g) {
  const st = (ui.get().account || {}).status;
  if (st !== 'user' && st !== 'guest') return;
  g.run.tracked = true;
  g.run.chain = api.startRun(g.hero).then((r) => { g.run.id = r.runId; g.run.token = r.runToken || null; })
    .catch((e) => { g.run.rejected = e.message; });
}
export function sendBeat(g) {
  if (!g.run.tracked) return;
  const rep = runReport(g);
  // отчёты уходят строго по очереди, чтобы сервер видел их в правильном порядке
  g.run.chain = g.run.chain.then(() => (g.run.id && !g.run.rejected ? api.beat(g.run.id, rep, g.run.token) : null))
    .catch((e) => { if (e.status === 422 || e.status === 404) g.run.rejected = e.message; });
}
function finishOnlineRun(g) {
  const acc = ui.get().account || {};
  if (!g.run.tracked) return { status: acc.status === 'offline' ? 'offline' : 'guest' };
  const rep = runReport(g);
  const upd = (online) => { const d = ui.get().dead; if (d && d.g === g) ui.set({ dead: { ...d, online } }); };
  g.run.chain.then(() => {
    if (g.run.rejected) throw new Error(g.run.rejected);
    if (!g.run.id) throw new Error('Забег не начался на сервере');
    return api.finish(g.run.id, rep, g.run.token);
  }).then((r) => {
    if (r.guest) upd({ status: 'claimable', runId: g.run.id, runToken: g.run.token, score: r.score });
    else { upd({ status: 'ok', place: r.place, heroPlace: r.heroPlace, score: r.score }); refreshMe(); }
  }).catch((e) => upd(g.run.token ? { status: 'guest' } : { status: 'error', msg: e.message }));
  return { status: 'sending' };
}
export function die() {
  stickReset(); hideHint();
  const t = Math.floor(G.t), best = readBest();
  let bestText;
  if (t > best) { writeBest(t); bestText = 'Новый рекорд!'; }
  else bestText = best ? 'Рекорд: ' + fmt(best) : '';
  const g = G;
  ui.set({ dead: { g, time: fmt(t), kills: G.kills, level: G.level, bestText, inv: invSnapshot(), online: null }, best: readBest() });
  ui.set({ dead: { ...ui.get().dead, online: finishOnlineRun(g) } });
  setState('dead');
}
export function startGame() {
  newGame(); stickReset();
  startOnlineRun(G);
  clearReward();
  ui.set({ chest: null, dead: null, pause: null, toast: null });
  resetHud();
  showHint();
  setState('play');
}
export function setPause(on) {
  if (on && state === 'play') { stickReset(); hideHint(); ui.set({ pause: pauseSnapshot() }); setState('pause'); }
  else if (!on && state === 'pause') setState('play');
}
// Возврат в главное меню (там можно сменить героя)
export function goMenu() {
  stickReset(); hideHint();
  setG(null); clearReward();
  ui.set({ toast: null, best: readBest() });
  setState('menu');
}
export function selectHero(id) {
  if (!HDEF[id]) return;
  heroId = id;
  try { localStorage.setItem('orda-hero', heroId); } catch (_) {}
  ui.set({ heroId });
}
