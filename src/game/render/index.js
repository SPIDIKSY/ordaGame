/* =====================================================
   ОТРИСОВКА КАДРА
   Вызывается каждый кадр из engine.js и собирает слои
   по порядку снизу вверх: земля → пол → предметы →
   существа → снаряды → эффекты → поверх мира.
   ===================================================== */
import { rnd } from '../gfx.js';
import { BIOMES } from '../sprites/biomes.js';
import { ctx, G, state, W, H, dpr, hx, hy, setFrame, setCamera } from './frame.js';
import { drawWorld, drawTint, drawAir } from './ground.js';
import { drawArena } from './arena.js';
import { drawFloor } from './floor.js';
import { drawPickups } from './pickups.js';
import { drawActors } from './actors.js';
import { drawShots } from './shots.js';
import { drawEffects } from './effects.js';
import { drawOverlay, vig } from './overlay.js';
export { resizeRender } from './overlay.js';

export function render(o) {
  setFrame(o);
  draw(o.now);
}

function draw(now) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // Земля ниже закрашивает холст целиком, так что обычно эта очистка не видна.
  // Но если отрисовка земли собьётся, без неё кадры наслаиваются друг на друга:
  // всё движущееся размазывается в полосы, а полупрозрачный оттенок местности
  // накапливается до сплошной заливки и экран уже не восстановить.
  ctx.clearRect(0, 0, W, H);
  if (state === 'menu' || !G) {
    // в меню местности сменяют друг друга
    const per = 9000, i = Math.floor(now / per) % BIOMES.length, k = Math.min(1, (now % per) / 1600);
    const mx = now * 0.02, my = now * 0.012;
    drawWorld(mx, my, i, (i + BIOMES.length - 1) % BIOMES.length, k);
    drawAir(now, mx, my, BIOMES[i].air);
    drawTint(i, (i + BIOMES.length - 1) % BIOMES.length, k);
    if (vig) ctx.drawImage(vig, 0, 0, W, H);
    return;
  }
  const g = G, p = g.p, sk = g.shake > 0 ? g.shake * 26 : 0;
  const cx = p.x - hx + rnd(-sk, sk), cy = p.y - hy + rnd(-sk, sk);
  setCamera(cx, cy);
  drawWorld(cx, cy, g.biome, g.biomePrev, g.biomeK);
  drawArena();
  drawFloor(now);
  drawPickups(now);
  drawActors(now);
  drawShots(now);
  drawEffects(now);
  drawOverlay(now);
}
