/* =====================================================
   ВРАГИ И БОССЫ: готовые кадры
   Каждый враг рисуется заранее в 4 кадра анимации (f) и в белой
   вспышке попадания (w). Рисунки — в соседних файлах папки.
   ===================================================== */
import { mk, tint } from '../../gfx.js';
import { drawSlime, drawBat, drawSpider, drawJelly, drawImp } from './critters.js';
import { drawBrute, drawGolem, drawArcher, drawDKnight } from './fighters.js';
import { drawGhost, drawReaper, drawWraith } from './spirits.js';
import { drawBoss, drawTitan, drawLich } from './bosses.js';

export const SPR = {};
// pad — запас холста вокруг (в радиусах): светящимся врагам, чтобы свечение
// не упиралось в край картинки и не превращалось в видимый прямоугольник
function build(key, R, bw, bh, fn, pad = 0) {
  const f = [], w = [];
  for (let i = 0; i < 4; i++) { const c = mk((bw + pad) * R, (bh + pad) * R, (x) => fn(x, R, i / 4)); f.push(c); w.push(tint(c, '#ffffff', 0.85)); }
  SPR[key] = { f, w };
}
build('slime', 11, 2.6, 2.5, drawSlime);
build('bat', 9, 4.6, 3.2, drawBat);
build('brute', 16, 3.0, 3.2, drawBrute);
build('ghost', 12, 2.6, 2.9, drawGhost, 1.8);
build('golem', 23, 3.0, 2.6, drawGolem);
build('reaper', 15, 4.4, 3.0, drawReaper, 1);
build('boss', 38, 2.6, 3.3, drawBoss);
build('spider', 12, 3.4, 3.2, (x, R, f) => drawSpider(x, R, f, '#7a4aa8', '#22103a', false));
build('jelly', 15, 2.6, 2.5, drawJelly);
build('imp', 11, 3.1, 3.1, drawImp);
build('archer', 14, 3.2, 3.0, drawArcher);
build('dknight', 17, 2.8, 3.0, drawDKnight);
build('wraith', 13, 2.6, 3.0, drawWraith, 1.8);
build('titan', 42, 3.1, 3.1, drawTitan);
build('queen', 30, 3.4, 3.2, (x, R, f) => drawSpider(x, R, f, '#c26bff', '#3a1660', true));
build('lich', 30, 3.4, 3.2, drawLich, 1);
// Вестник смерти — тёмно-красный жнец
SPR.doom = { f: SPR.reaper.f.map((c) => tint(c, '#ff1a3c', 0.42)), w: SPR.reaper.w };
