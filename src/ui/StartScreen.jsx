import { useEffect, useRef, useState } from 'react';
import { HEROES, HDEF, WDEF, fmt } from '../game/data.js';
import { getHeroSprites, heroPortrait, drawHeroArm, HERO_LOOK } from '../game/sprites/heroes.js';
import { GLOW } from '../game/sprites/world.js';
import { setGlowScale } from '../game/gfx.js';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import AuthModal from './AuthModal.jsx';
import ProfileModal from './ProfileModal.jsx';
import LeaderboardModal from './LeaderboardModal.jsx';

// Картинки героев для кнопок выбора рисуются один раз
let portraits = null;
const getPortraits = () => portraits || (portraits = Object.fromEntries(HEROES.map((h) => [h.id, heroPortrait(h.id)])));

// Живое превью выбранного героя: дышит и показывает атаку оружием
function HeroPreview({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, c = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1), SZ = 150, S = 2.1;
    cv.width = SZ * dpr; cv.height = SZ * dpr;
    const spr = getHeroSprites(id), L = HERO_LOOK[id];
    const t0 = performance.now();
    let raf = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const t = (now - t0) / 1000, cyc = (t + 1.2) % 2.4;
      const atk = cyc < L.atk ? cyc / L.atk : -1;
      const br = 1 + Math.sin(t * 2.86) * 0.025;
      const cx = SZ / 2, cy = SZ * 0.5;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      c.setTransform(dpr * S, 0, 0, dpr * S * br, dpr * cx, dpr * (cy + 18 * S));
      const img = spr.idle;
      c.drawImage(img, -img.w / 2, -img.h / 2 - 18, img.w, img.h);
      c.translate(0, -18);
      setGlowScale(dpr * S);
      const tip = drawHeroArm(c, id, { atk, t, st: 0, bob: 0 });
      if (L.glow) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.globalCompositeOperation = 'lighter';
        const size = (26 + Math.sin(t * 6) * 3 + tip.fl * 40) * S * 0.7;
        c.globalAlpha = 0.5 + tip.fl * 0.45;
        c.drawImage(GLOW[L.glow], cx + tip.x * S - size / 2, cy + 18 * S + (tip.y - 18) * S * br - size / 2, size, size);
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return <div className="hero-stage"><canvas ref={ref} aria-hidden="true" /></div>;
}

export default function StartScreen({ heroId, best, account }) {
  const P = getPortraits();
  const [modal, setModal] = useState(null); // auth | profile | leaders
  const acc = account || { status: 'checking' };
  const h = HDEF[heroId] || HEROES[0], Wd = WDEF[h.weapon];

  // Enter / пробел — начать игру, стрелки — выбрать героя
  useEffect(() => {
    const onKey = (e) => {
      if (modal) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Enter' || e.code === 'Space')) return;
      const i = HEROES.findIndex((q) => q.id === heroId);
      if (e.code === 'Enter') { e.preventDefault(); game.start(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') game.selectHero(HEROES[(i + 1) % HEROES.length].id);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') game.selectHero(HEROES[(i + HEROES.length - 1) % HEROES.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [heroId, modal]);

  return (
    <div id="start" className="overlay">
      <div className="account-bar">
        {acc.status === 'user' && (
          <button type="button" className="chip" onClick={() => setModal('profile')}><Icon name="user" />{acc.user.nick}</button>
        )}
        {acc.status === 'guest' && (
          <button type="button" className="chip" onClick={() => setModal('auth')}><Icon name="user" />Войти</button>
        )}
        {acc.status === 'offline' && <span className="chip off" title="Сервер с аккаунтами недоступен — можно играть гостем">Оффлайн</span>}
      </div>
      <div className="panel">
        <h1>Бесконечная орда</h1>
        <HeroPreview id={h.id} />
        <div className="heroes">
          {HEROES.map((q) => (
            <button key={q.id} type="button" className={'hcard' + (q.id === heroId ? ' sel' : '')} aria-pressed={q.id === heroId} onClick={() => game.selectHero(q.id)}>
              <img src={P[q.id]} alt="" />{q.name}
            </button>
          ))}
        </div>
        <div className="hero-info">
          <span className="wpn"><Icon name={Wd.icon} />{Wd.name}</span>
          <p>{h.perk}</p>
        </div>
        <div className="menu-actions">
          <button id="startBtn" className="btn" type="button" onClick={game.start}>Играть</button>
          {acc.status !== 'offline' && acc.status !== 'checking' && (
            <button className="btn ghost" type="button" onClick={() => setModal('leaders')}><Icon name="trophy" />Лидеры</button>
          )}
        </div>
        {!!best && <p className="best">Рекорд: {fmt(best)}</p>}
      </div>
      {modal === 'auth' && <AuthModal onClose={() => setModal(null)} />}
      {modal === 'profile' && acc.status === 'user' && <ProfileModal account={acc} onClose={() => setModal(null)} />}
      {modal === 'leaders' && <LeaderboardModal account={acc} onClose={() => setModal(null)} />}
    </div>
  );
}
