/* =====================================================
   КРАЙ ПОЛЯНЫ на экране
   Дальние ряды камней и деревьев → темнота за краем →
   передний ряд по самой границе. Так видно, что дальше хода нет,
   а край не выглядит нарисованной линией.
   ===================================================== */
import { TAU, mulberry } from '../gfx.js';
import { ARENA_R } from '../data.js';
import { BIOMES } from '../sprites/biomes.js';
import { ctx, G, W, H, cx, cy, inView } from './frame.js';

// Кольца рассчитываются один раз: где стоит каждый камень, его размер и вид.
// Внутри кольца — по высоте на экране, чтобы нижние перекрывали верхние.
function ring(r, step, jitter, seed) {
  const R = mulberry(seed), n = Math.round(TAU * r / step), out = [];
  for (let i = 0; i < n; i++) {
    const a = (i + R() * 0.6) * TAU / n, rr = r + (R() - 0.5) * jitter;
    out.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, s: 0.8 + R() * 0.5, k: Math.floor(R() * 6) });
  }
  return out.sort((p, q) => p.y - q.y);
}
const BACK = ring(ARENA_R + 120, 64, 50, 7).concat(ring(ARENA_R + 70, 56, 30, 11)).sort((p, q) => p.y - q.y);
const FRONT = ring(ARENA_R + 22, 44, 18, 19);

function drawRing(list, edge) {
  for (let i = 0; i < list.length; i++) {
    const q = list[i], x = q.x - cx, y = q.y - cy;
    if (!inView(x, y, 70)) continue;
    const spr = edge[q.k % edge.length], w = spr.w * q.s, h = spr.h * q.s;
    ctx.drawImage(spr, x - w / 2, y - h * 0.8, w, h);
  }
}

export function drawArena() {
  // центр поляны на экране и как далеко от него край экрана
  const ox = -cx, oy = -cy, far = Math.hypot(W / 2 - ox, H / 2 - oy) + Math.hypot(W, H) / 2;
  if (far < ARENA_R - 80) return; // край далеко за пределами экрана
  const edge = BIOMES[G.biome].edge;
  drawRing(BACK, edge);
  // темнота за краем: прямоугольник экрана с круглой дырой по поляне
  ctx.fillStyle = 'rgba(3,6,8,.72)';
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(ox, oy, ARENA_R + 40, 0, TAU);
  ctx.fill('evenodd');
  // мягкий переход к темноте вдоль края
  for (const [w, a] of [[60, 0.16], [30, 0.2], [12, 0.24]]) {
    ctx.strokeStyle = 'rgba(3,6,8,' + a + ')'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(ox, oy, ARENA_R + 40 - w / 2, 0, TAU); ctx.stroke();
  }
  drawRing(FRONT, edge);
}
