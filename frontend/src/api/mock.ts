import type { AxiosRequestConfig } from 'axios'
import type { PageResult } from './http'

type Row = Record<string, any>

const statusList = ['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING', 'COLLECTED', 'RECEIVED', 'ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'CLOSED', 'FAILED']
const COLLECTED_SN_STATUSES = ['COLLECTED', 'RECEIVED', 'INBOUND', 'ON_SHELF']
const RECEIVED_SN_STATUSES = ['RECEIVED', 'INBOUND', 'ON_SHELF']
const OWNER_NAMES: Record<string, string> = { '1000': '海兴电力', '3060': '杭州利沃得' }
const OWNER_PRODUCT_ROWS = [
  ['1000', 'GT3-10KD1R11004', '三相并网逆变器', 'Grid tied Inverter', 'GT3-10KD1', '数字能源', '并网逆变器', '成品', 'PCS', 1, 0, 20, 180, 'ACTIVE'],
  ['1000', 'HXEDE081R10002', '产品本体+300A CT 1套+2kA线圈-120mm 1套+通用工具箱包材+大纸箱+常规海陆运托盘', 'HXEDE0818 通道电能诊断终端', 'HXEDE081', '数字能源', '用能诊断终端', '成品', 'PCS', 0, 0, 20, 180, 'ACTIVE'],
  ['1000', 'LHECCHR11002', '导轨式充电管理终端', 'LHECCH', 'LHECCH', '数字能源', '充电控制终端', '成品', 'PCS', 0, 0, 20, 180, 'ACTIVE'],
  ['1000', 'BHF-B10250R11001', '锂离子电池模块', 'LIVOLTEK high voltage battery pack', 'BHF-B10250', '数字能源', '电池系统', '成品', 'PCS', 1, 1, 5, 180, 'ACTIVE'],
  ['3060', 'GT3-10KD1R11004', '三相并网逆变器', 'Grid tied Inverter', 'GT3-10KD1', '数字能源', '并网逆变器', '成品', 'PCS', 1, 0, 20, 180, 'ACTIVE'],
  ['3060', 'HXEDE081R10002', '产品本体+300A CT 1套+2kA线圈-120mm 1套+通用工具箱包材+大纸箱+常规海陆运托盘', 'HXEDE0818 通道电能诊断终端', 'HXEDE081', '数字能源', '用能诊断终端', '成品', 'PCS', 0, 0, 20, 180, 'ACTIVE'],
  ['3060', 'LHECCHR11002', '导轨式充电管理终端', 'LHECCH', 'LHECCH', '数字能源', '充电控制终端', '成品', 'PCS', 0, 0, 20, 180, 'ACTIVE'],
  ['3060', 'BHF-B10250R11001', '锂离子电池模块', 'LIVOLTEK high voltage battery pack', 'BHF-B10250', '数字能源', '电池系统', '成品', 'PCS', 1, 1, 5, 180, 'ACTIVE']
]

function seed() {
  const mockConfigs = defaultMockConfigs()
  const products = [
    ['GT3-30KD1R11001', '工商业储能电池包', '成品', 1, 1, 20, 180],
    ['GT3-50KD1R11002', '户用储能电池包', '成品', 1, 1, 15, 180],
    ['INV-10K-AC001', '储能逆变器 10K', '成品', 1, 0, 10, 150],
    ['INV-20K-AC002', '储能逆变器 20K', '成品', 1, 0, 8, 150],
    ['PCS-100K-001', 'PCS 变流器 100K', '成品', 1, 0, 5, 120],
    ['BMS-MAIN-001', 'BMS 主控板', '备件', 1, 0, 30, 240],
    ['CABLE-HV-001', '高压线束', '备件', 0, 0, 50, 240],
    ['FAN-DC-001', '直流散热风扇', '备件', 0, 0, 40, 240],
    ['FUSE-500A-001', '500A 熔断器', '备件', 0, 0, 60, 240],
    ['PACK-COVER-001', '电池包上盖', '备件', 0, 0, 20, 240],
    ['BLF51-5R31101', '电池模块备件', '备件', 1, 1, 10, 180],
    ['HP3-12KD2R11101', '逆变器成品', '成品', 1, 0, 10, 150],
    ['GT3-20KD1R11001', '储能电池包 20K', '成品', 1, 1, 10, 180],
    ['GT3-10KD1R11001', '储能电池包 10K', '成品', 1, 1, 10, 180],
    ['SP-BMS-001', 'BMS 控制板', '供应商 VMI 物料', 1, 0, 20, 240],
    ['SP-CABLE-001', '高压线束', '供应商 VMI 物料', 1, 0, 30, 240]
  ].map((p, index) => ({
    id: index + 1,
    product_code: p[0],
    product_name: p[1],
    category: p[2],
    spec_model: `MODEL-${index + 1}`,
    unit: 'PCS',
    sn_managed: p[3],
    battery_flag: p[4],
    safety_stock: p[5],
    aging_threshold_days: p[6],
    status: index === 9 ? 'DISABLED' : 'ACTIVE'
  }))

  const customers = ['Tesla Energy China', '比亚迪储能事业部', 'State Grid Demo', 'EU Solar Partner', 'AU Energy Storage'].map((name, index) => ({
    id: index + 1,
    customer_code: ['CUST-TESLA-001', 'CUST-BYD-002', 'CUST-SG-003', 'CUST-EU-004', 'CUST-AU-005'][index],
    customer_name: name,
    customer_type: index < 2 ? '直销客户' : '渠道客户',
    country_region: index < 3 ? '中国' : '海外',
    contact_name: `联系人${index + 1}`,
    contact_phone: `1380000000${index + 1}`,
    delivery_address: `演示收货地址 ${index + 1}`,
    vmi_flag: index < 2 ? 1 : 0,
    status: 'ACTIVE'
  }))

  const warehouses = [
    ['WH-HZ-CENTRAL', '杭州集团总仓', '集团总仓', '华东', 0],
    ['WH-SH-REGION', '上海区域销售仓', '区域销售仓', '华东', 0],
    ['WH-GZ-3PL', '广州第三方仓', '第三方仓', '华南', 0],
    ['WH-SZ-AFTERSALE', '深圳售后仓', '售后仓', '华南', 0],
    ['WH-CUST-TESLA-VMI', 'Tesla 客户 VMI 仓', '客户 VMI 仓', '华东', 1],
    ['WH-SUP-CATL-VMI', 'CATL 供应商 VMI 仓', '供应商 VMI 仓', '华东', 1]
  ].map((w, index) => ({
    id: index + 1,
    warehouse_code: w[0],
    warehouse_name: w[1],
    warehouse_type: w[2],
    region: w[3],
    country: '中国',
    city: ['杭州', '上海', '广州', '深圳', '上海', '宁德'][index],
    own_flag: index < 4 ? 1 : 0,
    vmi_flag: w[4],
    status: 'ACTIVE'
  }))

  const locations = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    warehouse_id: (i % 6) + 1,
    area_id: (i % 12) + 1,
    warehouse_code: warehouses[i % 6].warehouse_code,
    warehouse_name: warehouses[i % 6].warehouse_name,
    area_code: i % 5 === 0 ? 'AREA-QC-01' : 'AREA-GOOD-01',
    area_name: i % 5 === 0 ? '待检区' : '良品区',
    location_code: `${String.fromCharCode(65 + (i % 6))}${String(i + 1).padStart(2, '0')}-01-01`,
    location_name: `标准库位-${String(i + 1).padStart(2, '0')}`,
    rack_no: `R${(i % 5) + 1}`,
    level_no: `L${(i % 3) + 1}`,
    column_no: `C${i + 1}`,
    capacity: 100,
    frozen_flag: [7, 18].includes(i + 1) ? 1 : 0,
    status: 'ACTIVE'
  }))

  const inventory = Array.from({ length: 50 }, (_, i) => {
    const product = products[i % products.length]
    const available = i % 13 === 0 ? 1 : 3 + (i % 12)
    return {
      id: i + 1,
      warehouse_code: warehouses[i % 6].warehouse_code,
      warehouse_name: warehouses[i % 6].warehouse_name,
      area_code: i % 5 === 0 ? 'AREA-QC-01' : 'AREA-GOOD-01',
      location_code: locations[i % 30].location_code,
      product_code: product.product_code,
      product_name: product.product_name,
      batch_no: `BATCH-2026-${String((i % 12) + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      inventory_status: i % 17 === 0 ? 'UNQUALIFIED' : i % 11 === 0 ? 'FROZEN' : i % 7 === 0 ? 'PENDING' : 'QUALIFIED',
      total_qty: 5 + (i % 18),
      available_qty: available,
      allocated_qty: i % 4,
      frozen_qty: i % 11 === 0 ? 2 : 0,
      safety_stock: product.safety_stock,
      inbound_date: `2025-${String((i % 12) + 1).padStart(2, '0')}-10`,
      low_stock: available < Number(product.safety_stock) ? 1 : 0,
      aged: i % 4 === 0 ? 1 : 0,
      vmi_flag: i % 6 > 3 ? 1 : 0
    }
  })

  const serialNumbers: Row[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    sn_code: `SN-GT3-${String(i + 1).padStart(4, '0')}`,
    mes_work_order_no: i < 10 ? 'MES-MO-202606110001' : `MES-MO-20260612${String((i % 10) + 1).padStart(4, '0')}`,
    product_code: products[i % 6].product_code,
    product_name: products[i % 6].product_name,
    warehouse_code: i < 10 ? '' : warehouses[i % 6].warehouse_code,
    location_code: i < 20 ? '' : locations[i % 30].location_code,
    pallet_code: i < 20 ? '' : `PLT20260611${String(Math.ceil((i + 1) / 10)).padStart(4, '0')}`,
    box_code: i < 20 ? '' : `BOX20260611${String(Math.ceil((i + 1) / 5)).padStart(4, '0')}`,
    status: i < 10 ? 'ISSUED' : i < 20 ? 'INBOUND' : ['ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'TRACED'][i % 5],
    inbound_order_no: i < 10 ? '' : `IN20260611${String((i % 10) + 1).padStart(4, '0')}`,
    outbound_order_no: i % 3 === 0 ? `OUT20260611${String((i % 10) + 1).padStart(4, '0')}` : '',
    sold_flag: i % 5 === 0 ? 1 : 0
  }))

  const inboundOrders: Row[] = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    order_no: `IN20260611${String(i + 1).padStart(4, '0')}`,
    source_order_no: i === 0 ? 'MO202606110001' : `ASN20260611${String(i + 1).padStart(4, '0')}`,
    mes_work_order_no: i === 0 ? 'MES-MO-202606110001' : `MES-MO-20260611${String(i + 1).padStart(4, '0')}`,
    inbound_type: i === 0 ? 'PRODUCTION' : i % 3 === 0 ? 'RMA' : 'STOCKING',
    source_system: i === 0 ? 'SAP' : i % 3 === 0 ? 'CRM' : 'FULFILLMENT',
    warehouse_code: warehouses[i % 6].warehouse_code,
    warehouse_name: warehouses[i % 6].warehouse_name,
    product_code: products[i % products.length].product_code,
    product_name: products[i % products.length].product_name,
    planned_qty: i === 0 ? 10 : 10 + i,
    received_qty: i === 0 ? 0 : i < 3 ? 10 + i : i < 7 ? 5 + i : 0,
    shelved_qty: i < 3 && i !== 0 ? 10 + i : 0,
    sap_material_doc_no: i < 3 && i !== 0 ? `500000000${i + 1}` : '',
    sap_post_status: i < 3 && i !== 0 ? 'POSTED' : '',
    status: i === 0 ? 'CREATED' : i === 1 ? 'RECEIVING' : i === 2 ? 'BOUND' : i < 5 ? 'CLOSED' : i < 7 ? 'RECEIVING' : 'CREATED',
    created_at: `2026-06-${String(11 - i).padStart(2, '0')} 09:00:00`
  }))
  inboundOrders.unshift(
    {
      id: 100,
      order_no: 'IN202606110100',
      source_order_no: 'MO202606110100',
      mes_work_order_no: 'MES-MO-202606110100',
      inbound_type: 'PRODUCTION',
      source_system: 'SAP',
      warehouse_code: 'WH-HZ-CENTRAL',
      warehouse_name: '杭州集团总仓',
      planned_qty: 23,
      received_qty: 2,
      shelved_qty: 0,
      sap_material_doc_no: '',
      sap_post_status: 'FAILED',
      sap_post_result: 'SAP 回传失败：物料移动类型缺失',
      status: 'PARTIAL_RECEIVED',
      created_at: '2026-06-11 10:00:00'
    },
    {
      id: 101,
      order_no: 'IN202606110101',
      source_order_no: 'STOCK202606110101',
      mes_work_order_no: 'MES-STOCK202606110101',
      inbound_type: 'STOCKING',
      source_system: 'FULFILLMENT',
      warehouse_code: 'WH-SH-REGION',
      warehouse_name: '上海区域销售仓',
      planned_qty: 10,
      received_qty: 0,
      shelved_qty: 0,
      sap_material_doc_no: '',
      sap_post_status: 'NOT_POSTED',
      sap_post_result: '',
      status: 'CREATED',
      created_at: '2026-06-11 10:20:00'
    },
    {
      id: 102,
      order_no: 'IN202606110102',
      source_order_no: 'POVMI202606110102',
      mes_work_order_no: 'MES-POVMI202606110102',
      inbound_type: 'SUPPLIER_VMI',
      source_system: 'SAP',
      warehouse_code: 'WH-SUP-CATL-VMI',
      warehouse_name: 'CATL 供应商 VMI 仓',
      planned_qty: 50,
      received_qty: 0,
      shelved_qty: 0,
      sap_material_doc_no: '',
      sap_post_status: 'NOT_POSTED',
      sap_post_result: '',
      status: 'CREATED',
      created_at: '2026-06-11 10:40:00'
    }
  )

  const outboundOrders = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    order_no: `OUT20260611${String(i + 1).padStart(4, '0')}`,
    source_order_no: i === 0 ? 'SO202606110001' : `SO20260611${String(i + 1).padStart(4, '0')}`,
    outbound_type: i % 4 === 0 ? 'TRANSFER' : i % 5 === 0 ? 'AFTERSALE' : 'SALES',
    warehouse_code: warehouses[i % 6].warehouse_code,
    warehouse_name: warehouses[i % 6].warehouse_name,
    customer_code: customers[i % 5].customer_code,
    customer_name: customers[i % 5].customer_name,
    planned_qty: 5 + i,
    allocated_qty: i < 6 ? 5 + i : 0,
    picked_qty: i < 4 ? 5 + i : 0,
    shipped_qty: i < 2 ? 5 + i : 0,
    status: i < 2 ? 'SHIPPED' : i < 4 ? 'PICKED' : i < 6 ? 'ALLOCATED' : 'CREATED',
    created_at: `2026-06-${String(11 - i).padStart(2, '0')} 10:00:00`
  }))

  const productByCode = (code: string) => products.find((product) => product.product_code === code) || products[0]
  const inboundOrderLines = inboundOrders.flatMap((order, index) => {
    if (order.order_no === 'IN202606110100') {
      return [
        inboundLine(order, 10, productByCode('GT3-30KD1R11001'), 10, 2, 0),
        inboundLine(order, 20, productByCode('BLF51-5R31101'), 5, 0, 0),
        inboundLine(order, 30, productByCode('HP3-12KD2R11101'), 8, 0, 0)
      ]
    }
    if (order.order_no === 'IN202606110101') {
      return [
        inboundLine(order, 10, productByCode('GT3-20KD1R11001'), 6, 0, 0),
        inboundLine(order, 20, productByCode('GT3-10KD1R11001'), 4, 0, 0)
      ]
    }
    if (order.order_no === 'IN202606110102') {
      return [
        inboundLine(order, 10, productByCode('SP-BMS-001'), 20, 0, 0),
        inboundLine(order, 20, productByCode('SP-CABLE-001'), 30, 0, 0)
      ]
    }
    const lines = [inboundLine(order, 1, products[index % products.length], order.planned_qty, order.received_qty, order.shelved_qty)]
    if (order.order_no === 'IN202606110002') {
      lines.push(inboundLine(order, 2, products[2], 4, 2, 0))
    }
    return lines
  })
  const outboundOrderLines = outboundOrders.flatMap((order, index) => {
    const lines = [outboundLine(order, 1, products[index % products.length], order.planned_qty, order.allocated_qty, order.picked_qty, 0, order.shipped_qty)]
    if (order.order_no === 'OUT202606110002') {
      lines.push(outboundLine(order, 2, products[2], 3, 1, 0, 0, 0))
    }
    return lines
  })
  inboundOrderLines.forEach((line) => refreshInboundLineStatus(line))
  syncInboundHeaderQty(inboundOrders, inboundOrderLines)
  syncOutboundHeaderQty(outboundOrders, outboundOrderLines)

  const lineByOrderNo = (orderNo: string, lineNo: number) => inboundOrderLines.find((line) => line.order_no === orderNo && Number(line.line_no) === lineNo)
  const addInboundSn = (snCode: string, orderNo: string, lineNo: number, status: string, palletCode: string, boxCode: string) => {
    const line = lineByOrderNo(orderNo, lineNo)
    const order = inboundOrders.find((item) => item.order_no === orderNo)
    if (!line || !order) return
    serialNumbers.unshift({
      id: Date.now() + Math.random(),
      sn_code: snCode,
      mes_work_order_no: order.mes_work_order_no,
      product_code: line.product_code,
      product_name: line.product_name,
      product_id: line.product_id,
      warehouse_code: order.warehouse_code,
      warehouse_name: order.warehouse_name,
      location_code: '',
      pallet_code: palletCode,
      box_code: boxCode,
      status,
      quality_status: 'QUALIFIED',
      locked_flag: 0,
      inbound_order_no: orderNo,
      inbound_order_line_id: line.id,
      outbound_order_no: '',
      sold_flag: 0,
      created_at: '2026-06-11 10:30:00'
    })
  }
  addInboundSn('SN-IN100-GT30-R001', 'IN202606110100', 10, 'RECEIVED', 'PLT-IN100-001', 'BOX-IN100-001')
  addInboundSn('SN-IN100-GT30-R002', 'IN202606110100', 10, 'RECEIVED', 'PLT-IN100-001', 'BOX-IN100-001')
  addInboundSn('SN-IN100-BLF-C001', 'IN202606110100', 20, 'COLLECTED', 'PLT-IN100-002', 'BOX-IN100-002')
  addInboundSn('SN-IN100-BLF-C002', 'IN202606110100', 20, 'COLLECTED', 'PLT-IN100-002', 'BOX-IN100-002')
  addInboundSn('SN-IN102-BMS-C001', 'IN202606110102', 10, 'COLLECTED', 'PLT-IN102-001', 'BOX-IN102-001')

  const receiptOrder = inboundOrders.find((order) => order.order_no === 'IN202606110100')
  const receiptLine = lineByOrderNo('IN202606110100', 10)
  const inboundReceipts = receiptOrder ? [{
    id: 1,
    receipt_no: 'RCV20260611010001',
    inbound_order_id: receiptOrder.id,
    inbound_order_no: receiptOrder.order_no,
    receipt_time: '2026-06-11 10:35:00',
    receipt_user: 'wh_admin',
    status: 'RECEIVED',
    sap_post_status: 'FAILED',
    sap_material_doc_no: '',
    sap_post_result: 'SAP 回传失败：物料移动类型缺失',
    created_at: '2026-06-11 10:35:00'
  }] : []
  const inboundReceiptLines = receiptOrder && receiptLine ? [{
    id: 1,
    receipt_id: 1,
    inbound_order_line_id: receiptLine.id,
    line_no: receiptLine.line_no,
    product_id: receiptLine.product_id,
    product_code: receiptLine.product_code,
    receive_qty: 2,
    sap_post_qty: 0,
    sap_post_status: 'FAILED',
    sap_material_doc_no: '',
    sap_post_result: 'SAP 回传失败：物料移动类型缺失'
  }] : []
  const inboundReceiptSns = receiptLine ? serialNumbers
    .filter((sn) => sn.inbound_order_line_id === receiptLine.id && sn.status === 'RECEIVED')
    .map((sn, index) => ({
      id: index + 1,
      receipt_id: 1,
      receipt_line_id: 1,
      sn_code: sn.sn_code,
      product_id: sn.product_id,
      inbound_order_line_id: receiptLine.id,
      pallet_code: sn.pallet_code,
      box_code: sn.box_code
    })) : []

  const interfaceLogs = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    interface_name: ['SAP_POSTING', 'MES_SN_PUSH', 'FULFILLMENT_ORDER_PUSH', 'TRACE_OUTBOUND_SN', 'CRM_CUSTOMER_SYNC'][i % 5],
    source_system: ['WMS', 'MES', 'FULFILLMENT', 'WMS', 'CRM'][i % 5],
    target_system: ['SAP', 'WMS', 'WMS', 'TRACE', 'WMS'][i % 5],
    business_doc_no: i % 2 === 0 ? `OUT20260611${String((i % 10) + 1).padStart(4, '0')}` : `IN20260611${String((i % 10) + 1).padStart(4, '0')}`,
    request_url: ['/api/mock/sap/material-documents', '/api/mock/mes/sn-push', '/api/mock/fulfillment/outbound-orders', '/api/mock/trace/outbound-sn', '/api/mock/crm/customers'][i % 5],
    status: [4, 9, 14].includes(i + 1) ? 'FAILED' : i % 7 === 0 ? 'WARNING' : 'SUCCESS',
    retry_count: [4, 9, 14].includes(i + 1) ? 2 : 0,
    error_message: [4, 9, 14].includes(i + 1) ? 'Mock 服务暂不可用' : '',
    created_at: `2026-06-11 ${String(8 + (i % 10)).padStart(2, '0')}:00:00`
  }))
  interfaceLogs.unshift({
    id: 1001,
    interface_name: 'SAP_INBOUND_POSTING',
    source_system: 'WMS',
    target_system: 'SAP',
    business_doc_no: 'RCV20260611010001',
    request_url: '/api/mock/sap/material-documents',
    status: 'FAILED',
    retry_count: 1,
    error_message: 'SAP 回传失败：物料移动类型缺失',
    created_at: '2026-06-11 10:36:00'
  })

  const users = [
    ['admin', '系统管理员', 'ADMIN', '系统管理员'],
    ['wh_admin', '仓库管理员', 'WAREHOUSE_ADMIN', '仓库管理员'],
    ['planner', '计划人员', 'PLANNER', '计划人员'],
    ['logistics', '物流人员', 'LOGISTICS', '物流人员'],
    ['aftersale', '售后人员', 'AFTERSALE', '售后人员'],
    ['manager', '管理层', 'MANAGER', '管理层']
  ].map((u, i) => ({
    id: i + 1,
    username: u[0],
    display_name: u[1],
    role_code: u[2],
    role_name: u[3],
    warehouse_scope: i === 0 ? '*' : 'WH-HZ-CENTRAL',
    status: 'ACTIVE'
  }))

  return {
    products,
    customers,
    warehouses,
    locations,
    inventory,
    serialNumbers,
    packageBindings: serialNumbers
      .filter((row) => row.pallet_code && row.box_code)
      .slice(0, 20)
      .map((row, index) => ({
        id: index + 1,
        pallet_code: row.pallet_code,
        box_code: row.box_code,
        sn_code: row.sn_code,
        product_id: row.product_id,
        product_code: row.product_code,
        product_name: row.product_name,
        inbound_order_no: row.inbound_order_no,
        inbound_order_line_id: row.inbound_order_line_id,
        bind_order_no: row.inbound_order_no,
        bind_status: 'BOUND',
        bind_time: '2026-06-11 09:30:00'
      })),
    inboundOrders,
    inboundOrderLines,
    inboundReceipts,
    inboundReceiptLines,
    inboundReceiptSns,
    outboundOrders,
    outboundOrderLines,
    interfaceLogs,
    mockConfigs,
    operationLogs: [
      { id: 1, module: 'INBOUND', business_doc_no: 'IN202606110001', action: 'CREATE_PRODUCTION_ORDER', operator: 'system', result: 'SUCCESS', message: 'SAP Mock 创建生产入库单', created_at: '2026-06-11 08:00:00' },
      { id: 2, module: 'INBOUND', business_doc_no: 'IN202606110001', action: 'MES_SN_PUSH', operator: 'system', result: 'SUCCESS', message: 'MES 下发 10 个 SN', created_at: '2026-06-11 08:05:00' }
    ],
    users
  }
}

function getStore() {
  const stored = localStorage.getItem('wms_mock_store')
  if (stored) {
    const data = normalizeStore(JSON.parse(stored))
    localStorage.setItem('wms_mock_store', JSON.stringify(data))
    return data
  }
  const data = seed()
  localStorage.setItem('wms_mock_store', JSON.stringify(data))
  return data
}

function saveStore(store: any) {
  localStorage.setItem('wms_mock_store', JSON.stringify(store))
}

function defaultMockConfigs(): Row[] {
  return [
    ['SAP_INBOUND_POSTING', 'SAP', 'SAP 入库过账 Mock 失败'],
    ['SAP_OUTBOUND_POSTING', 'SAP', 'SAP 出库扣减 Mock 失败'],
    ['TRACE_OUTBOUND_SN', 'TRACE', '追溯系统 Mock 超时'],
    ['MES_SN_PUSH', 'WMS', 'MES SN 下发 Mock 失败'],
    ['FULFILLMENT_ORDER_PUSH', 'WMS', '履约单据下发 Mock 失败']
  ].map((item, index) => ({
    id: index + 1,
    interface_name: item[0],
    target_system: item[1],
    enabled: 1,
    force_fail: 0,
    delay_ms: 120,
    failure_message: item[2],
    updated_by: 'system',
    updated_at: '2026-06-11 08:00:00'
  }))
}

function ensureMockConfigs(store: any) {
  store.mockConfigs ||= []
  defaultMockConfigs().forEach((config) => {
    const existing = store.mockConfigs.find((item: Row) => item.interface_name === config.interface_name)
    if (!existing) store.mockConfigs.push({ ...config, id: nextId(store.mockConfigs) })
  })
}

function inboundLine(order: Row, lineNo: number, product: Row, plannedQty: number, receivedQty: number, shelvedQty: number) {
  return {
    id: Number(order.id) * 100 + lineNo,
    order_id: order.id,
    order_no: order.order_no,
    line_no: lineNo,
    product_id: product.id,
    product_code: product.product_code,
    product_name: product.product_name,
    unit: product.unit || 'PCS',
    sn_required: Number(product.sn_managed || 0),
    sap_plant: order.sap_plant || order.owner_code || '3060',
    sap_storage_location: '1001',
    owner_code: order.owner_code || product.owner_code || '',
    planned_qty: plannedQty,
    received_qty: receivedQty,
    shelved_qty: shelvedQty,
    batch_no: `BATCH-IN-${order.order_no}-${lineNo}`,
    quality_status: 'QUALIFIED',
    status: order.status
  }
}

function outboundLine(order: Row, lineNo: number, product: Row, plannedQty: number, allocatedQty: number, pickedQty: number, reviewQty: number, shippedQty: number) {
  return {
    id: Number(order.id) * 100 + lineNo,
    order_id: order.id,
    order_no: order.order_no,
    line_no: lineNo,
    product_id: product.id,
    product_code: product.product_code,
    product_name: product.product_name,
    product_description: product.product_name,
    unit: product.unit || 'PCS',
    sn_required: Number(product.sn_managed || 0),
    sap_plant: order.sap_plant || order.owner_code || '3060',
    planned_qty: plannedQty,
    order_qty: plannedQty,
    allocated_qty: allocatedQty,
    picked_qty: pickedQty,
    review_qty: reviewQty,
    shipped_qty: shippedQty,
    batch_no: `BATCH-OUT-${order.order_no}-${lineNo}`,
    status: order.status,
    line_status: order.status
  }
}

function syncInboundHeaderQty(orders: Row[], lines: Row[]) {
  orders.forEach((order) => {
    const related = lines.filter((line) => Number(line.order_id) === Number(order.id))
    if (!related.length) return
    order.planned_qty = sum(related, 'planned_qty')
    order.received_qty = sum(related, 'received_qty')
    order.shelved_qty = sum(related, 'shelved_qty')
  })
}

function syncOutboundHeaderQty(orders: Row[], lines: Row[]) {
  orders.forEach((order) => {
    const related = lines.filter((line) => Number(line.order_id) === Number(order.id))
    if (!related.length) return
    order.planned_qty = sum(related, 'planned_qty')
    order.allocated_qty = sum(related, 'allocated_qty')
    order.picked_qty = sum(related, 'picked_qty')
    order.review_qty = sum(related, 'review_qty')
    order.shipped_qty = sum(related, 'shipped_qty')
  })
}

const endpointMap: Record<string, keyof ReturnType<typeof seed>> = {
  '/products': 'products',
  '/customers': 'customers',
  '/warehouses': 'warehouses',
  '/locations': 'locations',
  '/inventory': 'inventory',
  '/serial-numbers': 'serialNumbers',
  '/inbound-orders': 'inboundOrders',
  '/inbound/sn-bindings': 'packageBindings',
  '/outbound-orders': 'outboundOrders',
  '/interface-logs': 'interfaceLogs',
  '/mock-configs': 'mockConfigs',
  '/system/users': 'users'
}

function mockDashboardSummary(store: any) {
  const totalStockQty = sum(store.inventory, 'total_qty')
  const availableStockQty = sum(store.inventory, 'available_qty')
  const allocatedStockQty = sum(store.inventory, 'allocated_qty')
  const frozenStockQty = sum(store.inventory, 'frozen_qty')
  return {
    level: 'GROUP',
    scopeName: '集团全局',
    totalStockQty,
    availableStockQty,
    allocatedStockQty,
    frozenStockQty,
    safetyWarningSkuCount: mockSafetyWarnings(store, 50).length,
    agingWarningSkuCount: mockAgingWarnings(store, 50).length,
    interfaceFailedCount: store.interfaceLogs.filter((row: Row) => row.status === 'FAILED').length,
    sapFailedCount: store.interfaceLogs.filter((row: Row) => row.status === 'FAILED' && row.target_system === 'SAP').length,
    todayInboundQty: sum(store.inboundOrders.filter((row: Row) => String(row.created_at || '').includes('2026-06')), 'received_qty'),
    todayOutboundQty: sum(store.outboundOrders.filter((row: Row) => String(row.created_at || '').includes('2026-06')), 'shipped_qty')
  }
}

function mockInventoryStructure(store: any) {
  return [
    { name: '可用库存', value: sum(store.inventory, 'available_qty'), color: '#22c55e' },
    { name: '已分配库存', value: sum(store.inventory, 'allocated_qty'), color: '#3b82f6' },
    { name: '冻结库存', value: sum(store.inventory, 'frozen_qty'), color: '#f97316' },
    { name: '待检库存', value: sum(store.inventory.filter((row: Row) => row.inventory_status === 'PENDING'), 'total_qty'), color: '#eab308' },
    { name: '不合格库存', value: sum(store.inventory.filter((row: Row) => row.inventory_status === 'UNQUALIFIED'), 'total_qty'), color: '#ef4444' }
  ]
}

function mockWarehouseMap(store: any) {
  return store.warehouses.map((warehouse: Row) => {
    const rows = store.inventory.filter((row: Row) => row.warehouse_code === warehouse.warehouse_code)
    return {
      warehouseId: warehouse.id,
      warehouseCode: warehouse.warehouse_code,
      warehouseName: warehouse.warehouse_name,
      warehouseType: warehouse.warehouse_type,
      region: warehouse.region,
      country: warehouse.country || '中国',
      city: warehouse.city || '-',
      stockQty: rows.reduce((acc: number, row: Row) => acc + Number(row.total_qty || 0), 0),
      warningCount: rows.filter((row: Row) => row.low_stock).length,
      longitude: 120,
      latitude: 30
    }
  })
}

function mockInoutTrend(store: any) {
  const xAxis = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
  const inboundQty = [120, 180, 160, 220, 260, sum(store.inboundOrders, 'received_qty')]
  const outboundQty = [100, 150, 170, 200, 230, sum(store.outboundOrders, 'shipped_qty')]
  const stockBalance = xAxis.map((_, index) => Math.max(0, 420 + index * 35 + inboundQty[index] - outboundQty[index]))
  return { xAxis, inboundQty, outboundQty, stockBalance }
}

function mockWarehouseOperations(store: any) {
  return store.warehouses.map((warehouse: Row) => {
    const inboundRows = store.inboundOrders.filter((row: Row) => row.warehouse_code === warehouse.warehouse_code)
    const outboundRows = store.outboundOrders.filter((row: Row) => row.warehouse_code === warehouse.warehouse_code)
    return {
      warehouseCode: warehouse.warehouse_code,
      warehouseName: warehouse.warehouse_name,
      inboundQty: sum(inboundRows, 'received_qty'),
      outboundQty: sum(outboundRows, 'shipped_qty'),
      countQty: 2 + (Number(warehouse.id || 0) % 4),
      exceptionQty: Number(warehouse.id || 0) % 3
    }
  })
}

function mockSafetyWarnings(store: any, limit = 10) {
  const grouped = new Map<string, Row>()
  store.inventory.forEach((row: Row) => {
    const key = `${row.warehouse_code}-${row.product_code}`
    const existing = grouped.get(key) || {
      warehouseName: row.warehouse_name,
      productCode: row.product_code,
      productName: row.product_name,
      availableQty: 0,
      safetyStockQty: Number(row.safety_stock || 0)
    }
    existing.availableQty += Number(row.available_qty || 0)
    grouped.set(key, existing)
  })
  return Array.from(grouped.values())
    .map((row: Row) => ({
      ...row,
      shortageQty: Math.max(Number(row.safetyStockQty || 0) - Number(row.availableQty || 0), 0),
      warningLevel: Math.max(Number(row.safetyStockQty || 0) - Number(row.availableQty || 0), 0) >= Number(row.safetyStockQty || 0) * 0.5 ? 'HIGH' : 'MEDIUM'
    }))
    .filter((row: Row) => row.shortageQty > 0)
    .sort((a: Row, b: Row) => Number(b.shortageQty) - Number(a.shortageQty))
    .slice(0, limit)
}

function mockAgingWarnings(store: any, limit = 10) {
  const nowDate = new Date('2026-06-17')
  return store.inventory
    .map((row: Row) => {
      const inboundDate = new Date(row.inbound_date)
      const agingDays = Math.max(0, Math.round((nowDate.getTime() - inboundDate.getTime()) / 86400000))
      return {
        warehouseName: row.warehouse_name,
        productCode: row.product_code,
        productName: row.product_name,
        batchNo: row.batch_no,
        inboundDate: row.inbound_date,
        agingDays,
        thresholdDays: row.aging_threshold_days || 180,
        batteryFlag: String(row.product_name || '').includes('电池') ? '是' : '否'
      }
    })
    .filter((row: Row) => Number(row.agingDays) > Number(row.thresholdDays))
    .sort((a: Row, b: Row) => Number(b.agingDays) - Number(a.agingDays))
    .slice(0, limit)
}

function mockInventoryQuery(store: any, params: Row = {}, limit = 5) {
  const grouped = new Map<string, Row>()
  store.inventory
    .filter((row: Row) => !params.productCode || String(row.product_code || '').includes(String(params.productCode)))
    .filter((row: Row) => !params.productName || String(row.product_name || '').includes(String(params.productName)))
    .filter((row: Row) => !params.warehouseCode || String(row.warehouse_code || '').includes(String(params.warehouseCode)))
    .forEach((row: Row) => {
      const key = `${row.warehouse_code}-${row.product_code}`
      const existing = grouped.get(key) || {
        warehouseCode: row.warehouse_code,
        warehouseName: row.warehouse_name,
        productCode: row.product_code,
        productName: row.product_name,
        totalQty: 0,
        availableQty: 0,
        allocatedQty: 0,
        frozenQty: 0,
        unit: 'PCS'
      }
      existing.totalQty += Number(row.total_qty || 0)
      existing.availableQty += Number(row.available_qty || 0)
      existing.allocatedQty += Number(row.allocated_qty || 0)
      existing.frozenQty += Number(row.frozen_qty || 0)
      grouped.set(key, existing)
    })
  return Array.from(grouped.values()).slice(0, limit)
}

function mockWorkbench(store: any) {
  const pendingInbound = store.inboundOrders
    .filter((row: Row) => Number(row.planned_qty || 0) > Number(row.received_qty || 0) && row.status !== 'CLOSED')
    .slice(0, 8)
    .map((row: Row) => ({
      id: row.id,
      inboundOrderNo: row.order_no,
      inboundType: row.inbound_type,
      warehouseName: row.warehouse_name,
      ownerName: row.owner_name || row.customer_name || row.supplier_name || '',
      lineCount: row.lines?.length || 1,
      pendingReceiveQty: Math.max(Number(row.planned_qty || 0) - Number(row.received_qty || 0), 0),
      status: row.status,
      createdAt: row.created_at
    }))
  const pendingOutbound = store.outboundOrders
    .filter((row: Row) => row.status !== 'SHIPPED')
    .slice(0, 8)
    .map((row: Row) => ({
      id: row.id,
      outboundOrderNo: row.order_no,
      outboundType: row.outbound_type,
      warehouseName: row.warehouse_name,
      customerName: row.customer_name,
      orderQty: row.planned_qty,
      status: row.status,
      createdAt: row.created_at
    }))
  const todoList = [
    { group: '入库待办', title: '待采集 SN', count: pendingInbound.length, path: '/inbound/arrival-notices' },
    { group: '入库待办', title: '待收货', count: pendingInbound.length, path: '/inbound/arrival-notices' },
    { group: '入库待办', title: 'SAP 回传失败', count: store.inboundOrders.filter((row: Row) => row.sap_post_status === 'FAILED').length, path: '/inbound/arrival-notices?sapPostStatus=FAILED' },
    { group: '出库待办', title: '待分配', count: store.outboundOrders.filter((row: Row) => row.status === 'CREATED').length, path: '/outbound/shipping-orders' },
    { group: '出库待办', title: '待拣货', count: store.outboundOrders.filter((row: Row) => row.status === 'ALLOCATED').length, path: '/outbound/shipping-orders' },
    { group: '出库待办', title: '待发货', count: store.outboundOrders.filter((row: Row) => row.status === 'PICKED').length, path: '/outbound/shipping-orders' },
    { group: '库存待办', title: '安全库存预警', count: mockSafetyWarnings(store, 50).length, path: '/inventory/list' },
    { group: '库存待办', title: '长库龄预警', count: mockAgingWarnings(store, 50).length, path: '/inventory/list' }
  ]
  return {
    summary: {
      pendingReceiveCount: pendingInbound.length,
      pendingShelveCount: store.inboundOrders.reduce((acc: number, row: Row) => acc + Math.max(Number(row.received_qty || 0) - Number(row.shelved_qty || 0), 0), 0),
      pendingPickCount: store.outboundOrders.filter((row: Row) => row.status === 'ALLOCATED').length,
      pendingShipCount: store.outboundOrders.filter((row: Row) => row.status === 'PICKED').length
    },
    inventoryRows: mockInventoryQuery(store, {}, 5),
    safetyWarnings: mockSafetyWarnings(store, 5),
    todoList,
    pendingInbound,
    pendingOutbound,
    businessEntries: [
      { title: '采集 SN', group: '入库作业', path: '/inbound/arrival-notices', icon: 'CirclePlus' },
      { title: '收货确认', group: '入库作业', path: '/inbound/arrival-notices', icon: 'Download' },
      { title: 'SAP 回传异常', group: '接口处理', path: '/inbound/arrival-notices?sapPostStatus=FAILED', icon: 'Warning' },
      { title: '库存查询', group: '库存管理', path: '/inventory/list', icon: 'Search' },
      { title: '产品主数据', group: '基础数据', path: '/masterdata/products', icon: 'Box' },
      { title: '客户主数据', group: '基础数据', path: '/masterdata/customers', icon: 'User' }
    ]
  }
}

export async function mockRequest<T>(config: AxiosRequestConfig): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  const url = (config.url || '').replace(/^\/api/, '')
  const method = (config.method || 'get').toLowerCase()
  const store = getStore()

  if (url === '/menus' && method === 'get') {
    return [
      { id: 'dashboard', title: '数据驾驶舱', icon: 'Monitor', children: [
        { id: 'globalDashboard', title: '全局库存看板', path: '/dashboard' }
      ] },
      { id: 'workbench', title: '工作台', icon: 'HomeFilled', children: [
        { id: 'myWorkbench', title: '我的工作台', path: '/dashboard/workbench' }
      ] },
      { id: 'masterdata', title: '基础数据', icon: 'Collection', children: [
        { id: 'products', title: '产品主数据', path: '/masterdata/products' },
        { id: 'customers', title: '客户主数据', path: '/masterdata/customers' }
      ] },
      { id: 'warehouse', title: '仓库设置', icon: 'OfficeBuilding', children: [
        { id: 'warehouses', title: '仓库管理', path: '/warehouse/warehouses' },
        { id: 'locations', title: '库位管理', path: '/warehouse/locations' }
      ] },
      { id: 'inbound', title: '入库管理', icon: 'Download', children: [
        { id: 'arrivalNotices', title: '预期到货通知单', path: '/inbound/arrival-notices' },
        { id: 'snBindings', title: 'SN 绑定', path: '/inbound/sn-bindings' }
      ] },
      { id: 'outbound', title: '出库管理', icon: 'Upload', children: [
        { id: 'shippingOrders', title: '发运订单', path: '/outbound/shipping-orders' }
      ] },
      { id: 'inventory', title: '库存管理', icon: 'Box', children: [
        { id: 'inventoryList', title: '库存查询', path: '/inventory/list' },
        { id: 'snList', title: 'SN 查询', path: '/inventory/sn' }
      ] },
      { id: 'reports', title: '报表中心', icon: 'DataAnalysis', children: [
        { id: 'inoutStockReport', title: '进出存报表', path: '/reports/inout-stock' },
        { id: 'inboundDailyReport', title: '入库日报表', path: '/reports/inbound-daily' },
        { id: 'outboundDailyReport', title: '出库日报表', path: '/reports/outbound-daily' },
        { id: 'standardAgingReport', title: '标准库龄报表', path: '/reports/standard-aging' },
        { id: 'segmentAgingReport', title: '分段库龄报表', path: '/reports/segment-aging' },
        { id: 'outboundSnReport', title: '出库 SN 报表', path: '/reports/outbound-sn' },
        { id: 'inboundSnReport', title: '入库 SN 报表', path: '/reports/inbound-sn' }
      ] },
      { id: 'interface', title: '接口中心', icon: 'Connection', children: [{ id: 'interfaceLogs', title: '接口日志', path: '/interface/logs' }] },
      { id: 'system', title: '系统设置', icon: 'Setting', children: [{ id: 'users', title: '系统用户', path: '/system/users' }] }
    ] as T
  }

  if (url === '/auth/login' && method === 'post') {
    const username = (config.data as any)?.username || 'admin'
    return {
      token: `mock-jwt-${username}-${Date.now()}`,
      user: { username, display_name: username, role_code: 'ADMIN', role_name: '系统管理员' }
    } as T
  }

  if (url === '/auth/me') {
    return { username: 'admin', display_name: '系统管理员', role_code: 'ADMIN', role_name: '系统管理员' } as T
  }

  if (url === '/menus') {
    return [
      { id: 'dashboard', title: '数据驾驶舱', icon: 'Monitor', children: [
        { id: 'globalDashboard', title: '全局库存看板', path: '/dashboard' }
      ] },
      { id: 'workbench', title: '工作台', icon: 'HomeFilled', children: [
        { id: 'myWorkbench', title: '我的工作台', path: '/dashboard/workbench' }
      ] },
      { id: 'masterdata', title: '基础数据', icon: 'Collection', children: [
        { id: 'products', title: '产品主数据', path: '/masterdata/products' },
        { id: 'customers', title: '客户主数据', path: '/masterdata/customers' }
      ] },
      { id: 'warehouse', title: '仓库设置', icon: 'OfficeBuilding', children: [
        { id: 'warehouses', title: '仓库管理', path: '/warehouse/warehouses' },
        { id: 'locations', title: '库位管理', path: '/warehouse/locations' }
      ] },
      { id: 'inbound', title: '入库管理', icon: 'Download', children: [
        { id: 'arrivalNotices', title: '预期到货通知单', path: '/inbound/arrival-notices' },
        { id: 'snBindings', title: 'SN 绑定', path: '/inbound/sn-bindings' }
      ] },
      { id: 'outbound', title: '出库管理', icon: 'Upload', children: [{ id: 'shippingOrders', title: '发运订单', path: '/outbound/shipping-orders' }] },
      { id: 'inventory', title: '库存管理', icon: 'Box', children: [
        { id: 'inventoryList', title: '库存查询', path: '/inventory/list' },
        { id: 'snList', title: 'SN 查询', path: '/inventory/sn' }
      ] },
      { id: 'reports', title: '报表中心', icon: 'DataAnalysis', children: [
        { id: 'inoutStockReport', title: '进出存报表', path: '/reports/inout-stock' },
        { id: 'inboundDailyReport', title: '入库日报表', path: '/reports/inbound-daily' },
        { id: 'outboundDailyReport', title: '出库日报表', path: '/reports/outbound-daily' },
        { id: 'standardAgingReport', title: '标准库龄报表', path: '/reports/standard-aging' },
        { id: 'segmentAgingReport', title: '分段库龄报表', path: '/reports/segment-aging' },
        { id: 'outboundSnReport', title: '出库 SN 报表', path: '/reports/outbound-sn' },
        { id: 'inboundSnReport', title: '入库 SN 报表', path: '/reports/inbound-sn' }
      ] },
      { id: 'interface', title: '接口中心', icon: 'Connection', children: [{ id: 'interfaceLogs', title: '接口日志', path: '/interface/logs' }] },
      { id: 'system', title: '系统设置', icon: 'Setting', children: [{ id: 'users', title: '系统用户', path: '/system/users' }] }
    ] as T
  }

  if (url === '/dashboard/summary') {
    return mockDashboardSummary(store) as T
  }

  if (url === '/dashboard/inventory-structure') {
    return mockInventoryStructure(store) as T
  }

  if (url === '/dashboard/warehouse-map') {
    return mockWarehouseMap(store) as T
  }

  if (url === '/dashboard/inout-trend') {
    return mockInoutTrend(store) as T
  }

  if (url === '/dashboard/warehouse-operation' || url === '/dashboard/warehouse-operations') {
    return mockWarehouseOperations(store) as T
  }

  if (url === '/dashboard/safety-warnings') {
    return mockSafetyWarnings(store, Number((config.params as Row)?.limit || 10)) as T
  }

  if (url === '/dashboard/aging-warnings') {
    return mockAgingWarnings(store, Number((config.params as Row)?.limit || 10)) as T
  }

  if (url === '/workbench') {
    return mockWorkbench(store) as T
  }

  if (url === '/workbench/summary') {
    return mockWorkbench(store).summary as T
  }

  if (url === '/workbench/inventory-query') {
    const params = (config.params || {}) as Row
    return mockInventoryQuery(store, params, Number(params.limit || 5)) as T
  }

  if (url === '/workbench/todo-list') {
    return mockWorkbench(store).todoList as T
  }

  if (url === '/workbench/pending-inbound') {
    return mockWorkbench(store).pendingInbound as T
  }

  if (url === '/workbench/pending-outbound') {
    return mockWorkbench(store).pendingOutbound as T
  }

  if (url.startsWith('/interface-logs/') && method === 'post') {
    const segments = url.split('/')
    const id = Number(segments[2])
    const action = segments[3]
    if (action === 'retry') return mockRetryInterfaceLog(store, id, (config.data || {}) as Row) as T
  }

  if (url.startsWith('/mock-configs/') && method === 'put') {
    const id = Number(url.split('/').pop())
    const body = (config.data || {}) as Row
    const row = (store.mockConfigs || []).find((item: Row) => Number(item.id) === id)
    if (!row) throw new Error('Mock 配置不存在')
    row.enabled = Number(body.enabled ?? row.enabled ?? 1)
    row.force_fail = Number(body.force_fail ?? body.forceFail ?? row.force_fail ?? 0)
    row.delay_ms = Number(body.delay_ms ?? body.delayMs ?? row.delay_ms ?? 120)
    row.failure_message = body.failure_message ?? body.failureMessage ?? row.failure_message
    row.updated_by = body.updatedBy || 'admin'
    row.updated_at = now()
    saveStore(store)
    return row as T
  }

  const reportResult = handleReportMock<T>(store, url, method, (config.params || {}) as Row, (config.data || {}) as Row)
  if (reportResult.handled) return reportResult.value

  const importExportResult = handleImportExportMock<T>(store, url, method, (config.params || {}) as Row, (config.data || {}) as Row)
  if (importExportResult.handled) return importExportResult.value

  if (url === '/products/options' && method === 'get') {
    const params = (config.params || {}) as Row
    const keyword = String(params.keyword || '').toLowerCase()
    return (store.products || [])
      .filter((row: Row) => !params.ownerCode || row.owner_code === params.ownerCode)
      .filter((row: Row) => !keyword || String(row.product_code || '').toLowerCase().includes(keyword) || String(row.product_name || '').toLowerCase().includes(keyword))
      .filter((row: Row) => (row.status || 'ACTIVE') === 'ACTIVE')
      .slice(0, 100)
      .map((row: Row) => ({
        ...row,
        productId: row.id,
        productCode: row.product_code,
        productName: row.product_name,
        productNameEn: row.product_name_en,
        ownerCode: row.owner_code,
        ownerName: row.owner_name,
        snRequired: Number(row.sn_managed || 0) === 1
      })) as T
  }

  if (url === '/customers/options' && method === 'get') {
    const params = (config.params || {}) as Row
    return (store.customers || [])
      .filter((row: Row) => !params.type || row.customer_type === params.type)
      .filter((row: Row) => (row.status || 'ACTIVE') === 'ACTIVE')
      .map((row: Row) => ({
        ...row,
        customerCode: row.customer_code,
        customerName: row.customer_name,
        customerType: row.customer_type
      })) as T
  }

  if (url === '/mock/mes/sn-push' && method === 'post') {
    const body = (config.data || {}) as Row
    const product = store.products.find((row: Row) => row.product_code === (body.productCode || 'GT3-30KD1R11001')) || store.products[0]
    const mesWorkOrderNo = String(body.mesWorkOrderNo || body.workOrderNo || 'MES-MO-202606110001')
    const qty = Number(body.qty || 10)
    const serialNumbers = Array.isArray(body.serialNumbers) && body.serialNumbers.length
      ? body.serialNumbers.map(String)
      : Array.from({ length: qty }, (_, i) => `SN-MES-${Date.now()}-${String(i + 1).padStart(4, '0')}`)
    serialNumbers.forEach((sn: string) => {
      const existing = store.serialNumbers.find((row: Row) => row.sn_code === sn)
      if (existing) {
        Object.assign(existing, { product_code: product.product_code, product_name: product.product_name, mes_work_order_no: mesWorkOrderNo, status: existing.status === 'INBOUND' ? 'INBOUND' : 'ISSUED' })
      } else {
        store.serialNumbers.unshift({
          id: Date.now() + Math.random(),
          sn_code: sn,
          product_code: product.product_code,
          product_name: product.product_name,
          mes_work_order_no: mesWorkOrderNo,
          warehouse_code: '',
          location_code: '',
          pallet_code: '',
          box_code: '',
          status: 'ISSUED',
          inbound_order_no: '',
          outbound_order_no: '',
          sold_flag: 0
        })
      }
    })
    addInterfaceLog(store, 'MES_SN_PUSH', 'MES', 'WMS', mesWorkOrderNo, '/api/mock/mes/sn-push', 'SUCCESS', '')
    saveStore(store)
    return { issuedCount: serialNumbers.length, serialNumbers, mesWorkOrderNo, productCode: product.product_code, status: 'ISSUED' } as T
  }

  if (url === '/mock/sap/production-orders' && method === 'post') {
    const body = (config.data || {}) as Row
    const product = store.products.find((row: Row) => row.product_code === (body.productCode || 'GT3-30KD1R11001')) || store.products[0]
    const warehouse = store.warehouses.find((row: Row) => row.warehouse_code === (body.warehouseCode || 'WH-HZ-CENTRAL')) || store.warehouses[0]
    const orderNo = body.inboundOrderNo || `IN-MOCK-${Date.now()}`
    const next = {
      id: Date.now(),
      order_no: orderNo,
      source_order_no: body.sapWorkOrderNo || `MO${Date.now()}`,
      mes_work_order_no: body.mesWorkOrderNo || `MES-${body.sapWorkOrderNo || orderNo}`,
      inbound_type: 'PRODUCTION',
      source_system: 'SAP',
      warehouse_code: warehouse.warehouse_code,
      warehouse_name: warehouse.warehouse_name,
      product_code: product.product_code,
      product_name: product.product_name,
      planned_qty: Number(body.qty || 10),
      received_qty: 0,
      shelved_qty: 0,
      status: 'CREATED',
      sap_material_doc_no: '',
      sap_post_status: '',
      created_at: now()
    }
    store.inboundOrders.unshift(next)
    store.inboundOrderLines.unshift(inboundLine(next, 1, product, Number(next.planned_qty || 0), 0, 0))
    addInterfaceLog(store, 'SAP_PRODUCTION_ORDER_PUSH', 'SAP', 'WMS', next.source_order_no, '/api/mock/sap/production-orders', 'SUCCESS', '')
    addOperationLog(store, next.order_no, 'CREATE_PRODUCTION_ORDER', 'system', 'SUCCESS', 'SAP Mock 创建生产入库单')
    saveStore(store)
    return { order: next, serialNumbers: [], bindings: [], operationLogs: [], interfaceLogs: [] } as T
  }

  if (url === '/inbound/production-orders' && method === 'get') {
    return pageProductionOrders(store, (config.params || {}) as Row) as T
  }

  if (url === '/inbound/production-orders' && method === 'post') {
    const body = (config.data || {}) as Row
    const product = store.products.find((row: Row) => row.product_code === body.productCode) || store.products[0]
    const warehouse = store.warehouses.find((row: Row) => row.warehouse_code === body.warehouseCode) || store.warehouses[0]
    const row = {
      id: Date.now(),
      order_no: body.orderNo || `IN-MOCK-${Date.now()}`,
      source_order_no: body.sapWorkOrderNo || `MO${Date.now()}`,
      mes_work_order_no: body.mesWorkOrderNo || `MES-${Date.now()}`,
      inbound_type: 'PRODUCTION',
      source_system: 'SAP',
      warehouse_code: warehouse.warehouse_code,
      warehouse_name: warehouse.warehouse_name,
      product_code: product.product_code,
      product_name: product.product_name,
      planned_qty: Number(body.plannedQty || 10),
      received_qty: 0,
      shelved_qty: 0,
      status: 'CREATED',
      created_at: now()
    }
    store.inboundOrders.unshift(row)
    store.inboundOrderLines.unshift(inboundLine(row, 1, product, Number(row.planned_qty || 0), 0, 0))
    addOperationLog(store, row.order_no, 'CREATE_PRODUCTION_ORDER', 'admin', 'SUCCESS', '新增生产入库单')
    saveStore(store)
    return productionDetail(store, row.id) as T
  }

  if (url.startsWith('/inbound/production-orders/')) {
    const segments = url.split('/')
    const id = Number(segments[3])
    const action = segments[4]
    if (method === 'get' && !action) return productionDetail(store, id) as T
    if (method === 'put' && !action) {
      const body = (config.data || {}) as Row
      const order = requireMockOrder(store, id)
      Object.assign(order, {
        source_order_no: body.sapWorkOrderNo || order.source_order_no,
        mes_work_order_no: body.mesWorkOrderNo || order.mes_work_order_no,
        planned_qty: Number(body.plannedQty || order.planned_qty)
      })
      addOperationLog(store, order.order_no, 'EDIT_PRODUCTION_ORDER', 'admin', 'SUCCESS', '编辑生产入库单')
      saveStore(store)
      return productionDetail(store, id) as T
    }
    if (method === 'post' && action === 'receive') return runMockAction(store, id, 'RECEIVE_SN', (config.data || {}) as Row, () => mockReceive(store, id, (config.data || {}) as Row)) as T
    if (method === 'post' && action === 'bind-package') return runMockAction(store, id, 'BIND_PACKAGE', (config.data || {}) as Row, () => mockBind(store, id, (config.data || {}) as Row)) as T
    if (method === 'post' && action === 'putaway') return runMockAction(store, id, 'PUTAWAY', (config.data || {}) as Row, () => mockPutaway(store, id, (config.data || {}) as Row)) as T
    if (method === 'post' && ['sap-post', 'post-sap'].includes(action)) return mockSapPost(store, id, (config.data || {}) as Row) as T
  }

  if (url === '/inbound-orders/retry-sap' && method === 'post') {
    return mockRetrySap(store, (((config.data || {}) as Row).orderIds || []) as number[]) as T
  }

  if ((url === '/inbound-orders' || url === '/inbound/arrival-notices') && method === 'post') {
    return mockCreateInboundOrder(store, (config.data || {}) as Row) as T
  }

  if (url.startsWith('/inbound-orders/') || url.startsWith('/inbound/arrival-notices/')) {
    const segments = url.split('/')
    const id = url.startsWith('/inbound-orders/') ? Number(segments[2]) : Number(segments[3])
    const action = url.startsWith('/inbound-orders/') ? segments[3] : segments[4]
    if (method === 'get' && action === 'sn-collect-context') return mockOrderSnCollectContext(store, id) as T
    if (action === 'lines') {
      const lineId = url.startsWith('/inbound-orders/') ? Number(segments[4]) : Number(segments[5])
      const lineAction = url.startsWith('/inbound-orders/') ? segments[5] : segments[6]
      if (method === 'get' && lineAction === 'sn-collect-context') return mockSnCollectContext(store, id, lineId) as T
      if (method === 'get' && lineAction === 'collected-sns') return mockCollectedSns(store, id, lineId) as T
      if (method === 'post' && lineAction === 'validate-sn-collection') return mockValidateSnCollection(store, id, lineId, (config.data || {}) as Row) as T
      if (method === 'post' && lineAction === 'confirm-sn-collection') return runMockAction(store, id, 'SN_COLLECT', (config.data || {}) as Row, () => mockConfirmSnCollection(store, id, lineId, (config.data || {}) as Row)) as T
      if (method === 'post' && lineAction === 'cancel-sn-collection') return runMockAction(store, id, 'CANCEL_SN_COLLECTION', (config.data || {}) as Row, () => mockCancelSnCollection(store, id, lineId, (config.data || {}) as Row)) as T
    }
    if (method === 'get' && !action) return productionDetail(store, id) as T
    if (method === 'post' && action === 'cancel') return mockCancelInboundOrder(store, id, (config.data || {}) as Row) as T
    if (method === 'post' && action === 'receipts' && segments[url.startsWith('/inbound-orders/') ? 5 : 6] === 'cancel') {
      const receiptId = url.startsWith('/inbound-orders/') ? Number(segments[4]) : Number(segments[5])
      return mockCancelInboundReceipt(store, id, receiptId, (config.data || {}) as Row) as T
    }
    if (method === 'post' && action === 'receive') return runMockAction(store, id, 'RECEIVE_SN', (config.data || {}) as Row, () => mockReceive(store, id, (config.data || {}) as Row)) as T
    if (method === 'post' && action === 'bind-package') return runMockAction(store, id, 'BIND_PACKAGE', (config.data || {}) as Row, () => mockBind(store, id, (config.data || {}) as Row)) as T
    if (method === 'post' && ['sap-post', 'post-sap'].includes(action)) return mockSapPost(store, id, (config.data || {}) as Row) as T
  }

  if ((url === '/inbound-orders' || url === '/inbound/arrival-notices') && method === 'get') {
    return pageInboundOrders(store, (config.params || {}) as Row) as T
  }

  if (url === '/inbound/sn-bindings' && method === 'get') {
    return pageSnBindings(store, (config.params || {}) as Row) as T
  }

  if (url.startsWith('/inbound/sn-bindings/') && method === 'delete') {
    const id = Number(url.split('/').pop())
    deleteMockBinding(store, id)
    return 'deleted' as T
  }

  if (url === '/inbound/sn-bindings/bulk-delete' && method === 'post') {
    const ids = (((config.data || {}) as Row).ids || []) as number[]
    ids.forEach((id) => deleteMockBinding(store, Number(id)))
    saveStore(store)
    return 'deleted' as T
  }

  const outboundResult = handleOutboundMock<T>(store, url, method, (config.params || {}) as Row, (config.data || {}) as Row)
  if (outboundResult.handled) return outboundResult.value

  const basePath = Object.keys(endpointMap).find((key) => url === key || url.startsWith(`${key}/`))
  if (!basePath) {
    return {} as T
  }
  const collectionName = endpointMap[basePath]
  const collection: Row[] = store[collectionName] || []

  if (method === 'get') {
    const params = (config.params || {}) as Row
    const filtered = collection.filter((row) => Object.keys(params).every((key) => {
      if (['pageNum', 'pageSize'].includes(key) || params[key] === '' || params[key] == null) return true
      const value = String(row[key] ?? row[toSnake(key)] ?? '')
      return value.includes(String(params[key]))
    }))
    const pageNum = Number(params.pageNum || 1)
    const pageSize = Number(params.pageSize || 10)
    const start = (pageNum - 1) * pageSize
    return {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      pageNum,
      pageSize
    } satisfies PageResult as T
  }

  if (method === 'post') {
    const next = { ...(config.data as Row), id: Date.now(), status: (config.data as Row)?.status || 'ACTIVE' }
    collection.unshift(next)
    store[collectionName] = collection
    saveStore(store)
    return 'created' as T
  }

  if (method === 'put') {
    const id = Number(url.split('/').pop())
    const index = collection.findIndex((row) => row.id === id)
    if (index >= 0) {
      collection[index] = { ...collection[index], ...(config.data as Row) }
      saveStore(store)
    }
    return 'updated' as T
  }

  if (method === 'delete') {
    const id = Number(url.split('/').pop())
    store[collectionName] = collection.filter((row) => row.id !== id)
    saveStore(store)
    return 'deleted' as T
  }

  return {} as T
}

function sum(rows: Row[], field: string) {
  return rows.reduce((acc, row) => acc + Number(row[field] || 0), 0)
}

function nextId(rows: Row[] = []) {
  return rows.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0) + 1
}

function toSnake(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function normalizeStore(store: any) {
  const fresh = seed()
  const needsProductionInboundSeed = store.__wmsAlphaMockVersion !== 'sn-collection-v3'
  const needsInboundReceiptSeed = store.__wmsInboundReceiptVersion !== 'inbound-receipt-v2'
  store.products ||= fresh.products
  store.customers ||= fresh.customers
  store.warehouses ||= fresh.warehouses
  store.locations ||= fresh.locations
  store.inventory ||= fresh.inventory
  store.serialNumbers ||= fresh.serialNumbers
  store.inboundOrders ||= fresh.inboundOrders
  store.outboundOrders ||= fresh.outboundOrders
  store.inboundOrderLines ||= fresh.inboundOrderLines
  store.inboundReceipts ||= []
  store.inboundReceiptLines ||= []
  store.inboundReceiptSns ||= []
  store.outboundOrderLines ||= fresh.outboundOrderLines
  store.interfaceLogs ||= fresh.interfaceLogs
  store.mockConfigs ||= fresh.mockConfigs
  ensureMockConfigs(store)
  store.users ||= fresh.users
  store.packageBindings ||= fresh.packageBindings
  store.operationLogs ||= fresh.operationLogs
  store.inventoryAllocations ||= []
  store.pickingTasks ||= []
  store.pickingRecords ||= []
  store.reviewRecords ||= []
  store.shipmentRecords ||= []
  store.inventoryTransactions ||= []
  store.outboundExceptions ||= []
  restoreFullMockSeedIfReduced(store, fresh)
  ensureOwnerCustomerProductData(store)

  store.inboundOrders.forEach((order: Row, index: number) => {
    const freshOrder = fresh.inboundOrders[index % fresh.inboundOrders.length]
    if (order.inbound_type === 'STOCK_IN') order.inbound_type = 'STOCKING'
    order.mes_work_order_no ||= order.order_no === 'IN202606110001' ? 'MES-MO-202606110001' : freshOrder.mes_work_order_no
    order.source_system ||= freshOrder.source_system || 'SAP'
    order.product_code ||= freshOrder.product_code || 'GT3-30KD1R11001'
    order.product_name ||= freshOrder.product_name || '工商业储能电池包'
    order.shelved_qty ??= 0
    order.sap_material_doc_no ||= ''
    order.sap_post_status ||= ''
  })
  ensureInboundShipFromCountries(store)
  ensureInboundMockLines(store)

  const demoOrder = store.inboundOrders.find((row: Row) => row.order_no === 'IN202606110001')
  if (demoOrder && needsProductionInboundSeed) {
    Object.assign(demoOrder, {
      inbound_type: 'PRODUCTION',
      source_order_no: 'MO202606110001',
      mes_work_order_no: 'MES-MO-202606110001',
      product_code: 'GT3-30KD1R11001',
      product_name: '工商业储能电池包',
      planned_qty: 10,
      received_qty: 0,
      shelved_qty: 0,
      pallet_code: '',
      box_code: '',
      sap_material_doc_no: '',
      sap_post_status: '',
      status: 'CREATED'
    })
    const demoLine = store.inboundOrderLines.find((line: Row) => Number(line.order_id) === Number(demoOrder.id) && Number(line.line_no) === 1)
    if (demoLine) {
      Object.assign(demoLine, {
        product_code: 'GT3-30KD1R11001',
        product_name: '工商业储能电池包',
        planned_qty: 10,
        received_qty: 0,
        shelved_qty: 0,
        status: 'CREATED'
      })
    }
  }

  const demoSerials = Array.from({ length: 10 }, (_, i) => `SN-GT3-${String(i + 1).padStart(4, '0')}`)
  demoSerials.forEach((sn) => {
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
    if (row) {
      row.product_code = 'GT3-30KD1R11001'
      row.product_name = '工商业储能电池包'
      row.mes_work_order_no = 'MES-MO-202606110001'
      if (needsProductionInboundSeed) {
        row.warehouse_code = ''
        row.location_code = ''
        row.pallet_code = ''
        row.box_code = ''
        row.inbound_order_no = ''
        row.inbound_order_line_id = null
        row.status = 'ISSUED'
      }
    }
  })
  if (needsProductionInboundSeed) {
    store.serialNumbers.forEach((row: Row) => {
      if (!demoSerials.includes(row.sn_code) && row.mes_work_order_no === 'MES-MO-202606110001') {
        row.mes_work_order_no = `MES-MO-20260612${String(row.id || 1).padStart(4, '0')}`
      }
    })
  }
  if (needsProductionInboundSeed) {
    store.packageBindings = store.packageBindings.filter((row: Row) => row.inbound_order_no !== 'IN202606110001')
    store.operationLogs = store.operationLogs.filter((row: Row) => row.business_doc_no !== 'IN202606110001')
    store.operationLogs.unshift(
      { id: Date.now() + 1, module: 'INBOUND', business_doc_no: 'IN202606110001', action: 'CREATE_PRODUCTION_ORDER', operator: 'system', result: 'SUCCESS', message: 'SAP Mock 创建生产入库单', created_at: now() },
      { id: Date.now() + 2, module: 'INBOUND', business_doc_no: 'IN202606110001', action: 'MES_SN_PUSH', operator: 'system', result: 'SUCCESS', message: 'MES 下发 10 个 SN', created_at: now() }
    )
    store.__wmsAlphaMockVersion = 'sn-collection-v3'
  }
  if (needsInboundReceiptSeed) {
    ensureInboundReceiptMockStore(store)
    store.__wmsInboundReceiptVersion = 'inbound-receipt-v2'
  }
  ensureOutboundMockStore(store)
  ensureShippingOrderV3Demo(store)
  ensureOutboundMockLines(store)
  ensureMockOwnerOnStock(store)
  ensureMixedInboundDemo(store)
  ensureInboundShipFromCountries(store)
  return store
}

function ensureMockOwnerOnStock(store: any) {
  ;(store.inventory || []).forEach((row: Row) => {
    const product = (store.products || []).find((item: Row) => item.product_code === row.product_code || Number(item.id) === Number(row.product_id))
    row.owner_code ||= product?.owner_code || '3060'
    row.owner_name ||= product?.owner_name || '杭州利沃得'
  })
  ;(store.serialNumbers || []).forEach((row: Row) => {
    const product = (store.products || []).find((item: Row) => item.product_code === row.product_code || Number(item.id) === Number(row.product_id))
    row.owner_code ||= product?.owner_code || '3060'
    row.owner_name ||= product?.owner_name || '杭州利沃得'
  })
}

function restoreFullMockSeedIfReduced(store: any, fresh: any) {
  mergeRowsByKey(store, fresh, 'products', (row) => `${row.owner_code || ''}::${row.product_code}`)
  mergeRowsByKey(store, fresh, 'customers', (row) => row.customer_code)
  mergeRowsByKey(store, fresh, 'warehouses', (row) => row.warehouse_code)
  mergeRowsByKey(store, fresh, 'locations', (row) => `${row.warehouse_code || row.warehouse_id}::${row.location_code}`)
  mergeRowsByKey(store, fresh, 'inventory', (row) => `${row.warehouse_code || row.warehouse_id}::${row.location_code || row.location_id}::${row.product_code || row.product_id}::${row.batch_no || row.id}`)
  mergeRowsByKey(store, fresh, 'serialNumbers', (row) => row.sn_code)
  mergeRowsByKey(store, fresh, 'inboundOrders', (row) => row.order_no)
  mergeRowsByKey(store, fresh, 'inboundOrderLines', (row) => `${row.order_no || row.order_id}::${row.line_no}`)
  mergeRowsByKey(store, fresh, 'inboundReceipts', (row) => row.receipt_no)
  mergeRowsByKey(store, fresh, 'inboundReceiptLines', (row) => `${row.receipt_id}::${row.line_no}::${row.product_code || row.product_id}`)
  mergeRowsByKey(store, fresh, 'inboundReceiptSns', (row) => `${row.receipt_id}::${row.sn_code}`)
  mergeRowsByKey(store, fresh, 'packageBindings', (row) => row.sn_code)
  mergeRowsByKey(store, fresh, 'outboundOrders', (row) => row.order_no)
  mergeRowsByKey(store, fresh, 'outboundOrderLines', (row) => `${row.order_no || row.order_id}::${row.line_no}`)
  mergeRowsByKey(store, fresh, 'interfaceLogs', (row) => `${row.interface_name}::${row.business_doc_no}::${row.created_at || row.id}`)
  mergeRowsByKey(store, fresh, 'operationLogs', (row) => `${row.module}::${row.business_doc_no}::${row.action}::${row.created_at || row.id}`)
  mergeRowsByKey(store, fresh, 'inventoryAllocations', (row) => row.allocation_no || `${row.outbound_order_no}::${row.sn_code}`)
  mergeRowsByKey(store, fresh, 'pickingTasks', (row) => row.task_no)
  mergeRowsByKey(store, fresh, 'pickingRecords', (row) => `${row.task_no}::${row.sn_code}`)
  mergeRowsByKey(store, fresh, 'reviewRecords', (row) => `${row.outbound_order_no}::${row.sn_code}`)
  mergeRowsByKey(store, fresh, 'shipmentRecords', (row) => row.shipment_no || `${row.outbound_order_no}::${row.tracking_no}`)
  mergeRowsByKey(store, fresh, 'inventoryTransactions', (row) => row.transaction_no)
}

function mergeRowsByKey(store: any, fresh: any, collection: string, keyOf: (row: Row) => unknown) {
  const source = Array.isArray(fresh[collection]) ? fresh[collection] : []
  store[collection] = Array.isArray(store[collection]) ? store[collection] : []
  if (store[collection].length >= source.length) {
    return
  }
  const keyMap = new Map<string, Row>()
  store[collection].forEach((row: Row) => {
    const key = String(keyOf(row) || '')
    if (key) keyMap.set(key, row)
  })
  source.forEach((row: Row) => {
    const key = String(keyOf(row) || '')
    if (!key) return
    const existing = keyMap.get(key)
    if (existing) {
      Object.assign(existing, { ...row, ...existing })
      return
    }
    const next = { ...row }
    if (next.id == null) next.id = nextId(store[collection])
    store[collection].push(next)
    keyMap.set(key, next)
  })
}

function ensureInboundShipFromCountries(store: any) {
  const demoCountries = ['中国', '美国', '德国', '越南', '泰国']
  ;(store.inboundOrders || []).forEach((order: Row, index: number) => {
    order.ship_from_country ||= order.shipFromCountry || demoCountries[index % demoCountries.length]
    order.shipFromCountry ||= order.ship_from_country
  })
}

function ensureOwnerCustomerProductData(store: any) {
  store.customers ||= []
  const upsertCustomer = (code: string, name: string, type: string) => {
    const existing = store.customers.find((row: Row) => row.customer_code === code)
    const row = {
      id: existing?.id || nextId(store.customers),
      customer_code: code,
      customer_name: name,
      customer_type: type,
      country_region: '中国',
      contact_name: '',
      contact_phone: '',
      delivery_address: '',
      vmi_flag: 0,
      status: 'ACTIVE'
    }
    if (existing) Object.assign(existing, row)
    else store.customers.push(row)
  }
  store.customers.forEach((row: Row) => {
    if (!['OWNER', 'SUPPLIER'].includes(row.customer_type)) row.customer_type = 'CUSTOMER'
  })
  upsertCustomer('1000', '海兴电力', 'OWNER')
  upsertCustomer('3060', '杭州利沃得', 'OWNER')
  upsertCustomer('SUP-CATL-001', 'CATL 供应商', 'SUPPLIER')
  upsertCustomer('SUP-BYD-001', 'BYD 供应商', 'SUPPLIER')
  upsertCustomer('SUP-VMI-001', 'VMI 供应商A', 'SUPPLIER')

  store.products ||= []
  OWNER_PRODUCT_ROWS.forEach((item) => {
    const [ownerCode, productCode, productName, productNameEn, specModel, family, productClass, category, unit, snManaged, batteryFlag, safetyStock, agingDays, status] = item
    const existing = store.products.find((row: Row) => row.owner_code === ownerCode && row.product_code === productCode)
    const row = {
      id: existing?.id || nextId(store.products),
      owner_code: ownerCode,
      owner_name: OWNER_NAMES[String(ownerCode)] || String(ownerCode),
      product_code: productCode,
      product_name: productName,
      product_name_en: productNameEn,
      spec_model: specModel,
      product_family: family,
      product_class: productClass,
      category,
      unit,
      sn_managed: snManaged,
      battery_flag: batteryFlag,
      shelf_life_days: 365,
      safety_stock: safetyStock,
      aging_threshold_days: agingDays,
      status
    }
    if (existing) Object.assign(existing, row)
    else store.products.push(row)
  })
}

function ensureMixedInboundDemo(store: any) {
  const orderNo = 'IN-DEMO-SN-MIX-001'
  const warehouse = store.warehouses.find((row: Row) => row.warehouse_code === 'WH-HZ-CENTRAL') || store.warehouses[0]
  const existing = store.inboundOrders.find((row: Row) => row.order_no === orderNo)
  const order = existing || {
    id: nextId(store.inboundOrders),
    order_no: orderNo,
    source_order_no: 'MO-DEMO-SN-MIX-001',
    mes_work_order_no: 'MES-DEMO-SN-MIX-001',
    inbound_type: 'PRODUCTION',
    source_system: 'SAP',
    warehouse_code: warehouse.warehouse_code,
    warehouse_name: warehouse.warehouse_name,
    owner_code: '3060',
    owner_name: '杭州利沃得',
    ship_from_country: '中国',
    shipFromCountry: '中国',
    sap_plant: '3060',
    planned_qty: 12,
    received_qty: 0,
    shelved_qty: 0,
    status: 'CREATED',
    sap_material_doc_no: '',
    sap_post_status: 'NOT_POSTED',
    sap_post_result: '',
    remark: 'SN/非SN混合收货演示单',
    created_at: now(),
    updated_at: now()
  }
  Object.assign(order, {
    warehouse_code: warehouse.warehouse_code,
    warehouse_name: warehouse.warehouse_name,
    owner_code: '3060',
    owner_name: '杭州利沃得',
    ship_from_country: order.ship_from_country || '中国',
    shipFromCountry: order.shipFromCountry || order.ship_from_country || '中国',
    sap_plant: '3060'
  })
  if (!existing) store.inboundOrders.unshift(order)
  store.inboundOrderLines = (store.inboundOrderLines || []).filter((line: Row) => line.order_no !== orderNo)
  const productByCode = (code: string) =>
    store.products.find((row: Row) => row.owner_code === '3060' && row.product_code === code) ||
    store.products.find((row: Row) => row.product_code === code) ||
    store.products[0]
  const line10 = inboundLine(order, 10, productByCode('GT3-10KD1R11004'), 3, 0, 0)
  const line20 = inboundLine(order, 20, productByCode('HXEDE081R10002'), 5, 0, 0)
  const line30 = inboundLine(order, 30, productByCode('LHECCHR11002'), 4, 0, 0)
  line10.sap_storage_location = '1001'
  line20.sap_storage_location = '1001'
  line30.sap_storage_location = '1001'
  store.inboundOrderLines.push(line10, line20, line30)
  store.serialNumbers = (store.serialNumbers || []).filter((sn: Row) => !String(sn.sn_code || '').startsWith('SN-MIX-GT3-'))
  ;['0001', '0002', '0003'].forEach((no) => {
    store.serialNumbers.unshift({
      id: Date.now() + Math.random(),
      sn_code: `SN-MIX-GT3-${no}`,
      mes_work_order_no: order.mes_work_order_no,
      product_id: line10.product_id,
      product_code: line10.product_code,
      product_name: line10.product_name,
      warehouse_code: '',
      warehouse_name: '',
      location_code: '',
      pallet_code: '',
      box_code: '',
      status: 'ISSUED',
      quality_status: 'QUALIFIED',
      locked_flag: 0,
      inbound_order_no: '',
      inbound_order_line_id: null,
      outbound_order_no: '',
      sold_flag: 0,
      created_at: now()
    })
  })
  refreshInboundHeaderStatus(store, Number(order.id))
}

function ensureInboundMockLines(store: any) {
  store.inboundOrderLines ||= []
  store.inboundOrders.forEach((order: Row, index: number) => {
    const hasLine = store.inboundOrderLines.some((line: Row) => Number(line.order_id) === Number(order.id))
    if (!hasLine) {
      const product = store.products.find((row: Row) => row.product_code === order.product_code) || store.products[index % store.products.length] || {}
      store.inboundOrderLines.push(inboundLine(order, 1, product, Number(order.planned_qty || 0), Number(order.received_qty || 0), Number(order.shelved_qty || 0)))
    }
  })
  const multiOrder = store.inboundOrders.find((row: Row) => row.order_no === 'IN202606110002')
  if (multiOrder && !store.inboundOrderLines.some((line: Row) => Number(line.order_id) === Number(multiOrder.id) && Number(line.line_no) === 2)) {
    const product = store.products.find((row: Row) => row.product_code === 'INV-10K-AC001') || store.products[2]
    store.inboundOrderLines.push(inboundLine(multiOrder, 2, product, 4, 2, 0))
  }
  store.inboundOrderLines.forEach((line: Row) => {
    line.product_id ||= productIdByCode(store, line.product_code)
    refreshInboundLineStatus(line)
  })
  syncInboundHeaderQty(store.inboundOrders, store.inboundOrderLines)
}

function ensureInboundReceiptMockStore(store: any) {
  const demoOrderNos = ['IN202606110100', 'IN202606110101', 'IN202606110102']
  const demoProductDefs = [
    ['BLF51-5R31101', '电池模块备件', '备件', 1, 1, 10, 180],
    ['HP3-12KD2R11101', '逆变器成品', '成品', 1, 0, 10, 150],
    ['GT3-20KD1R11001', '储能电池包 20K', '成品', 1, 1, 10, 180],
    ['GT3-10KD1R11001', '储能电池包 10K', '成品', 1, 1, 10, 180],
    ['SP-BMS-001', 'BMS 控制板', '供应商 VMI 物料', 1, 0, 20, 240],
    ['SP-CABLE-001', '高压线束', '供应商 VMI 物料', 1, 0, 30, 240]
  ]
  demoProductDefs.forEach((item) => {
    if (store.products.some((product: Row) => product.product_code === item[0])) return
    store.products.push({
      id: nextId(store.products),
      product_code: item[0],
      product_name: item[1],
      category: item[2],
      spec_model: `MODEL-${item[0]}`,
      unit: 'PCS',
      sn_managed: item[3],
      battery_flag: item[4],
      safety_stock: item[5],
      aging_threshold_days: item[6],
      status: 'ACTIVE'
    })
  })

  store.inboundOrders = (store.inboundOrders || []).filter((order: Row) => !demoOrderNos.includes(order.order_no))
  store.inboundOrderLines = (store.inboundOrderLines || []).filter((line: Row) => !demoOrderNos.includes(line.order_no))
  store.serialNumbers = (store.serialNumbers || []).filter((sn: Row) => !String(sn.sn_code || '').startsWith('SN-IN10'))
  store.packageBindings = (store.packageBindings || []).filter((binding: Row) => !String(binding.sn_code || '').startsWith('SN-IN10'))
  const demoReceiptIds = (store.inboundReceipts || []).filter((receipt: Row) => demoOrderNos.includes(receipt.inbound_order_no)).map((receipt: Row) => Number(receipt.id))
  const demoReceiptLineIds = (store.inboundReceiptLines || []).filter((line: Row) => demoReceiptIds.includes(Number(line.receipt_id))).map((line: Row) => Number(line.id))
  store.inboundReceipts = (store.inboundReceipts || []).filter((receipt: Row) => !demoOrderNos.includes(receipt.inbound_order_no))
  store.inboundReceiptLines = (store.inboundReceiptLines || []).filter((line: Row) => !demoReceiptIds.includes(Number(line.receipt_id)))
  store.inboundReceiptSns = (store.inboundReceiptSns || []).filter((sn: Row) => !demoReceiptIds.includes(Number(sn.receipt_id)) && !demoReceiptLineIds.includes(Number(sn.receipt_line_id)))

  const warehouseByCode = (code: string) => store.warehouses.find((warehouse: Row) => warehouse.warehouse_code === code) || {}
  const productByCode = (code: string) => store.products.find((product: Row) => product.product_code === code) || {}
  const orderDefs = [
    { id: nextId(store.inboundOrders), order_no: 'IN202606110100', source_order_no: 'MO202606110100', mes_work_order_no: 'MES-MO-202606110100', inbound_type: 'PRODUCTION', source_system: 'SAP', warehouse_code: 'WH-HZ-CENTRAL', planned_qty: 23, received_qty: 2, status: 'PARTIAL_RECEIVED', sap_post_status: 'FAILED', sap_post_result: 'SAP 回传失败：物料移动类型缺失', created_at: '2026-06-11 10:00:00' },
    { id: nextId(store.inboundOrders) + 1, order_no: 'IN202606110101', source_order_no: 'STOCK202606110101', mes_work_order_no: 'MES-STOCK202606110101', inbound_type: 'STOCKING', source_system: 'FULFILLMENT', warehouse_code: 'WH-SH-REGION', planned_qty: 10, received_qty: 0, status: 'CREATED', sap_post_status: 'NOT_POSTED', sap_post_result: '', created_at: '2026-06-11 10:20:00' },
    { id: nextId(store.inboundOrders) + 2, order_no: 'IN202606110102', source_order_no: 'POVMI202606110102', mes_work_order_no: 'MES-POVMI202606110102', inbound_type: 'SUPPLIER_VMI', source_system: 'SAP', warehouse_code: 'WH-SUP-CATL-VMI', planned_qty: 50, received_qty: 0, status: 'CREATED', sap_post_status: 'NOT_POSTED', sap_post_result: '', created_at: '2026-06-11 10:40:00' }
  ].map((order) => {
    const warehouse = warehouseByCode(order.warehouse_code)
    return { ...order, warehouse_name: warehouse.warehouse_name || order.warehouse_code, shelved_qty: 0, sap_material_doc_no: '' }
  })
  store.inboundOrders.unshift(...orderDefs)

  const addLine = (orderNo: string, lineNo: number, productCode: string, plannedQty: number, receivedQty = 0) => {
    const order = store.inboundOrders.find((item: Row) => item.order_no === orderNo)
    const product = productByCode(productCode)
    const line = inboundLine(order, lineNo, product, plannedQty, receivedQty, 0)
    line.status = receivedQty >= plannedQty ? 'RECEIVED' : receivedQty > 0 ? 'PARTIAL_RECEIVED' : 'CREATED'
    store.inboundOrderLines.push(line)
    return line
  }
  const line10010 = addLine('IN202606110100', 10, 'GT3-30KD1R11001', 10, 2)
  const line10020 = addLine('IN202606110100', 20, 'BLF51-5R31101', 5, 0)
  addLine('IN202606110100', 30, 'HP3-12KD2R11101', 8, 0)
  addLine('IN202606110101', 10, 'GT3-20KD1R11001', 6, 0)
  addLine('IN202606110101', 20, 'GT3-10KD1R11001', 4, 0)
  const line10210 = addLine('IN202606110102', 10, 'SP-BMS-001', 20, 0)
  addLine('IN202606110102', 20, 'SP-CABLE-001', 30, 0)

  const addSn = (snCode: string, line: Row, status: string, palletCode: string, boxCode: string) => {
    const order = store.inboundOrders.find((item: Row) => Number(item.id) === Number(line.order_id))
    const sn = {
      id: Date.now() + Math.random(),
      sn_code: snCode,
      mes_work_order_no: order.mes_work_order_no,
      product_code: line.product_code,
      product_name: line.product_name,
      product_id: line.product_id,
      warehouse_code: order.warehouse_code,
      warehouse_name: order.warehouse_name,
      location_code: '',
      pallet_code: palletCode,
      box_code: boxCode,
      status,
      quality_status: 'QUALIFIED',
      locked_flag: 0,
      inbound_order_no: order.order_no,
      inbound_order_line_id: line.id,
      outbound_order_no: '',
      sold_flag: 0,
      created_at: now()
    }
    store.serialNumbers.unshift(sn)
    store.packageBindings.unshift({
      id: Date.now() + Math.random(),
      pallet_code: palletCode,
      box_code: boxCode,
      sn_code: snCode,
      product_code: line.product_code,
      product_name: line.product_name,
      product_id: line.product_id,
      inbound_order_no: order.order_no,
      inbound_order_line_id: line.id,
      bind_order_no: order.order_no,
      bind_status: 'BOUND',
      bind_time: now()
    })
    return sn
  }
  addSn('SN-IN100-GT30-R001', line10010, 'RECEIVED', 'PLT-IN100-001', 'BOX-IN100-001')
  addSn('SN-IN100-GT30-R002', line10010, 'RECEIVED', 'PLT-IN100-001', 'BOX-IN100-001')
  addSn('SN-IN100-BLF-C001', line10020, 'COLLECTED', 'PLT-IN100-002', 'BOX-IN100-002')
  addSn('SN-IN100-BLF-C002', line10020, 'COLLECTED', 'PLT-IN100-002', 'BOX-IN100-002')
  addSn('SN-IN102-BMS-C001', line10210, 'COLLECTED', 'PLT-IN102-001', 'BOX-IN102-001')

  const receipt = {
    id: nextId(store.inboundReceipts),
    receipt_no: 'RCV20260611010001',
    inbound_order_id: line10010.order_id,
    inbound_order_no: 'IN202606110100',
    receipt_time: '2026-06-11 10:35:00',
    receipt_user: 'wh_admin',
    status: 'RECEIVED',
    sap_post_status: 'FAILED',
    sap_material_doc_no: '',
    sap_post_result: 'SAP 回传失败：物料移动类型缺失',
    created_at: '2026-06-11 10:35:00'
  }
  const receiptLine = {
    id: nextId(store.inboundReceiptLines),
    receipt_id: receipt.id,
    inbound_order_line_id: line10010.id,
    line_no: line10010.line_no,
    product_id: line10010.product_id,
    product_code: line10010.product_code,
    receive_qty: 2,
    sap_post_qty: 0,
    sap_post_status: 'FAILED',
    sap_material_doc_no: '',
    sap_post_result: 'SAP 回传失败：物料移动类型缺失'
  }
  store.inboundReceipts.unshift(receipt)
  store.inboundReceiptLines.unshift(receiptLine)
  store.serialNumbers
    .filter((sn: Row) => Number(sn.inbound_order_line_id) === Number(line10010.id) && sn.status === 'RECEIVED')
    .forEach((sn: Row) => {
      store.inboundReceiptSns.unshift({
        id: Date.now() + Math.random(),
        receipt_id: receipt.id,
        receipt_line_id: receiptLine.id,
        sn_code: sn.sn_code,
        product_id: sn.product_id,
        inbound_order_line_id: line10010.id,
        pallet_code: sn.pallet_code,
        box_code: sn.box_code
      })
    })
  store.interfaceLogs.unshift({
    id: Date.now() + Math.random(),
    interface_name: 'SAP_INBOUND_POSTING',
    source_system: 'WMS',
    target_system: 'SAP',
    business_doc_no: receipt.receipt_no,
    request_url: '/api/mock/sap/material-documents',
    status: 'FAILED',
    retry_count: 1,
    error_message: 'SAP 回传失败：物料移动类型缺失',
    created_at: '2026-06-11 10:36:00'
  })
  syncInboundHeaderQty(store.inboundOrders, store.inboundOrderLines)
}

function ensureOutboundMockLines(store: any) {
  store.outboundOrderLines ||= []
  store.outboundOrders.forEach((order: Row, index: number) => {
    const hasLine = store.outboundOrderLines.some((line: Row) => Number(line.order_id) === Number(order.id))
    if (!hasLine) {
      const product = store.products.find((row: Row) => row.product_code === order.product_code) || store.products[index % store.products.length] || {}
      store.outboundOrderLines.push(outboundLine(
        order,
        1,
        product,
        Number(order.planned_qty || 0),
        Number(order.allocated_qty || 0),
        Number(order.picked_qty || 0),
        Number(order.review_qty || 0),
        Number(order.shipped_qty || 0)
      ))
    }
  })
  const multiOrder = store.outboundOrders.find((row: Row) => row.order_no === 'OUT202606120004')
  if (multiOrder && !store.outboundOrderLines.some((line: Row) => Number(line.order_id) === Number(multiOrder.id) && Number(line.line_no) === 2)) {
    const product = store.products.find((row: Row) => row.product_code === 'INV-10K-AC001') || store.products[2]
    store.outboundOrderLines.push(outboundLine(multiOrder, 2, product, 2, 0, 0, 0, 0))
  }
  syncOutboundHeaderQty(store.outboundOrders, store.outboundOrderLines)
}

function ensureOutboundMockStore(store: any) {
  if (store.__wmsOutboundMockVersion === 'outbound-flow-v2') return
  const product = { product_code: 'GT3-30KD1R11001', product_name: '工商业储能电池包' }
  const central = { warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓' }
  const sh = { warehouse_code: 'WH-SH-REGION', warehouse_name: '上海区域销售仓' }
  store.outboundOrders = (store.outboundOrders || []).filter((row: Row) => !String(row.order_no || '').startsWith('OUT202606120'))
  store.outboundOrderLines = (store.outboundOrderLines || []).filter((row: Row) => !String(row.order_no || '').startsWith('OUT202606120'))
  store.serialNumbers = (store.serialNumbers || []).filter((row: Row) => !/^SN-(OUT|BAD|ALLOC|REV|SHIP)-/.test(String(row.sn_code || '')))
  store.inventory = (store.inventory || []).filter((row: Row) => !['BATCH-OUT-DEMO', 'BATCH-FROZEN-DEMO', 'BATCH-UNQUAL-DEMO'].includes(String(row.batch_no || '')))
  store.inventoryAllocations = []
  store.pickingTasks = []
  store.pickingRecords = []
  store.reviewRecords = []
  store.shipmentRecords = []
  store.inventoryTransactions = []
  store.outboundExceptions = []

  store.inventory.unshift(
    { id: 9001, ...central, area_code: 'AREA-GOOD-01', location_code: 'A01-01-01', ...product, batch_no: 'BATCH-OUT-DEMO', inventory_status: 'QUALIFIED', total_qty: 42, available_qty: 30, allocated_qty: 7, frozen_qty: 0, safety_stock: 20, inbound_date: '2026-04-15', low_stock: 0, aged: 0, vmi_flag: 0 },
    { id: 9002, ...central, area_code: 'AREA-GOOD-01', location_code: 'A02-01-07', ...product, batch_no: 'BATCH-FROZEN-DEMO', inventory_status: 'FROZEN', total_qty: 5, available_qty: 0, allocated_qty: 0, frozen_qty: 5, safety_stock: 20, inbound_date: '2026-04-01', low_stock: 1, aged: 0, vmi_flag: 0 },
    { id: 9003, ...central, area_code: 'AREA-GOOD-01', location_code: 'A01-01-01', ...product, batch_no: 'BATCH-UNQUAL-DEMO', inventory_status: 'UNQUALIFIED', total_qty: 5, available_qty: 0, allocated_qty: 0, frozen_qty: 0, safety_stock: 20, inbound_date: '2026-04-05', low_stock: 1, aged: 0, vmi_flag: 0 }
  )

  Array.from({ length: 30 }, (_, i) => i + 1).forEach((n) => {
    store.serialNumbers.unshift(mockSn(`SN-OUT-${String(n).padStart(4, '0')}`, product, central, 'A01-01-01', 'ON_SHELF', 'QUALIFIED', 0, ''))
  })
  Array.from({ length: 10 }, (_, i) => i + 1).forEach((n) => {
    const frozen = n <= 5
    store.serialNumbers.unshift(mockSn(`SN-BAD-${String(n).padStart(4, '0')}`, product, central, frozen ? 'A02-01-07' : 'A01-01-01', 'ON_SHELF', frozen ? 'QUALIFIED' : 'UNQUALIFIED', n === 10 ? 1 : 0, n === 10 ? 'OUT-OTHER-LOCK' : ''))
  })
  ;['0001', '0002', '0003', '0004'].forEach((n) => store.serialNumbers.unshift(mockSn(`SN-ALLOC-${n}`, product, central, 'A01-01-01', 'ALLOCATED', 'QUALIFIED', 1, 'OUT202606120002')))
  ;['0001', '0002', '0003'].forEach((n) => store.serialNumbers.unshift(mockSn(`SN-REV-${n}`, product, central, 'A01-01-01', 'REVIEWED', 'QUALIFIED', 1, 'OUT202606120003')))
  ;['0001', '0002', '0003', '0004', '0005'].forEach((n) => store.serialNumbers.unshift(mockSn(`SN-SHIP-${n}`, product, central, 'A01-01-01', 'SHIPPED', 'QUALIFIED', 0, 'OUT202606120005', 1)))

  const orders = [
    { id: 8801, order_no: 'OUT202606120001', source_order_no: 'SO202606120001', source_system: 'FULFILLMENT', outbound_type: 'SALES', ...central, customer_code: 'CUST-TESLA-001', customer_name: 'Tesla Energy China', ...product, planned_qty: 5, allocated_qty: 0, picked_qty: 0, review_qty: 0, shipped_qty: 0, status: 'PENDING_ALLOC', created_at: '2026-06-12 09:00:00' },
    { id: 8802, order_no: 'OUT202606120002', source_order_no: 'SO202606120002', source_system: 'FULFILLMENT', outbound_type: 'SALES', ...central, customer_code: 'CUST-BYD-002', customer_name: '比亚迪储能事业部', ...product, planned_qty: 4, allocated_qty: 4, picked_qty: 0, review_qty: 0, shipped_qty: 0, status: 'ALLOCATED', created_at: '2026-06-12 08:30:00' },
    { id: 8803, order_no: 'OUT202606120003', source_order_no: 'SO202606120003', source_system: 'FULFILLMENT', outbound_type: 'SALES', ...central, customer_code: 'CUST-SG-003', customer_name: 'State Grid Demo', ...product, planned_qty: 3, allocated_qty: 3, picked_qty: 3, review_qty: 3, shipped_qty: 0, status: 'REVIEWED', created_at: '2026-06-11 14:00:00' },
    { id: 8804, order_no: 'OUT202606120004', source_order_no: 'STO202606120004', source_system: 'SAP', outbound_type: 'TRANSFER', ...central, target_warehouse_code: sh.warehouse_code, target_warehouse_name: sh.warehouse_name, customer_code: '', customer_name: '', ...product, planned_qty: 6, allocated_qty: 0, picked_qty: 0, review_qty: 0, shipped_qty: 0, status: 'PENDING_ALLOC', created_at: '2026-06-12 09:20:00' },
    { id: 8805, order_no: 'OUT202606120005', source_order_no: 'STO202606120005', source_system: 'SAP', outbound_type: 'TRANSFER', ...central, target_warehouse_code: sh.warehouse_code, target_warehouse_name: sh.warehouse_name, customer_code: '', customer_name: '', ...product, planned_qty: 5, allocated_qty: 5, picked_qty: 5, review_qty: 5, shipped_qty: 5, status: 'CALLBACK_SUCCESS', logistics_company: 'SF', tracking_no: 'SF202606120005', sap_material_doc_no: '4900000005', created_at: '2026-06-10 11:00:00' },
    { id: 8806, order_no: 'OUT202606120006', source_order_no: 'AS202606120006', source_system: 'CRM', outbound_type: 'AFTERSALE', warehouse_code: 'WH-SZ-AFTERSALE', warehouse_name: '深圳售后仓', customer_code: 'CUST-TESLA-001', customer_name: 'Tesla Energy China', product_code: 'BMS-MAIN-001', product_name: 'BMS 主控板', planned_qty: 2, allocated_qty: 2, picked_qty: 1, review_qty: 0, shipped_qty: 0, status: 'PICKING', created_at: '2026-06-12 09:40:00' },
    { id: 8807, order_no: 'OUT202606120007', source_order_no: 'SO202606120007', source_system: 'FULFILLMENT', outbound_type: 'SALES', warehouse_code: sh.warehouse_code, warehouse_name: sh.warehouse_name, customer_code: 'CUST-EU-004', customer_name: 'EU Solar Partner', ...product, planned_qty: 2, allocated_qty: 2, picked_qty: 2, review_qty: 2, shipped_qty: 2, status: 'CALLBACK_SUCCESS', logistics_company: 'DHL', tracking_no: 'DHL202606120007', sap_material_doc_no: '4900000007', created_at: '2026-06-09 10:00:00' },
    { id: 8808, order_no: 'OUT202606120008', source_order_no: 'SO202606120008', source_system: 'FULFILLMENT', outbound_type: 'SALES', warehouse_code: 'WH-GZ-3PL', warehouse_name: '广州第三方仓', customer_code: 'CUST-AU-005', customer_name: 'AU Energy Storage', ...product, planned_qty: 1, allocated_qty: 1, picked_qty: 1, review_qty: 1, shipped_qty: 1, status: 'CALLBACK_FAILED', logistics_company: 'SF', tracking_no: 'SF202606120008', created_at: '2026-06-08 10:00:00' }
  ]
  store.outboundOrders.unshift(...orders)
  const outboundLines = orders.flatMap((order) => {
    const firstProduct = store.products.find((row: Row) => row.product_code === order.product_code) || product
    const lines = [outboundLine(order, 1, firstProduct, Number(order.planned_qty || 0), Number(order.allocated_qty || 0), Number(order.picked_qty || 0), Number(order.review_qty || 0), Number(order.shipped_qty || 0))]
    if (order.order_no === 'OUT202606120004') {
      const secondProduct = store.products.find((row: Row) => row.product_code === 'INV-10K-AC001') || store.products[2]
      lines.push(outboundLine(order, 2, secondProduct, 2, 0, 0, 0, 0))
    }
    return lines
  })
  store.outboundOrderLines.unshift(...outboundLines)
  syncOutboundHeaderQty(store.outboundOrders, store.outboundOrderLines)

  seedMockAllocations(store, orders[1], ['SN-ALLOC-0001', 'SN-ALLOC-0002', 'SN-ALLOC-0003', 'SN-ALLOC-0004'], 'ALLOCATED')
  seedMockAllocations(store, orders[2], ['SN-REV-0001', 'SN-REV-0002', 'SN-REV-0003'], 'REVIEWED')
  seedMockAllocations(store, orders[4], ['SN-SHIP-0001', 'SN-SHIP-0002', 'SN-SHIP-0003', 'SN-SHIP-0004', 'SN-SHIP-0005'], 'SHIPPED')
  store.pickingTasks.unshift(
    taskRow(9901, 'PICK202606120001', orders[1], 4, 0, 'PENDING'),
    taskRow(9902, 'PICK202606120002', orders[2], 3, 3, 'PICKED'),
    taskRow(9903, 'PICK202606120003', orders[4], 5, 5, 'PICKED'),
    taskRow(9904, 'PICK202606120004', orders[5], 2, 1, 'PICKING'),
    taskRow(9905, 'PICK202606120005', orders[6], 2, 2, 'PICKED')
  )
  store.shipmentRecords.unshift(
    shipmentRow('SHIP202606120001', orders[4], 3, 'SF', 'SF202606120005'),
    shipmentRow('SHIP202606120002', orders[6], 2, 'DHL', 'DHL202606120007'),
    shipmentRow('SHIP202606120003', orders[7], 1, 'SF', 'SF202606120008'),
    shipmentRow('SHIP202606120004', orders[4], 2, 'SF', 'SF202606120005-2'),
    shipmentRow('SHIP202606120005', orders[5], 1, 'SF', 'SF202606120006')
  )
  store.outboundExceptions.unshift(
    { id: 9701, exception_no: 'EXC202606120001', outbound_order_no: 'OUT202606120001', exception_type: 'INSUFFICIENT_STOCK', message: '可用库存不足，无法分配 20 个 SN', status: 'OPEN', sn_code: '', created_at: now() },
    { id: 9702, exception_no: 'EXC202606120002', outbound_order_no: 'OUT202606120002', task_no: 'PICK202606120001', sn_code: 'SN-BAD-0006', exception_type: 'SN_UNQUALIFIED', message: '不合格 SN 不允许分配或拣货', status: 'OPEN', created_at: now() },
    { id: 9703, exception_no: 'EXC202606120003', outbound_order_no: 'OUT202606120002', task_no: 'PICK202606120001', sn_code: 'SN-OUT-0030', exception_type: 'SN_MISMATCH', message: '该 SN 不属于当前出库单分配范围', status: 'OPEN', created_at: now() }
  )
  ;['OUT202606120005', 'OUT202606120007', 'OUT202606120008', 'OUT202606120003', 'OUT202606120006'].forEach((orderNo, index) => {
    addInterfaceLog(store, 'TRACE_OUTBOUND_SN', 'WMS', 'TRACE', orderNo, '/api/mock/trace/outbound-sn', index === 4 ? 'FAILED' : 'SUCCESS', index === 4 ? '追溯服务模拟超时' : '')
    addInterfaceLog(store, 'SAP_OUTBOUND_POSTING', 'WMS', 'SAP', orderNo, '/api/mock/sap/material-documents', orderNo === 'OUT202606120008' ? 'FAILED' : 'SUCCESS', orderNo === 'OUT202606120008' ? 'SAP 库存地点不存在' : '')
  })
  store.__wmsOutboundMockVersion = 'outbound-flow-v2'
}

function ensureShippingOrderV3Demo(store: any) {
  const demoVersion = 'shipping-order-v4-fixes2'
  const demoOrderNos = ['SO-OUT-202606110001', 'TR-OUT-202606110001', 'STO-OUT-202606110001', 'SO-OUT-202606110002']
  if (store.__wmsShippingOrderV3 !== demoVersion) {
    resetShippingOrderDemo(store, demoOrderNos)
  }
  if (store.__wmsShippingOrderV3 === demoVersion) return
  const central = store.warehouses.find((row: Row) => row.warehouse_code === 'WH-HZ-CENTRAL') || store.warehouses[0]
  const gt3 = store.products.find((row: Row) => row.product_code === 'GT3-10KD1R11004') || store.products[0]
  const nonSn = store.products.find((row: Row) => row.product_code === 'HXEDE081R10002') || store.products.find((row: Row) => !row.sn_managed) || store.products[1]
  const demoOwnerCode = gt3.owner_code || nonSn.owner_code || '3060'
  const demoOwnerName = gt3.owner_name || nonSn.owner_name || '杭州利沃得'
  if (!store.inventory.some((row: Row) => row.product_code === gt3.product_code && row.batch_no === 'BATCH-SHIP-GT3-MOCK')) {
    store.inventory.unshift({ id: Date.now() + 11, warehouse_code: central.warehouse_code, warehouse_name: central.warehouse_name, area_code: 'AREA-GOOD-01', location_code: 'A01-01-01', owner_code: demoOwnerCode, owner_name: demoOwnerName, product_code: gt3.product_code, product_name: gt3.product_name, batch_no: 'BATCH-SHIP-GT3-MOCK', inventory_status: 'QUALIFIED', total_qty: 40, available_qty: 35, allocated_qty: 0, frozen_qty: 0, safety_stock: 20, inbound_date: '2026-04-01' })
  }
  if (!store.inventory.some((row: Row) => row.product_code === nonSn.product_code && row.batch_no === 'BATCH-SHIP-NONSN-MOCK')) {
    store.inventory.unshift({ id: Date.now() + 12, warehouse_code: central.warehouse_code, warehouse_name: central.warehouse_name, area_code: 'AREA-GOOD-01', location_code: 'A01-01-01', owner_code: demoOwnerCode, owner_name: demoOwnerName, product_code: nonSn.product_code, product_name: nonSn.product_name, batch_no: 'BATCH-SHIP-NONSN-MOCK', inventory_status: 'QUALIFIED', total_qty: 80, available_qty: 80, allocated_qty: 0, frozen_qty: 0, safety_stock: 20, inbound_date: '2026-04-03' })
  }
  Array.from({ length: 20 }, (_, index) => index + 1).forEach((n) => {
    const sn = `SN-SHIP-GT3-${String(n).padStart(4, '0')}`
    if (!store.serialNumbers.some((row: Row) => row.sn_code === sn)) {
      store.serialNumbers.unshift(mockSn(sn, gt3, central, 'A01-01-01', 'ON_SHELF', 'QUALIFIED', 0, ''))
    }
  })
  ensureAvailableShippingSerials(store, gt3, central, 14)
  ;[
    { shipmentOrderNo: 'SO-OUT-202606110001', orderType: 'SALES_OUTBOUND', relatedOrderNo: 'FUL-SO-202606110001', salesOrderNo: 'SO202606110001', consigneeCode: 'CUST-TESLA-001', lines: [{ lineNo: 10, productCode: gt3.product_code, orderQty: 3, snRequired: true }, { lineNo: 20, productCode: nonSn.product_code, orderQty: 5, snRequired: false }] },
    { shipmentOrderNo: 'TR-OUT-202606110001', orderType: 'WAREHOUSE_TRANSFER', relatedOrderNo: 'TR202606110001', targetWarehouseCode: 'WH-SH-REGION', lines: [{ lineNo: 10, productCode: gt3.product_code, orderQty: 2, snRequired: true }, { lineNo: 20, productCode: nonSn.product_code, orderQty: 4, snRequired: false }] },
    { shipmentOrderNo: 'STO-OUT-202606110001', orderType: 'STO_OUTBOUND', relatedOrderNo: 'STO202606110001', targetWarehouseCode: 'WH-SH-REGION', lines: [{ lineNo: 10, productCode: gt3.product_code, orderQty: 4, snRequired: true }] },
    { shipmentOrderNo: 'SO-OUT-202606110002', orderType: 'SALES_OUTBOUND', relatedOrderNo: 'FUL-SO-202606110002', salesOrderNo: 'SO202606110002', consigneeCode: 'CUST-BYD-002', lines: [{ lineNo: 10, productCode: gt3.product_code, orderQty: 5, snRequired: true }] }
  ].forEach((body) => {
    if (!store.outboundOrders.some((row: Row) => row.order_no === body.shipmentOrderNo)) {
      mockCreateShippingOrderV3(store, { warehouseCode: 'WH-HZ-CENTRAL', ownerCode: demoOwnerCode, ownerName: demoOwnerName, ...body })
    }
  })
  const sto = store.outboundOrders.find((row: Row) => row.order_no === 'STO-OUT-202606110001')
  if (sto && Number(sto.allocated_qty || 0) === 0) {
    mockAutoAllocateV3(store, Number(sto.id))
    const stoLine = (store.outboundOrderLines || []).find((line: Row) => Number(line.order_id) === Number(sto.id))
    const stoSerials = (store.inventoryAllocations || [])
      .filter((row: Row) => Number(row.outbound_order_id) === Number(sto.id) && (!stoLine || Number(row.outbound_detail_id || row.line_id || stoLine.id) === Number(stoLine.id)) && row.allocation_status === 'ALLOCATED' && row.sn_code)
      .slice(0, 2)
      .map((row: Row) => row.sn_code)
    if (stoSerials.length) mockOrderPick(store, Number(sto.id), { lineId: stoLine?.id, serialNumbers: stoSerials, operator: 'wh_admin' })
  }
  const partial = store.outboundOrders.find((row: Row) => row.order_no === 'SO-OUT-202606110002')
  if (partial && Number(partial.shipped_qty || 0) === 0) {
    mockAutoAllocateV3(store, Number(partial.id))
    const line = (store.outboundOrderLines || []).find((item: Row) => Number(item.order_id) === Number(partial.id))
    const partialSerials = (store.inventoryAllocations || [])
      .filter((row: Row) => Number(row.outbound_order_id) === Number(partial.id) && (!line || Number(row.outbound_detail_id || row.line_id || line.id) === Number(line.id)) && row.allocation_status === 'ALLOCATED' && row.sn_code)
      .slice(0, 5)
      .map((row: Row) => row.sn_code)
    if (partialSerials.length) {
      mockOrderPick(store, Number(partial.id), { lineId: line?.id, serialNumbers: partialSerials, operator: 'wh_admin' })
      mockShipV3(store, Number(partial.id), { lineId: line?.id, shipQty: Math.min(2, partialSerials.length), carrierName: 'SF', trackingNo: 'SF202606110002', operator: 'logistics' })
    }
  }
  store.__wmsShippingOrderV3 = demoVersion
  saveStore(store)
}

function ensureAvailableShippingSerials(store: any, product: Row, warehouse: Row, count: number) {
  const available = () => (store.serialNumbers || []).filter((row: Row) =>
    row.warehouse_code === warehouse.warehouse_code &&
    row.product_code === product.product_code &&
    row.status === 'ON_SHELF' &&
    row.quality_status === 'QUALIFIED' &&
    !row.locked_flag
  )
  let index = 1
  while (available().length < count) {
    const sn = `SN-SHIP-GT3-DEMO-${String(index).padStart(4, '0')}`
    if (!store.serialNumbers.some((row: Row) => row.sn_code === sn)) {
      store.serialNumbers.unshift(mockSn(sn, product, warehouse, 'A01-01-01', 'ON_SHELF', 'QUALIFIED', 0, ''))
    }
    index += 1
    if (index > 200) break
  }
}

function resetShippingOrderDemo(store: any, orderNos: string[]) {
  const orderNoSet = new Set(orderNos)
  const demoOrders = (store.outboundOrders || []).filter((row: Row) => orderNoSet.has(row.order_no) || orderNoSet.has(row.parent_order_no))
  const demoIds = new Set(demoOrders.map((row: Row) => Number(row.id)))
  const demoDocNos = new Set(demoOrders.map((row: Row) => row.order_no))
  store.outboundOrders = (store.outboundOrders || []).filter((row: Row) => !demoIds.has(Number(row.id)))
  store.outboundOrderLines = (store.outboundOrderLines || []).filter((row: Row) => !demoIds.has(Number(row.order_id)))
  store.inventoryAllocations = (store.inventoryAllocations || []).filter((row: Row) => !demoIds.has(Number(row.outbound_order_id)))
  store.pickingTasks = (store.pickingTasks || []).filter((row: Row) => !demoIds.has(Number(row.outbound_order_id)))
  store.pickingRecords = (store.pickingRecords || []).filter((row: Row) => !demoIds.has(Number(row.outbound_order_id)))
  store.shipmentRecords = (store.shipmentRecords || []).filter((row: Row) => !demoIds.has(Number(row.outbound_order_id)))
  store.outboundExceptions = (store.outboundExceptions || []).filter((row: Row) => !demoDocNos.has(row.outbound_order_no))
  store.interfaceLogs = (store.interfaceLogs || []).filter((row: Row) => !demoDocNos.has(row.business_doc_no))
  store.operationLogs = (store.operationLogs || []).filter((row: Row) => !demoDocNos.has(row.business_doc_no))
  ;(store.serialNumbers || []).filter((row: Row) => String(row.sn_code || '').startsWith('SN-SHIP-GT3-')).forEach((row: Row) => {
    Object.assign(row, { status: 'ON_SHELF', quality_status: 'QUALIFIED', locked_flag: 0, locked_order_no: '', outbound_order_no: '', sold_flag: 0, market_flag: 0 })
  })
  ;(store.inventory || []).filter((row: Row) => ['BATCH-SHIP-GT3-MOCK', 'BATCH-SHIP-NONSN-MOCK'].includes(row.batch_no)).forEach((row: Row) => {
    if (row.batch_no === 'BATCH-SHIP-GT3-MOCK') Object.assign(row, { total_qty: 40, available_qty: 35, allocated_qty: 0, frozen_qty: 0, inventory_status: 'QUALIFIED' })
    if (row.batch_no === 'BATCH-SHIP-NONSN-MOCK') Object.assign(row, { total_qty: 80, available_qty: 80, allocated_qty: 0, frozen_qty: 0, inventory_status: 'QUALIFIED' })
  })
}

function mockSn(sn: string, product: Row, warehouse: Row, locationCode: string, status: string, qualityStatus: string, lockedFlag: number, orderNo: string, soldFlag = 0) {
  return {
    id: Date.now() + Math.random(),
    sn_code: sn,
    mes_work_order_no: `MES-${sn}`,
    ...product,
    warehouse_code: warehouse.warehouse_code,
    warehouse_name: warehouse.warehouse_name,
    location_code: locationCode,
    pallet_code: `PLT-${sn.slice(-4)}`,
    box_code: `BOX-${sn.slice(-4)}`,
    status,
    quality_status: qualityStatus,
    locked_flag: lockedFlag,
    locked_order_no: orderNo,
    inbound_order_no: `IN-${sn}`,
    outbound_order_no: orderNo,
    sold_flag: soldFlag,
    market_flag: soldFlag
  }
}

function seedMockAllocations(store: any, order: Row, serials: string[], status: string) {
  serials.forEach((sn, index) => {
    store.inventoryAllocations.unshift({
      id: Date.now() + Math.random(),
      allocation_no: `ALLOC-${order.order_no}-${index + 1}`,
      outbound_order_id: order.id,
      outbound_order_no: order.order_no,
      inventory_id: 9001,
      warehouse_code: order.warehouse_code,
      location_code: 'A01-01-01',
      product_code: order.product_code,
      product_name: order.product_name,
      batch_no: 'BATCH-OUT-DEMO',
      sn_code: sn,
      allocation_mode: 'AUTO',
      allocation_status: status,
      created_at: now()
    })
  })
}

function taskRow(id: number, taskNo: string, order: Row, planQty: number, pickedQty: number, status: string) {
  return { id, task_no: taskNo, outbound_order_id: order.id, outbound_order_no: order.order_no, warehouse_code: order.warehouse_code, warehouse_name: order.warehouse_name, location_code: 'A01-01-01', product_code: order.product_code, product_name: order.product_name, plan_qty: planQty, picked_qty: pickedQty, status, picker: pickedQty ? 'wh_admin' : '', created_at: now() }
}

function shipmentRow(shipmentNo: string, order: Row, qty: number, carrier: string, trackingNo: string) {
  return { id: Date.now() + Math.random(), shipment_no: shipmentNo, outbound_order_id: order.id, outbound_order_no: order.order_no, carrier, tracking_no: trackingNo, shipped_qty: qty, shipper: 'logistics', ship_time: now(), remark: 'Mock 发货记录', created_at: now() }
}

function handleOutboundMock<T>(store: any, url: string, method: string, params: Row, body: Row): { handled: true; value: T } | { handled: false; value?: never } {
  if (url === '/outbound-orders' && method === 'get') return handled(pageOutboundOrders(store, params) as T)
  if (url === '/outbound-orders' && method === 'post') return handled(mockCreateShippingOrderV3(store, body) as T)
  if (url.startsWith('/outbound-orders/')) {
    const segments = url.split('/')
    const id = Number(segments[2])
    const action = segments[3]
    if (method === 'get' && !action) return handled(mockOutboundDetail(store, id) as T)
    if (method === 'get' && action === 'allocations') return handled(mockAllocationView(store, id) as T)
    if (method === 'get' && action === 'allocation-candidates') return handled({ items: mockAllocationView(store, id).availableInventory, recommended: mockAllocationView(store, id).recommendedInventory } as T)
    if (method === 'get' && action === 'interface-logs') return handled({ items: store.interfaceLogs.filter((row: Row) => row.business_doc_no === mockOutboundOrder(store, id).order_no) } as T)
    if (method === 'get' && action === 'status-flow') return handled({ order: mockOutboundOrder(store, id), items: [] } as T)
    if (method === 'get' && action === 'picking-list') return handled(mockPickingList(store, id) as T)
    if (method === 'get' && action === 'shipments') return handled(mockOutboundDetail(store, id) as T)
    if (method === 'get' && action === 'pick-records') return handled(mockOutboundDetail(store, id) as T)
    if (method === 'post' && action === 'allocations' && segments[4] === 'cancel') return handled(mockCancelAllocationsV3(store, id, body) as T)
    if (method === 'post' && action === 'picks' && segments[4] === 'cancel') return handled(mockCancelPicksV3(store, id, body) as T)
    if (method === 'post' && action === 'shipments' && segments[4] === 'cancel') return handled(mockCancelShipmentsV3(store, id, body) as T)
    if (method === 'post' && action === 'shipments' && segments[5] === 'cancel') return handled(mockCancelShipmentV3(store, id, Number(segments[4]), body) as T)
    if (method === 'post' && action === 'picks' && segments[5] === 'cancel') return handled(mockCancelPickV3(store, id, Number(segments[4]), body) as T)
    if (method === 'post' && action === 'allocate-auto') return handled(mockAutoAllocateV3(store, id) as T)
    if (method === 'post' && action === 'allocate-manual') return handled(mockManualAllocateV3(store, id, body) as T)
    if (method === 'post' && action === 'release-allocation') return handled(mockCancelAllocation(store, id) as T)
    if (method === 'post' && action === 'picking-tasks') return handled(mockGeneratePicking(store, id) as T)
    if (method === 'post' && ['pick', 'pick-scan'].includes(action)) return handled(mockOrderPick(store, id, body) as T)
    if (method === 'post' && action === 'ship') return handled(mockShipV3(store, id, body) as T)
    if (method === 'post' && action === 'post-sap') return handled(mockSapCallback(store, id, Boolean(body.forceSapFail)) as T)
    if (method === 'post' && action === 'cancel') return handled(mockCancelOrder(store, id, body) as T)
    if (method === 'post' && action === 'close') return handled(mockCloseOrder(store, id, body) as T)
  }
  if (url === '/outbound/shipping-orders' && method === 'get') return handled(pageOutboundOrders(store, params) as T)
  if (url === '/outbound/sales-orders' && method === 'get') return handled(pageRows(store.outboundOrders.filter((row: Row) => row.outbound_type === 'SALES'), params) as T)
  if (url === '/outbound/transfer-orders' && method === 'get') return handled(pageRows(store.outboundOrders.filter((row: Row) => row.outbound_type === 'TRANSFER'), params) as T)
  if (url === '/outbound/picking-tasks' && method === 'get') return handled(pageRows(store.pickingTasks, params) as T)
  if (url === '/outbound/sales-orders/mock' && method === 'post') return handled(mockCreateOutbound(store, body, 'SALES') as T)
  if (url === '/outbound/transfer-orders/mock' && method === 'post') return handled(mockCreateOutbound(store, body, 'TRANSFER') as T)
  if (url === '/outbound/shipping-orders/mock' && method === 'post') return handled(mockCreateOutbound(store, body, String(body.outboundType || 'SALES')) as T)
  if (url.startsWith('/outbound/orders/')) {
    const segments = url.split('/')
    const id = Number(segments[3])
    const action = segments[4]
    if (method === 'get' && !action) return handled(mockOutboundDetail(store, id) as T)
    if (method === 'get' && action === 'allocations') return handled(mockAllocationView(store, id) as T)
    if (method === 'get' && action === 'interface-logs') return handled({ items: store.interfaceLogs.filter((row: Row) => row.business_doc_no === mockOutboundOrder(store, id).order_no) } as T)
    if (method === 'get' && action === 'status-flow') return handled({ order: mockOutboundOrder(store, id), items: [] } as T)
    if (method === 'post' && action === 'allocate-auto') return handled(mockAutoAllocate(store, id) as T)
    if (method === 'post' && action === 'allocate-manual') return handled(mockManualAllocate(store, id, body) as T)
    if (method === 'post' && action === 'cancel-allocation') return handled(mockCancelAllocation(store, id) as T)
    if (method === 'post' && action === 'picking-tasks') return handled(mockGeneratePicking(store, id) as T)
    if (method === 'post' && action === 'review') return handled(mockReview(store, id, body) as T)
    if (method === 'post' && action === 'ship') return handled(mockShip(store, id, body) as T)
    if (method === 'post' && action === 'trace-callback') return handled(mockTraceCallback(store, id, Boolean(body.forceTraceFail)) as T)
    if (method === 'post' && action === 'sap-callback') return handled(mockSapCallback(store, id, Boolean(body.forceSapFail)) as T)
  }
  if (url.startsWith('/outbound/picking-tasks/')) {
    const segments = url.split('/')
    const id = Number(segments[3])
    const action = segments[4]
    if (method === 'post' && action === 'scan') return handled(mockPickingScan(store, id, body) as T)
    if (method === 'post' && action === 'exception') return handled(mockPickingException(store, id, body) as T)
  }
  return { handled: false }
}

function handled<T>(value: T): { handled: true; value: T } {
  return { handled: true, value }
}

function handleImportExportMock<T>(store: any, url: string, method: string, params: Row, body: Row): { handled: true; value: T } | { handled: false; value?: never } {
  if (url === '/products/export-template' && method === 'get') return handled(csvFile('产品主数据导入模板.csv', productTemplateCsv()) as T)
  if (url === '/products/export' && method === 'get') return handled(csvFile(`产品主数据_${mockTimestamp()}.csv`, productExportCsv(filterRows(store.products || [], params).map(productExportRow))) as T)
  if (url === '/products/import' && method === 'post') return handled(importProductsMock(store, (body.rows || []) as Row[]) as T)

  if (url === '/customers/export-template' && method === 'get') return handled(csvFile('客户主数据导入模板.csv', customerTemplateCsv()) as T)
  if (url === '/customers/export' && method === 'get') return handled(csvFile(`客户主数据_${mockTimestamp()}.csv`, customerExportCsv(filterRows(store.customers || [], params).map(customerExportRow))) as T)
  if (url === '/customers/import' && method === 'post') return handled(importCustomersMock(store, (body.rows || []) as Row[]) as T)

  if (url === '/inbound-orders/import-template' && method === 'get') return handled(csvFile('预期到货通知单导入模板.csv', inboundTemplateCsv()) as T)
  if (url === '/inbound-orders/import' && method === 'post') return handled(importInboundOrdersMock(store, (body.headers || []) as Row[], (body.lines || []) as Row[]) as T)
  if (url === '/inbound-orders/export' && method === 'post') return handled(csvFile(`预期到货通知单_${mockTimestamp()}.csv`, inboundExportCsv(store, body)) as T)

  if (url === '/inbound/sn-bindings/export' && method === 'get') return handled(csvFile(`SN绑定数据_${mockTimestamp()}.csv`, snBindingExportCsv(store, params)) as T)
  return { handled: false }
}

const REPORT_NAMES: Row = {
  'inout-stock': '进出存报表',
  'inbound-daily': '入库日报表',
  'outbound-daily': '出库日报表',
  'standard-aging': '标准库龄报表',
  'segment-aging': '分段库龄报表',
  'outbound-sn': '出库SN报表',
  'inbound-sn': '入库SN报表'
}

const REPORT_EXPORT_COLUMNS: Record<string, [string, string][]> = {
  'inout-stock': [
    ['统计日期', 'reportDate'], ['货主', 'ownerCode'], ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'],
    ['库区', 'areaName'], ['库位', 'locationCode'], ['SAP工厂', 'sapPlant'], ['SAP库存地点', 'sapStorageLocation'], ['产品编码', 'productCode'],
    ['产品名称', 'productName'], ['产品名称英文', 'productNameEn'], ['产品族', 'productFamily'], ['产品类', 'productClass'], ['产品类别', 'productCategory'],
    ['单位', 'unit'], ['期初库存', 'openingQty'], ['本期入库数量', 'inboundQty'], ['本期出库数量', 'outboundQty'], ['调整入库数量', 'adjustInQty'],
    ['调整出库数量', 'adjustOutQty'], ['冻结数量', 'frozenQty'], ['已分配数量', 'allocatedQty'], ['期末库存', 'closingQty'], ['可用库存', 'availableQty'],
    ['库存状态', 'stockStatus'], ['最后入库时间', 'lastInboundTime'], ['最后出库时间', 'lastOutboundTime']
  ],
  'inbound-daily': [
    ['入库日期', 'receiptDate'], ['收货批次号', 'receiptNo'], ['入库单号', 'inboundOrderNo'], ['入库类型', 'inboundType'], ['来源系统', 'sourceSystem'],
    ['来源单号', 'sourceDocNo'], ['货主', 'ownerCode'], ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'],
    ['SAP工厂', 'sapPlant'], ['SAP库存地点', 'sapStorageLocation'], ['行号', 'lineNo'], ['产品编码', 'productCode'], ['产品名称', 'productName'],
    ['产品描述', 'productDescription'], ['单位', 'unit'], ['计划数量', 'planQty'], ['本次收货数量', 'receiptQty'], ['累计收货数量', 'receivedQty'],
    ['已上架数量', 'shelvedQty'], ['SN管理', 'snRequired'], ['收货状态', 'receiptStatus'], ['SAP回传状态', 'sapPostStatus'], ['SAP凭证号', 'sapMaterialDocNo'],
    ['SAP回传说明', 'sapPostResult'], ['收货人', 'receiptUser'], ['收货时间', 'receiptTime'], ['创建时间', 'createdAt']
  ],
  'outbound-daily': [
    ['发货日期', 'shipmentDate'], ['发货批次号', 'shipmentNo'], ['发运订单号', 'outboundOrderNo'], ['订单类型', 'outboundType'], ['发运订单状态', 'orderStatus'],
    ['关联单号', 'relatedOrderNo'], ['销售单号', 'salesOrderNo'], ['返工单号', 'reworkOrderNo'], ['货主', 'ownerCode'], ['货主名称', 'ownerName'],
    ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'], ['收货人编码', 'consigneeCode'], ['收货人名称', 'consigneeName'], ['目标仓库', 'targetWarehouseName'],
    ['目标货主', 'targetOwnerName'], ['SAP工厂', 'sapPlant'], ['行号', 'lineNo'], ['产品编码', 'productCode'], ['产品描述', 'productDescription'],
    ['单位', 'unit'], ['订单数量', 'orderQty'], ['分配数量', 'allocatedQty'], ['拣货数量', 'pickedQty'], ['本次发货数量', 'shipmentQty'],
    ['累计发货数量', 'shippedQty'], ['物流商', 'carrierName'], ['物流单号', 'trackingNo'], ['SAP回传状态', 'sapPostStatus'], ['SAP凭证号', 'sapMaterialDocNo'],
    ['SAP回传说明', 'sapPostResult'], ['发货人', 'shipmentUser'], ['发货时间', 'shipmentTime'], ['创建时间', 'createdAt']
  ],
  'standard-aging': [
    ['截止日期', 'asOfDate'], ['货主', 'ownerCode'], ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'],
    ['库区', 'areaName'], ['库位', 'locationCode'], ['产品编码', 'productCode'], ['产品名称', 'productName'], ['产品名称英文', 'productNameEn'],
    ['产品族', 'productFamily'], ['产品类', 'productClass'], ['产品类别', 'productCategory'], ['单位', 'unit'], ['批次号', 'batchNo'],
    ['SN', 'snCode'], ['托盘码', 'palletCode'], ['箱码', 'boxCode'], ['入库单号', 'inboundOrderNo'], ['入库日期', 'inboundDate'],
    ['最近收货日期', 'lastReceiptDate'], ['最近上架日期', 'lastShelvedDate'], ['库龄天数', 'agingDays'], ['标准库龄阈值', 'agingThresholdDays'],
    ['是否超期', 'overdueFlag'], ['是否电池类', 'batteryFlag'], ['库存数量', 'stockQty'], ['可用数量', 'availableQty'], ['冻结数量', 'frozenQty'],
    ['库存状态', 'stockStatus'], ['处理建议', 'handlingSuggestion']
  ],
  'segment-aging': [
    ['货主', 'ownerCode'], ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'], ['产品编码', 'productCode'],
    ['产品名称', 'productName'], ['产品族', 'productFamily'], ['产品类', 'productClass'], ['单位', 'unit'], ['总库存数量', 'totalStockQty'],
    ['0-30天数量', 'qty_0_30'], ['31-60天数量', 'qty_31_60'], ['61-90天数量', 'qty_61_90'], ['91-180天数量', 'qty_91_180'],
    ['181-270天数量', 'qty_181_270'], ['271-360天数量', 'qty_271_360'], ['360天以上数量', 'qty_over_360'], ['360天以上占比', 'ratioOver360'],
    ['是否电池类', 'batteryFlag'], ['处理建议', 'handlingSuggestion']
  ],
  'outbound-sn': [
    ['SN', 'snCode'], ['产品编码', 'productCode'], ['产品描述', 'productDescription'], ['产品名称英文', 'productNameEn'], ['货主', 'ownerCode'],
    ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'], ['库位', 'locationCode'], ['托盘码', 'palletCode'],
    ['箱码', 'boxCode'], ['发运订单号', 'outboundOrderNo'], ['订单类型', 'outboundType'], ['行号', 'lineNo'], ['销售单号', 'salesOrderNo'],
    ['关联单号', 'relatedOrderNo'], ['收货人编码', 'consigneeCode'], ['收货人名称', 'consigneeName'], ['发货批次号', 'shipmentNo'], ['发货时间', 'shipmentTime'],
    ['物流商', 'carrierName'], ['物流单号', 'trackingNo'], ['SAP回传状态', 'sapPostStatus'], ['SAP凭证号', 'sapMaterialDocNo'], ['SAP回传说明', 'sapPostResult'],
    ['SN状态', 'snStatus'], ['追溯回传状态', 'tracePostStatus'], ['追溯回传时间', 'tracePostTime']
  ],
  'inbound-sn': [
    ['SN', 'snCode'], ['产品编码', 'productCode'], ['产品名称', 'productName'], ['产品名称英文', 'productNameEn'], ['货主', 'ownerCode'],
    ['货主名称', 'ownerName'], ['仓库编码', 'warehouseCode'], ['仓库名称', 'warehouseName'], ['库区', 'areaName'], ['库位', 'locationCode'],
    ['托盘码', 'palletCode'], ['箱码', 'boxCode'], ['入库单号', 'inboundOrderNo'], ['入库类型', 'inboundType'], ['来源系统', 'sourceSystem'],
    ['来源单号', 'sourceDocNo'], ['行号', 'lineNo'], ['MES工单号', 'mesWorkOrderNo'], ['SAP工单号', 'sapWorkOrderNo'], ['SN下发时间', 'issuedTime'],
    ['SN采集时间', 'collectedTime'], ['收货批次号', 'receiptNo'], ['收货时间', 'receiptTime'], ['上架时间', 'shelvedTime'], ['SAP回传状态', 'sapPostStatus'],
    ['SAP凭证号', 'sapMaterialDocNo'], ['SAP回传说明', 'sapPostResult'], ['SN状态', 'snStatus'], ['质量状态', 'qualityStatus']
  ]
}

function handleReportMock<T>(store: any, url: string, method: string, params: Row, body: Row): { handled: true; value: T } | { handled: false; value?: never } {
  const match = url.match(/^\/reports\/([^/]+)(?:\/export)?$/)
  if (!match) return { handled: false }
  const reportKey = match[1]
  if (!REPORT_NAMES[reportKey]) return { handled: false }

  const exportMode = url.endsWith('/export')
  const query = exportMode ? body : params
  const rows = filterReportRows(buildReportRows(store, reportKey, query), query)
  if (exportMode && method === 'post') {
    return handled(csvFile(`${REPORT_NAMES[reportKey]}_${mockTimestamp()}.csv`, reportExportCsv(reportKey, rows)) as T)
  }
  if (method !== 'get') return { handled: false }
  const pageNum = Number(params.pageNum || 1)
  const pageSize = Number(params.pageSize || 10)
  const start = (pageNum - 1) * pageSize
  return handled({ items: rows.slice(start, start + pageSize), total: rows.length, pageNum, pageSize } as T)
}

function buildReportRows(store: any, reportKey: string, params: Row) {
  const builders: Record<string, (store: any, params: Row) => Row[]> = {
    'inout-stock': buildInoutStockReportRows,
    'inbound-daily': buildInboundDailyReportRows,
    'outbound-daily': buildOutboundDailyReportRows,
    'standard-aging': buildStandardAgingReportRows,
    'segment-aging': buildSegmentAgingReportRows,
    'outbound-sn': buildOutboundSnReportRows,
    'inbound-sn': buildInboundSnReportRows
  }
  return builders[reportKey]?.(store, params) || []
}

function buildInoutStockReportRows(store: any, params: Row) {
  const reportDate = String(params.endDate || params.startDate || '2026-06-25')
  return (store.inventory || []).map((item: Row, index: number) => {
    const product = findProduct(store, item)
    const outboundQty = reportQtyByProduct(store.outboundOrderLines, item.product_code, 'shipped_qty') || (index % 4)
    const inboundQty = reportQtyByProduct(store.inboundOrderLines, item.product_code, 'received_qty') || (index % 5)
    const closingQty = Number(item.total_qty || 0)
    const openingQty = Math.max(closingQty - inboundQty + outboundQty, 0)
    return productReportBase(store, item, product, {
      reportDate,
      areaName: item.area_name || item.area_code,
      locationCode: item.location_code,
      sapPlant: item.sap_plant || item.owner_code || product.owner_code || '3060',
      sapStorageLocation: item.sap_storage_location || '1001',
      openingQty,
      inboundQty,
      outboundQty,
      adjustInQty: index % 9 === 0 ? 1 : 0,
      adjustOutQty: index % 13 === 0 ? 1 : 0,
      frozenQty: Number(item.frozen_qty || 0),
      allocatedQty: Number(item.allocated_qty || 0),
      closingQty,
      availableQty: Number(item.available_qty || 0),
      stockStatus: item.inventory_status || 'QUALIFIED',
      lastInboundTime: `${item.inbound_date || '2026-06-11'} 09:00:00`,
      lastOutboundTime: outboundQty > 0 ? '2026-06-20 15:30:00' : ''
    })
  })
}

function buildInboundDailyReportRows(store: any) {
  return inboundLineRows(store).map((line: Row, index: number) => {
    const product = findProduct(store, line)
    const receiptLine = (store.inboundReceiptLines || []).find((row: Row) => Number(row.inbound_order_line_id) === Number(line.detail_id || line.id))
    const receipt = receiptLine
      ? (store.inboundReceipts || []).find((row: Row) => Number(row.id) === Number(receiptLine.receipt_id))
      : (store.inboundReceipts || []).find((row: Row) => row.inbound_order_no === line.order_no)
    const receiptQty = Number(receiptLine?.receive_qty ?? line.line_received_qty ?? line.received_qty ?? 0)
    return productReportBase(store, line, product, {
      receiptDate: String(receipt?.receipt_time || line.created_at || '2026-06-11').slice(0, 10),
      receiptNo: receipt?.receipt_no || (receiptQty > 0 ? `RCV-${line.order_no}-${line.line_no}` : ''),
      inboundOrderNo: line.order_no,
      inboundType: line.inbound_type,
      sourceSystem: line.source_system || 'SAP',
      sourceDocNo: line.source_order_no || line.mes_work_order_no,
      warehouseCode: line.warehouse_code,
      warehouseName: line.warehouse_name,
      sapPlant: line.sap_plant || line.owner_code || product.owner_code || '3060',
      sapStorageLocation: line.sap_storage_location || '1001',
      lineNo: line.line_no,
      productDescription: line.product_name,
      planQty: Number(line.line_planned_qty || line.planned_qty || 0),
      receiptQty,
      receivedQty: Number(line.line_received_qty || line.received_qty || 0),
      shelvedQty: Number(line.line_shelved_qty || line.shelved_qty || 0),
      snRequired: Number(line.sn_required || product.sn_managed || 0),
      receiptStatus: receipt?.status || line.status || 'CREATED',
      sapPostStatus: receiptLine?.sap_post_status || receipt?.sap_post_status || line.sap_post_status || 'NOT_POSTED',
      sapMaterialDocNo: receiptLine?.sap_material_doc_no || receipt?.sap_material_doc_no || line.sap_material_doc_no || '',
      sapPostResult: receiptLine?.sap_post_result || receipt?.sap_post_result || line.sap_post_result || '',
      receiptUser: receipt?.receipt_user || (receiptQty > 0 ? 'wh_admin' : ''),
      receiptTime: receipt?.receipt_time || '',
      createdAt: line.created_at || `2026-06-${String(11 - (index % 8)).padStart(2, '0')} 09:00:00`
    })
  })
}

function buildOutboundDailyReportRows(store: any) {
  return outboundLineRows(store).map((line: Row, index: number) => {
    const product = findProduct(store, line)
    const order = (store.outboundOrders || []).find((row: Row) => Number(row.id) === Number(line.order_id)) || line
    const shipment = (store.shipmentRecords || []).find((row: Row) => Number(row.outbound_order_id) === Number(line.order_id) || row.outbound_order_no === line.order_no)
    const shipmentQty = Number(line.line_shipped_qty || line.shipped_qty || 0)
    return productReportBase(store, line, product, {
      shipmentDate: String(shipment?.ship_time || order.ship_time || line.created_at || '2026-06-11').slice(0, 10),
      shipmentNo: shipment?.shipment_no || (shipmentQty > 0 ? `SHIP-${line.order_no}-${line.line_no}` : ''),
      outboundOrderNo: line.order_no,
      outboundType: line.outbound_type,
      orderStatus: order.status || line.status,
      relatedOrderNo: order.related_order_no || order.source_order_no,
      salesOrderNo: order.sales_order_no || order.source_order_no,
      reworkOrderNo: order.rework_order_no || '',
      warehouseCode: line.warehouse_code,
      warehouseName: line.warehouse_name,
      consigneeCode: order.consignee_code || order.customer_code,
      consigneeName: order.consignee_name || order.customer_name,
      targetWarehouseName: order.target_warehouse_name || '',
      targetOwnerName: order.target_owner_name || '',
      sapPlant: line.sap_plant || line.owner_code || product.owner_code || '3060',
      lineNo: line.line_no,
      productDescription: line.product_name,
      orderQty: Number(line.line_planned_qty || line.planned_qty || 0),
      allocatedQty: Number(line.line_allocated_qty || line.allocated_qty || 0),
      pickedQty: Number(line.line_picked_qty || line.picked_qty || 0),
      shipmentQty,
      shippedQty: Number(line.line_shipped_qty || line.shipped_qty || 0),
      carrierName: shipment?.carrier || order.carrier_name || order.logistics_company || '',
      trackingNo: shipment?.tracking_no || order.tracking_no || '',
      sapPostStatus: shipment?.sap_post_status || order.sap_post_status || 'NOT_POSTED',
      sapMaterialDocNo: shipment?.sap_material_doc_no || order.sap_material_doc_no || '',
      sapPostResult: shipment?.sap_post_result || order.sap_post_result || '',
      shipmentUser: shipment?.shipper || order.shipper || '',
      shipmentTime: shipment?.ship_time || order.ship_time || '',
      createdAt: line.created_at || `2026-06-${String(11 - (index % 8)).padStart(2, '0')} 10:00:00`
    })
  })
}

function buildStandardAgingReportRows(store: any, params: Row) {
  const asOfDate = String(params.asOfDate || '2026-06-25')
  return (store.inventory || []).map((item: Row, index: number) => {
    const product = findProduct(store, item)
    const sn = (store.serialNumbers || []).find((row: Row) => row.product_code === item.product_code && row.warehouse_code === item.warehouse_code)
    const agingDays = daysBetween(item.inbound_date, asOfDate) || (60 + index * 7)
    const threshold = Number(product.aging_threshold_days || item.aging_threshold_days || 180)
    const overdue = agingDays > threshold
    const serious = agingDays > 360
    return productReportBase(store, item, product, {
      asOfDate,
      areaName: item.area_name || item.area_code,
      locationCode: item.location_code,
      productCategory: product.category,
      batchNo: item.batch_no,
      snCode: sn?.sn_code || '',
      palletCode: sn?.pallet_code || '',
      boxCode: sn?.box_code || '',
      inboundOrderNo: sn?.inbound_order_no || '',
      inboundDate: item.inbound_date,
      lastReceiptDate: sn?.status ? '2026-06-11' : '',
      lastShelvedDate: ['ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'TRACED'].includes(String(sn?.status || '')) ? '2026-06-12' : '',
      agingDays,
      agingThresholdDays: threshold,
      overdueFlag: overdue ? 1 : 0,
      batteryFlag: Number(product.battery_flag || 0),
      stockQty: Number(item.total_qty || 0),
      availableQty: Number(item.available_qty || 0),
      frozenQty: Number(item.frozen_qty || 0),
      stockStatus: item.inventory_status || 'QUALIFIED',
      handlingSuggestion: serious ? '管理层重点关注' : overdue && Number(product.battery_flag || 0) ? '优先复检 / 补电 / 调拨' : overdue ? '优先销售 / 调拨' : '正常'
    })
  })
}

function buildSegmentAgingReportRows(store: any, params: Row) {
  const asOfDate = String(params.asOfDate || '2026-06-25')
  return (store.inventory || []).map((item: Row, index: number) => {
    const product = findProduct(store, item)
    const qty = Number(item.total_qty || 0)
    const agingDays = daysBetween(item.inbound_date, asOfDate) || (30 + index * 11)
    const row = productReportBase(store, item, product, {
      totalStockQty: qty,
      qty_0_30: agingDays <= 30 ? qty : 0,
      qty_31_60: agingDays > 30 && agingDays <= 60 ? qty : 0,
      qty_61_90: agingDays > 60 && agingDays <= 90 ? qty : 0,
      qty_91_180: agingDays > 90 && agingDays <= 180 ? qty : 0,
      qty_181_270: agingDays > 180 && agingDays <= 270 ? qty : 0,
      qty_271_360: agingDays > 270 && agingDays <= 360 ? qty : 0,
      qty_over_360: agingDays > 360 ? qty : 0,
      batteryFlag: Number(product.battery_flag || 0),
      handlingSuggestion: agingDays > 360 ? '管理层重点关注' : agingDays > Number(product.aging_threshold_days || 180) ? '优先消化' : '正常'
    })
    row.ratioOver360 = `${Math.round((Number(row.qty_over_360 || 0) / Math.max(qty, 1)) * 100)}%`
    return row
  })
}

function buildOutboundSnReportRows(store: any) {
  const candidates = (store.serialNumbers || []).filter((sn: Row) => sn.outbound_order_no || ['PICKED', 'SHIPPED', 'TRACED'].includes(String(sn.status || '')))
  return candidates.map((sn: Row, index: number) => {
    const order = (store.outboundOrders || []).find((row: Row) => row.order_no === sn.outbound_order_no) || (store.outboundOrders || [])[index % Math.max((store.outboundOrders || []).length, 1)] || {}
    const line = (store.outboundOrderLines || []).find((row: Row) => row.order_no === order.order_no && row.product_code === sn.product_code) || (store.outboundOrderLines || [])[index % Math.max((store.outboundOrderLines || []).length, 1)] || {}
    const shipment = (store.shipmentRecords || []).find((row: Row) => row.outbound_order_no === order.order_no || Number(row.outbound_order_id) === Number(order.id)) || {}
    const product = findProduct(store, sn)
    return productReportBase(store, { ...sn, ...order, warehouse_code: sn.warehouse_code || order.warehouse_code, warehouse_name: sn.warehouse_name || order.warehouse_name }, product, {
      snCode: sn.sn_code,
      productDescription: sn.product_name || product.product_name,
      locationCode: sn.location_code,
      palletCode: sn.pallet_code,
      boxCode: sn.box_code,
      outboundOrderNo: order.order_no || sn.outbound_order_no || `OUT-DEMO-${index + 1}`,
      outboundType: order.outbound_type || 'SALES',
      lineNo: line.line_no || 1,
      salesOrderNo: order.sales_order_no || order.source_order_no || '',
      relatedOrderNo: order.related_order_no || order.source_order_no || '',
      consigneeCode: order.consignee_code || order.customer_code || '',
      consigneeName: order.consignee_name || order.customer_name || '',
      shipmentNo: shipment.shipment_no || (sn.status === 'SHIPPED' || sn.status === 'TRACED' ? `SHIP-${order.order_no || index}` : ''),
      shipmentTime: shipment.ship_time || (sn.status === 'SHIPPED' || sn.status === 'TRACED' ? '2026-06-20 15:30:00' : ''),
      carrierName: shipment.carrier || order.carrier_name || order.logistics_company || '顺丰速运',
      trackingNo: shipment.tracking_no || order.tracking_no || '',
      sapPostStatus: shipment.sap_post_status || order.sap_post_status || (index % 9 === 0 ? 'FAILED' : 'POSTED'),
      sapMaterialDocNo: shipment.sap_material_doc_no || order.sap_material_doc_no || (index % 9 === 0 ? '' : `490000${String(index + 1).padStart(4, '0')}`),
      sapPostResult: shipment.sap_post_result || order.sap_post_result || '',
      snStatus: sn.status,
      tracePostStatus: order.trace_post_status || (index % 8 === 0 ? 'FAILED' : 'SUCCESS'),
      tracePostTime: index % 8 === 0 ? '' : '2026-06-20 15:40:00'
    })
  })
}

function buildInboundSnReportRows(store: any) {
  return (store.serialNumbers || [])
    .filter((sn: Row) => sn.inbound_order_no || ['INBOUND', 'COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(String(sn.status || '')))
    .map((sn: Row, index: number) => {
      const order = (store.inboundOrders || []).find((row: Row) => row.order_no === sn.inbound_order_no) || {}
      const line = (store.inboundOrderLines || []).find((row: Row) => Number(row.id) === Number(sn.inbound_order_line_id)) || {}
      const receiptSn = (store.inboundReceiptSns || []).find((row: Row) => row.sn_code === sn.sn_code)
      const receipt = receiptSn ? (store.inboundReceipts || []).find((row: Row) => Number(row.id) === Number(receiptSn.receipt_id)) : {}
      const product = findProduct(store, sn)
      return productReportBase(store, { ...sn, ...order, warehouse_code: sn.warehouse_code || order.warehouse_code, warehouse_name: sn.warehouse_name || order.warehouse_name }, product, {
        snCode: sn.sn_code,
        areaName: sn.area_name || '',
        locationCode: sn.location_code,
        palletCode: sn.pallet_code,
        boxCode: sn.box_code,
        inboundOrderNo: order.order_no || sn.inbound_order_no || '',
        inboundType: order.inbound_type || '',
        sourceSystem: order.source_system || 'MES',
        sourceDocNo: order.source_order_no || '',
        lineNo: line.line_no || sn.inbound_order_line_id || '',
        mesWorkOrderNo: sn.mes_work_order_no || order.mes_work_order_no || '',
        sapWorkOrderNo: order.source_order_no || '',
        issuedTime: sn.created_at || `2026-06-11 08:${String(index % 60).padStart(2, '0')}:00`,
        collectedTime: sn.pallet_code ? '2026-06-11 09:30:00' : '',
        receiptNo: receipt?.receipt_no || (['RECEIVED', 'INBOUND', 'ON_SHELF'].includes(String(sn.status || '')) ? `RCV-${order.order_no || index}` : ''),
        receiptTime: receipt?.receipt_time || (['RECEIVED', 'INBOUND', 'ON_SHELF'].includes(String(sn.status || '')) ? '2026-06-11 10:35:00' : ''),
        shelvedTime: sn.status === 'ON_SHELF' ? '2026-06-12 09:00:00' : '',
        sapPostStatus: receipt?.sap_post_status || order.sap_post_status || (index % 10 === 0 ? 'FAILED' : 'POSTED'),
        sapMaterialDocNo: receipt?.sap_material_doc_no || order.sap_material_doc_no || '',
        sapPostResult: receipt?.sap_post_result || order.sap_post_result || '',
        snStatus: sn.status,
        qualityStatus: sn.quality_status || 'QUALIFIED'
      })
    })
}

function productReportBase(store: any, source: Row, product: Row, extra: Row = {}): Row {
  const warehouse = findWarehouse(store, source)
  return {
    ownerCode: source.owner_code || product.owner_code || '3060',
    ownerName: source.owner_name || product.owner_name || OWNER_NAMES[source.owner_code || product.owner_code || '3060'] || '',
    warehouseCode: source.warehouse_code || warehouse.warehouse_code || '',
    warehouseName: source.warehouse_name || warehouse.warehouse_name || '',
    productCode: source.product_code || product.product_code || '',
    productName: source.product_name || product.product_name || '',
    productNameEn: product.product_name_en || '',
    productFamily: product.product_family || '',
    productClass: product.product_class || '',
    productCategory: product.category || source.category || '',
    unit: source.unit || product.unit || 'PCS',
    ...extra
  }
}

function findProduct(store: any, source: Row) {
  return (store.products || []).find((product: Row) => Number(product.id) === Number(source.product_id) || product.product_code === source.product_code) || {}
}

function findWarehouse(store: any, source: Row) {
  return (store.warehouses || []).find((warehouse: Row) => Number(warehouse.id) === Number(source.warehouse_id) || warehouse.warehouse_code === source.warehouse_code) || {}
}

function reportQtyByProduct(rows: Row[] = [], productCode: string, field: string) {
  return rows
    .filter((row) => row.product_code === productCode)
    .reduce((total, row) => total + Number(row[field] || 0), 0)
}

function daysBetween(startDate: unknown, endDate: unknown) {
  if (!startDate || !endDate) return 0
  const start = new Date(String(startDate).slice(0, 10))
  const end = new Date(String(endDate).slice(0, 10))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(Math.floor((end.getTime() - start.getTime()) / 86400000), 0)
}

function filterReportRows(rows: Row[], params: Row) {
  return rows.filter((row) => Object.keys(params || {}).every((key) => {
    const value = params[key]
    if (['pageNum', 'pageSize', 'startDate', 'endDate'].includes(key) || value === '' || value == null) return true
    const rowValue = String(row[key] ?? row[toSnake(key)] ?? '').toLowerCase()
    return rowValue.includes(String(value).toLowerCase())
  })).filter((row) => {
    const startDate = params.startDate ? String(params.startDate).slice(0, 10) : ''
    const endDate = params.endDate ? String(params.endDate).slice(0, 10) : ''
    if (!startDate && !endDate) return true
    const rowDate = String(row.reportDate || row.receiptDate || row.shipmentDate || row.asOfDate || row.inboundDate || row.receiptTime || row.shipmentTime || '').slice(0, 10)
    if (!rowDate) return true
    return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate)
  })
}

function reportExportCsv(reportKey: string, rows: Row[]) {
  const columns = REPORT_EXPORT_COLUMNS[reportKey] || Object.keys(rows[0] || {}).map((key) => [key, key] as [string, string])
  return csvString(columns.map(([label]) => label), rows.map((row) => columns.map(([, prop]) => row[prop] ?? row[toSnake(prop)] ?? '')))
}

function csvFile(filename: string, content: string) {
  return { filename, content, mimeType: 'text/csv;charset=utf-8' }
}

function productTemplateCsv() {
  return csvString(
    productTemplateHeaders(),
    [[
      '3060', '杭州利沃得', 'DEMO-PROD-001', '演示产品', 'Demo Product', 'MODEL-001',
      '数字能源', '逆变器', '成品', 'PCS', '是', '否', '20', '180', '启用'
    ]]
  )
}

function customerTemplateCsv() {
  return csvString(
    customerTemplateHeaders(),
    [['CUST-DEMO-001', '演示客户', '客户', '中国', '浙江', '张三', '13800000000', '杭州市演示地址', '启用']]
  )
}

function inboundTemplateCsv() {
  return [
    '# Sheet1：入库单表头',
    csvString(inboundHeaderHeaders(), [['TMP-IN-001', '生产入库', 'SAP', 'MO-DEMO-001', '3060', '杭州利沃得', 'WH-HZ-CENTRAL', '杭州集团总仓', '中国', '3060', '2026-06-18', '导入模板示例']]),
    '',
    '# Sheet2：入库单明细',
    csvString(inboundLineHeaders(), [['TMP-IN-001', '10', 'GT3-10KD1R11004', '三相并网逆变器', '3060', '1001', 'BATCH-DEMO-001', '3', 'QUALIFIED', '模板示例明细']])
  ].join('\n')
}

function importProductsMock(store: any, rows: Row[]) {
  const result = importResult()
  rows.forEach((row, index) => {
    const rowNo = index + 2
    const ownerCode = cell(row, '货主编码', 'ownerCode', 'owner_code')
    const ownerName = cell(row, '货主名称', 'ownerName', 'owner_name')
    const productCode = cell(row, '产品编码', 'productCode', 'product_code')
    const productName = cell(row, '产品名称（中文）', '产品名称', 'productName', 'product_name')
    const unit = cell(row, '单位', 'unit')
    const snValue = cell(row, 'SN 管理', 'SN管理', 'snManaged', 'sn_managed')
    const statusValue = cell(row, '状态', 'status')
    const requiredError = firstMissing([
      [ownerCode, '货主编码不能为空'],
      [ownerName, '货主名称不能为空'],
      [productCode, '产品编码不能为空'],
      [productName, '产品名称不能为空'],
      [unit, '单位不能为空'],
      [snValue, 'SN 管理不能为空'],
      [statusValue, '状态不能为空']
    ])
    const snManaged = parseYesNo(snValue)
    if (requiredError) return pushImportError(result, rowNo, requiredError)
    if (snManaged == null) return pushImportError(result, rowNo, 'SN 管理必须是“是 / 否”')
    const data = {
      owner_code: ownerCode,
      owner_name: ownerName,
      product_code: productCode,
      product_name: productName,
      product_name_en: cell(row, '产品名称（英文）', 'productNameEn', 'product_name_en'),
      spec_model: cell(row, '产品型号', 'productModel', 'spec_model'),
      product_family: cell(row, '产品族', 'productFamily', 'product_family'),
      product_class: cell(row, '产品类', 'productClass', 'product_class'),
      category: cell(row, '类别', 'productCategory', 'category'),
      unit,
      sn_managed: snManaged,
      battery_flag: parseYesNo(cell(row, '电池类', 'batteryFlag', 'battery_flag')) || 0,
      safety_stock: numberCell(row, '安全库存', 'safetyStock', 'safety_stock'),
      aging_threshold_days: numberCell(row, '库龄阈值', 'agingThresholdDays', 'aging_threshold_days') || 180,
      status: parseStatus(statusValue)
    }
    if (!data.category) return pushImportError(result, rowNo, '类别不能为空')
    if (!data.status) return pushImportError(result, rowNo, '状态必须是“启用 / 停用”')
    const existing = (store.products || []).find((item: Row) => item.owner_code === ownerCode && item.product_code === productCode)
    if (existing) Object.assign(existing, data)
    else store.products.unshift({ id: nextId(store.products), ...data })
    result.successCount += 1
  })
  result.failedCount = result.errors.length
  saveStore(store)
  return result
}

function importCustomersMock(store: any, rows: Row[]) {
  const result = importResult()
  rows.forEach((row, index) => {
    const rowNo = index + 2
    const code = cell(row, '编码', 'customerCode', 'customer_code')
    const name = cell(row, '名称', 'customerName', 'customer_name')
    const typeValue = cell(row, '类型', 'customerType', 'customer_type')
    const statusValue = cell(row, '状态', 'status')
    const type = parseCustomerType(typeValue)
    const status = parseStatus(statusValue)
    const requiredError = firstMissing([
      [code, '编码不能为空'],
      [name, '名称不能为空'],
      [typeValue, '类型不能为空'],
      [statusValue, '状态不能为空']
    ])
    if (requiredError) return pushImportError(result, rowNo, requiredError)
    if (!type) return pushImportError(result, rowNo, '类型必须是：客户 / 供应商 / 货主')
    if (!status) return pushImportError(result, rowNo, '状态必须是：启用 / 停用')
    const data = {
      customer_code: code,
      customer_name: name,
      customer_type: type,
      country_region: joinCountryRegion(cell(row, '国家', 'country'), cell(row, '地区', 'region')) || cell(row, '国家/地区', 'countryRegion', 'country_region'),
      contact_name: cell(row, '联系人', 'contactName', 'contact_name'),
      contact_phone: cell(row, '联系电话', 'contactPhone', 'contact_phone'),
      delivery_address: cell(row, '地址', 'address', 'delivery_address'),
      vmi_flag: 0,
      status
    }
    const existing = (store.customers || []).find((item: Row) => item.customer_code === code)
    if (existing) Object.assign(existing, data)
    else store.customers.unshift({ id: nextId(store.customers), ...data })
    result.successCount += 1
  })
  result.failedCount = result.errors.length
  saveStore(store)
  return result
}

function importInboundOrdersMock(store: any, headers: Row[], lines: Row[]) {
  const result = importResult()
  const lineGroups = new Map<string, Row[]>()
  lines.forEach((line) => {
    const key = cell(line, '入库单号', 'orderNo', 'inboundOrderNo')
    if (!key && headers.length !== 1) return
    const groupKey = key || '__ONLY_HEADER__'
    lineGroups.set(groupKey, [...(lineGroups.get(groupKey) || []), line])
  })
  headers.forEach((header, index) => {
    const rowNo = index + 2
    const orderNo = cell(header, '入库单号', 'orderNo', 'inboundOrderNo') || `IN${Date.now()}${index}`
    const groupKey = cell(header, '入库单号', 'orderNo', 'inboundOrderNo') || (headers.length === 1 ? '__ONLY_HEADER__' : orderNo)
    const inboundTypeLabel = cell(header, '入库类型', 'inboundType')
    const inboundType = parseInboundType(inboundTypeLabel)
    const sourceSystem = cell(header, '来源系统', 'sourceSystem') || 'MANUAL'
    const ownerCode = cell(header, '货主编码', 'ownerCode')
    const ownerName = cell(header, '货主名称', 'ownerName')
    const warehouseCode = cell(header, '入库仓库编码', 'warehouseCode')
    const sapPlant = cell(header, 'SAP 工厂', 'sapPlant')
    const orderLines = lineGroups.get(groupKey) || []
    const requiredError = firstMissing([
      [inboundTypeLabel, '入库类型不能为空'],
      [sourceSystem, '来源系统不能为空'],
      [ownerCode, '货主编码不能为空'],
      [ownerName, '货主名称不能为空'],
      [warehouseCode, '入库仓库编码不能为空'],
      [sapPlant, 'SAP 工厂不能为空']
    ])
    if (requiredError) return pushImportError(result, rowNo, requiredError)
    if (!inboundType) return pushImportError(result, rowNo, '入库类型不合法')
    if (!(store.customers || []).some((item: Row) => item.customer_code === ownerCode)) return pushImportError(result, rowNo, '货主不存在')
    if (!(store.warehouses || []).some((item: Row) => item.warehouse_code === warehouseCode)) return pushImportError(result, rowNo, '仓库不存在')
    if (!orderLines.length) return pushImportError(result, rowNo, '每个表头至少需要一条明细')
    const usedLineNos = new Set<string>()
    const mappedLines: Row[] = []
    let failed = false
    orderLines.forEach((line, lineIndex) => {
      const lineNo = cell(line, '行号', 'lineNo')
      const productCode = cell(line, '产品编码', 'productCode')
      const planQty = Number(cell(line, '计划数量', 'planQty'))
      const product = (store.products || []).find((item: Row) => item.owner_code === ownerCode && item.product_code === productCode)
      const lineRowNo = lineIndex + 2
      if (!lineNo || usedLineNos.has(lineNo)) {
        failed = true
        return pushImportError(result, lineRowNo, `入库单 ${orderNo} 行号为空或重复`)
      }
      if (!product) {
        failed = true
        return pushImportError(result, lineRowNo, `产品不存在或不属于货主：${ownerCode}/${productCode}`)
      }
      if (!Number.isFinite(planQty) || planQty <= 0) {
        failed = true
        return pushImportError(result, lineRowNo, '计划数量必须大于 0')
      }
      usedLineNos.add(lineNo)
      mappedLines.push({
        lineNo: Number(lineNo),
        productCode,
        productId: product.id,
        plannedQty: planQty,
        sapPlant: cell(line, 'SAP 工厂', 'sapPlant') || sapPlant,
        sapStorageLocation: cell(line, 'SAP 库存地点', 'sapStorageLocation'),
        batchNo: cell(line, '批次号', 'batchNo'),
        qualityStatus: cell(line, '质量状态', 'qualityStatus') || 'QUALIFIED'
      })
    })
    if (failed) return
    mockCreateInboundOrder(store, {
      orderNo,
      inboundType,
      sourceSystem,
      sourceOrderNo: cell(header, '来源单号', 'sourceDocNo', 'sourceOrderNo'),
      ownerCode,
      ownerName,
      warehouseCode,
      shipFromCountry: cell(header, '出库国家', 'shipFromCountry'),
      sapPlant,
      planArrivalDate: cell(header, '计划到货日期', 'planDate'),
      remark: cell(header, '备注', 'remark'),
      lines: mappedLines,
      operator: 'import'
    })
    result.successCount += 1
  })
  result.failedCount = result.errors.length
  saveStore(store)
  return result
}

function productExportRow(row: Row) {
  return [
    row.owner_code || '', row.owner_name || '', row.product_code || '', row.product_name || '',
    row.product_name_en || '', row.spec_model || '', row.product_family || '', row.product_class || '',
    row.category || '', row.unit || '', yesNo(row.sn_managed), yesNo(row.battery_flag),
    row.safety_stock || 0, row.aging_threshold_days || 0, statusName(row.status)
  ]
}

function customerExportRow(row: Row) {
  const [country, region] = splitCountryRegion(row.country_region)
  return [
    row.customer_code || '', row.customer_name || '', customerTypeName(row.customer_type),
    country, region, row.contact_name || '', row.contact_phone || '', row.delivery_address || '',
    statusName(row.status)
  ]
}

function inboundExportCsv(store: any, body: Row) {
  const scope = String(body.exportScope || 'QUERY')
  const orderIds = ((body.orderIds || []) as number[]).map(Number)
  const queryParams = (body.queryParams || {}) as Row
  const rows = scope === 'SELECTED'
    ? inboundOrderRows(store).filter((row: Row) => orderIds.includes(Number(row.id)))
    : filterRows(inboundOrderRows(store), queryParams)
  const headerRows = rows.map((row: Row) => [
    row.order_no, inboundTypeName(row.inbound_type), row.source_system, row.source_order_no,
    row.owner_code, row.owner_name, row.warehouse_code, row.warehouse_name, row.ship_from_country,
    row.sap_plant, row.line_count, row.planned_qty, row.collected_qty, row.pending_receive_qty,
    row.received_qty, row.shelved_qty, statusName(row.status), sapStatusName(row.sap_post_status),
    row.sap_material_doc_no || row.sap_post_result || '', row.created_at
  ])
  const lineRows = rows.flatMap((row: Row) => (row.lines || []).map((line: Row) => [
    row.order_no, line.line_no, line.product_code, line.product_name, yesNo(line.sn_required),
    line.sap_plant, line.sap_storage_location, line.batch_no || '', line.planned_qty,
    line.collected_sn_qty || line.collectedQty || 0, line.pending_receive_qty || line.pendingReceiveQty || 0,
    line.received_qty || 0, line.shelved_qty || 0, statusName(line.line_status || line.status)
  ]))
  return ['# Sheet1：入库单表头', csvString(inboundExportHeaderHeaders(), headerRows), '', '# Sheet2：入库单明细', csvString(inboundExportLineHeaders(), lineRows)].join('\n')
}

function snBindingExportCsv(store: any, params: Row) {
  const rows = filterRows(pageSnBindings(store, { ...params, pageNum: 1, pageSize: 100000 }).items, params)
  const exportRows = rows.map((row: Row) => {
    const sn = (store.serialNumbers || []).find((item: Row) => item.sn_code === row.sn_code) || {}
    return [
      row.inbound_order_no || '', row.line_no || row.lineNo || '', row.product_code || '', row.product_name || '',
      row.sn_code || '', row.pallet_code || '', row.box_code || '', row.sn_status || sn.status || '',
      row.bind_status || '', sn.warehouse_code || row.warehouse_code || '', sn.location_code || row.location_code || '',
      row.bind_time || '', sn.received_at || '', sn.shelved_at || ''
    ]
  })
  return csvString(['入库单号', '行号', '产品编码', '产品名称', 'SN', '托盘码', '箱码', 'SN 状态', '收货状态', '仓库编码', '库位编码', '采集时间', '收货时间', '上架时间'], exportRows)
}

function productExportCsv(rows: unknown[][]) {
  return csvString(productTemplateHeaders(), rows)
}

function customerExportCsv(rows: unknown[][]) {
  return csvString(customerTemplateHeaders(), rows)
}

function productTemplateHeaders() {
  return ['货主编码', '货主名称', '产品编码', '产品名称（中文）', '产品名称（英文）', '产品型号', '产品族', '产品类', '类别', '单位', 'SN 管理', '电池类', '安全库存', '库龄阈值', '状态']
}

function customerTemplateHeaders() {
  return ['编码', '名称', '类型', '国家', '地区', '联系人', '联系电话', '地址', '状态']
}

function inboundHeaderHeaders() {
  return ['入库单号', '入库类型', '来源系统', '来源单号', '货主编码', '货主名称', '入库仓库编码', '入库仓库名称', '出库国家', 'SAP 工厂', '计划到货日期', '备注']
}

function inboundLineHeaders() {
  return ['入库单号', '行号', '产品编码', '产品名称', 'SAP 工厂', 'SAP 库存地点', '批次号', '计划数量', '质量状态', '备注']
}

function inboundExportHeaderHeaders() {
  return ['入库单号', '入库类型', '来源系统', '来源单号', '货主编码', '货主名称', '入库仓库编码', '入库仓库名称', '出库国家', 'SAP 工厂', '产品行数', '计划总数量', '已采集数量', '待收货数量', '已收货数量', '已上架数量', '订单状态', 'SAP 回传状态', '回传结果', '创建时间']
}

function inboundExportLineHeaders() {
  return ['入库单号', '行号', '产品编码', '产品名称', 'SN 管理', 'SAP 工厂', 'SAP 库存地点', '批次号', '计划数量', '已采集数量', '待收货数量', '已收货数量', '已上架数量', '行状态']
}

function csvString(headers: unknown[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function filterRows(rows: Row[], params: Row) {
  return rows.filter((row) => Object.keys(params || {}).every((key) => {
    if (['pageNum', 'pageSize'].includes(key) || params[key] === '' || params[key] == null) return true
    if (key === 'createdStart') return String(row.created_at || '') >= String(params[key])
    if (key === 'createdEnd') return String(row.created_at || '').slice(0, 10) <= String(params[key])
    const value = String(row[key] ?? row[toSnake(key)] ?? '')
    return value.includes(String(params[key]))
  }))
}

function importResult() {
  return { successCount: 0, failedCount: 0, errors: [] as { rowNo: number; reason: string }[] }
}

function pushImportError(result: ReturnType<typeof importResult>, rowNo: number, reason: string) {
  result.errors.push({ rowNo, reason })
}

function firstMissing(items: [string, string][]) {
  return items.find(([value]) => !String(value || '').trim())?.[1]
}

function cell(row: Row, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value != null && String(value).trim() !== '') return String(value).trim()
  }
  return ''
}

function numberCell(row: Row, ...keys: string[]) {
  const value = Number(cell(row, ...keys) || 0)
  return Number.isFinite(value) ? value : 0
}

function parseYesNo(value: string) {
  if (['是', 'Y', 'YES', 'true', '1', '启用'].includes(String(value).trim().toUpperCase())) return 1
  if (['否', 'N', 'NO', 'false', '0', '停用'].includes(String(value).trim().toUpperCase())) return 0
  return null
}

function yesNo(value: unknown) {
  return Number(value || 0) === 1 || value === true ? '是' : '否'
}

function parseStatus(value: string) {
  if (['启用', 'ACTIVE'].includes(String(value).trim().toUpperCase())) return 'ACTIVE'
  if (['停用', 'DISABLED', 'INACTIVE'].includes(String(value).trim().toUpperCase())) return 'DISABLED'
  return ''
}

function statusName(value: string) {
  const map: Row = { ACTIVE: '启用', DISABLED: '停用', CREATED: '待收货', PARTIAL_RECEIVED: '部分收货', RECEIVED: '完全收货', ON_SHELF: '已上架', CLOSED: '已关闭', CANCELED: '已取消' }
  return map[value] || value || ''
}

function parseCustomerType(value: string) {
  const map: Row = { 客户: 'CUSTOMER', 供应商: 'SUPPLIER', 货主: 'OWNER', CUSTOMER: 'CUSTOMER', SUPPLIER: 'SUPPLIER', OWNER: 'OWNER' }
  return map[String(value || '').trim().toUpperCase()] || map[String(value || '').trim()] || ''
}

function customerTypeName(value: string) {
  const map: Row = { CUSTOMER: '客户', SUPPLIER: '供应商', OWNER: '货主' }
  return map[value] || value || ''
}

function parseInboundType(value: string) {
  const map: Row = { 生产入库: 'PRODUCTION', 备货入库: 'STOCKING', '售后 RMA 入库': 'RMA', 调拨入库: 'TRANSFER', '供应商 VMI 入库': 'SUPPLIER_VMI', PRODUCTION: 'PRODUCTION', STOCKING: 'STOCKING', RMA: 'RMA', TRANSFER: 'TRANSFER', SUPPLIER_VMI: 'SUPPLIER_VMI' }
  return map[String(value || '').trim().toUpperCase()] || map[String(value || '').trim()] || ''
}

function inboundTypeName(value: string) {
  const map: Row = { PRODUCTION: '生产入库', STOCKING: '备货入库', RMA: '售后 RMA 入库', TRANSFER: '调拨入库', SUPPLIER_VMI: '供应商 VMI 入库', OTHER: '其他入库' }
  return map[value] || value || ''
}

function sapStatusName(value: string) {
  const map: Row = { NOT_POSTED: '未回传', SUCCESS: '回传成功', POSTED: '已回传', FAILED: '回传失败' }
  return map[value] || value || ''
}

function joinCountryRegion(country: string, region: string) {
  return [country, region].filter(Boolean).join('/')
}

function splitCountryRegion(value: string) {
  const parts = String(value || '').split(/[/-]/)
  return [parts[0] || '', parts.slice(1).join('/') || '']
}

function mockTimestamp() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
}

function pageRows(rows: Row[], params: Row) {
  const filtered = rows.filter((row) => Object.keys(params).every((key) => {
    if (['pageNum', 'pageSize'].includes(key) || params[key] === '' || params[key] == null) return true
    if (key === 'createdStart') return String(row.created_at || '') >= String(params[key])
    if (key === 'createdEnd') return String(row.created_at || '').slice(0, 10) <= String(params[key])
    const value = String(row[key] ?? row[toSnake(key)] ?? '')
    return value.includes(String(params[key]))
  }))
  const pageNum = Number(params.pageNum || 1)
  const pageSize = Number(params.pageSize || 10)
  const start = (pageNum - 1) * pageSize
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, pageNum, pageSize }
}

function pageInboundOrders(store: any, params: Row) {
  return pageRows(inboundOrderRows(store), params)
}

function mockRetryInterfaceLog(store: any, id: number, body: Row) {
  const log = (store.interfaceLogs || []).find((row: Row) => Number(row.id) === Number(id))
  if (!log) throw new Error('接口日志不存在')
  const config = (store.mockConfigs || []).find((row: Row) => row.interface_name === log.interface_name)
  const enabled = !config || Number(config.enabled ?? 1) === 1
  const forceFail = Boolean(config && Number(config.force_fail || 0) === 1)
  const success = enabled && !forceFail
  const message = success ? '' : (config?.failure_message || 'Mock 配置为失败，重试失败')
  log.retry_count = Number(log.retry_count || 0) + 1
  log.status = success ? 'SUCCESS' : 'FAILED'
  log.error_message = message
  log.response_body = success
    ? JSON.stringify({ retryStatus: 'SUCCESS', message: '人工重试成功' })
    : JSON.stringify({ retryStatus: 'FAILED', message })
  log.created_at = now()
  addInterfaceLog(
    store,
    log.interface_name,
    log.source_system,
    log.target_system,
    log.business_doc_no,
    log.request_url,
    log.status,
    message
  )
  addOperationLog(store, log.business_doc_no || log.interface_name, 'INTERFACE_RETRY', body.operator || 'admin', log.status, `接口日志人工重试 ${log.interface_name}`)
  saveStore(store)
  return { id, status: log.status, retryCount: log.retry_count, message: success ? '重试成功' : message }
}

function pageOutboundOrders(store: any, params: Row) {
  return pageRows(outboundOrderRows(store), params)
}

function pageSnBindings(store: any, params: Row) {
  const rows = (store.packageBindings || []).map((row: Row) => ({
    ...row,
    asnNo: row.inbound_order_no,
    palletCode: row.pallet_code,
    boxCode: row.box_code,
    snCode: row.sn_code,
    lineNo: store.inboundOrderLines.find((line: Row) => Number(line.id) === Number(row.inbound_order_line_id))?.line_no
  }))
  return pageRows(rows, params)
}

function deleteMockBinding(store: any, id: number) {
  const binding = (store.packageBindings || []).find((row: Row) => Number(row.id) === Number(id))
  if (!binding) return
  const sn = (store.serialNumbers || []).find((row: Row) => row.sn_code === binding.sn_code)
  if (binding.inbound_order_line_id && sn && sn.status !== 'COLLECTED') {
    throw new Error('仅允许删除未收货的 SN 采集绑定，已收货或已上架 SN 不能直接删除')
  }
  store.packageBindings = store.packageBindings.filter((row: Row) => Number(row.id) !== Number(id))
  if (sn) {
    sn.pallet_code = ''
    sn.box_code = ''
    if (binding.inbound_order_line_id) {
      sn.inbound_order_no = ''
      sn.inbound_order_line_id = null
      sn.warehouse_code = ''
      sn.warehouse_name = ''
      sn.status = 'ISSUED'
    }
  }
  addOperationLog(store, binding.inbound_order_no || binding.bind_order_no || '', 'CANCEL_SN_COLLECT', 'wh_admin', 'SUCCESS', `取消未收货 SN 采集绑定 ${binding.sn_code}`)
  saveStore(store)
}

function inboundOrderRows(store: any) {
  return (store.inboundOrders || []).map((order: Row) => {
    const lines = (store.inboundOrderLines || []).filter((line: Row) => Number(line.order_id) === Number(order.id))
    const collectedQty = lines.reduce((acc: number, line: Row) => acc + inboundLineSnCount(store, line, order.order_no, COLLECTED_SN_STATUSES), 0)
    const pendingReceiveQty = lines.reduce((acc: number, line: Row) => acc + inboundLineSnCount(store, line, order.order_no, ['COLLECTED']), 0)
    const receiptRows = (store.inboundReceipts || []).filter((receipt: Row) => Number(receipt.inbound_order_id) === Number(order.id))
    const pendingSapReceiptCount = receiptRows.filter((receipt: Row) => ['NOT_POSTED', 'FAILED'].includes(receipt.sap_post_status || 'NOT_POSTED')).length
    const latestReceipt = receiptRows[0]
    const viewLines = lines
      .sort((a: Row, b: Row) => Number(a.line_no) - Number(b.line_no))
      .map((line: Row) => {
        const collectedSnQty = inboundLineSnCount(store, line, order.order_no, COLLECTED_SN_STATUSES)
        const pendingLineReceiveQty = inboundLineSnCount(store, line, order.order_no, ['COLLECTED'])
        return {
          ...line,
          lineNo: line.line_no,
          productId: line.product_id,
          productCode: line.product_code,
          productName: line.product_name,
          snRequired: Number(line.sn_required ?? 0) === 1,
          sapPlant: line.sap_plant || order.sap_plant || order.owner_code || '',
          sapStorageLocation: line.sap_storage_location || '',
          planQty: Number(line.planned_qty || 0),
          collectedQty: collectedSnQty,
          pendingReceiveQty: pendingLineReceiveQty,
          receivedQty: Number(line.received_qty || 0),
          shelvedQty: Number(line.shelved_qty || 0),
          lineStatus: line.status || order.status,
          collected_sn_qty: collectedSnQty,
          pending_receive_qty: pendingLineReceiveQty,
          line_status: line.status || order.status
        }
      })
    return {
      ...order,
      inboundType: order.inbound_type,
      warehouseCode: order.warehouse_code,
      sourceOrderNo: order.source_order_no,
      orderNo: order.order_no,
      shipFromCountry: order.ship_from_country || order.shipFromCountry || '',
      ship_from_country: order.ship_from_country || order.shipFromCountry || '',
      owner: `${order.owner_code || ''} ${order.owner_name || order.supplier_name || order.customer_name || order.warehouse_name || ''}`,
      owner_code: order.owner_code || order.supplier_code || order.customer_code || 'OWN',
      owner_name: order.owner_name || order.supplier_name || order.customer_name || order.warehouse_name || '自有库存',
      related_order_no: order.related_order_no || order.mes_work_order_no || order.source_order_no,
      sap_post_status: order.sap_post_status || 'NOT_POSTED',
      sap_post_result: order.sap_post_result || latestReceipt?.sap_post_result || '',
      sap_material_doc_no: order.sap_material_doc_no || latestReceipt?.sap_material_doc_no || '',
      line_count: lines.length,
      planned_qty: lines.length ? sum(lines, 'planned_qty') : Number(order.planned_qty || 0),
      received_qty: lines.length ? sum(lines, 'received_qty') : Number(order.received_qty || 0),
      collected_qty: collectedQty,
      pending_receive_qty: pendingReceiveQty,
      shelved_qty: lines.length ? sum(lines, 'shelved_qty') : Number(order.shelved_qty || 0),
      pending_sap_receipt_count: pendingSapReceiptCount,
      created_by: order.created_by || 'system',
      updated_by: order.updated_by || 'system',
      updated_at: order.updated_at || order.created_at,
      lines: viewLines
    }
  })
}

function outboundOrderRows(store: any) {
  return (store.outboundOrders || []).map((order: Row) => {
    const lines = (store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === Number(order.id))
    return {
      ...order,
      outboundType: order.outbound_type,
      warehouseCode: order.warehouse_code,
      customerCode: order.customer_code,
      sourceOrderNo: order.source_order_no,
      orderNo: order.order_no,
      line_count: lines.length,
      product_summary: lines.map((line: Row) => line.product_code).join(', '),
      planned_qty: lines.length ? sum(lines, 'planned_qty') : Number(order.planned_qty || 0),
      allocated_qty: lines.length ? sum(lines, 'allocated_qty') : Number(order.allocated_qty || 0),
      picked_qty: lines.length ? sum(lines, 'picked_qty') : Number(order.picked_qty || 0),
      review_qty: lines.length ? sum(lines, 'review_qty') : Number(order.review_qty || 0),
      shipped_qty: lines.length ? sum(lines, 'shipped_qty') : Number(order.shipped_qty || 0),
      shipment_order_no: order.shipment_order_no || order.order_no,
      order_type: order.order_type || order.outbound_type,
      lines
    }
  })
}

function inboundLineRows(store: any) {
  return (store.inboundOrderLines || []).map((line: Row) => {
    const order = store.inboundOrders.find((item: Row) => Number(item.id) === Number(line.order_id)) || {}
    return {
      ...order,
      ...line,
      id: order.id,
      detail_id: line.id,
      order_planned_qty: order.planned_qty,
      order_received_qty: order.received_qty,
      line_planned_qty: line.planned_qty,
      line_received_qty: line.received_qty,
      line_shelved_qty: line.shelved_qty,
      status: order.status || line.status,
      created_at: order.created_at
    }
  })
}

function outboundLineRows(store: any) {
  return (store.outboundOrderLines || []).map((line: Row) => {
    const order = store.outboundOrders.find((item: Row) => Number(item.id) === Number(line.order_id)) || {}
    return {
      ...order,
      ...line,
      id: order.id,
      detail_id: line.id,
      order_planned_qty: order.planned_qty,
      order_allocated_qty: order.allocated_qty,
      order_picked_qty: order.picked_qty,
      order_review_qty: order.review_qty,
      order_shipped_qty: order.shipped_qty,
      line_planned_qty: line.planned_qty,
      line_allocated_qty: line.allocated_qty,
      line_picked_qty: line.picked_qty,
      line_review_qty: line.review_qty,
      line_shipped_qty: line.shipped_qty,
      status: order.status || line.status,
      created_at: order.created_at
    }
  })
}

function mockOutboundOrder(store: any, id: number) {
  const order = store.outboundOrders.find((row: Row) => Number(row.id) === id)
  if (!order) throw new Error('出库单不存在')
  return order
}

function mockOutboundDetail(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  const allocations = store.inventoryAllocations
    .filter((row: Row) => row.outbound_order_id === id)
    .map((row: Row) => mockEnrichOutboundAllocation(store, order, row))
  const shipments = store.shipmentRecords
    .filter((row: Row) => row.outbound_order_id === id)
    .map((row: Row) => mockEnrichShipmentRecord(store, order, row, allocations))
  const interfaceLogs = store.interfaceLogs.filter((row: Row) => row.business_doc_no === order.order_no || row.business_doc_no === order.source_order_no)
  return {
    order,
    details: (store.outboundOrderLines || [])
      .filter((line: Row) => Number(line.order_id) === Number(id))
      .map((line: Row) => ({ ...line, status: line.status || line.line_status || order.status, line_status: line.line_status || line.status || order.status })),
    allocations,
    pickingTasks: store.pickingTasks.filter((row: Row) => row.outbound_order_id === id),
    pickingRecords: store.pickingRecords
      .filter((row: Row) => row.outbound_order_id === id)
      .map((row: Row) => mockEnrichPickingRecord(store, order, row)),
    reviewRecords: store.reviewRecords.filter((row: Row) => row.outbound_order_id === id),
    shipments,
    shipmentRecords: shipments,
    interfaceLogs,
    sapLogs: interfaceLogs,
    operationLogs: store.operationLogs.filter((row: Row) => row.business_doc_no === order.order_no),
    exceptions: store.outboundExceptions.filter((row: Row) => row.outbound_order_no === order.order_no)
  }
}

function mockEnrichOutboundAllocation(store: any, order: Row, allocation: Row) {
  const line = (store.outboundOrderLines || []).find((row: Row) => Number(row.id) === Number(allocation.outbound_detail_id || allocation.line_id))
  const sn = (store.serialNumbers || []).find((row: Row) => row.sn_code && row.sn_code === allocation.sn_code)
  return {
    ...allocation,
    line_no: allocation.line_no || line?.line_no,
    product_code: allocation.product_code || line?.product_code,
    product_name: allocation.product_name || line?.product_name || line?.product_description,
    owner_code: allocation.owner_code || order.owner_code || mockRowOwner(store, allocation),
    owner_name: allocation.owner_name || order.owner_name || mockRowOwnerName(store, allocation),
    pallet_code: allocation.pallet_code || sn?.pallet_code || '',
    box_code: allocation.box_code || sn?.box_code || ''
  }
}

function mockEnrichPickingRecord(store: any, order: Row, record: Row) {
  const allocation = (store.inventoryAllocations || []).find((row: Row) => {
    if (Number(row.outbound_order_id) !== Number(order.id)) return false
    if (record.sn_code && !String(record.sn_code).startsWith('NONSN-')) return row.sn_code === record.sn_code
    return row.location_code === record.location_code && ['PICKED', 'REVIEWED', 'SHIPPED'].includes(row.allocation_status)
  })
  const enrichedAllocation: Row = allocation ? mockEnrichOutboundAllocation(store, order, allocation) : {}
  return {
    ...record,
    ...enrichedAllocation,
    id: record.id,
    task_no: record.task_no,
    sn_code: record.sn_code,
    location_code: record.location_code || enrichedAllocation.location_code,
    picked_qty: record.picked_qty || enrichedAllocation.allocated_qty || 1,
    pick_mode: enrichedAllocation.allocation_mode || (String(record.sn_code || '').startsWith('NONSN-') ? 'DIRECT_PICK' : 'AUTO_FIFO')
  }
}

function mockEnrichShipmentRecord(store: any, order: Row, shipment: Row, allocations: Row[]) {
  const shipped = allocations.filter((row: Row) => row.allocation_status === 'SHIPPED')
  const first = shipped[0] || {}
  return {
    ...shipment,
    line_no: first.line_no || '',
    product_code: first.product_code || '',
    product_name: first.product_name || '',
    owner_code: shipment.owner_code || order.owner_code || '',
    owner_name: shipment.owner_name || order.owner_name || '',
    pallet_code: first.pallet_code || '',
    box_code: first.box_code || '',
    sn_code: shipped.map((row: Row) => row.sn_code).filter(Boolean).slice(0, 3).join(', '),
    shipment_status: shipment.shipment_status || shipment.status || 'SHIPPED'
  }
}

function mockRowOwner(store: any, row: Row) {
  return row.owner_code || row.ownerCode || store.products.find((product: Row) => product.product_code === row.product_code || Number(product.id) === Number(row.product_id))?.owner_code || ''
}

function mockRowOwnerName(store: any, row: Row) {
  return row.owner_name || row.ownerName || store.products.find((product: Row) => product.product_code === row.product_code || Number(product.id) === Number(row.product_id))?.owner_name || ''
}

function mockSameOwner(store: any, order: Row, row: Row) {
  const orderOwner = String(order.owner_code || order.ownerCode || '')
  const rowOwner = String(mockRowOwner(store, row) || '')
  return !orderOwner || !rowOwner || orderOwner === rowOwner
}

function mockAvailableInventoryRow(row: Row) {
  return ['QUALIFIED', 'AVAILABLE', undefined, ''].includes(row.inventory_status) && Number(row.available_qty || 0) > 0 && Number(row.frozen_qty || 0) === 0
}

function mockActiveAllocation(row: Row) {
  return ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(row.allocation_status)
}

function mockInventoryForLine(store: any, order: Row, line: Row, source?: Row) {
  return (store.inventory || []).find((row: Row) =>
    row.warehouse_code === order.warehouse_code &&
    row.product_code === line.product_code &&
    (!source?.location_code || row.location_code === source.location_code) &&
    mockSameOwner(store, order, row)
  )
}

function mockAllocationView(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  const lines = (store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === id)
  const availableInventory = lines.flatMap((line: Row) => {
    if (Number(line.sn_required ?? line.sn_managed ?? 1) === 0) {
      return (store.inventory || [])
        .filter((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && Number(row.available_qty || 0) > 0)
        .map((row: Row) => ({ ...row, owner_code: mockRowOwner(store, row), owner_name: mockRowOwnerName(store, row), line_no: line.line_no, line_id: line.id, sn_code: '', sn_status: '', quality_status: 'QUALIFIED', frozen_flag: Number(row.frozen_qty || 0) > 0 ? 1 : 0 }))
    }
    return store.serialNumbers
      .filter((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && ['ON_SHELF', 'ALLOCATED', 'PICKED', 'REVIEWED'].includes(row.status))
      .map((row: Row) => ({ ...row, owner_code: mockRowOwner(store, row), owner_name: mockRowOwnerName(store, row), line_no: line.line_no, line_id: line.id, sn_status: row.status, inventory_status: row.sn_code.startsWith('SN-BAD-') ? (row.quality_status === 'UNQUALIFIED' ? 'UNQUALIFIED' : 'FROZEN') : 'QUALIFIED', batch_no: row.sn_code.startsWith('SN-BAD-') ? 'BATCH-BAD-DEMO' : 'BATCH-OUT-DEMO', available_qty: row.status === 'ON_SHELF' && row.quality_status === 'QUALIFIED' && !row.locked_flag ? 1 : 0, frozen_flag: row.location_code === 'A02-01-07' ? 1 : 0 }))
  })
  const recommendedInventory = lines.flatMap((line: Row) => availableInventory
    .filter((row: Row) => Number(row.line_id) === Number(line.id) && row.inventory_status === 'QUALIFIED' && row.quality_status === 'QUALIFIED' && !row.locked_flag && !row.frozen_flag && Number(row.available_qty || 0) > 0)
    .slice(0, Math.max(Number(line.planned_qty || line.order_qty || 0) - Number(line.allocated_qty || 0), 0)))
  return { order, lines, availableInventory, recommendedInventory, allocations: store.inventoryAllocations.filter((row: Row) => row.outbound_order_id === id).map((row: Row) => ({ ...row, owner_code: order.owner_code, owner_name: order.owner_name })) }
}

function mockCreateOutbound(store: any, body: Row, type: string) {
  const id = Date.now()
  const orderNo = body.outboundOrderNo || `OUT${id}`
  const row = {
    id,
    order_no: orderNo,
    source_order_no: body.sourceOrderNo || `${type === 'TRANSFER' ? 'STO' : 'SO'}${id}`,
    source_system: body.sourceSystem || (type === 'TRANSFER' ? 'SAP' : 'FULFILLMENT'),
    outbound_type: type,
    warehouse_code: body.warehouseCode || 'WH-HZ-CENTRAL',
    warehouse_name: body.warehouseCode || 'WH-HZ-CENTRAL',
    target_warehouse_code: type === 'TRANSFER' ? (body.targetWarehouseCode || 'WH-SH-REGION') : '',
    customer_code: type === 'TRANSFER' ? '' : (body.customerCode || 'CUST-TESLA-001'),
    customer_name: type === 'TRANSFER' ? '' : '模拟客户',
    product_code: body.productCode || 'GT3-30KD1R11001',
    product_name: '工商业储能电池包',
    planned_qty: Number(body.qty || 5),
    allocated_qty: 0,
    picked_qty: 0,
    review_qty: 0,
    shipped_qty: 0,
    status: 'PENDING_ALLOC',
    created_at: now()
  }
  store.outboundOrders.unshift(row)
  const product = store.products.find((item: Row) => item.product_code === row.product_code) || row
  store.outboundOrderLines.unshift(outboundLine(row, 1, product, Number(row.planned_qty || 0), 0, 0, 0, 0))
  addInterfaceLog(store, type === 'TRANSFER' ? 'SAP_STO_PUSH' : 'FULFILLMENT_ORDER_PUSH', row.source_system, 'WMS', row.order_no, type === 'TRANSFER' ? '/api/mock/sap/sto-orders' : '/api/mock/fulfillment/outbound-orders', 'SUCCESS', '')
  addOutboundOperationLog(store, row.order_no, 'CREATE_OUTBOUND_ORDER', 'system', 'SUCCESS', '模拟创建出库单')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockCreateShippingOrderV3(store: any, body: Row) {
  const id = Date.now()
  const orderType = normalizeMockOutboundType(String(body.orderType || body.outboundType || 'SALES_OUTBOUND'))
  const orderNo = body.shipmentOrderNo || body.outboundOrderNo || body.orderNo || `${mockOutboundPrefix(orderType)}${id}`
  const warehouse = store.warehouses.find((item: Row) => item.warehouse_code === body.warehouseCode) || store.warehouses[0]
  const target = store.warehouses.find((item: Row) => item.warehouse_code === body.targetWarehouseCode) || store.warehouses[1]
  const customer = store.customers.find((item: Row) => item.customer_code === body.consigneeCode || item.customer_code === body.customerCode) || store.customers[0]
  const transferType = ['WAREHOUSE_TRANSFER', 'STO_OUTBOUND'].includes(orderType)
  const inputLines = Array.isArray(body.lines) && body.lines.length
    ? body.lines
    : [{ lineNo: 10, productCode: body.productCode || 'GT3-10KD1R11004', orderQty: body.qty || 1, snRequired: true }]
  const order = {
    id,
    order_no: orderNo,
    shipment_order_no: orderNo,
    source_order_no: body.relatedOrderNo || body.sourceOrderNo || `${transferType ? 'STO' : 'SO'}${id}`,
    related_order_no: body.relatedOrderNo || body.sourceOrderNo || `${transferType ? 'STO' : 'SO'}${id}`,
    sales_order_no: body.salesOrderNo || '',
    source_system: body.sourceSystem || (transferType ? 'SAP' : 'FULFILLMENT'),
    outbound_type: orderType,
    order_type: orderType,
    warehouse_code: warehouse.warehouse_code,
    warehouse_name: warehouse.warehouse_name,
    owner_code: body.ownerCode || '3060',
    owner_name: body.ownerName || '杭州利沃得',
    target_warehouse_code: transferType ? target.warehouse_code : '',
    target_warehouse_name: transferType ? target.warehouse_name : '',
    consignee_code: transferType ? '' : customer.customer_code,
    consignee_name: transferType ? '' : customer.customer_name,
    customer_code: transferType ? '' : customer.customer_code,
    customer_name: transferType ? '' : customer.customer_name,
    expected_ship_time: toMockDateTime(body.expectedShipTime),
    required_delivery_time: toMockDateTime(body.requiredDeliveryTime),
    planned_qty: inputLines.reduce((sumQty: number, line: Row) => sumQty + Number(line.orderQty || line.plannedQty || 0), 0),
    allocated_qty: 0,
    picked_qty: 0,
    review_qty: 0,
    shipped_qty: 0,
    status: 'CREATED',
    sap_post_status: 'NOT_POSTED',
    sap_post_result: '',
    created_at: now()
  }
  store.outboundOrders.unshift(order)
  inputLines.forEach((item: Row, index: number) => {
    const product = store.products.find((row: Row) => row.product_code === item.productCode) || store.products[0]
    const line = outboundLine(order, Number(item.lineNo || (index + 1) * 10), product, Number(item.orderQty || item.plannedQty || 1), 0, 0, 0, 0)
    line.sap_plant = item.sapPlant || order.owner_code
    line.unit = item.unit || product.unit || 'PCS'
    line.sn_required = item.snRequired == null ? Number(product.sn_managed || 0) : (item.snRequired ? 1 : 0)
    line.line_status = 'CREATED'
    store.outboundOrderLines.unshift(line)
  })
  addInterfaceLog(store, transferType ? 'SAP_STO_PUSH' : 'FULFILLMENT_ORDER_PUSH', order.source_system, 'WMS', order.order_no, transferType ? '/api/mock/sap/sto-orders' : '/api/mock/fulfillment/outbound-orders', 'SUCCESS', '')
  addOutboundOperationLog(store, order.order_no, 'CREATE_SHIPPING_ORDER', 'system', 'SUCCESS', '创建发运订单')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function normalizeMockOutboundType(value: string) {
  if (value === 'SALES') return 'SALES_OUTBOUND'
  if (value === 'TRANSFER') return 'WAREHOUSE_TRANSFER'
  if (value === 'AFTERSALE') return 'AFTERSALE_OUTBOUND'
  return value || 'SALES_OUTBOUND'
}

function mockOutboundPrefix(type: string) {
  if (type === 'WAREHOUSE_TRANSFER') return 'TR-OUT-'
  if (type === 'STO_OUTBOUND') return 'STO-OUT-'
  return 'SO-OUT-'
}

function toMockDateTime(value: unknown) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ')
  return String(value)
}

function mockAutoAllocate(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  const need = Number(order.planned_qty || 0) - Number(order.allocated_qty || 0)
  const candidates = mockAllocationView(store, id).recommendedInventory.slice(0, need)
  if (candidates.length < need) {
    order.status = 'ALLOCATION_EXCEPTION'
    store.outboundExceptions.unshift({ id: Date.now(), exception_no: `EXC${Date.now()}`, outbound_order_no: order.order_no, exception_type: 'INSUFFICIENT_STOCK', message: `可用库存不足，需要 ${need} 个 SN，当前可分配 ${candidates.length} 个`, status: 'OPEN', created_at: now() })
    addOutboundOperationLog(store, order.order_no, 'ALLOCATE_AUTO', 'wh_admin', 'FAILED', '库存不足')
    saveStore(store)
    return mockOutboundDetail(store, id)
  }
  allocateSerials(store, order, candidates.map((row: Row) => row.sn_code), 'AUTO')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockAutoAllocateV3(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  const lines = (store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === id)
  let allocated = 0
  let shortage = 0
  lines.forEach((line: Row) => {
    const need = Math.max(Number(line.planned_qty || line.order_qty || 0) - Number(line.allocated_qty || 0), 0)
    if (need <= 0) return
    if (Number(line.sn_required ?? line.sn_managed ?? 1) === 0) {
      let remain = need
      ;(store.inventory || [])
        .filter((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && mockAvailableInventoryRow(row))
        .forEach((inv: Row) => {
          if (remain <= 0) return
          const qty = Math.min(remain, Number(inv.available_qty || 0))
          inv.available_qty = Number(inv.available_qty || 0) - qty
          inv.allocated_qty = Number(inv.allocated_qty || 0) + qty
          store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv.id || 9001, warehouse_code: order.warehouse_code, location_code: inv.location_code || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv.batch_no || line.batch_no, sn_code: '', allocated_qty: qty, allocation_mode: 'AUTO_FIFO', allocation_status: 'ALLOCATED', created_at: now() })
          allocated += qty
          remain -= qty
        })
      shortage += remain
      return
    }
    const serials = (store.serialNumbers || [])
      .filter((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && row.status === 'ON_SHELF' && row.quality_status === 'QUALIFIED' && !row.locked_flag && row.location_code !== 'A02-01-07')
      .slice(0, need)
      .map((row: Row) => row.sn_code)
    if (serials.length < need) shortage += need - serials.length
    serials.forEach((sn: string) => {
      const snRow = store.serialNumbers.find((row: Row) => row.sn_code === sn)
      const inv = mockInventoryForLine(store, order, line, snRow)
      if (snRow) Object.assign(snRow, { status: 'ALLOCATED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no })
      if (inv) {
        inv.available_qty = Math.max(Number(inv.available_qty || 0) - 1, 0)
        inv.allocated_qty = Number(inv.allocated_qty || 0) + 1
      }
      store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}-${sn}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv?.id || 9001, warehouse_code: order.warehouse_code, location_code: snRow?.location_code || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv?.batch_no || 'BATCH-OUT-DEMO', sn_code: sn, allocated_qty: 1, allocation_mode: 'AUTO_FIFO', allocation_status: 'ALLOCATED', created_at: now() })
      allocated += 1
    })
  })
  refreshMockOrderQty(store, id)
  order.status = shortage > 0 ? (allocated > 0 ? 'PARTIAL_ALLOCATED' : 'ALLOCATION_EXCEPTION') : 'ALLOCATED'
  if (shortage > 0) {
    store.outboundExceptions.unshift({ id: Date.now(), exception_no: `EXC${Date.now()}`, outbound_order_no: order.order_no, exception_type: 'INSUFFICIENT_STOCK', message: `可用库存不足，缺口 ${shortage}`, status: 'OPEN', created_at: now() })
    addOutboundOperationLog(store, order.order_no, 'ALLOCATE_AUTO', 'wh_admin', 'FAILED', `库存不足，缺口 ${shortage}`)
  } else {
    addOutboundOperationLog(store, order.order_no, 'ALLOCATE_AUTO', 'wh_admin', 'SUCCESS', `自动分配 ${allocated}`)
  }
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockManualAllocate(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const serials = cleanSerials(body.serialNumbers)
  serials.forEach((sn) => assertMockAllocatable(store, order, sn))
  allocateSerials(store, order, serials, 'MANUAL')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockManualAllocateV3(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const line = (store.outboundOrderLines || []).find((row: Row) => Number(row.order_id) === id && Number(row.id) === Number(body.lineId)) ||
    (store.outboundOrderLines || []).find((row: Row) => Number(row.order_id) === id)
  if (!line) throw new Error('发运订单行不存在')
  const serials = cleanSerials(body.serialNumbers)
  if (serials.length) {
    serials.forEach((sn) => {
      assertMockAllocatable(store, { ...order, product_code: line.product_code }, sn)
      const snRow = store.serialNumbers.find((row: Row) => row.sn_code === sn)
      const inv = mockInventoryForLine(store, order, line, snRow)
      if (snRow) Object.assign(snRow, { status: 'ALLOCATED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no })
      if (inv) {
        inv.available_qty = Math.max(Number(inv.available_qty || 0) - 1, 0)
        inv.allocated_qty = Number(inv.allocated_qty || 0) + 1
      }
      store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}-${sn}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv?.id || 9001, warehouse_code: order.warehouse_code, location_code: snRow?.location_code || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv?.batch_no || 'BATCH-OUT-DEMO', sn_code: sn, allocated_qty: 1, allocation_mode: 'MANUAL', allocation_status: 'ALLOCATED', created_at: now() })
    })
  } else {
    const qty = Number(body.quantity || 0)
    if (qty <= 0) throw new Error('请输入人工指定数量或选择 SN')
    const inv = (store.inventory || []).find((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && (!body.locationCode || row.location_code === body.locationCode) && mockAvailableInventoryRow(row) && Number(row.available_qty || 0) >= qty)
    if (!inv) throw new Error('指定库存的产品、货主、仓库或可用数量不满足当前发运订单行，不允许分配。')
    inv.available_qty = Number(inv.available_qty || 0) - qty
    inv.allocated_qty = Number(inv.allocated_qty || 0) + qty
    store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv.id || 9001, warehouse_code: order.warehouse_code, location_code: inv.location_code || body.locationCode || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv.batch_no || line.batch_no, sn_code: '', allocated_qty: qty, allocation_mode: 'MANUAL', allocation_status: 'ALLOCATED', created_at: now() })
  }
  refreshMockOrderQty(store, id)
  order.status = Number(order.allocated_qty) >= Number(order.planned_qty) ? 'ALLOCATED' : 'PARTIAL_ALLOCATED'
  addOutboundOperationLog(store, order.order_no, 'ALLOCATE_MANUAL', 'wh_admin', 'SUCCESS', '人工指定分配')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function assertMockAllocatable(store: any, order: Row, sn: string) {
  const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
  if (!row) throw new Error(`SN 不存在: ${sn}`)
  if (row.product_code !== order.product_code) throw new Error(`当前扫描 SN 对应产品与发运订单行产品不一致，不允许拣货。${sn}`)
  if (!mockSameOwner(store, order, row)) throw new Error(`当前扫描 SN 对应货主与发运订单货主不一致，不允许拣货。${sn}`)
  if (row.warehouse_code !== order.warehouse_code) throw new Error(`SN 不在当前仓库: ${sn}`)
  if (row.status !== 'ON_SHELF') throw new Error(`SN 不在库或状态不可分配: ${sn}`)
  if (row.quality_status !== 'QUALIFIED') throw new Error(`不合格 SN 不允许出库: ${sn}`)
  if (row.locked_flag) throw new Error(`SN 已被其他单据锁定: ${sn}`)
  if (row.location_code === 'A02-01-07') throw new Error(`冻结库存不可分配: ${sn}`)
}

function allocateSerials(store: any, order: Row, serials: string[], mode: string) {
  serials.forEach((sn) => {
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
    Object.assign(row, { status: 'ALLOCATED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no })
    store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}-${sn}`, outbound_order_id: order.id, outbound_order_no: order.order_no, inventory_id: 9001, warehouse_code: order.warehouse_code, location_code: row.location_code, product_code: order.product_code, product_name: order.product_name, batch_no: 'BATCH-OUT-DEMO', sn_code: sn, allocation_mode: mode, allocation_status: 'ALLOCATED', created_at: now() })
  })
  const inv = store.inventory.find((item: Row) => item.id === 9001)
  if (inv) {
    inv.available_qty = Math.max(Number(inv.available_qty || 0) - serials.length, 0)
    inv.allocated_qty = Number(inv.allocated_qty || 0) + serials.length
  }
  refreshMockOrderQty(store, order.id)
  order.status = Number(order.allocated_qty) >= Number(order.planned_qty) ? 'ALLOCATED' : 'PENDING_ALLOC'
  addOutboundOperationLog(store, order.order_no, mode === 'AUTO' ? 'ALLOCATE_AUTO' : 'ALLOCATE_MANUAL', 'wh_admin', 'SUCCESS', `分配 ${serials.length} 个 SN`)
}

function mockCancelAllocation(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  const allocations = store.inventoryAllocations.filter((row: Row) => row.outbound_order_id === id && row.allocation_status === 'ALLOCATED')
  allocations.forEach((allocation: Row) => {
    const sn = store.serialNumbers.find((row: Row) => row.sn_code === allocation.sn_code)
    if (sn) Object.assign(sn, { status: 'ON_SHELF', locked_flag: 0, locked_order_no: '', outbound_order_no: '' })
    const inv = (store.inventory || []).find((row: Row) => Number(row.id) === Number(allocation.inventory_id)) ||
      (store.inventory || []).find((row: Row) => row.warehouse_code === allocation.warehouse_code && row.product_code === allocation.product_code && (!allocation.batch_no || row.batch_no === allocation.batch_no))
    const qty = Number(allocation.allocated_qty || 1)
    if (inv) {
      inv.available_qty = Number(inv.available_qty || 0) + qty
      inv.allocated_qty = Math.max(Number(inv.allocated_qty || 0) - qty, 0)
    }
    allocation.allocation_status = 'CANCELED'
  })
  refreshMockOrderQty(store, id)
  order.status = 'PENDING_ALLOC'
  addOutboundOperationLog(store, order.order_no, 'CANCEL_ALLOCATION', 'wh_admin', 'SUCCESS', '取消分配')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockCancelAllocationsV3(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const ids = Array.isArray(body.allocationIds) ? body.allocationIds.map(Number) : []
  const failedItems: Row[] = []
  let successCount = 0
  ids.forEach((allocationId: number) => {
    try {
      const allocation = (store.inventoryAllocations || []).find((row: Row) => Number(row.id) === Number(allocationId) && Number(row.outbound_order_id) === Number(id))
      if (!allocation) throw new Error('分配记录不存在')
      if (allocation.allocation_status !== 'ALLOCATED') throw new Error('仅允许取消未拣货分配记录')
      const sn = store.serialNumbers.find((row: Row) => row.sn_code === allocation.sn_code)
      if (sn) Object.assign(sn, { status: 'ON_SHELF', locked_flag: 0, locked_order_no: '', outbound_order_no: '' })
      const inv = (store.inventory || []).find((row: Row) => Number(row.id) === Number(allocation.inventory_id)) ||
        (store.inventory || []).find((row: Row) => row.warehouse_code === allocation.warehouse_code && row.product_code === allocation.product_code && (!allocation.batch_no || row.batch_no === allocation.batch_no))
      const qty = Number(allocation.allocated_qty || 1)
      if (inv) {
        inv.available_qty = Number(inv.available_qty || 0) + qty
        inv.allocated_qty = Math.max(Number(inv.allocated_qty || 0) - qty, 0)
      }
      allocation.allocation_status = 'CANCELED'
      successCount += 1
    } catch (error: any) {
      failedItems.push({ id: allocationId, reason: error?.message || '取消失败' })
    }
  })
  refreshMockOrderQty(store, id)
  addOutboundOperationLog(store, order.order_no, 'CANCEL_ALLOCATION', body.operator || 'wh_admin', failedItems.length ? 'PARTIAL_SUCCESS' : 'SUCCESS', `批量取消分配，成功 ${successCount} 条，失败 ${failedItems.length} 条`)
  saveStore(store)
  return { successCount, failedItems }
}

function mockCancelPicksV3(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const ids = Array.isArray(body.pickIds) ? body.pickIds.map(Number) : []
  const failedItems: Row[] = []
  let successCount = 0
  ids.forEach((pickId: number) => {
    try {
      mockCancelPickV3(store, id, pickId, body)
      successCount += 1
    } catch (error: any) {
      failedItems.push({ id: pickId, reason: error?.message || '取消失败' })
    }
  })
  addOutboundOperationLog(store, order.order_no, 'CANCEL_PICK_BATCH', body.operator || 'wh_admin', failedItems.length ? 'PARTIAL_SUCCESS' : 'SUCCESS', `批量取消拣货，成功 ${successCount} 条，失败 ${failedItems.length} 条`)
  saveStore(store)
  return { successCount, failedItems }
}

function mockCancelShipmentsV3(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const ids = Array.isArray(body.shipmentIds) ? body.shipmentIds.map(Number) : []
  const failedItems: Row[] = []
  let successCount = 0
  ids.forEach((shipmentId: number) => {
    try {
      mockCancelShipmentV3(store, id, shipmentId, body)
      successCount += 1
    } catch (error: any) {
      failedItems.push({ id: shipmentId, reason: error?.message || '取消失败' })
    }
  })
  addOutboundOperationLog(store, order.order_no, 'CANCEL_SHIPMENT_BATCH', body.operator || 'logistics', failedItems.length ? 'PARTIAL_SUCCESS' : 'SUCCESS', `批量取消发货，成功 ${successCount} 条，失败 ${failedItems.length} 条`)
  saveStore(store)
  return { successCount, failedItems }
}

function mockPickingList(store: any, id: number) {
  const detail = mockOutboundDetail(store, id)
  return {
    order: detail.order,
    items: (detail.allocations || []).filter((row: Row) => ['ALLOCATED', 'PICKED', 'REVIEWED'].includes(row.allocation_status))
  }
}

function mockGeneratePicking(store: any, id: number) {
  const order = mockOutboundOrder(store, id)
  if (!store.pickingTasks.some((row: Row) => row.outbound_order_id === id)) {
    store.pickingTasks.unshift(taskRow(Date.now(), `PICK${Date.now()}`, order, Number(order.allocated_qty || 0), 0, 'PENDING'))
  }
  order.status = 'PICKING'
  addOutboundOperationLog(store, order.order_no, 'GENERATE_PICKING_TASK', 'wh_admin', 'SUCCESS', '生成拣货任务')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockOrderPick(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const line = (store.outboundOrderLines || []).find((row: Row) => Number(row.order_id) === id && Number(row.id) === Number(body.lineId)) ||
    (store.outboundOrderLines || []).find((row: Row) => Number(row.order_id) === id)
  if (!line) throw new Error('发运订单行不存在')
  const snRequired = Number(line.sn_required ?? line.sn_managed ?? 1) === 1
  const hasOrderAllocation = store.inventoryAllocations.some((row: Row) => Number(row.outbound_order_id) === Number(id) && mockActiveAllocation(row))
  if (snRequired) {
    const serials = cleanSerials(body.serialNumbers || body.scanCode || body.snCode)
    if (!serials.length) throw new Error('SN 管理产品必须扫描 SN')
    serials.forEach((sn) => {
      let allocation = store.inventoryAllocations.find((row: Row) => Number(row.outbound_order_id) === Number(id) && Number(row.outbound_detail_id || row.line_id || line.id) === Number(line.id) && row.sn_code === sn)
      if (!allocation && hasOrderAllocation) throw new Error(`当前扫描 SN 不属于此订单的分配结果，不允许拣货。${sn}`)
      if (!allocation) {
        assertMockAllocatable(store, { ...order, product_code: line.product_code }, sn)
        const snRow = store.serialNumbers.find((row: Row) => row.sn_code === sn)
        if (snRow) Object.assign(snRow, { status: 'ALLOCATED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no })
        const inv = mockInventoryForLine(store, order, line, snRow)
        if (inv) {
          inv.available_qty = Math.max(Number(inv.available_qty || 0) - 1, 0)
          inv.allocated_qty = Number(inv.allocated_qty || 0) + 1
        }
        store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}-${sn}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv?.id || 9001, warehouse_code: order.warehouse_code, location_code: snRow?.location_code || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv?.batch_no || 'BATCH-OUT-DEMO', sn_code: sn, allocated_qty: 1, allocation_mode: 'DIRECT_PICK', allocation_status: 'ALLOCATED', created_at: now() })
        allocation = store.inventoryAllocations.find((row: Row) => row.outbound_order_id === id && row.sn_code === sn)
      }
      if (!allocation || allocation.allocation_status !== 'ALLOCATED') throw new Error(`SN 已拣货或状态不允许: ${sn}`)
      allocation.allocation_status = 'PICKED'
      const snRow = store.serialNumbers.find((row: Row) => row.sn_code === sn)
      if (snRow) snRow.status = 'PICKED'
      const task = ensureMockTask(store, order, line)
      store.pickingRecords.unshift({ id: Date.now() + Math.random(), task_id: task.id, task_no: task.task_no, outbound_order_id: id, outbound_order_no: order.order_no, sn_code: sn, location_code: allocation.location_code || 'A01-01-01', picker: body.operator || 'wh_admin', result: 'SUCCESS', created_at: now() })
    })
  } else {
    const qty = Number(body.quantity || 0)
    if (qty <= 0) throw new Error('非 SN 产品请输入拣货数量')
    const remain = Number(line.planned_qty || line.order_qty || 0) - Number(line.picked_qty || 0)
    if (qty > remain) throw new Error('拣货数量不能超过订单剩余数量')
    const task = ensureMockTask(store, order, line)
    if (hasOrderAllocation) {
      let need = qty
      const allocations = store.inventoryAllocations.filter((row: Row) => Number(row.outbound_order_id) === Number(id) && Number(row.outbound_detail_id || row.line_id || line.id) === Number(line.id) && row.allocation_status === 'ALLOCATED')
      const allocQty = allocations.reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
      if (qty > allocQty) throw new Error('当前行已分配未拣货数量不足，不允许按分配结果拣货。')
      allocations.forEach((allocation: Row) => {
        if (need <= 0) return
        const allocationQty = Number(allocation.allocated_qty || 1)
        const pickQty = Math.min(allocationQty, need)
        need -= pickQty
        if (pickQty < allocationQty) {
          allocation.allocated_qty = allocationQty - pickQty
          store.inventoryAllocations.unshift({ ...allocation, id: Date.now() + Math.random(), allocation_no: `${allocation.allocation_no || 'ALLOC'}-PICK-${Date.now()}`, allocated_qty: pickQty, allocation_status: 'PICKED' })
        } else {
          allocation.allocation_status = 'PICKED'
        }
      })
    } else {
      const inv = (store.inventory || []).find((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === line.product_code && mockSameOwner(store, order, row) && (!body.locationCode || row.location_code === body.locationCode) && mockAvailableInventoryRow(row) && Number(row.available_qty || 0) >= qty)
      if (!inv) throw new Error('当前行产品在发货仓库没有足够可直接拣货库存。')
      inv.available_qty = Math.max(Number(inv.available_qty || 0) - qty, 0)
      inv.allocated_qty = Number(inv.allocated_qty || 0) + qty
      store.inventoryAllocations.unshift({ id: Date.now() + Math.random(), allocation_no: `ALLOC-${Date.now()}`, outbound_order_id: id, outbound_order_no: order.order_no, outbound_detail_id: line.id, inventory_id: inv.id || 9001, warehouse_code: order.warehouse_code, location_code: inv.location_code || body.locationCode || 'A01-01-01', product_code: line.product_code, product_name: line.product_name, batch_no: inv.batch_no || line.batch_no, sn_code: '', allocated_qty: qty, allocation_mode: 'DIRECT_PICK', allocation_status: 'PICKED', created_at: now() })
    }
    store.pickingRecords.unshift({ id: Date.now() + Math.random(), task_id: task.id, task_no: task.task_no, outbound_order_id: id, outbound_order_no: order.order_no, sn_code: `NONSN-${Date.now()}`, picked_qty: qty, location_code: body.locationCode || 'A01-01-01', picker: body.operator || 'wh_admin', result: 'SUCCESS', created_at: now() })
  }
  refreshMockTaskRows(store, id)
  refreshMockOrderQty(store, id)
  order.status = Number(order.picked_qty) >= Number(order.planned_qty) ? 'PICKED' : 'PARTIAL_PICKED'
  addOutboundOperationLog(store, order.order_no, 'PICK', body.operator || 'wh_admin', 'SUCCESS', '发运订单拣货')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function ensureMockTask(store: any, order: Row, line: Row) {
  let task = store.pickingTasks.find((row: Row) => Number(row.outbound_order_id) === Number(order.id) && row.product_code === line.product_code)
  if (!task) {
    task = taskRow(Date.now(), `PICK${Date.now()}`, { ...order, product_code: line.product_code, product_name: line.product_name }, Number(line.planned_qty || line.order_qty || 0), 0, 'PICKING')
    store.pickingTasks.unshift(task)
  }
  return task
}

function refreshMockTaskRows(store: any, orderId: number) {
  store.pickingTasks.filter((row: Row) => Number(row.outbound_order_id) === Number(orderId)).forEach((task: Row) => refreshMockTask(store, task.id))
}

function mockPickingScan(store: any, taskId: number, body: Row) {
  const task = store.pickingTasks.find((row: Row) => Number(row.id) === taskId)
  if (!task) throw new Error('拣货任务不存在')
  cleanSerials(body.serialNumbers).forEach((sn) => {
    const allocation = store.inventoryAllocations.find((row: Row) => row.outbound_order_id === task.outbound_order_id && row.sn_code === sn)
    if (!allocation) throw new Error(`该 SN 不属于当前出库单分配范围: ${sn}`)
    if (allocation.location_code !== task.location_code) throw new Error(`SN 所在库位与任务不一致: ${sn}`)
    if (allocation.allocation_status !== 'ALLOCATED') throw new Error(`SN 已拣货或状态不可拣货: ${sn}`)
    allocation.allocation_status = 'PICKED'
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
    if (row) row.status = 'PICKED'
    store.pickingRecords.unshift({ id: Date.now() + Math.random(), task_id: task.id, task_no: task.task_no, outbound_order_id: task.outbound_order_id, outbound_order_no: task.outbound_order_no, sn_code: sn, location_code: task.location_code, picker: body.operator || 'wh_admin', result: 'SUCCESS', created_at: now() })
  })
  refreshMockTask(store, task.id)
  refreshMockOrderQty(store, task.outbound_order_id)
  const order = mockOutboundOrder(store, task.outbound_order_id)
  order.status = Number(order.picked_qty) >= Number(order.planned_qty) ? 'PICKED' : 'PICKING'
  addOutboundOperationLog(store, order.order_no, 'PICK_SN', 'wh_admin', 'SUCCESS', '扫码拣货')
  saveStore(store)
  return mockOutboundDetail(store, task.outbound_order_id)
}

function mockPickingException(store: any, taskId: number, body: Row) {
  const task = store.pickingTasks.find((row: Row) => Number(row.id) === taskId)
  if (!task) throw new Error('拣货任务不存在')
  store.outboundExceptions.unshift({ id: Date.now(), exception_no: `EXC${Date.now()}`, outbound_order_no: task.outbound_order_no, task_no: task.task_no, sn_code: body.snCode, exception_type: body.exceptionType || 'PICKING_EXCEPTION', message: body.reason || '拣货异常登记', status: 'OPEN', created_at: now() })
  addOutboundOperationLog(store, task.outbound_order_no, 'PICKING_EXCEPTION', 'wh_admin', 'FAILED', body.reason || '拣货异常登记')
  saveStore(store)
  return mockOutboundDetail(store, task.outbound_order_id)
}

function mockReview(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  cleanSerials(body.serialNumbers).forEach((sn) => {
    const allocation = store.inventoryAllocations.find((row: Row) => row.outbound_order_id === id && row.sn_code === sn)
    if (!allocation) throw new Error(`该 SN 不属于当前出库单: ${sn}`)
    if (allocation.allocation_status !== 'PICKED') throw new Error(`SN 尚未拣货或已复核: ${sn}`)
    allocation.allocation_status = 'REVIEWED'
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
    if (row) row.status = 'REVIEWED'
    store.reviewRecords.unshift({ id: Date.now() + Math.random(), outbound_order_id: id, outbound_order_no: order.order_no, sn_code: sn, reviewer: body.operator || 'logistics', result: 'SUCCESS', created_at: now() })
  })
  refreshMockOrderQty(store, id)
  order.status = Number(order.review_qty) >= Number(order.planned_qty) ? 'REVIEWED' : 'REVIEWING'
  addOutboundOperationLog(store, order.order_no, 'REVIEW_SN', 'logistics', 'SUCCESS', '出库复核')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockShip(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const allocations = store.inventoryAllocations.filter((row: Row) => row.outbound_order_id === id && row.allocation_status === 'REVIEWED')
  if (!allocations.length) throw new Error('没有可发货的已复核 SN')
  allocations.forEach((allocation: Row) => {
    allocation.allocation_status = 'SHIPPED'
    const sn = store.serialNumbers.find((row: Row) => row.sn_code === allocation.sn_code)
    if (sn) Object.assign(sn, { status: 'SHIPPED', locked_flag: 0, locked_order_no: '', outbound_order_no: order.order_no })
  })
  const inv = store.inventory.find((row: Row) => row.id === 9001)
  if (inv) {
    inv.total_qty = Math.max(Number(inv.total_qty || 0) - allocations.length, 0)
    inv.allocated_qty = Math.max(Number(inv.allocated_qty || 0) - allocations.length, 0)
  }
  refreshMockOrderQty(store, id)
  order.status = 'SHIPPED'
  order.logistics_company = body.carrier || 'SF'
  order.tracking_no = body.trackingNo || `SF${Date.now()}`
  store.shipmentRecords.unshift(shipmentRow(`SHIP${Date.now()}`, order, allocations.length, order.logistics_company, order.tracking_no))
  const traceOk = mockTraceCallback(store, id, Boolean(body.forceTraceFail), false)
  const sapOk = mockSapCallback(store, id, Boolean(body.forceSapFail), false)
  order.status = traceOk && sapOk ? 'CALLBACK_SUCCESS' : 'CALLBACK_FAILED'
  const firstLine = store.outboundOrderLines.find((line: Row) => Number(line.order_id) === Number(id) && Number(line.line_no) === 1)
  if (firstLine) firstLine.status = order.status
  addOutboundOperationLog(store, order.order_no, 'SHIP_CONFIRM', 'logistics', 'SUCCESS', '发货确认并扣减库存')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockShipV3(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const lineId = Number(body.lineId || body.detailId || 0)
  const pickedAllocations = store.inventoryAllocations.filter((row: Row) => {
    const sameOrder = Number(row.outbound_order_id) === Number(id)
    const sameLine = !lineId || Number(row.outbound_detail_id || row.line_id || 0) === lineId
    return sameOrder && sameLine && ['PICKED', 'REVIEWED'].includes(row.allocation_status)
  })
  if (!pickedAllocations.length) throw new Error('没有可发运的已拣货库存')

  const pickedQty = pickedAllocations.reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
  let remainingQty = Number(body.shipQty || body.quantity || pickedQty)
  if (remainingQty <= 0) throw new Error('请输入本次发运数量')
  if (remainingQty > pickedQty) throw new Error('发运数量不能超过已拣货数量')

  const shippedAllocations: Row[] = []
  pickedAllocations.forEach((allocation: Row) => {
    if (remainingQty <= 0) return
    const allocationQty = Number(allocation.allocated_qty || 1)
    const shipQty = Math.min(allocationQty, remainingQty)
    remainingQty -= shipQty
    if (shipQty < allocationQty) {
      allocation.allocated_qty = allocationQty - shipQty
      const shippedAllocation = {
        ...allocation,
        id: Date.now() + Math.random(),
        allocation_no: `${allocation.allocation_no || 'ALLOC'}-SHIP-${Date.now()}`,
        allocated_qty: shipQty,
        allocation_status: 'SHIPPED'
      }
      store.inventoryAllocations.unshift(shippedAllocation)
      shippedAllocations.push(shippedAllocation)
    } else {
      allocation.allocation_status = 'SHIPPED'
      shippedAllocations.push(allocation)
    }
  })

  const shippedQty = shippedAllocations.reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
  shippedAllocations.forEach((allocation: Row) => {
    const inv = (store.inventory || []).find((row: Row) => Number(row.id) === Number(allocation.inventory_id)) ||
      (store.inventory || []).find((row: Row) => row.warehouse_code === order.warehouse_code && row.product_code === allocation.product_code && (!allocation.batch_no || row.batch_no === allocation.batch_no))
    const qty = Number(allocation.allocated_qty || 1)
    if (inv) {
      inv.total_qty = Math.max(Number(inv.total_qty || 0) - qty, 0)
      inv.allocated_qty = Math.max(Number(inv.allocated_qty || 0) - qty, 0)
    }
    if (allocation.sn_code) {
      const sn = store.serialNumbers.find((row: Row) => row.sn_code === allocation.sn_code)
      if (sn) Object.assign(sn, { status: 'SHIPPED', locked_flag: 0, locked_order_no: '', outbound_order_no: order.order_no, sold_flag: 1, market_flag: 1 })
    }
  })

  refreshMockOrderQty(store, id)
  refreshMockTaskRows(store, id)
  const fullShipped = Number(order.shipped_qty || 0) >= Number(order.planned_qty || 0)
  const shipmentStatus = fullShipped ? 'SHIPPED' : 'PARTIAL_SHIPPED'
  const carrier = body.carrierName || body.carrier || body.logisticsCompany || 'SF'
  const trackingNo = body.trackingNo || body.tracking_no || `SF${Date.now()}`
  order.status = shipmentStatus
  order.carrier_name = carrier
  order.logistics_company = carrier
  order.tracking_no = trackingNo
  order.updated_at = now()
  store.shipmentRecords.unshift({
    ...shipmentRow(`SHIP${Date.now()}`, order, shippedQty, carrier, trackingNo),
    shipment_status: shipmentStatus,
    sap_post_status: 'NOT_POSTED',
    remark: body.remark || '发运订单 Mock 发运'
  })
  const shipment = store.shipmentRecords[0]

  const traceOk = mockTraceCallback(store, id, Boolean(body.forceTraceFail), false)
  const sapOk = mockSapCallback(store, id, Boolean(body.forceSapFail), false)
  shipment.sap_post_status = sapOk ? 'SUCCESS' : 'FAILED'
  shipment.sap_material_doc_no = sapOk ? order.sap_material_doc_no : ''
  shipment.sap_post_result = sapOk ? 'SAP 出库扣减 Mock 成功' : 'SAP 出库扣减 Mock 失败'
  order.status = shipmentStatus
  order.sap_post_result = sapOk ? 'SAP 出库扣减 Mock 成功' : 'SAP 出库扣减 Mock 失败'
  if (!traceOk || !sapOk) {
    order.sap_post_status = sapOk ? order.sap_post_status : 'FAILED'
  }
  addOutboundOperationLog(store, order.order_no, 'SHIP_CONFIRM', body.operator || 'logistics', 'SUCCESS', `发运确认 ${shippedQty}`)
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockTraceCallback(store: any, id: number, forceFail: boolean, persist = true) {
  const order = mockOutboundOrder(store, id)
  if (forceFail) {
    addInterfaceLog(store, 'TRACE_OUTBOUND_SN', 'WMS', 'TRACE', order.order_no, '/api/mock/trace/outbound-sn', 'FAILED', '追溯系统 Mock 回传失败')
    order.trace_post_status = 'FAILED'
    if (persist) saveStore(store)
    return false
  }
  store.serialNumbers.filter((row: Row) => row.outbound_order_no === order.order_no).forEach((row: Row) => {
    row.sold_flag = 1
    row.market_flag = 1
  })
  addInterfaceLog(store, 'TRACE_OUTBOUND_SN', 'WMS', 'TRACE', order.order_no, '/api/mock/trace/outbound-sn', 'SUCCESS', '')
  order.trace_post_status = 'POSTED'
  if (order.sap_post_status === 'POSTED') order.status = 'CALLBACK_SUCCESS'
  if (persist) saveStore(store)
  return true
}

function mockSapCallback(store: any, id: number, forceFail: boolean, persist = true) {
  const order = mockOutboundOrder(store, id)
  if (forceFail) {
    addInterfaceLog(store, 'SAP_OUTBOUND_POSTING', 'WMS', 'SAP', order.order_no, '/api/mock/sap/material-documents', 'FAILED', 'SAP 出库扣减 Mock 失败')
    order.sap_post_status = 'FAILED'
    if (persist) saveStore(store)
    return false
  }
  addInterfaceLog(store, 'SAP_OUTBOUND_POSTING', 'WMS', 'SAP', order.order_no, '/api/mock/sap/material-documents', 'SUCCESS', '')
  order.sap_post_status = 'POSTED'
  order.sap_material_doc_no = `49${Date.now()}`
  if (order.trace_post_status === 'POSTED') order.status = 'CALLBACK_SUCCESS'
  if (persist) saveStore(store)
  return true
}

function mockCancelOrder(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  if (!['CREATED', 'PENDING_ALLOC'].includes(order.status)) throw new Error('只有创建状态发运订单允许取消')
  order.status = 'CANCELED'
  ;(store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === id).forEach((line: Row) => {
    line.status = 'CANCELED'
    line.line_status = 'CANCELED'
  })
  addOutboundOperationLog(store, order.order_no, 'CANCEL', body.operator || 'planner', 'SUCCESS', body.reason || '页面取消')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function mockCancelPickV3(store: any, id: number, pickId: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const record = (store.pickingRecords || []).find((row: Row) => Number(row.id) === Number(pickId) && Number(row.outbound_order_id) === Number(id))
  if (!record) throw new Error('拣货记录不存在')
  if (record.result === 'CANCELED') throw new Error('该拣货记录已取消')
  const task = (store.pickingTasks || []).find((row: Row) => Number(row.id) === Number(record.task_id))
  const qty = Math.max(Number(record.picked_qty || 1), 1)
  let remaining = qty
  const candidates = (store.inventoryAllocations || []).filter((allocation: Row) => {
    if (Number(allocation.outbound_order_id) !== Number(id)) return false
    if (!['PICKED', 'REVIEWED'].includes(allocation.allocation_status)) return false
    if (record.sn_code && !String(record.sn_code).startsWith('NONSN-')) return allocation.sn_code === record.sn_code
    return (!task || allocation.product_code === task.product_code) && (!record.location_code || allocation.location_code === record.location_code)
  })
  if (!candidates.length) throw new Error('当前拣货记录已发运或无可回退分配数据')
  candidates.forEach((allocation: Row) => {
    if (remaining <= 0) return
    const allocationQty = Number(allocation.allocated_qty || 1)
    const cancelQty = Math.min(allocationQty, remaining)
    remaining -= cancelQty
    if (cancelQty < allocationQty) {
      allocation.allocated_qty = allocationQty - cancelQty
      const rollback: Row = { ...allocation, id: Date.now() + Math.random(), allocation_no: `${allocation.allocation_no || 'ALLOC'}-CANCEL-PICK-${Date.now()}`, allocated_qty: cancelQty }
      rollback.allocation_status = allocation.allocation_mode === 'DIRECT_PICK' ? 'CANCELED' : 'ALLOCATED'
      store.inventoryAllocations.unshift(rollback)
      rollbackPickInventory(store, order, rollback, allocation.allocation_mode === 'DIRECT_PICK')
    } else {
      allocation.allocation_status = allocation.allocation_mode === 'DIRECT_PICK' ? 'CANCELED' : 'ALLOCATED'
      rollbackPickInventory(store, order, allocation, allocation.allocation_mode === 'DIRECT_PICK')
    }
  })
  if (remaining > 0) throw new Error('可取消拣货数量不足')
  record.result = 'CANCELED'
  record.error_message = body.reason || '取消拣货'
  refreshMockTaskRows(store, id)
  refreshMockOrderQty(store, id)
  addOutboundOperationLog(store, order.order_no, 'CANCEL_PICK', body.operator || 'wh_admin', 'SUCCESS', body.reason || '取消拣货')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function rollbackPickInventory(store: any, order: Row, allocation: Row, releaseDirectPick: boolean) {
  const qty = Number(allocation.allocated_qty || 1)
  if (releaseDirectPick) {
    const inv = (store.inventory || []).find((row: Row) => Number(row.id) === Number(allocation.inventory_id))
    if (inv) {
      inv.available_qty = Number(inv.available_qty || 0) + qty
      inv.allocated_qty = Math.max(Number(inv.allocated_qty || 0) - qty, 0)
    }
  }
  if (allocation.sn_code) {
    const sn = (store.serialNumbers || []).find((row: Row) => row.sn_code === allocation.sn_code)
    if (sn) {
      if (releaseDirectPick) Object.assign(sn, { status: 'ON_SHELF', locked_flag: 0, locked_order_no: '', outbound_order_no: '' })
      else Object.assign(sn, { status: 'ALLOCATED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no })
    }
  }
}

function mockCancelShipmentV3(store: any, id: number, shipmentId: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  const shipment = (store.shipmentRecords || []).find((row: Row) => Number(row.id) === Number(shipmentId) && Number(row.outbound_order_id) === Number(id))
  if (!shipment) throw new Error('发运批次不存在')
  if (shipment.shipment_status === 'CANCELED') throw new Error('该发运批次已取消')
  if (['SUCCESS', 'POSTED'].includes(shipment.sap_post_status)) throw new Error('当前发货批次已回传 SAP 成功，不允许直接取消发货，请走 SAP 冲销流程。')
  if (['CLOSED', 'CANCELED'].includes(order.status)) throw new Error('已关闭或已取消订单不允许取消发货')
  let remaining = Number(shipment.shipped_qty || shipment.ship_qty || 0)
  const shippedAllocations = (store.inventoryAllocations || [])
    .filter((row: Row) => Number(row.outbound_order_id) === Number(id) && row.allocation_status === 'SHIPPED')
  if (!shippedAllocations.length || remaining <= 0) throw new Error('没有可取消的发货分配数据')
  shippedAllocations.forEach((allocation: Row) => {
    if (remaining <= 0) return
    const allocationQty = Number(allocation.allocated_qty || 1)
    const cancelQty = Math.min(allocationQty, remaining)
    remaining -= cancelQty
    if (cancelQty < allocationQty) {
      allocation.allocated_qty = allocationQty - cancelQty
      const picked = { ...allocation, id: Date.now() + Math.random(), allocation_no: `${allocation.allocation_no || 'ALLOC'}-CANCEL-SHIP-${Date.now()}`, allocated_qty: cancelQty, allocation_status: 'PICKED' }
      store.inventoryAllocations.unshift(picked)
      rollbackShipmentInventory(store, order, picked)
    } else {
      allocation.allocation_status = 'PICKED'
      rollbackShipmentInventory(store, order, allocation)
    }
  })
  if (remaining > 0) throw new Error('可取消发货数量不足')
  shipment.shipment_status = 'CANCELED'
  shipment.status = 'CANCELED'
  shipment.cancel_reason = body.reason || '取消发货'
  refreshMockTaskRows(store, id)
  refreshMockOrderQty(store, id)
  addOutboundOperationLog(store, order.order_no, 'CANCEL_SHIPMENT', body.operator || 'logistics', 'SUCCESS', `${shipment.shipment_no} ${body.reason || '取消发货'}`)
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function rollbackShipmentInventory(store: any, order: Row, allocation: Row) {
  const qty = Number(allocation.allocated_qty || 1)
  const inv = (store.inventory || []).find((row: Row) => Number(row.id) === Number(allocation.inventory_id))
  if (inv) {
    inv.total_qty = Number(inv.total_qty || 0) + qty
    inv.allocated_qty = Number(inv.allocated_qty || 0) + qty
  }
  if (allocation.sn_code) {
    const sn = (store.serialNumbers || []).find((row: Row) => row.sn_code === allocation.sn_code)
    if (sn) Object.assign(sn, { status: 'PICKED', locked_flag: 1, locked_order_no: order.order_no, outbound_order_no: order.order_no, sold_flag: 0, market_flag: 0 })
  }
}

function mockCloseOrder(store: any, id: number, body: Row) {
  const order = mockOutboundOrder(store, id)
  refreshMockOrderQty(store, id)
  if (Number(order.shipped_qty || 0) <= 0) throw new Error('没有发运记录的订单不允许关闭')
  const lines = (store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === id)
  if (Number(order.shipped_qty || 0) < Number(order.planned_qty || 0)) {
    const blockingLines = lines.filter((line: Row) => {
      const planned = Number(line.planned_qty || line.order_qty || 0)
      const shipped = Number(line.shipped_qty || 0)
      if (shipped >= planned) return false
      return Number(line.allocated_qty || 0) > shipped || Number(line.picked_qty || 0) > shipped || ['PARTIAL_ALLOCATED', 'ALLOCATED', 'PARTIAL_PICKED', 'PICKED'].includes(line.line_status || line.status)
    })
    if (blockingLines.length) {
      throw new Error('存在已分配/已拣货的数据，不允许直接关单。请先释放分配或回退拣货，使未发运明细回到创建状态后再关单。')
    }
    const splitNo = `${order.order_no}-S01`
    if (!store.outboundOrders.some((row: Row) => row.order_no === splitNo)) {
      const splitOrder = {
        ...order,
        id: Date.now(),
        order_no: splitNo,
        shipment_order_no: splitNo,
        parent_order_no: order.order_no,
        split_flag: 1,
        planned_qty: 0,
        allocated_qty: 0,
        picked_qty: 0,
        shipped_qty: 0,
        status: 'CREATED',
        sap_post_status: 'NOT_POSTED',
        sap_post_result: '',
        logistics_company: '',
        carrier_name: '',
        tracking_no: '',
        created_at: now()
      }
      store.outboundOrders.unshift(splitOrder)
      lines.forEach((line: Row) => {
        const remain = Number(line.planned_qty || line.order_qty || 0) - Number(line.shipped_qty || 0)
        if (remain <= 0) return
        store.outboundOrderLines.unshift({
          ...line,
          id: Date.now() + Math.random(),
          order_id: splitOrder.id,
          order_no: splitNo,
          planned_qty: remain,
          order_qty: remain,
          allocated_qty: 0,
          picked_qty: 0,
          review_qty: 0,
          shipped_qty: 0,
          status: 'CREATED',
          line_status: 'CREATED'
        })
      })
      syncOutboundHeaderQty(store.outboundOrders, store.outboundOrderLines)
    }
  }
  order.status = 'CLOSED'
  lines.forEach((line: Row) => {
    line.status = 'CLOSED'
    line.line_status = 'CLOSED'
  })
  addOutboundOperationLog(store, order.order_no, 'CLOSE', body.operator || 'manager', 'SUCCESS', '关闭发运订单')
  saveStore(store)
  return mockOutboundDetail(store, id)
}

function refreshMockTask(store: any, taskId: number) {
  const task = store.pickingTasks.find((row: Row) => Number(row.id) === taskId)
  if (!task) return
  task.picked_qty = store.pickingRecords
    .filter((row: Row) => row.task_id === taskId && row.result !== 'CANCELED')
    .reduce((total: number, row: Row) => total + Number(row.picked_qty || 1), 0)
  task.status = Number(task.picked_qty) >= Number(task.plan_qty) ? 'PICKED' : 'PICKING'
}

function refreshMockOrderQty(store: any, orderId: number) {
  const order = mockOutboundOrder(store, orderId)
  const lines = (store.outboundOrderLines || []).filter((line: Row) => Number(line.order_id) === Number(orderId))
  lines.forEach((line: Row) => {
    const allocations = store.inventoryAllocations.filter((row: Row) => row.outbound_order_id === orderId && Number(row.outbound_detail_id || row.line_id || line.id) === Number(line.id))
    line.allocated_qty = allocations.filter((row: Row) => ['ALLOCATED', 'PICKED', 'REVIEWED', 'SHIPPED'].includes(row.allocation_status)).reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
    line.picked_qty = allocations.filter((row: Row) => ['PICKED', 'REVIEWED', 'SHIPPED'].includes(row.allocation_status)).reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
    line.review_qty = allocations.filter((row: Row) => ['REVIEWED', 'SHIPPED'].includes(row.allocation_status)).reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
    const shippedFromAllocations = allocations.filter((row: Row) => row.allocation_status === 'SHIPPED').reduce((total: number, row: Row) => total + Number(row.allocated_qty || 1), 0)
    line.shipped_qty = allocations.length ? shippedFromAllocations : Number(line.shipped_qty || 0)
    const planned = Number(line.planned_qty || line.order_qty || 0)
    line.status = line.shipped_qty >= planned ? 'SHIPPED'
      : line.shipped_qty > 0 ? 'PARTIAL_SHIPPED'
        : line.picked_qty >= planned ? 'PICKED'
          : line.picked_qty > 0 ? 'PARTIAL_PICKED'
            : line.allocated_qty >= planned ? 'ALLOCATED'
              : line.allocated_qty > 0 ? 'PARTIAL_ALLOCATED'
                : line.status || 'CREATED'
    line.line_status = line.status
  })
  order.planned_qty = lines.reduce((total: number, line: Row) => total + Number(line.planned_qty || line.order_qty || 0), 0)
  order.allocated_qty = lines.reduce((total: number, line: Row) => total + Number(line.allocated_qty || 0), 0)
  order.picked_qty = lines.reduce((total: number, line: Row) => total + Number(line.picked_qty || 0), 0)
  order.review_qty = lines.reduce((total: number, line: Row) => total + Number(line.review_qty || 0), 0)
  order.shipped_qty = lines.reduce((total: number, line: Row) => total + Number(line.shipped_qty || 0), 0)
}

function addOutboundOperationLog(store: any, businessDocNo: string, action: string, operator: string, result: string, message: string) {
  store.operationLogs.unshift({ id: Date.now() + Math.random(), module: 'OUTBOUND', business_doc_no: businessDocNo, action, operator, result, message, created_at: now() })
}

function pageProductionOrders(store: any, params: Row) {
  const filtered = store.inboundOrders
    .filter((row: Row) => row.inbound_type === 'PRODUCTION')
    .filter((row: Row) => {
      const checks = {
        orderNo: row.order_no,
        sourceOrderNo: row.source_order_no,
        mesWorkOrderNo: row.mes_work_order_no,
        warehouseCode: row.warehouse_code,
        status: row.status
      } as Row
      return Object.keys(params).every((key) => {
        if (['pageNum', 'pageSize'].includes(key) || params[key] === '' || params[key] == null) return true
        return String(checks[key] || '').includes(String(params[key]))
      })
    })
  const pageNum = Number(params.pageNum || 1)
  const pageSize = Number(params.pageSize || 10)
  const start = (pageNum - 1) * pageSize
  return { items: filtered.slice(start, start + pageSize), total: filtered.length, pageNum, pageSize } satisfies PageResult
}

function productionDetail(store: any, id: number) {
  const order = requireMockOrder(store, id)
  const viewOrder = inboundOrderRows(store).find((row: Row) => Number(row.id) === Number(id)) || order
  const serialNumbers = store.serialNumbers
    .filter((row: Row) => row.inbound_order_no === order.order_no || row.mes_work_order_no === order.mes_work_order_no)
    .sort((a: Row, b: Row) => String(a.sn_code).localeCompare(String(b.sn_code)))
  const receiptRecords = (store.inboundReceipts || [])
    .filter((receipt: Row) => Number(receipt.inbound_order_id) === Number(id))
    .flatMap((receipt: Row) => (store.inboundReceiptLines || [])
      .filter((line: Row) => Number(line.receipt_id) === Number(receipt.id))
      .map((line: Row) => ({
        ...receipt,
        ...line,
        receipt_id: receipt.id,
        receipt_line_id: line.id,
        sap_post_status: line.sap_post_status || receipt.sap_post_status,
        sap_material_doc_no: line.sap_material_doc_no || receipt.sap_material_doc_no,
        sap_post_result: line.sap_post_result || receipt.sap_post_result
      })))
  const receiptNos = (store.inboundReceipts || [])
    .filter((receipt: Row) => Number(receipt.inbound_order_id) === Number(id))
    .map((receipt: Row) => receipt.receipt_no)
  return {
    order: viewOrder,
    details: (store.inboundOrderLines || [])
      .filter((line: Row) => Number(line.order_id) === Number(id))
      .map((line: Row) => ({
        ...line,
        line_status: line.status || order.status,
        collected_sn_qty: inboundLineSnCount(store, line, order.order_no, COLLECTED_SN_STATUSES),
        pending_receive_qty: inboundLineSnCount(store, line, order.order_no, ['COLLECTED']),
        sap_plant: line.sap_plant || order.sap_plant || order.owner_code || '',
        sap_storage_location: line.sap_storage_location || ''
      })),
    serialNumbers,
    bindings: store.packageBindings.filter((row: Row) => row.inbound_order_no === order.order_no),
    receiptRecords,
    operationLogs: store.operationLogs.filter((row: Row) => row.business_doc_no === order.order_no),
    interfaceLogs: store.interfaceLogs.filter((row: Row) => row.business_doc_no === order.order_no || row.business_doc_no === order.source_order_no || row.business_doc_no === order.mes_work_order_no || receiptNos.includes(row.business_doc_no))
  }
}

function mockOrderSnCollectContext(store: any, orderId: number) {
  const order = requireMockOrder(store, orderId)
  const viewOrder = inboundOrderRows(store).find((row: Row) => Number(row.id) === Number(orderId)) || order
  const lines = (store.inboundOrderLines || [])
    .filter((line: Row) => Number(line.order_id) === Number(orderId))
    .sort((a: Row, b: Row) => Number(a.line_no) - Number(b.line_no))
    .map((line: Row) => {
      const pendingReceiveQty = inboundLineSnCount(store, line, order.order_no, ['COLLECTED'])
      const remainingQty = Math.max(Number(line.planned_qty || 0) - Number(line.received_qty || 0) - pendingReceiveQty, 0)
      return {
        lineId: Number(line.id),
        lineNo: Number(line.line_no),
        productId: line.product_id || productIdByCode(store, line.product_code),
        productCode: line.product_code,
        productName: line.product_name,
        snRequired: Number(line.sn_required ?? 0) === 1,
        unit: line.unit || 'PCS',
        sapPlant: line.sap_plant || order.sap_plant || order.owner_code || '',
        sapStorageLocation: line.sap_storage_location || '',
        planQty: Number(line.planned_qty || 0),
        receivedQty: Number(line.received_qty || 0),
        shelvedQty: Number(line.shelved_qty || 0),
        alreadyCollectedSnQty: inboundLineSnCount(store, line, order.order_no, COLLECTED_SN_STATUSES),
        pendingReceiveQty,
        remainingCollectQty: remainingQty,
        remainingQty,
        lineStatus: line.status || order.status,
        batchNo: line.batch_no
      }
    })
  return {
    inboundOrderId: order.id,
    inboundOrderNo: order.order_no,
    inboundType: order.inbound_type,
    sourceSystem: order.source_system,
    sourceDocNo: order.source_order_no,
    mesWorkOrderNo: order.mes_work_order_no,
    warehouseCode: order.warehouse_code,
    warehouseName: order.warehouse_name,
    status: order.status,
    lineCount: lines.length,
    plannedQty: viewOrder.planned_qty,
    receivedQty: viewOrder.received_qty,
    collectedQty: lines.reduce((acc: number, line: Row) => acc + Number(line.alreadyCollectedSnQty || 0), 0),
    pendingReceiveQty: lines.reduce((acc: number, line: Row) => acc + Number(line.pendingReceiveQty || 0), 0),
    lines
  }
}

function mockSnCollectContext(store: any, orderId: number, lineId: number) {
  const order = requireMockOrder(store, orderId)
  const line = requireMockInboundLine(store, orderId, lineId)
  const pendingReceiveQty = inboundLineSnCount(store, line, order.order_no, ['COLLECTED'])
  const remainingQty = Math.max(Number(line.planned_qty || 0) - Number(line.received_qty || 0) - pendingReceiveQty, 0)
  return {
    inboundOrderId: order.id,
    inboundOrderNo: order.order_no,
    inboundType: order.inbound_type,
    sourceSystem: order.source_system,
    warehouseCode: order.warehouse_code,
    warehouseName: order.warehouse_name,
    lineId: line.id,
    lineNo: line.line_no,
    productId: line.product_id || productIdByCode(store, line.product_code),
    productCode: line.product_code,
    productName: line.product_name,
    snRequired: Number(line.sn_required ?? 0) === 1,
    unit: line.unit || 'PCS',
    sapPlant: line.sap_plant || order.sap_plant || order.owner_code || '',
    sapStorageLocation: line.sap_storage_location || '',
    planQty: Number(line.planned_qty || 0),
    receivedQty: Number(line.received_qty || 0),
    collectedQty: inboundLineSnCount(store, line, order.order_no, COLLECTED_SN_STATUSES),
    pendingReceiveQty,
    remainingCollectQty: remainingQty,
    remainingQty,
    lineStatus: line.status || order.status,
    batchNo: line.batch_no,
    boxRequired: false
  }
}

function mockCollectedSns(store: any, orderId: number, lineId: number) {
  const order = requireMockOrder(store, orderId)
  const line = requireMockInboundLine(store, orderId, lineId)
  const statuses = ['COLLECTED', 'RECEIVED', 'ON_SHELF', 'CANCELED_COLLECT']
  return (store.serialNumbers || [])
    .filter((sn: Row) =>
      sn.inbound_order_no === order.order_no &&
      Number(sn.inbound_order_line_id) === Number(line.id) &&
      statuses.includes(String(sn.status || ''))
    )
    .map((sn: Row) => {
      const binding = (store.packageBindings || []).find((row: Row) => row.sn_code === sn.sn_code)
      const receiptSn = (store.inboundReceiptSns || []).find((row: Row) =>
        row.sn_code === sn.sn_code && Number(row.inbound_order_line_id) === Number(line.id)
      )
      const receipt = receiptSn
        ? (store.inboundReceipts || []).find((row: Row) => Number(row.id) === Number(receiptSn.receipt_id))
        : null
      const collectedAt = binding?.bind_time || sn.created_at || sn.updated_at || ''
      return {
        id: sn.id,
        snCode: sn.sn_code,
        productId: sn.product_id || line.product_id || productIdByCode(store, line.product_code),
        productCode: sn.product_code || line.product_code,
        productName: sn.product_name || line.product_name,
        lineId: line.id,
        lineNo: line.line_no,
        palletCode: sn.pallet_code || binding?.pallet_code || '',
        boxCode: sn.box_code || binding?.box_code || '',
        snStatus: sn.status,
        receiveStatus: sn.status === 'COLLECTED'
          ? 'PENDING_RECEIVE'
          : sn.status === 'CANCELED_COLLECT'
            ? 'CANCELED'
            : sn.status,
        collectedAt,
        receivedAt: receipt?.receipt_time || '',
        locationCode: sn.location_code || ''
      }
    })
    .sort((a: Row, b: Row) => String(b.collectedAt || '').localeCompare(String(a.collectedAt || '')))
}

function mockValidateSnCollection(store: any, orderId: number, lineId: number, body: Row) {
  const order = requireMockOrder(store, orderId)
  const line = requireMockInboundLine(store, orderId, lineId)
  if (Number(line.sn_required ?? 0) !== 1) {
    throw new Error('当前产品不启用 SN 管理，无需采集 SN，请直接收货。')
  }
  const serials = cleanSerials(body.serialNumbers)
  const pendingReceiveQty = inboundLineSnCount(store, line, order.order_no, ['COLLECTED'])
  const remainingQty = Math.max(Number(line.planned_qty || 0) - Number(line.received_qty || 0) - pendingReceiveQty, 0)
  const seen = new Set<string>()
  let accepted = 0
  const items = serials.map((sn) => {
    const item: Row = {
      snCode: sn,
      productCode: line.product_code,
      status: 'PASS',
      message: '校验通过，可按当前产品行采集'
    }
    if (!body.palletCode) {
      markFailed(item, '托盘码必填')
    } else if (body.productId && Number(body.productId) !== Number(line.product_id || productIdByCode(store, line.product_code))) {
      markFailed(item, '弹窗产品与当前入库明细行不一致')
    } else if (seen.has(sn)) {
      markFailed(item, '本次录入中存在重复 SN')
    } else if (accepted >= remainingQty) {
      markFailed(item, '本次采集数量超过该产品行剩余可采集数量')
    } else {
      seen.add(sn)
      validateMockSingleSn(store, order, line, item, sn)
    }
    if (item.status === 'PASS') accepted += 1
    return item
  })
  const invalidQty = items.filter((row: Row) => row.status !== 'PASS').length
  return {
    ...mockSnCollectContext(store, orderId, lineId),
    inputQty: serials.length,
    validQty: accepted,
    invalidQty,
    valid: invalidQty === 0 && accepted > 0 && accepted <= remainingQty,
    items,
    message: validationMessage(serials.length, accepted, invalidQty, remainingQty)
  }
}

function mockConfirmSnCollection(store: any, orderId: number, lineId: number, body: Row) {
  const order = requireMockOrder(store, orderId)
  const line = requireMockInboundLine(store, orderId, lineId)
  const validation = mockValidateSnCollection(store, orderId, lineId, body)
  if (!validation.valid) {
    const failed = validation.items.find((row: Row) => row.status !== 'PASS')
    throw new Error(failed?.message || validation.message || 'SN 校验未通过')
  }
  const serials = validation.items.filter((row: Row) => row.status === 'PASS').map((row: Row) => row.snCode)
  serials.forEach((sn: string) => {
    const existing = store.serialNumbers.find((row: Row) => row.sn_code === sn)
    const snRow = {
      id: existing?.id || Date.now() + Math.random(),
      sn_code: sn,
      product_code: line.product_code,
      product_name: line.product_name,
      product_id: line.product_id || productIdByCode(store, line.product_code),
      owner_code: order.owner_code || line.owner_code || '',
      owner_name: order.owner_name || '',
      mes_work_order_no: existing?.mes_work_order_no || order.mes_work_order_no || '',
      warehouse_code: order.warehouse_code,
      warehouse_name: order.warehouse_name,
      location_code: '',
      pallet_code: body.palletCode,
      box_code: body.boxCode || '',
      status: 'COLLECTED',
      quality_status: 'QUALIFIED',
      locked_flag: 0,
      locked_order_no: '',
      inbound_order_no: order.order_no,
      inbound_order_line_id: line.id,
      outbound_order_no: '',
      sold_flag: 0
    }
    if (existing) Object.assign(existing, snRow)
    else store.serialNumbers.unshift(snRow)

    const existingBinding = store.packageBindings.find((row: Row) => row.sn_code === sn)
    const binding = {
      id: existingBinding?.id || Date.now() + Math.random(),
      pallet_code: body.palletCode,
      box_code: body.boxCode || '',
      sn_code: sn,
      product_code: line.product_code,
      product_name: line.product_name,
      product_id: line.product_id || productIdByCode(store, line.product_code),
      owner_code: order.owner_code || line.owner_code || '',
      owner_name: order.owner_name || '',
      inbound_order_no: order.order_no,
      inbound_order_line_id: line.id,
      bind_order_no: order.order_no,
      bind_status: 'BOUND',
      bind_time: now()
    }
    if (existingBinding) Object.assign(existingBinding, binding)
    else store.packageBindings.unshift(binding)
  })
  refreshInboundHeaderStatus(store, orderId)
  addOperationLog(store, order.order_no, 'SN_COLLECT', body.operator || 'wh_admin', 'SUCCESS', `按产品行采集 SN ${serials.length} 个，进入待收货`)
  saveStore(store)
  return productionDetail(store, orderId)
}

function mockReceive(store: any, id: number, body: Row) {
  const order = requireMockOrder(store, id)
  if (!['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING', 'RECEIVED'].includes(order.status)) throw new Error('当前状态不允许收货')
  const location = store.locations.find((row: Row) => row.location_code === body.locationCode && row.warehouse_code === order.warehouse_code)
  if (!body.locationCode || !location) throw new Error('请选择当前入库仓库下的目标库位')
  if (Number(location.frozen_flag || 0) === 1) throw new Error('目标库位已冻结，不允许收货')

  const selections: Array<{ line: Row; serials: string[]; receiveQty?: number }> = []
  if (Array.isArray(body.lines) && body.lines.length) {
    body.lines.forEach((item: Row) => {
      const line = requireMockInboundLine(store, id, Number(item.lineId))
      const serials = cleanSerials(item.receiveSnList || item.serialNumbers)
      const snRequired = Number(line.sn_required ?? 1) === 1
      if (snRequired && serials.length) selections.push({ line, serials })
      if (!snRequired && Number(item.receiveQty || 0) > 0) selections.push({ line, serials: [], receiveQty: Number(item.receiveQty || 0) })
    })
  } else {
    const serials = cleanSerials(body.serialNumbers)
    serials.forEach((sn) => {
      const row = store.serialNumbers.find((item: Row) => item.sn_code === sn && item.inbound_order_no === order.order_no)
      if (!row) throw new Error(`SN 不属于当前入库单: ${sn}`)
      const line = requireMockInboundLine(store, id, Number(row.inbound_order_line_id))
      const existing = selections.find((item) => Number(item.line.id) === Number(line.id))
      if (existing) existing.serials.push(sn)
      else selections.push({ line, serials: [sn] })
    })
  }

  if (!selections.length) throw new Error('请至少选择一行可收货产品')

  const receiptNo = nextReceiptNo(store)
  const receipt = {
    id: nextId(store.inboundReceipts),
    receipt_no: receiptNo,
    inbound_order_id: order.id,
    inbound_order_no: order.order_no,
    receipt_time: now(),
    receipt_user: body.operator || 'wh_admin',
    status: 'RECEIVED',
    sap_post_status: 'NOT_POSTED',
    sap_material_doc_no: '',
    sap_post_result: '待 SAP 回传',
    created_at: now()
  }
  store.inboundReceipts.unshift(receipt)

  const seen = new Set<string>()
  let receivedQty = 0
  selections.forEach(({ line, serials, receiveQty: directReceiveQty }) => {
    const snRequired = Number(line.sn_required ?? 1) === 1
    if (!snRequired) {
      const qty = Number(directReceiveQty || 0)
      if (qty <= 0) throw new Error(`行 ${line.line_no} 本次收货数量必须大于 0`)
      if (Number(line.received_qty || 0) + qty > Number(line.planned_qty || 0)) throw new Error(`行 ${line.line_no} 收货数量超过计划数量`)
      line.received_qty = Number(line.received_qty || 0) + qty
      refreshInboundLineStatus(line)
      receivedQty += qty
      store.inboundReceiptLines.unshift({
        id: nextId(store.inboundReceiptLines),
        receipt_id: receipt.id,
        inbound_order_line_id: line.id,
        line_no: line.line_no,
        product_id: line.product_id,
        product_code: line.product_code,
        receive_qty: qty,
        sap_post_qty: 0,
        sap_post_status: 'NOT_POSTED',
        sap_material_doc_no: '',
        sap_post_result: '待 SAP 回传'
      })
      return
    }
    const uniqueSerials = serials.filter((sn) => {
      if (seen.has(sn)) throw new Error(`本次收货存在重复 SN: ${sn}`)
      seen.add(sn)
      return true
    })
    const pendingQty = inboundLineSnCount(store, line, order.order_no, ['COLLECTED'])
    if (uniqueSerials.length > pendingQty) throw new Error(`行 ${line.line_no} 收货数量超过待收货数量`)
    if (Number(line.received_qty || 0) + uniqueSerials.length > Number(line.planned_qty || 0)) throw new Error(`行 ${line.line_no} 收货数量超过计划数量`)

    uniqueSerials.forEach((sn) => {
      const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
      if (!row) throw new Error(`SN 不存在: ${sn}`)
      if (row.inbound_order_no !== order.order_no) throw new Error(`SN 不属于当前入库单: ${sn}`)
      if (Number(row.inbound_order_line_id) !== Number(line.id)) throw new Error(`SN 不属于当前产品行: ${sn}`)
      if (row.status !== 'COLLECTED') throw new Error(`SN 不是待收货状态: ${sn}/${row.status}`)
      row.status = 'RECEIVED'
      row.warehouse_code = order.warehouse_code
      row.warehouse_name = order.warehouse_name
      row.location_code = location.location_code
    })

    line.received_qty = Number(line.received_qty || 0) + uniqueSerials.length
    refreshInboundLineStatus(line)
    receivedQty += uniqueSerials.length

    const receiptLine = {
      id: nextId(store.inboundReceiptLines),
      receipt_id: receipt.id,
      inbound_order_line_id: line.id,
      line_no: line.line_no,
      product_id: line.product_id,
      product_code: line.product_code,
      receive_qty: uniqueSerials.length,
      sap_post_qty: 0,
      sap_post_status: 'NOT_POSTED',
      sap_material_doc_no: '',
      sap_post_result: '待 SAP 回传'
    }
    store.inboundReceiptLines.unshift(receiptLine)
    uniqueSerials.forEach((sn) => {
      const snRow = store.serialNumbers.find((item: Row) => item.sn_code === sn) || {}
      store.inboundReceiptSns.unshift({
        id: Date.now() + Math.random(),
        receipt_id: receipt.id,
        receipt_line_id: receiptLine.id,
        sn_code: sn,
        product_id: line.product_id,
        inbound_order_line_id: line.id,
        pallet_code: snRow.pallet_code || '',
        box_code: snRow.box_code || ''
      })
    })
  })

  refreshInboundHeaderStatus(store, id)
  updateInboundSapSummary(store, id)
  addOperationLog(store, order.order_no, 'RECEIVE_CONFIRM', body.operator || 'wh_admin', 'SUCCESS', `确认收货批次 ${receiptNo}，产品 ${receivedQty} 件`)
  saveStore(store)
  return productionDetail(store, id)
}

function mockBind(store: any, id: number, body: Row) {
  const order = requireMockOrder(store, id)
  const serials = cleanSerials(body.serialNumbers)
  if (!body.palletCode || !body.boxCode || !serials.length) throw new Error('托盘码、箱码和 SN 必填')
  if (!['RECEIVING', 'RECEIVED', 'BOUND'].includes(order.status)) throw new Error('当前状态不允许绑定')
  serials.forEach((sn) => {
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn && item.inbound_order_no === order.order_no)
    if (!row) throw new Error(`SN 不属于当前入库单: ${sn}`)
    row.pallet_code = body.palletCode
    row.box_code = body.boxCode
    const existing = store.packageBindings.find((item: Row) => item.sn_code === sn)
    const binding = {
      id: existing?.id || Date.now() + Math.random(),
      pallet_code: body.palletCode,
      box_code: body.boxCode,
      sn_code: sn,
      product_code: order.product_code,
      inbound_order_no: order.order_no,
      bind_status: 'BOUND',
      bind_time: now()
    }
    if (existing) Object.assign(existing, binding)
    else store.packageBindings.unshift(binding)
  })
  order.status = 'BOUND'
  addOperationLog(store, order.order_no, 'BIND_PACKAGE', body.operator || 'admin', 'SUCCESS', `绑定 ${serials.length} 个 SN`)
  saveStore(store)
  return productionDetail(store, id)
}

function mockPutaway(store: any, id: number, body: Row) {
  const order = requireMockOrder(store, id)
  if (!['RECEIVED', 'BOUND', 'ON_SHELF'].includes(order.status)) throw new Error('当前状态不允许上架')
  const location = store.locations.find((row: Row) => row.location_code === body.locationCode && row.warehouse_code === order.warehouse_code)
  if (!location) throw new Error('目标库位不存在或不属于当前仓库')
  if (location.frozen_flag) throw new Error('目标库位已冻结，不允许上架')
  const serials: string[] = cleanSerials(body.serialNumbers).length
    ? cleanSerials(body.serialNumbers)
    : store.serialNumbers
      .filter((row: Row) => row.inbound_order_no === order.order_no && RECEIVED_SN_STATUSES.includes(row.status))
      .map((row: Row) => String(row.sn_code))
  if (!serials.length) throw new Error('没有可上架的 SN')
  serials.forEach((sn) => {
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn && item.inbound_order_no === order.order_no)
    if (!row) throw new Error(`SN 不属于当前入库单: ${sn}`)
    row.status = 'ON_SHELF'
    row.location_code = location.location_code
    row.warehouse_code = order.warehouse_code
  })
  order.shelved_qty = store.serialNumbers.filter((row: Row) => row.inbound_order_no === order.order_no && row.status === 'ON_SHELF').length
  order.status = 'ON_SHELF'
  const firstLine = store.inboundOrderLines.find((line: Row) => Number(line.order_id) === Number(order.id) && Number(line.line_no) === 1)
  if (firstLine) {
    firstLine.shelved_qty = order.shelved_qty
    firstLine.status = order.status
  }
  const inv = store.inventory.find((row: Row) => row.warehouse_code === order.warehouse_code && row.location_code === location.location_code && row.product_code === order.product_code && row.batch_no === `BATCH-${order.order_no}`)
  if (inv) {
    inv.total_qty += serials.length
    inv.available_qty += serials.length
  } else {
    store.inventory.unshift({
      id: Date.now(),
      warehouse_code: order.warehouse_code,
      warehouse_name: order.warehouse_name,
      area_code: location.area_code,
      location_code: location.location_code,
      product_code: order.product_code,
      product_name: order.product_name,
      batch_no: `BATCH-${order.order_no}`,
      inventory_status: 'QUALIFIED',
      total_qty: serials.length,
      available_qty: serials.length,
      allocated_qty: 0,
      frozen_qty: 0,
      safety_stock: 20,
      inbound_date: '2026-06-11',
      low_stock: 1,
      aged: 0,
      vmi_flag: 0
    })
  }
  addOperationLog(store, order.order_no, 'PUTAWAY', body.operator || 'admin', 'SUCCESS', `上架 ${serials.length} 个 SN 至 ${location.location_code}`)
  saveStore(store)
  return productionDetail(store, id)
}

function mockSapPost(store: any, id: number, body: Row) {
  const order = requireMockOrder(store, id)
  const receiptRows = (store.inboundReceipts || [])
    .filter((receipt: Row) => Number(receipt.inbound_order_id) === Number(id) && ['NOT_POSTED', 'FAILED'].includes(receipt.sap_post_status || 'NOT_POSTED'))
  if (!receiptRows.length) throw new Error('当前单据没有待回传 SAP 的收货批次')
  if (body.forceFail) {
    const message = 'SAP Mock 入库过账失败：移动类型或工单状态异常'
    receiptRows.forEach((receipt: Row) => {
      receipt.sap_post_status = 'FAILED'
      receipt.sap_post_result = message
      store.inboundReceiptLines
        .filter((line: Row) => Number(line.receipt_id) === Number(receipt.id))
        .forEach((line: Row) => {
          line.sap_post_status = 'FAILED'
          line.sap_post_result = message
        })
      addInterfaceLog(store, 'SAP_INBOUND_POSTING', 'WMS', 'SAP', receipt.receipt_no, '/api/mock/sap/material-documents', 'FAILED', message)
    })
    updateInboundSapSummary(store, id)
    addOperationLog(store, order.order_no, 'SAP_POSTING', body.operator || 'wh_admin', 'FAILED', message)
    saveStore(store)
    throw new Error(message)
  }
  receiptRows.forEach((receipt: Row, index: number) => {
    const materialDocNo = `5000${Date.now() % 1000000}${index}`
    receipt.sap_post_status = 'SUCCESS'
    receipt.sap_material_doc_no = materialDocNo
    receipt.sap_post_result = `SAP 入库过账成功，收货批次 ${receipt.receipt_no}`
    store.inboundReceiptLines
      .filter((line: Row) => Number(line.receipt_id) === Number(receipt.id))
      .forEach((line: Row) => {
        line.sap_post_status = 'SUCCESS'
        line.sap_material_doc_no = materialDocNo
        line.sap_post_qty = line.receive_qty
        line.sap_post_result = receipt.sap_post_result
      })
    addInterfaceLog(store, 'SAP_INBOUND_POSTING', 'WMS', 'SAP', receipt.receipt_no, '/api/mock/sap/material-documents', 'SUCCESS', '')
  })
  updateInboundSapSummary(store, id)
  addOperationLog(store, order.order_no, 'SAP_POSTING', body.operator || 'wh_admin', 'SUCCESS', `SAP 入库过账成功 ${receiptRows.length} 个收货批次`)
  saveStore(store)
  return productionDetail(store, id)
}

function requireMockInboundLine(store: any, orderId: number, lineId: number) {
  const line = store.inboundOrderLines.find((row: Row) => Number(row.order_id) === Number(orderId) && Number(row.id) === Number(lineId))
  if (!line) throw new Error('Inbound detail line not found')
  return line
}

function productIdByCode(store: any, productCode: string) {
  return store.products.find((row: Row) => row.product_code === productCode)?.id || 0
}

function inboundLineSnRows(store: any, line: Row, orderNo?: string) {
  return (store.serialNumbers || []).filter((sn: Row) =>
    Number(sn.inbound_order_line_id) === Number(line.id) && (!orderNo || sn.inbound_order_no === orderNo)
  )
}

function inboundLineSnCount(store: any, line: Row, orderNo: string, statuses: string[]) {
  return inboundLineSnRows(store, line, orderNo).filter((sn: Row) => statuses.includes(sn.status)).length
}

function refreshInboundLineStatus(line: Row) {
  const receivedQty = Number(line.received_qty || 0)
  const plannedQty = Number(line.planned_qty || 0)
  line.status = receivedQty <= 0 ? 'CREATED' : receivedQty >= plannedQty ? 'RECEIVED' : 'PARTIAL_RECEIVED'
}

function nextReceiptNo(store: any) {
  const serial = String((store.inboundReceipts || []).length + 1).padStart(4, '0')
  return `RCV${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${serial}`
}

function updateInboundSapSummary(store: any, orderId: number) {
  const order = requireMockOrder(store, orderId)
  const receipts = (store.inboundReceipts || []).filter((receipt: Row) => Number(receipt.inbound_order_id) === Number(orderId) && receipt.status !== 'CANCELED')
  if (!receipts.length) {
    order.sap_post_status = 'NOT_POSTED'
    order.sap_post_result = ''
    order.sap_material_doc_no = ''
    return
  }
  const latest = receipts[0]
  const failed = receipts.some((receipt: Row) => receipt.sap_post_status === 'FAILED')
  const pending = receipts.some((receipt: Row) => ['NOT_POSTED', 'FAILED'].includes(receipt.sap_post_status || 'NOT_POSTED'))
  order.sap_post_status = failed ? 'FAILED' : pending ? 'NOT_POSTED' : 'SUCCESS'
  order.sap_material_doc_no = latest.sap_material_doc_no || order.sap_material_doc_no || ''
  order.sap_post_result = latest.sap_post_result || ''
}

function mockCreateInboundOrder(store: any, body: Row) {
  const warehouse = store.warehouses.find((row: Row) => row.warehouse_code === body.warehouseCode) || store.warehouses[0]
  const inputLines = Array.isArray(body.lines) && body.lines.length ? body.lines : [{
    lineNo: 10,
    productId: body.productId,
    productCode: body.productCode,
    plannedQty: body.plannedQty || body.qty || 1,
    batchNo: body.batchNo
  }]
  const order = {
    id: nextId(store.inboundOrders),
    order_no: body.orderNo || `IN${Date.now()}`,
    source_order_no: body.sourceOrderNo || body.sapWorkOrderNo || `SRC${Date.now()}`,
    mes_work_order_no: body.mesWorkOrderNo || `MES-${Date.now()}`,
    inbound_type: body.inboundType || 'PRODUCTION',
    source_system: body.sourceSystem || 'SAP',
    warehouse_code: warehouse.warehouse_code,
    warehouse_name: warehouse.warehouse_name,
    owner_code: body.ownerCode || '3060',
    owner_name: body.ownerName || '杭州利沃得',
    ship_from_country: body.shipFromCountry || body.ship_from_country || '',
    shipFromCountry: body.shipFromCountry || body.ship_from_country || '',
    sap_plant: body.sapPlant || body.ownerCode || '3060',
    related_order_no: body.relatedOrderNo || '',
    plan_arrival_date: body.planArrivalDate || '',
    product_code: '',
    product_name: '',
    planned_qty: 0,
    received_qty: 0,
    shelved_qty: 0,
    status: 'CREATED',
    sap_material_doc_no: '',
    sap_post_status: 'NOT_POSTED',
    sap_post_result: '',
    remark: body.remark || '',
    created_by: body.operator || 'wh_admin',
    updated_by: body.operator || 'wh_admin',
    created_at: now(),
    updated_at: now()
  }
  store.inboundOrders.unshift(order)
  inputLines.forEach((item: Row, index: number) => {
    const product = store.products.find((row: Row) => Number(row.id) === Number(item.productId)) ||
      store.products.find((row: Row) => row.owner_code === order.owner_code && row.product_code === item.productCode) ||
      store.products.find((row: Row) => row.product_code === item.productCode) ||
      store.products[0]
    const line = inboundLine(order, Number(item.lineNo || (index + 1) * 10), product, Number(item.plannedQty || 1), 0, 0)
    if (item.batchNo) line.batch_no = item.batchNo
    line.sap_plant = item.sapPlant || order.sap_plant
    line.sap_storage_location = item.sapStorageLocation || ''
    line.sn_required = item.snRequired == null ? Number(product.sn_managed || 0) : (item.snRequired ? 1 : 0)
    line.status = 'CREATED'
    store.inboundOrderLines.push(line)
    if (index === 0) {
      order.product_code = product.product_code
      order.product_name = product.product_name
    }
  })
  refreshInboundHeaderStatus(store, Number(order.id))
  addOperationLog(store, order.order_no, 'CREATE_INBOUND_ORDER', order.created_by, 'SUCCESS', `新增预期到货通知单 ${inputLines.length} 行`)
  saveStore(store)
  return productionDetail(store, Number(order.id))
}

function mockCancelSnCollection(store: any, orderId: number, lineId: number, body: Row) {
  const order = requireMockOrder(store, orderId)
  const line = requireMockInboundLine(store, orderId, lineId)
  const serials = cleanSerials(body.serialNumbers)
  if (!serials.length) throw new Error('请选择需要取消采集的 SN')
  serials.forEach((sn) => {
    const row = store.serialNumbers.find((item: Row) => item.sn_code === sn)
    if (!row || row.inbound_order_no !== order.order_no || Number(row.inbound_order_line_id) !== Number(line.id)) throw new Error(`SN 不属于当前入库单行: ${sn}`)
    if (row.status !== 'COLLECTED') throw new Error(`仅允许取消未收货 SN: ${sn}/${row.status}`)
    store.packageBindings = (store.packageBindings || []).filter((binding: Row) => binding.sn_code !== sn)
    row.pallet_code = ''
    row.box_code = ''
    row.inbound_order_no = ''
    row.inbound_order_line_id = null
    row.warehouse_code = ''
    row.warehouse_name = ''
    row.status = 'ISSUED'
  })
  refreshInboundHeaderStatus(store, orderId)
  addOperationLog(store, order.order_no, 'CANCEL_SN_COLLECT', body.operator || 'wh_admin', 'SUCCESS', `取消未收货 SN 采集 ${serials.length} 个`)
  saveStore(store)
  return productionDetail(store, orderId)
}

function mockCancelInboundOrder(store: any, orderId: number, body: Row) {
  const order = requireMockOrder(store, orderId)
  if (order.status !== 'CREATED') throw new Error('只有创建状态的预期到货通知单允许取消')
  const hasCollectedSn = (store.serialNumbers || []).some((row: Row) =>
    row.inbound_order_no === order.order_no && ['COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(row.status)
  )
  if (hasCollectedSn) throw new Error('当前入库单已采集 SN，不允许直接取消，请先取消 SN 采集')
  const hasReceipt = (store.inboundReceipts || []).some((row: Row) => Number(row.inbound_order_id) === Number(orderId) && row.status !== 'CANCELED')
  if (hasReceipt) throw new Error('当前入库单已收货，不允许直接取消')
  order.status = 'CANCELED'
  ;(store.inboundOrderLines || []).filter((line: Row) => Number(line.order_id) === Number(orderId)).forEach((line: Row) => {
    line.status = 'CANCELED'
  })
  addOperationLog(store, order.order_no, 'CANCEL_INBOUND_ORDER', body.operator || 'planner', 'SUCCESS', body.reason || '业务取消入库单')
  saveStore(store)
  return productionDetail(store, orderId)
}

function mockCancelInboundReceipt(store: any, orderId: number, receiptId: number, body: Row) {
  const order = requireMockOrder(store, orderId)
  const receipt = (store.inboundReceipts || []).find((row: Row) => Number(row.id) === Number(receiptId) && Number(row.inbound_order_id) === Number(orderId))
  if (!receipt) throw new Error('收货批次不存在')
  if (receipt.status === 'CANCELED') throw new Error('该收货批次已取消')
  if (['SUCCESS', 'POSTED'].includes(receipt.sap_post_status)) throw new Error('当前收货批次已回传 SAP 成功，不允许直接取消收货，请走 SAP 冲销流程。')
  if (['CLOSED', 'CANCELED'].includes(order.status)) throw new Error('已关闭或已取消订单不允许取消收货')
  const receiptLines = (store.inboundReceiptLines || []).filter((line: Row) => Number(line.receipt_id) === Number(receiptId))
  const receiptSns = (store.inboundReceiptSns || []).filter((sn: Row) => Number(sn.receipt_id) === Number(receiptId))
  const snCodes = receiptSns.map((sn: Row) => sn.sn_code)
  const shelvedSn = (store.serialNumbers || []).find((sn: Row) => snCodes.includes(sn.sn_code) && sn.status === 'ON_SHELF')
  if (shelvedSn) throw new Error(`SN 已上架，不允许直接取消收货: ${shelvedSn.sn_code}`)
  receiptLines.forEach((receiptLine: Row) => {
    const line = (store.inboundOrderLines || []).find((item: Row) => Number(item.id) === Number(receiptLine.inbound_order_line_id))
    if (!line) return
    line.received_qty = Math.max(Number(line.received_qty || 0) - Number(receiptLine.receive_qty || 0), 0)
    refreshInboundLineStatus(line)
    receiptLine.status = 'CANCELED'
    receiptLine.sap_post_status = 'CANCELED'
    receiptLine.sap_post_result = body.reason || '取消收货'
  })
  receiptSns.forEach((receiptSn: Row) => {
    const sn = (store.serialNumbers || []).find((row: Row) => row.sn_code === receiptSn.sn_code)
    if (sn && sn.status === 'RECEIVED') {
      sn.status = 'COLLECTED'
      sn.location_code = ''
    }
    receiptSn.status = 'CANCELED'
  })
  receipt.status = 'CANCELED'
  receipt.sap_post_status = 'CANCELED'
  receipt.sap_post_result = body.reason || '取消收货'
  refreshInboundHeaderStatus(store, orderId)
  updateInboundSapSummary(store, orderId)
  addOperationLog(store, order.order_no, 'CANCEL_RECEIPT', body.operator || 'wh_admin', 'SUCCESS', `${receipt.receipt_no} ${body.reason || '取消收货'}`)
  saveStore(store)
  return productionDetail(store, orderId)
}

function mockRetrySap(store: any, orderIds: number[]) {
  let successCount = 0
  let failedCount = 0
  orderIds.forEach((id) => {
    try {
      mockSapPost(store, Number(id), { operator: 'wh_admin' })
      successCount += 1
    } catch {
      failedCount += 1
    }
  })
  return { successCount, failedCount }
}

function validateMockSingleSn(store: any, order: Row, line: Row, item: Row, sn: string) {
  const row = store.serialNumbers.find((serial: Row) => serial.sn_code === sn)
  const binding = store.packageBindings.find((bindingRow: Row) => bindingRow.sn_code === sn)
  if (row) {
    item.existingStatus = row.status
    if (row.product_code !== line.product_code) {
      markFailed(item, 'SN product does not match current inbound line')
      return
    }
    if (row.inbound_order_no === order.order_no) {
      markFailed(item, 'SN already collected by current ASN')
      return
    }
    if (row.inbound_order_no) {
      markFailed(item, 'SN already belongs to another ASN')
      return
    }
    if (row.inbound_order_line_id && Number(row.inbound_order_line_id) !== Number(line.id)) {
      markFailed(item, 'SN already belongs to another inbound line')
      return
    }
    if ((row.quality_status || 'QUALIFIED') !== 'QUALIFIED') {
      markFailed(item, 'SN quality status is not qualified')
      return
    }
    if (Number(row.locked_flag || 0) === 1) {
      markFailed(item, 'SN is locked')
      return
    }
    if (row.status !== 'ISSUED') {
      markFailed(item, `SN status is not collectable: ${row.status}`)
      return
    }
  } else {
    item.message = 'New SN will be created for current product'
  }
  if (binding) {
    markFailed(item, 'SN already has pallet/box binding')
  }
}

function markFailed(item: Row, message: string) {
  item.status = 'FAILED'
  item.message = message
}

function validationMessage(inputQty: number, validQty: number, invalidQty: number, remainingQty: number) {
  if (!inputQty) return 'Please input at least one SN'
  if (validQty > remainingQty) return 'Valid SN quantity exceeds remaining quantity'
  if (invalidQty) return `${invalidQty} SN failed validation`
  return `Validation passed, ${validQty} SN can be collected`
}

function refreshInboundHeaderStatus(store: any, orderId: number) {
  const order = requireMockOrder(store, orderId)
  const terminalStatus = ['CANCELED', 'CLOSED'].includes(order.status)
  const lines = store.inboundOrderLines.filter((line: Row) => Number(line.order_id) === Number(orderId))
  lines.forEach((line: Row) => refreshInboundLineStatus(line))
  order.planned_qty = sum(lines, 'planned_qty')
  order.received_qty = sum(lines, 'received_qty')
  order.shelved_qty = sum(lines, 'shelved_qty')
  const completed = lines.length > 0 && lines.every((line: Row) => Number(line.received_qty || 0) >= Number(line.planned_qty || 0))
  const allShelved = lines.length > 0 && sum(lines, 'shelved_qty') >= sum(lines, 'planned_qty')
  if (!terminalStatus) order.status = allShelved ? 'ON_SHELF' : Number(order.received_qty || 0) === 0 ? 'CREATED' : completed ? 'RECEIVED' : 'PARTIAL_RECEIVED'
  order.updated_at = now()
}

function requireMockOrder(store: any, id: number) {
  const order = store.inboundOrders.find((row: Row) => Number(row.id) === id)
  if (!order) throw new Error('生产入库单不存在')
  return order
}

function runMockAction(store: any, id: number, action: string, body: Row, handler: () => unknown) {
  try {
    return handler()
  } catch (error) {
    const order = store.inboundOrders.find((row: Row) => Number(row.id) === id)
    if (order) {
      addOperationLog(store, order.order_no, action, body.operator || 'admin', 'FAILED', error instanceof Error ? error.message : '操作失败')
      saveStore(store)
    }
    throw error
  }
}

function cleanSerials(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/\r?\n|,|;|\s+/).map((item) => item.trim()).filter(Boolean)
  return []
}

function addInterfaceLog(store: any, interfaceName: string, sourceSystem: string, targetSystem: string, businessDocNo: string, requestUrl: string, status: string, errorMessage: string) {
  store.interfaceLogs.unshift({
    id: Date.now() + Math.random(),
    interface_name: interfaceName,
    source_system: sourceSystem,
    target_system: targetSystem,
    business_doc_no: businessDocNo,
    request_url: requestUrl,
    status,
    retry_count: status === 'FAILED' ? 1 : 0,
    error_message: errorMessage,
    created_at: now()
  })
}

function addOperationLog(store: any, businessDocNo: string, action: string, operator: string, result: string, message: string) {
  store.operationLogs.unshift({
    id: Date.now() + Math.random(),
    module: 'INBOUND',
    business_doc_no: businessDocNo,
    action,
    operator,
    result,
    message,
    created_at: now()
  })
}

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}
