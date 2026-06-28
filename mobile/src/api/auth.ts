import { request } from './request'

export interface LoginResult {
  token: string
  user: UserInfo
}

export interface UserInfo {
  id?: number
  username: string
  display_name?: string
  role_code?: string
  role_name?: string
  warehouse_scope?: string
  status?: string
}

export function loginApi(username: string, password: string) {
  return request<LoginResult>({
    url: '/api/auth/login',
    method: 'post',
    data: { username, password }
  })
}

export function meApi() {
  return request<UserInfo>({
    url: '/api/auth/me',
    method: 'get'
  })
}
