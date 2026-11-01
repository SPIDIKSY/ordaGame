import { useEffect, useRef } from 'react';
import { mountGame } from './game/engine.js';
import { initAccount } from './net/account.js';
import { ui, useStore } from './game/store.js';
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

  // Запускаем игру один раз, когда canvas появился на странице
  useEffect(() => mountGame(canvasRef.current, appRef.current), []);
  useEffect(() => { initAccount(); }, []);

  return (
    <div id="app" ref={appRef}>
      <canvas id="c" ref={canvasRef} />

      {s.screen !== 'menu' && <Hud inv={s.inv} />}
      <Toast toast={s.toast} />
      <div id="hint" className={s.hint ? '' : 'off'} style={{ bottom: s.hintBottom }}>
        {touch ? 'Тяни кружок внизу, чтобы бежать' : 'Беги на WASD или стрелках · пауза — Esc'}
      </div>

      {s.screen === 'menu' && <StartScreen heroId={s.heroId} best={s.best} account={s.account} />}
      {s.screen === 'levelup' && <LevelUpScreen choices={s.choices} rerolls={s.rerolls} />}
      {s.screen === 'chest' && s.chest && <ChestScreen chest={s.chest} />}
      {s.screen === 'pause' && s.pause && <PauseScreen sections={s.pause} />}
      {s.screen === 'dead' && s.dead && <DeadScreen dead={s.dead} />}
    </div>
  );
}
