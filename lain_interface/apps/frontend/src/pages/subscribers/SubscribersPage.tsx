/**
 * Subscribers page — CRUD table with search, filters and CSV export.
 */
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { subscribersApi } from '@/api/endpoints'
import { Plus, Search, Download, RefreshCw, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Subscriber, SubscriberStatus } from '@/types'
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
    status: sub?.status ?? 'inactive',
    apn: sub?.apn ?? 'internet',
    service_profile: 'internet_ims',
    ki: '',
    opc: '',
    amf: '8000',
  })
  const [saving, setSaving] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const configPreview = `POST /api/db/Subscriber

IMSI: ${form.imsi || '<IMSI>'}
MSISDN: ${form.msisdn || '<MSISDN>'}
Ki: ${form.ki || '<KI>'}
OPc: ${form.opc || '<OPC>'}
AMF: ${form.amf || '8000'}
Perfil: ${form.service_profile === 'internet_ims' ? 'Internet + IMS/VoLTE' : 'Solo Internet'}

Perfil aplicado:
- APN internet: type 3, QCI 9${form.service_profile === 'internet_ims' ? '\n- APN ims: type 3, QCI 5\n- PCC IMS: QCI 1 y QCI 2' : ''}
- subscriber_status: 0
- operator_determined_barring: 2`

  const handleSave = async () => {
    if (!sub) {
      if (!/^\d{15}$/.test(form.imsi)) return toast.error('IMSI debe tener 15 dígitos')
      if (!/^\+?\d{4,15}$/.test(form.msisdn)) return toast.error('MSISDN inválido')
      if (!/^[0-9A-Fa-f]{32}$/.test(form.ki)) return toast.error('Ki debe tener 32 caracteres HEX')
      if (!/^[0-9A-Fa-f]{32}$/.test(form.opc)) return toast.error('OPc debe tener 32 caracteres HEX')
      if (!/^[0-9A-Fa-f]{4}$/.test(form.amf)) return toast.error('AMF debe tener 4 caracteres HEX')
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        iccid: form.iccid || undefined,
      }
      if (sub) {
        await subscribersApi.update(sub.id, payload)
        toast.success('Suscriptor actualizado')
      } else {
        await subscribersApi.create(payload)
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

  const modalContent = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999,
        backdropFilter: 'blur(4px)',
        padding: 16,
        boxSizing: 'border-box',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 28,
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
          {sub ? 'Editar Suscriptor' : 'Nuevo Suscriptor'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {!sub && (
            <>
              <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Alta directa en Open5GS con perfil LTE/IMS/VoLTE del laboratorio. Completa solo los datos propios de la SIM.
              </div>
              <div>
                <label className="label">IMSI *</label>
                <input className="input mono" value={form.imsi} onChange={e => setForm(p => ({ ...p, imsi: e.target.value }))} placeholder="716020100000001" />
              </div>
              <div>
                <label className="label">MSISDN *</label>
                <input className="input mono" value={form.msisdn} onChange={e => setForm(p => ({ ...p, msisdn: e.target.value }))} placeholder="10005 o 51900000001" />
              </div>
              <div>
                <label className="label">Ki *</label>
                <input className="input mono" value={form.ki} onChange={e => setForm(p => ({ ...p, ki: e.target.value.toUpperCase() }))} placeholder="5BAD8598D1F631E3ED76F9333B8AA26F" />
              </div>
              <div>
                <label className="label">OPc *</label>
                <input className="input mono" value={form.opc} onChange={e => setForm(p => ({ ...p, opc: e.target.value.toUpperCase() }))} placeholder="BA5205DDC6FCA1DF6B83A1CC69859514" />
              </div>
              <div>
                <label className="label">AMF *</label>
                <input className="input mono" value={form.amf} onChange={e => setForm(p => ({ ...p, amf: e.target.value.toUpperCase() }))} placeholder="8000" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Perfil de servicio *</label>
                <select className="select" value={form.service_profile} onChange={e => setForm(p => ({ ...p, service_profile: e.target.value }))}>
                  <option value="internet_ims">Internet + IMS / VoLTE</option>
                  <option value="internet">Solo Internet</option>
                </select>
              </div>
            </>
          )}
          {sub && (
            <>
              <div>
                <label className="label">MSISDN</label>
                <input className="input mono" value={form.msisdn} onChange={e => setForm(p => ({ ...p, msisdn: e.target.value }))} />
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
            </>
          )}
        </div>
        {!sub && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowConfig(p => !p)}>
              {showConfig ? 'Ocultar config' : 'Ver config Open5GS'}
            </button>
            {showConfig && (
              <pre className="mono mt-3" style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                color: 'var(--text-secondary)',
                fontSize: 11,
                lineHeight: 1.5,
                maxHeight: 320,
                overflow: 'auto',
                padding: 14,
                whiteSpace: 'pre-wrap',
              }}>
                {configPreview}
              </pre>
            )}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="loader" style={{ width: 14, height: 14 }} /> : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export function SubscribersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editSub, setEditSub] = useState<Subscriber | undefined>()

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
          
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditSub(undefined); setShowModal(true) }}>
              <Plus size={13} /> Nuevo
            </button>
          )}
        </div>
      </div>

      
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