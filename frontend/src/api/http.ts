import axios, { AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { mockRequest } from './mock'
import { appendWarehouseContextToData, appendWarehouseScopeToParams } from '../utils/warehouseAccess'

export interface PageResult<T = Record<string, unknown>> {
  items: T[]
  total: number
  pageNum: number
  pageSize: number
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('wms_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const scopedConfig = withWarehouseContext(config)
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    try {
      return await mockRequest<T>(scopedConfig)
    } catch (error) {
      const message = error instanceof Error ? error.message : '接口调用失败'
      ElMessage.error(message)
      throw error
    }
  }

  try {
    const response = await http.request(scopedConfig)
    const payload = response.data
    if (payload.code !== 0) {
      throw new Error(payload.message || '接口调用失败')
    }
    return payload.data as T
  } catch (error) {
    const message = error instanceof Error ? error.message : '接口调用失败'
    ElMessage.error(message)
    throw error
  }
}

function withWarehouseContext(config: AxiosRequestConfig): AxiosRequestConfig {
  const url = String(config.url || '')
  const method = String(config.method || 'get').toLowerCase()
  if (isWarehouseContextExcluded(url)) return config
  if (method === 'get') {
    return {
      ...config,
      params: appendWarehouseScopeToParams((config.params || {}) as Record<string, unknown>)
    }
  }
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    return {
      ...config,
      data: appendWarehouseContextToData((config.data || {}) as Record<string, unknown>)
    }
  }
  return config
}

function isWarehouseContextExcluded(url: string) {
  const normalized = url.replace(/^\/api/, '')
  return [
    '/auth/login',
    '/auth/me',
    '/menus',
    '/system',
    '/products/options',
    '/customers/options'
  ].some((path) => normalized === path || normalized.startsWith(`${path}/`))
}
