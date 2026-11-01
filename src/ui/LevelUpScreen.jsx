import { useEffect } from 'react';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';

// Новый уровень: три карточки на выбор и переброс
export default function LevelUpScreen({ choices, rerolls }) {
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
        <div id="cards">
          {choices.map((c, i) => (
            <button key={c.key} type="button" className={'card ' + c.cls} style={{ '--cc': c.cc }} onClick={() => game.pickChoice(i)}>
              <span className="cico"><Icon name={c.icon} /></span>
              <span className="ctext">
                <span className="meta"><span className="cat">{c.cat}</span><span className="lv">{c.lv}</span></span>
                <span className="name">{c.name}</span>
                <span className="desc">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="lvactions">
          <button id="rerollBtn" className="btn ghost" type="button" disabled={rerolls <= 0} onClick={game.reroll}>
            <Icon name="reroll" />Перебросить · {rerolls}
          </button>
        </div>
      </div>
    </div>
  );
}
