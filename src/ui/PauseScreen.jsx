import { Fragment } from 'react';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import ConfirmButton from './ConfirmButton.jsx';

function InvRow({ icon, col, em, name, small }) {
  return (
    <div className="invrow" style={{ '--rc': col }}>
      <span className="slot big" style={{ '--rc': col }}><Icon name={icon} /></span>
      <span className="itxt"><em>{em}</em><b>{name}</b><small>{small}</small></span>
    </div>
  );
}

// Пауза: всё снаряжение героя и кнопки
export default function PauseScreen({ sections }) {
  return (
    <div id="pause" className="overlay">
      <div className="panel">
        <h2>Пауза</h2>
        <div className="invlist">
          {sections.map((sec) => (
            <Fragment key={sec.title}>
              <p className="sect">{sec.title}</p>
              {sec.empty && <p className="empty">{sec.empty}</p>}
              {sec.rows.map((r, i) => <InvRow key={i} {...r} />)}
            </Fragment>
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
