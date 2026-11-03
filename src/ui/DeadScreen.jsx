import { useEffect, useState } from 'react';
import { game } from '../game/engine.js';
import { slotList } from './Slot.jsx';
import AuthModal from './AuthModal.jsx';
import Icon from './Icon.jsx';
import { api } from '../net/api.js';
import { refreshMe } from '../net/account.js';

// Что стало с результатом на сервере
function OnlineResult({ online, onAuth }) {
  if (!online || online.status === 'offline') return null;
  if (online.status === 'sending') return <p className="online muted">Отправляем результат…</p>;
  if (online.status === 'error') return <p className="online bad">{online.msg}</p>;
  if (online.status === 'info') return <p className="online good">{online.msg}</p>;
  if (online.status === 'claiming') return <p className="online muted">Переносим забег в твой аккаунт…</p>;
  // гость: предлагаем зарегистрироваться и забрать этот забег в лидерборд
  if (online.status === 'claimable' || online.status === 'guest') {
    const can = online.status === 'claimable';
    return (
      <div className="claim-card">
        <Icon name="trophy" />
        <div>
          <b>{can ? 'Попади в лидерборд с этим забегом!' : 'Хочешь в лидерборд?'}</b>
          <p>{can ? 'Зарегистрируйся или войди в течение 30 минут — и этот результат засчитается.' : 'Зарегистрируйся — и следующие забеги попадут в таблицу лидеров.'}</p>
          <div className="claim-actions">
            <button className="btn" type="button" onClick={() => onAuth('reg')}>Создать аккаунт</button>
            <button className="btn ghost" type="button" onClick={() => onAuth('login')}>Войти</button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <p className="online good">
      Результат засчитан{online.place ? ' · место #' + online.place : ''}{online.heroPlace ? ' (за героя #' + online.heroPlace + ')' : ''} · {online.score} очков
    </p>
  );
}

// Итоги забега
export default function DeadScreen({ dead }) {
  const [auth, setAuth] = useState(null);      // окно входа/регистрации: 'reg' | 'login'
  const [claimed, setClaimed] = useState(null); // что вернул сервер после переноса забега
  const online = claimed || dead.online;

  useEffect(() => {
    const onKey = (e) => {
      if (auth) return;
      if (e.code === 'Enter' && !(e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT'))) game.start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [auth]);

  // после входа или регистрации: забираем забег гостя, если он проверен сервером
  const afterAuth = async () => {
    setAuth(null);
    const o = dead.online;
    if (!o || o.status !== 'claimable') { setClaimed({ status: 'info', msg: 'Готово! Следующие забеги попадут в лидерборд' }); return; }
    setClaimed({ status: 'claiming' });
    try {
      const r = await api.claim(o.runId, o.runToken);
      setClaimed({ status: 'ok', place: r.place, heroPlace: r.heroPlace, score: r.score });
      refreshMe();
    } catch (e) { setClaimed({ status: 'error', msg: e.message }); }
  };
  return (
    <div id="dead" className="overlay">
      <div className="panel">
        <h2>Герой пал</h2>
        <div className="stats">
          <div><small>Время</small><b>{dead.time}</b></div>
          <div><small>Убито</small><b>{dead.kills}</b></div>
          <div><small>Уровень</small><b>{dead.level}</b></div>
        </div>
        <p className="best">{dead.bestText}</p>
        <OnlineResult online={online} onAuth={setAuth} />
        <div className="inv center">{slotList(dead.inv)}</div>
        <button id="againBtn" className="btn" type="button" onClick={game.start}>Ещё раз</button>
        <button className="btn ghost" type="button" onClick={game.menu}>Сменить героя</button>
      </div>
      {auth && (
        <AuthModal startMode={auth} onClose={() => setAuth(null)} onDone={afterAuth}
          note={dead.online && dead.online.status === 'claimable' ? 'Забег ' + dead.time + ' · убито ' + dead.kills + ' засчитается сразу после входа.' : null} />
      )}
    </div>
  );
}
