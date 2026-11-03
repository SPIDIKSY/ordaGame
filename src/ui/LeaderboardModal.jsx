import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../net/api.js';
import { HEROES, HDEF, fmt } from '../game/data.js';
import HeroPic from './HeroPic.jsx';

// Столбцы, по которым можно упорядочить таблицу. Порядок считает сервер:
// сортировать на месте нельзя — он присылает только первую сотню.
const SORTS = [
  { id: 'time', name: 'По времени' },
  { id: 'kills', name: 'По убийствам' },
  { id: 'score', name: 'По очкам' }
];

// Топ героев: за кого сколько играют
function HeroTop() {
  const [data, setData] = useState({ loading: true, rows: [], err: '' });
  useEffect(() => {
    let alive = true;
    api.heroes().then((r) => { if (alive) setData({ loading: false, rows: r.rows, err: '' }); })
      .catch((e) => { if (alive) setData({ loading: false, rows: [], err: e.message }); });
    return () => { alive = false; };
  }, []);
  const top = Math.max(1, ...data.rows.map((r) => r.runs));
  const hours = (sec) => (sec >= 3600 ? (Math.round(sec / 360) / 10).toString().replace('.', ',') + ' ч' : Math.round(sec / 60) + ' мин');
  return (
    <div className="board herotop">
      {data.loading && <p className="muted">Загрузка…</p>}
      {data.err && <p className="form-err">{data.err}</p>}
      {!!data.rows.length && (
        <table>
          <colgroup><col className="c-pl" /><col /><col className="c-n" /><col className="c-n" /><col className="c-rec" /></colgroup>
          <thead><tr><th>#</th><th>Герой</th>
            <th className="by" title="Сколько забегов начато за этого героя">Забеги</th>
            <th title="Сколько игроков с аккаунтом есть в рекордах за этого героя">Игроки</th>
            <th title="Лучшее время за этого героя">Рекорд</th>
          </tr></thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.hero}>
                <td className={'pl p' + Math.min(r.place, 4)}>{r.place}</td>
                <td className="who"><div>
                  <HeroPic id={r.hero} w={20} h={27} />
                  <span className="hname">{HDEF[r.hero] ? HDEF[r.hero].name : r.hero}
                    <i className="share" title={'Сыграно ' + hours(r.time)}><i style={{ width: (r.runs / top * 100) + '%' }} /></i>
                  </span>
                </div></td>
                <td className="num by">{r.runs}<small>{Math.round(r.share * 100)}%</small></td>
                <td className="num">{r.players}</td>
                <td className="num rec">{r.best ? <>{fmt(r.best.time)}<small title={r.best.nick}>{r.best.nick}</small></> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted note">Полоска и процент — доля забегов за этого героя. Забеги считаются с ноября 2026 года, игроки и рекорды — за всё время.</p>
    </div>
  );
}

// Таблица лидеров: лучший забег каждого игрока; вкладка «Топ героев» — за кого сколько играют
export default function LeaderboardModal({ account, onClose }) {
  const [mode, setMode] = useState('players');
  const [hero, setHero] = useState('');
  const [sort, setSort] = useState('time');
  const [help, setHelp] = useState(false);
  const [data, setData] = useState({ loading: true, rows: [], scoring: null, err: '' });
  const me = account.user ? account.user.id : null;

  useEffect(() => {
    let alive = true;
    setData((d) => ({ ...d, loading: true, err: '' }));
    api.leaderboard(hero, sort).then((r) => { if (alive) setData({ loading: false, rows: r.rows, scoring: r.scoring, err: '' }); })
      .catch((e) => { if (alive) setData({ loading: false, rows: [], scoring: null, err: e.message }); });
    return () => { alive = false; };
  }, [hero, sort]);

  const sc = data.scoring;

  return (
    <Modal title="Лидеры" onClose={onClose} wide>
      <div className="tabs modes">
        <button type="button" className={mode === 'players' ? 'on' : ''} onClick={() => setMode('players')}>Рекорды игроков</button>
        <button type="button" className={mode === 'heroes' ? 'on' : ''} onClick={() => setMode('heroes')}>Топ героев</button>
      </div>
      {mode === 'heroes' ? <HeroTop /> : <>
      <div className="tabs scroll">
        <button type="button" className={hero === '' ? 'on' : ''} onClick={() => setHero('')}>Все</button>
        {HEROES.map((h) => (
          <button key={h.id} type="button" className={hero === h.id ? 'on' : ''} onClick={() => setHero(h.id)}>{h.name}</button>
        ))}
      </div>
      <div className="tabs sorts">
        {SORTS.map((s) => (
          <button key={s.id} type="button" className={sort === s.id ? 'on' : ''} onClick={() => setSort(s.id)}>{s.name}</button>
        ))}
        <button type="button" className={'help-btn' + (help ? ' on' : '')} aria-expanded={help}
          title="Как считаются очки" onClick={() => setHelp((v) => !v)}>?</button>
      </div>
      {help && (
        <div className="help-box">
          <b>Как считаются очки</b>
          {sc ? (
            <ul>
              <li>{sc.sec} за каждую секунду, что ты продержался</li>
              <li>{sc.kill} за каждое убийство</li>
              <li>{sc.level} за каждый уровень</li>
              <li>{sc.boss} за каждого побеждённого босса</li>
            </ul>
          ) : <p className="muted">Числа подгрузятся вместе с таблицей.</p>}
          <p className="muted">Очки считает сервер, а не игра, — подправить их у себя не получится.
            В таблицу попадает один, самый лучший забег каждого игрока.</p>
        </div>
      )}
      <div className="board">
        {data.loading && <p className="muted">Загрузка…</p>}
        {data.err && <p className="form-err">{data.err}</p>}
        {!data.loading && !data.err && !data.rows.length && <p className="muted">Пока никого. Стань первым!</p>}
        {!!data.rows.length && (
          <table>
            <colgroup><col className="c-pl" /><col /><col className="c-n" /><col className="c-n" /><col className="c-sc" /></colgroup>
            <thead><tr><th>#</th><th>Игрок</th>
              <th className={sort === 'time' ? 'by' : ''}>Время</th>
              <th className={sort === 'kills' ? 'by' : ''}>Убито</th>
              <th className={sort === 'score' ? 'by' : ''}>Очки</th>
            </tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.userId} className={r.userId === me ? 'me' : ''}>
                  <td className={'pl p' + Math.min(r.place, 4)}>{r.place}</td>
                  <td className="who"><div><HeroPic id={r.hero} w={20} h={27} title={HDEF[r.hero] ? HDEF[r.hero].name : ''} /><span>{r.nick}</span></div></td>
                  <td className={'num' + (sort === 'time' ? ' by' : '')}>{fmt(r.time)}</td>
                  <td className={'num' + (sort === 'kills' ? ' by' : '')}>{r.kills}</td>
                  <td className={'num score' + (sort === 'score' ? ' by' : '')}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </>}
    </Modal>
  );
}
