import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Source } from '../../types/source'

type TabId = 'añadir' | 'agregadas' | 'bloqueadas';

export function SourcesAdminPage() {
  const { token } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('añadir');

  const [form, setForm] = useState<Partial<Source>>({
    name: '',
    rssUrl: '',
    websiteUrl: '',
    category: '',
    description: '',
    isActive: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadSources() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/sources-with-status', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Error al cargar fuentes');
      }
      const data = await res.json();
      setSources(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar fuentes');
    } finally {
      setLoading(false);
    }
  }

  const agregadas = sources.filter((s) => s.isActive);
  const bloqueadas = sources.filter(
    (s) => !s.isActive || s.lastError || s.lastFetchStatus === 'error'
  );

  useEffect(() => {
    loadSources();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/sources/${editingId}` : '/api/sources';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al guardar fuente');
      }
      setForm({
        name: '',
        rssUrl: '',
        websiteUrl: '',
        category: '',
        description: '',
        isActive: true
      });
      setEditingId(null);
      await loadSources();
    } catch (e: any) {
      setError(e.message || 'Error al guardar fuente');
    }
  }

  function startEdit(source: Source) {
    setEditingId(source.id);
    setForm({
      name: source.name,
      rssUrl: source.rssUrl,
      websiteUrl: source.websiteUrl || '',
      category: source.category || '',
      description: source.description || '',
      isActive: source.isActive
    });
  }

  async function deleteSource(id: number) {
    if (!window.confirm('¿Eliminar esta fuente?')) return;
    try {
      setError(null);
      const res = await fetch(`/api/sources/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok && res.status !== 204) {
        throw new Error('Error al eliminar fuente');
      }
      await loadSources();
    } catch (e: any) {
      setError(e.message || 'Error al eliminar fuente');
    }
  }

  return (
    <div className="app-page-section">
      <p className="app-page-subtitle app-form-intro">
        Gestiona las fuentes RSS: añade nuevas, revisa las agregadas y las que tienen errores.
      </p>

      <nav className="app-timeline-tabs" role="tablist">
        {[
          { id: 'añadir' as TabId, label: 'Añadir nuevas', count: null },
          { id: 'agregadas' as TabId, label: 'Fuentes agregadas', count: agregadas.length },
          { id: 'bloqueadas' as TabId, label: 'Bloqueadas / Errores', count: bloqueadas.length },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`app-timeline-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
            {count != null && ` (${count})`}
          </button>
        ))}
      </nav>

      {activeTab === 'añadir' && (
      <form onSubmit={handleSubmit} className="app-card app-card--form-spaced">
        <div className="app-grid-3 app-grid-auto">
          <label className="auth-label">
            Nombre
            <input
              className="app-input"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="auth-label">
            RSS URL
            <input
              className="app-input"
              value={form.rssUrl || ''}
              onChange={(e) => setForm({ ...form, rssUrl: e.target.value })}
              required
            />
          </label>
          <label className="auth-label">
            Web
            <input
              className="app-input"
              value={form.websiteUrl || ''}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
            />
          </label>
          <label className="auth-label">
            Categoría
            <input
              className="app-input"
              value={form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </label>
        </div>
        <label className="auth-label auth-label-block">
          Descripción
          <textarea
            className="app-input app-textarea"
            rows={2}
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label className="auth-label auth-label-inline">
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Fuente activa
        </label>

        {error && <p className="auth-error app-message">{error}</p>}

        <button type="submit" className="app-btn-primary app-form-actions">
          {editingId ? 'Guardar cambios' : 'Añadir fuente'}
        </button>
      </form>
      )}

      {activeTab === 'agregadas' && (
      <div className="app-card">
        <h3 className="app-page-title app-page-title--sm">
          Fuentes agregadas
        </h3>
        <input
          className="app-input app-input-search"
          placeholder="Buscar por nombre o URL…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p className="app-page-subtitle app-page-subtitle--tight">Cargando…</p>
        ) : agregadas.length === 0 ? (
          <p className="app-page-subtitle app-page-subtitle--tight">No hay fuentes agregadas.</p>
        ) : (
          <div className="app-list-col">
            {agregadas
              .filter((s) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return (
                  s.name.toLowerCase().includes(q) ||
                  s.rssUrl.toLowerCase().includes(q) ||
                  (s.websiteUrl ?? '').toLowerCase().includes(q) ||
                  (s.category ?? '').toLowerCase().includes(q)
                );
              })
              .map((s) => (
                <div key={s.id} className="app-source-item">
                  <div>
                    <div className="app-page-title app-page-title--xs">{s.name}</div>
                    <div className="app-comparador-cell-source app-word-break">{s.rssUrl}</div>
                    {s.websiteUrl && <div className="app-comparador-cell-source app-word-break">{s.websiteUrl}</div>}
                    {s.category && <div className="app-comparador-cell-source">Categoría: {s.category}</div>}
                  </div>
                  <div className="app-source-actions">
                    <button type="button" onClick={() => { startEdit(s); setActiveTab('añadir'); }} className="app-btn-secondary app-btn-compact">
                      Editar
                    </button>
                    <button type="button" onClick={() => deleteSource(s.id)} className="app-btn-secondary app-btn-compact app-btn-danger">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'bloqueadas' && (
      <div className="app-card">
        <h3 className="app-page-title app-page-title--sm">
          Fuentes bloqueadas o con errores
        </h3>
        <p className="app-card-subtitle app-page-subtitle--tight">
          Fuentes inactivas o que han fallado al cargar (URL incorrecta, timeout, etc.).
        </p>
        {loading ? (
          <p className="app-page-subtitle app-page-subtitle--tight">Cargando…</p>
        ) : bloqueadas.length === 0 ? (
          <p className="app-page-subtitle app-page-subtitle--tight">No hay fuentes bloqueadas ni con errores.</p>
        ) : (
          <div className="app-list-col">
            {bloqueadas.map((s) => (
              <div key={s.id} className="app-source-item">
                <div>
                  <div className="app-page-title app-page-title--xs">
                    {s.name}{' '}
                    {!s.isActive && <span className="auth-error app-error-sm">(bloqueada)</span>}
                    {s.lastError && <span className="auth-error app-error-sm">(error)</span>}
                  </div>
                  <div className="app-comparador-cell-source app-word-break">{s.rssUrl}</div>
                  {s.lastError && (
                    <div className="app-comparador-cell-source auth-error">{s.lastError}</div>
                  )}
                </div>
                <div className="app-source-actions">
                  <button type="button" onClick={() => { startEdit(s); setActiveTab('añadir'); }} className="app-btn-secondary app-btn-compact">
                    Editar
                  </button>
                  <button type="button" onClick={() => deleteSource(s.id)} className="app-btn-secondary app-btn-compact app-btn-danger">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

