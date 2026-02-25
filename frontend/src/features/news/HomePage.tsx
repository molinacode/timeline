import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <>
      {/* Hero: fuera del article para que ocupe todo el ancho de main/viewport */}
      <section
        className="home-hero-modern"
        aria-labelledby="hero-heading"
      >
        <div className="home-hero-modern-inner">
          <h1
            id="hero-heading"
            className="home-hero-modern-title"
          >
            Entiende el sesgo de las noticias
          </h1>
          <p className="home-hero-modern-subtitle">
            Compara cómo distintos medios cubren la misma historia.<br/> <strong>TimeLine te lo muestra todo.</strong>
          </p>
          <div className="home-hero-modern-visual" aria-hidden>
            <span className="home-bias-bar home-bias-bar--hero" />
          </div>
          <div className="home-hero-modern-ctas">
            <Link
              to="/register"
              className="home-hero-modern-cta-primary"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to="/login"
              className="home-hero-modern-cta-secondary"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      <article className="home home--modern">
      {/* Features: una fila, icono + título + una línea (GasBuddy / Notion: breve y directo) */}
      <section
        className="home-features-modern"
        aria-labelledby="features-heading"
      >
        <h2 id="features-heading" className="home-features-modern-heading">
          En un vistazo
        </h2>
        <div className="home-features-modern-grid">
          <div className="home-feature-modern home-feature-modern--cerulean">
            <span className="home-feature-modern-icon" aria-hidden>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </span>
            <h3 className="home-feature-modern-title">Noticias en tiempo real</h3>
            <p className="home-feature-modern-desc">Últimas noticias agregadas, filtradas por fuentes y categorías.</p>
          </div>
          <div className="home-feature-modern home-feature-modern--mint">
            <span className="home-feature-modern-icon" aria-hidden>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </span>
            <h3 className="home-feature-modern-title">Comparador de sesgo</h3>
            <p className="home-feature-modern-desc">Visualiza la cobertura por sesgo político en un solo lugar.</p>
          </div>
          <div className="home-feature-modern home-feature-modern--crimson">
            <span className="home-feature-modern-icon" aria-hidden>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <h3 className="home-feature-modern-title">Tu timeline, tus fuentes</h3>
            <p className="home-feature-modern-desc">Configura fuentes RSS y categorías.</p>
          </div>
        </div>
      </section>

      {/* CTA final: un solo camino a la conversión */}
      <section className="home-cta-modern" aria-labelledby="cta-final-heading">
        <h2 id="cta-final-heading" className="sr-only">
          Empieza ahora
        </h2>
        <p className="home-cta-modern-text">Listo para ver las noticias con otros ojos.</p>
        <Link to="/register" className="home-hero-modern-cta-primary home-cta-modern-button">
          Crear cuenta gratis
        </Link>
      </section>

      {/* Footer minimal */}
      <footer className="home-footer-modern">
        <nav className="home-footer-modern-nav" aria-label="Enlaces">
          <a href="#" className="home-footer-modern-link">Twitter</a>
          <a href="#" className="home-footer-modern-link">GitHub</a>
          <a href="#" className="home-footer-modern-link">Aviso legal</a>
          <a href="#" className="home-footer-modern-link">Privacidad</a>
        </nav>
        <p className="home-footer-modern-copy">© {new Date().getFullYear()} TimeLine</p>
      </footer>
      </article>
    </>
  );
}
