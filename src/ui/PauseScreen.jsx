import { useState } from 'react';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import ConfirmButton from './ConfirmButton.jsx';
import SettingsModal from './SettingsModal.jsx';

// Пауза: характеристики героя и снаряжение (без лишнего текста)
export default function PauseScreen({ sections: d }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <div id="pause" className="overlay">
      <div className="panel">
        <h2>Пауза</h2>
        <p className="muted">{d.hero} · ур. {d.level} · {d.time} · убито {d.kills}</p>
        {d.grow && <p className="lvgrow">{d.grow}</p>}
        {d.gear.filter((grp) => grp.slots.length).map((grp) => (
          <div key={grp.id} className="gear-group">
            <h3>{grp.title}{grp.max ? <small> {grp.slots.length} из {grp.max}</small> : null}</h3>
            <div className="gear">
              {grp.slots.map((s) => (
                <div key={s.key} className="gear-cell" title={s.title}>
                  <span className="slot" style={{ '--rc': s.col }}>
                    <Icon name={s.icon} />{s.badge ? <b>{s.badge}</b> : null}
                  </span>
                  <span className="gear-name">{s.name}</span>
                  {s.sub && <span className="gear-dmg" title="Урон одного удара — это число вылетает над врагом">{s.sub}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="statgrid">
          {d.stats.map((s) => (
            <div key={s.id} className={'stat ' + s.tone} title={s.hint}><span>{s.label}</span><b>{s.value}</b></div>
          ))}
        </div>
        <button id="resumeBtn" className="btn" type="button" onClick={game.resume}>Продолжить</button>
        <div className="lvactions">
          <ConfirmButton label="Заново" onConfirm={game.start} />
          <ConfirmButton label="Сменить героя" onConfirm={game.menu} />
          <button type="button" className="btn ghost" onClick={() => setSettingsOpen(true)}><Icon name="gear" />Настройки</button>
        </div>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
