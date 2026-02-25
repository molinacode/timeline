# Plantilla base y sistema de diseño — TimeLine

Mismo estilo que la landing moderna: coherente en modo claro y oscuro.

## Variables CSS (tokens)

### Layout (siempre disponibles)
| Variable | Uso |
|----------|-----|
| `--font-heading` | Aleo, títulos |
| `--font-body` | Open Sans, cuerpo |
| `--page-max-width` | 56rem, ancho máximo del contenido |
| `--page-padding-x` | 1.5rem, padding horizontal |
| `--space-xs` … `--space-3xl` | Espaciado (0.25rem … 4rem) |
| `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` | Bordes redondeados |

### Tema (cambian con modo claro/oscuro)
| Variable | Uso |
|----------|-----|
| `--bg-body`, `--fg-body` | Fondo y texto principal |
| `--surface`, `--surface-alt`, `--surface-elevated` | Fondos de bloques |
| `--border`, `--border-strong` | Bordes |
| `--text-primary`, `--text-secondary`, `--text-muted` | Texto |
| `--accent-cerulean`, `--accent-mint`, `--accent-crimson` | Acentos (y `-soft` para fondos) |
| `--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover` | Botón primario |
| `--btn-secondary-*` | Botón secundario |
| `--shadow-sm`, `--shadow-md` | Sombras |

## Clases de la plantilla base

| Clase | Uso |
|-------|-----|
| `.app-page` | Contenedor de página (max-width + margen) |
| `.app-page--centered` | Página centrada (login, registro) |
| `.app-page-section` | Sección con padding y borde superior |
| `.app-page-title` | Título h1 de página |
| `.app-page-subtitle` | Subtítulo bajo el título |
| `.app-page-label` | Etiqueta (uppercase, letter-spacing) |
| `.app-card` | Bloque tipo card (surface-alt, borde, radius) |
| `.app-card--form` | Card para formularios (max-width 24rem) |
| `.app-btn-primary` | Botón primario (verde/mint) |
| `.app-btn-secondary` | Botón secundario (borde) |
| `.app-input` | Campo de texto (surface, borde, focus cerulean) |
| `.app-divider` | Línea separadora |
| `.app-grid-3` | Grid 1 col móvil / 3 cols desktop |
| `.app-comparador-table`, `.app-comparador-table-header`, `.app-comparador-table-row`, `.app-comparador-cell-source` | Tabla comparador de cobertura |
| `.app-nav-pills` | Nav de píldoras (admin: Fuentes, Categorías, Métricas) |
| `.app-table-wrap`, `.app-table` | Tabla con variables de tema |
| `.user-timeline-img` | Imagen en UserTimeline (oculta en móvil) |

## Componente BasePage

```tsx
import { BasePage } from '../components/layout/BasePage';

// Página centrada (login, registro)
<BasePage centered title="Iniciar sesión" subtitle="Introduce tus credenciales.">
  <form>...</form>
</BasePage>

// Página con secciones
<BasePage title="Mi TimeLine">
  <section className="app-page-section">...</section>
</BasePage>
```

## Estructura del layout

- **Layout**: header (`.app-header`) + main (`.app-main`).
- **app-main**: ya tiene `max-width: var(--page-max-width)` y padding; el contenido hijo puede usar `.app-page` para mantener el mismo ancho o dejarlo fluir.

## Ejemplo: formulario de login

```tsx
<BasePage centered title="Iniciar sesión" subtitle="Accede a tu TimeLine.">
  <div className="app-card" style={{ width: '100%', maxWidth: '24rem' }}>
    <form className="auth-form">
      <label className="auth-label">
        Correo
        <input type="email" className="app-input" />
      </label>
      <button type="submit" className="app-btn-primary">Entrar</button>
    </form>
  </div>
</BasePage>
```
