import type { UserInfo } from '../api/auth'

const TOKEN_KEY = 'wms_mobile_token'
const USER_KEY = 'wms_mobile_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getStoredUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export function setAuth(token: string, user: UserInfo) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
