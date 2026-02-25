import demoClusters from '@/data/demoNewsClusters.json';

const firstCluster = demoClusters[0];

export function DemoClusterPage() {
  return (
    <>
      {/* Hero tipo Ground News: copy izquierda + visual derecha */}
      <div className="comparador-layout">
        <section className="comparador-copy" aria-labelledby="comparador-heading">
          <div className="comparador-copy-inner">
            <h1 id="comparador-heading" className="comparador-headline">
              Cada lado de cada historia
            </h1>
            <h2 className="comparador-subhead">
              Compara cómo distintos medios cubren la misma noticia.
            </h2>
            <p className="comparador-desc">
              Agrupamos artículos que hablan del mismo evento y mostramos cuántos medios de cada sesgo lo cubren: izquierda, centro y derecha.
            </p>
            <a href="#panel" className="comparador-cta">
              Ver panel comparativo
            </a>
          </div>
        </section>

        <section className="comparador-visual" aria-hidden>
          <div className="comparador-visual-viewport">
            <div className="comparador-visual-hero-grid" aria-hidden>
              <img
                src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80"
                alt="Periódicos y noticias"
                loading="eager"
                decoding="async"
              />
              <img
                src="https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80"
                alt="Leyendo noticias en tablet"
                loading="eager"
                decoding="async"
              />
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80"
                alt="Persona leyendo noticias"
                loading="eager"
                decoding="async"
              />
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80"
                alt="Persona con smartphone"
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="comparador-visual-fade comparador-visual-fade--top" aria-hidden />
            <div className="comparador-visual-fade comparador-visual-fade--bottom" aria-hidden />
          </div>
        </section>
      </div>

      {/* Listado de clusters */}
      <div id="panel" className="app-page-section">
        <h2 className="comparador-section-title">
          Panel comparativo de cobertura
        </h2>
        {demoClusters.map((cluster) => (
            <section key={cluster.id} className="app-card app-card--spaced">
              {'image' in cluster && (cluster as { image?: string }).image && (
                <div className="comparador-cluster-hero" />
              )}
              <header className="app-card-header">
                <h2 className="app-card-title">
                  {cluster.title}
                </h2>
                <p className="app-card-subtitle app-page-subtitle--tight">
                  {cluster.summary}
                </p>
              </header>
              <CoverageTable clusterId={cluster.id} />
            </section>
          ))}
      </div>
    </>
  );
}

/** Mini tabla del primer cluster para el hero (preview) */
function ComparadorPreview({ clusterId }: { clusterId: string }) {
  const cluster = demoClusters.find((c) => c.id === clusterId);
  if (!cluster) return null;

  const byBias = {
    progressive: cluster.articles.filter((a) => a.sourceBias === 'progressive'),
    centrist: cluster.articles.filter((a) => a.sourceBias === 'centrist'),
    conservative: cluster.articles.filter((a) => a.sourceBias === 'conservative')
  };

  const maxLen = Math.max(
    byBias.progressive.length,
    byBias.centrist.length,
    byBias.conservative.length,
    1
  );

  const rows = Array.from({ length: Math.min(maxLen, 4) });

  return (
    <div className="comparador-preview-table">
      <div className="comparador-preview-table-header">
        <div>Izquierda</div>
        <div className="text-center">Centro</div>
        <div className="text-right">Derecha</div>
      </div>
      <div>
        {rows.map((_, i) => (
          <div key={i} className="comparador-preview-table-row">
            <PreviewCell article={byBias.progressive[i]} side="left" />
            <PreviewCell article={byBias.centrist[i]} side="center" />
            <PreviewCell article={byBias.conservative[i]} side="right" />
          </div>
        ))}
      </div>
    </div>
  );
}

type Article = (typeof demoClusters)[number]['articles'][number] | undefined;

function PreviewCell({
  article,
  side
}: {
  article: Article;
  side: 'left' | 'center' | 'right';
}) {
  if (!article) return <div />;
  return <ArticleCard article={article} side={side} />;
}

function CoverageTable({ clusterId }: { clusterId: string }) {
  const cluster = demoClusters.find((c) => c.id === clusterId);
  if (!cluster) return null;

  const byBias = {
    progressive: cluster.articles.filter((a) => a.sourceBias === 'progressive'),
    centrist: cluster.articles.filter((a) => a.sourceBias === 'centrist'),
    conservative: cluster.articles.filter((a) => a.sourceBias === 'conservative')
  };

  const maxLen = Math.max(
    byBias.progressive.length,
    byBias.centrist.length,
    byBias.conservative.length
  );

  const rows = Array.from({ length: maxLen });

  return (
    <div className="app-comparador-table">
      <div className="app-comparador-table-header">
        <div>Izquierda / Progresista</div>
        <div className="text-center">Centro</div>
        <div className="text-right">Derecha / Conservadora</div>
      </div>
      <div>
        {rows.map((_, i) => (
          <div key={i} className="app-comparador-table-row">
            <Cell article={byBias.progressive[i]} align="left" bias="progressive" />
            <Cell article={byBias.centrist[i]} align="center" bias="centrist" />
            <Cell article={byBias.conservative[i]} align="right" bias="conservative" />
          </div>
        ))}
      </div>
    </div>
  );
}

type ArticleCell = (typeof demoClusters)[number]['articles'][number] | undefined;

function Cell({
  article,
  align,
  bias
}: {
  article: ArticleCell;
  align: 'left' | 'center' | 'right';
  bias: 'progressive' | 'centrist' | 'conservative';
}) {
  if (!article) return <div />;
  const side = align === 'left' ? 'left' : align === 'center' ? 'center' : 'right';
  return <ArticleCard article={article} side={side} />;
}

/** Card con imagen opcional, fuente y titular; enlaza a la noticia. Imágenes desde Unsplash (banco libre). */
function ArticleCard({
  article,
  side
}: {
  article: (typeof demoClusters)[number]['articles'][number];
  side: 'left' | 'center' | 'right';
}) {
  const imageUrl = 'image' in article ? (article as { image?: string }).image : undefined;
  const headlineClass =
    side === 'left'
      ? 'comparador-card__headline comparador-card__headline--left'
      : side === 'center'
        ? 'comparador-card__headline comparador-card__headline--center'
        : 'comparador-card__headline comparador-card__headline--right';

  const cardAlignClass = `comparador-card comparador-card--${side}`;
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className={cardAlignClass}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="comparador-card__image"
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="comparador-card__body">
        <span className="comparador-card__source">{article.sourceName}</span>
        <span className={headlineClass}>{article.headline}</span>
      </div>
    </a>
  );
}
