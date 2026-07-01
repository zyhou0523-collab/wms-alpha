import type { AxiosRequestConfig } from 'axios'
import {
  DEMO_WAREHOUSES,
  authorizedWarehousesForUser,
  validateWarehouseAccess,
  type WarehouseContext
} from '../utils/warehouseAccess'

interface MockUser {
  username: string
  display_name: string
  role_code: string
  role_name: string
  warehouse_scope: string
  authorized_warehouses?: Array<Record<string, any>>
  status: string
}

type Row = Record<string, any>

function scopedWarehouseCodes(paramsOrData: Row = {}) {
  const context = paramsOrData.warehouseContext as WarehouseContext | undefined
  if (context?.authorizedWarehouseCodes?.length) {
    return context.isAllWarehouse ? context.authorizedWarehouseCodes : [context.selectedWarehouseCode]
  }
  if (paramsOrData.warehouseCodes) return String(paramsOrData.warehouseCodes).split(',').map((item) => item.trim()).filter(Boolean)
  if (paramsOrData.warehouseCode || paramsOrData.warehouse_code) return [String(paramsOrData.warehouseCode || paramsOrData.warehouse_code)]
  return DEMO_WAREHOUSES.map((row) => row.warehouse_code)
}

function filterRowsByWarehouseScope(rows: Row[], paramsOrData: Row = {}) {
  const codes = scopedWarehouseCodes(paramsOrData)
  if (!codes.length || codes.includes('__NO_AUTH__')) return []
  return rows.filter((row) => !row.warehouse_code || codes.includes(String(row.warehouse_code)))
}

function requireWarehouseAllowed(row: Row | undefined, paramsOrData: Row = {}) {
  if (!row) throw new Error('业务对象不存在')
  const context = paramsOrData.warehouseContext as WarehouseContext | undefined
  if (context) {
    const result = validateWarehouseAccess(row, context)
    if (!result.valid) throw new Error(result.message)
    return
  }
  const codes = scopedWarehouseCodes(paramsOrData)
  if (row.warehouse_code && !codes.includes(String(row.warehouse_code))) throw new Error('当前账号未授权访问该仓库。')
}

function hydrateMockUser(user: Row) {
  return {
    ...user,
    authorized_warehouses: authorizedWarehousesForUser(user, DEMO_WAREHOUSES)
  }
}

function findGlobalSnOwner(snCode: string): Row | null {
  const code = String(snCode || '').trim()
  for (const orderId of Object.keys(serialNumbers)) {
    const row = serialNumbers[Number(orderId)].find((item) => item.sn_code === code)
    if (row) {
      const order = inboundOrders.find((item) => Number(item.id) === Number(orderId))
        || outboundOrders.find((item) => Number(item.id) === Number(orderId))
      return { ...row, orderId: Number(orderId), order_no: order?.order_no, warehouse_code: order?.warehouse_code || row.warehouse_code, warehouse_name: order?.warehouse_name || row.warehouse_name } as Row
    }
  }
  return null
}

function globalSnConflictMessage(snCode: string, currentOrderId: number, context: Row) {
  const owner = findGlobalSnOwner(snCode)
  if (!owner) return ''
  if (Number(owner.orderId) !== Number(currentOrderId)) return `SN 已归属于其他单据 ${owner.order_no || owner.orderId}`
  if (owner.warehouse_code && owner.warehouse_code !== context.warehouseCode) return `SN 已存在于【${owner.warehouse_name || owner.warehouse_code}】，不允许跨仓重复采集`
  if (owner.product_code && owner.product_code !== context.productCode) return 'SN 已绑定其他产品，不允许重复绑定不同产品'
  return ''
}

const users: Record<string, MockUser & { password: string }> = {
  admin: {
    username: 'admin',
    password: 'admin123',
    display_name: '系统管理员',
    role_code: 'ADMIN',
    role_name: '系统管理员',
    warehouse_scope: '*',
    status: 'ACTIVE'
  },
  wh_admin: {
    username: 'wh_admin',
    password: '123456',
    display_name: '仓库管理员',
    role_code: 'WAREHOUSE_ADMIN',
    role_name: '仓库管理员',
    warehouse_scope: 'WH-HZ-CENTRAL,WH-GZ-3PL',
    status: 'ACTIVE'
  },
  logistics: {
    username: 'logistics',
    password: '123456',
    display_name: '物流人员',
    role_code: 'LOGISTICS',
    role_name: '物流人员',
    warehouse_scope: 'WH-SH-REGION',
    status: 'ACTIVE'
  }
}

const inboundOrders: Row[] = [
  {
    id: 1,
    order_no: 'IN202606110100',
    source_order_no: 'PO202606110100',
    inbound_type: 'SUPPLIER_VMI',
    source_system: 'SAP',
    warehouse_code: 'WH-HZ-CENTRAL',
    warehouse_name: '杭州集团总仓',
    owner_code: '3060',
    owner_name: '杭州利沃得',
    supplier_code: 'SUP-CATL-001',
    supplier_name: 'CATL 供应商',
    related_order_no: 'ASN202606110100',
    sap_plant: '3060',
    sap_storage_location: '1001',
    plan_arrival_date: '2026-06-12',
    status: 'PARTIAL_RECEIVED',
    planned_qty: 23,
    collected_qty: 7,
    pending_receive_qty: 5,
    received_qty: 2,
    line_count: 2,
    pending_sap_receipt_count: 1,
    sap_post_status: 'FAILED',
    sap_post_result: 'SAP 回传失败：移动类型缺失',
    created_at: '2026-06-11 09:00:00',
    created_by: 'sap',
    updated_at: '2026-06-11 10:20:00',
    updated_by: 'wh_admin'
  },
  {
    id: 2,
    order_no: 'IN-DEMO-SN-MIX-001',
    source_order_no: 'MO202606110101',
    inbound_type: 'PRODUCTION',
    source_system: 'MES',
    warehouse_code: 'WH-HZ-CENTRAL',
    warehouse_name: '杭州集团总仓',
    owner_code: '3060',
    owner_name: '杭州利沃得',
    supplier_code: 'SUP-BYD-001',
    supplier_name: 'BYD 供应商',
    related_order_no: 'MES-MO-202606110101',
    sap_plant: '3060',
    sap_storage_location: '1001',
    plan_arrival_date: '2026-06-13',
    status: 'CREATED',
    planned_qty: 12,
    collected_qty: 0,
    pending_receive_qty: 0,
    received_qty: 0,
    line_count: 2,
    pending_sap_receipt_count: 0,
    sap_post_status: 'NOT_POSTED',
    sap_post_result: '',
    created_at: '2026-06-11 10:00:00',
    created_by: 'mes',
    updated_at: '2026-06-11 10:00:00',
    updated_by: 'mes'
  },
  {
    id: 3,
    order_no: 'IN202606110103',
    source_order_no: 'STOCK202606110103',
    inbound_type: 'STOCKING',
    source_system: 'FULFILLMENT',
    warehouse_code: 'WH-SH-REGION',
    warehouse_name: '上海区域销售仓',
    owner_code: '3060',
    owner_name: '杭州利沃得',
    supplier_code: 'SUP-VMI-001',
    supplier_name: 'VMI 供应商A',
    related_order_no: 'ASN202606110103',
    sap_plant: '3060',
    sap_storage_location: '2001',
    plan_arrival_date: '2026-06-11',
    status: 'RECEIVED',
    planned_qty: 10,
    collected_qty: 4,
    pending_receive_qty: 0,
    received_qty: 10,
    line_count: 2,
    pending_sap_receipt_count: 1,
    sap_post_status: 'NOT_POSTED',
    sap_post_result: '',
    created_at: '2026-06-11 10:30:00',
    created_by: 'planner',
    updated_at: '2026-06-11 11:00:00',
    updated_by: 'wh_admin'
  }
]

const inboundLines: Record<number, Row[]> = {
  1: [
    { id: 101, inbound_order_line_id: 101, line_no: 10, product_id: 'P-GT3-10K', product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', product_desc: '三相并网逆变器', planned_qty: 8, collected_sn_qty: 7, pending_receive_qty: 5, received_qty: 2, line_status: 'PARTIAL_RECEIVED', sap_plant: '3060', sap_storage_location: '1001', sn_required: 1, batch_no: 'B2026061101' },
    { id: 102, inbound_order_line_id: 102, line_no: 20, product_id: 'P-HXEDE081', product_code: 'HXEDE081R10002', product_name: '电表模块', product_desc: '电表模块', planned_qty: 15, collected_sn_qty: 0, pending_receive_qty: 0, received_qty: 0, line_status: 'CREATED', sap_plant: '3060', sap_storage_location: '1001', sn_required: 0, batch_no: 'B2026061102' }
  ],
  2: [
    { id: 201, inbound_order_line_id: 201, line_no: 10, product_id: 'P-BMS-MAIN', product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', product_desc: 'BMS 主控板', planned_qty: 6, collected_sn_qty: 0, pending_receive_qty: 0, received_qty: 0, line_status: 'CREATED', sap_plant: '3060', sap_storage_location: '1001', sn_required: 1, batch_no: 'B2026061103' },
    { id: 202, inbound_order_line_id: 202, line_no: 20, product_id: 'P-SP-CABLE', product_code: 'SP-CABLE-001', product_name: '高压线束', product_desc: '高压线束', planned_qty: 6, collected_sn_qty: 0, pending_receive_qty: 0, received_qty: 0, line_status: 'CREATED', sap_plant: '3060', sap_storage_location: '1001', sn_required: 0, batch_no: 'B2026061104' }
  ],
  3: [
    { id: 301, inbound_order_line_id: 301, line_no: 10, product_id: 'P-METER', product_code: 'METER-AC-001', product_name: '交流电表', product_desc: '交流电表', planned_qty: 4, collected_sn_qty: 4, pending_receive_qty: 0, received_qty: 4, line_status: 'RECEIVED', sap_plant: '3060', sap_storage_location: '2001', sn_required: 1, batch_no: 'B2026061105' },
    { id: 302, inbound_order_line_id: 302, line_no: 20, product_id: 'P-FUSE', product_code: 'FUSE-500A-001', product_name: '500A 熔断器', product_desc: '500A 熔断器', planned_qty: 6, collected_sn_qty: 0, pending_receive_qty: 0, received_qty: 6, line_status: 'RECEIVED', sap_plant: '3060', sap_storage_location: '2001', sn_required: 0, batch_no: 'B2026061106' }
  ]
}

const serialNumbers: Record<number, Row[]> = {
  1: [
    { id: 1001, sn_code: 'SN-IN-1001', product_code: 'GT3-10KD1R11004', box_code: 'BOX-IN-001', pallet_code: 'PLT-IN-001', status: 'RECEIVED', location_code: 'A01-01-01', inbound_order_line_id: 101 },
    { id: 1002, sn_code: 'SN-IN-1002', product_code: 'GT3-10KD1R11004', box_code: 'BOX-IN-001', pallet_code: 'PLT-IN-001', status: 'RECEIVED', location_code: 'A01-01-02', inbound_order_line_id: 101 },
    { id: 1003, sn_code: 'SN-IN-1003', product_code: 'GT3-10KD1R11004', box_code: 'BOX-IN-002', pallet_code: 'PLT-IN-002', status: 'COLLECTED', location_code: '', inbound_order_line_id: 101 },
    { id: 1004, sn_code: 'SN-IN-1004', product_code: 'GT3-10KD1R11004', box_code: 'BOX-IN-002', pallet_code: 'PLT-IN-002', status: 'COLLECTED', location_code: '', inbound_order_line_id: 101 },
    { id: 1005, sn_code: 'SN-IN-1005', product_code: 'GT3-10KD1R11004', box_code: 'BOX-IN-003', pallet_code: 'PLT-IN-002', status: 'COLLECTED', location_code: '', inbound_order_line_id: 101 }
  ],
  2: [],
  3: [
    { id: 3001, sn_code: 'SN-IN-3001', product_code: 'METER-AC-001', box_code: 'BOX-IN-301', pallet_code: 'PLT-IN-301', status: 'RECEIVED', location_code: 'B01-01-01', inbound_order_line_id: 301 },
    { id: 3002, sn_code: 'SN-IN-3002', product_code: 'METER-AC-001', box_code: 'BOX-IN-301', pallet_code: 'PLT-IN-301', status: 'RECEIVED', location_code: 'B01-01-01', inbound_order_line_id: 301 }
  ]
}

const receiptRecords: Record<number, Row[]> = {
  1: [
    { id: 501, receipt_id: 501, receipt_no: 'RCV202606110001', receipt_time: '2026-06-11 10:12:00', receipt_user: 'wh_admin', line_no: 10, product_code: 'GT3-10KD1R11004', receive_qty: 2, status: 'RECEIVED', sap_post_status: 'FAILED', sap_material_doc_no: '', sap_post_result: 'SAP 回传失败：移动类型缺失' }
  ],
  2: [],
  3: [
    { id: 503, receipt_id: 503, receipt_no: 'RCV202606110003', receipt_time: '2026-06-11 11:00:00', receipt_user: 'wh_admin', line_no: 10, product_code: 'METER-AC-001', receive_qty: 4, status: 'RECEIVED', sap_post_status: 'NOT_POSTED', sap_material_doc_no: '', sap_post_result: '' },
    { id: 504, receipt_id: 504, receipt_no: 'RCV202606110004', receipt_time: '2026-06-11 11:02:00', receipt_user: 'wh_admin', line_no: 20, product_code: 'FUSE-500A-001', receive_qty: 6, status: 'RECEIVED', sap_post_status: 'NOT_POSTED', sap_material_doc_no: '', sap_post_result: '' }
  ]
}

const operationLogs: Record<number, Row[]> = {
  1: [
    { id: 1, operator: 'sap', action: '同步预期到货通知单', created_at: '2026-06-11 09:00:00', message: 'SAP 下发供应商 VMI 入库单' },
    { id: 2, operator: 'wh_admin', action: '收货', created_at: '2026-06-11 10:12:00', message: '收货 GT3-10KD1R11004 数量 2' }
  ],
  2: [
    { id: 3, operator: 'mes', action: '同步预期到货通知单', created_at: '2026-06-11 10:00:00', message: 'MES 下发生产入库单' }
  ],
  3: [
    { id: 4, operator: 'wh_admin', action: '收货', created_at: '2026-06-11 11:02:00', message: '整单收货完成，待 SAP 回传' }
  ]
}

const interfaceLogs: Record<number, Row[]> = {
  1: [
    { id: 1, interface_name: 'SAP_ASN_PUSH', source_system: 'SAP', target_system: 'WMS', status: 'SUCCESS', created_at: '2026-06-11 09:00:00', error_message: '' },
    { id: 2, interface_name: 'SAP_INBOUND_POST', source_system: 'WMS', target_system: 'SAP', status: 'FAILED', created_at: '2026-06-11 10:18:00', error_message: '移动类型缺失' }
  ],
  2: [
    { id: 3, interface_name: 'MES_SN_PUSH', source_system: 'MES', target_system: 'WMS', status: 'SUCCESS', created_at: '2026-06-11 10:00:00', error_message: '' }
  ],
  3: [
    { id: 4, interface_name: 'FULFILLMENT_ASN_PUSH', source_system: 'FULFILLMENT', target_system: 'WMS', status: 'SUCCESS', created_at: '2026-06-11 10:30:00', error_message: '' }
  ]
}

const legacyOutboundOrders = [
  { id: 1, order_no: 'SO-OUT-202606110001', warehouse_name: '杭州集团总仓', customer_name: 'Tesla Energy China', status: 'PENDING_ALLOC', planned_qty: 8, allocated_qty: 0, picked_qty: 0, shipped_qty: 0, sap_post_status: 'NOT_POSTED', created_at: '2026-06-11 11:00:00' },
  { id: 2, order_no: 'STO-OUT-202606110001', warehouse_name: '杭州集团总仓', customer_name: '上海区域仓', status: 'PARTIAL_PICKED', planned_qty: 4, allocated_qty: 4, picked_qty: 2, shipped_qty: 0, sap_post_status: 'NOT_POSTED', created_at: '2026-06-11 12:00:00' },
  { id: 3, order_no: 'SO-OUT-202606110003', warehouse_name: '深圳售后仓', customer_name: '阳光电源售后', status: 'PARTIAL_SHIPPED', planned_qty: 6, allocated_qty: 6, picked_qty: 6, shipped_qty: 3, sap_post_status: 'FAILED', created_at: '2026-06-11 13:00:00' }
]

const outboundOrders: Row[] = [
  { id: 1, order_no: 'SO-OUT-202606110001', shipment_order_no: 'SO-OUT-202606110001', order_type: 'SALES_OUTBOUND', outbound_type: 'SALES_OUTBOUND', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', owner_code: '3060', owner_name: '杭州利沃得', customer_code: 'CUS-TESLA-CN', customer_name: 'Tesla Energy China', consignee_code: 'CUS-TESLA-CN', consignee_name: 'Tesla Energy China', ship_from_country: '中国', expected_ship_time: '2026-06-12 10:00:00', related_order_no: 'SO202606110001', sales_order_no: 'SO202606110001', status: 'PENDING_ALLOC', line_count: 2, planned_qty: 8, allocated_qty: 0, picked_qty: 0, shipped_qty: 0, sap_post_status: 'NOT_POSTED', sap_post_result: '', created_at: '2026-06-11 11:00:00' },
  { id: 2, order_no: 'STO-OUT-202606110001', shipment_order_no: 'STO-OUT-202606110001', order_type: 'STO_OUTBOUND', outbound_type: 'STO_OUTBOUND', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', owner_code: '3060', owner_name: '杭州利沃得', customer_code: 'WH-SH-REGION', customer_name: '上海区域销售仓', consignee_code: 'WH-SH-REGION', consignee_name: '上海区域销售仓', target_warehouse_code: 'WH-SH-REGION', target_warehouse_name: '上海区域销售仓', ship_from_country: '中国', expected_ship_time: '2026-06-12 14:00:00', related_order_no: 'STO202606110001', status: 'PARTIAL_PICKED', line_count: 1, planned_qty: 4, allocated_qty: 4, picked_qty: 2, shipped_qty: 0, sap_post_status: 'NOT_POSTED', sap_post_result: '', created_at: '2026-06-11 12:00:00' },
  { id: 3, order_no: 'SO-OUT-202606110003', shipment_order_no: 'SO-OUT-202606110003', order_type: 'AFTERSALE_OUTBOUND', outbound_type: 'AFTERSALE_OUTBOUND', warehouse_code: 'WH-SZ-AFTERSALE', warehouse_name: '深圳售后仓', owner_code: '3060', owner_name: '杭州利沃得', customer_code: 'CUS-SUNGROW-AS', customer_name: '阳光电源售后', consignee_code: 'CUS-SUNGROW-AS', consignee_name: '阳光电源售后', ship_from_country: '德国', expected_ship_time: '2026-06-13 09:00:00', related_order_no: 'SO202606110003', sales_order_no: 'SO202606110003', carrier_name: 'DHL', tracking_no: 'DHL202606110003', status: 'PARTIAL_SHIPPED', line_count: 2, planned_qty: 6, allocated_qty: 6, picked_qty: 6, shipped_qty: 3, sap_post_status: 'FAILED', sap_post_result: 'SAP 出库扣减失败：库存地点缺失', created_at: '2026-06-11 13:00:00' }
]

const outboundLines: Record<number, Row[]> = {
  1: [
    { id: 1001, line_id: 1001, outbound_detail_id: 1001, line_no: 10, product_id: 'P-GT3-10K', product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', product_description: '三相并网逆变器', order_qty: 5, allocated_qty: 0, picked_qty: 0, shipped_qty: 0, sn_required: 1, line_status: 'CREATED', sap_plant: '3060', unit: 'PCS' },
    { id: 1002, line_id: 1002, outbound_detail_id: 1002, line_no: 20, product_id: 'P-HXEDE081', product_code: 'HXEDE081R10002', product_name: '电表模块', product_description: '电表模块', order_qty: 3, allocated_qty: 0, picked_qty: 0, shipped_qty: 0, sn_required: 0, line_status: 'CREATED', sap_plant: '3060', unit: 'PCS' }
  ],
  2: [
    { id: 2001, line_id: 2001, outbound_detail_id: 2001, line_no: 10, product_id: 'P-BMS-MAIN', product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', product_description: 'BMS 主控板', order_qty: 4, allocated_qty: 4, picked_qty: 2, shipped_qty: 0, sn_required: 1, line_status: 'PARTIAL_PICKED', sap_plant: '3060', unit: 'PCS' }
  ],
  3: [
    { id: 3001, line_id: 3001, outbound_detail_id: 3001, line_no: 10, product_id: 'P-METER', product_code: 'METER-AC-001', product_name: '交流电表', product_description: '交流电表', order_qty: 3, allocated_qty: 3, picked_qty: 3, shipped_qty: 3, sn_required: 1, line_status: 'SHIPPED', sap_plant: '3060', unit: 'PCS' },
    { id: 3002, line_id: 3002, outbound_detail_id: 3002, line_no: 20, product_id: 'P-FUSE', product_code: 'FUSE-500A-001', product_name: '500A 熔断器', product_description: '500A 熔断器', order_qty: 3, allocated_qty: 3, picked_qty: 3, shipped_qty: 0, sn_required: 0, line_status: 'PICKED', sap_plant: '3060', unit: 'PCS' }
  ]
}

const outboundAllocations: Record<number, Row[]> = {
  1: [],
  2: [
    { id: 2101, allocation_no: 'ALLOC202606110201', line_no: 10, outbound_detail_id: 2001, product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', owner_code: '3060', location_code: 'A01-01-01', pallet_code: 'PLT-OUT-201', box_code: 'BOX-OUT-201', sn_code: 'SN-OUT-2001', allocated_qty: 1, allocation_mode: 'AUTO_FIFO', allocation_status: 'PICKED', created_at: '2026-06-11 12:10:00' },
    { id: 2103, allocation_no: 'ALLOC202606110203', line_no: 10, outbound_detail_id: 2001, product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', owner_code: '3060', location_code: 'A01-01-03', pallet_code: 'PLT-OUT-202', box_code: 'BOX-OUT-202', sn_code: 'SN-OUT-2003', allocated_qty: 1, allocation_mode: 'AUTO_FIFO', allocation_status: 'ALLOCATED', created_at: '2026-06-11 12:10:00' }
  ],
  3: [
    { id: 3101, allocation_no: 'ALLOC202606110301', line_no: 10, outbound_detail_id: 3001, product_code: 'METER-AC-001', product_name: '交流电表', owner_code: '3060', location_code: 'B01-01-01', sn_code: 'SN-OUT-3001', allocated_qty: 1, allocation_mode: 'AUTO_FIFO', allocation_status: 'SHIPPED', created_at: '2026-06-11 13:10:00' },
    { id: 3102, allocation_no: 'ALLOC202606110302', line_no: 20, outbound_detail_id: 3002, product_code: 'FUSE-500A-001', product_name: '500A 熔断器', owner_code: '3060', location_code: 'B01-02-01', allocated_qty: 3, allocation_mode: 'MANUAL', allocation_status: 'PICKED', created_at: '2026-06-11 13:12:00' }
  ]
}

const outboundPickingRecords: Record<number, Row[]> = {
  1: [],
  2: [{ id: 2201, task_no: 'PICK202606110201', line_no: 10, product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', owner_code: '3060', location_code: 'A01-01-01', sn_code: 'SN-OUT-2001', picked_qty: 1, pick_mode: 'AUTO_FIFO', result: 'SUCCESS', picker: 'mobile', created_at: '2026-06-11 12:20:00' }],
  3: [
    { id: 3201, task_no: 'PICK202606110301', line_no: 10, product_code: 'METER-AC-001', product_name: '交流电表', owner_code: '3060', location_code: 'B01-01-01', sn_code: 'SN-OUT-3001', picked_qty: 3, pick_mode: 'AUTO_FIFO', result: 'SHIPPED', picker: 'wh_admin', shipment_no: 'SHIP202606110301', created_at: '2026-06-11 13:20:00' },
    { id: 3202, task_no: 'PICK202606110302', line_no: 20, product_code: 'FUSE-500A-001', product_name: '500A 熔断器', owner_code: '3060', location_code: 'B01-02-01', picked_qty: 3, pick_mode: 'MANUAL', result: 'SUCCESS', picker: 'wh_admin', created_at: '2026-06-11 13:22:00' }
  ]
}

const outboundShipments: Record<number, Row[]> = {
  1: [],
  2: [],
  3: [{ id: 3301, shipment_no: 'SHIP202606110301', line_no: 10, product_code: 'METER-AC-001', product_name: '交流电表', owner_code: '3060', sn_code: 'SN-OUT-3001', carrier: 'DHL', tracking_no: 'DHL202606110003', shipped_qty: 3, shipment_status: 'SHIPPED', sap_post_status: 'FAILED', sap_material_doc_no: '', ship_time: '2026-06-11 14:00:00', shipper: 'wh_admin' }]
}

const outboundAvailableInventory: Record<number, Row[]> = {
  1: [
    { id: 6101, inventory_id: 6101, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-01', pallet_code: 'PLT-OUT-101', box_code: 'BOX-OUT-101', sn_code: 'SN-OUT-1001', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-01' },
    { id: 6102, inventory_id: 6102, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-02', pallet_code: 'PLT-OUT-101', box_code: 'BOX-OUT-101', sn_code: 'SN-OUT-1002', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-02' },
    { id: 6103, inventory_id: 6103, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-03', pallet_code: 'PLT-OUT-102', box_code: 'BOX-OUT-102', sn_code: 'SN-OUT-1003', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-03' },
    { id: 6104, inventory_id: 6104, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-04', pallet_code: 'PLT-OUT-102', box_code: 'BOX-OUT-102', sn_code: 'SN-OUT-1004', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-04' },
    { id: 6105, inventory_id: 6105, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-05', pallet_code: 'PLT-OUT-103', box_code: 'BOX-OUT-103', sn_code: 'SN-OUT-1005', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-05' },
    { id: 6110, inventory_id: 6110, outbound_detail_id: 1002, line_no: 20, product_code: 'HXEDE081R10002', product_name: '电表模块', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-13', available_qty: 20, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-01' },
    { id: 6191, inventory_id: 6191, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-99-01', sn_code: 'SN-OUT-FROZEN-01', available_qty: 1, inventory_status: 'FROZEN', quality_status: 'QUALIFIED', frozen_flag: true, locked_flag: false, inbound_date: '2026-06-06' },
    { id: 6192, inventory_id: 6192, outbound_detail_id: 1001, line_no: 10, product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-99-02', sn_code: 'SN-OUT-NG-01', available_qty: 1, inventory_status: 'AVAILABLE', quality_status: 'UNQUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-06' }
  ],
  2: [
    { id: 6203, inventory_id: 6203, outbound_detail_id: 2001, line_no: 10, product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-03', pallet_code: 'PLT-OUT-202', box_code: 'BOX-OUT-202', sn_code: 'SN-OUT-2003', available_qty: 1, allocated_qty: 1, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: true, locked_order_no: 'STO-OUT-202606110001', inbound_date: '2026-06-03' },
    { id: 6204, inventory_id: 6204, outbound_detail_id: 2001, line_no: 10, product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', owner_code: '3060', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-04', pallet_code: 'PLT-OUT-203', box_code: 'BOX-OUT-203', sn_code: 'SN-OUT-2004', available_qty: 1, allocated_qty: 0, inventory_status: 'AVAILABLE', quality_status: 'QUALIFIED', frozen_flag: false, locked_flag: false, inbound_date: '2026-06-04' }
  ],
  3: []
}

const outboundOperationLogs: Record<number, Row[]> = {
  1: [{ id: 4101, operator: 'oms', action: '同步发运订单', result: 'SUCCESS', created_at: '2026-06-11 11:00:00', message: '销售订单下发 WMS' }],
  2: [{ id: 4201, operator: 'wh_admin', action: '拣货', result: 'SUCCESS', created_at: '2026-06-11 12:22:00', message: '已拣货 2 件' }],
  3: [{ id: 4301, operator: 'wh_admin', action: '发货', result: 'SUCCESS', created_at: '2026-06-11 14:00:00', message: '发货 3 件，触发 SAP 回传失败' }]
}

const outboundInterfaceLogs: Record<number, Row[]> = {
  1: [{ id: 5101, interface_name: 'OMS_SHIPPING_ORDER_PUSH', source_system: 'OMS', target_system: 'WMS', status: 'SUCCESS', created_at: '2026-06-11 11:00:00', error_message: '' }],
  2: [{ id: 5201, interface_name: 'STO_SHIPPING_ORDER_PUSH', source_system: 'SAP', target_system: 'WMS', status: 'SUCCESS', created_at: '2026-06-11 12:00:00', error_message: '' }],
  3: [
    { id: 5301, interface_name: 'TRACE_OUTBOUND_SN', source_system: 'WMS', target_system: 'TRACE', status: 'SUCCESS', created_at: '2026-06-11 14:01:00', error_message: '' },
    { id: 5302, interface_name: 'SAP_OUTBOUND_POSTING', source_system: 'WMS', target_system: 'SAP', status: 'FAILED', created_at: '2026-06-11 14:02:00', error_message: '库存地点缺失' }
  ]
}

const inventoryRows = [
  { id: 1, warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-01', product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', total_qty: 42, available_qty: 30, allocated_qty: 7, inventory_status: 'QUALIFIED' },
  { id: 2, warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-13', product_code: 'HXEDE081R10002', product_name: '电表模块', total_qty: 36, available_qty: 36, allocated_qty: 0, inventory_status: 'QUALIFIED' }
]

export async function mockRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const method = String(config.method || 'get').toLowerCase()
  const url = String(config.url || '').replace(/^\/api/, '')

  await new Promise((resolve) => window.setTimeout(resolve, 120))

  if (url === '/auth/login' && method === 'post') return login(config) as T
  if (url === '/auth/me' && method === 'get') return currentUser() as T
  if (url === '/workbench/summary' && method === 'get') {
    return { pendingReceiveCount: 2, pendingPickCount: 2, pendingShipCount: 1 } as T
  }

  if (url === '/inbound-orders' && method === 'get') {
    const params = (config.params || {}) as Row
    const rows = filterRowsByWarehouseScope(filterInboundOrders(params), params)
    return page(rows, Number(params.pageNum || 1), Number(params.pageSize || 10)) as T
  }

    const inboundMatch = url.match(/^\/inbound-orders\/(\d+)(?:\/(.+))?$/)
  if (inboundMatch) {
    const id = Number(inboundMatch[1])
    const action = inboundMatch[2] || ''
    requireWarehouseAllowed(inboundOrders.find((row) => Number(row.id) === id), method === 'get' ? (config.params || {}) as Row : (config.data || {}) as Row)
    if (method === 'get' && !action) return inboundDetail(id) as T
    if (method === 'post' && action === 'receive') return receiveInboundOrder(id, (config.data || {}) as Row) as T
    if (method === 'post' && ['sap-post', 'post-sap'].includes(action)) return postInboundSap(id) as T
    if (method === 'post' && action === 'cancel') return cancelOrder(id) as T
    const snContext = action.match(/^lines\/(\d+)\/sn-collect-context$/)
    if (method === 'get' && snContext) return snCollectContext(id, Number(snContext[1])) as T
    const collectedSns = action.match(/^lines\/(\d+)\/collected-sns$/)
    if (method === 'get' && collectedSns) return collectedSnRows(id, Number(collectedSns[1])) as T
    const snValidate = action.match(/^lines\/(\d+)\/validate-sn-collection$/)
    if (method === 'post' && snValidate) return validateSnCollection(id, Number(snValidate[1]), (config.data || {}) as Row) as T
    const snConfirm = action.match(/^lines\/(\d+)\/confirm-sn-collection$/)
    if (method === 'post' && snConfirm) return confirmSnCollection(id, Number(snConfirm[1]), (config.data || {}) as Row) as T
    const receiptCancel = action.match(/^receipts\/(\d+)\/cancel$/)
    if (method === 'post' && receiptCancel) return cancelReceipt(id, Number(receiptCancel[1])) as T
    const snCancel = action.match(/^lines\/(\d+)\/cancel-sn-collection$/)
    if (method === 'post' && snCancel) return cancelCollectedSn(id, Number(snCancel[1]), (config.data as Row)?.serialNumbers || []) as T
  }

  if (url === '/inbound-orders/retry-sap' && method === 'post') {
    const ids = ((config.data as Row)?.orderIds || []) as number[]
    ids.forEach((id) => postInboundSap(Number(id)))
    return { successCount: ids.length } as T
  }

  if (url === '/outbound-orders' && method === 'get') {
    const params = (config.params || {}) as Row
    return page(filterRowsByWarehouseScope(filterOutboundOrders(params), params), Number(params.pageNum || 1), Number(params.pageSize || 10)) as T
  }
  const outboundMatch = url.match(/^\/outbound-orders\/(\d+)(?:\/(.+))?$/)
  if (outboundMatch) {
    const id = Number(outboundMatch[1])
    const action = outboundMatch[2] || ''
    requireWarehouseAllowed(outboundOrders.find((row) => Number(row.id) === id), method === 'get' ? (config.params || {}) as Row : (config.data || {}) as Row)
    if (method === 'get' && !action) return outboundDetail(id) as T
    if (method === 'get' && action === 'interface-logs') return { interfaceLogs: outboundInterfaceLogs[id] || [] } as T
    if (method === 'get' && action === 'allocations') return outboundAllocationView(id) as T
    if (method === 'post' && action === 'allocate-auto') return allocateOutboundAutoMock(id) as T
    if (method === 'post' && action === 'allocate-manual') return allocateOutboundManualMock(id, (config.data || {}) as Row) as T
    if (method === 'post' && action === 'release-allocation') return releaseOutboundAllocationMock(id) as T
    if (method === 'post' && action === 'allocations/cancel') return cancelOutboundAllocationsMock(id, ((config.data as Row)?.allocationIds || []) as number[]) as T
    if (method === 'post' && ['pick', 'pick-scan'].includes(action)) return pickOutboundMock(id, (config.data || {}) as Row) as T
    const pickCancel = action.match(/^picks\/(\d+)\/cancel$/)
    if (method === 'post' && pickCancel) return cancelOutboundPickMock(id, Number(pickCancel[1])) as T
    if (method === 'post' && action === 'picks/cancel') return cancelOutboundPicksMock(id, ((config.data as Row)?.pickIds || []) as number[]) as T
    if (method === 'post' && action === 'ship') return shipOutboundMock(id, (config.data || {}) as Row) as T
    const shipmentCancel = action.match(/^shipments\/(\d+)\/cancel$/)
    if (method === 'post' && shipmentCancel) return cancelOutboundShipmentMock(id, Number(shipmentCancel[1])) as T
    if (method === 'post' && action === 'shipments/cancel') return cancelOutboundShipmentsMock(id, ((config.data as Row)?.shipmentIds || []) as number[]) as T
    if (method === 'post' && action === 'post-sap') return postOutboundSapMock(id, Boolean((config.data as Row)?.forceSapFail)) as T
  }
  if (url === '/outbound-orders/retry-sap' && method === 'post') {
    return postOutboundSapMock(Number((config.data as Row)?.orderId), false) as T
  }
  if (url === '/inventory' && method === 'get') {
    const params = (config.params || {}) as Row
    return page(filterRowsByWarehouseScope(inventoryRows, params), 1, Number(params.pageSize || 10)) as T
  }
  if (url === '/serial-numbers' && method === 'get') {
    const params = (config.params || {}) as Row
    return page(filterRowsByWarehouseScope([
      { id: 1, sn_code: 'SN-OUT-0001', product_code: 'GT3-10KD1R11004', warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '成品仓', location_code: 'FG-L-A01-001', status: 'ON_SHELF' },
      { id: 2, sn_code: 'SN-NE-0001', product_code: 'BMS-MAIN-001', warehouse_code: 'WH-SH-REGION', warehouse_name: '新能源仓', location_code: 'NE-L-A01-001', status: 'ON_SHELF' }
    ], params)) as T
  }
  if (url === '/serial-numbers' && method === 'get') {
    return page([
      { id: 1, sn_code: 'SN-OUT-0001', product_code: 'GT3-10KD1R11004', warehouse_name: '杭州集团总仓', location_code: 'A01-01-01', status: 'ON_SHELF' }
    ]) as T
  }

  throw new Error('移动端 Mock 暂未覆盖该接口')
}

function currentUser(): MockUser {
  const raw = localStorage.getItem('wms_mobile_user')
  if (raw) {
    try {
      return hydrateMockUser(JSON.parse(raw) as MockUser) as unknown as MockUser
    } catch {
      // Fall through to default user.
    }
  }
  const { password: _password, ...user } = users.admin
  return hydrateMockUser(user) as unknown as MockUser
}

function login(config: AxiosRequestConfig) {
  const data = config.data as { username?: string; password?: string }
  const userWithPassword = users[data?.username || '']
  if (!userWithPassword || userWithPassword.password !== data?.password) {
    throw new Error('账号或密码错误')
  }
  const { password: _password, ...user } = userWithPassword
  return {
    token: `mobile-mock-${user.username}-${Date.now()}`,
    user: hydrateMockUser(user)
  }
}

function page<T>(items: T[], pageNum = 1, pageSize = 10) {
  const start = (pageNum - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    pageNum,
    pageSize
  }
}

function filterInboundOrders(params: Row) {
  return inboundOrders.filter((row) => {
    const orderNo = text(params.orderNo)
    const supplier = text(params.supplier)
    const inboundType = text(params.inboundType)
    const sapPlant = text(params.sapPlant)
    const sapStorageLocation = text(params.sapStorageLocation)
    const status = text(params.status)
    return includes(row.order_no, orderNo)
      && includes(`${row.supplier_code || ''} ${row.supplier_name || ''} ${row.owner_name || ''}`, supplier)
      && (!inboundType || row.inbound_type === inboundType)
      && includes(row.sap_plant, sapPlant)
      && includes(row.sap_storage_location, sapStorageLocation)
      && (!status || row.status === status)
  })
}

function filterOutboundOrders(params: Row) {
  return outboundOrders.filter((row) => {
    const orderNo = text(params.orderNo)
    const customer = text(params.customer || params.customerName || params.consigneeCode)
    const shipFromCountry = text(params.shipFromCountry || params.country)
    const productCode = text(params.productCode)
    const status = text(params.status)
    const sapPostStatus = text(params.sapPostStatus)
    const lines = outboundLines[Number(row.id)] || []
    return includes(`${row.order_no || ''} ${row.shipment_order_no || ''}`, orderNo)
      && includes(`${row.customer_code || ''} ${row.customer_name || ''} ${row.consignee_code || ''} ${row.consignee_name || ''}`, customer)
      && includes(row.ship_from_country || row.shipFromCountry, shipFromCountry)
      && (!productCode || lines.some((line) => includes(line.product_code, productCode)))
      && (!status || row.status === status)
      && (!sapPostStatus || row.sap_post_status === sapPostStatus)
  })
}

function outboundDetail(id: number) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到发运订单')
  const details = outboundLines[id] || []
  return {
    order: {
      ...order,
      lines: details
    },
    details,
    lines: details,
    allocations: outboundAllocations[id] || [],
    pickingRecords: outboundPickingRecords[id] || [],
    pickingTasks: [],
    shipments: outboundShipments[id] || [],
    operationLogs: outboundOperationLogs[id] || [],
    interfaceLogs: outboundInterfaceLogs[id] || [],
    exceptions: []
  }
}

function outboundAllocationView(id: number) {
  const detail = outboundDetail(id)
  const usable = (outboundAvailableInventory[id] || []).filter(isAllocatableInventory)
  return {
    ...detail,
    availableInventory: outboundAvailableInventory[id] || [],
    recommendedInventory: usable
  }
}

function allocateOutboundAutoMock(id: number) {
  const lines = outboundLines[id] || []
  let allocated = 0
  for (const line of lines) {
    const need = lineRemainingToAllocate(line)
    if (need <= 0) continue
    allocated += allocateLineFromInventory(id, line, need, 'AUTO_FIFO')
  }
  if (allocated <= 0) {
    setOutboundStatus(id, 'ALLOCATION_EXCEPTION')
    pushOutboundOperation(id, '自动分配', '移动端自动分配失败：库存不足或无合格可用库存')
    throw new Error('库存不足：无合格、可用、未冻结、未锁定库存可分配')
  }
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '自动分配', `移动端自动分配 ${allocated} 件，未扣减库存`)
  return outboundDetail(id)
}

function allocateOutboundManualMock(id: number, body: Row) {
  const line = findOutboundLine(id, Number(body.lineId))
  if (!line) throw new Error('请选择产品行')
  const need = lineRemainingToAllocate(line)
  if (need <= 0) throw new Error('该产品行已完成分配')
  const serials = parseSerials(body.serialNumbers)
  const snRequired = Number(line.sn_required ?? 0) === 1
  let allocated = 0
  if (snRequired) {
    if (!serials.length) throw new Error('SN 管理产品必须选择 SN 库存')
    if (serials.length > need) throw new Error('分配数量不能超过订单剩余待分配数量')
    serials.forEach((sn) => {
      const inventory = (outboundAvailableInventory[id] || []).find((row) => row.sn_code === sn && Number(row.outbound_detail_id) === Number(line.id || line.line_id || line.outbound_detail_id))
      if (!inventory) throw new Error(`SN ${sn} 不属于当前发运订单产品行`)
      if (!isAllocatableInventory(inventory)) throw new Error(`SN ${sn} 当前库存状态不允许分配`)
      allocated += createOutboundAllocation(id, line, inventory, 1, 'MANUAL')
    })
  } else {
    const qty = Number(body.quantity || 0)
    if (qty <= 0) throw new Error('人工分配数量必须大于 0')
    if (qty > need) throw new Error('分配数量不能超过订单剩余待分配数量')
    const inventory = (outboundAvailableInventory[id] || []).find((row) =>
      Number(row.outbound_detail_id) === Number(line.id || line.line_id || line.outbound_detail_id)
      && (!body.locationCode || row.location_code === body.locationCode)
      && isAllocatableInventory(row)
      && Number(row.available_qty || 0) >= qty
    )
    if (!inventory) throw new Error('未找到满足数量和库位条件的可用库存')
    allocated += createOutboundAllocation(id, line, inventory, qty, 'MANUAL')
  }
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '人工分配', `移动端人工指定分配 ${allocated} 件`)
  return outboundDetail(id)
}

function releaseOutboundAllocationMock(id: number) {
  const rows = outboundAllocations[id] || []
  if (rows.some((row) => ['PICKED', 'REVIEWED', 'SHIPPED'].includes(String(row.allocation_status || '')))) {
    throw new Error('存在已拣货或已发货分配记录，不能整单取消分配')
  }
  rows.filter((row) => row.allocation_status === 'ALLOCATED').forEach((row) => cancelOutboundAllocationRow(id, row))
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '取消分配', '移动端整单取消未拣货分配记录')
  return outboundDetail(id)
}

function cancelOutboundAllocationsMock(id: number, allocationIds: number[]) {
  if (!allocationIds.length) throw new Error('请选择要取消的分配记录')
  const rows = outboundAllocations[id] || []
  allocationIds.forEach((allocationId) => {
    const row = rows.find((item) => Number(item.id) === Number(allocationId))
    if (!row) throw new Error('未找到分配记录')
    if (row.allocation_status !== 'ALLOCATED') throw new Error('仅未拣货的分配记录允许取消')
    cancelOutboundAllocationRow(id, row)
  })
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '取消分配', `移动端取消分配记录 ${allocationIds.length} 条`)
  return outboundDetail(id)
}

function pickOutboundMock(id: number, body: Row) {
  const line = findOutboundLine(id, Number(body.lineId))
  if (!line) throw new Error('请选择产品行')
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order || ['CANCELED', 'CLOSED', 'SHIPPED', 'CALLBACK_SUCCESS'].includes(String(order.status || ''))) {
    throw new Error('当前发运订单状态不允许拣货')
  }
  const remaining = lineRemainingToPick(line)
  if (remaining <= 0) throw new Error('该产品行已完成拣货')
  const snRequired = Number(line.sn_required ?? 0) === 1
  const serials = parseSerials(body.serialNumbers)
  const pickMode = body.pickMode || 'ALLOCATED'
  let picked = 0
  if (snRequired) {
    if (!serials.length) throw new Error('SN 管理产品必须扫描 SN')
    if (serials.length > remaining) throw new Error('拣货数量不能超过剩余待拣数量')
    serials.forEach((sn) => {
      if ((outboundPickingRecords[id] || []).some((row) => row.sn_code === sn && !['CANCELED'].includes(String(row.result || '')))) {
        throw new Error(`SN ${sn} 已拣货，不能重复扫描`)
      }
      const allocation = (outboundAllocations[id] || []).find((row) =>
        row.sn_code === sn
        && Number(row.outbound_detail_id) === Number(line.id || line.line_id || line.outbound_detail_id)
      )
      if (pickMode !== 'DIRECT') {
        if (!allocation) throw new Error(`SN ${sn} 不属于当前订单分配范围`)
        if (allocation.allocation_status !== 'ALLOCATED') throw new Error(`SN ${sn} 当前分配状态不允许拣货`)
      }
      if (body.locationCode && allocation?.location_code && body.locationCode !== allocation.location_code) {
        throw new Error(`SN ${sn} 所在库位与拣货库位不一致`)
      }
      if (allocation) allocation.allocation_status = 'PICKED'
      createOutboundPickRecord(id, line, allocation || { sn_code: sn, location_code: body.locationCode }, 1, pickMode)
      picked += 1
    })
  } else {
    const qty = Number(body.quantity || 0)
    if (qty <= 0) throw new Error('拣货数量必须大于 0')
    if (qty > remaining) throw new Error('拣货数量不能超过剩余待拣数量')
    const activeAllocatedQty = activeAllocatedQuantity(id, line)
    if (pickMode !== 'DIRECT' && qty > activeAllocatedQty) throw new Error('拣货数量不能超过已分配数量')
    const allocation = (outboundAllocations[id] || []).find((row) =>
      Number(row.outbound_detail_id) === Number(line.id || line.line_id || line.outbound_detail_id)
      && row.allocation_status === 'ALLOCATED'
    )
    if (allocation) allocation.allocation_status = 'PICKED'
    createOutboundPickRecord(id, line, allocation || { location_code: body.locationCode }, qty, pickMode)
    picked = qty
  }
  line.picked_qty = Number(line.picked_qty || 0) + picked
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '拣货', `移动端扫码/手工拣货 ${picked} 件`)
  return outboundDetail(id)
}

function cancelOutboundPickMock(id: number, pickId: number) {
  const record = (outboundPickingRecords[id] || []).find((row) => Number(row.id) === Number(pickId))
  if (!record) throw new Error('未找到拣货记录')
  if (['CANCELED', 'SHIPPED'].includes(String(record.result || record.status || '')) || record.shipment_no) {
    throw new Error('已取消、已发货或已关联发货单的拣货记录不能取消')
  }
  record.result = 'CANCELED'
  const line = (outboundLines[id] || []).find((row) => Number(row.line_no) === Number(record.line_no) || row.product_code === record.product_code)
  if (line) line.picked_qty = Math.max(Number(line.picked_qty || 0) - Number(record.picked_qty || 1), 0)
  const allocation = (outboundAllocations[id] || []).find((row) =>
    (record.sn_code && row.sn_code === record.sn_code)
    || (!record.sn_code && row.product_code === record.product_code && row.allocation_status === 'PICKED')
  )
  if (allocation && allocation.allocation_status === 'PICKED') allocation.allocation_status = 'ALLOCATED'
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '取消拣货', `移动端取消拣货记录 ${record.task_no || record.id}`)
  return outboundDetail(id)
}

function cancelOutboundPicksMock(id: number, pickIds: number[]) {
  if (!pickIds.length) throw new Error('请选择要取消的拣货记录')
  pickIds.forEach((pickId) => cancelOutboundPickMock(id, Number(pickId)))
  return outboundDetail(id)
}

function shipOutboundMock(id: number, body: Row) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到发运订单')
  if (['CANCELED', 'CLOSED'].includes(String(order.status || ''))) throw new Error('已取消或已关闭的发运订单不允许发货')
  const lineId = Number(body.lineId || 0)
  const rows = (outboundAllocations[id] || []).filter((row) =>
    ['PICKED', 'REVIEWED'].includes(String(row.allocation_status || ''))
    && (!lineId || Number(row.outbound_detail_id) === lineId)
  )
  if (!rows.length) throw new Error('没有已拣货未发运数据')
  const requestedQty = Number(body.shipQty || 0)
  const availableToShip = rows.reduce((sum, row) => sum + Number(row.allocated_qty || 1), 0)
  if (requestedQty > availableToShip) throw new Error('本次发货数量不能超过已拣货未发货数量')

  const shipmentNo = `SHP-M-${Date.now().toString().slice(-8)}`
  const carrier = body.carrierName || body.carrier || order.carrier_name || 'SF'
  const trackingNo = body.trackingNo || order.tracking_no || `SF${Date.now()}`
  const shipper = body.shipper || body.operator || 'mobile'
  let shippedQty = 0
  const shipment: Row = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    shipment_no: shipmentNo,
    line_no: '',
    product_code: '',
    product_name: '',
    owner_code: order.owner_code,
    carrier,
    tracking_no: trackingNo,
    shipped_qty: 0,
    shipment_status: 'SHIPPED',
    sap_post_status: body.forceSapFail ? 'FAILED' : 'SUCCESS',
    sap_material_doc_no: body.forceSapFail ? '' : `49${Date.now().toString().slice(-8)}`,
    sap_post_result: body.forceSapFail ? '移动端模拟 SAP 出库扣减失败' : 'SAP 出库扣减成功',
    ship_time: now(),
    shipper,
    remark: body.remark || ''
  }
  outboundShipments[id] ||= []
  outboundShipments[id].unshift(shipment)

  for (const row of rows) {
    if (requestedQty > 0 && shippedQty >= requestedQty) break
    const rowQty = Math.min(Number(row.allocated_qty || 1), requestedQty > 0 ? requestedQty - shippedQty : Number(row.allocated_qty || 1))
    const shippedRow = rowQty < Number(row.allocated_qty || 1) ? splitOutboundAllocationForShipment(id, row, rowQty) : row
    shipOutboundAllocation(id, shippedRow, rowQty, shipment)
    if (!shipment.line_no) {
      shipment.line_no = shippedRow.line_no
      shipment.product_code = shippedRow.product_code
      shipment.product_name = shippedRow.product_name
      shipment.sn_code = shippedRow.sn_code
    }
    shippedQty += rowQty
  }
  shipment.shipped_qty = shippedQty
  order.carrier_name = carrier
  order.tracking_no = trackingNo
  order.shipper = shipper
  order.ship_time = shipment.ship_time
  order.sap_post_status = shipment.sap_post_status
  order.sap_post_result = shipment.sap_post_result
  order.sap_material_doc_no = shipment.sap_material_doc_no
  refreshOutboundOrderTotals(id)
  pushOutboundOperation(id, '发货', `移动端发货确认 ${shippedQty} 件，已扣减库存并更新 SN 状态`)
  pushOutboundInterface(id, 'TRACE_OUTBOUND_SN', body.forceTraceFail ? 'FAILED' : 'SUCCESS', body.forceTraceFail ? '移动端模拟追溯回传失败' : '')
  pushOutboundInterface(id, 'SAP_OUTBOUND_POSTING', shipment.sap_post_status, shipment.sap_post_status === 'FAILED' ? shipment.sap_post_result : '')
  return outboundDetail(id)
}

function cancelOutboundShipmentMock(id: number, shipmentId: number) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到发运订单')
  if (['CLOSED', 'CANCELED'].includes(String(order.status || ''))) throw new Error('已关闭或已取消的发运订单不允许取消发货')
  const shipment = (outboundShipments[id] || []).find((row) => Number(row.id) === Number(shipmentId))
  if (!shipment) throw new Error('发货批次不存在')
  if (shipment.shipment_status === 'CANCELED') throw new Error('发货批次已取消，请勿重复操作')
  if (['SUCCESS', 'POSTED'].includes(String(shipment.sap_post_status || ''))) throw new Error('当前发货批次已回传 SAP 成功，不允许直接取消发货')
  const shipmentNo = String(shipment.shipment_no || '')
  ;(outboundAllocations[id] || []).filter((row) => row.shipment_no === shipmentNo && row.allocation_status === 'SHIPPED').forEach((row) => {
    row.allocation_status = 'PICKED'
    row.shipment_no = ''
    const line = findOutboundLine(id, Number(row.outbound_detail_id))
    if (line) line.shipped_qty = Math.max(Number(line.shipped_qty || 0) - Number(row.allocated_qty || 1), 0)
    const inventory = findOutboundInventoryByAllocation(id, row)
    if (inventory) {
      inventory.shipped_qty = Math.max(Number(inventory.shipped_qty || 0) - Number(row.allocated_qty || 1), 0)
      inventory.sn_status = row.sn_code ? 'PICKED' : inventory.sn_status
    }
  })
  ;(outboundPickingRecords[id] || []).filter((row) => row.shipment_no === shipmentNo).forEach((row) => {
    row.result = 'SUCCESS'
    row.shipment_no = ''
  })
  shipment.shipment_status = 'CANCELED'
  shipment.sap_post_status = 'CANCELED'
  shipment.sap_post_result = '移动端取消发货'
  refreshOutboundOrderTotals(id)
  const refreshed = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (refreshed && Number(refreshed.shipped_qty || 0) === 0 && !['SUCCESS', 'POSTED'].includes(String(refreshed.sap_post_status || ''))) {
    refreshed.sap_post_status = 'NOT_POSTED'
    refreshed.sap_post_result = ''
  }
  pushOutboundOperation(id, '取消发货', `移动端取消发货批次 ${shipmentNo}`)
  return outboundDetail(id)
}

function cancelOutboundShipmentsMock(id: number, shipmentIds: number[]) {
  if (!shipmentIds.length) throw new Error('请选择要取消的发货记录')
  const failedItems: Row[] = []
  let successCount = 0
  shipmentIds.forEach((shipmentId) => {
    try {
      cancelOutboundShipmentMock(id, Number(shipmentId))
      successCount += 1
    } catch (error) {
      failedItems.push({ id: shipmentId, reason: error instanceof Error ? error.message : '取消失败' })
    }
  })
  pushOutboundOperation(id, '批量取消发货', `移动端批量取消发货，成功 ${successCount} 条，失败 ${failedItems.length} 条`)
  return { successCount, failedItems }
}

function postOutboundSapMock(id: number, forceFail: boolean) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到发运订单')
  if (Number(order.shipped_qty || 0) <= 0) throw new Error('没有发货记录的订单不允许 SAP 回传')
  const pendingShipments = (outboundShipments[id] || []).filter((row) =>
    row.shipment_status !== 'CANCELED' && ['FAILED', 'NOT_POSTED', '', undefined].includes(row.sap_post_status)
  )
  if (!pendingShipments.length && ['SUCCESS', 'POSTED'].includes(String(order.sap_post_status || ''))) {
    throw new Error('当前发运订单已 SAP 回传成功')
  }
  const status = forceFail ? 'FAILED' : 'SUCCESS'
  const materialDocNo = forceFail ? '' : `49${Date.now().toString().slice(-8)}`
  ;(pendingShipments.length ? pendingShipments : outboundShipments[id] || []).filter((row) => row.shipment_status !== 'CANCELED').forEach((row) => {
    row.sap_post_status = status
    row.sap_material_doc_no = materialDocNo
    row.sap_post_result = forceFail ? '移动端模拟 SAP 出库扣减失败' : `SAP 出库扣减成功，凭证号 ${materialDocNo}`
  })
  order.sap_post_status = status
  order.sap_material_doc_no = materialDocNo
  order.sap_post_result = forceFail ? '移动端模拟 SAP 出库扣减失败' : `SAP 出库扣减成功，凭证号 ${materialDocNo}`
  pushOutboundOperation(id, forceFail ? 'SAP 回传失败' : 'SAP 回传', forceFail ? '移动端触发 SAP 出库扣减失败' : '移动端触发 SAP 出库扣减成功')
  pushOutboundInterface(id, 'SAP_OUTBOUND_POSTING', status, forceFail ? order.sap_post_result : '')
  return outboundDetail(id)
}

function splitOutboundAllocationForShipment(id: number, row: Row, qty: number): Row {
  row.allocated_qty = Math.max(Number(row.allocated_qty || 0) - qty, 0)
  const copy: Row = {
    ...row,
    id: Date.now() + Math.floor(Math.random() * 10000),
    allocation_no: `ALLOC-S-${Date.now().toString().slice(-8)}`,
    allocated_qty: qty,
    allocation_status: 'PICKED'
  }
  outboundAllocations[id].unshift(copy)
  return copy
}

function shipOutboundAllocation(id: number, allocation: Row, qty: number, shipment: Row) {
  allocation.allocation_status = 'SHIPPED'
  allocation.shipment_no = shipment.shipment_no
  const line = findOutboundLine(id, Number(allocation.outbound_detail_id))
  if (line) line.shipped_qty = Number(line.shipped_qty || 0) + qty
  const inventory = findOutboundInventoryByAllocation(id, allocation)
  if (inventory) {
    inventory.allocated_qty = Math.max(Number(inventory.allocated_qty || 0) - qty, 0)
    inventory.shipped_qty = Number(inventory.shipped_qty || 0) + qty
    inventory.sn_status = allocation.sn_code ? 'SHIPPED' : inventory.sn_status
  }
  ;(outboundPickingRecords[id] || []).filter((row) =>
    (!allocation.sn_code || row.sn_code === allocation.sn_code)
    && row.product_code === allocation.product_code
    && !['CANCELED'].includes(String(row.result || ''))
  ).forEach((row) => {
    row.result = 'SHIPPED'
    row.shipment_no = shipment.shipment_no
  })
}

function findOutboundInventoryByAllocation(id: number, allocation: Row) {
  return (outboundAvailableInventory[id] || []).find((item) =>
    (allocation.sn_code && item.sn_code === allocation.sn_code)
    || (!allocation.sn_code && Number(item.outbound_detail_id) === Number(allocation.outbound_detail_id) && item.location_code === allocation.location_code)
  )
}

function inboundDetail(id: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到预期到货通知单')
  const details = inboundLines[id] || []
  return {
    order: {
      ...order,
      lines: details
    },
    details,
    lines: details,
    serialNumbers: serialNumbers[id] || [],
    receiptRecords: receiptRecords[id] || [],
    operationLogs: operationLogs[id] || [],
    interfaceLogs: interfaceLogs[id] || []
  }
}

function legacyPostInboundSap(id: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到预期到货通知单')
  order.sap_post_status = 'SUCCESS'
  order.sap_post_result = 'SAP 入库回传成功'
  order.sap_material_doc_no = `5000${Date.now().toString().slice(-6)}`
  order.pending_sap_receipt_count = 0
  ;(receiptRecords[id] || []).forEach((row) => {
    row.sap_post_status = 'SUCCESS'
    row.sap_material_doc_no ||= order.sap_material_doc_no
    row.sap_post_result = 'SAP 入库回传成功'
  })
  pushOperation(id, 'SAP 回传', '移动端触发 SAP 入库回传')
  pushInterface(id, 'SAP_INBOUND_POST', 'SUCCESS', '')
  return inboundDetail(id)
}

function postInboundSap(id: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到预期到货通知单')
  const pendingReceipts = (receiptRecords[id] || []).filter((row) =>
    row.status !== 'CANCELED' && ['NOT_POSTED', 'FAILED'].includes(String(row.sap_post_status || ''))
  )
  if (!pendingReceipts.length) throw new Error('当前单据没有待回传或失败的收货批次')
  const materialDocNo = `49${Date.now().toString().slice(-8)}`
  pendingReceipts.forEach((row) => {
    row.status = 'SAP_POSTED'
    row.sap_post_status = 'SUCCESS'
    row.sap_material_doc_no = materialDocNo
    row.sap_post_result = `SAP 入库过账成功，凭证号 ${materialDocNo}`
  })
  order.sap_post_status = 'SUCCESS'
  order.sap_post_result = `SAP 入库过账成功，凭证号 ${materialDocNo}`
  order.sap_material_doc_no = materialDocNo
  order.pending_sap_receipt_count = 0
  pushOperation(id, 'SAP 回传', `移动端按收货批次触发 SAP 入库回传，批次数 ${pendingReceipts.length}`)
  pushInterface(id, 'SAP_INBOUND_RECEIPT_POSTING', 'SUCCESS', '')
  refreshInboundOrderTotals(id)
  return inboundDetail(id)
}

function cancelOrder(id: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到预期到货通知单')
  order.status = 'CANCELED'
  pushOperation(id, '取消单据', '移动端取消预期到货通知单')
  return inboundDetail(id)
}

function legacyCancelReceipt(id: number, receiptId: number) {
  const receipt = (receiptRecords[id] || []).find((row) => Number(row.receipt_id || row.id) === Number(receiptId))
  if (!receipt) throw new Error('未找到收货批次')
  if (['SUCCESS', 'POSTED'].includes(receipt.sap_post_status)) throw new Error('SAP 已回传成功的收货批次不允许取消')
  receipt.status = 'CANCELED'
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (order) {
    order.received_qty = Math.max(Number(order.received_qty || 0) - Number(receipt.receive_qty || 0), 0)
    order.status = order.received_qty > 0 ? 'PARTIAL_RECEIVED' : 'CREATED'
  }
  const line = (inboundLines[id] || []).find((row) => Number(row.line_no) === Number(receipt.line_no))
  if (line) {
    line.received_qty = Math.max(Number(line.received_qty || 0) - Number(receipt.receive_qty || 0), 0)
    line.line_status = line.received_qty > 0 ? 'PARTIAL_RECEIVED' : 'CREATED'
  }
  pushOperation(id, '取消收货', `移动端取消收货批次 ${receipt.receipt_no}`)
  return inboundDetail(id)
}

function receiveInboundOrder(id: number, body: Row) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) throw new Error('未找到预期到货通知单')
  if (['CLOSED', 'CANCELED'].includes(String(order.status || ''))) throw new Error('当前单据状态不允许收货')
  const requestLines = Array.isArray(body.lines) ? body.lines : []
  if (!requestLines.length) throw new Error('请至少选择一条产品行收货')
  if (!body.locationCode) throw new Error('目标库位不能为空')

  const receiptNo = `RCV${Date.now()}`
  const receiptId = Date.now()
  let totalReceiveQty = 0
  const createdReceipts: Row[] = []

  requestLines.forEach((requestLine: Row, index: number) => {
    const lineId = Number(requestLine.lineId)
    if (!lineId) throw new Error('lineId 不能为空')
    const line = (inboundLines[id] || []).find((row) => Number(row.id || row.inbound_order_line_id) === lineId)
    if (!line) throw new Error('未找到入库单产品行')
    if (requestLine.productId && Number(requestLine.productId) !== normalizedProductId(line)) {
      throw new Error('提交产品与当前入库明细行不一致')
    }

    const plannedQty = Number(line.planned_qty || line.order_qty || 0)
    const receivedQty = Number(line.received_qty || 0)
    const remainingQty = Math.max(plannedQty - receivedQty, 0)
    const snRequired = Number(line.sn_required ?? 0) === 1
    const receiveSnList = parseSerials(requestLine.receiveSnList)
    const thisReceiveQty = snRequired ? receiveSnList.length : Number(requestLine.receiveQty || 0)

    if (snRequired) {
      if (!receiveSnList.length) throw new Error('SN 管理产品必须先采集 SN 后再收货')
      const pendingRows = (serialNumbers[id] || []).filter((row) =>
        Number(row.inbound_order_line_id) === lineId && row.status === 'COLLECTED'
      )
      if (thisReceiveQty > pendingRows.length) throw new Error('本次收货 SN 数量超过已采集待收货数量')
      receiveSnList.forEach((sn) => {
        const snRow = pendingRows.find((row) => row.sn_code === sn)
        if (!snRow) throw new Error(`SN ${sn} 不属于当前入库行或不是待收货状态`)
      })
      receiveSnList.forEach((sn) => {
        const snRow = pendingRows.find((row) => row.sn_code === sn)
        if (snRow) {
          snRow.status = 'RECEIVED'
          snRow.location_code = body.locationCode
          snRow.receipt_no = receiptNo
          snRow.received_at = now()
        }
      })
    } else {
      if (receiveSnList.length) throw new Error('非 SN 管理产品不允许携带 SN 收货')
      if (thisReceiveQty <= 0) throw new Error('本次收货数量必须大于 0')
    }

    if (thisReceiveQty <= 0) throw new Error('本次收货数量必须大于 0')
    if (thisReceiveQty > remainingQty) throw new Error(`当前产品本次最多可收货 ${remainingQty}`)

    totalReceiveQty += thisReceiveQty
    line.received_qty = receivedQty + thisReceiveQty
    syncLineReceiveState(id, line)
    createdReceipts.push({
      id: receiptId + index,
      receipt_id: receiptId + index,
      receipt_no: receiptNo,
      receipt_time: now(),
      receipt_user: body.operator || 'mobile',
      line_no: line.line_no,
      product_id: line.product_id,
      product_code: line.product_code,
      receive_qty: thisReceiveQty,
      status: 'RECEIVED',
      sap_post_status: 'NOT_POSTED',
      sap_material_doc_no: '',
      sap_post_result: '',
      location_code: body.locationCode,
      receive_sn_list: receiveSnList
    })
  })

  if (totalReceiveQty <= 0) throw new Error('本次收货数量必须大于 0')
  receiptRecords[id] ||= []
  receiptRecords[id].unshift(...createdReceipts)
  refreshInboundOrderTotals(id)
  pushOperation(id, '收货', `移动端收货 ${totalReceiveQty} 件，目标库位 ${body.locationCode}`)
  return { ...inboundDetail(id), receiptNo }
}

function cancelReceipt(id: number, receiptId: number) {
  const receipt = (receiptRecords[id] || []).find((row) => Number(row.receipt_id || row.id) === Number(receiptId))
  if (!receipt) throw new Error('未找到收货批次')
  if (['CANCELED'].includes(String(receipt.status || ''))) throw new Error('该收货批次已取消')
  if (['SUCCESS', 'POSTED'].includes(String(receipt.sap_post_status || ''))) throw new Error('SAP 已回传成功的收货批次不允许取消')
  receipt.status = 'CANCELED'
  const line = (inboundLines[id] || []).find((row) => Number(row.line_no) === Number(receipt.line_no))
  if (line) {
    const qty = Number(receipt.receive_qty || 0)
    line.received_qty = Math.max(Number(line.received_qty || 0) - qty, 0)
    const lineId = Number(line.id || line.inbound_order_line_id)
    const receiptSns = parseSerials(receipt.receive_sn_list)
    const receivedRows = (serialNumbers[id] || []).filter((row) =>
      Number(row.inbound_order_line_id) === lineId
      && row.status === 'RECEIVED'
      && (receiptSns.length ? receiptSns.includes(row.sn_code) : row.receipt_no === receipt.receipt_no)
    )
    const fallbackRows = receivedRows.length ? receivedRows : (serialNumbers[id] || [])
      .filter((row) => Number(row.inbound_order_line_id) === lineId && row.status === 'RECEIVED')
      .slice(0, qty)
    fallbackRows.slice(0, qty).forEach((row) => {
      row.status = 'COLLECTED'
      row.location_code = ''
      row.receipt_no = ''
      row.received_at = ''
    })
    syncLineReceiveState(id, line)
  }
  refreshInboundOrderTotals(id)
  pushOperation(id, '取消收货', `移动端取消收货批次 ${receipt.receipt_no}`)
  return inboundDetail(id)
}

function cancelCollectedSn(id: number, lineId: number, sns: string[]) {
  const snRows = serialNumbers[id] || []
  snRows.forEach((row) => {
    if (Number(row.inbound_order_line_id) === Number(lineId) && (!sns.length || sns.includes(row.sn_code)) && row.status === 'COLLECTED') {
      row.status = 'CANCELED'
    }
  })
  const line = (inboundLines[id] || []).find((row) => Number(row.id || row.inbound_order_line_id) === Number(lineId))
  if (line) {
    const activeCollected = snRows.filter((row) => Number(row.inbound_order_line_id) === Number(lineId) && row.status === 'COLLECTED').length
    line.collected_sn_qty = activeCollected
    line.pending_receive_qty = activeCollected
  }
  pushOperation(id, '取消 SN 采集', `移动端取消 ${sns.length || 1} 个 SN 采集关系`)
  return { successCount: sns.length || 1 }
}

function snCollectContext(id: number, lineId: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  const line = (inboundLines[id] || []).find((row) => Number(row.id || row.inbound_order_line_id) === Number(lineId))
  if (!order || !line) throw new Error('未找到入库单产品行')
  const pendingReceiveQty = collectedSnRows(id, lineId).filter((row) => row.snStatus === 'COLLECTED').length
  const collectedQty = collectedSnRows(id, lineId).filter((row) => ['COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(row.snStatus)).length
  const planQty = Number(line.planned_qty || line.order_qty || 0)
  const receivedQty = Number(line.received_qty || 0)
  const remaining = Math.max(planQty - receivedQty - pendingReceiveQty, 0)
  return {
    inboundOrderId: id,
    inboundOrderNo: order.order_no,
    inboundType: order.inbound_type,
    sourceSystem: order.source_system,
    warehouseCode: order.warehouse_code,
    warehouseName: order.warehouse_name,
    lineId: Number(line.id || line.inbound_order_line_id),
    lineNo: line.line_no,
    productId: Number(String(line.product_id || '').replace(/\D/g, '')) || Number(line.id || line.inbound_order_line_id),
    productCode: line.product_code,
    productName: line.product_name,
    snRequired: Number(line.sn_required ?? 0) === 1,
    sapPlant: line.sap_plant,
    sapStorageLocation: line.sap_storage_location,
    planQty,
    receivedQty,
    collectedQty,
    pendingReceiveQty,
    remainingCollectQty: remaining,
    remainingQty: remaining,
    lineStatus: line.line_status || line.status,
    batchNo: line.batch_no,
    boxRequired: false
  }
}

function collectedSnRows(id: number, lineId: number) {
  return (serialNumbers[id] || [])
    .filter((row) => Number(row.inbound_order_line_id) === Number(lineId) && ['COLLECTED', 'RECEIVED', 'ON_SHELF', 'CANCELED_COLLECT', 'CANCELED'].includes(row.status))
    .map((row) => {
      const line = (inboundLines[id] || []).find((item) => Number(item.id || item.inbound_order_line_id) === Number(row.inbound_order_line_id)) || {}
      return {
        id: row.id,
        snCode: row.sn_code,
        productId: Number(String(line.product_id || '').replace(/\D/g, '')) || Number(line.id || line.inbound_order_line_id),
        productCode: row.product_code || line.product_code,
        productName: line.product_name,
        lineId: row.inbound_order_line_id,
        lineNo: line.line_no,
        palletCode: row.pallet_code,
        boxCode: row.box_code,
        snStatus: row.status,
        receiveStatus: row.status === 'COLLECTED' ? 'PENDING_RECEIVE' : row.status,
        collectedAt: row.created_at || '2026-06-11 10:12:00',
        receivedAt: row.status === 'RECEIVED' ? '2026-06-11 10:12:00' : '',
        locationCode: row.location_code || ''
      }
    })
}

function validateSnCollection(id: number, lineId: number, body: Row) {
  const context = snCollectContext(id, lineId)
  const serials = parseSerials(body.serialNumbers)
  const seen = new Set<string>()
  const history = new Set(collectedSnRows(id, lineId).filter((row) => row.snStatus !== 'CANCELED_COLLECT' && row.snStatus !== 'CANCELED').map((row) => row.snCode))
  let acceptedQty = 0
  const items = serials.map((sn) => {
    const item: Row = {
      snCode: sn,
      productCode: context.productCode,
      status: 'PASS',
      message: '校验通过，可按当前产品行采集'
    }
    if (!body.orderId || !body.lineId) markFailed(item, 'orderId 和 lineId 必填')
    else if (!body.productId) markFailed(item, 'productId 必填')
    else if (!context.snRequired) markFailed(item, '当前产品不启用 SN 管理，请直接收货')
    else if (!body.palletCode) markFailed(item, '托盘码必填')
    else if (!sn) markFailed(item, 'SN 不能为空')
    else if (Number(body.productId) !== Number(context.productId)) markFailed(item, '提交产品与当前入库明细行不一致')
    else if (seen.has(sn)) markFailed(item, '本次录入中存在重复 SN')
    else if (history.has(sn)) markFailed(item, '该 SN 已在当前产品明细中采集过，请勿重复采集')
    else if (acceptedQty >= Number(context.remainingQty || 0)) markFailed(item, `本次采集数量超过该产品行剩余可采集数量 ${context.remainingQty}`)
    else {
      const conflict = globalSnConflictMessage(sn, id, context)
      if (conflict) {
        markFailed(item, conflict)
      } else {
        seen.add(sn)
        acceptedQty += 1
      }
    }
    return item
  })
  const invalidQty = items.filter((item) => item.status !== 'PASS').length
  return {
    ...context,
    inputQty: serials.length,
    validQty: acceptedQty,
    invalidQty,
    valid: invalidQty === 0 && acceptedQty > 0,
    items,
    message: invalidQty ? `校验失败 ${invalidQty} 条` : `校验通过 ${acceptedQty} 条`
  }
}

function confirmSnCollection(id: number, lineId: number, body: Row) {
  const result = validateSnCollection(id, lineId, body)
  if (!result.valid) throw new Error(result.items.find((item: Row) => item.status !== 'PASS')?.message || result.message)
  const line = (inboundLines[id] || []).find((row) => Number(row.id || row.inbound_order_line_id) === Number(lineId))
  if (!line) throw new Error('未找到入库单产品行')
  const rows = serialNumbers[id] ||= []
  result.items
    .filter((item: Row) => item.status === 'PASS')
    .forEach((item: Row) => {
      rows.unshift({
        id: Date.now() + Math.random(),
        sn_code: item.snCode,
        product_code: line.product_code,
        warehouse_code: result.warehouseCode,
        warehouse_name: result.warehouseName,
        box_code: body.boxCode || '',
        pallet_code: body.palletCode,
        status: 'COLLECTED',
        location_code: '',
        inbound_order_line_id: Number(lineId),
        created_at: now()
      })
    })
  const pending = collectedSnRows(id, lineId).filter((row) => row.snStatus === 'COLLECTED').length
  line.pending_receive_qty = pending
  line.collected_sn_qty = pending + Number(line.received_qty || 0)
  if (line.line_status === 'CREATED') line.line_status = 'CREATED'
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (order) {
    order.pending_receive_qty = (inboundLines[id] || []).reduce((sum, row) => sum + Number(row.pending_receive_qty || 0), 0)
    order.collected_qty = (inboundLines[id] || []).reduce((sum, row) => sum + Number(row.collected_sn_qty || 0), 0)
  }
  pushOperation(id, 'SN 采集', `移动端按产品行采集 SN ${result.validQty} 个，托盘 ${body.palletCode}`)
  return inboundDetail(id)
}

function normalizedProductId(line: Row) {
  return Number(String(line.product_id || '').replace(/\D/g, '')) || Number(line.id || line.inbound_order_line_id)
}

function syncLineReceiveState(id: number, line: Row) {
  const lineId = Number(line.id || line.inbound_order_line_id)
  const snRequired = Number(line.sn_required ?? 0) === 1
  if (snRequired) {
    const rows = serialNumbers[id] || []
    const pending = rows.filter((row) => Number(row.inbound_order_line_id) === lineId && row.status === 'COLLECTED').length
    const active = rows.filter((row) => Number(row.inbound_order_line_id) === lineId && ['COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(row.status)).length
    line.pending_receive_qty = pending
    line.collected_sn_qty = active
  } else {
    line.pending_receive_qty = 0
    line.collected_sn_qty = 0
  }
  const plannedQty = Number(line.planned_qty || line.order_qty || 0)
  const receivedQty = Number(line.received_qty || 0)
  line.line_status = receivedQty >= plannedQty ? 'RECEIVED' : (receivedQty > 0 ? 'PARTIAL_RECEIVED' : 'CREATED')
}

function refreshInboundOrderTotals(id: number) {
  const order = inboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) return
  const lines = inboundLines[id] || []
  lines.forEach((line) => syncLineReceiveState(id, line))
  const plannedQty = lines.reduce((sum, row) => sum + Number(row.planned_qty || row.order_qty || 0), 0)
  const receivedQty = lines.reduce((sum, row) => sum + Number(row.received_qty || 0), 0)
  const pendingReceiveQty = lines.reduce((sum, row) => sum + Number(row.pending_receive_qty || 0), 0)
  const collectedQty = lines.reduce((sum, row) => sum + Number(row.collected_sn_qty || 0), 0)
  order.planned_qty = plannedQty
  order.received_qty = receivedQty
  order.pending_receive_qty = pendingReceiveQty
  order.collected_qty = collectedQty
  order.line_count = lines.length
  order.pending_sap_receipt_count = (receiptRecords[id] || []).filter((row) =>
    row.status !== 'CANCELED' && !['SUCCESS', 'POSTED'].includes(String(row.sap_post_status || ''))
  ).length
  if (!['CLOSED', 'CANCELED'].includes(String(order.status || ''))) {
    order.status = receivedQty >= plannedQty ? 'RECEIVED' : (receivedQty > 0 ? 'PARTIAL_RECEIVED' : 'CREATED')
  }
  if (order.pending_sap_receipt_count > 0 && !['FAILED', 'SUCCESS', 'POSTED'].includes(String(order.sap_post_status || ''))) {
    order.sap_post_status = 'NOT_POSTED'
  }
  order.updated_at = now()
  order.updated_by = 'mobile'
}

function findOutboundLine(id: number, lineId: number) {
  return (outboundLines[id] || []).find((row) =>
    Number(row.id || row.line_id || row.outbound_detail_id) === Number(lineId)
    || Number(row.line_no) === Number(lineId)
  )
}

function lineRemainingToAllocate(line: Row) {
  return Math.max(Number(line.order_qty || line.planned_qty || 0) - Number(line.allocated_qty || 0), 0)
}

function lineRemainingToPick(line: Row) {
  const allocatedQty = Number(line.allocated_qty || 0)
  const plannedQty = Number(line.order_qty || line.planned_qty || 0)
  const pickLimit = allocatedQty > 0 ? allocatedQty : plannedQty
  return Math.max(pickLimit - Number(line.picked_qty || 0), 0)
}

function isAllocatableInventory(row: Row) {
  return Number(row.available_qty || 0) > 0
    && ['AVAILABLE', 'QUALIFIED', 'NORMAL', ''].includes(String(row.inventory_status || ''))
    && ['QUALIFIED', 'PASS', ''].includes(String(row.quality_status || ''))
    && !truthy(row.frozen_flag)
    && !truthy(row.locked_flag)
}

function allocateLineFromInventory(id: number, line: Row, need: number, mode: string) {
  let remaining = need
  let allocated = 0
  const lineId = Number(line.id || line.line_id || line.outbound_detail_id)
  const candidates = (outboundAvailableInventory[id] || [])
    .filter((row) => Number(row.outbound_detail_id) === lineId && isAllocatableInventory(row))
    .sort((a, b) => String(a.inbound_date || '').localeCompare(String(b.inbound_date || '')))
  for (const candidate of candidates) {
    if (remaining <= 0) break
    const qty = Math.min(Number(candidate.available_qty || 0), remaining)
    allocated += createOutboundAllocation(id, line, candidate, qty, mode)
    remaining -= qty
  }
  return allocated
}

function createOutboundAllocation(id: number, line: Row, inventory: Row, qty: number, mode: string) {
  const lineId = Number(line.id || line.line_id || line.outbound_detail_id)
  const allocation = {
    id: Date.now() + Math.floor(Math.random() * 10000),
    allocation_no: `ALLOC-M-${Date.now().toString().slice(-8)}`,
    line_no: line.line_no,
    outbound_detail_id: lineId,
    product_code: line.product_code,
    product_name: line.product_name || line.product_description,
    owner_code: inventory.owner_code || '3060',
    location_code: inventory.location_code,
    pallet_code: inventory.pallet_code,
    box_code: inventory.box_code,
    sn_code: inventory.sn_code,
    allocated_qty: qty,
    allocation_mode: mode,
    allocation_status: 'ALLOCATED',
    created_at: now()
  }
  outboundAllocations[id] ||= []
  outboundAllocations[id].unshift(allocation)
  inventory.available_qty = Math.max(Number(inventory.available_qty || 0) - qty, 0)
  inventory.allocated_qty = Number(inventory.allocated_qty || 0) + qty
  inventory.locked_flag = Boolean(inventory.sn_code)
  inventory.locked_order_no = (outboundOrders.find((row) => Number(row.id) === Number(id)) || {}).order_no
  line.allocated_qty = Number(line.allocated_qty || 0) + qty
  return qty
}

function cancelOutboundAllocationRow(id: number, row: Row) {
  row.allocation_status = 'CANCELED'
  const line = (outboundLines[id] || []).find((item) =>
    Number(item.id || item.line_id || item.outbound_detail_id) === Number(row.outbound_detail_id)
    || Number(item.line_no) === Number(row.line_no)
  )
  const qty = Number(row.allocated_qty || 0)
  if (line) line.allocated_qty = Math.max(Number(line.allocated_qty || 0) - qty, 0)
  const inventory = (outboundAvailableInventory[id] || []).find((item) =>
    (row.sn_code && item.sn_code === row.sn_code)
    || (!row.sn_code && Number(item.outbound_detail_id) === Number(row.outbound_detail_id) && item.location_code === row.location_code)
  )
  if (inventory) {
    inventory.available_qty = Number(inventory.available_qty || 0) + qty
    inventory.allocated_qty = Math.max(Number(inventory.allocated_qty || 0) - qty, 0)
    inventory.locked_flag = false
    inventory.locked_order_no = ''
  }
}

function createOutboundPickRecord(id: number, line: Row, allocation: Row, qty: number, mode: string) {
  outboundPickingRecords[id] ||= []
  outboundPickingRecords[id].unshift({
    id: Date.now() + Math.floor(Math.random() * 10000),
    task_no: `PICK-M-${Date.now().toString().slice(-8)}`,
    line_no: line.line_no,
    product_code: line.product_code,
    product_name: line.product_name || line.product_description,
    owner_code: allocation.owner_code || '3060',
    location_code: allocation.location_code,
    pallet_code: allocation.pallet_code,
    box_code: allocation.box_code,
    sn_code: allocation.sn_code,
    picked_qty: qty,
    pick_mode: mode,
    result: 'SUCCESS',
    picker: 'mobile',
    created_at: now()
  })
}

function activeAllocatedQuantity(id: number, line: Row) {
  const lineId = Number(line.id || line.line_id || line.outbound_detail_id)
  return (outboundAllocations[id] || [])
    .filter((row) => Number(row.outbound_detail_id) === lineId && row.allocation_status === 'ALLOCATED')
    .reduce((sum, row) => sum + Number(row.allocated_qty || 0), 0)
}

function refreshOutboundOrderTotals(id: number) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (!order) return
  const lines = outboundLines[id] || []
  const plannedQty = lines.reduce((sum, row) => sum + Number(row.order_qty || row.planned_qty || 0), 0)
  const allocatedQty = lines.reduce((sum, row) => sum + Number(row.allocated_qty || 0), 0)
  const pickedQty = lines.reduce((sum, row) => sum + Number(row.picked_qty || 0), 0)
  const shippedQty = lines.reduce((sum, row) => sum + Number(row.shipped_qty || 0), 0)
  order.planned_qty = plannedQty
  order.allocated_qty = allocatedQty
  order.picked_qty = pickedQty
  order.shipped_qty = shippedQty
  order.line_count = lines.length
  if (!['CLOSED', 'CANCELED', 'CALLBACK_SUCCESS'].includes(String(order.status || ''))) {
    if (shippedQty >= plannedQty && plannedQty > 0) order.status = 'SHIPPED'
    else if (shippedQty > 0) order.status = 'PARTIAL_SHIPPED'
    else if (pickedQty >= plannedQty && plannedQty > 0) order.status = 'PICKED'
    else if (pickedQty > 0) order.status = 'PARTIAL_PICKED'
    else if (allocatedQty >= plannedQty && plannedQty > 0) order.status = 'ALLOCATED'
    else if (allocatedQty > 0) order.status = 'PARTIAL_ALLOCATED'
    else order.status = 'PENDING_ALLOC'
  }
  lines.forEach((line) => {
    const planned = Number(line.order_qty || line.planned_qty || 0)
    if (Number(line.shipped_qty || 0) >= planned && planned > 0) line.line_status = 'SHIPPED'
    else if (Number(line.picked_qty || 0) >= planned && planned > 0) line.line_status = 'PICKED'
    else if (Number(line.picked_qty || 0) > 0) line.line_status = 'PARTIAL_PICKED'
    else if (Number(line.allocated_qty || 0) >= planned && planned > 0) line.line_status = 'ALLOCATED'
    else if (Number(line.allocated_qty || 0) > 0) line.line_status = 'PARTIAL_ALLOCATED'
    else line.line_status = 'CREATED'
  })
}

function setOutboundStatus(id: number, status: string) {
  const order = outboundOrders.find((row) => Number(row.id) === Number(id))
  if (order) order.status = status
}

function pushOutboundOperation(id: number, action: string, message: string) {
  outboundOperationLogs[id] ||= []
  outboundOperationLogs[id].unshift({ id: Date.now(), operator: 'mobile', action, result: 'SUCCESS', created_at: now(), message })
}

function pushOutboundInterface(id: number, interfaceName: string, status: string, errorMessage: string) {
  outboundInterfaceLogs[id] ||= []
  outboundInterfaceLogs[id].unshift({
    id: Date.now(),
    interface_name: interfaceName,
    source_system: 'WMS',
    target_system: interfaceName.includes('TRACE') ? 'TRACE' : 'SAP',
    status,
    created_at: now(),
    error_message: errorMessage
  })
}

function truthy(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'Y'
}

function pushOperation(id: number, action: string, message: string) {
  operationLogs[id] ||= []
  operationLogs[id].unshift({ id: Date.now(), operator: 'mobile', action, created_at: now(), message })
}

function pushInterface(id: number, interfaceName: string, status: string, errorMessage: string) {
  interfaceLogs[id] ||= []
  interfaceLogs[id].unshift({ id: Date.now(), interface_name: interfaceName, source_system: 'WMS', target_system: 'SAP', status, created_at: now(), error_message: errorMessage })
}

function includes(value: unknown, keyword: string) {
  return !keyword || String(value || '').toLowerCase().includes(keyword.toLowerCase())
}

function text(value: unknown) {
  return String(value || '').trim()
}

function parseSerials(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : String(value || '').split(/\r?\n|,|，|;|；|\s+/).map((item) => item.trim()).filter(Boolean)
}

function markFailed(item: Row, message: string) {
  item.status = 'FAILED'
  item.message = message
}

function now() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
