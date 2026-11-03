/* =====================================================
   ДВИЖОК ИГРЫ: запуск и цикл кадров
   React вызывает mountGame(canvas, app), дальше каждый кадр:
   обновить мир (run/update.js) → нарисовать (render/) → обновить HUD.
   Логика забега разложена по папке run/, управление — input.js.
   ===================================================== */
import { fmt, STEAL } from './data.js';
import { render } from './render/index.js';
import { perfFrame, perfStats } from './perf.js';
import { settings, onSettings } from './settings.js';
import { ui } from './store.js';
import { canvas, W, stick, keys, KEYMAP, resize, stickReset, stickSet, hintTimer, hideHint, attachScreen, ctx, appEl, H, dpr, hx, hy } from './input.js';
import { state, G, heroSpr } from './run/state.js';
import { heroAttack } from './run/player.js';
import { nearest } from './run/weapons.js';
import { update } from './run/update.js';
import { openChest, takeChest } from './run/chests.js';
import { curChoices, pickChoice, reroll, skipAcceptDelay } from './run/levelup.js';
import { updateHud } from './run/hud.js';
import { heroId, readBest, startGame, setPause, goMenu, selectHero } from './run/session.js';

let raf = 0, last = 0;
// Что было на экране в момент долгого кадра — чтобы видеть не только «тормозит», но и от чего
const perfInfo = () => (G
  ? 'время ' + fmt(G.t) + ', враги ' + G.enemies.length + ', снаряды ' + G.shots.length
    + ', частицы ' + G.parts.length + ', эффекты ' + G.fx.length + ', местность ' + G.biome
  : 'меню');
// Ограничение кадров из настроек. Браузер и так зовёт frame не чаще частоты экрана;
// здесь лишние вызовы просто пропускаются. Счёт идёт от расписания, а не от
// последнего кадра, — так на 144 Гц с ограничением 60 выходит ровно 60, а не 48.
let nextDue = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const lim = settings.fps;
  if (lim) {
    const step = 1000 / lim;
    if (now < nextDue - 0.5) return;
    nextDue = Math.max(nextDue + step, now);
  }
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  const t0 = performance.now();
  if (state === 'play') update(dt);
  const t1 = performance.now();
  if (ctx) render({ ctx, G, state, W, H, dpr, hx, hy, stick, now, heroSpr });
  const t2 = performance.now();
  if (G && state !== 'menu') updateHud();
  const t3 = performance.now();
  perfFrame(now, perfInfo, t1 - t0, t2 - t1, t3 - t2);
}
export function mountGame(cv, app) {
  attachScreen(cv, app);
  const onDown = (e) => {
    if (state !== 'play' || stick.id !== null) return;
    const r = canvas.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (Math.hypot(px - stick.bx, py - stick.by) > stick.zone) return;
    e.preventDefault();
    stick.id = e.pointerId; stick.active = true; stickSet(px, py);
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    hideHint();
  };
  const onMove = (e) => {
    if (e.pointerId !== stick.id) return;
    const r = canvas.getBoundingClientRect();
    stickSet(e.clientX - r.left, e.clientY - r.top);
  };
  const onUp = (e) => { if (e.pointerId === stick.id) stickReset(); };
  const onCtx = (e) => e.preventDefault();
  const onKeyDown = (e) => {
    const k = KEYMAP[e.code];
    if (k) { keys.add(k); if (state === 'play') e.preventDefault(); }
    // пока открыто окно (настройки поверх паузы), Esc закрывает только его, игру не трогаем
    if ((e.code === 'Escape' || e.code === 'KeyP') && !document.querySelector('.modal-ov')) setPause(state === 'play');
  };
  const onKeyUp = (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); };
  const onVis = () => { if (document.hidden) setPause(true); };
  const onBlur = () => keys.clear();

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', onCtx);
  // в фазе «перехвата»: игра первой видит Esc и знает, открыто ли окно поверх паузы,
  // даже если окно подписалось на клавиши раньше игры (так бывает после смены холста)
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVis);
  const ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(appEl);
  resize();
  // другое качество графики — другая чёткость холста: пересчитать его размер сразу
  const offSettings = onSettings((s, key) => { if (key === 'quality') resize(); });
  ui.set({ heroId, best: readBest(), screen: state });
  last = performance.now();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
    canvas.removeEventListener('contextmenu', onCtx);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resize);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVis);
    if (ro) ro.disconnect();
    offSettings();
    clearTimeout(hintTimer);
  };
}
// Команды, которые вызывают кнопки интерфейса
export const game = {
  start: startGame,
  pause: () => setPause(true),
  resume: () => setPause(false),
  menu: goMenu,
  selectHero,
  pickChoice,
  reroll,
  takeChest
};
// Только для разработки (npm run dev): доступ к игре из консоли браузера — window.__orda
if (import.meta.env && import.meta.env.DEV) {
  // Бот для проверки баланса: убегает от врагов, собирает опыт, сам выбирает улучшения
  const botInput = () => {
    const p = G.p; let ax = 0, ay = 0;
    for (const e of G.enemies) {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.fuse > 0 && d < 130) { ax += dx / d * 40; ay += dy / d * 40; continue; }
      if (d > 150) continue;
      const w = (e.T.boss ? 4 : e.elite ? 2 : 1) * 2500 / Math.max(12, d - e.r) ** 2;
      ax += dx / d * w; ay += dy / d * w;
    }
    for (const sh of G.eshots) {
      const dx = p.x - sh.x, dy = p.y - sh.y, d = Math.hypot(dx, dy) || 1;
      if (d < 140) { const w = 6000 / Math.max(10, d) ** 2; ax += dx / d * w; ay += dy / d * w; }
    }
    const danger = Math.hypot(ax, ay);
    let tx = 0, ty = 0, best = 300 * 300;
    for (const c of G.chests) { const d2 = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d2 < 600 * 600) { best = -1; tx = c.x - p.x; ty = c.y - p.y; break; } }
    if (best > 0) for (const gm of G.gems) { const d2 = (gm.x - p.x) ** 2 + (gm.y - p.y) ** 2; if (d2 < best) { best = d2; tx = gm.x - p.x; ty = gm.y - p.y; } }
    // если опыта рядом нет — подходим к врагам на расстояние удара
    if (best === 300 * 300) {
      const e = nearest(p.x, p.y, 700);
      const near = G.heroWeapon === 'aura' ? 60 : 110;
      if (e) { const ex = e.x - p.x, ey = e.y - p.y, d = Math.hypot(ex, ey) || 1; if (d > near) { tx = ex; ty = ey; } }
    }
    const tl = Math.hypot(tx, ty) || 1;
    let vx = ax + tx / tl * (danger < 1.2 ? 1.2 : 0.3), vy = ay + ty / tl * (danger < 1.2 ? 1.2 : 0.3);
    // немного кружим, чтобы не упираться в толпу
    vx += -ay * 0.4; vy += ax * 0.4;
    const l = Math.hypot(vx, vy);
    if (l < 0.05) { stick.vx = 0; stick.vy = 0; return; }
    stick.vx = vx / l; stick.vy = vy / l;
  };
  let soloMode = false;
  const botPick = () => {
    const owned = G.wOrder.length;
    let bi = 0, bs = -1;
    curChoices.forEach((c, i) => {
      let sc = Math.random();
      if (soloMode && c.type === 'wnew') sc -= 10;
      if (c.type === 'wup') sc += 3;
      else if (c.type === 'wnew') sc += owned < 4 ? 2.5 : 0.5;
      else if (c.type === 'rnew' || c.type === 'rup') sc += 1.5;
      else if (c.type === 'stat') sc += 1 + c.r * 0.3;
      else if (c.type === 'dup') sc += 2;
      if (sc > bs) { bs = sc; bi = i; }
    });
    skipAcceptDelay(); pickChoice(bi);
  };
  window.__orda = {
    get G() { return G; },
    get state() { return state; },
    // Статистика кадров за последние ~10 секунд: __orda.fps()
    fps: () => perfStats(),
    openChest: (kind) => openChest(kind || 'boss'),
    levelUp: () => { if (G) { G.pending++; } },
    heroAttack: () => G && heroAttack(),
    // Прогон забега без отрисовки. Пример: __orda.sim({ hero: 'knight', max: 900 }).
    // weapon и lvl — начать с одним оружием нужного уровня: __orda.sim({ weapon: 'whip', lvl: 10, solo: true })
    // steal — подменить настройки кражи жизни Негжера на время прогона: __orda.sim({ hero: 'vampire', steal: { chance: 0.01 } })
    sim(o) {
      const opt = Object.assign({ hero: 'mage', max: 900, dt: 1 / 30, weapon: null, lvl: 1 }, o);
      const keep = { ...STEAL }; if (opt.steal) Object.assign(STEAL, opt.steal);
      let stolen5 = null;
      selectHero(opt.hero);
      startGame();
      if (opt.weapon) { G.w = { [opt.weapon]: opt.lvl }; G.wOrder = [opt.weapon]; G.wt = { [opt.weapon]: 0.2 }; G.heroWeapon = opt.weapon; }
      G.dmgBy = {}; soloMode = !!opt.solo;
      let steps = 0;
      const t0 = performance.now();
      while (state !== 'dead' && G.t < opt.max) {
        if (state === 'levelup') { botPick(); continue; }
        if (state === 'chest') { takeChest(); continue; }
        botInput();
        update(opt.dt); steps++;
        if (stolen5 === null && G.t >= 300) stolen5 = G.stolen;
      }
      Object.assign(STEAL, keep);
      const r = { hero: opt.hero, time: Math.round(G.t), kills: G.kills, level: G.level, weapons: G.wOrder.map((id) => id + G.w[id]).join(','),
        dmgBy: G.dmgBy, hp: Math.round(G.p.hp), maxHp: G.p.maxHp,
        st: { dmg: +(G.p.dmg / 14).toFixed(2), haste: +(1 / G.p.cdMul).toFixed(2), area: +G.p.area.toFixed(2), dur: +G.p.dur.toFixed(2), regen: +G.p.regen.toFixed(2), armor: G.p.armor, amount: G.p.amount, crit: +G.p.crit.toFixed(2), revive: G.p.revive, revUsed: G.p.revUsed }, stolen: G.stolen, stolen5, steals: G.steals, ms: Math.round(performance.now() - t0), dead: state === 'dead' };
      stickReset(); goMenu();
      return r;
    }
  };
}
