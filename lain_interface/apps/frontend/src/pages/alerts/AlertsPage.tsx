import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { alertsApi } from '@/api/endpoints'
import { Bell, CheckCheck, RefreshCw, AlertTriangle, Info, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import type { AlertLevel } from '@/types'

const LEVEL_ICONS: Record<AlertLevel, React.ElementType> = {
  info: Info, warning: AlertTriangle, error: XCircle, critical: XCircle,
}
const LEVEL_COLORS: Record<AlertLevel, string> = {
  info: 'var(--status-info)',
  warning: 'var(--status-warning)',
  error: 'var(--status-error)',
  critical: 'var(--status-critical)',
}

export function AlertsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [levelFilter, setLevelFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['alerts', page, levelFilter, readFilter],
    queryFn: () => alertsApi.list({
      page, page_size: 25,
      level: levelFilter || undefined,
      is_read: readFilter === '' ? undefined : readFilter === 'true',
    }).then(r => r.data),
  })

  const markReadMut = useMutation({
    mutationFn: (id: number) => alertsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const markAllMut = useMutation({
    mutationFn: () => alertsApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Todas marcadas como leídas') },
  })

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alertas y Eventos</h1>
          <p className="page-subtitle">Feed de notificaciones del sistema · {data?.total ?? 0} registros</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={13} /></button>
          <button className="btn btn-secondary btn-sm" onClick={() => markAllMut.mutate()}>
            <CheckCheck size={13} /> Marcar todas leídas
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="select" style={{ width: 160 }} value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los niveles</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="critical">Critical</option>
        </select>
        <select className="select" style={{ width: 150 }} value={readFilter} onChange={e => { setReadFilter(e.target.value); setPage(1) }}>
          <option value="">Todos</option>
          <option value="false">No leídas</option>
          <option value="true">Leídas</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {isLoading && (
          <div className="flex justify-center py-12"><div className="loader" style={{ width: 28, height: 28 }} /></div>
        )}
        {!isLoading && !data?.items.length && (
          <div className="empty-state card">
            <Bell size={32} />
            <span>Sin alertas</span>
          </div>
        )}
        {data?.items.map(alert => {
          const Icon = LEVEL_ICONS[alert.level]
          const color = LEVEL_COLORS[alert.level]
          return (
            <div
              key={alert.id}
              className="card"
              style={{
                padding: '14px 20px',
                opacity: alert.is_read ? 0.6 : 1,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{alert.title}</span>
                    <span className={`badge badge-${alert.level}`}>{alert.level.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {format(new Date(alert.created_at), 'dd/MM/yy HH:mm')}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {alert.source}
                    </span>
                  </div>
                </div>
                {!alert.is_read && (
                  <button
                    className="btn btn-secondary btn-sm flex-shrink-0"
                    style={{ fontSize: 11 }}
                    onClick={() => markReadMut.mutate(alert.id)}
                  >
                    <CheckCheck size={12} /> Leer
                  </button>
                )}
              </div>
            </div>
          )
        })}
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
