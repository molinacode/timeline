import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import type { Category } from '../../types/category'

export function CategoriesAdminPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<Partial<Category>>({
    name: '',
    icon: '',
    color: '',
    description: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/categories', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('Error al cargar categorías');
      }
      const data = await res.json();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError(null);
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
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
        throw new Error(data.message || 'Error al guardar categoría');
      }
      setForm({ name: '', icon: '', color: '', description: '' });
      setEditingId(null);
      await loadCategories();
    } catch (e: any) {
      setError(e.message || 'Error al guardar categoría');
    }
  }

  async function deleteCategory(id: number) {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      setError(null);
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok && res.status !== 204) {
        throw new Error('Error al eliminar categoría');
      }
      await loadCategories();
    } catch (e: any) {
      setError(e.message || 'Error al eliminar categoría');
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setForm({
      name: c.name,
      icon: c.icon || '',
      color: c.color || '',
      description: c.description || ''
    });
  }

  async function seedDefaultCategories() {
    try {
      setError(null);
      const res = await fetch('/api/admin/categories/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('Error al crear categorías');
      const data = await res.json();
      await loadCategories();
      setError(null);
      alert(data.message || 'Categorías creadas.');
    } catch (e: any) {
      setError(e.message || 'Error');
    }
  }

  return (
    <div className="app-page-section">
      <p className="app-page-subtitle app-form-intro">
        Gestiona las categorías que ven los usuarios en Mi TimeLine (Viajes, Tecnología, Deporte, etc.). Crea, modifica o elimina.
      </p>

      <p className="app-comparador-cell-source app-form-intro">
        Total categorías: {categories.length}
        {categories.length === 0 && (
          <span className="app-inline-btn-wrap">
            <button type="button" onClick={seedDefaultCategories} className="app-btn-secondary app-btn-compact">
              Crear categorías por defecto
            </button>
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="app-card app-card--form-spaced">
        <div className="app-grid-3 app-grid-auto--narrow">
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
            Icono (emoji o clase)
            <input
              className="app-input"
              value={form.icon || ''}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            />
          </label>
          <label className="auth-label">
            Color (hex)
            <input
              className="app-input"
              value={form.color || ''}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
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
        {error && <p className="auth-error app-message">{error}</p>}
        <button type="submit" className="app-btn-primary app-form-actions">
          {editingId ? 'Guardar cambios' : 'Añadir categoría'}
        </button>
      </form>

      <div className="app-card">
        <h3 className="app-page-title app-page-title--sm">
          Categorías existentes
        </h3>
        <input
          className="app-input app-select-width"
          placeholder="Buscar por nombre o descripción…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <p className="app-page-subtitle app-page-subtitle--tight">Cargando…</p>
        ) : categories.length === 0 ? (
          <p className="app-page-subtitle app-page-subtitle--tight">No hay categorías configuradas todavía.</p>
        ) : (
          <div className="app-list-col">
            {categories
              .filter((c) => {
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                return c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
              })
              .map((c) => (
                <div key={c.id} className="app-source-item">
                  <div>
                    <div className="app-page-title app-page-title--xs-flex">
                      {c.icon && <span>{c.icon}</span>}
                      <span>{c.name}</span>
                      {c.color && <span className="app-color-dot" style={{ backgroundColor: c.color }} />}
                    </div>
                    {c.description && <div className="app-comparador-cell-source">{c.description}</div>}
                  </div>
                  <div className="app-source-actions">
                    <button type="button" onClick={() => startEdit(c)} className="app-btn-secondary app-btn-compact">
                      Editar
                    </button>
                    <button type="button" onClick={() => deleteCategory(c.id)} className="app-btn-secondary app-btn-compact app-btn-danger">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

