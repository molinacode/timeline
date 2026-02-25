import data from '@/data/groundNewsDemo.json';
import { BasePage } from '@/components/layout/BasePage';

type Story = (typeof data.stories)[number];
type Article = Story['articles'][number];

export function TimelineBiasPage() {
  return (
    <BasePage
      title="Comparador TimeLine de cobertura por sesgo"
      subtitle="Para cada historia, comparamos cómo la cubren medios de izquierda, centro y derecha usando un JSON de demostración."
    >
      <div className="app-page-section">
        {data.stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </BasePage>
  );
}

function StoryCard({ story }: { story: Story }) {
  const counts = {
    left: story.articles.filter((a) => a.bias === 'left').length,
    center: story.articles.filter((a) => a.bias === 'center').length,
    right: story.articles.filter((a) => a.bias === 'right').length
  };
  const total = counts.left + counts.center + counts.right || 1;

  return (
    <section className="app-card app-card--spaced">
      <header className="app-card-header">
        <h2 className="app-card-title">
          {story.title}
        </h2>
        <p className="app-card-subtitle app-page-subtitle--tight">
          {story.summary}
        </p>
        <p className="app-page-label app-page-label--normal">
          Tema: {story.topic} · Región: {story.region}
        </p>
      </header>

      <div className="coverage-bar-wrap">
        <div className="coverage-bars">
          <div
            className="coverage-bar-segment coverage-bar-segment--mint"
            style={{ width: `${(counts.left / total) * 100}%` }}
          />
          <div
            className="coverage-bar-segment coverage-bar-segment--cerulean"
            style={{ width: `${(counts.center / total) * 100}%` }}
          />
          <div
            className="coverage-bar-segment coverage-bar-segment--crimson"
            style={{ width: `${(counts.right / total) * 100}%` }}
          />
        </div>
        <div className="app-comparador-cell-source app-bar-legend">
          <span>Izquierda ({counts.left})</span>
          <span>Centro ({counts.center})</span>
          <span>Derecha ({counts.right})</span>
        </div>
      </div>

      <CoverageGrid articles={story.articles} />
    </section>
  );
}

function CoverageGrid({ articles }: { articles: Article[] }) {
  const byBias = {
    left: articles.filter((a) => a.bias === 'left'),
    center: articles.filter((a) => a.bias === 'center'),
    right: articles.filter((a) => a.bias === 'right')
  };

  const maxLen = Math.max(
    byBias.left.length,
    byBias.center.length,
    byBias.right.length
  );

  const rows = Array.from({ length: maxLen });

  return (
    <div className="app-comparador-table">
      <div className="app-comparador-table-header">
        <div>Izquierda</div>
        <div className="text-center">Centro</div>
        <div className="text-right">Derecha</div>
      </div>
      <div>
        {rows.map((_, idx) => (
          <div key={idx} className="app-comparador-table-row">
            <Cell article={byBias.left[idx]} align="left" colorClass="bias-badge-progressive" />
            <Cell article={byBias.center[idx]} align="center" colorClass="bias-badge-centrist" />
            <Cell article={byBias.right[idx]} align="right" colorClass="bias-badge-conservative" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  article,
  align,
  colorClass
}: {
  article?: Article;
  align: 'left' | 'center' | 'right';
  colorClass: string;
}) {
  if (!article) return <div />;

  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={alignClass}>
      <div className="app-comparador-cell-source">{article.sourceName}</div>
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className={`app-bias-link ${colorClass}`}
      >
        {article.headline}
      </a>
    </div>
  );
}
