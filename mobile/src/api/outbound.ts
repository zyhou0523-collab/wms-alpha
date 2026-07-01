import { PageResult, request } from './request'

export interface OutboundOrder {
  id: number
  order_no: string
  shipment_order_no?: string
  order_type?: string
  outbound_type?: string
  source_order_no?: string
  related_order_no?: string
  sales_order_no?: string
  warehouse_code?: string
  warehouse_name?: string
  owner_code?: string
  owner_name?: string
  customer_code?: string
  customer_name?: string
  consignee_code?: string
  consignee_name?: string
  ship_from_country?: string
  shipFromCountry?: string
  expected_ship_time?: string
  required_delivery_time?: string
  carrier_name?: string
  tracking_no?: string
  status?: string
  line_count?: number
  planned_qty?: number
  allocated_qty?: number
  picked_qty?: number
  shipped_qty?: number
  sap_post_status?: string
  sap_post_result?: string
  sap_material_doc_no?: string
  created_at?: string
  lines?: OutboundLine[]
}

export interface OutboundLine {
  id?: number
  line_id?: number
  outbound_detail_id?: number
  line_no?: string | number
  product_id?: number | string
  product_code?: string
  product_name?: string
  product_description?: string
  order_qty?: number
  planned_qty?: number
  allocated_qty?: number
  picked_qty?: number
  shipped_qty?: number
  sn_required?: number | boolean
  snRequired?: boolean
  line_status?: string
  status?: string
  sap_plant?: string
  unit?: string
}

export interface OutboundRecord {
  id?: number
  allocation_no?: string
  task_no?: string
  shipment_no?: string
  line_id?: number
  outbound_detail_id?: number
  line_no?: string | number
  product_code?: string
  product_name?: string
  owner_code?: string
  location_code?: string
  pallet_code?: string
  box_code?: string
  sn_code?: string
  allocated_qty?: number
  picked_qty?: number
  shipped_qty?: number
  allocation_mode?: string
  allocation_status?: string
  pick_mode?: string
  result?: string
  picker?: string
  carrier?: string
  tracking_no?: string
  shipment_status?: string
  status?: string
  sap_post_status?: string
  sap_material_doc_no?: string
  ship_time?: string
  shipper?: string
  created_at?: string
}

export interface OutboundInventory {
  id?: number
  inventory_id?: number
  line_id?: number
  outbound_detail_id?: number
  line_no?: string | number
  product_code?: string
  product_name?: string
  owner_code?: string
  warehouse_code?: string
  warehouse_name?: string
  location_code?: string
  pallet_code?: string
  box_code?: string
  sn_code?: string
  available_qty?: number
  allocated_qty?: number
  inventory_status?: string
  quality_status?: string
  frozen_flag?: boolean | number
  locked_flag?: boolean | number
  locked_order_no?: string
  inbound_date?: string
}

export interface OutboundLog {
  id?: number
  interface_name?: string
  source_system?: string
  target_system?: string
  status?: string
  error_message?: string
  created_at?: string
  operator?: string
  action?: string
  result?: string
  message?: string
  business_doc_no?: string
}

export interface OutboundDetail {
  order?: OutboundOrder
  details?: OutboundLine[]
  lines?: OutboundLine[]
  allocations?: OutboundRecord[]
  pickingRecords?: OutboundRecord[]
  pickingTasks?: OutboundRecord[]
  shipments?: OutboundRecord[]
  operationLogs?: OutboundLog[]
  interfaceLogs?: OutboundLog[]
  exceptions?: OutboundLog[]
  availableInventory?: OutboundInventory[]
  recommendedInventory?: OutboundInventory[]
}

export interface ManualAllocatePayload {
  lineId: number
  serialNumbers?: string[]
  quantity?: number
  locationCode?: string
  operator?: string
}

export interface PickPayload {
  lineId: number
  pickMode?: 'ALLOCATED' | 'DIRECT' | string
  serialNumbers?: string[]
  quantity?: number
  locationCode?: string
  operator?: string
}

export interface ShipPayload {
  lineId?: number
  shipQty?: number
  carrierName?: string
  carrier?: string
  trackingNo?: string
  shipper?: string
  remark?: string
  forceSapFail?: boolean
  forceTraceFail?: boolean
  operator?: string
}

export interface OutboundListParams {
  pageNum?: number
  pageSize?: number
  orderNo?: string
  customer?: string
  shipFromCountry?: string
  productCode?: string
  status?: string
  sapPostStatus?: string
}

export function listOutboundOrders(params: OutboundListParams = {}) {
  return request<PageResult<OutboundOrder>>({
    url: '/api/outbound-orders',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}

export function getOutboundOrder(id: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}`,
    method: 'get'
  })
}

export function getOutboundAllocationView(id: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/allocations`,
    method: 'get'
  })
}

export function allocateOutboundAuto(id: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/allocate-auto`,
    method: 'post',
    data: { operator: 'mobile' }
  })
}

export function allocateOutboundManual(id: number, payload: ManualAllocatePayload) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/allocate-manual`,
    method: 'post',
    data: { operator: 'mobile', ...payload }
  })
}

export function releaseOutboundAllocation(id: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/release-allocation`,
    method: 'post',
    data: { operator: 'mobile', reason: '移动端取消分配' }
  })
}

export function cancelOutboundAllocations(id: number, allocationIds: number[]) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/allocations/cancel`,
    method: 'post',
    data: { allocationIds, operator: 'mobile', reason: '移动端取消分配' }
  })
}

export function pickOutboundOrder(id: number, payload: PickPayload) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/pick`,
    method: 'post',
    data: { operator: 'mobile', ...payload }
  })
}

export function pickScanOutboundOrder(id: number, payload: PickPayload) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/pick-scan`,
    method: 'post',
    data: { operator: 'mobile', ...payload }
  })
}

export function cancelOutboundPick(id: number, pickId: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/picks/${pickId}/cancel`,
    method: 'post',
    data: { operator: 'mobile', reason: '移动端取消拣货' }
  })
}

export function cancelOutboundPicks(id: number, pickIds: number[]) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/picks/cancel`,
    method: 'post',
    data: { pickIds, operator: 'mobile', reason: '移动端批量取消拣货' }
  })
}

export function shipOutboundOrder(id: number, payload: ShipPayload) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/ship`,
    method: 'post',
    data: { operator: 'mobile', shipper: 'mobile', ...payload }
  })
}

export function cancelOutboundShipment(id: number, shipmentId: number) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/shipments/${shipmentId}/cancel`,
    method: 'post',
    data: { operator: 'mobile', reason: '移动端取消发货' }
  })
}

export function cancelOutboundShipments(id: number, shipmentIds: number[]) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/shipments/cancel`,
    method: 'post',
    data: { shipmentIds, operator: 'mobile', reason: '移动端批量取消发货' }
  })
}

export function postOutboundSap(id: number, forceSapFail = false) {
  return request<OutboundDetail>({
    url: `/api/outbound-orders/${id}/post-sap`,
    method: 'post',
    data: { operator: 'mobile', forceSapFail }
  })
}

export function retryOutboundSap(id: number) {
  return request<OutboundDetail>({
    url: '/api/outbound-orders/retry-sap',
    method: 'post',
    data: { orderId: id, operator: 'mobile' }
  })
}
