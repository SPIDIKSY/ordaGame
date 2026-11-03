import Icon from './Icon.jsx';

// Квадратик с оружием / реликвией / предметом
export default function Slot({ s, big, relic }) {
  if (!s) return <span className={'slot empty' + (relic ? ' relic' : '')} />;
  return (
    <span className={'slot' + (big ? ' big' : '')} style={{ '--rc': s.col }} title={s.title}>
      <Icon name={s.icon} />
      {s.badge ? <b>{s.badge}</b> : null}
    </span>
  );
}

// Полный набор слотов для итогов забега: 5 оружий, 5 реликвий, потом предметы
export function slotList(inv) {
  if (!inv) return [];
  return inv.weapons.map((s, i) => <Slot key={'w' + i} s={s} />)
    .concat(inv.relics.map((s, i) => <Slot key={'r' + i} s={s} relic />))
    .concat(inv.items.map((s) => <Slot key={s.key} s={s} />));
}
