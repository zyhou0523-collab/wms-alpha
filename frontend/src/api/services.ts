import type { PageResult } from './http'
import { request } from './http'
import type { ExportFile, ImportResult } from '../utils/fileTransfer'

export interface ListParams {
  pageNum?: number
  pageSize?: number
  [key: string]: unknown
}

export function loginApi(username: string, password: string) {
  return request<{ token: string; user: any }>({
    url: '/auth/login',
    method: 'post',
    data: { username, password }
  })
}

export function meApi() {
  return request<any>({ url: '/auth/me', method: 'get' })
}

export function menuApi() {
  return request<any[]>({ url: '/menus', method: 'get' })
}

function list<T = any>(url: string, params: ListParams) {
  return request<PageResult<T>>({ url, method: 'get', params })
}

function create(url: string, data: Record<string, unknown>) {
  return request<string>({ url, method: 'post', data })
}

function update(url: string, id: number, data: Record<string, unknown>) {
  return request<string>({ url: `${url}/${id}`, method: 'put', data })
}

function remove(url: string, id: number) {
  return request<string>({ url: `${url}/${id}`, method: 'delete' })
}

export const productService = {
  list: (params: ListParams) => list('/products', params),
  options: (params: ListParams) => request<any[]>({ url: '/products/options', method: 'get', params }),
  create: (data: Record<string, unknown>) => create('/products', data),
  update: (id: number, data: Record<string, unknown>) => update('/products', id, data),
  remove: (id: number) => remove('/products', id),
  exportTemplate: () => request<ExportFile>({ url: '/products/export-template', method: 'get' }),
  importRows: (rows: Record<string, unknown>[]) => request<ImportResult>({ url: '/products/import', method: 'post', data: { rows } }),
  exportData: (params: ListParams) => request<ExportFile>({ url: '/products/export', method: 'get', params })
}

export const customerService = {
  list: (params: ListParams) => list('/customers', params),
  options: (params: ListParams) => request<any[]>({ url: '/customers/options', method: 'get', params }),
  create: (data: Record<string, unknown>) => create('/customers', data),
  update: (id: number, data: Record<string, unknown>) => update('/customers', id, data),
  remove: (id: number) => remove('/customers', id),
  exportTemplate: () => request<ExportFile>({ url: '/customers/export-template', method: 'get' }),
  importRows: (rows: Record<string, unknown>[]) => request<ImportResult>({ url: '/customers/import', method: 'post', data: { rows } }),
  exportData: (params: ListParams) => request<ExportFile>({ url: '/customers/export', method: 'get', params })
}

export const warehouseService = {
  list: (params: ListParams) => list('/warehouses', params),
  create: (data: Record<string, unknown>) => create('/warehouses', data),
  update: (id: number, data: Record<string, unknown>) => update('/warehouses', id, data),
  remove: (id: number) => remove('/warehouses', id)
}

export const locationService = {
  list: (params: ListParams) => list('/locations', params),
  create: (data: Record<string, unknown>) => create('/locations', data),
  update: (id: number, data: Record<string, unknown>) => update('/locations', id, data),
  remove: (id: number) => remove('/locations', id)
}

export const inventoryService = {
  list: (params: ListParams) => list('/inventory', params),
  transactions: (params: ListParams) => list('/inventory/transactions', params)
}

export const inventoryCountService = {
  list: (params: ListParams) => list('/inventory/count-orders', params),
  detail: (id: number) => request<any>({ url: `/inventory/count-orders/${id}`, method: 'get' }),
  create: (data: Record<string, unknown>) => request<any>({ url: '/inventory/count-orders', method: 'post', data }),
  generateLines: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/count-orders/${id}/generate-lines`, method: 'post', data }),
  record: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inventory/count-orders/${id}/record`, method: 'post', data }),
  confirmDifference: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/count-orders/${id}/confirm-difference`, method: 'post', data }),
  adjust: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/count-orders/${id}/adjust`, method: 'post', data }),
  cancel: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/count-orders/${id}/cancel`, method: 'post', data })
}

export const inventoryMoveService = {
  list: (params: ListParams) => list('/inventory/move-orders', params),
  detail: (id: number) => request<any>({ url: `/inventory/move-orders/${id}`, method: 'get' }),
  create: (data: Record<string, unknown>) => request<any>({ url: '/inventory/move-orders', method: 'post', data }),
  confirm: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/move-orders/${id}/confirm`, method: 'post', data }),
  cancel: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inventory/move-orders/${id}/cancel`, method: 'post', data }),
  stockCandidates: (params: ListParams) => request<any>({ url: '/inventory/move-orders/stock-candidates', method: 'get', params })
}

export const snService = {
  list: (params: ListParams) => list('/serial-numbers', params)
}

export const inboundService = {
  list: (params: ListParams) => list('/inbound-orders', params),
  create: (data: Record<string, unknown>) => request<any>({ url: '/inbound-orders', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${id}`, method: 'put', data }),
  detail: (id: number) => request<any>({ url: `/inbound-orders/${id}`, method: 'get' }),
  cancel: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inbound-orders/${id}/cancel`, method: 'post', data }),
  close: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inbound-orders/${id}/close`, method: 'post', data }),
  receive: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${id}/receive`, method: 'post', data }),
  cancelReceipt: (id: number, receiptId: number, data: Record<string, unknown> = {}) => request<any>({ url: `/inbound-orders/${id}/receipts/${receiptId}/cancel`, method: 'post', data }),
  bindPackage: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${id}/bind-package`, method: 'post', data }),
  snCollectOrderContext: (orderId: number) => request<any>({ url: `/inbound-orders/${orderId}/sn-collect-context`, method: 'get' }),
  snCollectContext: (orderId: number, lineId: number) => request<any>({ url: `/inbound-orders/${orderId}/lines/${lineId}/sn-collect-context`, method: 'get' }),
  collectedSns: (orderId: number, lineId: number) => request<any[]>({ url: `/inbound-orders/${orderId}/lines/${lineId}/collected-sns`, method: 'get' }),
  validateSnCollection: (orderId: number, lineId: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${orderId}/lines/${lineId}/validate-sn-collection`, method: 'post', data }),
  confirmSnCollection: (orderId: number, lineId: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${orderId}/lines/${lineId}/confirm-sn-collection`, method: 'post', data }),
  cancelSnCollection: (orderId: number, lineId: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${orderId}/lines/${lineId}/cancel-sn-collection`, method: 'post', data }),
  sapPost: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound-orders/${id}/post-sap`, method: 'post', data }),
  retrySap: (orderIds: number[]) => request<any>({ url: '/inbound-orders/retry-sap', method: 'post', data: { orderIds } }),
  importTemplate: () => request<ExportFile>({ url: '/inbound-orders/import-template', method: 'get' }),
  importRows: (headers: Record<string, unknown>[], lines: Record<string, unknown>[]) => request<ImportResult>({ url: '/inbound-orders/import', method: 'post', data: { headers, lines } }),
  exportData: (data: Record<string, unknown>) => request<ExportFile>({ url: '/inbound-orders/export', method: 'post', data })
}

export const snBindingService = {
  list: (params: ListParams) => list('/inbound/sn-bindings', params),
  remove: (id: number) => remove('/inbound/sn-bindings', id),
  bulkRemove: (ids: number[]) => request<any>({ url: '/inbound/sn-bindings/bulk-delete', method: 'post', data: { ids } }),
  exportData: (params: ListParams) => request<ExportFile>({ url: '/inbound/sn-bindings/export', method: 'get', params })
}

export const productionInboundService = {
  list: (params: ListParams) => list('/inbound/production-orders', params),
  create: (data: Record<string, unknown>) => request<any>({ url: '/inbound/production-orders', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound/production-orders/${id}`, method: 'put', data }),
  detail: (id: number) => request<any>({ url: `/inbound/production-orders/${id}`, method: 'get' }),
  receive: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound/production-orders/${id}/receive`, method: 'post', data }),
  bindPackage: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound/production-orders/${id}/bind-package`, method: 'post', data }),
  putaway: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound/production-orders/${id}/putaway`, method: 'post', data }),
  sapPost: (id: number, data: Record<string, unknown>) => request<any>({ url: `/inbound/production-orders/${id}/sap-post`, method: 'post', data }),
  mesSnPush: (data: Record<string, unknown>) => request<any>({ url: '/mock/mes/sn-push', method: 'post', data }),
  sapProductionOrder: (data: Record<string, unknown>) => request<any>({ url: '/mock/sap/production-orders', method: 'post', data })
}

export const outboundService = {
  list: (params: ListParams) => list('/outbound-orders', params),
  salesList: (params: ListParams) => list('/outbound/sales-orders', params),
  transferList: (params: ListParams) => list('/outbound/transfer-orders', params),
  pickingTasks: (params: ListParams) => list('/outbound/picking-tasks', params),
  create: (data: Record<string, unknown>) => request<any>({ url: '/outbound-orders', method: 'post', data }),
  update: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound-orders/${id}`, method: 'put', data }),
  createSalesMock: (data: Record<string, unknown>) => request<any>({ url: '/outbound/sales-orders/mock', method: 'post', data }),
  createTransferMock: (data: Record<string, unknown>) => request<any>({ url: '/outbound/transfer-orders/mock', method: 'post', data }),
  createShippingMock: (data: Record<string, unknown>) => request<any>({ url: '/outbound-orders', method: 'post', data }),
  detail: (id: number) => request<any>({ url: `/outbound-orders/${id}`, method: 'get' }),
  allocationCandidates: (id: number) => request<any>({ url: `/outbound-orders/${id}/allocation-candidates`, method: 'get' }),
  allocationView: (id: number) => request<any>({ url: `/outbound-orders/${id}/allocations`, method: 'get' }),
  allocateAuto: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/allocate-auto`, method: 'post', data }),
  allocateManual: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound-orders/${id}/allocate-manual`, method: 'post', data }),
  releaseAllocation: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/release-allocation`, method: 'post', data }),
  cancelAllocation: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/release-allocation`, method: 'post', data }),
  cancelAllocations: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/allocations/cancel`, method: 'post', data }),
  generatePickingTasks: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/picking-tasks`, method: 'post', data }),
  pick: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound-orders/${id}/pick`, method: 'post', data }),
  pickScan: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound-orders/${id}/pick-scan`, method: 'post', data }),
  cancelPick: (id: number, pickId: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/picks/${pickId}/cancel`, method: 'post', data }),
  cancelPicks: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/picks/cancel`, method: 'post', data }),
  pickingList: (id: number) => request<any>({ url: `/outbound-orders/${id}/picking-list`, method: 'get' }),
  scanPicking: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound/picking-tasks/${id}/scan`, method: 'post', data }),
  pickingException: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound/picking-tasks/${id}/exception`, method: 'post', data }),
  review: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound/orders/${id}/review`, method: 'post', data }),
  ship: (id: number, data: Record<string, unknown>) => request<any>({ url: `/outbound-orders/${id}/ship`, method: 'post', data }),
  shipments: (id: number) => request<any>({ url: `/outbound-orders/${id}/shipments`, method: 'get' }),
  cancelShipment: (id: number, shipmentId: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/shipments/${shipmentId}/cancel`, method: 'post', data }),
  cancelShipments: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/shipments/cancel`, method: 'post', data }),
  close: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/close`, method: 'post', data }),
  cancel: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/cancel`, method: 'post', data }),
  postSap: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/post-sap`, method: 'post', data }),
  retrySapPost: (data: Record<string, unknown> = {}) => request<any>({ url: '/outbound-orders/retry-sap', method: 'post', data }),
  importTemplate: () => request<ExportFile>({ url: '/outbound-orders/import-template', method: 'get' }),
  importRows: (headers: Record<string, unknown>[], lines: Record<string, unknown>[]) => request<ImportResult>({ url: '/outbound-orders/import', method: 'post', data: { headers, lines } }),
  traceCallback: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound/orders/${id}/trace-callback`, method: 'post', data }),
  sapCallback: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/outbound-orders/${id}/post-sap`, method: 'post', data }),
  interfaceLogs: (id: number) => request<any>({ url: `/outbound-orders/${id}/interface-logs`, method: 'get' }),
  statusFlow: (id: number) => request<any>({ url: `/outbound-orders/${id}/status-flow`, method: 'get' })
}

export const codePrintService = {
  getAuthorizedWarehouses: () => request<any>({ url: '/outbound/code-print/warehouses', method: 'get', params: { pageNum: 1, pageSize: 200, status: 'ACTIVE' } }),
  generatePalletCodes: (data: Record<string, unknown>) => request<any>({ url: '/outbound/code-print/pallet/generate', method: 'post', data }),
  generateBoxCodes: (data: Record<string, unknown>) => request<any>({ url: '/outbound/code-print/box/generate', method: 'post', data }),
  searchPalletCode: (palletCode: string) => request<any>({ url: `/outbound/code-print/pallet/${encodeURIComponent(palletCode)}`, method: 'get' }),
  searchBoxCode: (boxCode: string) => request<any>({ url: `/outbound/code-print/box/${encodeURIComponent(boxCode)}`, method: 'get' }),
  reprintPalletCode: (palletCode: string) => request<any>({ url: `/outbound/code-print/pallet/${encodeURIComponent(palletCode)}/reprint`, method: 'post', data: {} }),
  reprintBoxCode: (boxCode: string) => request<any>({ url: `/outbound/code-print/box/${encodeURIComponent(boxCode)}/reprint`, method: 'post', data: {} }),
  getCodePrintRecords: (params: ListParams) => list('/outbound/code-print/records', params),
  checkCodeUnique: (code: string, type: string) => request<any>({ url: '/outbound/code-print/check-unique', method: 'get', params: { code, type } })
}

export const interfaceLogService = {
  list: (params: ListParams) => list('/interface-logs', params),
  retry: (id: number, data: Record<string, unknown> = {}) => request<any>({ url: `/interface-logs/${id}/retry`, method: 'post', data })
}

export const mockConfigService = {
  list: (params: ListParams) => list('/mock-configs', params),
  update: (id: number, data: Record<string, unknown>) => request<any>({ url: `/mock-configs/${id}`, method: 'put', data })
}

export const userService = {
  list: (params: ListParams) => list('/system/users', params)
}

export const systemService = {
  list: (resource: string, params: ListParams) => list(`/system/${resource}`, params),
  create: (resource: string, data: Record<string, unknown>) => create(`/system/${resource}`, data),
  update: (resource: string, id: number, data: Record<string, unknown>) => update(`/system/${resource}`, id, data),
  remove: (resource: string, id: number) => remove(`/system/${resource}`, id),
  resetPassword: (id: number, password = '123456') => request<any>({ url: `/system/users/${id}/reset-password`, method: 'post', data: { password } }),
  userRoles: (id: number) => request<any[]>({ url: `/system/users/${id}/roles`, method: 'get' }),
  saveUserRoles: (id: number, roleIds: number[]) => request<any>({ url: `/system/users/${id}/roles`, method: 'post', data: { roleIds } }),
  roleMenus: (id: number) => request<number[]>({ url: `/system/roles/${id}/menus`, method: 'get' }),
  saveRoleMenus: (id: number, menuIds: number[]) => request<any>({ url: `/system/roles/${id}/menus`, method: 'post', data: { menuIds } }),
  menuTree: () => request<any[]>({ url: '/system/menus/tree', method: 'get' })
}

export function dashboardSummaryApi() {
  return request<any>({ url: '/dashboard/summary', method: 'get' })
}
