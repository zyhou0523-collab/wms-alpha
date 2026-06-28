import type { AxiosRequestConfig } from 'axios'

interface MockUser {
  username: string
  display_name: string
  role_code: string
  role_name: string
  warehouse_scope: string
  status: string
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
    warehouse_scope: 'WH-HZ-CENTRAL',
    status: 'ACTIVE'
  },
  logistics: {
    username: 'logistics',
    password: '123456',
    display_name: '物流人员',
    role_code: 'LOGISTICS',
    role_name: '物流人员',
    warehouse_scope: 'WH-HZ-CENTRAL',
    status: 'ACTIVE'
  }
}

function currentUser(): MockUser {
  const raw = localStorage.getItem('wms_mobile_user')
  if (raw) {
    try {
      return JSON.parse(raw) as MockUser
    } catch {
      // Fall through to default user.
    }
  }
  const { password: _password, ...user } = users.admin
  return user
}

function page<T>(items: T[], pageNum = 1, pageSize = 10) {
  return {
    items,
    total: items.length,
    pageNum,
    pageSize
  }
}

const inboundOrders = [
  { id: 1, order_no: 'IN202606110100', warehouse_name: '杭州集团总仓', status: 'PARTIAL_RECEIVED', planned_qty: 23, received_qty: 2, sap_post_status: 'FAILED', created_at: '2026-06-11 09:00:00' },
  { id: 2, order_no: 'IN-DEMO-SN-MIX-001', warehouse_name: '杭州集团总仓', status: 'CREATED', planned_qty: 12, received_qty: 0, sap_post_status: 'NOT_POSTED', created_at: '2026-06-11 10:00:00' }
]

const outboundOrders = [
  { id: 1, order_no: 'SO-OUT-202606110001', warehouse_name: '杭州集团总仓', customer_name: 'Tesla Energy China', status: 'PENDING_ALLOC', planned_qty: 8, allocated_qty: 0, picked_qty: 0, shipped_qty: 0, created_at: '2026-06-11 11:00:00' },
  { id: 2, order_no: 'STO-OUT-202606110001', warehouse_name: '杭州集团总仓', customer_name: '上海区域仓', status: 'PARTIAL_PICKED', planned_qty: 4, allocated_qty: 4, picked_qty: 2, shipped_qty: 0, created_at: '2026-06-11 12:00:00' }
]

const inventoryRows = [
  { id: 1, warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-01', product_code: 'GT3-10KD1R11004', product_name: '三相并网逆变器', total_qty: 42, available_qty: 30, allocated_qty: 7, inventory_status: 'QUALIFIED' },
  { id: 2, warehouse_code: 'WH-HZ-CENTRAL', warehouse_name: '杭州集团总仓', location_code: 'A01-01-13', product_code: 'HXEDE081R10002', product_name: '电表模块', total_qty: 36, available_qty: 36, allocated_qty: 0, inventory_status: 'QUALIFIED' }
]

export async function mockRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const method = String(config.method || 'get').toLowerCase()
  const url = String(config.url || '').replace(/^\/api/, '')

  await new Promise((resolve) => window.setTimeout(resolve, 120))

  if (url === '/auth/login' && method === 'post') {
    const data = config.data as { username?: string; password?: string }
    const userWithPassword = users[data?.username || '']
    if (!userWithPassword || userWithPassword.password !== data?.password) {
      throw new Error('账号或密码错误')
    }
    const { password: _password, ...user } = userWithPassword
    return {
      token: `mobile-mock-${user.username}-${Date.now()}`,
      user
    } as T
  }

  if (url === '/auth/me' && method === 'get') {
    return currentUser() as T
  }

  if (url === '/workbench/summary' && method === 'get') {
    return {
      pendingReceiveCount: 8,
      pendingShelveCount: 42,
      pendingPickCount: 3,
      pendingShipCount: 2
    } as T
  }

  if (url === '/inbound-orders' && method === 'get') {
    return page(inboundOrders, 1, Number((config.params as any)?.pageSize || 10)) as T
  }

  if (url === '/outbound-orders' && method === 'get') {
    return page(outboundOrders, 1, Number((config.params as any)?.pageSize || 10)) as T
  }

  if (url === '/inventory' && method === 'get') {
    return page(inventoryRows, 1, Number((config.params as any)?.pageSize || 10)) as T
  }

  if (url === '/serial-numbers' && method === 'get') {
    return page([
      { id: 1, sn_code: 'SN-OUT-0001', product_code: 'GT3-10KD1R11004', warehouse_name: '杭州集团总仓', location_code: 'A01-01-01', status: 'ON_SHELF' }
    ]) as T
  }

  throw new Error('移动端 Mock 暂未覆盖该接口')
}
