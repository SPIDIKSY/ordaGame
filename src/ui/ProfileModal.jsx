import { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { changeNick, logout } from '../net/account.js';
import { HDEF, fmt } from '../game/data.js';

// Профиль: ник для лидерборда, лучший результат, выход
export default function ProfileModal({ account, onClose }) {
  const [nick, setNick] = useState(account.user.nick);
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);
  const best = account.best;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg({ ok: '', err: '' });
    try { await changeNick(nick); setMsg({ ok: 'Ник сохранён', err: '' }); } catch (ex) { setMsg({ ok: '', err: ex.message }); }
    setBusy(false);
  };

  return (
    <Modal title="Профиль" onClose={onClose}>
      <p className="muted">Логин: <b>{account.user.login}</b></p>
      {best && (
        <div className="stats">
          <div><small>Рекорд</small><b>{fmt(best.time)}</b></div>
          <div><small>Убито</small><b>{best.kills}</b></div>
          <div><small>Герой</small><b>{HDEF[best.hero] ? HDEF[best.hero].name : '—'}</b></div>
        </div>
      )}
      <form className="form" onSubmit={save}>
        <label>Ник в лидерборде
          <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={16} />
        </label>
        {msg.err && <p className="form-err">{msg.err}</p>}
        {msg.ok && <p className="form-ok">{msg.ok}</p>}
        <button className="btn" type="submit" disabled={busy || nick.trim() === account.user.nick}>Сохранить</button>
      </form>
      <button className="btn ghost" type="button" onClick={async () => { await logout(); onClose(); }}><Icon name="logout" />Выйти</button>
    </Modal>
  );
}
