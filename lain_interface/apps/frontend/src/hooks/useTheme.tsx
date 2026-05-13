import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

import {
  DEFAULT_THEME,
  DEFAULT_LAYOUT,
  type ThemeName,
  type ThemeOption,
  type LayoutName,
  THEME_OPTIONS,
  LAYOUT_OPTIONS,
  getStoredTheme,
  setStoredTheme,
  getStoredLayout,
  setStoredLayout,
} from '@/store/themeStore'

interface LayoutOption {
  value: LayoutName
  label: string
  icon: string
}

interface ThemeContextValue {
  theme: ThemeName
  layout: LayoutName
  themeOptions: readonly ThemeOption[]
  layoutOptions: readonly LayoutOption[]
  setTheme: (theme: ThemeName) => void
  setLayout: (layout: LayoutName) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
}

function getInitialTheme(): ThemeName {
  const stored = getStoredTheme()
  applyTheme(stored)
  return stored
}

function getInitialLayout(): LayoutName {
  return getStoredLayout()
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeState, setThemeState] = useState<ThemeName>(getInitialTheme)
  const [layoutState, setLayoutState] = useState<LayoutName>(getInitialLayout)

  const setTheme = useCallback((theme: ThemeName) => {
    setThemeState(theme)
    setStoredTheme(theme)
    applyTheme(theme)
  }, [])

  const setLayout = useCallback((layout: LayoutName) => {
    setLayoutState(layout)
    setStoredLayout(layout)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themeState,
      layout: layoutState,
      themeOptions: THEME_OPTIONS,
      layoutOptions: LAYOUT_OPTIONS.map(l => ({ value: l.value, label: l.label, icon: l.icon })) as readonly LayoutOption[],
      setTheme,
      setLayout,
    }),
    [themeState, layoutState, setTheme, setLayout],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}