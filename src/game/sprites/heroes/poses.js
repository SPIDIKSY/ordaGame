/* =====================================================
   ПОЗЫ: как двигаются рука и оружие
   phi — угол руки (0 — вниз, плюс — вперёд),
   th — наклон оружия (0 — вверх), fl — вспышка атаки 0..1.
   ===================================================== */
const ease = (k) => 1 - Math.pow(1 - k, 3);
const easeIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const mix = (a, b, k) => a + (b - a) * k;


// phi — угол руки (0 — вниз, плюс — вперёд), th — наклон оружия (0 — вверх)
export function poseCaster(P, base) {
  let phi = P.phi0 + Math.sin(P.t * 1.4) * 0.03 + P.st * 0.08, th = base + Math.sin(P.t * 1.7) * 0.05 + P.st * 0.06, fl = 0;
  if (P.atk >= 0) { const k = Math.sin(Math.PI * Math.min(1, P.atk * 1.15)); phi += 0.75 * k; th += 0.55 * k; fl = k; }
  return { phi, th, fl, show: 1 };
}
export function poseKnight(P) {
  const ph0 = 0.7 + P.st * 0.1, th0 = -0.35 + Math.sin(P.t * 1.5) * 0.04 + P.st * 0.08;
  if (P.atk < 0) return { phi: ph0, th: th0, fl: 0, show: 1 };
  const a = P.atk;
  if (a < 0.14) { const k = easeIO(a / 0.14); return { phi: mix(ph0, 2.7, k), th: mix(th0, -2.5, k), fl: 0, show: 1 }; }
  if (a < 0.46) { const k = ease((a - 0.14) / 0.32); return { phi: mix(2.7, 1.0, k), th: mix(-2.5, 2.15, k), fl: 1, show: 1, swing: k }; }
  const k = easeIO((a - 0.46) / 0.54);
  return { phi: mix(1.0, ph0, k), th: mix(2.15, th0, k), fl: 0, show: 1 };
}
export function poseRogue(P) {
  const ph0 = P.phi0 + 0.1 + P.st * 0.12, th0 = 0.75 + Math.sin(P.t * 2) * 0.05;
  if (P.atk < 0) return { phi: ph0, th: th0, fl: 0, show: 1 };
  const a = P.atk;
  let phi, th;
  if (a < 0.3) { const k = easeIO(a / 0.3); phi = mix(ph0, -0.6, k); th = mix(th0, -1, k); }
  else if (a < 0.55) { const k = ease((a - 0.3) / 0.25); phi = mix(-0.6, 1.6, k); th = mix(-1, 1.75, k); }
  else { const k = easeIO((a - 0.55) / 0.45); phi = mix(1.6, ph0, k); th = mix(1.75, th0, k); }
  const show = a < 0.44 ? 1 : a < 0.78 ? 0 : (a - 0.78) / 0.22;
  return { phi, th, fl: 0, show };
}


export function poseCat(P) {
  let phi = P.phi0 + Math.sin(P.t * 1.6) * 0.04 + P.st * 0.1, th = 0.05 + Math.sin(P.t * 1.6) * 0.05, fl = 0;
  if (P.atk >= 0) { const k = Math.sin(Math.PI * Math.min(1, P.atk * 1.1)); phi += 1.25 * k; th -= 1.05 * k; fl = k; }
  return { phi, th, fl, show: 1 };
}
