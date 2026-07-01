import type { UserInfo } from '../api/auth'

export type MobileMenuKey = 'home' | 'inbound' | 'outbound' | 'inventory' | 'inventoryMove' | 'inventoryCount' | 'snQuery' | 'profile'

export interface MobileAction {
  title: string
  desc: string
  icon: string
  path: string
  menuKey: MobileMenuKey
}

const roleMenus: Record<string, MobileMenuKey[]> = {
  ADMIN: ['home', 'inbound', 'outbound', 'inventory', 'inventoryMove', 'inventoryCount', 'snQuery', 'profile'],
  WAREHOUSE_ADMIN: ['home', 'inbound', 'outbound', 'inventory', 'inventoryMove', 'inventoryCount', 'snQuery', 'profile'],
  LOGISTICS: ['home', 'outbound', 'inventory', 'inventoryMove', 'snQuery', 'profile'],
  OPERATOR: ['home', 'inbound', 'outbound', 'inventory', 'inventoryMove', 'inventoryCount', 'snQuery', 'profile']
}

export function roleCodeOf(user?: UserInfo | null) {
  return String(user?.role_code || 'OPERATOR').toUpperCase()
}

// Keep role checks centralized so later pages can hide buttons without duplicating role strings.
export function canAccessMenu(menuKey: MobileMenuKey, user?: UserInfo | null) {
  const roleCode = roleCodeOf(user)
  return (roleMenus[roleCode] || roleMenus.OPERATOR).includes(menuKey)
}

export function filterMobileActions<T extends MobileAction>(actions: T[], user?: UserInfo | null): T[] {
  return actions.filter((action) => canAccessMenu(action.menuKey, user))
}
