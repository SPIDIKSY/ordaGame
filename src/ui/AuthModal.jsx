import { useEffect, useState } from 'react';
import { api } from '../net/api.js';
import Modal from './Modal.jsx';
import { login, register } from '../net/account.js';

// Вход и регистрация по логину и паролю
export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', password: '', nick: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const [nickState, setNickState] = useState({ ok: null, msg: '' });
  const nickToCheck = (form.nick || form.login).trim();

  // Проверяем ник прямо во время ввода (с небольшой задержкой)
  useEffect(() => {
    if (mode !== 'reg' || nickToCheck.length < 3) { setNickState({ ok: null, msg: '' }); return undefined; }
    let alive = true;
    const t = setTimeout(() => {
      api.checkNick(nickToCheck).then((r) => { if (alive) setNickState(r.ok ? { ok: true, msg: 'Ник свободен' } : { ok: false, msg: r.error }); })
        .catch(() => { if (alive) setNickState({ ok: null, msg: '' }); });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [nickToCheck, mode]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(''); setBusy(true);
    try {
      if (mode === 'login') await login(form.login, form.password);
      else await register(form.login, form.password, form.nick || form.login);
      onClose();
    } catch (ex) { setErr(ex.message); }
    setBusy(false);
  };

  return (
    <Modal title={mode === 'login' ? 'Вход' : 'Регистрация'} onClose={onClose}>
      <div className="tabs">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setErr(''); }}>Вход</button>
        <button type="button" className={mode === 'reg' ? 'on' : ''} onClick={() => { setMode('reg'); setErr(''); }}>Регистрация</button>
      </div>
      <form className="form" onSubmit={submit}>
        <label>Логин
          <input autoFocus value={form.login} onChange={ch('login')} autoComplete="username" maxLength={20} placeholder="латиница, цифры, _" />
        </label>
        <label>Пароль
          <input type="password" value={form.password} onChange={ch('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={72} placeholder="от 6 символов" />
        </label>
        {mode === 'reg' && (
          <label>Ник в лидерборде (изменить потом нельзя)
            <input value={form.nick} onChange={ch('nick')} maxLength={16} placeholder={form.login || 'как тебя видят другие'} />
            {nickState.msg && <span className={nickState.ok ? 'form-ok' : 'form-err'}>{nickState.msg}</span>}
          </label>
        )}
        {err && <p className="form-err">{err}</p>}
        <button className="btn" type="submit" disabled={busy || (mode === 'reg' && nickState.ok === false)}>{busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
      </form>
    </Modal>
  );
}
