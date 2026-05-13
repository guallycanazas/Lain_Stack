/**
 * Dashboard Page — KPI cards, service status overview and recent activity.
 */
import { useQuery } from '@tanstack/react-query'
import { dashboardApi, servicesApi, alertsApi } from '@/api/endpoints'
import {
  Users, Cpu, PhoneCall, MessageSquare, Bell, Server,
  TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import type { DashboardKPIs, ServiceStatus } from '@/types'

function KPICard({ label, value, sublabel, icon: Icon, iconBg, trend, unit }: {
  label: string
  value: number | string
  sublabel?: string
  icon: React.ElementType
  iconBg: string
  trend?: 'up' | 'down' | 'neutral'
  unit?: string
}) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 40, height: 40, background: iconBg }}
        >
          <Icon size={18} color="white" />
        </div>
        {trend && trend !== 'neutral' && (
          <div style={{ color: trend === 'up' ? 'var(--status-up)' : 'var(--status-down)', display: 'flex', alignItems: 'center', fontSize: 11 }}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>
        {value}{unit}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
      {sublabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sublabel}</div>
      )}
    </div>
  )
}

function ServiceRow({ svc }: { svc: ServiceStatus }) {
  const stateStyles: Record<string, { color: string; bg: string; border: string }> = {
    up: {
      color: 'var(--status-up)',
      bg: 'var(--status-up-bg)',
      border: 'var(--status-up-border)',
    },
    down: {
      color: 'var(--status-down)',
      bg: 'var(--status-down-bg)',
      border: 'var(--status-down-border)',
    },
    degraded: {
      color: 'var(--status-degraded)',
      bg: 'var(--status-warning-bg)',
      border: 'var(--status-warning-border)',
    },
    unknown: {
      color: 'var(--status-unknown)',
      bg: 'var(--status-inactive-bg)',
      border: 'var(--status-inactive-border)',
    },
    maintenance: {
      color: 'var(--status-maintenance)',
      bg: 'var(--status-testing-bg)',
      border: 'var(--status-testing-border)',
    },
  }
  const state = stateStyles[svc.state] ?? stateStyles.unknown
  const labels: Record<string, string> = {
    open5gs: 'Open5GS', kamailio_ims: 'Kamailio IMS', pyhss: 'PyHSS', webui: 'Web UI',
    database: 'PostgreSQL', redis: 'Redis', ran_connector: 'RAN Connector', backend_api: 'Backend API', nginx: 'Nginx',
  }
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--table-row-border)' }}>
      <div className="flex items-center gap-3">
        <div className="status-dot" style={{ background: state.color, boxShadow: svc.state === 'up' ? `0 0 6px ${state.color}` : 'none' }} />
        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
          {labels[svc.service_name] ?? svc.service_name}
        </span>
        {svc.version && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>v{svc.version}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {svc.latency_ms != null && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{svc.latency_ms}ms</span>
        )}
        <span
          className="badge"
          style={{
            background: state.bg,
            color: state.color,
            border: `1px solid ${state.border}`,
            fontSize: 10,
          }}
        >
          {svc.state.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

// Simulated time-series data for chart (would be fetched from API in production)
const chartData = [
  { time: '00:00', calls: 2, sms: 5 },
  { time: '04:00', calls: 1, sms: 2 },
  { time: '08:00', calls: 12, sms: 18 },
  { time: '12:00', calls: 22, sms: 30 },
  { time: '16:00', calls: 18, sms: 25 },
  { time: '20:00', calls: 14, sms: 20 },
  { time: '23:00', calls: 8, sms: 12 },
]

export function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKPIs().then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list().then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts-recent'],
    queryFn: () => alertsApi.list({ page_size: 5, is_read: false }).then(r => r.data),
  })

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loader" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  const k = kpis as DashboardKPIs | undefined

  const pieData = k ? [
    { name: 'Activos', value: k.active_subscribers, color: 'var(--status-up)' },
    { name: 'Inactivos', value: k.total_subscribers - k.active_subscribers, color: 'var(--chart-pie-muted)' },
  ] : []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen del laboratorio LTE/IMS — tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: 'var(--status-up-bg)',
              border: '1px solid var(--status-up-border)',
              fontSize: 12,
              color: 'var(--status-up)',
            }}
          >
            <div className="status-dot status-dot-up" />
            Laboratorio activo
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <KPICard label="Total Suscriptores" value={k?.total_subscribers ?? 0}
          sublabel={`${k?.active_subscribers ?? 0} activos`} icon={Users}
          iconBg="var(--kpi-users-bg)" trend="up" />
        <KPICard label="SIM Cards" value={k?.total_sim_cards ?? 0}
          sublabel={`${k?.available_sims ?? 0} disponibles`} icon={Cpu}
          iconBg="var(--kpi-sim-bg)" />
        <KPICard label="Llamadas Totales" value={k?.total_calls ?? 0}
          sublabel={`${k?.completed_calls ?? 0} completadas · ${k?.failed_calls ?? 0} fallidas`} icon={PhoneCall}
          iconBg="var(--kpi-calls-bg)" />
        <KPICard label="SMS Enviados" value={k?.total_sms ?? 0} icon={MessageSquare}
          iconBg="var(--kpi-sms-bg)" />
        <KPICard label="Alertas sin Leer" value={k?.unread_alerts ?? 0}
          sublabel={`${k?.critical_alerts ?? 0} críticas`} icon={Bell}
          iconBg="var(--kpi-alerts-bg)" trend={k?.critical_alerts ? 'down' : 'neutral'} />
        <KPICard label="Servicios Activos" value={`${k?.services_up ?? 0}/${k?.services_total ?? 0}`}
          icon={Server} iconBg="var(--kpi-services-bg)" />
      </div>

      {/* Charts + Services row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Activity chart */}
        <div className="card col-span-2">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Actividad del Laboratorio (24h)
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-calls)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-calls)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSms" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-sms)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-sms)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: 'var(--chart-axis)', fontSize: 11 }} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--chart-legend)' }}
              />
              <Area type="monotone" dataKey="calls" name="Llamadas" stroke="var(--chart-calls)" fill="url(#colorCalls)" strokeWidth={2} />
              <Area type="monotone" dataKey="sms" name="SMS" stroke="var(--chart-sms)" fill="url(#colorSms)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscriber pie */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Estado Suscriptores
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                dataKey="value" nameKey="name" paddingAngle={4}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={8} iconType="circle"
                formatter={(value) => <span style={{ fontSize: 11, color: 'var(--chart-legend)' }}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services + Alerts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Service status */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Estado de Servicios
          </div>
          {services?.slice(0, 7).map(svc => (
            <ServiceRow key={svc.id} svc={svc} />
          ))}
          {!services?.length && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Sin datos de servicios
            </p>
          )}
        </div>

        {/* Recent alerts */}
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
            Alertas Recientes
          </div>
          {alertsData?.items.length === 0 && (
            <div className="empty-state py-8">
              <CheckCircle size={32} />
              <span style={{ fontSize: 13 }}>Sin alertas pendientes</span>
            </div>
          )}
          {alertsData?.items.map(alert => {
            const levelColors: Record<string, string> = {
              info: 'var(--status-info)',
              warning: 'var(--status-warning)',
              error: 'var(--status-error)',
              critical: 'var(--status-critical)',
            }
            const LevelIcon = {
              info: CheckCircle, warning: AlertTriangle, error: XCircle, critical: XCircle,
            }[alert.level] ?? AlertTriangle
            return (
              <div key={alert.id} className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--table-row-border)' }}>
                <LevelIcon size={14} style={{ color: levelColors[alert.level], flexShrink: 0, marginTop: 1 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alert.message}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
