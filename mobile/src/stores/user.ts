import { defineStore } from 'pinia'
import { loginApi, meApi, UserInfo } from '../api/auth'
import { clearAuth, getStoredUser, getToken, setAuth } from '../utils/auth'
import { canAccessMenu, MobileMenuKey, roleCodeOf } from '../utils/permission'

export const useUserStore = defineStore('mobileUser', {
  state: () => ({
    token: getToken(),
    user: getStoredUser() as UserInfo | null,
    currentWarehouse: localStorage.getItem('wms_mobile_warehouse') || 'WH-HZ-CENTRAL'
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    roleCode: (state) => roleCodeOf(state.user)
  },
  actions: {
    async login(username: string, password: string) {
      const data = await loginApi(username, password)
      this.token = data.token
      this.user = data.user
      setAuth(data.token, data.user)
    },
    async loadMe() {
      if (!this.token) return
      try {
        this.user = await meApi()
        setAuth(this.token, this.user)
      } catch {
        this.logout()
      }
    },
    canAccess(menuKey: MobileMenuKey) {
      return canAccessMenu(menuKey, this.user)
    },
    setWarehouse(code: string) {
      this.currentWarehouse = code
      localStorage.setItem('wms_mobile_warehouse', code)
    },
    logout() {
      this.token = ''
      this.user = null
      clearAuth()
    }
  }
})
