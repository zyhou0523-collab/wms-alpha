import type { ReportKey } from '../../api/report'

export type ReportFilterType = 'input' | 'select' | 'date' | 'dateRange'
export type ReportColumnType = 'text' | 'number' | 'status' | 'boolean' | 'datetime'

export interface ReportFilter {
  prop: string
  label: string
  type?: ReportFilterType
  startProp?: string
  endProp?: string
  placeholder?: string
  options?: Array<{ label: string; value: string | number | boolean }>
}

export interface ReportColumn {
  prop: string
  label: string
  width?: number
  minWidth?: number
  fixed?: string
  type?: ReportColumnType
}

export interface ReportSummaryCard {
  label: string
  prop?: string
  calc?: (rows: Record<string, unknown>[]) => number | string
  suffix?: string
}

export interface ReportConfig {
  reportKey: ReportKey
  title: string
  description: string
  dateFieldLabel: string
  filters: ReportFilter[]
  columns: ReportColumn[]
  summaryCards?: ReportSummaryCard[]
}

const ownerOptions = [
  { label: '1000 / 海兴电力', value: '1000' },
  { label: '3060 / 杭州利沃得', value: '3060' }
]

const warehouseOptions = [
  { label: 'WH-HZ-CENTRAL / 杭州集团总仓', value: 'WH-HZ-CENTRAL' },
  { label: 'WH-SH-REGION / 上海区域销售仓', value: 'WH-SH-REGION' },
  { label: 'WH-GZ-3PL / 广州第三方仓', value: 'WH-GZ-3PL' },
  { label: 'WH-SZ-AFTERSALE / 深圳售后仓', value: 'WH-SZ-AFTERSALE' },
  { label: 'WH-CUST-TESLA-VMI / Tesla 客户 VMI 仓', value: 'WH-CUST-TESLA-VMI' },
  { label: 'WH-SUP-CATL-VMI / CATL 供应商 VMI 仓', value: 'WH-SUP-CATL-VMI' }
]

const inboundTypeOptions = [
  { label: '生产入库', value: 'PRODUCTION' },
  { label: '备货入库', value: 'STOCKING' },
  { label: '售后 RMA 入库', value: 'RMA' },
  { label: '调拨入库', value: 'TRANSFER' },
  { label: '供应商 VMI 入库', value: 'SUPPLIER_VMI' },
  { label: '其他入库', value: 'OTHER' }
]

const outboundTypeOptions = [
  { label: '销售出库', value: 'SALES' },
  { label: '调拨出库', value: 'TRANSFER' },
  { label: '售后出库', value: 'AFTERSALE' },
  { label: '返工出库', value: 'REWORK' },
  { label: '其他出库', value: 'OTHER' }
]

const sapPostOptions = [
  { label: '未回传', value: 'NOT_POSTED' },
  { label: '回传成功', value: 'POSTED' },
  { label: '回传成功', value: 'SUCCESS' },
  { label: '回传失败', value: 'FAILED' }
]

const stockStatusOptions = [
  { label: '合格', value: 'QUALIFIED' },
  { label: '待检', value: 'PENDING' },
  { label: '冻结', value: 'FROZEN' },
  { label: '不合格', value: 'UNQUALIFIED' }
]

const yesNoOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 }
]

const sum = (prop: string) => (rows: Record<string, unknown>[]) =>
  rows.reduce((total, row) => total + Number(row[prop] ?? 0), 0)

const commonProductFilters: ReportFilter[] = [
  { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
  { prop: 'warehouseCode', label: '仓库', type: 'select', options: warehouseOptions },
  { prop: 'productCode', label: '产品编码' },
  { prop: 'productName', label: '产品名称' },
  { prop: 'productFamily', label: '产品族' },
  { prop: 'productClass', label: '产品类' }
]

const productColumns: ReportColumn[] = [
  { prop: 'ownerCode', label: '货主', width: 110 },
  { prop: 'ownerName', label: '货主名称', width: 150 },
  { prop: 'warehouseCode', label: '仓库编码', width: 150 },
  { prop: 'warehouseName', label: '仓库名称', width: 170 },
  { prop: 'productCode', label: '产品编码', width: 170 },
  { prop: 'productName', label: '产品名称', width: 190 },
  { prop: 'productFamily', label: '产品族', width: 130 },
  { prop: 'productClass', label: '产品类', width: 140 },
  { prop: 'unit', label: '单位', width: 80 }
]

export const reportConfigs: Record<string, ReportConfig> = {
  inoutStock: {
    reportKey: 'inout-stock',
    title: '进出存报表',
    description: '按统计日期、货主、仓库、产品维度汇总期初、本期入库、本期出库、调整和期末库存。',
    dateFieldLabel: '统计日期',
    filters: [
      { prop: 'dateRange', label: '统计日期', type: 'dateRange', startProp: 'startDate', endProp: 'endDate' },
      ...commonProductFilters,
      { prop: 'sapPlant', label: 'SAP 工厂' },
      { prop: 'sapStorageLocation', label: 'SAP 库存地点' }
    ],
    summaryCards: [
      { label: '当前页期初库存', calc: sum('openingQty'), suffix: 'PCS' },
      { label: '当前页本期入库', calc: sum('inboundQty'), suffix: 'PCS' },
      { label: '当前页本期出库', calc: sum('outboundQty'), suffix: 'PCS' },
      { label: '当前页期末库存', calc: sum('closingQty'), suffix: 'PCS' }
    ],
    columns: [
      { prop: 'reportDate', label: '统计日期', width: 120, type: 'datetime' },
      ...productColumns.slice(0, 4),
      { prop: 'areaName', label: '库区', width: 120 },
      { prop: 'locationCode', label: '库位', width: 130 },
      { prop: 'sapPlant', label: 'SAP 工厂', width: 110 },
      { prop: 'sapStorageLocation', label: 'SAP 库存地点', width: 130 },
      ...productColumns.slice(4),
      { prop: 'productNameEn', label: '产品名称英文', width: 210 },
      { prop: 'productCategory', label: '产品类别', width: 120 },
      { prop: 'openingQty', label: '期初库存', width: 110, type: 'number' },
      { prop: 'inboundQty', label: '本期入库', width: 110, type: 'number' },
      { prop: 'outboundQty', label: '本期出库', width: 110, type: 'number' },
      { prop: 'adjustInQty', label: '调整入库', width: 110, type: 'number' },
      { prop: 'adjustOutQty', label: '调整出库', width: 110, type: 'number' },
      { prop: 'frozenQty', label: '冻结数量', width: 110, type: 'number' },
      { prop: 'allocatedQty', label: '已分配', width: 100, type: 'number' },
      { prop: 'closingQty', label: '期末库存', width: 110, type: 'number' },
      { prop: 'availableQty', label: '可用库存', width: 110, type: 'number' },
      { prop: 'stockStatus', label: '库存状态', width: 110, type: 'status' },
      { prop: 'lastInboundTime', label: '最后入库时间', width: 160, type: 'datetime' },
      { prop: 'lastOutboundTime', label: '最后出库时间', width: 160, type: 'datetime' }
    ]
  },
  inboundDaily: {
    reportKey: 'inbound-daily',
    title: '入库日报表',
    description: '统计每日收货批次、入库数量、SN 管理和 SAP 入库回传结果。',
    dateFieldLabel: '入库日期',
    filters: [
      { prop: 'receiptDateRange', label: '入库日期', type: 'dateRange', startProp: 'startDate', endProp: 'endDate' },
      { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
      { prop: 'warehouseCode', label: '仓库', type: 'select', options: warehouseOptions },
      { prop: 'inboundType', label: '入库类型', type: 'select', options: inboundTypeOptions },
      { prop: 'inboundOrderNo', label: '入库单号' },
      { prop: 'sourceDocNo', label: '来源单号' },
      { prop: 'productCode', label: '产品编码' },
      { prop: 'sapPlant', label: 'SAP 工厂' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', type: 'select', options: sapPostOptions },
      { prop: 'receiptUser', label: '收货人' }
    ],
    summaryCards: [
      { label: '当前页入库单数', calc: (rows) => new Set(rows.map((row) => row.inboundOrderNo)).size },
      { label: '当前页收货批次数', calc: (rows) => new Set(rows.map((row) => row.receiptNo)).size },
      { label: '当前页收货数量', calc: sum('receiptQty'), suffix: 'PCS' },
      { label: '当前页 SAP 失败', calc: (rows) => rows.filter((row) => row.sapPostStatus === 'FAILED').length }
    ],
    columns: [
      { prop: 'receiptDate', label: '入库日期', width: 120, type: 'datetime' },
      { prop: 'receiptNo', label: '收货批次号', width: 170 },
      { prop: 'inboundOrderNo', label: '入库单号', width: 170 },
      { prop: 'inboundType', label: '入库类型', width: 130, type: 'status' },
      { prop: 'sourceSystem', label: '来源系统', width: 110 },
      { prop: 'sourceDocNo', label: '来源单号', width: 160 },
      ...productColumns.slice(0, 4),
      { prop: 'sapPlant', label: 'SAP 工厂', width: 110 },
      { prop: 'sapStorageLocation', label: 'SAP 库存地点', width: 130 },
      { prop: 'lineNo', label: '行号', width: 80 },
      ...productColumns.slice(4, 6),
      { prop: 'productDescription', label: '产品描述', width: 220 },
      { prop: 'unit', label: '单位', width: 80 },
      { prop: 'planQty', label: '计划数量', width: 100, type: 'number' },
      { prop: 'receiptQty', label: '本次收货数量', width: 130, type: 'number' },
      { prop: 'receivedQty', label: '累计收货数量', width: 130, type: 'number' },
      { prop: 'shelvedQty', label: '已上架数量', width: 120, type: 'number' },
      { prop: 'snRequired', label: 'SN 管理', width: 100, type: 'boolean' },
      { prop: 'receiptStatus', label: '收货状态', width: 110, type: 'status' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', width: 130, type: 'status' },
      { prop: 'sapMaterialDocNo', label: 'SAP 凭证号', width: 150 },
      { prop: 'sapPostResult', label: 'SAP 回传说明', width: 220 },
      { prop: 'receiptUser', label: '收货人', width: 110 },
      { prop: 'receiptTime', label: '收货时间', width: 160, type: 'datetime' },
      { prop: 'createdAt', label: '创建时间', width: 160, type: 'datetime' }
    ]
  },
  outboundDaily: {
    reportKey: 'outbound-daily',
    title: '出库日报表',
    description: '统计每日发货批次、发运订单、拣货/发货数量、物流信息和 SAP 出库回传结果。',
    dateFieldLabel: '发货日期',
    filters: [
      { prop: 'shipmentDateRange', label: '发货日期', type: 'dateRange', startProp: 'startDate', endProp: 'endDate' },
      { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
      { prop: 'warehouseCode', label: '仓库', type: 'select', options: warehouseOptions },
      { prop: 'outboundType', label: '出库类型', type: 'select', options: outboundTypeOptions },
      { prop: 'outboundOrderNo', label: '发运订单号' },
      { prop: 'relatedOrderNo', label: '关联单号' },
      { prop: 'salesOrderNo', label: '销售单号' },
      { prop: 'productCode', label: '产品编码' },
      { prop: 'consigneeCode', label: '收货人' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', type: 'select', options: sapPostOptions },
      { prop: 'carrierName', label: '物流商' }
    ],
    summaryCards: [
      { label: '当前页发运订单数', calc: (rows) => new Set(rows.map((row) => row.outboundOrderNo)).size },
      { label: '当前页发货批次数', calc: (rows) => new Set(rows.map((row) => row.shipmentNo)).size },
      { label: '当前页发货数量', calc: sum('shipmentQty'), suffix: 'PCS' },
      { label: '当前页已拣数量', calc: sum('pickedQty'), suffix: 'PCS' }
    ],
    columns: [
      { prop: 'shipmentDate', label: '发货日期', width: 120, type: 'datetime' },
      { prop: 'shipmentNo', label: '发货批次号', width: 170 },
      { prop: 'outboundOrderNo', label: '发运订单号', width: 170 },
      { prop: 'outboundType', label: '订单类型', width: 120, type: 'status' },
      { prop: 'orderStatus', label: '订单状态', width: 120, type: 'status' },
      { prop: 'relatedOrderNo', label: '关联单号', width: 150 },
      { prop: 'salesOrderNo', label: '销售单号', width: 150 },
      { prop: 'reworkOrderNo', label: '返工单号', width: 150 },
      ...productColumns.slice(0, 4),
      { prop: 'consigneeCode', label: '收货人编码', width: 130 },
      { prop: 'consigneeName', label: '收货人名称', width: 160 },
      { prop: 'targetWarehouseName', label: '目标仓库', width: 160 },
      { prop: 'targetOwnerName', label: '目标货主', width: 150 },
      { prop: 'sapPlant', label: 'SAP 工厂', width: 110 },
      { prop: 'lineNo', label: '行号', width: 80 },
      { prop: 'productCode', label: '产品编码', width: 170 },
      { prop: 'productDescription', label: '产品描述', width: 220 },
      { prop: 'unit', label: '单位', width: 80 },
      { prop: 'orderQty', label: '订单数量', width: 100, type: 'number' },
      { prop: 'allocatedQty', label: '分配数量', width: 100, type: 'number' },
      { prop: 'pickedQty', label: '拣货数量', width: 100, type: 'number' },
      { prop: 'shipmentQty', label: '本次发货数量', width: 130, type: 'number' },
      { prop: 'shippedQty', label: '累计发货数量', width: 130, type: 'number' },
      { prop: 'carrierName', label: '物流商', width: 130 },
      { prop: 'trackingNo', label: '物流单号', width: 150 },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', width: 130, type: 'status' },
      { prop: 'sapMaterialDocNo', label: 'SAP 凭证号', width: 150 },
      { prop: 'sapPostResult', label: 'SAP 回传说明', width: 220 },
      { prop: 'shipmentUser', label: '发货人', width: 110 },
      { prop: 'shipmentTime', label: '发货时间', width: 160, type: 'datetime' },
      { prop: 'createdAt', label: '创建时间', width: 160, type: 'datetime' }
    ]
  },
  standardAging: {
    reportKey: 'standard-aging',
    title: '标准库龄报表',
    description: '按产品、仓库、货主、批次和 SN 展示库龄天数、标准阈值、超期状态和处理建议。',
    dateFieldLabel: '截止日期',
    filters: [
      { prop: 'asOfDate', label: '截止日期', type: 'date' },
      ...commonProductFilters,
      { prop: 'batteryFlag', label: '是否电池类', type: 'select', options: yesNoOptions },
      { prop: 'snRequired', label: '是否 SN 管理', type: 'select', options: yesNoOptions },
      { prop: 'stockStatus', label: '库存状态', type: 'select', options: stockStatusOptions }
    ],
    summaryCards: [
      { label: '当前页库存数量', calc: sum('stockQty'), suffix: 'PCS' },
      { label: '当前页可用数量', calc: sum('availableQty'), suffix: 'PCS' },
      { label: '当前页超期行数', calc: (rows) => rows.filter((row) => row.overdueFlag === 1 || row.overdueFlag === true).length },
      { label: '当前页电池类行数', calc: (rows) => rows.filter((row) => row.batteryFlag === 1 || row.batteryFlag === true).length }
    ],
    columns: [
      { prop: 'asOfDate', label: '截止日期', width: 120, type: 'datetime' },
      ...productColumns.slice(0, 4),
      { prop: 'areaName', label: '库区', width: 120 },
      { prop: 'locationCode', label: '库位', width: 130 },
      ...productColumns.slice(4),
      { prop: 'productNameEn', label: '产品名称英文', width: 210 },
      { prop: 'productCategory', label: '产品类别', width: 120 },
      { prop: 'batchNo', label: '批次号', width: 170 },
      { prop: 'snCode', label: 'SN', width: 170 },
      { prop: 'palletCode', label: '托盘码', width: 150 },
      { prop: 'boxCode', label: '箱码', width: 150 },
      { prop: 'inboundOrderNo', label: '入库单号', width: 170 },
      { prop: 'inboundDate', label: '入库日期', width: 120, type: 'datetime' },
      { prop: 'lastReceiptDate', label: '最近收货日期', width: 140, type: 'datetime' },
      { prop: 'lastShelvedDate', label: '最近上架日期', width: 140, type: 'datetime' },
      { prop: 'agingDays', label: '库龄天数', width: 110, type: 'number' },
      { prop: 'agingThresholdDays', label: '标准库龄阈值', width: 130, type: 'number' },
      { prop: 'overdueFlag', label: '是否超期', width: 100, type: 'boolean' },
      { prop: 'batteryFlag', label: '是否电池类', width: 110, type: 'boolean' },
      { prop: 'stockQty', label: '库存数量', width: 110, type: 'number' },
      { prop: 'availableQty', label: '可用数量', width: 110, type: 'number' },
      { prop: 'frozenQty', label: '冻结数量', width: 110, type: 'number' },
      { prop: 'stockStatus', label: '库存状态', width: 110, type: 'status' },
      { prop: 'handlingSuggestion', label: '处理建议', width: 180, type: 'status' }
    ]
  },
  segmentAging: {
    reportKey: 'segment-aging',
    title: '分段库龄报表',
    description: '按默认库龄区间统计库存数量，展示 0-30 天到 360 天以上的库存老化结构。',
    dateFieldLabel: '截止日期',
    filters: [
      { prop: 'asOfDate', label: '截止日期', type: 'date' },
      ...commonProductFilters,
      { prop: 'batteryFlag', label: '是否电池类', type: 'select', options: yesNoOptions },
      { prop: 'stockStatus', label: '库存状态', type: 'select', options: stockStatusOptions }
    ],
    summaryCards: [
      { label: '当前页总库存', calc: sum('totalStockQty'), suffix: 'PCS' },
      { label: '当前页 360 天以上', calc: sum('qty_over_360'), suffix: 'PCS' },
      { label: '当前页电池类行数', calc: (rows) => rows.filter((row) => row.batteryFlag === 1 || row.batteryFlag === true).length },
      { label: '当前页需关注行数', calc: (rows) => rows.filter((row) => String(row.handlingSuggestion || '').includes('关注')).length }
    ],
    columns: [
      ...productColumns,
      { prop: 'totalStockQty', label: '总库存数量', width: 120, type: 'number' },
      { prop: 'qty_0_30', label: '0-30天数量', width: 120, type: 'number' },
      { prop: 'qty_31_60', label: '31-60天数量', width: 130, type: 'number' },
      { prop: 'qty_61_90', label: '61-90天数量', width: 130, type: 'number' },
      { prop: 'qty_91_180', label: '91-180天数量', width: 140, type: 'number' },
      { prop: 'qty_181_270', label: '181-270天数量', width: 150, type: 'number' },
      { prop: 'qty_271_360', label: '271-360天数量', width: 150, type: 'number' },
      { prop: 'qty_over_360', label: '360天以上数量', width: 150, type: 'number' },
      { prop: 'ratioOver360', label: '360天以上占比', width: 140 },
      { prop: 'batteryFlag', label: '是否电池类', width: 110, type: 'boolean' },
      { prop: 'handlingSuggestion', label: '处理建议', width: 180, type: 'status' }
    ]
  },
  outboundSn: {
    reportKey: 'outbound-sn',
    title: '出库 SN 报表',
    description: '追踪每一个出库 SN 的订单、客户、仓库、物流、SAP 回传与追溯回传情况。',
    dateFieldLabel: '发货日期',
    filters: [
      { prop: 'shipmentDateRange', label: '发货日期', type: 'dateRange', startProp: 'startDate', endProp: 'endDate' },
      { prop: 'snCode', label: 'SN' },
      { prop: 'productCode', label: '产品编码' },
      { prop: 'productName', label: '产品名称' },
      { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
      { prop: 'warehouseCode', label: '仓库', type: 'select', options: warehouseOptions },
      { prop: 'outboundOrderNo', label: '发运订单号' },
      { prop: 'salesOrderNo', label: '销售单号' },
      { prop: 'consigneeCode', label: '收货人' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', type: 'select', options: sapPostOptions },
      { prop: 'trackingNo', label: '物流单号' }
    ],
    summaryCards: [
      { label: '当前页 SN 数量', calc: (rows) => rows.length },
      { label: '当前页 SAP 成功', calc: (rows) => rows.filter((row) => ['POSTED', 'SUCCESS'].includes(String(row.sapPostStatus))).length },
      { label: '当前页追溯成功', calc: (rows) => rows.filter((row) => ['POSTED', 'SUCCESS'].includes(String(row.tracePostStatus))).length },
      { label: '当前页回传失败', calc: (rows) => rows.filter((row) => row.sapPostStatus === 'FAILED' || row.tracePostStatus === 'FAILED').length }
    ],
    columns: [
      { prop: 'snCode', label: 'SN', width: 170 },
      { prop: 'productCode', label: '产品编码', width: 170 },
      { prop: 'productDescription', label: '产品描述', width: 220 },
      { prop: 'productNameEn', label: '产品名称英文', width: 210 },
      ...productColumns.slice(0, 4),
      { prop: 'locationCode', label: '库位', width: 130 },
      { prop: 'palletCode', label: '托盘码', width: 150 },
      { prop: 'boxCode', label: '箱码', width: 150 },
      { prop: 'outboundOrderNo', label: '发运订单号', width: 170 },
      { prop: 'outboundType', label: '订单类型', width: 120, type: 'status' },
      { prop: 'lineNo', label: '行号', width: 80 },
      { prop: 'salesOrderNo', label: '销售单号', width: 150 },
      { prop: 'relatedOrderNo', label: '关联单号', width: 150 },
      { prop: 'consigneeCode', label: '收货人编码', width: 130 },
      { prop: 'consigneeName', label: '收货人名称', width: 160 },
      { prop: 'shipmentNo', label: '发货批次号', width: 170 },
      { prop: 'shipmentTime', label: '发货时间', width: 160, type: 'datetime' },
      { prop: 'carrierName', label: '物流商', width: 130 },
      { prop: 'trackingNo', label: '物流单号', width: 150 },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', width: 130, type: 'status' },
      { prop: 'sapMaterialDocNo', label: 'SAP 凭证号', width: 150 },
      { prop: 'sapPostResult', label: 'SAP 回传说明', width: 220 },
      { prop: 'snStatus', label: 'SN 状态', width: 110, type: 'status' },
      { prop: 'tracePostStatus', label: '追溯回传状态', width: 140, type: 'status' },
      { prop: 'tracePostTime', label: '追溯回传时间', width: 160, type: 'datetime' }
    ]
  },
  inboundSn: {
    reportKey: 'inbound-sn',
    title: '入库 SN 报表',
    description: '追踪每一个入库 SN 的 MES 下发、采集、收货、上架和 SAP 回传全链路。',
    dateFieldLabel: '入库日期',
    filters: [
      { prop: 'inboundDateRange', label: '入库日期', type: 'dateRange', startProp: 'startDate', endProp: 'endDate' },
      { prop: 'snCode', label: 'SN' },
      { prop: 'productCode', label: '产品编码' },
      { prop: 'productName', label: '产品名称' },
      { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
      { prop: 'warehouseCode', label: '仓库', type: 'select', options: warehouseOptions },
      { prop: 'inboundOrderNo', label: '入库单号' },
      { prop: 'sourceDocNo', label: '来源单号' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', type: 'select', options: sapPostOptions },
      { prop: 'snStatus', label: 'SN 状态' },
      { prop: 'palletCode', label: '托盘码' },
      { prop: 'boxCode', label: '箱码' }
    ],
    summaryCards: [
      { label: '当前页 SN 数量', calc: (rows) => rows.length },
      { label: '当前页已收货', calc: (rows) => rows.filter((row) => ['RECEIVED', 'INBOUND', 'ON_SHELF'].includes(String(row.snStatus))).length },
      { label: '当前页已上架', calc: (rows) => rows.filter((row) => row.shelvedTime).length },
      { label: '当前页 SAP 失败', calc: (rows) => rows.filter((row) => row.sapPostStatus === 'FAILED').length }
    ],
    columns: [
      { prop: 'snCode', label: 'SN', width: 170 },
      { prop: 'productCode', label: '产品编码', width: 170 },
      { prop: 'productName', label: '产品名称', width: 190 },
      { prop: 'productNameEn', label: '产品名称英文', width: 210 },
      ...productColumns.slice(0, 4),
      { prop: 'areaName', label: '库区', width: 120 },
      { prop: 'locationCode', label: '库位', width: 130 },
      { prop: 'palletCode', label: '托盘码', width: 150 },
      { prop: 'boxCode', label: '箱码', width: 150 },
      { prop: 'inboundOrderNo', label: '入库单号', width: 170 },
      { prop: 'inboundType', label: '入库类型', width: 130, type: 'status' },
      { prop: 'sourceSystem', label: '来源系统', width: 110 },
      { prop: 'sourceDocNo', label: '来源单号', width: 160 },
      { prop: 'lineNo', label: '行号', width: 80 },
      { prop: 'mesWorkOrderNo', label: 'MES 工单号', width: 170 },
      { prop: 'sapWorkOrderNo', label: 'SAP 工单号', width: 170 },
      { prop: 'issuedTime', label: 'SN 下发时间', width: 160, type: 'datetime' },
      { prop: 'collectedTime', label: 'SN 采集时间', width: 160, type: 'datetime' },
      { prop: 'receiptNo', label: '收货批次号', width: 170 },
      { prop: 'receiptTime', label: '收货时间', width: 160, type: 'datetime' },
      { prop: 'shelvedTime', label: '上架时间', width: 160, type: 'datetime' },
      { prop: 'sapPostStatus', label: 'SAP 回传状态', width: 130, type: 'status' },
      { prop: 'sapMaterialDocNo', label: 'SAP 凭证号', width: 150 },
      { prop: 'sapPostResult', label: 'SAP 回传说明', width: 220 },
      { prop: 'snStatus', label: 'SN 状态', width: 110, type: 'status' },
      { prop: 'qualityStatus', label: '质量状态', width: 110, type: 'status' }
    ]
  }
}
