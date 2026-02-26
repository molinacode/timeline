import { useEffect, useState } from 'react'
import { useAuth } from '../../app/providers/AuthProvider'
import { BasePage } from '../../components/layout/BasePage'
import { apiUrl } from '@/config/api'

type UserItem = {
  id: number
  email: string
  name: string
  region: string | null
  role: string
  is_active: number
  created_at: string
  last_login: string | null
  is_connected: boolean
  has_accepted_terms?: boolean
}

export function AdminUsersPage() {
  const { token, user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await fetch(apiUrl('/api/admin/users'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setUsers(json)
      }
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleBlock(u: UserItem) {
    if (String(u.id) === currentUser?.id) return
    setActionLoading(u.id)
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: u.is_active ? 0 : 1 }),
      })
      if (res.ok) await loadUsers()
      else {
        const err = await res.json()
        alert(err.message || 'Error al actualizar')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function changeRole(u: UserItem) {
    if (String(u.id) === currentUser?.id) return
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`¿Cambiar rol de ${u.email} a ${newRole}?`)) return
    setActionLoading(u.id)
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}/role`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) await loadUsers()
      else {
        const err = await res.json()
        alert(err.message || 'Error al actualizar')
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteUser(u: UserItem) {
    if (String(u.id) === currentUser?.id) return
    if (
      !confirm(
        `¿Eliminar definitivamente a ${u.email}? Esta acción no se puede deshacer.`
      )
    )
      return
    setActionLoading(u.id)
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${u.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) await loadUsers()
      else {
        const err = await res.json()
        alert(err.message || 'Error al eliminar')
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <BasePage
        title="Usuarios"
        subtitle="Gestiona los usuarios de la aplicación"
      >
        <p>Cargando usuarios…</p>
      </BasePage>
    )
  }

  return (
    <BasePage
      title="Usuarios"
      subtitle="Lista de usuarios, conexiones, roles y estado"
    >
      <div className="app-page-section">
        <div className="app-users-table-wrapper">
          <table className="app-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Región</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acuerdo uso</th>
                <th>Conectado</th>
                <th>Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay usuarios</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.region || '-'}</td>
                    <td>
                      <span
                        className={`app-role-badge app-role-badge--${u.role}`}
                      >
                        {u.role}
                      </span>
                    </td>
                  <td>
                      <span
                        className={`app-status-badge app-status-badge--${
                          u.is_active ? 'ok' : 'error'
                        }`}
                      >
                        {u.is_active ? 'Activo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`app-status-badge app-status-badge--${
                          u.has_accepted_terms ? 'ok' : 'error'
                        }`}
                      >
                        {u.has_accepted_terms ? 'Aceptado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>{u.is_connected ? 'Sí' : 'No'}</td>
                    <td>
                      {new Date(u.created_at).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      <div className="app-user-actions">
                        {String(u.id) !== currentUser?.id && (
                          <>
                            <button
                              type="button"
                              className="app-button app-button--sm"
                              onClick={() => toggleBlock(u)}
                              disabled={!!actionLoading}
                              title={u.is_active ? 'Bloquear' : 'Activar'}
                            >
                              {u.is_active ? 'Bloquear' : 'Activar'}
                            </button>
                            <button
                              type="button"
                              className="app-button app-button--sm"
                              onClick={() => changeRole(u)}
                              disabled={!!actionLoading}
                              title="Cambiar rol"
                            >
                              Rol → {u.role === 'admin' ? 'user' : 'admin'}
                            </button>
                            <button
                              type="button"
                              className="app-button app-button--sm app-button--danger"
                              onClick={() => deleteUser(u)}
                              disabled={!!actionLoading}
                              title="Eliminar"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BasePage>
  )
}
