/**
 * Auth context — provides current user and auth actions to entire app.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '@/api/endpoints'
import { authStore } from '@/store/authStore'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!authStore.isAuthenticated()) {
      setIsLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data)
    } catch {
      authStore.clear()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const login = useCallback(async (username: string, password: string) => {
    const { data: tokens } = await authApi.login(username, password)
    authStore.setTokens(tokens.access_token, tokens.refresh_token)
    const { data: me } = await authApi.me()
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    const refresh = authStore.getRefreshToken()
    if (refresh) {
      try {
        await authApi.logout(refresh)
      } catch { /* ignore */ }
    }
    authStore.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
