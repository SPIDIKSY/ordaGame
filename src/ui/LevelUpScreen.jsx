import { useEffect } from 'react';
import { game } from '../game/engine.js';
import { hud, useStore } from '../game/store.js';
import Icon from './Icon.jsx';
import { cardKind, cardPattern } from './cardPattern.js';

// Точки прогресса: уже взятые уровни, тот, что берём сейчас, и оставшиеся
function Pips({ now, max }) {
  return (
    <span className="pips" aria-label={'уровень ' + now + ' из ' + max}>
      {Array.from({ length: max }, (_, k) => <i key={k} className={k < now - 1 ? 'got' : k === now - 1 ? 'next' : ''} />)}
    </span>
  );
}

// Новый уровень: три карточки на выбор и переброс
export default function LevelUpScreen({ choices, rerolls }) {
  const { lvl } = useStore(hud);
  // На компьютере можно выбирать клавишами 1, 2, 3 и перебрасывать на R
  useEffect(() => {
    const onKey = (e) => {
      const n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
      if (n !== undefined) game.pickChoice(n);
      else if (e.code === 'KeyR') game.reroll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div id="levelup" className="overlay">
      <div className="panel wide">
        <h2>Новый уровень</h2>
        <p className="lvsub">Уровень {lvl} · выбери одно улучшение</p>
        <div id="cards">
          {choices.map((c, i) => (
            <button key={c.key} type="button" className={'card ' + c.cls + ' k-' + cardKind(c.cls)} style={{ '--cc': c.cc, '--i': i, '--pat': cardPattern(cardKind(c.cls), c.cc) }} onClick={() => game.pickChoice(i)}>
              <kbd className="khint">{i + 1}</kbd>
              <span className="cico"><Icon name={c.icon} /></span>
              <span className="ctext">
                <span className="meta"><span className="cat">{c.cat}</span><span className="lv">{c.lv}</span></span>
                <span className="name">{c.name}</span>
                {c.pips && <Pips now={c.pips[0]} max={c.pips[1]} />}
                <span className="desc">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="lvactions">
          <button id="rerollBtn" className="btn ghost" type="button" disabled={rerolls <= 0} onClick={game.reroll}>
            <Icon name="reroll" />Перебросить · {rerolls}<kbd className="khint inline">R</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
