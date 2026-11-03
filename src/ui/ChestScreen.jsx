import { useEffect, useMemo, useRef, useState } from 'react';
import { RAR } from '../game/data.js';
import { paintChest } from '../game/sprites/world.js';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';

const CHEST_W = 150, CHEST_H = 165;
// Сундук на холсте страницы (см. paintChest). Рисуются оба вида сразу,
// а показывается нужный — чтобы крышка открывалась без задержки на перерисовку
function ChestPic({ open }) {
  const ref = useRef(null);
  useEffect(() => { paintChest(ref.current, open, CHEST_W, CHEST_H); }, [open]);
  return <canvas ref={ref} className={open ? 'open' : 'shut'} aria-hidden="true" />;
}

// Сундук: падает и трясётся → крышка распахивается → перебор предметов → вспышка и конфетти → «Забрать».
// Сроки фаз совпадают с анимациями в styles.css (chestDrop + rattle ≈ 0,95 с, chestPop 0,3 с)
const SHAKE_MS = 950, OPEN_MS = 300;
export default function ChestScreen({ chest }) {
  const [phase, setPhase] = useState('closed'); // closed | opening | rolling | revealed
  const [rc, setRc] = useState(RAR[0].col);
  const [icon, setIcon] = useState(null);
  const [tick, setTick] = useState(0);
  const [canTake, setCanTake] = useState(false);
  const timers = useRef([]);
  const boxRef = useRef(null);
  const phaseRef = useRef('closed');

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const go = (p) => { phaseRef.current = p; setPhase(p); };

  // skipped — игрок нажал во время анимации: он уже ждёт предмет, долгая пауза перед
  // «Забрать» не нужна. Короткая всё же есть, чтобы двойное нажатие не забирало вслепую.
  const reveal = (skipped) => {
    if (phaseRef.current === 'revealed') return;
    clear(); go('revealed');
    setRc(RAR[chest.r].col); setIcon(chest.icon); setTick((t) => t + 1);
    timers.current.push(setTimeout(() => setCanTake(true), skipped ? 250 : 500));
  };

  useEffect(() => {
    const startRoll = () => {
      go('rolling');
      const total = 18 + chest.r * 3;
      let n = 0;
      const step = () => {
        n++;
        if (n >= total) { reveal(false); return; }
        // цвета редкости мигают; к концу чаще выпадает настоящий
        const k = n / total;
        const rr = Math.random() < k * 0.6 ? chest.r : Math.min(4, Math.floor(Math.random() * (chest.r + 2)));
        setRc(RAR[rr].col);
        setIcon(chest.rollIcons[Math.floor(Math.random() * chest.rollIcons.length)]);
        setTick((t) => t + 1);
        timers.current.push(setTimeout(step, 40 + 260 * Math.pow(k, 2.4)));
      };
      step();
    };
    timers.current.push(setTimeout(() => { go('opening'); timers.current.push(setTimeout(startRoll, OPEN_MS)); }, SHAKE_MS));
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chest.id]);

  // перезапускаем маленькую анимацию «тик» у окошка с предметом
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !tick) return;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
  }, [tick]);

  const confetti = useMemo(() => {
    if (phase !== 'revealed') return [];
    const cols = [RAR[chest.r].col, '#ffffff', '#ffd56e'], n = 18 + chest.r * 7, out = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 120;
      out.push({
        '--dx': Math.round(Math.cos(a) * d) + 'px', '--dy': Math.round(Math.sin(a) * d - 40) + 'px',
        '--rot': Math.round(Math.random() * 800 - 400) + 'deg', background: cols[i % 3], animationDelay: Math.round(Math.random() * 140) + 'ms'
      });
    }
    return out;
  }, [phase, chest.r]);

  const cls = 'overlay chest-ov ' + phase + (phase !== 'closed' ? ' opened' : '');

  return (
    <div id="chest" className={cls} data-r={chest.r} style={{ '--rc': rc }} onClick={() => reveal(true)}>
      <div className="panel">
        <div className="stage">
          <div className="rays" />
          <div className="cglow" />
          <div className="beam" />
          <div className="chest-box" role="img" aria-label="Сундук"><ChestPic open={false} /><ChestPic open /></div>
          <div className="reveal" ref={boxRef}>
            {icon && <Icon name={icon} />}
            {phase === 'revealed' && chest.lvlTag && <span className="lvtag">{chest.lvlTag}</span>}
          </div>
          <div className="burst" />
          <div className="wave" />
          <div className="confetti">{confetti.map((st, i) => <i key={i} style={st} />)}</div>
        </div>
        <p className="tap">Нажми в любом месте, чтобы открыть сразу</p>
        <div className="cinfo">
          <p className="rar">{chest.rarity}</p>
          <h2>{chest.name}</h2>
          <p className="lead">{chest.desc}</p>
          <button id="takeBtn" className="btn" type="button" disabled={!canTake} onClick={game.takeChest}>Забрать</button>
        </div>
      </div>
    </div>
  );
}
