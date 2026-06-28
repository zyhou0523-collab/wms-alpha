import { PageResult, request } from './request'

export interface InboundOrder {
  id: number
  order_no: string
  warehouse_name?: string
  status?: string
  planned_qty?: number
  received_qty?: number
  sap_post_status?: string
  created_at?: string
}

export function listInboundOrders(params: Record<string, unknown> = {}) {
  return request<PageResult<InboundOrder>>({
    url: '/api/inbound-orders',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}

export function getInboundOrder(id: number) {
  return request<InboundOrder>({
    url: `/api/inbound-orders/${id}`,
    method: 'get'
  })
}
