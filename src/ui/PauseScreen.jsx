import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import ConfirmButton from './ConfirmButton.jsx';

// Пауза: характеристики героя и снаряжение (без лишнего текста)
export default function PauseScreen({ sections: d }) {
  return (
    <div id="pause" className="overlay">
      <div className="panel">
        <h2>Пауза</h2>
        <p className="muted">{d.hero} · ур. {d.level} · {d.time} · убито {d.kills}</p>
        <div className="gear">
          {d.gear.map((s) => (
            <span key={s.key} className="slot" style={{ '--rc': s.col }} title={s.title}>
              <Icon name={s.icon} />{s.badge ? <b>{s.badge}</b> : null}
            </span>
          ))}
        </div>
        <div className="statgrid">
          {d.stats.map((s) => (
            <div key={s.id} className={'stat ' + s.tone}><span>{s.label}</span><b>{s.value}</b></div>
          ))}
        </div>
        <button id="resumeBtn" className="btn" type="button" onClick={game.resume}>Продолжить</button>
        <div className="lvactions">
          <ConfirmButton label="Заново" onConfirm={game.start} />
          <ConfirmButton label="Сменить героя" onConfirm={game.menu} />
        </div>
      </div>
    </div>
  );
}
