import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/endpoints'
import { Plus, RefreshCw, Edit2, Trash2, Shield } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserRole } from '@/types'

const ROLE_CLASSES: Record<UserRole, string> = {
  admin: 'badge-error',
  operator: 'badge-warning',
  viewer: 'badge-info',
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  operator: 'Operador',
  viewer: 'Visualizador',
}

function UserModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!user
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    username: user?.username ?? '',
    password: '',
    role: (user?.role ?? 'viewer') as UserRole,
    bio: user?.bio ?? '',
  })

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Ingrese el nombre completo')
      return
    }
    if (!isEdit) {
      if (!form.email.trim() || !form.username.trim() || !form.password.trim()) {
        toast.error('Complete email, usuario y contraseña')
        return
      }
    }

    setSaving(true)
    try {
      if (isEdit && user) {
        await usersApi.update(user.id, {
          full_name: form.full_name.trim(),
          bio: form.bio.trim() || undefined,
        })

        if (form.role !== user.role) {
          await usersApi.updateRole(user.id, form.role)
        }

        toast.success('Usuario actualizado')
      } else {
        await usersApi.create({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          bio: form.bio.trim() || undefined,
        })
        toast.success('Usuario creado')
      }

      await qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Error al guardar usuario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-scrim)', backdropFilter: 'blur(4px)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="card w-full max-w-2xl" style={{ maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
          {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nombre completo *</label>
            <input
              className="input"
              value={form.full_name}
              onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="label">Usuario {!isEdit ? '*' : ''}</label>
            <input
              className="input"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="usuario_demo"
              disabled={isEdit}
              style={isEdit ? { opacity: 0.75, cursor: 'not-allowed' } : {}}
            />
          </div>

          <div>
            <label className="label">Email {!isEdit ? '*' : ''}</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="usuario@demo.com"
              disabled={isEdit}
              style={isEdit ? { opacity: 0.75, cursor: 'not-allowed' } : {}}
            />
          </div>

          {!isEdit && (
            <div>
              <label className="label">Contraseña *</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Min. 8, mayúscula y número"
              />
            </div>
          )}

          <div>
            <label className="label">Rol</label>
            <select
              className="select"
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
            >
              <option value="viewer">Visualizador</option>
              <option value="operator">Operador</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="label">Bio</label>
            <textarea
              className="input"
              rows={2}
              value={form.bio}
              onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="Descripción breve del usuario"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="loader" style={{ width: 14, height: 14 }} /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const { user: me } = useAuth()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | undefined>()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ page_size: 50 }).then((response) => response.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('Usuario eliminado')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'No se pudo eliminar el usuario')
    },
  })

  const canManage = me?.role === 'admin'

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios del Sistema</h1>
          <p className="page-subtitle">Gestión de accesos y roles · {data?.total ?? 0} usuarios</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </button>
          {canManage && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditUser(undefined)
                setShowModal(true)
              }}
            >
              <Plus size={13} /> Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <div className="card mb-5" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Mi Perfil</div>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 48,
              height: 48,
              background: 'var(--avatar-gradient)',
              fontSize: 18,
              fontWeight: 700,
              color: 'white',
            }}
          >
            {me?.full_name?.[0] ?? 'U'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{me?.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{me?.email}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge ${ROLE_CLASSES[me?.role as UserRole]}`}>{ROLE_LABELS[me?.role as UserRole]}</span>
              <span style={{ fontSize: 11, color: 'var(--status-up)' }}>● Activo</span>
              {me?.role === 'admin' && (
                <span className="badge badge-info" style={{ fontSize: 10 }}>
                  <Shield size={10} /> Gestión total
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              {canManage && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={canManage ? 8 : 7} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="flex justify-center"><div className="loader" /></div>
                </td>
              </tr>
            )}

            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={canManage ? 8 : 7}>
                  <div className="empty-state" style={{ padding: '40px 0' }}>
                    Sin usuarios registrados
                  </div>
                </td>
              </tr>
            )}

            {data?.items.map((user) => (
              <tr key={user.id} style={user.id === me?.id ? { background: 'var(--table-row-hover)' } : {}}>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.id}</td>
                <td className="mono" style={{ fontWeight: 600 }}>{user.username}</td>
                <td style={{ fontWeight: 500 }}>
                  {user.full_name}
                  {user.id === me?.id && (
                    <span className="badge badge-info" style={{ marginLeft: 8, fontSize: 10 }}>Tú</span>
                  )}
                </td>
                <td style={{ fontSize: 12 }}>{user.email}</td>
                <td>
                  <span className={`badge ${ROLE_CLASSES[user.role as UserRole]}`}>
                    {ROLE_LABELS[user.role as UserRole] ?? user.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {format(new Date(user.created_at), 'dd/MM/yyyy')}
                </td>
                {canManage && (
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setEditUser(user)
                          setShowModal(true)
                        }}
                        title="Editar usuario"
                      >
                        <Edit2 size={12} />
                      </button>
                      {user.id !== me?.id && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (window.confirm(`¿Eliminar al usuario ${user.username}?`)) {
                              deleteMutation.mutate(user.id)
                            }
                          }}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => {
            setShowModal(false)
            setEditUser(undefined)
          }}
        />
      )}
    </div>
  )
}
