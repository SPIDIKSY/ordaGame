import { hud, useStore } from '../game/store.js';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import Slot, { slotList } from './Slot.jsx';

// Верхняя панель: уровень, опыт, здоровье, время, убийства, босс, снаряжение, бонусы
export default function Hud({ inv }) {
  const h = useStore(hud);
  return (
    <div id="hud">
      <div className="toprow">
        <div className={'lvbadge' + (h.lvl > 1 ? ' bump' : '')} key={h.lvl}><small>ур.</small><b>{h.lvl}</b></div>
        <div className="xpbar"><i style={{ transform: 'scaleX(' + h.xpK + ')' }} /></div>
        <button id="pauseBtn" type="button" aria-label="Пауза" onClick={game.pause}>
          <svg className="ico" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="2" width="5" height="16" rx="1.6" fill="currentColor" /><rect x="12" y="2" width="5" height="16" rx="1.6" fill="currentColor" /></svg>
        </button>
      </div>
      <div className="row2">
        <div className="hpbar"><i style={{ transform: 'scaleX(' + h.hpK + ')' }} /><span>{h.hp} / {h.maxHp}</span></div>
        <div className={'timer' + (h.doom ? ' doom' : '')}>{h.time}</div>
        <div className="kills"><span><Icon name="skull" /></span><b>{h.kills}</b></div>
      </div>
      {h.boss && (
        <div className="bossbar">
          <span>{h.boss.name}</span>
          <div className="bb"><i style={{ transform: 'scaleX(' + h.boss.k + ')' }} /></div>
        </div>
      )}
      {inv && <div className="inv hudslots">{slotList(inv, 'sep')}</div>}
      {inv && inv.items.length > 0 && (
        <div className="inv">{inv.items.map((s) => <Slot key={s.isNew ? s.key + inv.stamp : s.key} s={s} />)}</div>
      )}
      <div className="buffs">
        {h.buffs.map((b) => (
          <span key={b.id} className="buff" style={{ '--bc': b.col }}>
            <span className="bi"><Icon name={b.icon} /></span>{b.name} <b>{b.left} с</b>
          </span>
        ))}
      </div>
    </div>
  );
}
