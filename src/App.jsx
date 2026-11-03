import { useEffect, useRef, useState } from 'react';
import { mountGame } from './game/engine.js';
import { initAccount } from './net/account.js';
import { ui, useStore } from './game/store.js';
import { settings, onSettings, renderInfo } from './game/settings.js';
import Hud from './ui/Hud.jsx';
import Toast from './ui/Toast.jsx';
import StartScreen from './ui/StartScreen.jsx';
import LevelUpScreen from './ui/LevelUpScreen.jsx';
import ChestScreen from './ui/ChestScreen.jsx';
import PauseScreen from './ui/PauseScreen.jsx';
import DeadScreen from './ui/DeadScreen.jsx';

const touch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

export default function App() {
  const appRef = useRef(null);
  const canvasRef = useRef(null);
  const s = useStore(ui);
  // Холст создаётся заново, когда меняется способ рисования (видеокарта / обычный):
  // у одного холста может быть только один способ
  const [rnd, setRnd] = useState(settings.renderer);
  useEffect(() => onSettings((v, key) => { if (key === 'renderer') { renderInfo.glFailed = false; setRnd(v.renderer); } }), []);
  const ckey = rnd + ':' + (s.canvasKey || 0);

  // Запускаем игру, когда canvas появился на странице (и заново — с новым холстом)
  useEffect(() => mountGame(canvasRef.current, appRef.current), [ckey]);
  useEffect(() => { initAccount(); }, []);

  return (
    <div id="app" ref={appRef}>
      <canvas key={ckey} id="c" ref={canvasRef} />

      {s.screen !== 'menu' && <Hud />}
      {s.screen === 'play' && <Toast toast={s.toast} />}
      <div id="hint" className={s.hint ? '' : 'off'} style={{ bottom: s.hintBottom }}>
        {touch ? 'Тяни кружок внизу, чтобы бежать' : 'Беги на WASD или стрелках · пауза — Esc'}
      </div>

      {s.screen === 'menu' && <StartScreen heroId={s.heroId} best={s.best} account={s.account} />}
      {s.screen === 'levelup' && <LevelUpScreen choices={s.choices} rerolls={s.rerolls} grow={s.grow} />}
      {s.screen === 'chest' && s.chest && <ChestScreen chest={s.chest} />}
      {s.screen === 'pause' && s.pause && <PauseScreen sections={s.pause} />}
      {s.screen === 'dead' && s.dead && <DeadScreen dead={s.dead} />}
    </div>
  );
}
