/* =====================================================
   ГЕРОЙ
   Новый забег, характеристики героя и анимация атаки.
   Все бонусы складываются (а не умножаются) и упираются
   в потолки, поэтому герой не становится бессмертным.
   ===================================================== */
import { HEROES, HDEF, xpNeed, heroCaps } from '../data.js';
import { HERO_LOOK, getHeroSprites } from '../sprites/heroes/index.js';
import { G, setG, setHeroSpr } from './state.js';
import { heroId } from './session.js';

// Все бонусы складываются (а не умножаются) и у каждой характеристики есть потолок (CAPS
// в data.js), поэтому герой не становится бессмертным.
// p.h — стартовые бонусы героя (на потолок не тратятся), p.b — всё набранное за забег.
const MIN_MAX_HP = 30;
// набранный бонус с учётом потолка (минусы вычитаются как есть)
const got = (p, k) => Math.min(p.caps[k] ?? Infinity, p.b[k] || 0);
const st = (p, k) => p.h[k] || 0;
export function recalc(p) {
  const v = (k) => st(p, k) + got(p, k);
  p.dmg = 14 * Math.max(0.4, 1 + v('dmg'));
  p.cdMul = 1 / Math.max(0.5, 1 + v('haste'));
  p.speed = p.baseSpeed * Math.max(0.5, 1 + v('speed'));
  p.magnet = 84 * Math.max(0.5, 1 + v('magnet'));
  p.pspeedMul = Math.max(0.5, 1 + v('pspeed'));
  p.rangeMul = Math.max(0.5, 1 + v('range'));
  p.area = Math.max(0.5, 1 + v('area'));
  p.dur = Math.max(0.5, 1 + v('dur'));
  p.amount = Math.max(0, v('amount'));
  p.regen = Math.max(0, v('regen'));
  p.armor = v('armor');
  p.crit = Math.max(0, 0.05 + v('crit'));
  p.critDmg = Math.max(1, 2 + v('critDmg'));
  p.vamp = Math.max(0, v('vamp'));
  p.luck = v('luck');
  p.xpMul = Math.max(0.2, 1 + v('xp'));
  p.dodge = Math.max(0, v('dodge'));
  p.thorns = Math.max(0, v('thorns'));
  p.revive = Math.max(0, v('revive') - p.revUsed);
  // «Стеклянная пушка» на 8-м уровне отнимает 80 здоровья — у разбойницы это всё её здоровье
  p.maxHp = Math.max(MIN_MAX_HP, Math.round(p.baseHp + v('hp') + p.hpSteal));
  p.hp = Math.min(p.hp, p.maxHp);
}
// start — стартовые бонусы героя: они не упираются в потолок
export function applyEff(p, eff, start) {
  const into = start ? p.h : p.b, oldMax = p.maxHp;
  for (const k in eff) into[k] = (into[k] || 0) + eff[k];
  recalc(p);
  // прибавка к максимуму здоровья сразу и лечит на столько же
  if (p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
  p.hp = Math.min(p.hp, p.maxHp);
}
// Упёрлась ли характеристика в потолок (тогда её больше не предлагают)
export const isCapped = (p, k) => p.caps[k] !== undefined && (p.b[k] || 0) >= p.caps[k] - 1e-9;
// Можно ли ещё что-то получить от набора бонусов: хоть один плюс не на потолке
export const effUseful = (p, eff) => Object.keys(eff).some((k) => eff[k] > 0 && !isCapped(p, k));
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function newGame() {
  const h = HDEF[heroId] || HEROES[0];
  setG({
    t: 0, kills: 0, level: 1, xp: 0, need: xpNeed(1), pending: 0, rerolls: 3, hero: h.id, heroWeapon: h.weapon || null,
    p: {
      x: 0, y: 0, r: h.r || 14, hp: h.hp, maxHp: h.hp, baseHp: h.hp, hpSteal: 0, revUsed: 0, baseSpeed: h.speed, b: {}, h: {}, caps: heroCaps(h),
      inv: 0, hurt: 0, face: 1, dirX: 1, dirY: 0, walkT: 0, moving: false, bladeA: 0, webT: 0,
      atk: -1, faceLock: 0, atkDur: (HERO_LOOK[h.id] || HERO_LOOK.mage).atk,
      steal: !!h.steal, // кража жизни (Негжер)
      // noLevel — не растёт в уровне и ничего не подбирает (Лилита)
      noLevel: !!h.noLevel
    },
    w: h.weapon ? { [h.weapon]: 1 } : {}, wOrder: h.weapon ? [h.weapon] : [], wt: h.weapon ? { [h.weapon]: 0.2 } : {}, r: {}, rOrder: [], st: {}, stOrder: [], inv: {}, invOrder: [], frostA: 0,
    doom: false, doomWarn: false, doomMin: 0, vampBank: 0, eshots: [], bossN: 0, stolen: 0, steals: 0, bySoul: false, growN: 0,
    enemies: [], shots: [], gems: [], chests: [], parts: [], texts: [], rings: [], bolts: [], meteors: [], puddles: [], flasks: [],
    spawnAcc: 0, nextId: 1, waveT: 45, bossT: 150, eliteT: 75, unlocked: 1,
    pickups: [], buffs: { rage: 0, haste: 0 }, flash: 0, shake: 0, corpses: [], fx: [],
    lvlFx: 0, lvlArm: false, hurtFx: 0, dustT: 0, bladeN: 0, bladeR: 64, bossKills: 0,
    run: { id: null, chain: Promise.resolve(), nextBeat: 15, rejected: null },
    // порядок местностей в этом забеге (Пекло всегда в конце)
    biomeOrder: shuffle([0, 1, 2, 3]), biome: 0, biomePrev: null, biomeK: 1
  });
  G.biome = G.biomeOrder[0];
  recalc(G.p);
  applyEff(G.p, h.eff || {}, true);
  setHeroSpr(getHeroSprites(h.id));
}
// Анимация атаки рукой (замах мечом, взмах посохом, бросок кинжала)
export function heroAttack() {
  const p = G.p;
  if (p.atk < 0 || p.atk > 0.6) p.atk = 0;
  p.faceLock = p.atkDur * 0.8; // смотрим на цель, пока бьём
}
