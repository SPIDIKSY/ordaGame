import Icon from './Icon.jsx';

// Квадратик с оружием / реликвией / предметом
export default function Slot({ s, big, relic }) {
  if (!s) return <span className={'slot empty' + (relic ? ' relic' : '')} />;
  return (
    <span className={'slot' + (big ? ' big' : '') + (s.isNew ? ' new' : '')} style={{ '--rc': s.col }}>
      <Icon name={s.icon} />
      {s.badge ? <b>{s.badge}</b> : null}
    </span>
  );
}

// Полный набор слотов: 5 оружий | 5 реликвий (+ предметы)
export function slotList(inv, withItems) {
  if (!inv) return [];
  const out = inv.weapons.map((s, i) => <Slot key={'w' + i + (s && s.isNew ? inv.stamp : '')} s={s} />);
  return out
    .concat(withItems === 'sep' ? [<span key="sep" className="sep" />] : [])
    .concat(inv.relics.map((s, i) => <Slot key={'r' + i + (s && s.isNew ? inv.stamp : '')} s={s} relic />))
    .concat(withItems === true ? inv.items.map((s) => <Slot key={s.key} s={s} />) : []);
}
