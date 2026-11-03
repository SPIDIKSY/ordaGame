/* =====================================================
   ИНТЕРФЕЙС ВО ВРЕМЯ ИГРЫ
   Снимки снаряжения для HUD, паузы и экрана смерти.
   В React отправляем только то, что поменялось.
   ===================================================== */
import { RAR, EFX, effText, effHint, scaleEff, ITEMS, MAX_WEAPONS, WMAX, MAX_RELICS, RMAX, RCOL, HEROES, WDEF, RDEF, HDEF, WINFO, fmt, weaponNums, weaponFacts, STEAL } from '../data.js';
import { PUS } from '../sprites/world.js';
import { hud } from '../store.js';
import { G } from './state.js';

/* --- снаряжение: оружие, реликвии и предметы ---
   Один источник для паузы и итогов забега: значок, цвет, уровень и название */
// У оружия — настоящий урон с учётом всех бонусов: за удар и в секунду по одной цели
const weaponSlot = (id) => {
  const n = weaponNums(id, G.w[id], G.p);
  return { key: 'w:' + id, icon: WDEF[id].icon, col: RAR[4].col, badge: G.w[id] >= WMAX ? 'MAX' : String(G.w[id]), name: WDEF[id].name,
    sub: n ? 'урон ' + (WINFO[id].roll ? '0–' + n.max : n.hit) : '',
    title: WDEF[id].name + ' · ур. ' + G.w[id] + ': ' + weaponFacts(id, G.w[id], G.p) };
};
const relicSlot = (id) => ({ key: 'r:' + id, icon: RDEF[id].icon, col: RCOL, badge: G.r[id] >= RMAX ? 'MAX' : String(G.r[id]), name: RDEF[id].name, title: RDEF[id].name + ' · ур. ' + G.r[id] + ': ' + effText(scaleEff(RDEF[id].eff, G.r[id])) + '. ' + effHint(RDEF[id].eff) });
const itemSlot = (id) => {
  const it = ITEMS.find((q) => q.id === id), k = G.inv[id];
  return { key: 'i:' + id, icon: it.icon, col: RAR[k.best].col, badge: k.count > 1 ? '×' + k.count : '', name: it.name, title: it.name + ': ' + (it.desc || effText(k.total) + '. ' + effHint(it.eff)) };
};
// Для итогов забега: пустые места показываем, чтобы было видно, сколько слотов осталось
export function invSnapshot() {
  const weapons = [], relics = [];
  for (let i = 0; i < MAX_WEAPONS; i++) weapons.push(G.wOrder[i] ? weaponSlot(G.wOrder[i]) : null);
  for (let i = 0; i < MAX_RELICS; i++) relics.push(G.rOrder[i] ? relicSlot(G.rOrder[i]) : null);
  return { weapons, relics, items: G.invOrder.map(itemSlot) };
}
// Что означают цифры в паузе (показывается при наведении)
const UNIT = {
  dmg: 'Урон одного удара главного оружия — это число вылетает над врагом.',
  critDmg: 'Урон одного крита главным оружием.',
  speed: 'Пикселей в секунду.',
  magnet: 'Радиус, с которого опыт сам летит к герою, в пикселях.',
  regen: 'Сколько здоровья восстанавливается за минуту.',
  haste: '100 — как в начале, 120 — бьёт на 20% чаще.',
  area: '100 — как в начале, 120 — зона атак на 20% больше.',
  pspeed: '100 — как в начале, 120 — снаряды летят на 20% быстрее.',
  range: '100 — как в начале, 120 — бьёт на 20% дальше.',
  dur: '100 — как в начале, 120 — эффекты держатся на 20% дольше.',
  xp: '100 — как в начале, 120 — опыта на 20% больше.',
  luck: '100 — как в начале, 120 — редкие награды выпадают чаще.',
  vamp: 'Здоровья за каждое убийство.'
};
export function pauseSnapshot() {
  const p = G.p, H0 = HDEF[G.hero] || HEROES[0];
  const pc = (v) => Math.round(v * 100);
  const mod = (v) => (Math.abs(v) < 0.005 ? '0%' : (v > 0 ? '+' : '−') + Math.abs(pc(v)) + '%');
  const tone = (v) => (v > 0.001 ? 'up' : v < -0.001 ? 'down' : '');
  const dec1 = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
  // Настоящие значения, а не проценты бонусов: урон удара, скорость в пикселях,
  // множители вида «×1,2». Проценты — только у шансов (крит, уклонение)
  // Только целые числа: урон — за один удар главного оружия, остальное — по шкале,
  // где 100 = как в начале (120 — на 20% больше). Проценты остались только у шансов.
  const n100 = (v) => String(Math.round(v * 100));
  const mainId = G.wOrder.includes(G.heroWeapon) ? G.heroWeapon : G.wOrder[0];
  const main = mainId ? weaponNums(mainId, G.w[mainId], p) : null;
  // у монетки урон случайный: показываем наибольший (диапазон «0–N» — в строке урона)
  const mainHit = main ? (WINFO[mainId].roll ? main.max : main.hit) : G.wOrder.length ? Math.round(p.dmg) : 0;
  const stats = [
    { id: 'hp', label: 'Здоровье', value: Math.ceil(Math.max(0, p.hp)) + ' / ' + p.maxHp, tone: tone(p.maxHp - H0.hp) },
    { id: 'dmg', label: 'Урон', value: (main && WINFO[mainId].roll ? '0–' : '') + mainHit, tone: tone(p.b.dmg) },
    { id: 'haste', label: 'Скорость атаки', value: n100(1 / p.cdMul), tone: tone(p.b.haste) },
    { id: 'area', label: 'Площадь', value: n100(p.area), tone: tone(p.area - 1) },
    { id: 'amount', label: 'Снаряды', value: '+' + p.amount, tone: tone(p.amount) },
    { id: 'pspeed', label: 'Скорость снарядов', value: n100(p.pspeedMul), tone: tone(p.b.pspeed) },
    { id: 'range', label: 'Дальность', value: n100(p.rangeMul), tone: tone(p.b.range) },
    { id: 'dur', label: 'Длительность', value: n100(p.dur), tone: tone(p.dur - 1) },
    { id: 'armor', label: 'Броня', value: String(p.armor), tone: tone(p.armor) },
    { id: 'regen', label: 'Регенерация', value: Math.round(p.regen * 60) + '/мин', tone: tone(p.regen) },
    { id: 'speed', label: 'Скорость бега', value: String(Math.round(p.speed)), tone: tone(p.b.speed) },
    { id: 'magnet', label: 'Притяжение', value: String(Math.round(p.magnet)), tone: tone(p.b.magnet) },
    { id: 'crit', label: 'Шанс крита', value: pc(p.crit) + '%', tone: tone(p.crit - 0.05) },
    { id: 'critDmg', label: 'Урон крита', value: String(Math.round(mainHit * p.critDmg)), tone: tone(p.critDmg - 2) },
    { id: 'xp', label: 'Опыт', value: n100(p.xpMul), tone: tone(p.xpMul - 1) },
    { id: 'luck', label: 'Удача', value: n100(1 + p.luck), tone: tone(p.luck) },
    { id: 'vamp', label: 'Вампиризм', value: '+' + dec1(p.vamp), tone: tone(p.vamp) },
    { id: 'dodge', label: 'Уклонение', value: pc(Math.min(p.dodgeCap, p.dodge)) + '%', tone: tone(p.dodge) },
    { id: 'thorns', label: 'Шипы', value: String(Math.round(p.thorns)), tone: tone(p.thorns) },
    { id: 'revive', label: 'Воскрешения', value: String(p.revive), tone: tone(p.revive) }
  ].map((s) => ({ ...s, hint: (UNIT[s.id] ? UNIT[s.id] + ' ' : '') + EFX[s.id].h[0].toUpperCase() + EFX[s.id].h.slice(1) + '.' }));
  // Негжер: сколько максимума здоровья уже накрадено за забег
  if (p.steal) stats.splice(stats.findIndex((s) => s.id === 'vamp') + 1, 0, { id: 'steal', label: 'Кража жизни', value: '+' + G.stolen, tone: tone(G.stolen),
    hint: 'Сколько максимума здоровья украдено за забег. Убийство с шансом лечит на ' + STEAL.heal + ' и навсегда даёт +' + STEAL.hp + ' к максимуму (с босса — всегда и +' + STEAL.bossHp + ').' });
  // Снаряжение теперь видно только здесь: на игровом экране оно закрывало пол-обзора
  const gear = [
    { id: 'weapons', title: 'Оружие', max: MAX_WEAPONS, slots: G.wOrder.map(weaponSlot) },
    { id: 'relics', title: 'Реликвии', max: MAX_RELICS, slots: G.rOrder.map(relicSlot) },
    { id: 'items', title: 'Предметы', max: 0, slots: G.invOrder.map(itemSlot) }
  ];
  // способность героя: сколько уже выросла за уровни
  const gr = H0.grow, grow = gr ? '«' + gr.name + '»: ' + (G.growN > 0 ? effText(scaleEff(gr.eff, G.growN)) : effText(gr.eff) + ' за каждый уровень') : '';
  return { stats, gear, hero: H0.name, time: fmt(G.t), level: G.level, kills: G.kills, grow };
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
  // оружие и реликвии меняются редко: по этой строке видно, что строку значков пора обновить
  const gearKey = g.wOrder.map((id) => id + g.w[id]).join(',') + ';' + g.rOrder.map((id) => id + g.r[id]).join(',');
  const key = [g.level, time, g.kills, g.doom, hp, p.maxHp, hpK, xpK, boss ? boss.T.name : '', bossK, rage, haste, gearKey].join('|');
  if (key === lastHudKey) return;
  lastHudKey = key;
  const buffs = [];
  if (rage) buffs.push({ id: 'rage', name: PUS.rage.name, col: PUS.rage.col, icon: PUS.rage.icon, left: rage });
  if (haste) buffs.push({ id: 'haste', name: PUS.haste.name, col: PUS.haste.col, icon: PUS.haste.icon, left: haste });
  hud.set({
    lvl: g.level, time, kills: g.kills, doom: g.doom, hp, maxHp: p.maxHp, hpK, xpK,
    boss: boss ? { name: boss.T.name, k: bossK } : null, buffs,
    weapons: g.wOrder.map(weaponSlot), relics: g.rOrder.map(relicSlot)
  });
}
// Новый забег: HUD нужно отправить заново, даже если цифры совпали с прошлым
export function resetHud() { lastHudKey = ''; }
