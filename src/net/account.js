/* =====================================================
   АККАУНТ ИГРОКА
   status: checking — проверяем; offline — сервера нет (играем гостем);
           guest — не вошёл; user — вошёл
   ===================================================== */
import { api, getToken, setToken } from './api.js';
import { ui } from '../game/store.js';

const set = (account) => ui.set({ account });

export async function initAccount() {
  set({ status: 'checking', user: null });
  if (getToken()) {
    try { const r = await api.me(); set({ status: 'user', user: r.user, best: r.best }); return; }
    catch (e) {
      if (e.status === 401) setToken('');
      else { set({ status: 'offline', user: null }); return; }
    }
  }
  try { await api.health(); set({ status: 'guest', user: null }); }
  catch (_) { set({ status: 'offline', user: null }); }
}

export async function register(login, password, nick) {
  const r = await api.register(login, password, nick);
  setToken(r.token); set({ status: 'user', user: r.user, best: null });
}
export async function login(login_, password) {
  const r = await api.login(login_, password);
  setToken(r.token);
  const me = await api.me().catch(() => ({ user: r.user, best: null }));
  set({ status: 'user', user: me.user, best: me.best });
}
export async function logout() {
  try { await api.logout(); } catch (_) { /* всё равно выходим */ }
  setToken(''); set({ status: 'guest', user: null });
}
export async function refreshMe() {
  try { const r = await api.me(); set({ status: 'user', user: r.user, best: r.best }); } catch (_) { /* не страшно */ }
}
export const isLoggedIn = () => ui.get().account && ui.get().account.status === 'user';
