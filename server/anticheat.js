/* =====================================================
   ЗАЩИТА ОТ ЧИТОВ
   Полностью защитить браузерную игру нельзя (код у игрока),
   но сервер отсекает всё неправдоподобное:
   - время забега не может быть больше реально прошедшего
     с момента старта (сервер засекает старт сам);
   - во время игры клиент отчитывается каждые 15 секунд,
     цифры могут только расти и с разумной скоростью;
   - убийства, уровень и боссы проверяются на возможный максимум,
     а у долгого забега — и на минимум убийств (бессмертный
     «турист», который просто бегает, не пройдёт);
   - отчёты чаще, чем раз в BEAT_MIN_GAP секунд, не засчитываются —
     нельзя набить их пачкой перед финишем;
   - очки считает сервер, а не игра.
   ===================================================== */

export const BEAT_EVERY = 15;          // как часто игра присылает отчёт (сек игрового времени)
export const TIME_SLACK = 5;           // запас на задержки сети, сек
export const MAX_RUN = 4 * 3600;       // самый долгий забег, сек
export const BEAT_MIN_GAP = 5;         // реальных секунд между отчётами, не меньше
const KILLS_PER_SEC = 35;              // больше врагов просто не успевает появиться
const KILLS_BURST = 150;               // бомба может убить всех на экране разом
const BOSS_EVERY = 150;                // босс приходит раз в 2:30
// Минимум убийств: первые 90 сек можно почти не убивать, дальше враги наседают
// так, что выжить, не убивая хотя бы одного за 2 сек, нельзя. Бот в прогонах
// убивает 2,5–5 в секунду, так что запас большой.
const QUIET_SEC = 90, MIN_KILLS_PER_SEC = 0.5;

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

  const dtGame = r.time - run.last_t, dtReal = (now - run.last_beat) / 1000;
  if (dtGame > dtReal + TIME_SLACK) return 'игровое время идёт быстрее реального';
  if (r.kills - run.last_kills > dtGame * KILLS_PER_SEC + KILLS_BURST) return 'слишком много убийств';
  if (r.kills > r.time * KILLS_PER_SEC + KILLS_BURST) return 'слишком много убийств';
  if (r.bosses > Math.floor(r.time / BOSS_EVERY) + 0) return 'боссов больше, чем могло появиться';
  // Лилита не атакует вовсе — для неё «слишком мало убийств» не бывает
  if (run.hero !== 'lilita' && r.kills < (r.time - QUIET_SEC) * MIN_KILLS_PER_SEC) return 'слишком мало убийств для такого долгого забега';

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
