import { ReactNode } from 'react';

type BasePageProps = {
  children: ReactNode;
  /** Centrar contenido (p. ej. login, registro) */
  centered?: boolean;
  /** Título de la página (h1) */
  title?: string;
  /** Subtítulo o descripción bajo el título */
  subtitle?: string;
  /** Clases adicionales para el contenedor */
  className?: string;
};

/**
 * Plantilla base para las páginas de la app.
 * Usa el mismo sistema de diseño que la landing moderna:
 * variables CSS (--text-primary, --surface-alt, etc.), espaciado (--space-*),
 * botones (.app-btn-primary, .app-btn-secondary), cards (.app-card), inputs (.app-input).
 *
 * Uso:
 * - Página centrada (login, registro): <BasePage centered title="..." subtitle="...">...</BasePage>
 * - Página con contenido ancho: <BasePage title="..."><section className="app-page-section">...</section></BasePage>
 */
export function BasePage({ children, centered, title, subtitle, className = '' }: BasePageProps) {
  const pageClass = ['app-page', centered ? 'app-page--centered' : '', className].filter(Boolean).join(' ');

  return (
    <div className={pageClass}>
      {title && <h1 className="app-page-title">{title}</h1>}
      {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
