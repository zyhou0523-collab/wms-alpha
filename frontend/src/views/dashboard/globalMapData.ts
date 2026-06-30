export type DashboardLayer = 'GROUP' | 'REGION' | 'WAREHOUSE'
export type MapNodeType = 'REGION' | 'WAREHOUSE' | 'CENTRAL_WAREHOUSE'
export type NodeStatus = 'NORMAL' | 'WARNING' | 'BLOCKED'

export interface GlobalMapNode {
  code: string
  name: string
  type: MapNodeType
  regionCode?: string
  warehouseCode?: string
  warehouseId?: number
  warehouseType?: string
  country: string
  city: string
  longitude: number
  latitude: number
  x: number
  y: number
  warehouseCount: number
  inventoryQty: number
  inventoryAmount: number
  warningCount: number
  exceptionCount: number
  turnoverDays: number
  staleQty: number
  staleAmount: number
  owners: number
  skuCount: number
  availableQty: number
  frozenQty: number
  allocatedQty: number
  safetyShortage: number
  status: NodeStatus
  children?: GlobalMapNode[]
}

export interface MetricRow {
  name: string
  value: number
  color: string
}

export interface CountrySalesRow {
  country: string
  salesQty: number
}

export interface TrendRow {
  month: string
  salesQty: number
  afterSalesQty: number
}

export interface RegionalDistributionRow {
  regionName: string
  salesQty: number
  faultyQty: number
  afterSalesQty: number
}

export interface TopAgingProduct {
  productCode: string
  productName: string
  warehouseName: string
  warehouseCode: string
  regionCode: string
  agingDays: number
  thresholdDays: number
  batteryFlag: '是' | '否'
  handlingSuggestion: string
}

export const regionMapNodes: GlobalMapNode[] = [
  region({
    code: 'EU_REGION',
    name: '欧洲地区部',
    country: '欧洲',
    city: '阿姆斯特丹 / 华沙',
    longitude: 15,
    latitude: 50,
    children: [
      warehouse('WH-NL', '荷兰仓', 'EU_REGION', '荷兰', '阿姆斯特丹', 5.2913, 52.1326, 48600, 3680, 2, 1, 'WARNING'),
      warehouse('WH-PL', '波兰仓', 'EU_REGION', '波兰', '华沙', 19.1451, 51.9194, 41400, 3120, 1, 2, 'NORMAL'),
      warehouse('WH-ES', '西班牙仓', 'EU_REGION', '西班牙', '马德里', -3.7492, 40.4637, 35200, 2660, 1, 3, 'NORMAL'),
      warehouse('WH-RO', '罗马尼亚仓', 'EU_REGION', '罗马尼亚', '布加勒斯特', 24.9668, 45.9432, 28600, 2140, 1, 4, 'WARNING')
    ]
  }),
  region({
    code: 'SEA_REGION',
    name: '东南亚地区部',
    country: '东南亚',
    city: '马尼拉 / 雅加达',
    longitude: 115,
    latitude: 5,
    children: [
      warehouse('WH-PH', '菲律宾仓', 'SEA_REGION', '菲律宾', '马尼拉', 121.774, 12.8797, 42600, 3260, 2, 5, 'WARNING'),
      warehouse('WH-ID', '印尼仓', 'SEA_REGION', '印度尼西亚', '雅加达', 113.9213, -0.7893, 51200, 3890, 1, 6, 'NORMAL')
    ]
  }),
  region({
    code: 'SA_REGION',
    name: '南亚地区部',
    country: '南亚',
    city: '达卡 / 伊斯兰堡',
    longitude: 75,
    latitude: 25,
    children: [
      warehouse('WH-BD', '孟加拉仓', 'SA_REGION', '孟加拉', '达卡', 90.3563, 23.685, 37800, 2840, 1, 7, 'WARNING'),
      warehouse('WH-PK', '巴基斯坦仓', 'SA_REGION', '巴基斯坦', '伊斯兰堡', 69.3451, 30.3753, 33400, 2520, 2, 8, 'WARNING')
    ]
  }),
  region({
    code: 'AFRICA_REGION',
    name: '非洲地区部',
    country: '非洲',
    city: '约翰内斯堡 / 内罗毕',
    longitude: 25,
    latitude: 0,
    children: [
      warehouse('WH-ZA', '南非仓', 'AFRICA_REGION', '南非', '约翰内斯堡', 22.9375, -30.5595, 46200, 3480, 2, 9, 'WARNING'),
      warehouse('WH-KE', '肯尼亚仓', 'AFRICA_REGION', '肯尼亚', '内罗毕', 37.9062, -0.0236, 28600, 2130, 1, 10, 'NORMAL'),
      warehouse('WH-SN', '塞内加尔仓', 'AFRICA_REGION', '塞内加尔', '达喀尔', -14.4524, 14.4974, 22400, 1680, 1, 11, 'NORMAL'),
      warehouse('WH-NG', '尼日利亚仓', 'AFRICA_REGION', '尼日利亚', '拉各斯', 8.6753, 9.082, 30800, 2350, 2, 12, 'BLOCKED'),
      warehouse('WH-ZM', '赞比亚仓', 'AFRICA_REGION', '赞比亚', '卢萨卡', 27.8493, -13.1339, 19600, 1420, 1, 13, 'WARNING')
    ]
  }),
  region({
    code: 'LATAM_REGION',
    name: '拉美大区',
    country: '拉丁美洲',
    city: '波哥大 / 墨西哥城',
    longitude: -75,
    latitude: -10,
    children: [
      warehouse('WH-CO', '哥伦比亚仓', 'LATAM_REGION', '哥伦比亚', '波哥大', -74.2973, 4.5709, 31600, 2380, 1, 14, 'NORMAL'),
      warehouse('WH-MX', '墨西哥仓', 'LATAM_REGION', '墨西哥', '墨西哥城', -102.5528, 23.6345, 43800, 3310, 2, 15, 'WARNING'),
      warehouse('WH-CL', '智利仓', 'LATAM_REGION', '智利', '圣地亚哥', -71.543, -35.6751, 27600, 2060, 1, 16, 'NORMAL'),
      warehouse('WH-PE', '秘鲁仓', 'LATAM_REGION', '秘鲁', '利马', -75.0152, -9.19, 24800, 1860, 1, 17, 'NORMAL')
    ]
  }),
  region({
    code: 'BRAZIL_CENTER',
    name: '巴西经营中心',
    country: '巴西',
    city: '福塔莱萨 / 马瑙斯 / 库里提巴',
    longitude: -52,
    latitude: -10,
    children: [
      warehouse('WH-BR-FORTALEZA', '福塔莱萨仓', 'BRAZIL_CENTER', '巴西', '福塔莱萨', -38.5267, -3.7319, 33600, 2520, 1, 18, 'NORMAL'),
      warehouse('WH-BR-MANAUS', '马瑙斯仓', 'BRAZIL_CENTER', '巴西', '马瑙斯', -60.0217, -3.119, 29400, 2210, 2, 19, 'BLOCKED'),
      warehouse('WH-BR-CURITIBA', '库里提巴仓', 'BRAZIL_CENTER', '巴西', '库里提巴', -49.2733, -25.4284, 39200, 2960, 1, 20, 'WARNING')
    ]
  })
]

export const centralWarehouseNodes: GlobalMapNode[] = [
  centralWarehouse('HZ', '杭州仓', '中国', '杭州', 120.1551, 30.2741, 168000, 12806, 5, 101, 'WARNING', {
    skuCount: 260,
    owners: 2,
    staleQty: 11800,
    staleAmount: 920,
    x: 82,
    y: 27.8
  }),
  centralWarehouse('WH-SD-CENTRAL', '顺德仓', '中国', '佛山顺德', 113.2934, 22.8052, 142000, 10850, 4, 102, 'WARNING', {
    skuCount: 238,
    owners: 2,
    staleQty: 9600,
    staleAmount: 735,
    x: 78.5,
    y: 42
  }),
  centralWarehouse('WH-NB-CENTRAL', '宁波仓', '中国', '宁波', 121.5503, 29.8746, 126000, 9640, 3, 103, 'NORMAL', {
    skuCount: 226,
    owners: 2,
    staleQty: 7200,
    staleAmount: 552,
    x: 88.8,
    y: 34
  })
]

export const globalMapNodes: GlobalMapNode[] = [
  ...regionMapNodes,
  ...centralWarehouseNodes
]

export const productLineStructure: MetricRow[] = [
  { name: '充电桩', value: 18, color: '#16c784' },
  { name: '水上动力', value: 12, color: '#ec4899' },
  { name: '电池', value: 25, color: '#f59e0b' },
  { name: '电表', value: 16, color: '#8b5cf6' },
  { name: '逆变器', value: 29, color: '#3b82f6' }
]

export const topSalesCountries: CountrySalesRow[] = [
  { country: '墨西哥', salesQty: 820 },
  { country: '荷兰', salesQty: 765 },
  { country: '印尼', salesQty: 690 },
  { country: '南非', salesQty: 610 },
  { country: '巴西', salesQty: 560 }
]

export const salesAfterSalesTrend: TrendRow[] = [
  { month: '2024-11', salesQty: 405, afterSalesQty: 245 },
  { month: '2024-12', salesQty: 338, afterSalesQty: 176 },
  { month: '2025-01', salesQty: 555, afterSalesQty: 690 },
  { month: '2025-02', salesQty: 402, afterSalesQty: 318 },
  { month: '2025-03', salesQty: 488, afterSalesQty: 386 },
  { month: '2025-04', salesQty: 436, afterSalesQty: 344 }
]

export const regionalInventoryDistribution: RegionalDistributionRow[] = globalMapNodes.map((node) => ({
  regionName: node.name,
  salesQty: Math.max(20, Math.round(node.availableQty / 1000)),
  faultyQty: Math.max(6, Math.round(node.frozenQty / 750)),
  afterSalesQty: Math.max(12, Math.round(node.allocatedQty / 650))
}))

export const agingBuckets = [
  { name: '<90天', value: 18, color: '#16c784' },
  { name: '90-180天', value: 21, color: '#3b82f6' },
  { name: '180-270天', value: 26, color: '#f59e0b' },
  { name: '270-360天', value: 22, color: '#8b5cf6' },
  { name: '>360天', value: 13, color: '#ef4444' }
]

const agingProducts: TopAgingProduct[] = [
  aging('GT3-50KD1R11002', '工商业储能电池包', 'WH-NL', 'EU_REGION', 428, '是', '优先促销 / 调拨'),
  aging('BLF51-5R31101', '电池模块备件', 'WH-BR-MANAUS', 'BRAZIL_CENTER', 414, '是', '区域清仓 / 售后消耗'),
  aging('SP-CABLE-001', '高压线束', 'WH-ZA', 'AFRICA_REGION', 398, '否', '跨仓调拨'),
  aging('GT3-10KD1R11004', '三相并网逆变器', 'WH-MX', 'LATAM_REGION', 376, '否', '优先销售订单匹配'),
  aging('GT3-50KD1R11002', '工商业储能电池包', 'HZ', 'GLOBAL', 368, '是', '中央仓优先调拨海外'),
  aging('PACK-HV-280AH', '高压电池簇', 'WH-SD-CENTRAL', 'GLOBAL', 356, '是', '顺德生产订单优先消耗'),
  aging('INV-50K-001', '50kW 储能逆变器', 'WH-NB-CENTRAL', 'GLOBAL', 342, '否', '宁波出口订单优先锁定'),
  aging('PACK-HV-280AH', '高压电池簇', 'WH-PK', 'SA_REGION', 352, '是', '重点跟进客户需求'),
  aging('FUSE-500A-001', '熔断器', 'WH-PL', 'EU_REGION', 338, '否', '锁定近期出库计划'),
  aging('BMS-MAIN-001', 'BMS 主控板', 'WH-ES', 'EU_REGION', 318, '否', '维修备件消耗'),
  aging('METER-3P-001', '三相智能电表', 'WH-RO', 'EU_REGION', 296, '否', '组合销售'),
  aging('INV-50K-001', '50kW 储能逆变器', 'WH-PH', 'SEA_REGION', 322, '否', '菲律宾项目优先消耗'),
  aging('PACK-LV-100AH', '低压电池包', 'WH-ID', 'SEA_REGION', 304, '是', '经销商促销'),
  aging('EMS-CTRL-001', 'EMS 控制器', 'WH-BD', 'SA_REGION', 286, '否', '孟加拉项目配套'),
  aging('HV-CONNECTOR-01', '高压连接器', 'WH-KE', 'AFRICA_REGION', 278, '否', '维修工单消耗'),
  aging('DC-FAN-001', '直流风扇', 'WH-SN', 'AFRICA_REGION', 266, '否', '渠道清理'),
  aging('BAT-MODULE-02', '电池模块', 'WH-NG', 'AFRICA_REGION', 344, '是', '异常复核后调拨'),
  aging('CHARGER-20K-001', '20kW 充电模块', 'WH-ZM', 'AFRICA_REGION', 255, '否', '赞比亚项目配套'),
  aging('PCS-100K-001', '100kW PCS', 'WH-CO', 'LATAM_REGION', 292, '否', '哥伦比亚项目锁定'),
  aging('BAT-RACK-001', '电池簇机架', 'WH-CL', 'LATAM_REGION', 268, '否', '跨仓调拨'),
  aging('SPD-DC-001', '直流防雷器', 'WH-PE', 'LATAM_REGION', 246, '否', '秘鲁订单搭售'),
  aging('INV-30K-001', '30kW 储能逆变器', 'WH-BR-FORTALEZA', 'BRAZIL_CENTER', 284, '否', '福塔莱萨项目优先'),
  aging('BMS-SLAVE-001', 'BMS 从控板', 'WH-BR-CURITIBA', 'BRAZIL_CENTER', 262, '否', '库里提巴售后消耗')
]

export function getTopAgingProducts(scopeCode = 'GLOBAL'): TopAgingProduct[] {
  const region = findRegion(scopeCode)
  const warehouseNode = findWarehouse(scopeCode)
  const scopedWarehouses = warehouseNode ? [warehouseNode] : region?.children || flattenWarehouses()
  const rows = agingProducts.filter((row) => {
    if (warehouseNode) return row.warehouseCode === warehouseNode.code
    if (region) return row.regionCode === region.code
    return true
  })
  return fillAgingRows(rows, scopedWarehouses)
}

export function flattenWarehouses(nodes = globalMapNodes): GlobalMapNode[] {
  return nodes.flatMap((node) => {
    if (node.type === 'REGION') return node.children || []
    return [node]
  })
}

export function findRegion(code?: string) {
  return regionMapNodes.find((node) => node.code === code)
}

export function findWarehouse(code?: string) {
  return flattenWarehouses().find((node) => node.code === code || node.warehouseCode === code)
}

export function sumNodes(nodes: GlobalMapNode[]): GlobalMapNode {
  const totals = aggregateNodes(nodes)
  return {
    code: 'GLOBAL',
    name: '全球库存网络',
    type: 'REGION',
    country: 'Global',
    city: 'Global',
    longitude: 0,
    latitude: 0,
    x: 50,
    y: 50,
    turnoverDays: weightedTurnover(nodes),
    status: totals.exceptionCount > 0 ? 'BLOCKED' : totals.warningCount > 0 ? 'WARNING' : 'NORMAL',
    ...totals
  }
}

function region(config: {
  code: string
  name: string
  country: string
  city: string
  longitude: number
  latitude: number
  children: GlobalMapNode[]
}): GlobalMapNode {
  const totals = aggregateNodes(config.children)
  return {
    code: config.code,
    name: config.name,
    type: 'REGION',
    country: config.country,
    city: config.city,
    longitude: config.longitude,
    latitude: config.latitude,
    x: mapX(config.longitude),
    y: mapY(config.latitude),
    turnoverDays: weightedTurnover(config.children),
    status: totals.exceptionCount > 0 ? 'BLOCKED' : totals.warningCount > 0 ? 'WARNING' : 'NORMAL',
    ...totals,
    warehouseCount: config.children.length,
    children: config.children
  }
}

function warehouse(
  code: string,
  name: string,
  regionCode: string,
  country: string,
  city: string,
  longitude: number,
  latitude: number,
  inventoryQty: number,
  inventoryAmount: number,
  warningCount: number,
  warehouseId?: number,
  status: NodeStatus = warningCount > 0 ? 'WARNING' : 'NORMAL'
): GlobalMapNode {
  const staleQty = Math.round(inventoryQty * (status === 'NORMAL' ? 0.06 : status === 'BLOCKED' ? 0.14 : 0.1))
  const exceptionCount = status === 'BLOCKED' ? 2 : warningCount >= 2 ? 1 : 0
  return {
    code,
    name,
    type: 'WAREHOUSE',
    regionCode,
    warehouseCode: code,
    warehouseId,
    warehouseType: '区域仓',
    country,
    city,
    longitude,
    latitude,
    x: mapX(longitude),
    y: mapY(latitude),
    warehouseCount: 1,
    inventoryQty,
    inventoryAmount,
    warningCount,
    exceptionCount,
    turnoverDays: status === 'NORMAL' ? 62 : status === 'BLOCKED' ? 88 : 76,
    staleQty,
    staleAmount: Math.round(inventoryAmount * staleQty / Math.max(inventoryQty, 1)),
    owners: 2 + warningCount,
    skuCount: 42 + warningCount * 8,
    availableQty: Math.round(inventoryQty * 0.78),
    frozenQty: Math.round(inventoryQty * (status === 'BLOCKED' ? 0.07 : 0.04)),
    allocatedQty: Math.round(inventoryQty * 0.09),
    safetyShortage: warningCount * 1200,
    status
  }
}

function centralWarehouse(
  code: string,
  name: string,
  country: string,
  city: string,
  longitude: number,
  latitude: number,
  inventoryQty: number,
  inventoryAmount: number,
  warningCount: number,
  warehouseId: number,
  status: NodeStatus,
  overrides: Partial<Pick<GlobalMapNode, 'skuCount' | 'owners' | 'staleQty' | 'staleAmount' | 'x' | 'y'>>
): GlobalMapNode {
  const base = warehouse(code, name, '', country, city, longitude, latitude, inventoryQty, inventoryAmount, warningCount, warehouseId, status)
  return {
    ...base,
    type: 'CENTRAL_WAREHOUSE',
    regionCode: undefined,
    warehouseType: '集团中央仓',
    skuCount: overrides.skuCount ?? base.skuCount,
    owners: overrides.owners ?? base.owners,
    staleQty: overrides.staleQty ?? base.staleQty,
    staleAmount: overrides.staleAmount ?? base.staleAmount,
    x: overrides.x ?? base.x,
    y: overrides.y ?? base.y
  }
}

function aging(
  productCode: string,
  productName: string,
  warehouseCode: string,
  regionCode: string,
  agingDays: number,
  batteryFlag: '是' | '否',
  handlingSuggestion: string,
  thresholdDays = 180
): TopAgingProduct {
  return {
    productCode,
    productName,
    warehouseCode,
    regionCode,
    warehouseName: findWarehouseName(warehouseCode),
    agingDays,
    thresholdDays,
    batteryFlag,
    handlingSuggestion
  }
}

function fillAgingRows(rows: TopAgingProduct[], warehouses: GlobalMapNode[]) {
  const result = [...rows]
  const seen = new Set(result.map((row) => `${row.warehouseCode}-${row.productCode}`))
  const templates = [
    ['GT3-50KD1R11002', '工商业储能电池包', '是', '优先促销 / 调拨'],
    ['PACK-HV-280AH', '高压电池簇', '是', '项目订单优先锁定'],
    ['INV-50K-001', '50kW 储能逆变器', '否', '跨仓调拨'],
    ['BMS-MAIN-001', 'BMS 主控板', '否', '售后备件消耗'],
    ['SP-CABLE-001', '高压线束', '否', '组合出库消耗']
  ] as const

  let cursor = 0
  while (result.length < 5 && warehouses.length > 0 && cursor < warehouses.length * templates.length) {
    const warehouseNode = warehouses[cursor % warehouses.length]
    const template = templates[Math.floor(cursor / warehouses.length) % templates.length]
    const key = `${warehouseNode.code}-${template[0]}`
    if (!seen.has(key)) {
      seen.add(key)
      result.push({
        productCode: template[0],
        productName: template[1],
        warehouseName: warehouseNode.name,
        warehouseCode: warehouseNode.code,
        regionCode: warehouseNode.regionCode || '',
        agingDays: Math.max(181, warehouseNode.turnoverDays + 190 - cursor * 3),
        thresholdDays: 180,
        batteryFlag: template[2],
        handlingSuggestion: template[3]
      })
    }
    cursor += 1
  }

  return result.sort((a, b) => b.agingDays - a.agingDays).slice(0, 5)
}

function findWarehouseName(code: string) {
  return flattenWarehouses().find((node) => node.code === code)?.name || code
}

function aggregateNodes(nodes: GlobalMapNode[]) {
  return nodes.reduce((acc, node) => {
    acc.inventoryQty += node.inventoryQty
    acc.inventoryAmount += node.inventoryAmount
    acc.warningCount += node.warningCount
    acc.exceptionCount += node.exceptionCount
    acc.staleQty += node.staleQty
    acc.staleAmount += node.staleAmount
    acc.warehouseCount += node.warehouseCount
    acc.owners += node.owners
    acc.skuCount += node.skuCount
    acc.availableQty += node.availableQty
    acc.frozenQty += node.frozenQty
    acc.allocatedQty += node.allocatedQty
    acc.safetyShortage += node.safetyShortage
    return acc
  }, {
    inventoryQty: 0,
    inventoryAmount: 0,
    warningCount: 0,
    exceptionCount: 0,
    staleQty: 0,
    staleAmount: 0,
    warehouseCount: 0,
    owners: 0,
    skuCount: 0,
    availableQty: 0,
    frozenQty: 0,
    allocatedQty: 0,
    safetyShortage: 0
  })
}

function weightedTurnover(nodes: GlobalMapNode[]) {
  const qty = nodes.reduce((sum, node) => sum + node.inventoryQty, 0)
  if (!qty) return 0
  return Math.round(nodes.reduce((sum, node) => sum + node.turnoverDays * node.inventoryQty, 0) / qty)
}

function mapX(longitude: number) {
  return Number((((longitude + 180) / 360) * 100).toFixed(2))
}

function mapY(latitude: number) {
  return Number((((90 - latitude) / 180) * 100).toFixed(2))
}
