/**
 * App Layout — sidebar + topbar + main content area.
 */
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard, Users, Cpu, PhoneCall, MessageSquare,
  Bell, Server, UserCog, LogOut, Radio,
  Activity, Shield, Settings, Link,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@/api/endpoints'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    section: 'main' },
  { to: '/subscribers', icon: Users,           label: 'Suscriptores', section: 'telecom' },
  { to: '/sim-cards',   icon: Cpu,             label: 'SIM Cards',    section: 'telecom' },
  { to: '/calls',       icon: PhoneCall,       label: 'Llamadas',     section: 'telecom' },
  { to: '/sms',         icon: MessageSquare,   label: 'SMS',          section: 'telecom' },
  { to: '/alerts',      icon: Bell,            label: 'Alertas',      section: 'monitor' },
  { to: '/services',    icon: Server,          label: 'Servicios',    section: 'monitor' },
  { to: '/users',       icon: UserCog,         label: 'Usuarios',     section: 'admin', adminOnly: true },
  { to: '/settings',    icon: Settings,        label: 'Config',       section: 'admin', adminOnly: true },
]

const sections: Record<string, string> = {
  main: 'Principal',
  telecom: 'Telecomunicaciones',
  monitor: 'Monitoreo',
  admin: 'Administración',
}

function getThemeName(label: string) {
  return label.replace(/\s*\(.*\)$/, '')
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, themeOptions: options, setTheme } = useTheme()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['alerts-unread'],
    queryFn: () => alertsApi.unreadCounts().then(r => r.data),
    refetchInterval: 30_000,
  })

  const totalUnread = Object.values(unreadData ?? {}).reduce((a, b) => a + b, 0)

  const handleLogout = async () => {
    await logout()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false
    return true
  })

  const grouped = Object.keys(sections).reduce<Record<string, typeof navItems>>((acc, key) => {
    acc[key] = visibleItems.filter(i => i.section === key)
    return acc
  }, {})

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col fixed top-0 left-0 h-full w-56 z-10"
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              background: 'var(--logo-gradient)',
              boxShadow: '0 0 12px var(--logo-shadow)',
            }}
          >
            <Radio size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>CanazasTEL</div>
            <div style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 600, letterSpacing: '0.5px' }}>LTE/IMS ADMIN</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {Object.entries(sections).map(([key, label]) => {
            const items = grouped[key]
            if (!items?.length) return null
            return (
              <div key={key} className="mb-5">
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px', marginBottom: 6 }}>
                  {label}
                </div>
                {items.map(({ to, icon: Icon, label: itemLabel }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      clsx('sidebar-item mb-1', { active: isActive })
                    }
                  >
                    <Icon size={15} />
                    <span>{itemLabel}</span>
                    {itemLabel === 'Alertas' && totalUnread > 0 && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5 flex items-center"
                        style={{
                          background: 'var(--status-down-bg)',
                          color: 'var(--status-down)',
                          fontSize: 10,
                          fontWeight: 700,
                          border: '1px solid var(--status-down-border)',
                        }}
                      >
                        {totalUnread}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-2 px-2">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 30,
                height: 30,
                background: 'var(--avatar-gradient)',
                fontSize: 12,
                fontWeight: 700,
                color: 'white',
              }}
            >
              {user?.full_name?.[0] ?? 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
            style={{ color: 'var(--error)', fontSize: 12 }}
          >
            <LogOut size={14} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────── */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Topbar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
          style={{
            minHeight: 52,
            background: 'var(--topbar-bg)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border-color)',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <Activity size={14} className="text-brand" style={{ color: 'var(--brand-primary)' }} />
            <span>LTE/IMS Laboratory Administration Platform</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>v1.0.0</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              <Shield size={12} style={{ color: 'var(--status-up)' }} />
              <span>Sesión activa</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
