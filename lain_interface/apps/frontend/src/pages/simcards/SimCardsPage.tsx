import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { simCardsApi } from '@/api/endpoints'
import { Search, Plus, RefreshCw } from 'lucide-react'
import type { SimStatus } from '@/types'

const SIM_STATUS_LABELS: Record<SimStatus, string> = {
  available: 'Disponible', assigned: 'Asignada', blocked: 'Bloqueada', testing: 'Prueba', retired: 'Retirada',
}

const SIM_STATUS_CLASSES: Record<SimStatus, string> = {
  available: 'badge-active', assigned: 'badge-info', blocked: 'badge-error',
  testing: 'badge-testing', retired: 'badge-inactive',
}

export function SimCardsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sim-cards', page, statusFilter],
    queryFn: () => simCardsApi.list({ page, page_size: 20, status: statusFilter || undefined }).then(r => r.data),
  })

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">SIM Cards</h1>
          <p className="page-subtitle">Catálogo de SIMs · USIM · ISIM · {data?.total ?? 0} registros</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={13} /></button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Buscar por ICCID, IMSI..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 170 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="available">Disponible</option>
          <option value="assigned">Asignada</option>
          <option value="blocked">Bloqueada</option>
          <option value="testing">Prueba</option>
          <option value="retired">Retirada</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ICCID</th>
              <th>IMSI</th>
              <th>MSISDN</th>
              <th>Tipo</th>
              <th>Fabricante</th>
              <th>Lote</th>
              <th>AMF</th>
              <th>Estado</th>
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
                <div className="empty-state" style={{ padding: '40px 0' }}>Sin SIM cards registradas</div>
              </td></tr>
            )}
            {data?.items.map(sim => (
              <tr key={sim.id}>
                <td className="mono">{sim.iccid}</td>
                <td className="mono" style={{ fontSize: 11 }}>{sim.imsi ?? '—'}</td>
                <td className="mono" style={{ fontSize: 11 }}>{sim.msisdn ?? '—'}</td>
                <td><span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>{sim.sim_type}</span></td>
                <td style={{ fontSize: 12 }}>{sim.manufacturer ?? '—'}</td>
                <td className="mono" style={{ fontSize: 11 }}>{sim.batch_id ?? '—'}</td>
                <td className="mono" style={{ fontSize: 11 }}>{sim.amf ?? '—'}</td>
                <td>
                  <span className={`badge ${SIM_STATUS_CLASSES[sim.status as SimStatus]}`}>
                    {SIM_STATUS_LABELS[sim.status as SimStatus] ?? sim.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Página {data.page} de {data.pages}</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </div>
      )}
    </div>
  )
}
