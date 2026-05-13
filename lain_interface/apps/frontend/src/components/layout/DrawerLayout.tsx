import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard, Users, Cpu, PhoneCall, MessageSquare,
  Bell, Server, UserCog, LogOut, Radio,
  Activity, Shield, Settings, ChevronLeft, ChevronRight,
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
  { to: '/settings',    icon: Settings,        label: 'Config',        section: 'admin', adminOnly: true },
]

const sections: Record<string, string> = {
  main: 'Principal',
  telecom: 'Telecomunicaciones',
  monitor: 'Monitoreo',
  admin: 'Administración',
}

export function DrawerLayout() {
  const { user, logout } = useAuth()
  const { layout, layoutOptions, setLayout } = useTheme()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

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
      <aside
        className={clsx('flex flex-col fixed top-0 left-0 h-full z-20 transition-all duration-300', !collapsed ? 'w-56' : 'w-16')}
        style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border-color)', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: 'var(--logo-gradient)', boxShadow: '0 0 12px var(--logo-shadow)' }}
          >
            <Radio size={16} color="white" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>CanazasTEL</div>
              <div style={{ fontSize: 10, color: 'var(--brand-primary)', fontWeight: 600, letterSpacing: '0.5px' }}>LTE/IMS ADMIN</div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {Object.entries(sections).map(([key, label]) => {
            const items = grouped[key]
            if (!items?.length) return null
            return (
              <div key={key} className="mb-5">
                {!collapsed && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px', marginBottom: 6 }}>
                    {label}
                  </div>
                )}
                {items.map(({ to, icon: Icon, label: itemLabel }) => (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? itemLabel : undefined}
                    className={({ isActive }) =>
                      clsx('sidebar-item mb-1', { active: isActive })
                    }
                    style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : undefined }}
                  >
                    <Icon size={15} />
                    {!collapsed && <span>{itemLabel}</span>}
                    {itemLabel === 'Alertas' && totalUnread > 0 && !collapsed && (
                      <span className="ml-auto rounded-full px-2 py-0.5" style={{ background: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 10, fontWeight: 700 }}>
                        {totalUnread}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setCollapsed(c => !collapsed)}
            className="sidebar-item w-full mb-2"
            style={{ justifyContent: 'center', fontSize: 12 }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!collapsed && <span>Colapsar</span>}
          </button>
          <div className="flex items-center gap-2 mb-2 px-2" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 30, height: 30, background: 'var(--avatar-gradient)', fontSize: 12, fontWeight: 700, color: 'white' }}
            >
              {user?.full_name?.[0] ?? 'U'}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {user?.role}
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="sidebar-item w-full" style={{ color: 'var(--error)', fontSize: 12, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <LogOut size={14} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <div className={clsx('flex-1 flex flex-col min-h-screen transition-all duration-300', !collapsed ? 'ml-56' : 'ml-16')}>
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
          style={{ minHeight: 52, background: 'var(--topbar-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}
        >
          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            <Activity size={14} style={{ color: 'var(--brand-primary)' }} />
            <span>LTE/IMS Laboratory</span>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>v1.0.0</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              {layoutOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLayout(opt.value)}
                  title={opt.label}
                  style={{
                    background: layout === opt.value ? 'var(--brand-glow)' : 'transparent',
                    border: layout === opt.value ? '1px solid var(--brand-primary)' : '1px solid transparent',
                    borderRadius: 6,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              <Shield size={12} style={{ color: 'var(--status-up)' }} />
              <span>{user?.full_name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}