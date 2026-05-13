/**
 * Subscribers page — CRUD table with search, filters and CSV export.
 */
import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { subscribersApi } from '@/api/endpoints'
import { Plus, Search, Download, RefreshCw, Edit2, Trash2, RadioTower, CloudDownload } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Open5GSSubscriber, Subscriber, SubscriberStatus } from '@/types'
import { useAuth } from '@/hooks/useAuth'

const STATUS_LABELS: Record<SubscriberStatus, string> = {
  active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido', testing: 'Prueba',
}

function StatusBadge({ status }: { status: SubscriberStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status]}</span>
}

function SubscriberModal({ sub, onClose }: { sub?: Subscriber; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    imsi: sub?.imsi ?? '',
    msisdn: sub?.msisdn ?? '',
    iccid: sub?.iccid ?? '',
    full_name: sub?.full_name ?? '',
    email: sub?.email ?? '',
    status: sub?.status ?? 'inactive',
    apn: sub?.apn ?? 'internet',
    sim_type: sub?.sim_type ?? 'usim',
    profile: sub?.profile ?? '',
    notes: sub?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (sub) {
        await subscribersApi.update(sub.id, form)
        toast.success('Suscriptor actualizado')
      } else {
        await subscribersApi.create(form)
        toast.success('Suscriptor creado')
      }
      await qc.invalidateQueries({ queryKey: ['subscribers'] })
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-scrim)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card w-full max-w-xl" style={{ maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
          {sub ? 'Editar Suscriptor' : 'Nuevo Suscriptor'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {!sub && (
            <>
              <div>
                <label className="label">IMSI *</label>
                <input className="input mono" value={form.imsi} onChange={e => setForm(p => ({ ...p, imsi: e.target.value }))} placeholder="716020100000001" />
              </div>
              <div>
                <label className="label">MSISDN *</label>
                <input className="input mono" value={form.msisdn} onChange={e => setForm(p => ({ ...p, msisdn: e.target.value }))} placeholder="51900000001" />
              </div>
              <div>
                <label className="label">ICCID</label>
                <input className="input mono" value={form.iccid} onChange={e => setForm(p => ({ ...p, iccid: e.target.value }))} placeholder="8951..." />
              </div>
            </>
          )}
          <div className={!sub ? '' : 'col-span-2'}>
            <label className="label">Nombre completo *</label>
            <input className="input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="suspended">Suspendido</option>
              <option value="testing">Prueba</option>
            </select>
          </div>
          <div>
            <label className="label">APN</label>
            <input className="input mono" value={form.apn} onChange={e => setForm(p => ({ ...p, apn: e.target.value }))} placeholder="internet" />
          </div>
          <div>
            <label className="label">Tipo SIM</label>
            <select className="select" value={form.sim_type} onChange={e => setForm(p => ({ ...p, sim_type: e.target.value as any }))}>
              <option value="usim">USIM</option>
              <option value="isim">ISIM</option>
              <option value="uicc">UICC</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
          <div>
            <label className="label">Perfil</label>
            <input className="input" value={form.profile} onChange={e => setForm(p => ({ ...p, profile: e.target.value }))} placeholder="volte, data, ims..." />
          </div>
          <div className="col-span-2">
            <label className="label">Notas</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
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

export function SubscribersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSub, setEditSub] = useState<Subscriber | undefined>()
  const [open5gsItems, setOpen5gsItems] = useState<Open5GSSubscriber[] | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscribers', page, search, statusFilter],
    queryFn: () => subscribersApi.list({
      page, page_size: 20,
      search: search || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => subscribersApi.delete(id),
    onSuccess: () => {
      toast.success('Suscriptor eliminado')
      qc.invalidateQueries({ queryKey: ['subscribers'] })
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const loadOpen5GSMut = useMutation({
    mutationFn: () => subscribersApi.listOpen5GS().then(r => r.data),
    onSuccess: (payload) => {
      setOpen5gsItems(payload.items)
      toast.success(`Open5GS conectado: ${payload.count} abonados detectados`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'No se pudo leer Open5GS'),
  })

  const syncOpen5GSMut = useMutation({
    mutationFn: () => subscribersApi.syncOpen5GS().then(r => r.data),
    onSuccess: async (payload) => {
      await qc.invalidateQueries({ queryKey: ['subscribers'] })
      toast.success(`Sync Open5GS: ${payload.created} creados, ${payload.updated} actualizados, ${payload.skipped.length} omitidos`)
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail ?? 'No se pudo sincronizar Open5GS'),
  })

  const handleExport = async () => {
    try {
      const resp = await subscribersApi.exportCsv()
      const url = URL.createObjectURL(new Blob([resp.data]))
      const a = document.createElement('a')
      a.href = url; a.download = 'subscribers.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exportado')
    } catch {
      toast.error('Error al exportar')
    }
  }

  const canEdit = user?.role === 'admin' || user?.role === 'operator'

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suscriptores</h1>
          <p className="page-subtitle">Gestión de abonados · {data?.total ?? 0} registros</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
            <RefreshCw size={13} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>
            <Download size={13} /> Exportar CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => loadOpen5GSMut.mutate()} disabled={loadOpen5GSMut.isPending}>
            <RadioTower size={13} /> Ver Open5GS
          </button>
          {canEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => syncOpen5GSMut.mutate()} disabled={syncOpen5GSMut.isPending}>
              <CloudDownload size={13} /> Sync Open5GS
            </button>
          )}
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditSub(undefined); setShowModal(true) }}>
              <Plus size={13} /> Nuevo
            </button>
          )}
        </div>
      </div>

      {open5gsItems && (
        <div className="card mb-4" style={{ padding: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Open5GS conectado</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {open5gsItems.length} abonados leídos desde WebUI · importación solo con MSISDN válido
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setOpen5gsItems(null)}>Ocultar</button>
          </div>
          <div className="table-wrapper" style={{ maxHeight: 260, overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>IMSI</th>
                  <th>MSISDN</th>
                  <th>Estado Open5GS</th>
                  <th>APNs</th>
                </tr>
              </thead>
              <tbody>
                {open5gsItems.map(item => (
                  <tr key={item.imsi}>
                    <td className="mono">{item.imsi}</td>
                    <td className="mono">{item.msisdn ?? 'sin MSISDN'}</td>
                    <td className="mono">{item.subscriber_status ?? '—'}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{item.apns.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Buscar por IMSI, MSISDN o nombre..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="suspended">Suspendido</option>
          <option value="testing">Prueba</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>IMSI</th>
              <th>MSISDN</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Tipo SIM</th>
              <th>APN</th>
              <th>Perfil</th>
              {canEdit && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                <div className="flex justify-center"><div className="loader" /></div>
              </td></tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={8}>
                <div className="empty-state" style={{ padding: '40px 0' }}>
                  Sin suscriptores registrados
                </div>
              </td></tr>
            )}
            {data?.items.map(sub => (
              <tr key={sub.id}>
                <td className="mono">{sub.imsi}</td>
                <td className="mono">{sub.msisdn}</td>
                <td style={{ fontWeight: 500 }}>{sub.full_name}</td>
                <td><StatusBadge status={sub.status} /></td>
                <td><span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{sub.sim_type}</span></td>
                <td className="mono" style={{ fontSize: 11 }}>{sub.apn}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.profile ?? '—'}</td>
                {canEdit && (
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditSub(sub); setShowModal(true) }}>
                        <Edit2 size={12} />
                      </button>
                      {user?.role === 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          if (window.confirm(`¿Eliminar ${sub.full_name}?`)) deleteMut.mutate(sub.id)
                        }}>
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

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Página {data.page} de {data.pages} · {data.total} registros
          </span>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </div>
      )}

      {showModal && (
        <SubscriberModal sub={editSub} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
