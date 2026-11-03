/* =====================================================
   УЗОР НА ФОНЕ КАРТОЧЕК НОВОГО УРОВНЯ
   Оружие — мечи, топоры, кинжалы; реликвии — кольца, короны, амулеты;
   характеристики — сердечки, щиты, сапоги; лечение — сердечки.
   С первого взгляда видно, что за карточка.
   ===================================================== */
import { ICON } from '../game/icons.js';

const SETS = {
  weapon: ['sword', 'axe', 'dagger', 'orb', 'whip', 'boomer'],
  relic: ['ring', 'crown', 'amulet', 'crystal', 'feather', 'compass'],
  stat: ['heart', 'shield', 'boot', 'hourglass', 'target', 'magnet'],
  heal: ['heart', 'drop', 'sprout', 'heart', 'drop', 'sprout']
};
// Где лежат значки в квадрате 120×120 и как повёрнуты (узор бесшовно повторяется)
const SPOTS = [[8, 6, -20], [62, 10, 25], [34, 44, 10], [88, 50, -30], [6, 80, 35], [62, 84, -10]];

export function cardKind(cls) {
  if (cls === 'weap' || cls === 'wup') return 'weapon';
  if (cls === 'relic') return 'relic';
  if (/^r\d$/.test(cls || '')) return 'stat';
  return 'heal';
}

const cache = {};
export function cardPattern(kind, col) {
  const key = kind + col;
  if (cache[key]) return cache[key];
  const icons = SETS[kind] || SETS.heal;
  const g = SPOTS.map(([x, y, r], i) =>
    '<g transform="translate(' + (x + 13) + ' ' + (y + 13) + ') rotate(' + r + ') scale(0.8) translate(-16 -16)">' + ICON[icons[i % icons.length]] + '</g>').join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g color="' + col + '" fill="' + col + '">' + g + '</g></svg>';
  return (cache[key] = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
}
