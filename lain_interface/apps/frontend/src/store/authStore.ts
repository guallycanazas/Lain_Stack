/**
 * Auth store — persists tokens in localStorage.
 * Simple reactive store without external state library.
 */

const ACCESS_TOKEN_KEY = 'ct_access'
const REFRESH_TOKEN_KEY = 'ct_refresh'

export const authStore = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
  isAuthenticated: (): boolean => !!localStorage.getItem(ACCESS_TOKEN_KEY),
}
