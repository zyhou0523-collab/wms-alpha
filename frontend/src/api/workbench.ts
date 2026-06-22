import { request } from './http'

export interface InventoryQueryParams {
  productCode?: string
  productName?: string
  warehouseCode?: string
  owner?: string
  limit?: number
}

export const workbenchApi = {
  get: () => request<any>({ url: '/workbench', method: 'get' }),
  summary: () => request<any>({ url: '/workbench/summary', method: 'get' }),
  inventoryQuery: (params: InventoryQueryParams) => request<any[]>({ url: '/workbench/inventory-query', method: 'get', params }),
  todoList: () => request<any[]>({ url: '/workbench/todo-list', method: 'get' }),
  pendingInbound: (limit = 8) => request<any[]>({ url: '/workbench/pending-inbound', method: 'get', params: { limit } }),
  pendingOutbound: (limit = 8) => request<any[]>({ url: '/workbench/pending-outbound', method: 'get', params: { limit } })
}
