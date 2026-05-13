export const THEME_STORAGE_KEY = 'ct_theme'
export const LAYOUT_STORAGE_KEY = 'ct_layout'

export const THEME_OPTIONS = [
  {
    value: 'telecom',
    label: 'Telecom',
    preview: ['#0a1929', '#068df2', '#22c55e'],
  },
  {
    value: 'aurora',
    label: 'Aurora',
    preview: ['#edf4fd', '#0b7adf', '#1f9f53'],
  },
  {
    value: 'vibe',
    label: 'Vibe',
    preview: ['#ff4d8d', '#fb923c', '#facc15'],
  },
  {
    value: 'carbon',
    label: 'Carbon',
    preview: ['#0f161c', '#14b8a6', '#22c55e'],
  },
  {
    value: 'modern',
    label: 'Modern SaaS',
    preview: ['#1a1a2e', '#667eea', '#764ba2'],
  },
  {
    value: 'noc',
    label: 'Telecom NOC',
    preview: ['#0d1117', '#00ff88', '#ff6b35'],
  },
  {
    value: 'cards',
    label: 'Drawer + Cards',
    preview: ['#f8fafc', '#3b82f6', '#10b981'],
  },
] as const

export type ThemeName = (typeof THEME_OPTIONS)[number]['value']
export type ThemeOption = (typeof THEME_OPTIONS)[number]

export const LAYOUT_OPTIONS = [
  {
    value: 'sidebar',
    label: 'Sidebar Fijo',
    icon: '▮',
  },
  {
    value: 'drawer',
    label: 'Drawer Collapsible',
    icon: '◀',
  },
  {
    value: 'horizontal',
    label: 'Nav Horizontal',
    icon: '≡',
  },
] as const

export type LayoutName = (typeof LAYOUT_OPTIONS)[number]['value']

export const DEFAULT_THEME: ThemeName = 'telecom'
export const DEFAULT_LAYOUT: LayoutName = 'sidebar'

const themeValues = new Set<ThemeName>(THEME_OPTIONS.map((t) => t.value))
const layoutValues = new Set<LayoutName>(LAYOUT_OPTIONS.map((l) => l.value))

export function isThemeName(value: string): value is ThemeName {
  return themeValues.has(value as ThemeName)
}

export function isLayoutName(value: string): value is LayoutName {
  return layoutValues.has(value as LayoutName)
}

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored && isThemeName(stored)) return stored
  return DEFAULT_THEME
}

export function setStoredTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function getStoredLayout(): LayoutName {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
  if (stored && isLayoutName(stored)) return stored
  return DEFAULT_LAYOUT
}

export function setStoredLayout(layout: LayoutName): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LAYOUT_STORAGE_KEY, layout)
}