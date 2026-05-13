// Shared TypeScript types for the CanazasTEL Admin Platform

export type UserRole = 'admin' | 'operator' | 'viewer'

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: UserRole
  is_active: boolean
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface UserCreateInput {
  email: string
  username: string
  full_name: string
  password: string
  role?: UserRole
  bio?: string
}

export interface UserUpdateInput {
  full_name?: string
  bio?: string
  avatar_url?: string
}

export interface RegisterInput {
  email: string
  username: string
  full_name: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export type SubscriberStatus = 'active' | 'inactive' | 'suspended' | 'testing'
export type SimType = 'usim' | 'isim' | 'uicc' | 'virtual'

export interface Subscriber {
  id: number
  imsi: string
  msisdn: string
  iccid?: string
  full_name: string
  email?: string
  status: SubscriberStatus
  apn: string
  sim_type: SimType
  profile?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export type SimStatus = 'available' | 'assigned' | 'blocked' | 'testing' | 'retired'

export interface SimCard {
  id: number
  iccid: string
  imsi?: string
  msisdn?: string
  sim_type: string
  manufacturer?: string
  batch_id?: string
  status: SimStatus
  amf?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type CallStatus = 'completed' | 'failed' | 'busy' | 'no_answer' | 'rejected' | 'in_progress'
export type CallType = 'voice' | 'volte' | 'cs' | 'emergency'

export interface Call {
  id: number
  caller_id?: number
  callee_id?: number
  caller_number: string
  callee_number: string
  started_at: string
  ended_at?: string
  duration_seconds: number
  call_type: CallType
  status: CallStatus
  sip_call_id?: string
  notes?: string
  created_at: string
}

export type SMSStatus = 'sent' | 'delivered' | 'failed' | 'pending' | 'rejected'
export type SMSDirection = 'mo' | 'mt' | 'internal'

export interface SMS {
  id: number
  sender_id?: number
  receiver_id?: number
  sender_number: string
  receiver_number: string
  content?: string
  direction: SMSDirection
  status: SMSStatus
  sent_at: string
  delivered_at?: string
  smsc_id?: string
  created_at: string
}

export type AlertLevel = 'info' | 'warning' | 'error' | 'critical'
export type AlertSource = 'system' | 'open5gs' | 'kamailio' | 'pyhss' | 'ran' | 'manual' | 'db' | 'redis'

export interface Alert {
  id: number
  title: string
  message: string
  level: AlertLevel
  source: AlertSource
  is_read: boolean
  metadata_json?: string
  created_at: string
}

export type ServiceName = 'open5gs' | 'kamailio_ims' | 'pyhss' | 'webui' | 'database' | 'redis' | 'ran_connector' | 'backend_api' | 'nginx'
export type ServiceState = 'up' | 'down' | 'degraded' | 'unknown' | 'maintenance'

export interface ServiceStatus {
  id: number
  service_name: ServiceName
  state: ServiceState
  version?: string
  host?: string
  port?: number
  latency_ms?: number
  notes?: string
  diagnostics?: Record<string, any>
  last_checked?: string
  updated_at: string
}

export interface DashboardKPIs {
  total_subscribers: number
  active_subscribers: number
  total_sim_cards: number
  available_sims: number
  total_calls: number
  completed_calls: number
  failed_calls: number
  total_sms: number
  unread_alerts: number
  critical_alerts: number
  services_up: number
  services_total: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    field?: string
  }
}
