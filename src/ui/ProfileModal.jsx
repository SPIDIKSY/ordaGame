import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { logout } from '../net/account.js';
import { HDEF, fmt } from '../game/data.js';

// Профиль: ник (выбран при регистрации, изменить нельзя), лучший результат, выход
export default function ProfileModal({ account, onClose }) {
  const best = account.best;
  return (
    <Modal title="Профиль" onClose={onClose}>
      <div className="profile-nick"><Icon name="user" /><b>{account.user.nick}</b></div>
      <p className="muted">Логин: <b>{account.user.login}</b></p>
      {best ? (
        <div className="stats">
          <div><small>Рекорд</small><b>{fmt(best.time)}</b></div>
          <div><small>Убито</small><b>{best.kills}</b></div>
          <div><small>Герой</small><b>{HDEF[best.hero] ? HDEF[best.hero].name : '—'}</b></div>
        </div>
      ) : <p className="muted">Пока нет засчитанных забегов</p>}
      <button className="btn ghost" type="button" onClick={async () => { await logout(); onClose(); }}><Icon name="logout" />Выйти</button>
    </Modal>
  );
}
