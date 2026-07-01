export const ALL_WAREHOUSE_CODE = 'ALL'

export interface WarehouseOption {
  id?: number
  warehouse_code: string
  warehouse_name: string
  warehouse_type?: string
  code_prefix?: string
  status?: string
}

export interface WarehouseUser {
  username?: string
  role_code?: string
  warehouse_scope?: string
  authorized_warehouses?: Array<Record<string, any>>
}

export interface WarehouseContext {
  selectedWarehouseCode: string
  authorizedWarehouseCodes: string[]
  isAllWarehouse: boolean
}

export const DEMO_WAREHOUSES: WarehouseOption[] = [
  { id: 1, warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '成品仓', warehouse_type: 'FINISHED_GOODS', code_prefix: 'FG', status: 'ACTIVE' },
  { id: 2, warehouse_code: 'WH-GZ-3PL', warehouse_name: '原材料仓', warehouse_type: 'RAW_MATERIAL', code_prefix: 'RM', status: 'ACTIVE' },
  { id: 3, warehouse_code: 'WH-SZ-AFTERSALE', warehouse_name: '半成品仓', warehouse_type: 'WIP', code_prefix: 'WIP', status: 'ACTIVE' },
  { id: 4, warehouse_code: 'WH-SH-REGION', warehouse_name: '新能源仓', warehouse_type: 'NEW_ENERGY', code_prefix: 'NE', status: 'ACTIVE' },
  { id: 5, warehouse_code: 'WH-CUST-TESLA-VMI', warehouse_name: '客户 VMI 仓', warehouse_type: 'CUSTOMER_VMI', code_prefix: 'CVMI', status: 'ACTIVE' },
  { id: 6, warehouse_code: 'WH-SUP-CATL-VMI', warehouse_name: '供应商 VMI 仓', warehouse_type: 'SUPPLIER_VMI', code_prefix: 'SVMI', status: 'ACTIVE' }
]

export const DEMO_USER_WAREHOUSE_SCOPE: Record<string, string[] | '*'> = {
  admin: '*',
  wh_admin: ['WH-HZ-CENTRAL', 'WH-GZ-3PL'],
  logistics: ['WH-SH-REGION'],
  mobile: ['WH-HZ-CENTRAL', 'WH-SH-REGION'],
  demo: ['WH-HZ-CENTRAL', 'WH-SH-REGION']
}

export function authorizedWarehousesForUser(user?: WarehouseUser | null, allWarehouses: WarehouseOption[] = DEMO_WAREHOUSES) {
  if (Array.isArray(user?.authorized_warehouses) && user.authorized_warehouses.length) {
    return user.authorized_warehouses
      .filter((row) => row.warehouse_code && row.warehouse_name)
      .map((row) => row as WarehouseOption)
  }
  const scope = String(user?.warehouse_scope || '').trim()
  const username = String(user?.username || 'admin')
  const mapped = DEMO_USER_WAREHOUSE_SCOPE[username] ?? (String(user?.role_code || '').toUpperCase() === 'ADMIN' ? '*' : ['WH-HZ-CENTRAL'])
  const codes = scope && scope !== '*'
    ? scope.split(',').map((item) => item.trim()).filter(Boolean)
    : mapped === '*' ? allWarehouses.map((row) => row.warehouse_code) : mapped
  return allWarehouses.filter((row) => codes.includes(row.warehouse_code))
}

export function makeWarehouseContext(selectedWarehouseCode: string, authorizedWarehouseCodes: string[]): WarehouseContext {
  const authorized = authorizedWarehouseCodes.filter(Boolean)
  const selected = selectedWarehouseCode && (selectedWarehouseCode === ALL_WAREHOUSE_CODE || authorized.includes(selectedWarehouseCode))
    ? selectedWarehouseCode
    : ALL_WAREHOUSE_CODE
  return { selectedWarehouseCode: selected, authorizedWarehouseCodes: authorized, isAllWarehouse: selected === ALL_WAREHOUSE_CODE }
}

export function getWarehouseQueryScope(context: WarehouseContext) {
  if (!context.authorizedWarehouseCodes.length) return { warehouseCodes: '__NO_AUTH__' }
  if (context.isAllWarehouse) return { warehouseCodes: context.authorizedWarehouseCodes.join(',') }
  return { warehouseCode: context.selectedWarehouseCode }
}

export function validateWarehouseAccess(row: Record<string, unknown>, context: WarehouseContext) {
  const code = String(row.warehouse_code || row.warehouseCode || '')
  const name = String(row.warehouse_name || row.warehouseName || code || '未知仓库')
  if (!code) return { valid: true, warehouseCode: code, warehouseName: name, message: '' }
  if (!context.authorizedWarehouseCodes.includes(code)) {
    return { valid: false, warehouseCode: code, warehouseName: name, message: '当前账号未授权访问该仓库。' }
  }
  if (!context.isAllWarehouse && context.selectedWarehouseCode !== code) {
    const selectedName = DEMO_WAREHOUSES.find((row) => row.warehouse_code === context.selectedWarehouseCode)?.warehouse_name || context.selectedWarehouseCode
    return { valid: false, warehouseCode: code, warehouseName: name, message: `当前单据属于【${name}】，当前选择仓库为【${selectedName}】，无法操作。` }
  }
  return { valid: true, warehouseCode: code, warehouseName: name, message: context.isAllWarehouse ? `当前选择为全部仓库，系统将按对象所属仓库【${name}】执行本次操作。` : '' }
}

export function currentWarehouseStorageKey(username?: string) {
  return `wms_mobile_current_warehouse_${username || 'anonymous'}`
}

export function currentWarehouseContextFromStorage(): WarehouseContext {
  const user = safeJson<WarehouseUser>(localStorage.getItem('wms_mobile_user')) || { username: 'admin', warehouse_scope: '*' }
  const authorized = authorizedWarehousesForUser(user).map((row) => row.warehouse_code)
  const selected = localStorage.getItem(currentWarehouseStorageKey(user.username)) || ALL_WAREHOUSE_CODE
  return makeWarehouseContext(selected, authorized)
}

export function appendWarehouseScopeToParams(params: Record<string, unknown> = {}) {
  if ('warehouseCode' in params || 'warehouseCodes' in params || 'warehouse_code' in params) return params
  return { ...getWarehouseQueryScope(currentWarehouseContextFromStorage()), ...params }
}

export function appendWarehouseContextToData(data: Record<string, unknown> = {}) {
  if ('warehouseContext' in data) return data
  return { ...data, warehouseContext: currentWarehouseContextFromStorage() }
}

function safeJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
