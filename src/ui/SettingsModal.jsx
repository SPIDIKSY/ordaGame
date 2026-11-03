import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { settings, setSetting, onSettings, QUALITY, FPS_LIMITS, RENDERERS, renderInfo } from '../game/settings.js';

// Настройки: графика, частота кадров, счётчик FPS. Сохраняются на этом устройстве
export default function SettingsModal({ onClose }) {
  const [s, setS] = useState({ ...settings });
  useEffect(() => onSettings((v) => setS({ ...v })), []);
  const q = QUALITY[s.quality];
  return (
    <Modal title="Настройки" onClose={onClose}>
      <div className="setting">
        <h3>Графика</h3>
        <div className="tabs">
          {Object.entries(QUALITY).map(([id, Q]) => (
            <button key={id} type="button" className={s.quality === id ? 'on' : ''} onClick={() => setSetting('quality', id)}>{Q.name}</button>
          ))}
        </div>
        <p className="muted">{q.note}</p>
      </div>
      <div className="setting">
        <h3>Чем рисовать</h3>
        <div className="tabs">
          {RENDERERS.map((r) => (
            <button key={r.id} type="button" className={s.renderer === r.id ? 'on' : ''} onClick={() => setSetting('renderer', r.id)}>{r.name}</button>
          ))}
        </div>
        <p className="muted">
          {s.renderer === 'gl' && renderInfo.glFailed
            ? 'Видеокарта на этом устройстве не запустилась — игра рисует обычным способом.'
            : 'Видеокарта рисует быстрее, особенно в Firefox на ПК. Если картинка пропала или мигает — выбери «Обычный».'}
        </p>
      </div>
      <div className="setting">
        <h3>Частота кадров</h3>
        <div className="tabs">
          {FPS_LIMITS.map((f) => (
            <button key={f.id} type="button" className={s.fps === f.id ? 'on' : ''} onClick={() => setSetting('fps', f.id)}>{f.name}</button>
          ))}
        </div>
        <p className="muted">Чаще экрана игра не рисует никогда. Ограничение до 30 бережёт батарею телефона.</p>
      </div>
      <div className="setting">
        <h3>Счётчик FPS</h3>
        <div className="tabs">
          <button type="button" className={!s.showFps ? 'on' : ''} onClick={() => setSetting('showFps', false)}>Скрыт</button>
          <button type="button" className={s.showFps ? 'on' : ''} onClick={() => setSetting('showFps', true)}>Показан</button>
        </div>
        <p className="muted">Плашка в левом нижнем углу: кадры в секунду и сколько было долгих кадров.</p>
      </div>
    </Modal>
  );
}
