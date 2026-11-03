/* =====================================================
   ГЕРОЙ
   Новый забег, характеристики героя и анимация атаки.
   Все бонусы складываются (а не умножаются), поэтому
   герой не становится бессмертным.
   ===================================================== */
import { HEROES, HDEF, xpNeed } from '../data.js';
import { HERO_LOOK, getHeroSprites } from '../sprites/heroes/index.js';
import { G, setG, setHeroSpr } from './state.js';
import { heroId } from './session.js';

// Все бонусы складываются (а не умножаются), поэтому герой не становится бессмертным
function recalc(p) {
  const b = p.b;
  p.dmg = 14 * Math.max(0.4, 1 + b.dmg);
  p.cdMul = 1 / Math.max(0.5, 1 + b.haste);
  p.speed = p.baseSpeed * Math.max(0.5, 1 + b.speed);
  p.magnet = 84 * Math.max(0.5, 1 + b.magnet);
  p.pspeedMul = Math.max(0.5, 1 + b.pspeed);
  p.rangeMul = Math.max(0.5, 1 + b.range);
  p.maxHp = Math.max(20, p.maxHp);
  p.hp = Math.min(p.hp, p.maxHp);
}
const MIN_MAX_HP = 30;
export function applyEff(p, eff) {
  for (const k in eff) {
    const v = eff[k];
    if (k === 'dmg' || k === 'haste' || k === 'speed' || k === 'magnet' || k === 'pspeed' || k === 'range') p.b[k] += v;
    // «Стеклянная пушка» на 8-м уровне отнимает 80 здоровья — у разбойницы это всё её здоровье
    else if (k === 'hp') { p.maxHp = Math.max(MIN_MAX_HP, p.maxHp + v); p.hp = v > 0 ? p.hp + v : Math.min(p.hp, p.maxHp); }
    else if (k === 'xp') p.xpMul += v;
    else p[k] += v;
  }
  recalc(p);
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function newGame() {
  const h = HDEF[heroId] || HEROES[0];
  setG({
    t: 0, kills: 0, level: 1, xp: 0, need: xpNeed(1), pending: 0, rerolls: 3, hero: h.id, heroWeapon: h.weapon,
    p: {
      x: 0, y: 0, r: 14, hp: h.hp, maxHp: h.hp, baseSpeed: h.speed, b: { dmg: 0, haste: 0, speed: 0, magnet: 0, pspeed: 0, range: 0 },
      area: 1, dur: 1, amount: 0, regen: 0, crit: 0.05, critDmg: 2, vamp: 0, armor: 0, luck: 0, xpMul: 1, dodge: 0, thorns: 0, revive: 0,
      inv: 0, hurt: 0, face: 1, dirX: 1, dirY: 0, walkT: 0, moving: false, bladeA: 0, webT: 0,
      atk: -1, faceLock: 0, atkDur: (HERO_LOOK[h.id] || HERO_LOOK.mage).atk,
      steal: !!h.steal // кража жизни (Негжер)
    },
    w: { [h.weapon]: 1 }, wOrder: [h.weapon], wt: { [h.weapon]: 0.2 }, r: {}, rOrder: [], st: {}, stOrder: [], inv: {}, invOrder: [], frostA: 0,
    doom: false, doomWarn: false, doomMin: 0, vampBank: 0, eshots: [], bossN: 0, stolen: 0, steals: 0, bySoul: false,
    enemies: [], shots: [], gems: [], chests: [], parts: [], texts: [], rings: [], bolts: [], meteors: [], puddles: [], flasks: [],
    spawnAcc: 0, nextId: 1, waveT: 45, bossT: 150, eliteT: 75, unlocked: 1,
    pickups: [], buffs: { rage: 0, haste: 0 }, flash: 0, shake: 0, corpses: [], fx: [],
    lvlFx: 0, lvlArm: false, hurtFx: 0, dustT: 0, bladeN: 0, bladeR: 64, bossKills: 0,
    run: { id: null, chain: Promise.resolve(), nextBeat: 15, rejected: null },
    // порядок местностей в этом забеге (Пекло всегда в конце)
    biomeOrder: shuffle([0, 1, 2, 3]), biome: 0, biomePrev: null, biomeK: 1
  });
  G.biome = G.biomeOrder[0];
  applyEff(G.p, h.eff);
  setHeroSpr(getHeroSprites(h.id));
}
// Анимация атаки рукой (замах мечом, взмах посохом, бросок кинжала)
export function heroAttack() {
  const p = G.p;
  if (p.atk < 0 || p.atk > 0.6) p.atk = 0;
  p.faceLock = p.atkDur * 0.8; // смотрим на цель, пока бьём
}
