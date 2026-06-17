import { defineStore } from 'pinia'
import { loginApi, meApi } from '../api/services'

export interface UserInfo {
  id?: number
  username: string
  display_name?: string
  role_code?: string
  role_name?: string
  status?: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('wms_token') || '',
    user: JSON.parse(localStorage.getItem('wms_user') || 'null') as UserInfo | null
  }),
  actions: {
    async login(username: string, password: string) {
      const data = await loginApi(username, password)
      this.token = data.token
      this.user = data.user
      localStorage.setItem('wms_token', data.token)
      localStorage.setItem('wms_user', JSON.stringify(data.user))
    },
    async loadMe() {
      if (!this.token) return
      this.user = await meApi()
      localStorage.setItem('wms_user', JSON.stringify(this.user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('wms_token')
      localStorage.removeItem('wms_user')
    }
  }
})

