/* =====================================================
   ЗАПРОСЫ К СЕРВЕРУ
   Адрес сервера: по умолчанию тот же сайт (/api).
   Можно указать другой в переменной VITE_API_URL при сборке.
   ===================================================== */
const BASE = (import.meta.env.VITE_API_URL || new URL('api/', document.baseURI).href).replace(/\/?$/, '/');

let token = (() => { try { return localStorage.getItem('orda-token') || ''; } catch (_) { return ''; } })();
export function getToken() { return token; }
export function setToken(t) {
  token = t || '';
  try { if (token) localStorage.setItem('orda-token', token); else localStorage.removeItem('orda-token'); } catch (_) {}
}

export class ApiError extends Error {
  constructor(msg, status) { super(msg); this.status = status; }
}

async function req(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (_) {
    throw new ApiError('Сервер недоступен', 0);
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* не JSON — значит сервера нет */ }
  if (!data) throw new ApiError('Сервер недоступен', 0);
  if (!res.ok) throw new ApiError(data.error || 'Ошибка сервера', res.status);
  return data;
}

export const api = {
  health: () => req('GET', 'health'),
  register: (login, password, nick) => req('POST', 'register', { login, password, nick }),
  login: (login, password) => req('POST', 'login', { login, password }),
  logout: () => req('POST', 'logout'),
  me: () => req('GET', 'me'),
  checkNick: (nick) => req('GET', 'check-nick?nick=' + encodeURIComponent(nick)),
  startRun: (hero) => req('POST', 'runs', { hero }),
  beat: (id, r) => req('POST', 'runs/' + encodeURIComponent(id) + '/beat', r),
  finish: (id, r) => req('POST', 'runs/' + encodeURIComponent(id) + '/finish', r),
  leaderboard: (hero) => req('GET', 'leaderboard?limit=100' + (hero ? '&hero=' + hero : ''))
};
