import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { smsApi } from '@/api/endpoints'
import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import type { SMSStatus, SMSDirection } from '@/types'

const STATUS_CLASSES: Record<SMSStatus, string> = {
  sent: 'badge-info', delivered: 'badge-active', failed: 'badge-error',
  pending: 'badge-warning', rejected: 'badge-error',
}
const DIR_LABELS: Record<SMSDirection, string> = {
  mo: 'MO', mt: 'MT', internal: 'INT',
}

export function SMSPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sms', page, statusFilter],
    queryFn: () => smsApi.list({ page, page_size: 20, status: statusFilter || undefined }).then(r => r.data),
  })

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de SMS</h1>
          <p className="page-subtitle">MO / MT · {data?.total ?? 0} mensajes</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => refetch()}><RefreshCw size={13} /></button>
      </div>

      <div className="flex gap-3 mb-4">
        <select className="select" style={{ width: 180 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">Todos los estados</option>
          <option value="sent">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="failed">Fallido</option>
          <option value="pending">Pendiente</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Dirección</th>
              <th>Remitente</th>
              <th>Destinatario</th>
              <th>Contenido</th>
              <th>Enviado</th>
              <th>Entregado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                <div className="flex justify-center"><div className="loader" /></div>
              </td></tr>
            )}
            {!isLoading && !data?.items.length && (
              <tr><td colSpan={7}><div className="empty-state" style={{ padding: '40px 0' }}>Sin mensajes SMS</div></td></tr>
            )}
            {data?.items.map(sms => (
              <tr key={sms.id}>
                <td>
                  <span className={`badge ${sms.direction === 'mo' ? 'badge-info' : 'badge-testing'}`}>
                    {DIR_LABELS[sms.direction]}
                  </span>
                </td>
                <td className="mono">{sms.sender_number}</td>
                <td className="mono">{sms.receiver_number}</td>
                <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {sms.content ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ fontSize: 11 }}>{format(new Date(sms.sent_at), 'dd/MM/yy HH:mm')}</td>
                <td style={{ fontSize: 11 }}>{sms.delivered_at ? format(new Date(sms.delivered_at), 'HH:mm:ss') : '—'}</td>
                <td><span className={`badge ${STATUS_CLASSES[sms.status]}`}>{sms.status}</span></td>
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
