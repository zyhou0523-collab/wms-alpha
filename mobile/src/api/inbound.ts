import { PageResult, request } from './request'

export interface InboundLine {
  id: number
  line_id?: number
  inbound_order_line_id?: number
  line_no?: string | number
  product_id?: number | string
  product_code?: string
  product_name?: string
  product_desc?: string
  planned_qty?: number
  order_qty?: number
  received_qty?: number
  collected_sn_qty?: number
  pending_receive_qty?: number
  line_status?: string
  status?: string
  sap_plant?: string
  sap_storage_location?: string
  sn_required?: number | boolean
  snRequired?: boolean
  batch_no?: string
}

export interface InboundOrder {
  id: number
  order_no: string
  source_order_no?: string
  inbound_type?: string
  source_system?: string
  warehouse_code?: string
  warehouse_name?: string
  owner_code?: string
  owner_name?: string
  supplier_code?: string
  supplier_name?: string
  related_order_no?: string
  sap_plant?: string
  sap_storage_location?: string
  plan_arrival_date?: string
  arrival_date?: string
  status?: string
  sap_post_status?: string
  sap_post_result?: string
  sap_material_doc_no?: string
  line_count?: number
  planned_qty?: number
  received_qty?: number
  collected_qty?: number
  pending_receive_qty?: number
  pending_sap_receipt_count?: number
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  lines?: InboundLine[]
}

export interface InboundSerialNumber {
  id?: number
  sn_code?: string
  product_code?: string
  box_code?: string
  pallet_code?: string
  status?: string
  location_code?: string
  inbound_order_line_id?: number
}

export interface InboundReceiptRecord {
  id?: number
  receipt_id?: number
  receipt_no?: string
  receipt_time?: string
  receipt_user?: string
  line_no?: string | number
  product_code?: string
  receive_qty?: number
  status?: string
  sap_post_status?: string
  sap_material_doc_no?: string
  sap_post_result?: string
}

export interface InboundOperationLog {
  id?: number
  operator?: string
  action?: string
  created_at?: string
  message?: string
}

export interface InboundInterfaceLog {
  id?: number
  interface_name?: string
  source_system?: string
  target_system?: string
  status?: string
  created_at?: string
  error_message?: string
}

export interface InboundDetail {
  order?: InboundOrder
  details?: InboundLine[]
  lines?: InboundLine[]
  serialNumbers?: InboundSerialNumber[]
  receiptRecords?: InboundReceiptRecord[]
  operationLogs?: InboundOperationLog[]
  interfaceLogs?: InboundInterfaceLog[]
}

export interface SnCollectContext {
  inboundOrderId?: number
  inboundOrderNo?: string
  inboundType?: string
  sourceSystem?: string
  warehouseId?: number
  warehouseCode?: string
  warehouseName?: string
  lineId?: number
  lineNo?: string | number
  productId?: number
  productCode?: string
  productName?: string
  snRequired?: boolean
  unit?: string
  sapPlant?: string
  sapStorageLocation?: string
  planQty?: number
  receivedQty?: number
  collectedQty?: number
  pendingReceiveQty?: number
  remainingCollectQty?: number
  remainingQty?: number
  lineStatus?: string
  batchNo?: string
  boxRequired?: boolean
}

export interface CollectedSn {
  id?: number
  snCode?: string
  productId?: number
  productCode?: string
  productName?: string
  lineId?: number
  lineNo?: string | number
  palletCode?: string
  boxCode?: string
  snStatus?: string
  receiveStatus?: string
  collectedAt?: string
  receivedAt?: string
  locationCode?: string
}

export interface SnValidationResult {
  inputQty?: number
  validQty?: number
  invalidQty?: number
  valid?: boolean
  message?: string
  items?: Array<{
    snCode?: string
    productCode?: string
    existingStatus?: string
    status?: string
    message?: string
  }>
}

export interface SnCollectionPayload {
  orderId: number
  lineId: number
  productId: number
  palletCode: string
  boxCode?: string
  serialNumbers: string[]
  operator?: string
}

export interface ReceiveLinePayload {
  lineId: number
  productId?: number
  receiveQty?: number
  receiveSnList?: string[]
}

export interface ReceivePayload {
  lines: ReceiveLinePayload[]
  locationCode: string
  operator?: string
}

export interface InboundListParams {
  pageNum?: number
  pageSize?: number
  orderNo?: string
  supplier?: string
  inboundType?: string
  sapPlant?: string
  sapStorageLocation?: string
  status?: string
}

export function listInboundOrders(params: InboundListParams = {}) {
  return request<PageResult<InboundOrder>>({
    url: '/api/inbound-orders',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}

export function getInboundOrder(id: number) {
  return request<InboundDetail>({
    url: `/api/inbound-orders/${id}`,
    method: 'get'
  })
}

export function sapPostInboundOrder(id: number) {
  return request<InboundDetail>({
    url: `/api/inbound-orders/${id}/sap-post`,
    method: 'post',
    data: { operator: 'mobile' }
  })
}

export function retryInboundSap(orderIds: number[]) {
  return request<Record<string, unknown>>({
    url: '/api/inbound-orders/retry-sap',
    method: 'post',
    data: { orderIds }
  })
}

export function cancelInboundOrder(id: number, reason = '移动端取消预期到货通知单') {
  return request<InboundDetail>({
    url: `/api/inbound-orders/${id}/cancel`,
    method: 'post',
    data: { operator: 'mobile', reason }
  })
}

export function cancelInboundReceipt(orderId: number, receiptId: number, reason = '移动端取消收货批次') {
  return request<InboundDetail>({
    url: `/api/inbound-orders/${orderId}/receipts/${receiptId}/cancel`,
    method: 'post',
    data: { operator: 'mobile', reason }
  })
}

export function cancelSnCollection(orderId: number, lineId: number, serialNumbers: string[]) {
  return request<Record<string, unknown>>({
    url: `/api/inbound-orders/${orderId}/lines/${lineId}/cancel-sn-collection`,
    method: 'post',
    data: { operator: 'mobile', serialNumbers }
  })
}

export function receiveInboundOrder(orderId: number, data: ReceivePayload) {
  return request<InboundDetail & { receiptNo?: string }>({
    url: `/api/inbound-orders/${orderId}/receive`,
    method: 'post',
    data: {
      operator: 'mobile',
      ...data
    }
  })
}

export function getSnCollectContext(orderId: number, lineId: number) {
  return request<SnCollectContext>({
    url: `/api/inbound-orders/${orderId}/lines/${lineId}/sn-collect-context`,
    method: 'get'
  })
}

export function listCollectedSns(orderId: number, lineId: number) {
  return request<CollectedSn[]>({
    url: `/api/inbound-orders/${orderId}/lines/${lineId}/collected-sns`,
    method: 'get'
  })
}

export function validateSnCollection(orderId: number, lineId: number, data: SnCollectionPayload) {
  return request<SnValidationResult>({
    url: `/api/inbound-orders/${orderId}/lines/${lineId}/validate-sn-collection`,
    method: 'post',
    data
  })
}

export function confirmSnCollection(orderId: number, lineId: number, data: SnCollectionPayload) {
  return request<InboundDetail>({
    url: `/api/inbound-orders/${orderId}/lines/${lineId}/confirm-sn-collection`,
    method: 'post',
    data
  })
}
