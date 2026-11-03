import { useEffect, useRef } from 'react';
import { paintPortrait } from '../game/sprites/heroes/index.js';

// Неподвижный портрет героя: рисуется прямо на холсте страницы (см. paintPortrait)
export default function HeroPic({ id, w, h, title }) {
  const ref = useRef(null);
  useEffect(() => { paintPortrait(ref.current, id, w, h); }, [id, w, h]);
  return <canvas ref={ref} className="heropic" style={{ width: w, height: h }} title={title} aria-hidden={title ? undefined : 'true'} />;
}
