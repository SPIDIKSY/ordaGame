import { ICON } from '../game/icons.js';

// Иконка из набора icons.js (цвет берётся из CSS: currentColor)
export default function Icon({ name }) {
  return <svg className="ico" viewBox="0 0 32 32" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[name] || '' }} />;
}
