import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Окно поверх меню (вход, профиль, лидеры). Закрывается крестиком, Esc или кликом мимо
export default function Modal({ title, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay modal-ov" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Закрыть" onClick={onClose}><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
