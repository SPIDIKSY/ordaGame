/* =====================================================
   ИНТЕРФЕЙС ВО ВРЕМЯ ИГРЫ
   Снимки снаряжения для HUD, паузы и экрана смерти.
   В React отправляем только то, что поменялось.
   ===================================================== */
import { RAR, effText, ITEMS, MAX_WEAPONS, WMAX, MAX_RELICS, RMAX, RCOL, HEROES, WDEF, RDEF, HDEF, fmt } from '../data.js';
import { PUS } from '../sprites/world.js';
import { hud } from '../store.js';
import { G } from './state.js';

/* --- снаряжение: оружие, реликвии и предметы ---
   Один источник для паузы и итогов забега: значок, цвет, уровень и название */
const weaponSlot = (id) => ({ key: 'w:' + id, icon: WDEF[id].icon, col: RAR[4].col, badge: G.w[id] >= WMAX ? 'MAX' : String(G.w[id]), name: WDEF[id].name, title: WDEF[id].name + ' · ур. ' + G.w[id] });
const relicSlot = (id) => ({ key: 'r:' + id, icon: RDEF[id].icon, col: RCOL, badge: G.r[id] >= RMAX ? 'MAX' : String(G.r[id]), name: RDEF[id].name, title: RDEF[id].name + ' · ур. ' + G.r[id] });
const itemSlot = (id) => {
  const it = ITEMS.find((q) => q.id === id), k = G.inv[id];
  return { key: 'i:' + id, icon: it.icon, col: RAR[k.best].col, badge: k.count > 1 ? '×' + k.count : '', name: it.name, title: it.name + ': ' + effText(k.total) };
};
// Для итогов забега: пустые места показываем, чтобы было видно, сколько слотов осталось
export function invSnapshot() {
  const weapons = [], relics = [];
  for (let i = 0; i < MAX_WEAPONS; i++) weapons.push(G.wOrder[i] ? weaponSlot(G.wOrder[i]) : null);
  for (let i = 0; i < MAX_RELICS; i++) relics.push(G.rOrder[i] ? relicSlot(G.rOrder[i]) : null);
  return { weapons, relics, items: G.invOrder.map(itemSlot) };
}
export function pauseSnapshot() {
  const p = G.p, H0 = HDEF[G.hero] || HEROES[0];
  const pc = (v) => Math.round(v * 100);
  const mod = (v) => (Math.abs(v) < 0.005 ? '0%' : (v > 0 ? '+' : '−') + Math.abs(pc(v)) + '%');
  const tone = (v) => (v > 0.001 ? 'up' : v < -0.001 ? 'down' : '');
  const dec1 = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
  const stats = [
    { id: 'hp', label: 'Здоровье', value: Math.ceil(Math.max(0, p.hp)) + ' / ' + p.maxHp, tone: tone(p.maxHp - H0.hp) },
    { id: 'dmg', label: 'Урон', value: mod(p.b.dmg), tone: tone(p.b.dmg) },
    { id: 'haste', label: 'Скорость атаки', value: mod(p.b.haste), tone: tone(p.b.haste) },
    { id: 'area', label: 'Площадь', value: mod(p.area - 1), tone: tone(p.area - 1) },
    { id: 'amount', label: 'Снаряды', value: '+' + p.amount, tone: tone(p.amount) },
    { id: 'pspeed', label: 'Скорость снарядов', value: mod(p.b.pspeed), tone: tone(p.b.pspeed) },
    { id: 'range', label: 'Дальность', value: mod(p.b.range), tone: tone(p.b.range) },
    { id: 'dur', label: 'Длительность', value: mod(p.dur - 1), tone: tone(p.dur - 1) },
    { id: 'armor', label: 'Броня', value: String(p.armor), tone: tone(p.armor) },
    { id: 'regen', label: 'Регенерация', value: dec1(p.regen) + '/с', tone: tone(p.regen) },
    { id: 'speed', label: 'Скорость бега', value: mod(p.b.speed), tone: tone(p.b.speed) },
    { id: 'magnet', label: 'Притяжение', value: mod(p.b.magnet), tone: tone(p.b.magnet) },
    { id: 'crit', label: 'Шанс крита', value: pc(p.crit) + '%', tone: tone(p.crit - 0.05) },
    { id: 'critDmg', label: 'Сила крита', value: '×' + dec1(p.critDmg), tone: tone(p.critDmg - 2) },
    { id: 'xp', label: 'Опыт', value: mod(p.xpMul - 1), tone: tone(p.xpMul - 1) },
    { id: 'luck', label: 'Удача', value: mod(p.luck), tone: tone(p.luck) },
    { id: 'vamp', label: 'Вампиризм', value: dec1(p.vamp), tone: tone(p.vamp) },
    { id: 'dodge', label: 'Уклонение', value: pc(Math.min(0.4, p.dodge)) + '%', tone: tone(p.dodge) },
    { id: 'thorns', label: 'Шипы', value: String(Math.round(p.thorns)), tone: tone(p.thorns) },
    { id: 'revive', label: 'Воскрешения', value: String(p.revive), tone: tone(p.revive) }
  ];
  // Снаряжение теперь видно только здесь: на игровом экране оно закрывало пол-обзора
  const gear = [
    { id: 'weapons', title: 'Оружие', max: MAX_WEAPONS, slots: G.wOrder.map(weaponSlot) },
    { id: 'relics', title: 'Реликвии', max: MAX_RELICS, slots: G.rOrder.map(relicSlot) },
    { id: 'items', title: 'Предметы', max: 0, slots: G.invOrder.map(itemSlot) }
  ];
  return { stats, gear, hero: H0.name, time: fmt(G.t), level: G.level, kills: G.kills };
}
/* --- HUD: отправляем в React только когда что-то поменялось --- */
let lastHudKey = '';
export function updateHud() {
  const g = G, p = g.p;
  const boss = g.enemies.find((e) => e.T.boss && !e.dead);
  const hpK = Math.round(Math.max(0, p.hp / p.maxHp) * 200) / 200;
  const xpK = Math.round(Math.min(1, g.xp / g.need) * 200) / 200;
  const bossK = boss ? Math.round(Math.max(0, boss.hp / boss.maxHp) * 200) / 200 : 0;
  const hp = Math.ceil(Math.max(0, p.hp));
  const rage = g.buffs.rage > 0 ? Math.ceil(g.buffs.rage) : 0, haste = g.buffs.haste > 0 ? Math.ceil(g.buffs.haste) : 0;
  const time = fmt(g.t);
  const key = [g.level, time, g.kills, g.doom, hp, p.maxHp, hpK, xpK, boss ? boss.T.name : '', bossK, rage, haste].join('|');
  if (key === lastHudKey) return;
  lastHudKey = key;
  const buffs = [];
  if (rage) buffs.push({ id: 'rage', name: PUS.rage.name, col: PUS.rage.col, icon: PUS.rage.icon, left: rage });
  if (haste) buffs.push({ id: 'haste', name: PUS.haste.name, col: PUS.haste.col, icon: PUS.haste.icon, left: haste });
  hud.set({
    lvl: g.level, time, kills: g.kills, doom: g.doom, hp, maxHp: p.maxHp, hpK, xpK,
    boss: boss ? { name: boss.T.name, k: bossK } : null, buffs
  });
}
// Новый забег: HUD нужно отправить заново, даже если цифры совпали с прошлым
export function resetHud() { lastHudKey = ''; }
