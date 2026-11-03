/* =====================================================
   ДАННЫЕ ИГРЫ: редкость, предметы, оружие, реликвии,
   характеристики, герои и враги. Здесь удобно менять баланс.
   ===================================================== */
export const RAR = [
  { name: 'Обычный',     col: '#c9d1dc', mult: 1 },
  { name: 'Необычный',   col: '#62d36b', mult: 1.4 },
  { name: 'Редкий',      col: '#4aa8ff', mult: 1.85 },
  { name: 'Эпический',   col: '#b46cff', mult: 2.4 },
  { name: 'Легендарный', col: '#ffb02e', mult: 3.2 }
];
export const pct = (v) => Math.round(v * 100) + '%';
export const dec = (v) => String(Math.round(v * 10) / 10).replace('.', ',');

// Все бонусы описываются одинаково: { характеристика: значение }
export const EFX = {
  dmg:     { t: 'pct', s: 'урона' },
  haste:   { t: 'pct', s: 'скорости атаки' },
  area:    { t: 'pct', s: 'площади атак' },
  amount:  { t: 'int', s: 'снаряд ко всему оружию' },
  pspeed:  { t: 'pct', s: 'скорости снарядов' },
  range:   { t: 'pct', s: 'дальности' },
  dur:     { t: 'pct', s: 'длительности' },
  hp:      { t: 'int', s: 'здоровья' },
  regen:   { t: 'dec', s: 'здоровья в секунду' },
  armor:   { t: 'int', s: 'брони' },
  speed:   { t: 'pct', s: 'скорости бега' },
  magnet:  { t: 'pct', s: 'притяжения опыта' },
  crit:    { t: 'pct', s: 'шанса крита' },
  critDmg: { t: 'pct', s: 'силы крита' },
  xp:      { t: 'pct', s: 'опыта' },
  luck:    { t: 'pct', s: 'удачи' },
  vamp:    { t: 'dec', s: 'здоровья за убийство' },
  dodge:   { t: 'pct', s: 'уклонения' },
  thorns:  { t: 'int', s: 'урона шипами по тем, кто бьёт тебя' },
  revive:  { t: 'int', s: 'воскрешение: оживёшь с половиной здоровья' }
};
export function scaleEff(eff, m) {
  const o = {};
  for (const k in eff) { const v = eff[k] * m; o[k] = EFX[k].t === 'int' ? (eff[k] < 0 ? Math.round(v) : Math.max(1, Math.round(v))) : v; }
  return o;
}
export function addEff(into, eff) { for (const k in eff) into[k] = (into[k] || 0) + eff[k]; return into; }
export function effText(eff) {
  return Object.keys(eff).map((k) => {
    const v = eff[k], E = EFX[k], a = Math.abs(v);
    return (v < 0 ? '−' : '+') + (E.t === 'pct' ? Math.round(a * 100) + '%' : E.t === 'dec' ? dec(a) : Math.round(a)) + ' ' + E.s;
  }).join(', ');
}

// Предметы из сундуков
// Предметы из сундуков. Чем выше редкость (r), тем сильнее предмет:
// обычные (0) качают одну характеристику, необычные (1) и редкие (2) — сильнее и по две,
// эпические (3) — мощные наборы, легендарные (4) дают новую способность (одна на забег).
export const ITEMS = [
  // --- обычные: одна базовая характеристика ---
  { id: 'whet',    r: 0, icon: 'sword',     name: 'Точильный камень',  eff: { dmg: 0.06 } },
  { id: 'meat',    r: 0, icon: 'heart',     name: 'Кусок мяса',        eff: { hp: 12 } },
  { id: 'boots',   r: 0, icon: 'boot',      name: 'Стоптанные сапоги', eff: { speed: 0.05 } },
  { id: 'glass',   r: 0, icon: 'hourglass', name: 'Песочные часы',     eff: { haste: 0.05 } },
  { id: 'plank',   r: 0, icon: 'shield',    name: 'Деревянный щит',    eff: { armor: 1 } },
  { id: 'sprout',  r: 0, icon: 'sprout',    name: 'Росток',            eff: { regen: 0.3 } },
  { id: 'magnet',  r: 0, icon: 'magnet',    name: 'Магнитик',          eff: { magnet: 0.2 } },
  { id: 'notes',   r: 0, icon: 'book',      name: 'Записная книжка',   eff: { xp: 0.06 } },
  { id: 'scope',   r: 0, icon: 'target',    name: 'Прицел',            eff: { crit: 0.03 } },
  { id: 'shard',   r: 0, icon: 'crystal',   name: 'Осколок кристалла', eff: { area: 0.06 } },
  { id: 'lens',    r: 0, icon: 'eye',       name: 'Линза',             eff: { pspeed: 0.08 } },
  { id: 'candle',  r: 0, icon: 'clock',     name: 'Свеча',             eff: { dur: 0.07 } },
  { id: 'shoe',    r: 0, icon: 'horseshoe', name: 'Подкова',           eff: { luck: 0.07 } },
  // --- необычные: сильнее или две характеристики ---
  { id: 'blade',   r: 1, icon: 'sword',     name: 'Стальной клинок',   eff: { dmg: 0.1 } },
  { id: 'wolf',    r: 1, icon: 'heart',     name: 'Сердце волка',      eff: { hp: 20, regen: 0.2 } },
  { id: 'windc',   r: 1, icon: 'cloak',     name: 'Плащ ветра',        eff: { speed: 0.06, dodge: 0.02 } },
  { id: 'gears',   r: 1, icon: 'hourglass', name: 'Механические часы', eff: { haste: 0.08 } },
  { id: 'mail',    r: 1, icon: 'shield',    name: 'Кольчуга',          eff: { armor: 2 } },
  { id: 'thorns',  r: 1, icon: 'spikes',    name: 'Колючий доспех',    eff: { thorns: 6, armor: 1 } },
  { id: 'gaunt',   r: 1, icon: 'glove',     name: 'Перчатка силы',     eff: { critDmg: 0.2 } },
  { id: 'compass', r: 1, icon: 'compass',   name: 'Компас искателя',   eff: { magnet: 0.3, luck: 0.05 } },
  { id: 'tear',    r: 1, icon: 'drop',      name: 'Кровавая слеза',    eff: { vamp: 0.15 } },
  // --- редкие: сильные наборы ---
  { id: 'ruby',    r: 2, icon: 'heart',     name: 'Рубиновое сердце',  eff: { hp: 35, regen: 0.5 } },
  { id: 'hunter',  r: 2, icon: 'target',    name: 'Клинок охотника',   eff: { dmg: 0.12, crit: 0.05 } },
  { id: 'runner',  r: 2, icon: 'boot',      name: 'Сапоги-скороходы',  eff: { speed: 0.1, haste: 0.06 } },
  { id: 'shadow',  r: 2, icon: 'cloak',     name: 'Плащ теней',        eff: { dodge: 0.05, speed: 0.05 } },
  { id: 'sage',    r: 2, icon: 'book',      name: 'Том мудреца',       eff: { xp: 0.12, area: 0.08 } },
  { id: 'plate',   r: 2, icon: 'shield',    name: 'Латы',              eff: { armor: 3, hp: 15 } },
  { id: 'mana',    r: 2, icon: 'crystal',   name: 'Кристалл маны',     eff: { area: 0.12, dur: 0.12 } },
  // --- эпические: мощные наборы ---
  { id: 'berserk', r: 3, icon: 'burst',     name: 'Ярость берсерка',   eff: { dmg: 0.22, critDmg: 0.3, armor: -1 } },
  { id: 'scales',  r: 3, icon: 'shield',    name: 'Драконья чешуя',    eff: { armor: 4, thorns: 12, hp: 25 } },
  { id: 'crown',   r: 3, icon: 'crown',     name: 'Корона короля',     eff: { xp: 0.15, luck: 0.15, magnet: 0.3 } },
  { id: 'storm',   r: 3, icon: 'eye',       name: 'Глаз бури',         eff: { crit: 0.1, critDmg: 0.4 } },
  { id: 'fang',    r: 3, icon: 'drop',      name: 'Вампирский клык',   eff: { vamp: 0.35, dmg: 0.08 } },
  { id: 'phoenix', r: 3, icon: 'feather',   name: 'Перо феникса',      eff: { revive: 1 } },
  // --- легендарные: новая способность, каждая — один раз за забег ---
  { id: 'thunder', r: 4, legend: true, icon: 'bolt',  name: 'Громовой камень', eff: {}, desc: 'Каждый 10-й удар бьёт молнией по 4 врагам рядом' },
  { id: 'blaze',   r: 4, legend: true, icon: 'fire',  name: 'Пылающее сердце', eff: {}, desc: 'Убитые враги взрываются огнём (каждый четвёртый)' },
  { id: 'frost',   r: 4, legend: true, icon: 'flake', name: 'Ледяное сердце',  eff: {}, desc: 'Удары замораживают врага на 1,2 секунды (шанс 12%)' },
  { id: 'cleave',  r: 4, legend: true, icon: 'axe',   name: 'Колун',           eff: {}, desc: 'Криты задевают врагов рядом половиной урона' },
  { id: 'clock',   r: 4, legend: true, icon: 'clock', name: 'Часы вечности',   eff: {}, desc: 'Каждые 25 секунд время замирает на 2,5 секунды' },
  { id: 'grail',   r: 4, legend: true, icon: 'amulet', name: 'Святой грааль',  eff: {}, desc: 'Когда здоровье падает ниже 30% — лечит половину (раз в минуту)' },
  { id: 'quiver',  r: 4, legend: true, icon: 'multi', name: 'Колчан изобилия', eff: { amount: 1 }, desc: '+1 снаряд ко всему оружию' }
];

// Оружие: до 5 слотов, 10 уровней. lv[i] — что даёт уровень i+2.
// На последнем уровне любое оружие бьёт на 25% сильнее (topK) — это видно в тексте уровня.
export const MAX_WEAPONS = 5, WMAX = 10;
export const topK = (l) => (l >= WMAX ? 1.25 : 1);
const TOP = 'Предел: +25% урона';
export const same = (s) => [...Array(WMAX - 2).fill(s), s + '. ' + TOP];
export const WEAPONS = [
  { id: 'staff', icon: 'orb', name: 'Магический посох', desc: 'Стреляет огненными сгустками в ближайшего врага.',
    lv: ['+1 снаряд', '+30% урона', 'Снаряды пробивают 1 врага насквозь', '+1 снаряд', 'Стреляет на 20% чаще', '+1 снаряд и ещё +1 пробитие', '+25% урона', '+1 снаряд', TOP] },
  { id: 'whip', icon: 'sword', name: 'Рыцарский меч', desc: 'Широкий рубящий удар в сторону ближайшего врага.',
    lv: ['Бьёт ещё и назад', '+30% урона', 'Удар шире', '+30% урона', 'Бьёт чаще', '+40% урона', 'Удар ещё шире', '+20% урона', TOP] },
  { id: 'knife', icon: 'dagger', name: 'Кинжалы', desc: 'Быстрые кинжалы летят в ближайшего врага, даже на бегу.',
    lv: ['+1 кинжал', 'Пробивают 1 врага, больше урона', '+1 кинжал', 'Больше урона и чаще', '+1 кинжал и ещё +1 пробитие', 'Больше урона и чаще', '+1 кинжал и больше урона', 'Пробивают ещё 1 врага', '+1 кинжал. ' + TOP] },
  { id: 'blades', icon: 'blade', name: 'Круговые лезвия', desc: 'Лезвия кружат вокруг героя и рубят всех, кого задевают.',
    lv: ['+1 лезвие', '+35% урона', '+1 лезвие', '+25% урона', '+1 лезвие', '+1 лезвие и +25% урона', '+15% урона', '+1 лезвие', TOP] },
  { id: 'nova', icon: 'nova', name: 'Ударная волна', desc: 'Время от времени отбрасывает и бьёт всех вокруг героя.', lv: same('Шире, сильнее и чаще') },
  { id: 'chain', icon: 'bolt', name: 'Цепная молния', desc: 'Молния бьёт врага и перескакивает на соседних.', lv: same('+1 прыжок, сильнее и чаще') },
  { id: 'aura', icon: 'seed', name: 'Семя', desc: 'Пивной кот осеменяет всех вокруг: поле из семечек жжёт и замедляет врагов.', lv: same('Шире и жжёт сильнее') },
  { id: 'meteor', icon: 'meteor', name: 'Звездопад', desc: 'С неба падают метеориты и взрываются в толпе врагов.',
    lv: ['+1 метеорит', 'Больше урона и радиус взрыва', '+1 метеорит', 'Больше урона и радиус взрыва', '+1 метеорит', 'Больше урона и радиус взрыва', '+1 метеорит', 'Больше урона и радиус взрыва', '+1 метеорит. ' + TOP] },
  { id: 'frost', icon: 'flake', name: 'Ледяной веер', desc: 'Ледяные осколки разлетаются во все стороны и замедляют врагов.', lv: same('+2 осколка, сильнее, пробивают дальше') },
  { id: 'axe', icon: 'axe', name: 'Топоры', desc: 'Подбрасывает топоры: они летят дугой и рубят всё на пути.',
    lv: ['Больше урона', '+1 топор', 'Больше урона', 'Бросает чаще', '+1 топор', 'Больше урона и чаще', 'Больше урона', '+1 топор', 'Больше урона. ' + TOP] },
  { id: 'fireball', icon: 'fire', name: 'Огненный шар', desc: 'Медленный огненный шар взрывается при попадании и задевает всех рядом.',
    lv: ['Больше урона и взрыв', '+1 шар', 'Больше урона и взрыв', 'Бросает чаще', '+1 шар', 'Больше урона и взрыв', 'Больше урона и чаще', '+1 шар', 'Больше урона и взрыв. ' + TOP] },
  { id: 'puddle', icon: 'flask', name: 'Ядовитый флакон', desc: 'Флакон разбивается и оставляет ядовитую лужу, которая жжёт и замедляет.',
    lv: ['Лужа больше и дольше', '+1 флакон', 'Яд сильнее', 'Бросает чаще', '+1 флакон', 'Лужа больше и яд сильнее', 'Лужа больше и яд сильнее', '+1 флакон', 'Яд сильнее. ' + TOP] },
  { id: 'wisp', icon: 'wisp', name: 'Блуждающие огни', desc: 'Огоньки сами находят врагов и летят за ними.',
    lv: ['+1 огонёк', 'Больше урона', '+1 огонёк', 'Вылетают чаще', '+1 огонёк', 'Больше урона', '+1 огонёк', 'Больше урона', '+1 огонёк. ' + TOP] },
  { id: 'boomer', icon: 'boomer', name: 'Бумеранг', desc: 'Летит к врагу и возвращается, задевая всех дважды.',
    lv: ['Больше урона', '+1 бумеранг', 'Летит дальше', 'Больше урона', '+1 бумеранг', 'Больше урона и чаще', 'Больше урона и чаще', '+1 бумеранг', 'Больше урона. ' + TOP] },
  { id: 'laser', icon: 'beam', name: 'Луч света', desc: 'Длинный луч прожигает всех врагов на линии.',
    lv: ['Луч шире', 'Больше урона', '+1 луч', 'Больше урона', 'Луч шире и чаще', '+1 луч', 'Луч шире', 'Больше урона', '+1 луч. ' + TOP] },
  { id: 'spikes', icon: 'spikes', name: 'Каменные шипы', desc: 'Из-под земли под врагами вырываются каменные шипы.',
    lv: ['+1 шип', 'Больше урона', '+1 шип', 'Шипы шире', '+1 шип', 'Больше урона и чаще', '+1 шип', 'Шипы шире', '+1 шип. ' + TOP] },
  { id: 'trail', icon: 'trail', name: 'Огненный след', desc: 'На бегу герой оставляет за собой горящую землю.',
    lv: ['Горит дольше', 'Жжёт сильнее', 'Пятна шире', 'Жжёт сильнее', 'Горит дольше', 'Жжёт сильнее и шире', 'Пятна шире', 'Горит дольше', 'Жжёт сильнее. ' + TOP] }
];

// Реликвии: готовые наборы бонусов, 5 слотов, 8 уровней. Каждый уровень даёт eff ещё раз
export const MAX_RELICS = 5, RMAX = 8, RCOL = '#5fe0b4';
export const RELICS = [
  { id: 'berserk', icon: 'ring',      name: 'Кольцо берсерка',  eff: { dmg: 0.1, crit: 0.02, armor: -1 } },
  { id: 'sage',    icon: 'crown',     name: 'Корона мудреца',   eff: { xp: 0.08, luck: 0.06 } },
  { id: 'shadow',  icon: 'cloak',     name: 'Плащ тени',        eff: { dodge: 0.03, speed: 0.04 } },
  { id: 'wind',    icon: 'feather',   name: 'Перо ветра',       eff: { speed: 0.05, pspeed: 0.08 } },
  { id: 'life',    icon: 'amulet',    name: 'Амулет жизни',     eff: { hp: 15, regen: 0.25 } },
  { id: 'plate',   icon: 'glove',     name: 'Латные перчатки',  eff: { armor: 1, thorns: 4 } },
  { id: 'seeker',  icon: 'compass',   name: 'Компас искателя',  eff: { magnet: 0.2, luck: 0.05 } },
  { id: 'mana',    icon: 'crystal',   name: 'Кристалл маны',    eff: { area: 0.07, dur: 0.07 } },
  { id: 'clock',   icon: 'hourglass', name: 'Вечные часы',      eff: { haste: 0.07, speed: -0.02 } },
  { id: 'fang',    icon: 'drop',      name: 'Клык вампира',     eff: { vamp: 0.12, dmg: 0.03 } },
  { id: 'storm',   icon: 'eye',       name: 'Око бури',         eff: { crit: 0.04, critDmg: 0.12 } },
  { id: 'cannon',  icon: 'burst',     name: 'Стеклянная пушка', eff: { dmg: 0.14, hp: -10 } }
];

// Характеристики на уровне: бонус растёт с редкостью карточки
export const STATS = [
  { id: 'might',    icon: 'sword',     name: 'Сила',              eff: { dmg: 0.06 },    max: 10 },
  { id: 'haste',    icon: 'hourglass', name: 'Скорость атаки',    eff: { haste: 0.06 },  max: 8 },
  { id: 'area',     icon: 'area',      name: 'Площадь',           eff: { area: 0.07 },   max: 8 },
  { id: 'amount',   icon: 'multi',     name: 'Дубликатор',        eff: { amount: 1 },    max: 2, fixed: true, minR: 3 },
  { id: 'velocity', icon: 'velocity',  name: 'Скорость снарядов', eff: { pspeed: 0.08, range: 0.04 }, max: 6 },
  { id: 'dur',      icon: 'clock',     name: 'Длительность',      eff: { dur: 0.08 },    max: 6 },
  { id: 'vital',    icon: 'heart',     name: 'Здоровье',          eff: { hp: 15 },       max: 8 },
  { id: 'regen',    icon: 'sprout',    name: 'Регенерация',       eff: { regen: 0.3 },   max: 6 },
  { id: 'armor',    icon: 'shield',    name: 'Броня',             eff: { armor: 1 },     max: 5 },
  { id: 'move',     icon: 'boot',      name: 'Скорость бега',     eff: { speed: 0.05 },  max: 6 },
  { id: 'attract',  icon: 'magnet',    name: 'Притяжение',        eff: { magnet: 0.2 },  max: 5 },
  { id: 'crit',     icon: 'target',    name: 'Шанс крита',        eff: { crit: 0.03 },   max: 8 },
  { id: 'critd',    icon: 'burst',     name: 'Сила крита',        eff: { critDmg: 0.15 }, max: 6 },
  { id: 'growth',   icon: 'book',      name: 'Мудрость',          eff: { xp: 0.06 },     max: 6 },
  { id: 'luck',     icon: 'horseshoe', name: 'Удача',             eff: { luck: 0.08 },   max: 6 },
  { id: 'vamp',     icon: 'drop',      name: 'Вампиризм',         eff: { vamp: 0.15 },   max: 5 },
  { id: 'dodge',    icon: 'cloak',     name: 'Уклонение',         eff: { dodge: 0.03 },  max: 5 },
  { id: 'thorns',   icon: 'spikes',    name: 'Шипы',              eff: { thorns: 5 },    max: 5 }
];

// Герои (как они выглядят — см. src/game/sprites/heroes/)
export const HEROES = [
  { id: 'mage', name: 'Маг', role: 'Чародей: бьёт издалека по площади', weapon: 'staff', hp: 100, speed: 150, eff: { area: 0.1 }, perk: '100 здоровья · +10% площади атак' },
  { id: 'knight', name: 'Рыцарь', role: 'Защитник: много здоровья и брони', weapon: 'whip', hp: 150, speed: 140, eff: { armor: 2 }, perk: '150 здоровья · +2 брони · медленнее остальных' },
  { id: 'rogue', name: 'Разбойница', role: 'Ловкачка: самая быстрая, частые криты', weapon: 'knife', hp: 80, speed: 175, eff: { crit: 0.1 }, perk: '80 здоровья · самая быстрая · +10% шанса крита' },
  { id: 'druid', name: 'Друид', role: 'Целитель: яд, лужи и восстановление', weapon: 'puddle', hp: 110, speed: 150, eff: { regen: 0.8, dur: 0.2 }, perk: '110 здоровья · +0,8 здоровья в секунду · яд держится дольше' },
  { id: 'necro', name: 'Некромант', role: 'Призыватель: больше снарядов, но слабее каждый', weapon: 'wisp', hp: 90, speed: 145, eff: { amount: 1, dmg: -0.1 }, perk: '90 здоровья · +1 снаряд ко всему оружию · −10% урона' },
  { id: 'cat', name: 'Пивной кот', role: 'Боец ближнего боя: пивная аура вокруг', weapon: 'aura', hp: 120, speed: 145, eff: { area: 0.15, regen: 0.5 }, perk: '120 здоровья · +15% площади · пиво лечит: +0,5 здоровья в секунду' }
];
export const WDEF = {}, SDEF = {}, RDEF = {}, HDEF = {};
WEAPONS.forEach((w) => { WDEF[w.id] = w; });
STATS.forEach((s) => { SDEF[s.id] = s; });
RELICS.forEach((r) => { RDEF[r.id] = r; });
HEROES.forEach((h) => { HDEF[h.id] = h; });

export const TYPES = [
  { key: 'slime',   name: 'Слизень',       from: 0,   hp: 18,  spd: 52,  dmg: 6,  r: 11, xp: 1,  fps: 6,  pc: '#8ee07a' },
  { key: 'bat',     name: 'Летучая мышь',  from: 55,  hp: 12,  spd: 112, dmg: 5,  r: 9,  xp: 1,  fps: 14, pc: '#a47be8', fly: true },
  { key: 'spider',  name: 'Паук',          from: 85,  hp: 20,  spd: 96,  dmg: 7,  r: 10, xp: 2,  fps: 10, pc: '#c26bff', ai: 'zigzag' },
  { key: 'brute',   name: 'Рогач',         from: 110, hp: 75,  spd: 50,  dmg: 12, r: 16, xp: 4,  fps: 6,  pc: '#ff9a4a' },
  { key: 'jelly',   name: 'Студень',       from: 130, hp: 60,  spd: 46,  dmg: 9,  r: 15, xp: 3,  fps: 5,  pc: '#8fd0ff', split: true },
  { key: 'ghost',   name: 'Призрак',       from: 150, hp: 55,  spd: 86,  dmg: 10, r: 12, xp: 4,  fps: 5,  pc: '#bff1ff', fly: true },
  { key: 'imp',     name: 'Пороховой бес', from: 185, hp: 40,  spd: 120, dmg: 16, r: 11, xp: 4,  fps: 8,  pc: '#ff7a4a', ai: 'bomber', fly: true },
  { key: 'golem',   name: 'Лавовый голем', from: 220, hp: 260, spd: 42,  dmg: 20, r: 23, xp: 14, fps: 4,  pc: '#ff8a3a' },
  { key: 'archer',  name: 'Скелет-лучник', from: 260, hp: 70,  spd: 70,  dmg: 14, r: 12, xp: 6,  fps: 6,  pc: '#ece6d6', ai: 'ranged' },
  { key: 'reaper',  name: 'Жнец',          from: 320, hp: 170, spd: 104, dmg: 18, r: 15, xp: 12, fps: 5,  pc: '#b7a8ff', fly: true },
  { key: 'dknight', name: 'Тёмный рыцарь', from: 370, hp: 340, spd: 58,  dmg: 24, r: 17, xp: 18, fps: 5,  pc: '#8a92aa', armored: true },
  { key: 'wraith',  name: 'Тень',          from: 420, hp: 150, spd: 80,  dmg: 22, r: 13, xp: 14, fps: 5,  pc: '#b77cff', ai: 'blink', fly: true }
];
export const SPIDER = TYPES[2], GHOST = TYPES[5];
// Боссы приходят по очереди каждые 2,5 минуты
export const BOSSES = [
  { key: 'boss',  name: 'Король слизней',  hp: 900,  spd: 40, dmg: 26, r: 38, xp: 70,  fps: 4, pc: '#d08cff', boss: true, ab: 'summon' },
  { key: 'titan', name: 'Ледяной титан',   hp: 1700, spd: 34, dmg: 34, r: 42, xp: 90,  fps: 3, pc: '#9fd0ff', boss: true, ab: 'slam' },
  { key: 'queen', name: 'Королева пауков', hp: 1300, spd: 64, dmg: 28, r: 30, xp: 90,  fps: 9, pc: '#c26bff', boss: true, ab: 'brood' },
  { key: 'lich',  name: 'Король-лич',      hp: 2100, spd: 44, dmg: 32, r: 30, xp: 120, fps: 4, pc: '#7dff9a', boss: true, ab: 'bullets', fly: true }
];
export const BOSS = BOSSES[0];
export const MAXE = 240;
// Поляна, на которой идёт бой: круг с центром в точке старта. Поперечник 4400 пикселей —
// герой пробегает его примерно за полминуты, места для манёвров с запасом.
export const ARENA_R = 2200;

// Волна смерти начинается на 8:00
export const DOOM_T = 480;
export const DOOM = { key: 'doom', name: 'Вестник смерти', hp: 260, spd: 118, dmg: 28, r: 15, xp: 18, fps: 6, pc: '#ff4a6a', fly: true, doom: true };

// Шансы редкости в сундуке, в процентах: обычный, необычный, редкий, эпический, легендарный
export const WEIGHTS = { normal: [55, 26, 12, 5, 2], elite: [28, 32, 23, 11, 6], boss: [0, 15, 35, 30, 20] };

export const xpNeed = (l) => Math.round(8 + (l - 1) * 7 + (l - 1) * (l - 1) * 0.9);
export const fmt = (t) => { const s = Math.floor(t); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
