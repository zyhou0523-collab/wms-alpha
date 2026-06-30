import axios, { AxiosRequestConfig } from 'axios'
import router from '../router'
import { clearAuth, getToken } from '../utils/auth'
import { fail } from '../utils/feedback'
import { mockRequest } from './mock'

export interface PageResult<T = Record<string, unknown>> {
  items: T[]
  total: number
  pageNum: number
  pageSize: number
}

export const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api'
export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true' || (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false')

const http = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000
})

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
      fail('登录已过期，请重新登录')
      router.replace('/login')
    }
    return Promise.reject(error)
  }
)

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return isMockMode ? mockApiRequest<T>(config) : realApiRequest<T>(config)
}

export async function mockApiRequest<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    return await mockRequest<T>(config)
  } catch (error) {
    fail(errorMessage(error, '操作失败'))
    throw error
  }
}

export async function realApiRequest<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await http.request(normalizeRealRequestConfig(config))
    const payload = response.data
    if (payload && typeof payload === 'object' && 'code' in payload) {
      if (payload.code !== 0) {
        throw new Error(payload.message || '操作失败')
      }
      return payload.data as T
    }
    return payload as T
  } catch (error) {
    fail(errorMessage(error, '网络异常，请稍后重试'))
    throw error
  }
}

// PC and mobile services often pass URLs with /api. Avoid /api/api when baseURL is also /api.
function normalizeRealRequestConfig(config: AxiosRequestConfig): AxiosRequestConfig {
  const url = String(config.url || '')
  if (apiBaseURL.replace(/\/$/, '') === '/api' && url.startsWith('/api/')) {
    return {
      ...config,
      url: url.replace(/^\/api/, '')
    }
  }
  return config
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error && 'response' in error) {
    const data = (error as { response?: { data?: { message?: string } } }).response?.data
    if (data?.message) return data.message
  }
  return fallback
}
