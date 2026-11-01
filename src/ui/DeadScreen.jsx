import { useEffect } from 'react';
import { game } from '../game/engine.js';
import { slotList } from './Slot.jsx';

// Что стало с результатом на сервере
function OnlineResult({ online }) {
  if (!online || online.status === 'offline') return null;
  if (online.status === 'guest') return <p className="online muted">Войди в аккаунт, чтобы попадать в лидерборд</p>;
  if (online.status === 'sending') return <p className="online muted">Отправляем результат…</p>;
  if (online.status === 'error') return <p className="online bad">{online.msg}</p>;
  return (
    <p className="online good">
      Результат засчитан{online.place ? ' · место #' + online.place : ''}{online.heroPlace ? ' (за героя #' + online.heroPlace + ')' : ''} · {online.score} очков
    </p>
  );
}

// Итоги забега
export default function DeadScreen({ dead }) {
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Enter' && !(e.target && e.target.tagName === 'BUTTON')) game.start(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
        <OnlineResult online={dead.online} />
        <div className="inv center">{slotList(dead.inv, true)}</div>
        <button id="againBtn" className="btn" type="button" onClick={game.start}>Ещё раз</button>
        <button className="btn ghost" type="button" onClick={game.menu}>Сменить героя</button>
      </div>
    </div>
  );
}
