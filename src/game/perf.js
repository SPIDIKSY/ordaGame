/* =====================================================
   СЧЁТЧИК КАДРОВ
   Кадры меряются всегда (это пара чисел за кадр), а плашка
   в углу видна, если включить её в настройках или дописать
   к адресу ?fps (например ordapiva.netlify.app/?fps).
   Пока плашка видна, каждый долгий кадр пишется в консоль
   вместе с тем, что в этот момент было на экране, — чтобы
   было видно не только «тормозит», но и от чего.
   ===================================================== */
import { settings, onSettings } from './settings.js';

const HITCH = 50;    // кадр дольше этого считаем рывком, мс
const LONG = 33;     // кадр дольше этого уже заметен глазу, мс
const GAP = 1000;    // перерыв дольше этого — вкладка была скрыта, это не рывок
const WINDOW = 600;  // по скольким последним кадрам считаем статистику

const fromUrl = (() => { try { return /[?&]fps(\b|=)/.test(location.search); } catch (_) { return false; } })();
let visible = fromUrl || settings.showFps;
onSettings((s) => { visible = fromUrl || s.showFps; if (!visible && box) { box.remove(); box = null; } });

const times = new Float32Array(WINDOW);
// Сколько игра сама работала внутри кадра (без ожидания экрана): всё, мир и отрисовка
const works = new Float32Array(WINDOW), updMs = new Float32Array(WINDOW), drwMs = new Float32Array(WINDOW);
const med = (arr, k) => Array.from(arr.subarray(0, k)).sort((x, y) => x - y)[k >> 1];
let n = 0, prev = 0, hitches = 0, lastWarn = 0, nextDraw = 0, box = null;

export function perfStats() {
  const k = Math.min(n, WINDOW);
  if (!k) return null;
  const a = Array.from(times.subarray(0, k)).sort((x, y) => x - y);
  let sum = 0;
  for (let i = 0; i < k; i++) sum += a[i];
  const r1 = (v) => Math.round(v * 10) / 10;
  return {
    кадров: k,
    FPS: r1(1000 / (sum / k)),
    медиана: r1(a[k >> 1]),
    p95: r1(a[Math.floor(k * 0.95)]),
    худший: r1(a[k - 1]),
    длинных: a.filter((v) => v > LONG).length,
    рывков: hitches,
    работа: r1(med(works, k)),
    мир: r1(med(updMs, k)),
    рисование: r1(med(drwMs, k))
  };
}

function paint() {
  const s = perfStats();
  if (!s) return;
  if (!box) {
    box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:9999;padding:5px 8px;border-radius:8px;'
      + 'background:rgba(0,0,0,.66);color:#9fe8ff;font:600 11px/1.4 ui-monospace,Consolas,monospace;'
      + 'pointer-events:none;white-space:pre;letter-spacing:.02em';
    document.body.appendChild(box);
  }
  box.textContent = s.FPS + ' FPS · медиана ' + s.медиана + ' мс\n'
    + 'p95 ' + s.p95 + ' · худший ' + s.худший + '\n'
    + 'длинных ' + s.длинных + '/' + s.кадров + ' · рывков ' + s.рывков + '\n'
    + 'работа ' + s.работа + ' мс (мир ' + s.мир + ' · рисование ' + s.рисование + ')';
}

/**
 * Вызывается раз в нарисованный кадр. now — время из requestAnimationFrame.
 * info — функция, которая вернёт описание происходящего. Именно функция,
 * а не строка: собирать её каждый кадр ради строки, которая почти всегда
 * не нужна, — ровно тот мусор, из-за которого кадры и дёргаются.
 */
export function perfFrame(now, info, upd, drw, hud) {
  const dt = prev ? now - prev : 0;
  prev = now;
  if (dt <= 0 || dt > GAP) return;
  works[n % WINDOW] = upd + drw + hud;
  updMs[n % WINDOW] = upd; drwMs[n % WINDOW] = drw;
  times[n % WINDOW] = dt;
  n++;
  if (dt > HITCH) {
    hitches++;
    // не чаще раза в секунду, иначе сама запись в консоль начнёт тормозить
    if (visible && now - lastWarn > 1000) {
      lastWarn = now;
      console.warn('[орда] долгий кадр ' + Math.round(dt) + ' мс · ' + (info ? info() : ''));
    }
  }
  if (visible && now >= nextDraw) { nextDraw = now + 500; paint(); }
}
