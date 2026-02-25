import { useEffect, useState } from 'react';

const STORAGE_KEY = 'timeline-cookie-consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner-wrapper" role="dialog" aria-label="Aviso de cookies">
      <div className="cookie-banner">
        <div className="cookie-banner-icon" aria-hidden>
          <svg className="cookie-banner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5v.01" />
            <path d="M16 15.5v.01" />
            <path d="M12 12v.01" />
            <path d="M11 17v.01" />
            <path d="M7 14v.01" />
          </svg>
        </div>
        <div className="cookie-banner-content">
          <h3 className="cookie-banner-title">Usamos cookies</h3>
          <p className="cookie-banner-text">
            Para mejorar tu experiencia y analizar el uso de la aplicación. Puedes cambiar tu configuración en cualquier momento.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, 'accepted');
            setVisible(false);
          }}
          className="cookie-banner-accept"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
