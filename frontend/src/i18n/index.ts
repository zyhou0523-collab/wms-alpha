import { readonly, ref } from 'vue'
import zhCN from './lang/zh-CN'
import enUS from './lang/en-US'
import ptBR from './lang/pt-BR'
import esES from './lang/es-ES'

export type LocaleCode = 'zh-CN' | 'en-US' | 'pt-BR' | 'es-ES'
type MessageTree = Record<string, any>

const STORAGE_KEY = 'wms_locale'

export const supportedLocales: Array<{ label: string; value: LocaleCode }> = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
  { label: 'Português', value: 'pt-BR' },
  { label: 'Español', value: 'es-ES' }
]

const messages: Record<LocaleCode, MessageTree> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'pt-BR': ptBR,
  'es-ES': esES
}

const menuPathKeys: Record<string, string> = {
  '/dashboard': 'menu.dashboard',
  '/dashboard/workbench': 'menu.workbench',
  '/masterdata/products': 'menu.masterdata',
  '/masterdata/customers': 'menu.masterdata',
  '/warehouse/warehouses': 'menu.warehouse',
  '/warehouse/locations': 'menu.warehouse',
  '/inbound/arrival-notices': 'menu.arrivalNotices',
  '/inbound/sn-bindings': 'menu.snBindings',
  '/outbound/shipping-orders': 'menu.shippingOrders',
  '/outbound/code-print': 'menu.codePrint',
  '/inventory/list': 'menu.inventoryList',
  '/inventory/sn': 'menu.inventorySn',
  '/inventory/count': 'menu.inventoryCount',
  '/inventory/move': 'menu.inventoryMove',
  '/interface/logs': 'menu.interfaceCenter'
}

const menuTitleKeys: Record<string, string> = {
  数据驾驶舱: 'menu.dashboard',
  工作台: 'menu.workbench',
  基础数据: 'menu.masterdata',
  仓库设置: 'menu.warehouse',
  入库管理: 'menu.inbound',
  预期到货通知单: 'menu.arrivalNotices',
  'SN 绑定': 'menu.snBindings',
  出库管理: 'menu.outbound',
  发运订单: 'menu.shippingOrders',
  条码打印: 'menu.codePrint',
  库存管理: 'menu.inventory',
  库存查询: 'menu.inventoryList',
  'SN 查询': 'menu.inventorySn',
  库存盘点: 'menu.inventoryCount',
  库存移动: 'menu.inventoryMove',
  报表中心: 'menu.reports',
  接口中心: 'menu.interfaceCenter',
  系统管理: 'menu.system'
}

const currentLocale = ref<LocaleCode>(resolveInitialLocale())
setDocumentLang(currentLocale.value)

export function useI18n() {
  return {
    locale: readonly(currentLocale),
    supportedLocales,
    setLocale,
    t,
    te,
    menuTitle,
    routeTitle,
    statusLabel,
    sapStatusLabel,
    inventoryStatusLabel
  }
}

export function setLocale(locale: LocaleCode) {
  if (!messages[locale]) return
  currentLocale.value = locale
  setDocumentLang(locale)
  localStorage.setItem(STORAGE_KEY, locale)
}

export function t(key: string, params?: Record<string, string | number>) {
  const translated = lookup(messages[currentLocale.value], key)
    ?? lookup(messages['zh-CN'], key)
    ?? key
  if (!params) return String(translated)
  return Object.keys(params).reduce((result, paramKey) => {
    return result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(params[paramKey]))
  }, String(translated))
}

export function te(key: string) {
  return lookup(messages[currentLocale.value], key) != null || lookup(messages['zh-CN'], key) != null
}

export function menuTitle(title?: string, path?: string) {
  const key = (path && menuPathKeys[path]) || (title && menuTitleKeys[title])
  return key ? t(key) : title || ''
}

export function routeTitle(title?: string, path?: string) {
  if (path?.startsWith('/inbound/arrival-notices/')) return t('menu.arrivalNotices')
  const key = (path && menuPathKeys[path]) || (title && menuTitleKeys[title])
  return key ? t(key) : title || t('common.page')
}

export function statusLabel(value: unknown, fallback?: string) {
  return prefixedLabel('status', value, fallback)
}

export function sapStatusLabel(value: unknown, fallback?: string) {
  return prefixedLabel('sapStatus', value || 'NOT_POSTED', fallback)
}

export function inventoryStatusLabel(value: unknown, fallback?: string) {
  return prefixedLabel('inventoryStatus', value, fallback)
}

function prefixedLabel(prefix: string, value: unknown, fallback?: string) {
  const normalized = String(value ?? '').trim()
  if (!normalized) return fallback || '-'
  const key = `${prefix}.${normalized}`
  return te(key) ? t(key) : fallback || normalized
}

function lookup(tree: MessageTree, key: string) {
  return key.split('.').reduce<any>((node, part) => {
    if (node == null || typeof node !== 'object') return undefined
    return node[part]
  }, tree)
}

function resolveInitialLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY) as LocaleCode | null
  return stored && messages[stored] ? stored : 'zh-CN'
}

function setDocumentLang(locale: LocaleCode) {
  document.documentElement.lang = locale
}
