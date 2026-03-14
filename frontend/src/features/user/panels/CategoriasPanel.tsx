import { TimelineArticleCard } from '@/components/TimelineArticleCard'
import type { Category } from '@/types/category'
import type { NewsItem } from '@/types/news'

interface CategoriasPanelProps {
  categories: Category[]
  selectedCategory: string | null
  categoryNews: NewsItem[]
  loadingCategories: boolean
  loadingCategoryNews: boolean
  onSelectCategory: (name: string) => void
  onLinkClick: (source: string, link: string) => void
}

export function CategoriasPanel({
  categories,
  selectedCategory,
  categoryNews,
  loadingCategories,
  loadingCategoryNews,
  onSelectCategory,
  onLinkClick,
}: CategoriasPanelProps) {
  return (
    <section
      id="panel-categorias"
      role="tabpanel"
      aria-labelledby="tab-categorias"
      className="app-timeline-panel"
    >
      <h2 className="app-card-title">Categorías</h2>
      {loadingCategories ? (
        <p className="app-muted-inline">Cargando…</p>
      ) : categories.length === 0 ? (
        <p className="app-muted-inline">
          No hay categorías configuradas. El administrador puede crearlas en el panel de Admin.
        </p>
      ) : (
        <div className="app-categories-chips">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`app-category-chip ${selectedCategory === c.name ? 'active' : ''}`}
              onClick={() => onSelectCategory(c.name)}
              title={c.description || undefined}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      {selectedCategory && (
        <>
          <h3 className="app-card-title app-category-news-title">{selectedCategory}</h3>
          {loadingCategoryNews ? (
            <p className="app-muted-inline">Cargando noticias…</p>
          ) : categoryNews.length === 0 ? (
            <p className="app-muted-inline">No hay noticias en esta categoría por ahora.</p>
          ) : (
            <div className="app-flex-col">
              {categoryNews.map((item, idx) => (
                <TimelineArticleCard
                  key={`${item.link}-${idx}`}
                  item={item}
                  onLinkClick={() => onLinkClick(item.source, item.link)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
