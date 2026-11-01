import { useEffect, useState } from 'react';

// Всплывающая надпись по центру («Волна врагов!», «Выпал сундук!»)
export default function Toast({ toast }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!toast) { setShow(false); return undefined; }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return <div id="toast" key={toast ? toast.id : 0} className={show ? 'show' : ''}>{toast ? toast.text : ''}</div>;
}
