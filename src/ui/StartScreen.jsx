import { useEffect, useRef, useState } from 'react';
import { HEROES, HDEF, WDEF, fmt } from '../game/data.js';
import { getHeroSprites, drawHeroArm, HERO_LOOK } from '../game/sprites/heroes/index.js';
import { GLOW } from '../game/sprites/world.js';
import { setGlowScale } from '../game/gfx.js';
import { game } from '../game/engine.js';
import Icon from './Icon.jsx';
import HeroPic from './HeroPic.jsx';
import AuthModal from './AuthModal.jsx';
import { initAccount } from '../net/account.js';
import ProfileModal from './ProfileModal.jsx';
import LeaderboardModal from './LeaderboardModal.jsx';
import SettingsModal from './SettingsModal.jsx';

// Полоски «здоровье» и «скорость»: сравнение героев между собой.
// Самый слабый получает четверть полоски, а не пустую — пустая читалась бы как «ноль».
const range = (key) => { const v = HEROES.map((q) => q[key]); return [Math.min(...v), Math.max(...v)]; };
const RANGES = { hp: range('hp'), speed: range('speed'), hit: range('hit') };
const barK = (key, v) => { const [a, b] = RANGES[key]; return 0.25 + 0.75 * (b > a ? (v - a) / (b - a) : 1); };

// Живой герой на постаменте: дышит и показывает атаку оружием.
// Размер холста берётся из вёрстки, поэтому на ПК он крупнее, чем на телефоне.
function HeroPreview({ id }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, c = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1), SZ = cv.clientWidth || 150, S = 2.1 * SZ / 150;
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
      c.translate(0, -18);
      setGlowScale(dpr * S);
      const tip = drawHeroArm(c, id, { atk, t, st: 0, bob: 0 }, (cc) => cc.drawImage(img, -img.w / 2, -img.h / 2, img.w, img.h));
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
  const [modal, setModal] = useState(null); // auth | profile | leaders | settings
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
      <header className="menu-top">
        <h1>Бесконечная орда</h1>
        <div className="account-bar">
          <button type="button" className="chip icon" aria-label="Настройки" title="Настройки" onClick={() => setModal('settings')}><Icon name="gear" /></button>
          {acc.status === 'user' && (
            <button type="button" className="chip" onClick={() => setModal('profile')}><Icon name="user" />{acc.user.nick}</button>
          )}
          {acc.status === 'guest' && (
            <button type="button" className="chip" onClick={() => setModal('auth')}><Icon name="user" />Войти</button>
          )}
          {acc.status === 'offline' && (
            <button type="button" className="chip off" title="Сервер недоступен — нажми, чтобы проверить ещё раз" onClick={() => initAccount()}>Оффлайн · повторить</button>
          )}
        </div>
      </header>
      <div className="menu">
        <section className="menu-hero" aria-live="polite">
          <HeroPreview id={h.id} />
          <div className="hero-card">
            <h2>{h.name}</h2>
            <p className="role">{h.role}</p>
            <div className="hbars">
              <span>Здоровье</span><i style={{ '--k': barK('hp', h.hp) }} /><b>{h.hp}</b>
              <span>Скорость</span><i style={{ '--k': barK('speed', h.speed) }} /><b>{h.speed}</b>
              <span title="Урон одного удара стартовым оружием — это число вылетает над врагом">Урон</span><i style={{ '--k': barK('hit', h.hit) }} /><b>{h.hit}</b>
            </div>
            <div className="hero-weapon">
              <span className="slot"><Icon name={Wd.icon} /></span>
              <div><b>{Wd.name}</b><small>{h.wfacts}</small></div>
            </div>
            {!!h.perks.length && <ul className="perk">{h.perks.map((t) => <li key={t}>{t}</li>)}</ul>}
          </div>
        </section>
        <div className="heroes" role="radiogroup" aria-label="Герой">
          {HEROES.map((q) => (
            <button key={q.id} type="button" role="radio" className={'hcard' + (q.id === heroId ? ' sel' : '')} aria-checked={q.id === heroId} onClick={() => game.selectHero(q.id)}>
              <HeroPic id={q.id} w={33} h={44} /><span>{q.name}</span>
            </button>
          ))}
        </div>
        <div className="menu-actions">
          <button id="startBtn" className="btn" type="button" onClick={game.start}>Играть</button>
          {acc.status !== 'offline' && acc.status !== 'checking' && (
            <button className="btn ghost" type="button" onClick={() => setModal('leaders')}><Icon name="trophy" />Лидеры</button>
          )}
        </div>
        <p className="menu-foot">
          {!!best && <span className="best">Рекорд: {fmt(best)}</span>}
          <span className="build" title="Когда собрана эта версия игры">сборка {__BUILD__}</span>
        </p>
      </div>
      {modal === 'auth' && <AuthModal onClose={() => setModal(null)} />}
      {modal === 'profile' && acc.status === 'user' && <ProfileModal account={acc} onClose={() => setModal(null)} />}
      {modal === 'leaders' && <LeaderboardModal account={acc} onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
    </div>
  );
}
