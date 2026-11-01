import { useEffect, useState } from 'react';

// Кнопка, которая просит нажать второй раз, чтобы случайно не сбросить забег
export default function ConfirmButton({ label, onConfirm }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button className="btn ghost" type="button" onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
      {armed ? 'Точно? Нажми ещё раз' : label}
    </button>
  );
}
