/* =====================================================
   ОБЩИЕ ДЕТАЛИ ВРАГОВ: милые глаза, тело слизня
   ===================================================== */
import { TAU, rg, ell, circ } from '../../gfx.js';

export function eyesCute(x, cx, cy, R) {
  const ex = R * 0.3, ey = R * 0.2, ew = R * 0.13;
  for (const s of [-1, 1]) {
    const px = cx + s * ex;
    x.fillStyle = '#141019'; ell(x, px, cy, ew, ey);
    x.fillStyle = '#fff'; circ(x, px - ew * 0.25, cy - ey * 0.42, ew * 0.48);
  }
}
/* --- враги --- */
export function slimeBody(x, R, f, c0, c1, lineC, face) {
  const s = Math.sin(f * TAU) * 0.07;
  x.save(); x.translate(0, R * 0.62); x.scale(1 + s, 1 - s); x.translate(0, -R * 0.62);
  x.beginPath();
  x.moveTo(-R, R * 0.6);
  x.bezierCurveTo(-R * 1.1, -R * 0.4, -R * 0.6, -R * 1.05, 0, -R * 1.05);
  x.bezierCurveTo(R * 0.6, -R * 1.05, R * 1.1, -R * 0.4, R, R * 0.6);
  x.quadraticCurveTo(0, R * 0.86, -R, R * 0.6);
  x.closePath();
  x.fillStyle = rg(x, -R * 0.3, -R * 0.5, R * 0.1, 0, 0, R * 1.25, [[0, c0], [1, c1]]);
  x.fill(); x.lineWidth = Math.max(1.4, R * 0.1); x.strokeStyle = lineC; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.22)';
  circ(x, -R * 0.48, R * 0.3, R * 0.11); circ(x, -R * 0.26, R * 0.47, R * 0.06); circ(x, R * 0.55, R * 0.38, R * 0.07);
  x.fillStyle = 'rgba(255,255,255,.8)'; ell(x, -R * 0.42, -R * 0.6, R * 0.24, R * 0.12, -0.55);
  face();
  x.restore();
}
