import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../net/api.js';
import { HEROES, HDEF, fmt } from '../game/data.js';
import { heroFace } from '../game/sprites/heroes.js';

// Таблица лидеров: лучший забег каждого игрока (время → убийства → очки)
export default function LeaderboardModal({ account, onClose }) {
  const [hero, setHero] = useState('');
  const [data, setData] = useState({ loading: true, rows: [], err: '' });
  const me = account.user ? account.user.id : null;

  useEffect(() => {
    let alive = true;
    setData((d) => ({ ...d, loading: true, err: '' }));
    api.leaderboard(hero).then((r) => { if (alive) setData({ loading: false, rows: r.rows, err: '' }); })
      .catch((e) => { if (alive) setData({ loading: false, rows: [], err: e.message }); });
    return () => { alive = false; };
  }, [hero]);

  return (
    <Modal title="Лидеры" onClose={onClose} wide>
      <div className="tabs scroll">
        <button type="button" className={hero === '' ? 'on' : ''} onClick={() => setHero('')}>Все</button>
        {HEROES.map((h) => (
          <button key={h.id} type="button" className={hero === h.id ? 'on' : ''} onClick={() => setHero(h.id)}>{h.name}</button>
        ))}
      </div>
      <div className="board">
        {data.loading && <p className="muted">Загрузка…</p>}
        {data.err && <p className="form-err">{data.err}</p>}
        {!data.loading && !data.err && !data.rows.length && <p className="muted">Пока никого. Стань первым!</p>}
        {!!data.rows.length && (
          <table>
            <thead><tr><th>#</th><th>Игрок</th><th>Время</th><th>Убито</th><th className="hide-sm">Очки</th></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.userId} className={r.userId === me ? 'me' : ''}>
                  <td className={'pl p' + Math.min(r.place, 4)}>{r.place}</td>
                  <td className="who"><img src={heroFace(r.hero)} alt={HDEF[r.hero] ? HDEF[r.hero].name : ''} title={HDEF[r.hero] ? HDEF[r.hero].name : ''} /><span>{r.nick}</span></td>
                  <td className="num">{fmt(r.time)}</td>
                  <td className="num">{r.kills}</td>
                  <td className="num hide-sm">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
