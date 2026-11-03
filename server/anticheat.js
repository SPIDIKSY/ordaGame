/* =====================================================
   ЗАЩИТА ОТ ЧИТОВ
   Полностью защитить браузерную игру нельзя (код у игрока),
   но сервер отсекает всё неправдоподобное:
   - время забега не может быть больше реально прошедшего
     с момента старта (сервер засекает старт сам);
   - во время игры клиент отчитывается каждые 15 секунд,
     цифры могут только расти и с разумной скоростью;
   - убийства, уровень и боссы проверяются на возможный максимум
     (в Волне смерти потолок убийств растёт вместе с числом врагов),
     а у долгого забега — и на минимум убийств (бессмертный
     «турист», который просто бегает, не пройдёт);
   - отчёты чаще, чем раз в BEAT_MIN_GAP секунд, не засчитываются —
     нельзя набить их пачкой перед финишем;
   - очки считает сервер, а не игра.
   ===================================================== */

export const BEAT_EVERY = 15;          // как часто игра присылает отчёт (сек игрового времени)
export const TIME_SLACK = 10;          // запас на задержки сети, сек
export const MAX_RUN = 4 * 3600;       // самый долгий забег, сек
export const BEAT_MIN_GAP = 5;         // реальных секунд между отчётами, не меньше
const KILLS_PER_SEC = 35;              // до Волны смерти больше врагов просто не успевает появиться
const KILLS_BURST = 400;               // бомба может убить всех на экране разом (в Волне смерти их до 320)
// Волна смерти (с 8:00, как DOOM_T в src/game/data.js): каждую минуту враги появляются
// на 5 в секунду чаще (src/game/run/update.js). Потолок убийств растёт вдвое быстрее — с запасом
export const DOOM_T = 480;
const DOOM_KILLS_UP = 10;              // + убийств в секунду за каждую минуту Волны смерти
// Сколько врагов можно было убить к игровой секунде t, не считая бомб (с запасом)
export function maxKills(t) {
  const d = Math.max(0, t - DOOM_T);
  return t * KILLS_PER_SEC + DOOM_KILLS_UP / 60 * d * d / 2;
}
const BOSS_EVERY = 150;                // босс приходит раз в 2:30
// Минимум убийств: первые 90 сек можно почти не убивать, дальше враги наседают
// так, что выжить, не убивая хотя бы одного за 2 сек, нельзя. Бот в прогонах
// убивает 2,5–5 в секунду, так что запас большой.
const QUIET_SEC = 90, MIN_KILLS_PER_SEC = 0.5;
// Лилита не атакует, поэтому проверки «слишком мало убийств» у неё нет. Взамен — потолок
// времени: с 8:00 идёт волна смерти, и без оружия 50 здоровья дольше 15 минут не держатся
// (бот живёт около 5 минут). Иначе бессмертный «подкрученный» клиент мог бы стоять часами
export const LILITA_MAX = 15 * 60;

const xpNeed = (l) => Math.round(8 + (l - 1) * 7 + (l - 1) * (l - 1) * 0.9);
function xpForLevel(level) { let s = 0; for (let l = 1; l < level; l++) s += xpNeed(l); return s; }

// Из чего складываются очки. Одно место на всю игру: сервер считает по нему,
// а лидерборд по нему же показывает игроку пояснение «как это считается».
export const SCORE = { sec: 10, kill: 1, level: 25, boss: 300 };

export function scoreOf(r) {
  return Math.round(r.time * SCORE.sec + r.kills * SCORE.kill + r.level * SCORE.level + r.bosses * SCORE.boss);
}

function num(v, int) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return int ? Math.floor(n) : n;
}

// Разбираем присланные цифры; null — если мусор
export function parseReport(body) {
  if (!body || typeof body !== 'object') return null;
  const r = { time: num(body.time), kills: num(body.kills, true), level: num(body.level, true), bosses: num(body.bosses, true) };
  if (r.time === null || r.kills === null || r.level === null || r.bosses === null) return null;
  if (r.level < 1) return null;
  return r;
}

// Отчёт пришёл слишком скоро после предыдущего: его не засчитываем, но и забег не отменяем —
// так бывает при повторе запроса после сбоя сети
export const beatTooSoon = (run, now) => run.beats > 0 && (now - run.last_beat) / 1000 < BEAT_MIN_GAP;

/**
 * Проверка отчёта (промежуточного или финального).
 * run — строка из базы, now — время сервера в мс, r — разобранный отчёт.
 * Возвращает null, если всё хорошо, или текст причины отказа.
 */
export function checkReport(run, now, r, final) {
  const real = (now - run.started_at) / 1000;
  if (r.time > MAX_RUN) return 'слишком долгий забег';
  if (r.time > real + TIME_SLACK) return 'игровое время больше реального';
  if (r.time + 0.001 < run.last_t) return 'время пошло назад';
  if (r.kills < run.last_kills) return 'убийства уменьшились';
  if (r.level < run.last_level) return 'уровень уменьшился';

  // Игра не может идти быстрее реального времени. Сравниваем и с последним, и с предпоследним
  // отчётом: если один запрос застрял в сети, следующий покажется «слишком быстрым» только
  // по сравнению с застрявшим — из-за этого забег не отменяем
  const tooFast = (t0, at) => r.time - t0 > (now - at) / 1000 + TIME_SLACK;
  if (tooFast(run.last_t, run.last_beat) && (run.prev_beat == null || tooFast(run.prev_t, run.prev_beat))) return 'игровое время идёт быстрее реального';
  if (r.kills - run.last_kills > maxKills(r.time) - maxKills(run.last_t) + KILLS_BURST) return 'слишком много убийств';
  if (r.kills > maxKills(r.time) + KILLS_BURST) return 'слишком много убийств';
  if (r.bosses > Math.floor(r.time / BOSS_EVERY) + 0) return 'боссов больше, чем могло появиться';
  // Лилита не атакует вовсе — для неё «слишком мало убийств» не бывает, зато есть потолок времени
  if (run.hero === 'lilita') { if (r.time > LILITA_MAX) return 'слишком долгий забег для Лилиты'; }
  else if (r.kills < (r.time - QUIET_SEC) * MIN_KILLS_PER_SEC) return 'слишком мало убийств для такого долгого забега';

  // Сколько опыта вообще можно было набрать (с большим запасом)
  const maxXp = (r.kills * 20 + r.bosses * 150) * (1 + r.time / 300) * 3 + 10;
  if (xpForLevel(r.level) > maxXp) return 'уровень слишком высокий';

  if (final && r.time > 60) {
    // игра должна была отчитываться по ходу забега (допускаем потерю половины отчётов)
    const need = Math.floor(r.time / BEAT_EVERY * 0.5) - 1;
    if (run.beats < need) return 'нет отчётов во время игры';
    if (r.time - run.last_t > BEAT_EVERY * 4 + TIME_SLACK) return 'долго не было отчётов';
  }
  return null;
}
