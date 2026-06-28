import axios, { AxiosRequestConfig } from 'axios'
import { showToast } from 'vant'
import router from '../router'
import { clearAuth, getToken } from '../utils/auth'
import { mockRequest } from './mock'

export interface PageResult<T = Record<string, unknown>> {
  items: T[]
  total: number
  pageNum: number
  pageSize: number
}

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const http = axios.create({
  baseURL,
  timeout: 15000
})

const useMock = import.meta.env.VITE_USE_MOCK === 'true' || (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false')

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuth()
      showToast('登录已过期，请重新登录')
      router.replace('/login')
    }
    return Promise.reject(error)
  }
)

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  if (useMock) {
    try {
      return await mockRequest<T>(config)
    } catch (error) {
      const message = error instanceof Error ? error.message : '操作失败'
      showToast(message)
      throw error
    }
  }

  try {
    const response = await http.request(config)
    const payload = response.data
    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code !== 0) {
        throw new Error(payload.message || '操作失败')
      }
      return payload.data as T
    }
    return payload as T
  } catch (error) {
    const message = error instanceof Error ? error.message : '网络异常，请稍后重试'
    showToast(message)
    throw error
  }
}
