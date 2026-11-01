import { useEffect } from 'react';
import { game } from '../game/engine.js';
import { slotList } from './Slot.jsx';

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
        <div className="inv center">{slotList(dead.inv, true)}</div>
        <button id="againBtn" className="btn" type="button" onClick={game.start}>Ещё раз</button>
        <button className="btn ghost" type="button" onClick={game.menu}>Сменить героя</button>
      </div>
    </div>
  );
}
