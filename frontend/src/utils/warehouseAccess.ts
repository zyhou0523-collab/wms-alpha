export const ALL_WAREHOUSE_CODE = 'ALL'

export interface WarehouseOption {
  id?: number
  warehouse_code: string
  warehouse_name: string
  warehouse_type?: string
  organization?: string
  region?: string
  country?: string
  city?: string
  manager?: string
  contact?: string
  code_prefix?: string
  status?: string
  remark?: string
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
  { id: 1, warehouse_code: 'HZ', warehouse_name: '杭州仓', organization: '集团', region: '中国', warehouse_type: '综合仓', country: '中国', city: '杭州', manager: '张伟', contact: '13800001001', code_prefix: 'HZ', status: 'ACTIVE', remark: '集团国内主仓' },
  { id: 2, warehouse_code: 'NB', warehouse_name: '宁波仓', organization: '集团', region: '中国', warehouse_type: '成品仓', country: '中国', city: '宁波', manager: '李敏', contact: '13800001002', code_prefix: 'NB', status: 'ACTIVE', remark: '华东港口成品仓' },
  { id: 3, warehouse_code: 'SD', warehouse_name: '顺德仓', organization: '集团', region: '中国', warehouse_type: '制造仓', country: '中国', city: '顺德', manager: '王强', contact: '13800001003', code_prefix: 'SD', status: 'ACTIVE', remark: '华南制造配套仓' },
  { id: 4, warehouse_code: 'NL', warehouse_name: '荷兰仓', organization: '欧洲地区部', region: '欧洲', warehouse_type: '海外仓', country: '荷兰', city: '鹿特丹', manager: 'Emma', contact: '+31-20-0001', code_prefix: 'NL', status: 'ACTIVE', remark: '欧洲中心仓' },
  { id: 5, warehouse_code: 'PL', warehouse_name: '波兰仓', organization: '欧洲地区部', region: '欧洲', warehouse_type: '海外仓', country: '波兰', city: '华沙', manager: 'Marek', contact: '+48-22-0001', code_prefix: 'PL', status: 'ACTIVE', remark: '欧洲东部交付仓' },
  { id: 6, warehouse_code: 'ES', warehouse_name: '西班牙仓', organization: '欧洲地区部', region: '欧洲', warehouse_type: '海外仓', country: '西班牙', city: '马德里', manager: 'Carlos', contact: '+34-91-0001', code_prefix: 'ES', status: 'ACTIVE', remark: '南欧销售仓' },
  { id: 7, warehouse_code: 'RO', warehouse_name: '罗马尼亚仓', organization: '欧洲地区部', region: '欧洲', warehouse_type: '海外仓', country: '罗马尼亚', city: '布加勒斯特', manager: 'Andrei', contact: '+40-21-0001', code_prefix: 'RO', status: 'ACTIVE', remark: '欧洲备件仓' },
  { id: 8, warehouse_code: 'PH', warehouse_name: '菲律宾仓', organization: '东南亚地区部', region: '东南亚', warehouse_type: '海外仓', country: '菲律宾', city: '马尼拉', manager: 'Jose', contact: '+63-2-0001', code_prefix: 'PH', status: 'ACTIVE', remark: '东南亚销售仓' },
  { id: 9, warehouse_code: 'BD', warehouse_name: '孟加拉仓', organization: '东南亚地区部', region: '东南亚', warehouse_type: '海外仓', country: '孟加拉', city: '达卡', manager: 'Rahman', contact: '+880-2-0001', code_prefix: 'BD', status: 'ACTIVE', remark: '东南亚项目仓' },
  { id: 10, warehouse_code: 'ID', warehouse_name: '印尼仓', organization: '南亚地区部', region: '南亚', warehouse_type: '海外仓', country: '印尼', city: '雅加达', manager: 'Budi', contact: '+62-21-0001', code_prefix: 'ID', status: 'ACTIVE', remark: '南亚销售仓' },
  { id: 11, warehouse_code: 'PK', warehouse_name: '巴基斯坦仓', organization: '南亚地区部', region: '南亚', warehouse_type: '海外仓', country: '巴基斯坦', city: '卡拉奇', manager: 'Ali', contact: '+92-21-0001', code_prefix: 'PK', status: 'ACTIVE', remark: '南亚备件仓' },
  { id: 12, warehouse_code: 'ZA', warehouse_name: '南非仓', organization: '非洲地区部', region: '非洲', warehouse_type: '海外仓', country: '南非', city: '约翰内斯堡', manager: 'Thabo', contact: '+27-11-0001', code_prefix: 'ZA', status: 'ACTIVE', remark: '非洲中心仓' },
  { id: 13, warehouse_code: 'KE', warehouse_name: '肯尼亚仓', organization: '非洲地区部', region: '非洲', warehouse_type: '海外仓', country: '肯尼亚', city: '内罗毕', manager: 'Amina', contact: '+254-20-0001', code_prefix: 'KE', status: 'ACTIVE', remark: '东非交付仓' },
  { id: 14, warehouse_code: 'NG', warehouse_name: '尼日利亚仓', organization: '非洲地区部', region: '非洲', warehouse_type: '海外仓', country: '尼日利亚', city: '拉各斯', manager: 'Chinedu', contact: '+234-1-0001', code_prefix: 'NG', status: 'ACTIVE', remark: '西非销售仓' },
  { id: 15, warehouse_code: 'ZM', warehouse_name: '赞比亚仓', organization: '非洲地区部', region: '非洲', warehouse_type: '海外仓', country: '赞比亚', city: '卢萨卡', manager: 'Musa', contact: '+260-211-0001', code_prefix: 'ZM', status: 'ACTIVE', remark: '非洲项目仓' },
  { id: 16, warehouse_code: 'CO', warehouse_name: '哥伦比亚仓', organization: '拉美地区部', region: '拉美', warehouse_type: '海外仓', country: '哥伦比亚', city: '波哥大', manager: 'Sofia', contact: '+57-1-0001', code_prefix: 'CO', status: 'ACTIVE', remark: '拉美北部仓' },
  { id: 17, warehouse_code: 'CL', warehouse_name: '智利仓', organization: '拉美地区部', region: '拉美', warehouse_type: '海外仓', country: '智利', city: '圣地亚哥', manager: 'Diego', contact: '+56-2-0001', code_prefix: 'CL', status: 'ACTIVE', remark: '拉美南部仓' }
]

export const LEGACY_WAREHOUSE_CODE_MAP: Record<string, string> = {
  'WH-HZ-CENTRAL': 'HZ',
  'WH-SH-REGION': 'NB',
  'WH-GZ-3PL': 'SD',
  'WH-SZ-AFTERSALE': 'SD',
  'WH-CUST-TESLA-VMI': 'NL',
  'WH-SUP-CATL-VMI': 'PL'
}

export const DEMO_USER_WAREHOUSE_SCOPE: Record<string, string[] | '*'> = {
  admin: '*',
  system: '*',
  wh_admin: ['HZ', 'NB', 'SD'],
  logistics: ['NL', 'PL', 'ES', 'RO'],
  mobile: ['HZ', 'NB', 'NL'],
  demo: ['HZ', 'NB', 'NL']
}

export function normalizeWarehouseCode(code: unknown) {
  const value = String(code || '').trim()
  return LEGACY_WAREHOUSE_CODE_MAP[value] || value
}

export function warehouseByCode(code: unknown, allWarehouses: WarehouseOption[] = DEMO_WAREHOUSES) {
  const normalized = normalizeWarehouseCode(code)
  return allWarehouses.find((row) => row.warehouse_code === normalized)
}

export function authorizedWarehousesForUser(user?: WarehouseUser | null, allWarehouses: WarehouseOption[] = DEMO_WAREHOUSES) {
  if (Array.isArray(user?.authorized_warehouses) && user.authorized_warehouses.length) {
    const codes = user.authorized_warehouses.map((row) => normalizeWarehouseCode(row.warehouse_code))
    const canonical = allWarehouses.filter((row) => codes.includes(row.warehouse_code))
    if (canonical.length) return canonical
  }
  const scope = String(user?.warehouse_scope || '').trim()
  const username = String(user?.username || 'admin')
  const mapped = DEMO_USER_WAREHOUSE_SCOPE[username] ?? (String(user?.role_code || '').toUpperCase() === 'ADMIN' ? '*' : ['HZ'])
  const codes = scope && scope !== '*'
    ? scope.split(',').map((item) => normalizeWarehouseCode(item)).filter(Boolean)
    : mapped === '*' ? allWarehouses.map((row) => row.warehouse_code) : mapped
  return allWarehouses.filter((row) => codes.includes(row.warehouse_code))
}

export function makeWarehouseContext(selectedWarehouseCode: string, authorizedWarehouseCodes: string[]): WarehouseContext {
  const authorized = authorizedWarehouseCodes.map(normalizeWarehouseCode).filter(Boolean)
  const selected = normalizeWarehouseCode(selectedWarehouseCode)
  const resolved = selected && (selected === ALL_WAREHOUSE_CODE || authorized.includes(selected))
    ? selected
    : ALL_WAREHOUSE_CODE
  return {
    selectedWarehouseCode: resolved,
    authorizedWarehouseCodes: authorized,
    isAllWarehouse: resolved === ALL_WAREHOUSE_CODE
  }
}

export function getWarehouseQueryScope(context: WarehouseContext) {
  if (!context.authorizedWarehouseCodes.length) {
    return { warehouseCodes: '__NO_AUTH__' }
  }
  if (context.isAllWarehouse) {
    return { warehouseCodes: context.authorizedWarehouseCodes.join(',') }
  }
  return { warehouseCode: context.selectedWarehouseCode }
}

export function canAccessWarehouse(warehouseCode: unknown, context: WarehouseContext) {
  const code = normalizeWarehouseCode(warehouseCode)
  if (!code) return true
  if (!context.authorizedWarehouseCodes.includes(code)) return false
  return context.isAllWarehouse || context.selectedWarehouseCode === code
}

export function validateWarehouseAccess(row: Record<string, unknown>, context: WarehouseContext) {
  const code = normalizeWarehouseCode(row.warehouse_code || row.warehouseCode || '')
  const warehouse = warehouseByCode(code)
  const name = String(row.warehouse_name || row.warehouseName || warehouse?.warehouse_name || code || '未知仓库')
  if (!code) return { valid: true, warehouseCode: code, warehouseName: name, message: '' }
  if (!context.authorizedWarehouseCodes.includes(code)) {
    return { valid: false, warehouseCode: code, warehouseName: name, message: '当前账号未授权访问该仓库。' }
  }
  if (!context.isAllWarehouse && context.selectedWarehouseCode !== code) {
    const selectedName = warehouseByCode(context.selectedWarehouseCode)?.warehouse_name || context.selectedWarehouseCode
    return { valid: false, warehouseCode: code, warehouseName: name, message: `当前单据属于【${name}】，当前选择仓库为【${selectedName}】，无法操作。` }
  }
  return { valid: true, warehouseCode: code, warehouseName: name, message: context.isAllWarehouse ? `当前选择为全部仓库，系统将按对象所属仓库【${name}】执行本次操作。` : '' }
}

export function currentWarehouseContextFromStorage(): WarehouseContext {
  const user = safeJson<WarehouseUser>(localStorage.getItem('wms_user')) || { username: 'admin', warehouse_scope: '*' }
  const authorized = authorizedWarehousesForUser(user).map((row) => row.warehouse_code)
  const selected = localStorage.getItem(currentWarehouseStorageKey(user.username)) || ALL_WAREHOUSE_CODE
  return makeWarehouseContext(selected, authorized)
}

export function currentWarehouseStorageKey(username?: string) {
  return `wms_current_warehouse_${username || 'anonymous'}`
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
