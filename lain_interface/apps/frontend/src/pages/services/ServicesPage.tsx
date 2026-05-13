import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/api/endpoints'
import { RefreshCw, Cpu, Database, Globe, Radio, Server, CheckCircle, XCircle, AlertTriangle, Loader2, X, Activity, HardDrive, Wifi, Zap, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { ServiceStatus, ServiceState } from '@/types'

const SERVICE_ICONS: Record<string, React.ElementType> = {
  open5gs: Radio, kamailio_ims: Globe, pyhss: Cpu, webui: Globe,
  database: Database, redis: Server, ran_connector: Radio,
  backend_api: Server, nginx: Globe,
}

const SERVICE_LABELS: Record<string, string> = {
  open5gs: 'Open5GS Core', kamailio_ims: 'Kamailio IMS', pyhss: 'PyHSS',
  webui: 'Web UI (Open5GS)', database: 'PostgreSQL', redis: 'Redis',
  ran_connector: 'RAN Native Connector', backend_api: 'Backend API', nginx: 'Nginx Proxy',
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  open5gs: 'EPC/MME core de Open5GS',
  kamailio_ims: 'Servidor SIP IMS (P-CSCF/I-CSCF/S-CSCF)',
  pyhss: 'HSS/AuC 基于 PyHSS',
  webui: 'Interfaz web de administración Open5GS',
  database: 'Base de datos PostgreSQL',
  redis: 'Cache y sesiones Redis',
  ran_connector: 'Conector SDR RAN (USRP/B210)',
  backend_api: 'API REST del backend FastAPI',
  nginx: 'Proxy reverso y servidor frontend',
}

const STATE_STYLES: Record<ServiceState, { color: string; bg: string; border: string; icon: React.ElementType }> = {
  up:        { color: 'var(--status-up)',         bg: 'var(--status-up-bg)',        border: 'var(--status-up-border)',        icon: CheckCircle },
  down:      { color: 'var(--status-down)',       bg: 'var(--status-down-bg)',      border: 'var(--status-down-border)',      icon: XCircle },
  degraded:  { color: 'var(--status-degraded)',   bg: 'var(--status-warning-bg)',   border: 'var(--status-warning-border)',   icon: AlertTriangle },
  unknown:   { color: 'var(--status-unknown)',     bg: 'var(--status-inactive-bg)',  border: 'var(--status-inactive-border)',  icon: AlertTriangle },
  maintenance: { color: 'var(--status-maintenance)', bg: 'var(--status-testing-bg)', border: 'var(--status-testing-border)',  icon: AlertTriangle },
}

interface ServiceCardProps {
  svc: ServiceStatus
  onVerify: (id: number) => void
  onViewDetails: (svc: ServiceStatus) => void
  verifyingId: number | null
}

function ServiceCard({ svc, onVerify, onViewDetails, verifyingId }: ServiceCardProps) {
  const Icon = SERVICE_ICONS[svc.service_name] ?? Server
  const stateStyle = STATE_STYLES[svc.state] ?? STATE_STYLES.unknown
  const StateIcon = stateStyle.icon
  const isVerifying = verifyingId === svc.id

  return (
    <div
      className="card"
      onClick={() => onViewDetails(svc)}
      style={{
        borderLeft: `3px solid ${stateStyle.color}`,
        padding: '16px 20px',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = ''
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 40,
            height: 40,
            background: stateStyle.bg,
            border: `1px solid ${stateStyle.border}`,
            flexShrink: 0,
          }}
        >
          <Icon size={18} style={{ color: stateStyle.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              {SERVICE_LABELS[svc.service_name] ?? svc.service_name}
            </span>
            <span
              className="badge"
              style={{
                background: stateStyle.bg,
                color: stateStyle.color,
                border: `1px solid ${stateStyle.border}`,
                fontSize: 10,
              }}
            >
              {svc.state.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {SERVICE_DESCRIPTIONS[svc.service_name] ?? 'Servicio del laboratorio'}
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            onVerify(svc.id)
          }}
          disabled={isVerifying}
          title="Verificar"
        >
          {isVerifying ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
        </button>
      </div>

      <div className="flex flex-col gap-2" style={{ fontSize: 12 }}>
        <div className="flex items-center gap-4">
          {svc.host && (
            <div className="flex items-center gap-1.5">
              <Globe size={11} style={{ color: 'var(--text-muted)' }} />
              <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                {svc.host}{svc.port ? `:${svc.port}` : ''}
              </span>
            </div>
          )}
          {svc.latency_ms != null && (
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: svc.state === 'up' ? 'var(--status-up)' : 'var(--text-muted)',
                fontWeight: svc.state === 'up' ? 600 : 400,
              }}
            >
              {svc.latency_ms}ms
            </span>
          )}
          {svc.version && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              v{svc.version}
            </span>
          )}
        </div>

        {svc.notes && (
          <div
            style={{
              fontSize: 11,
              color: svc.state === 'up' ? 'var(--text-muted)' : 'var(--status-warning)',
              fontStyle: 'italic',
              padding: '4px 8px',
              background: svc.state !== 'up' ? 'var(--status-warning-bg)' : 'transparent',
              borderRadius: 4,
              border: svc.state !== 'up' ? '1px solid var(--status-warning-border)' : 'none',
            }}
          >
            {svc.notes}
          </div>
        )}

        <div className="flex items-center gap-2" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          <span>Última verificación:</span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {svc.last_checked ? format(new Date(svc.last_checked), 'dd/MM HH:mm:ss') : 'Nunca'}
          </span>
        </div>

        {svc.diagnostics && svc.state === 'up' && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              fontSize: 10,
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
              Diagnósticos
            </div>
            <div className="flex flex-col gap-1">
              {svc.service_name === 'redis' && svc.diagnostics.memory_used && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Memoria:</span>
                  <span className="mono" style={{ color: 'var(--status-up)', fontWeight: 600 }}>
                    {svc.diagnostics.memory_used}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· Clientes:</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {svc.diagnostics.connected_clients}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· Uptime:</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {svc.diagnostics.uptime_days}d
                  </span>
                </div>
              )}
              {svc.service_name === 'database' && svc.diagnostics.size && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>Tamaño:</span>
                  <span className="mono" style={{ color: 'var(--status-up)', fontWeight: 600 }}>
                    {svc.diagnostics.size}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· Conexiones:</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {svc.diagnostics.db_connections}/{svc.diagnostics.total_connections}
                  </span>
                </div>
              )}
              {svc.service_name === 'backend_api' && svc.diagnostics.status_code && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>HTTP:</span>
                  <span className="mono" style={{ color: 'var(--status-up)', fontWeight: 600 }}>
                    {svc.diagnostics.status_code}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· Respuesta:</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {svc.diagnostics.response_time_ms}ms
                  </span>
                </div>
              )}
              {svc.service_name === 'nginx' && svc.diagnostics.nginx_version && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>nginx:</span>
                  <span className="mono" style={{ color: 'var(--status-up)', fontWeight: 600 }}>
                    {svc.diagnostics.nginx_version}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>· Frontend:</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {svc.diagnostics.frontend_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ServiceDetailModal({ svc, onClose, onVerify, isVerifying }: {
  svc: ServiceStatus
  onClose: () => void
  onVerify: () => void
  isVerifying: boolean
}) {
  const stateStyle = STATE_STYLES[svc.state] ?? STATE_STYLES.unknown
  const Icon = SERVICE_ICONS[svc.service_name] ?? Server
  const StateIcon = stateStyle.icon

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 0,
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 48,
                height: 48,
                background: stateStyle.bg,
                border: `2px solid ${stateStyle.border}`,
              }}
            >
              <Icon size={24} style={{ color: stateStyle.color }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {SERVICE_LABELS[svc.service_name] ?? svc.service_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <StateIcon size={14} style={{ color: stateStyle.color }} />
                <span
                  className="badge"
                  style={{
                    background: stateStyle.bg,
                    color: stateStyle.color,
                    border: `1px solid ${stateStyle.border}`,
                    fontSize: 11,
                  }}
                >
                  {svc.state.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {SERVICE_DESCRIPTIONS[svc.service_name] ?? 'Servicio del laboratorio'}
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="flex items-center gap-2" style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <Clock size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Última verificación</div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {svc.last_checked ? format(new Date(svc.last_checked), 'dd/MM/yyyy HH:mm:ss') : 'Nunca'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2" style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <Activity size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Latencia</div>
                <div className="mono" style={{ fontSize: 12, color: svc.state === 'up' ? 'var(--status-up)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {svc.latency_ms != null ? `${svc.latency_ms}ms` : 'N/A'}
                </div>
              </div>
            </div>
            {svc.host && (
              <div className="flex items-center gap-2" style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Host</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {svc.host}{svc.port ? `:${svc.port}` : ''}
                  </div>
                </div>
              </div>
            )}
            {svc.version && (
              <div className="flex items-center gap-2" style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <Zap size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Versión</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {svc.version}
                  </div>
                </div>
              </div>
            )}
          </div>

          {svc.notes && (
            <div
              style={{
                padding: 12,
                background: svc.state !== 'up' ? 'var(--status-warning-bg)' : 'var(--bg-secondary)',
                border: `1px solid ${svc.state !== 'up' ? 'var(--status-warning-border)' : 'var(--border-color)'}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Notas</div>
              <div style={{ fontSize: 12, color: svc.state !== 'up' ? 'var(--status-warning)' : 'var(--text-secondary)' }}>
                {svc.notes}
              </div>
            </div>
          )}

          {svc.diagnostics && svc.state === 'up' && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                Diagnósticos Detallados
              </h3>
              <div className="flex flex-col gap-2">
                {svc.service_name === 'redis' && (
                  <>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <HardDrive size={16} style={{ color: 'var(--status-up)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Memoria usada</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-up)' }}>
                        {svc.diagnostics.memory_used}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Wifi size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Clientes conectados</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.connected_clients}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Uptime</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.uptime_days} días
                      </span>
                    </div>
                  </>
                )}
                {svc.service_name === 'database' && (
                  <>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <HardDrive size={16} style={{ color: 'var(--status-up)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Tamaño BD</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-up)' }}>
                        {svc.diagnostics.size}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Database size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Conexiones activas</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.db_connections} / {svc.diagnostics.total_connections}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Base de datos</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.database}
                      </span>
                    </div>
                  </>
                )}
                {svc.service_name === 'backend_api' && (
                  <>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Zap size={16} style={{ color: 'var(--status-up)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Status HTTP</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-up)' }}>
                        {svc.diagnostics.status_code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Activity size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Tiempo de respuesta</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.response_time_ms}ms
                      </span>
                    </div>
                  </>
                )}
                {svc.service_name === 'nginx' && (
                  <>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Zap size={16} style={{ color: 'var(--status-up)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>nginx versión</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--status-up)' }}>
                        {svc.diagnostics.nginx_version}
                      </span>
                    </div>
                    <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                      <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>Frontend status</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {svc.diagnostics.frontend_status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn btn-primary"
            onClick={onVerify}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Verificar Ahora
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ServicesPage() {
  const qc = useQueryClient()
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceStatus | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list().then(r => r.data),
    refetchInterval: 30_000,
  })

  const verifyMut = useMutation({
    mutationFn: async (serviceId: number) => {
      const resp = await fetch('/api/v1/services/verify-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('ct_access')}` },
      })
      if (!resp.ok) throw new Error('Verification failed')
      return resp.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
    },
    onSettled: () => setVerifyingId(null),
  })

  const handleVerify = (serviceId: number) => {
    setVerifyingId(serviceId)
    verifyMut.mutate(serviceId)
  }

  const upCount = data?.filter(s => s.state === 'up').length ?? 0
  const total = data?.length ?? 0
  const healthPercent = total > 0 ? Math.round((upCount / total) * 100) : 0

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estado de Servicios</h1>
          <p className="page-subtitle">
            {upCount}/{total} servicios activos · {healthPercent}% saludable
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleVerify(-1)}
            disabled={verifyMut.isPending}
          >
            {verifyMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={13} />}
            Verificar Todos
          </button>
        </div>
      </div>

      <div className="card mb-5" style={{ padding: '16px 20px' }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Salud del Laboratorio
          </span>
          <div className="flex items-center gap-2">
            {healthPercent >= 80 ? (
              <CheckCircle size={14} style={{ color: 'var(--status-up)' }} />
            ) : healthPercent >= 50 ? (
              <AlertTriangle size={14} style={{ color: 'var(--status-warning)' }} />
            ) : (
              <XCircle size={14} style={{ color: 'var(--status-down)' }} />
            )}
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: healthPercent >= 80 ? 'var(--status-up)' : healthPercent >= 50 ? 'var(--status-warning)' : 'var(--status-down)',
              }}
            >
              {healthPercent}%
            </span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <div
            style={{
              width: `${healthPercent}%`,
              height: '100%',
              background:
                healthPercent >= 80
                  ? 'var(--status-up)'
                  : healthPercent >= 50
                  ? 'var(--status-warning)'
                  : 'var(--status-down)',
              transition: 'width 0.5s ease, background 0.3s ease',
              borderRadius: 4,
            }}
          />
        </div>
        <div className="flex gap-4 mt-3" style={{ fontSize: 11 }}>
          <span style={{ color: 'var(--status-up)' }}>● {upCount} UP</span>
          <span style={{ color: 'var(--status-down)' }}>● {total - upCount} DOWN</span>
        </div>
      </div>

      <div
        className="card mb-5"
        style={{
          padding: '12px 16px',
          background: 'var(--status-info-bg)',
          border: '1px solid var(--status-info-border)',
        }}
      >
        <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
          <CheckCircle size={14} style={{ color: 'var(--status-info)' }} />
          <span style={{ color: 'var(--status-info)' }}>
            Haz clic en cualquier servicio para ver detalles y diagnósticos. Los estados se verifican en tiempo real.
          </span>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ height: 140 }} />
          ))}
        {data?.map((svc: ServiceStatus) => (
          <ServiceCard
            key={svc.id}
            svc={svc}
            onVerify={handleVerify}
            onViewDetails={setSelectedService}
            verifyingId={verifyingId}
          />
        ))}
      </div>

      <div className="card mt-5" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Estados de Servicios
        </h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {[
            { state: 'up', label: 'UP', desc: 'Servicio respondiendo normalmente' },
            { state: 'down', label: 'DOWN', desc: 'No se puede conectar al servicio' },
            { state: 'degraded', label: 'DEGRADED', desc: 'Responde pero con errores o lentitud' },
            { state: 'maintenance', label: 'MAINTENANCE', desc: 'En mantenimiento o no configurado' },
            { state: 'unknown', label: 'UNKNOWN', desc: 'Nunca se ha verificado' },
          ].map(({ state, label, desc }) => {
            const style = STATE_STYLES[state as ServiceState]
            return (
              <div
                key={state}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: 10,
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: style.color,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: style.color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedService && (
        <ServiceDetailModal
          svc={selectedService}
          onClose={() => setSelectedService(null)}
          onVerify={() => handleVerify(selectedService.id)}
          isVerifying={verifyingId === selectedService.id}
        />
      )}
    </div>
  )
}
