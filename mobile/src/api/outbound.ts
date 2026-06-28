import { PageResult, request } from './request'

export interface OutboundOrder {
  id: number
  order_no: string
  warehouse_name?: string
  customer_name?: string
  status?: string
  planned_qty?: number
  allocated_qty?: number
  picked_qty?: number
  shipped_qty?: number
  created_at?: string
}

export function listOutboundOrders(params: Record<string, unknown> = {}) {
  return request<PageResult<OutboundOrder>>({
    url: '/api/outbound-orders',
    method: 'get',
    params: { pageNum: 1, pageSize: 10, ...params }
  })
}

export function getOutboundOrder(id: number) {
  return request<OutboundOrder>({
    url: `/api/outbound-orders/${id}`,
    method: 'get'
  })
}
