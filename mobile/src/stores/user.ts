import { defineStore } from 'pinia'
import { loginApi, meApi, UserInfo } from '../api/auth'
import { clearAuth, getStoredUser, getToken, setAuth } from '../utils/auth'
import { canAccessMenu, MobileMenuKey, roleCodeOf } from '../utils/permission'
import { useWarehouseStore } from './warehouse'

export const useUserStore = defineStore('mobileUser', {
  state: () => ({
    token: getToken(),
    user: getStoredUser() as UserInfo | null
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token),
    roleCode: (state) => roleCodeOf(state.user),
    currentWarehouse: () => useWarehouseStore().currentWarehouseName
  },
  actions: {
    async login(username: string, password: string) {
      const data = await loginApi(username, password)
      this.token = data.token
      this.user = data.user
      setAuth(data.token, data.user)
      useWarehouseStore().initFromUser(data.user)
    },
    async loadMe() {
      if (!this.token) return
      try {
        this.user = await meApi()
        setAuth(this.token, this.user)
        useWarehouseStore().initFromUser(this.user)
      } catch {
        this.logout()
      }
    },
    canAccess(menuKey: MobileMenuKey) {
      return canAccessMenu(menuKey, this.user)
    },
    logout() {
      useWarehouseStore().clear(this.user?.username)
      this.token = ''
      this.user = null
      clearAuth()
    }
  }
})
