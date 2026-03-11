## Ideas de UX móvil basadas en apps de referencia

Fuentes de inspiración principales:
- Bluesky (captura header / tabs).
- Squid (capturas de portada, categorías y lector).
- Ground News (sesgos, distribución de fuentes, vistas bias).
- Flipboard (categorías en carrusel, cards tipo revista, swipe).

### 1. Header móvil

- **Estructura general**:
  - Menú hamburguesa a la izquierda.
  - Logo de TimeLine centrado (solo marca, sin texto largo).
  - Iconos de acciones a la derecha (p. ej. búsqueda, ajustes, perfil).
- **Estado autenticado**:
  - Mostrar email/identidad en un sitio discreto (no saturar header).
  - Mantener botón de cambio de tema (modo claro/oscuro) accesible.

### 2. Tabs / categorías bajo el header

- **Bluesky-style**:
  - Barra horizontal justo debajo del header con pestañas tipo:
    - Following / Discover / ... (en nuestro caso: `Timeline`, `Comparador`, `Guardadas`, `Fuentes`, etc.).
  - Indicador visual de pestaña activa (subrayado o barra fina).
  - Scroll horizontal cuando haya muchas pestañas.
- **Squid-style**:
  - Segunda línea de navegación con categorías temáticas:
    - “Top News, Deportes, Tecnología…” equivalentes a nuestras categorías especiales.
  - Estas tabs filtran el contenido visible del timeline.

### 3. Timeline y tarjetas de noticia

- **Tarjetas tipo Squid**:
  - Imagen grande ocupando todo el ancho de la tarjeta.
  - Título superpuesto o en bloque inmediatamente debajo.
  - Etiqueta de categoría en la esquina (pill de color).
- **Detalles a incorporar**:
  - Fuente + tiempo (ej. “El País · hace 2 min”).
  - Acción rápida (guardar, compartir) visible pero discreta.
  - Espaciado generoso entre tarjetas para legibilidad en móvil.

### 4. Footer / navegación inferior

- **Bottom nav tipo app nativa**:
  - Barra fija en la parte inferior con 3–5 iconos:
    - Inicio / Timeline.
    - Buscar / Explorar.
    - Categorías / Sesgos.
    - Guardadas.
    - Perfil / Ajustes (opcional).
  - Icono activo resaltado (color y/o fondo).
  - Ocultar en escritorio; visible solo en anchos móviles/tablet.

### 5. Pantalla de selección de intereses (onboarding)

- **Squid-style “¿Qué te interesa?”**:
  - Vista con grid de chips de categorías:
    - Noticias destacadas, Política, Deporte, Tecnología, etc.
  - Chips con colores diferenciados para categorías especiales.
  - Botón “Continuar” abajo tras seleccionar intereses.
  - Se puede reutilizar nuestra tabla `source_categories` + `is_special`.

### 6. Vista de noticia con navegador integrado / lector

- **Webview integrada**:
  - Al abrir una noticia desde el timeline/comparador:
    - Mostrarla dentro de la app en una vista tipo navegador.
    - Barra superior con:
      - Botón “Cerrar / Volver”.
      - Título corto de la noticia o dominio (ej. `elpais.com`).
      - Toggle “Web / Lector”.
- **Modo Web**:
  - Iframe o `window.open` en pestaña interna con la web original.
  - Advertencia pequeña si se abandona TimeLine.
- **Modo Lector (formato básico)**:
  - Layout simplificado:
    - Imagen principal (si existe).
    - Título.
    - Fuente y fecha.
    - Texto limpio (sin JS, anuncios ni scripts externos).
  - Idealmente usando contenido que traemos vía RSS (cuando el feed trae el texto).
  - Tipografía cómoda, ancho de línea limitado, modo oscuro/claro coherente.

### 7. Priorización (propuesta)

1. **Navegación móvil**:
   - Tabs bajo el header para secciones principales.
   - Footer con bottom nav minimal.
2. **Tarjetas de noticia**:
   - Ajustar diseño de tarjetas del timeline para parecerse más a Squid (imagen grande + categoría + título).
3. **Onboarding de intereses**:
   - Pantalla simple de selección de categorías con chips.
4. **Vista lector integrada**:
   - Primero un “abrir en modo lector” básico solo con título, fuente, fecha, imagen y descripción.
   - Más adelante, enriquecer con contenido completo si el feed lo permite.

### 8. Visualizaciones de sesgo (inspiración Ground News)

- **Distribución de bias por fuentes**:
  - Bloque tipo “Bias Distribution” con barras apiladas:
    - Segmentos Left / Center / Right con porcentajes (ej. L 37%, C 27%, R 36%).
  - Debajo, carrusel/row de **logos de medios** agrupados por sesgo:
    - Fondo ovalado oscuro, logos alineados en columna central.
    - Sección extra de “Untracked bias” con logos sin clasificar.
  - Uso en TimeLine:
    - En la página de comparador o en una sección “Mi sesgo de fuentes”.

- **Tarjetas de noticia con barras de cobertura**:
  - Cada historia muestra:
    - Imagen grande.
    - Título y subtítulo.
    - Debajo, barras horizontales finas:
      - `% Left`, `% Center`, `% Right` de cobertura de la noticia.
    - Texto tipo “44% Left coverage · 9 sources”.
  - Uso en TimeLine:
    - Para cada grupo del comparador, mostrar resumen de distribución de sesgos de las fuentes que cubren esa historia.

- **Tabs específicas por sesgo**:
  - Controles tipo:
    - “All / For the Left / For the Right”.
  - Permiten filtrar rápidamente historias relevantes para un lado del espectro.
  - Uso en TimeLine:
    - En el comparador o una sección “Blindspots” donde mostramos noticias poco cubiertas por un sesgo concreto.

### 9. Flipboard: categorías y cards tipo revista

- **Categorías en carrusel**:
  - Barra horizontal de categorías (chips) en la parte superior:
    - “Para ti, Grandes ideas, Belleza, Tecnología, Deportes…”
  - Scroll horizontal (swipe derecha/izquierda) para cambiar de categoría.
  - Pestaña activa con subrayado o color destacado.
  - Uso en TimeLine:
    - Carrusel de categorías encima del timeline, conectado con nuestras `source_categories` (incluyendo especiales).

- **Cards de noticia con header y footer**:
  - Card vertical con:
    - Header:
      - Fuente / colección donde aparece.
      - Icono de menú/acciones.
    - Cuerpo:
      - Imagen principal grande.
      - Título y breve descripción.
    - Footer:
      - Texto relativo “Hace X horas / días” (no hora exacta).
      - Contadores (likes, guardados, comentarios) o acciones.
  - Uso en TimeLine:
    - Rediseñar `TimelineArticleCard` y tarjetas del comparador para que tengan header (fuente/categoría) y footer (fecha relativa + acciones).

- **Interacciones de swipe tipo revista**:
  - Swipe vertical:
    - Efecto visual de “pasar página” al cambiar de noticia.
  - Swipe horizontal:
    - Cambiar entre categorías o colecciones (secciones).
  - Uso en TimeLine (futuro):
    - Primero, estructura básica sin animaciones complejas.
    - Más adelante, valorar transiciones suaves entre noticias/categorías en móvil.

- **Navegador integrado al abrir noticia**:
  - Igual que Squid:
    - Al pulsar en una card, abrir la noticia en un navegador dentro de la app.
    - Mantener control de cierre y, si es posible, ofrecer también “modo lector”.

### 10. Buscador de noticias y contenido

- **Alcance de la búsqueda**:
  - Noticias (título, descripción, contenido cuando esté disponible).
  - Categorías / etiquetas especiales (23F, DANA, etc.).
  - Fuentes (nombre del medio).
  - Posibilidad futura de buscar por región o tema (“EEUU”, “clima”, “economía”).

- **Ubicación y UI**:
  - Icono de búsqueda en el header (especialmente en móvil), que abre:
    - Un campo de búsqueda a pantalla casi completa, o
    - Un panel deslizante desde arriba.
  - En escritorio, barra de búsqueda visible en la parte superior del timeline y del comparador.

- **Comportamiento**:
  - Búsqueda por palabra clave o frase.
  - Sugerencias mientras se escribe:
    - Términos populares.
    - Categorías coincidentes.
    - Fuentes coincidentes.
  - Filtros básicos:
    - Rango de fechas (hoy, última semana, último mes).
    - Sesgo (Left / Center / Right).
    - Tipo de contenido (Noticias, Guardadas).

- **Integración técnica (idea inicial)**:
  - Endpoint backend `/api/search` que acepte:
    - `q` (texto buscado).
    - Filtros (fecha, sesgo, categoría).
  - En móvil, mostrar resultados en una lista de tarjetas tipo timeline.

