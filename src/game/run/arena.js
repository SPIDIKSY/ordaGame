/* =====================================================
   ПОЛЯНА: границы карты
   Бой идёт на круглой поляне радиусом ARENA_R вокруг точки
   старта. Герой упирается в край и скользит вдоль него,
   враги появляются только внутри.
   ===================================================== */
import { ARENA_R } from '../data.js';

// Держит существо внутри поляны. pad — отступ от края (обычно его радиус),
// чтобы спрайт не залезал на камни. Точку просто сдвигаем к центру: поэтому
// у края герой не застревает, а скользит вдоль него.
export function clampToArena(o, pad) {
  const max = ARENA_R - pad, d = Math.hypot(o.x, o.y);
  if (d <= max) return false;
  const k = max / d; o.x *= k; o.y *= k;
  return true;
}

// Где появиться врагу: на расстоянии dist от героя, но внутри поляны.
// Сначала пробуем нужное направление, потом соседние по очереди в обе стороны —
// у края враги придут из глубины поляны, а не из-за камней.
// Возвращает один и тот же объект, чтобы не плодить мусор на каждом враге.
const spot = { x: 0, y: 0, a: 0 };
const STEP = 0.5, TRIES = 13; // 13 попыток по полрадиана — почти полный круг в обе стороны
export function arenaSpot(px, py, ang, dist, pad) {
  const max = ARENA_R - pad;
  for (let i = 0; i < TRIES; i++) {
    const a = ang + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * STEP;
    const x = px + Math.cos(a) * dist, y = py + Math.sin(a) * dist;
    if (x * x + y * y <= max * max) { spot.x = x; spot.y = y; spot.a = a; return spot; }
  }
  // герой у края и экран больше поляны — ставим на край в нужную сторону
  spot.x = px + Math.cos(ang) * dist; spot.y = py + Math.sin(ang) * dist; spot.a = ang;
  clampToArena(spot, pad);
  return spot;
}
