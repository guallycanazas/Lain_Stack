import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { AppLayout } from '@/components/layout/AppLayout'
import { DrawerLayout } from '@/components/layout/DrawerLayout'
import { HorizontalLayout } from '@/components/layout/HorizontalLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SubscribersPage } from '@/pages/subscribers/SubscribersPage'
import { SimCardsPage } from '@/pages/simcards/SimCardsPage'
import { CallsPage } from '@/pages/calls/CallsPage'
import { SMSPage } from '@/pages/sms/SMSPage'
import { AlertsPage } from '@/pages/alerts/AlertsPage'
import { ServicesPage } from '@/pages/services/ServicesPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="loader" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading CanazasTEL...</span>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LayoutRouter() {
  const { layout } = useTheme()

  const layouts: Record<string, React.ComponentType> = {
    sidebar: AppLayout,
    drawer: DrawerLayout,
    horizontal: HorizontalLayout,
  }

  const LayoutComponent = layouts[layout] ?? AppLayout

  return (
    <ProtectedRoute>
      <LayoutComponent />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LayoutRouter />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="subscribers" element={<SubscribersPage />} />
          <Route path="sim-cards" element={<SimCardsPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="sms" element={<SMSPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}