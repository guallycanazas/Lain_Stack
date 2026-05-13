import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { callsApi } from '@/api/endpoints'
import { PhoneIncoming, PhoneOff, Phone, RefreshCw, BarChart2 } from 'lucide-react'
import { format } from 'date-fns'
import type { CallStatus } from '@/types'

const CALL_STATUS_CLASSES: Record<CallStatus, string> = {
  completed: 'badge-active', failed: 'badge-error', busy: 'badge-warning',
  no_answer: 'badge-inactive', rejected: 'badge-error', in_progress: 'badge-info',
}
const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  completed: 'Completada', failed: 'Fallida', busy: 'Ocupado',
  no_answer: 'Sin respuesta', rejected: 'Rechazada', in_progress: 'En curso',
}

function formatDuration(secs: number): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function CallsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calls', page, statusFilter],
    queryFn: () => callsApi.list({ page, page_size: 20, status: statusFilter || undefined }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['calls-stats'],
    queryFn: () => callsApi.stats().then(r => r.data),
  })

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Llamadas</h1>
          <p className="page-subtitle">CDR — Call Detail Records · {data?.total ?? 0} registros</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={13} /></button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total, icon: Phone, color: 'var(--status-info)' },
            { label: 'Completadas', value: stats.completed, icon: PhoneIncoming, color: 'var(--status-up)' },
            { label: 'Fallidas', value: stats.failed, icon: PhoneOff, color: 'var(--status-down)' },
            { label: 'Duración Promedio', value: formatDuration(Math.round(stats.avg_duration_seconds)), icon: BarChart2, color: 'var(--status-testing)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: '16px 20px' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <select className="select" style={{ width: 180 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="completed">Completada</option>
          <option value="failed">Fallida</option>
          <option value="busy">Ocupado</option>
          <option value="no_answer">Sin respuesta</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Origen</th>
              <th>Destino</th>
              <th>Inicio</th>
              <th>Duración</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>SIP Call ID</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                <div className="flex justify-center"><div className="loader" /></div>
              </td></tr>
            )}
            {!isLoading && !data?.items.length && (
              <tr><td colSpan={7}><div className="empty-state" style={{ padding: '40px 0' }}>Sin registros de llamadas</div></td></tr>
            )}
            {data?.items.map(call => (
              <tr key={call.id}>
                <td className="mono">{call.caller_number}</td>
                <td className="mono">{call.callee_number}</td>
                <td style={{ fontSize: 11 }}>{format(new Date(call.started_at), 'dd/MM/yy HH:mm')}</td>
                <td className="mono">{formatDuration(call.duration_seconds)}</td>
                <td><span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>{call.call_type}</span></td>
                <td>
                  <span className={`badge ${CALL_STATUS_CLASSES[call.status]}`}>
                    {CALL_STATUS_LABELS[call.status]}
                  </span>
                </td>
                <td className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{call.sip_call_id ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Página {data.page} de {data.pages} · {data.total} registros</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <button className="btn btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Siguiente</button>
          </div>
        </div>
      )}
    </div>
  )
}
