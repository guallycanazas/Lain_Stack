/**
 * Typed API functions for all backend modules.
 */
import { apiClient } from './client'
import type {
  AuthTokens,
  RegisterInput,
  User,
  UserCreateInput,
  UserUpdateInput,
  Subscriber,
  SimCard,
  Call,
  SMS,
  Alert,
  ServiceStatus,
  DashboardKPIs,
  PaginatedResponse,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<AuthTokens>('/auth/login', { username, password }),
  register: (data: RegisterInput) =>
    apiClient.post<User>('/auth/register', data),
  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),
  me: () => apiClient.get<User>('/auth/me'),
  changePassword: (current_password: string, new_password: string) =>
    apiClient.post('/users/me/change-password', { current_password, new_password }),
}

// ── Dashboard ─────────────────────────────────────────────────────────
export const dashboardApi = {
  getKPIs: () => apiClient.get<DashboardKPIs>('/dashboard/kpis'),
}

// ── Subscribers ───────────────────────────────────────────────────────
export const subscribersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Subscriber>>('/subscribers', { params }),
  get: (id: number) => apiClient.get<Subscriber>(`/subscribers/${id}`),
  create: (data: Partial<Subscriber>) => apiClient.post<Subscriber>('/subscribers', data),
  update: (id: number, data: Partial<Subscriber>) =>
    apiClient.patch<Subscriber>(`/subscribers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/subscribers/${id}`),
  exportCsv: () => apiClient.get('/subscribers/export/csv', { responseType: 'blob' }),
}

// ── SIM Cards ─────────────────────────────────────────────────────────
export const simCardsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<SimCard>>('/sim-cards', { params }),
  get: (id: number) => apiClient.get<SimCard>(`/sim-cards/${id}`),
  create: (data: Partial<SimCard>) => apiClient.post<SimCard>('/sim-cards', data),
  update: (id: number, data: Partial<SimCard>) =>
    apiClient.patch<SimCard>(`/sim-cards/${id}`, data),
  assign: (subscriber_id: number, sim_card_id: number, notes?: string) =>
    apiClient.post('/sim-cards/assign', { subscriber_id, sim_card_id, notes }),
}

// ── Calls ─────────────────────────────────────────────────────────────
export const callsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Call>>('/calls', { params }),
  stats: () => apiClient.get('/calls/stats'),
}

// ── SMS ───────────────────────────────────────────────────────────────
export const smsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<SMS>>('/sms', { params }),
  stats: () => apiClient.get('/sms/stats'),
}

// ── Alerts ────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Alert>>('/alerts', { params }),
  create: (data: Partial<Alert>) => apiClient.post<Alert>('/alerts', data),
  markRead: (id: number) => apiClient.patch<Alert>(`/alerts/${id}/read`, { is_read: true }),
  markAllRead: () => apiClient.post('/alerts/mark-all-read', {}),
  unreadCounts: () => apiClient.get<Record<string, number>>('/alerts/unread-counts'),
}

// ── Services ──────────────────────────────────────────────────────────
export const servicesApi = {
  list: () => apiClient.get<ServiceStatus[]>('/services'),
  update: (name: string, data: { state: string; version?: string; latency_ms?: number }) =>
    apiClient.patch<ServiceStatus>(`/services/${name}`, data),
}

// ── Users ─────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),
  get: (id: number) => apiClient.get<User>(`/users/${id}`),
  create: (data: UserCreateInput) => apiClient.post<User>('/users', data),
  update: (id: number, data: UserUpdateInput) => apiClient.patch<User>(`/users/${id}`, data),
  updateRole: (id: number, role: User['role']) => apiClient.patch<User>(`/users/${id}/role`, { role }),
  delete: (id: number) => apiClient.delete(`/users/${id}`),
}

// ── Audit Logs ────────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/audit-logs', { params }),
}
