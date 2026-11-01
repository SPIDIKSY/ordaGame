import { useState } from 'react';
import Modal from './Modal.jsx';
import { login, register } from '../net/account.js';

// Вход и регистрация по логину и паролю
export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', password: '', nick: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const ch = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
          <label>Ник в лидерборде
            <input value={form.nick} onChange={ch('nick')} maxLength={16} placeholder={form.login || 'как тебя видят другие'} />
          </label>
        )}
        {err && <p className="form-err">{err}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? '…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
      </form>
    </Modal>
  );
}
