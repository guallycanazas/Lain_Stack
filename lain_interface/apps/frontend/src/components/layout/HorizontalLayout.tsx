import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard, Users, Cpu, PhoneCall, MessageSquare,
  Bell, Server, UserCog, LogOut, Radio,
  Activity, Shield, ChevronDown, Settings,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { alertsApi } from '@/api/endpoints'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscribers', icon: Users,           label: 'Suscriptores' },
  { to: '/sim-cards',   icon: Cpu,             label: 'SIM Cards' },
  { to: '/calls',       icon: PhoneCall,       label: 'Llamadas' },
  { to: '/sms',         icon: MessageSquare,   label: 'SMS' },
  { to: '/alerts',      icon: Bell,            label: 'Alertas' },
  { to: '/services',    icon: Server,          label: 'Servicios' },
  { to: '/users',       icon: UserCog,         label: 'Usuarios', adminOnly: true },
  { to: '/settings',    icon: Settings,        label: 'Config', adminOnly: true },
]

export function HorizontalLayout() {
  const { user, logout } = useAuth()
  const { layoutOptions, setLayout } = useTheme()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header
        className="sticky top-0 z-20"
        style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center px-6 py-0" style={{ minHeight: 56 }}>
          <div className="flex items-center gap-3 mr-8">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'var(--logo-gradient)', boxShadow: '0 0 16px var(--logo-shadow)' }}
            >
              <Radio size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>CanazasTEL</div>
              <div style={{ fontSize: 9, color: 'var(--brand-primary)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>LTE/IMS Admin</div>
            </div>
          </div>

          <nav className="flex items-center gap-1 flex-1">
            {visibleItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx('flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all duration-200', {
                    active: isActive,
                  })
                }
                style={({ isActive }) => ({
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--brand-light)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent',
                  textDecoration: 'none',
                })}
              >
                <Icon size={14} />
                <span>{label}</span>
                {label === 'Alertas' && totalUnread > 0 && (
                  <span className="rounded-full px-1.5 py-0.5 text-xs font-bold" style={{ background: 'var(--status-down-bg)', color: 'var(--status-down)', fontSize: 10 }}>
                    {totalUnread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 ml-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', fontSize: 11, color: 'var(--text-muted)' }}>
              {layoutOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLayout(opt.value)}
                  title={opt.label}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 4px',
                    borderRadius: 4,
                    color: 'var(--text-muted)',
                  }}
                >
                  {opt.icon}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Activity size={13} style={{ color: 'var(--status-up)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v1.0.0</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 26, height: 26, background: 'var(--avatar-gradient)', fontSize: 11, fontWeight: 700, color: 'white' }}
                >
                  {user?.full_name?.[0] ?? 'U'}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{user?.full_name}</span>
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl py-2 min-w-48 shadow-xl z-50"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', backdropFilter: 'blur(10px)' }}
                >
                  <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user?.role}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2"
                    style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <LogOut size={13} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}