import axios, { AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { mockRequest } from './mock'

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
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    try {
      return await mockRequest<T>(config)
    } catch (error) {
      const message = error instanceof Error ? error.message : '接口调用失败'
      ElMessage.error(message)
      throw error
    }
  }

  try {
    const response = await http.request(config)
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
