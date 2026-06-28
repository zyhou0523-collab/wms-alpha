import { request } from './http'

export interface DashboardFilter {
  level?: 'GROUP' | 'REGION' | 'WAREHOUSE'
  region?: string
  warehouseId?: number | string
  ownerCode?: string
}

export const dashboardApi = {
  summary: (params: DashboardFilter) => request<any>({ url: '/dashboard/summary', method: 'get', params }),
  inventoryStructure: (params: DashboardFilter) => request<any[]>({ url: '/dashboard/inventory-structure', method: 'get', params }),
  warehouseMap: (params: DashboardFilter) => request<any[]>({ url: '/dashboard/warehouse-map', method: 'get', params }),
  inoutTrend: (params: DashboardFilter) => request<any>({ url: '/dashboard/inout-trend', method: 'get', params }),
  warehouseOperations: (params: DashboardFilter) => request<any[]>({ url: '/dashboard/warehouse-operation', method: 'get', params }),
  safetyWarnings: (params: DashboardFilter & { limit?: number }) => request<any[]>({ url: '/dashboard/safety-warnings', method: 'get', params }),
  agingWarnings: (params: DashboardFilter & { limit?: number }) => request<any[]>({ url: '/dashboard/aging-warnings', method: 'get', params })
}
