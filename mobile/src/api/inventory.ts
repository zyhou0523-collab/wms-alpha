import { PageResult, request } from './request'

export interface InventoryRow {
  id: number
  warehouse_code?: string
  warehouse_name?: string
  location_code?: string
  product_code?: string
  product_name?: string
  total_qty?: number
  available_qty?: number
  allocated_qty?: number
  inventory_status?: string
}

export interface WorkbenchSummary {
  pendingReceiveCount?: number
  pendingPickCount?: number
  pendingShipCount?: number
}

export function getWorkbenchSummary() {
  return request<WorkbenchSummary>({
    url: '/api/workbench/summary',
    method: 'get'
  })
}

export function listInventory(params: Record<string, unknown> = {}) {
  return request<PageResult<InventoryRow>>({
    url: '/api/inventory',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}

export function listSerialNumbers(params: Record<string, unknown> = {}) {
  return request<PageResult<Record<string, unknown>>>({
    url: '/api/serial-numbers',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}
