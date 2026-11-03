/* =====================================================
   НАСТРОЙКИ ИГРЫ
   Хранятся в браузере этого устройства: на телефоне и на ПК
   они свои. Здесь же — единые таблицы того, что значит
   каждый уровень графики и ограничение кадров.
   ===================================================== */

// Уровни графики. dprMax — сколько пикселей холста на одну точку экрана
// (больше — чётче, но рисовать в разы больше пикселей); air — доля частиц в воздухе;
// ground — украшения земли: 2 — тени и пятна света, 1 — только свет, 0 — без них.
export const QUALITY = {
  high: { name: 'Высокое', dprMax: 2, air: 1, ground: 2, note: 'Максимальная чёткость на телефонах и чётких экранах' },
  medium: { name: 'Среднее', dprMax: 1.5, air: 0.5, ground: 1, note: 'Чуть мягче картинка, заметно легче для устройства' },
  low: { name: 'Низкое', dprMax: 1, air: 0, ground: 0, note: 'Для слабых устройств и экономии батареи: без частиц в воздухе и пятен на земле' }
};
// 0 — без ограничения: браузер сам рисует не чаще частоты экрана
export const FPS_LIMITS = [
  { id: 0, name: 'Как у экрана' },
  { id: 60, name: '60' },
  { id: 30, name: '30' }
];

const KEY = 'orda-settings';
const DEFAULTS = { quality: 'high', fps: 0, showFps: false };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      quality: QUALITY[s.quality] ? s.quality : DEFAULTS.quality,
      fps: FPS_LIMITS.some((f) => f.id === s.fps) ? s.fps : DEFAULTS.fps,
      showFps: typeof s.showFps === 'boolean' ? s.showFps : DEFAULTS.showFps
    };
  } catch (_) { return { ...DEFAULTS }; }
}

// Сам объект не заменяется, меняются только поля: модули отрисовки читают его каждый кадр
export const settings = load();
const listeners = new Set();
export function onSettings(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function setSetting(key, value) {
  if (settings[key] === value) return;
  settings[key] = value;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
  listeners.forEach((fn) => fn(settings, key));
}
