import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { getStoredUser, getToken } from '../utils/auth'
import { canAccessMenu, MobileMenuKey } from '../utils/permission'

const Login = () => import('../views/login/index.vue')
const Home = () => import('../views/home/index.vue')
const Inbound = () => import('../views/inbound/index.vue')
const InboundDetail = () => import('../views/inbound/detail.vue')
const InboundSnCollect = () => import('../views/inbound/SnCollectPage.vue')
const InboundReceive = () => import('../views/inbound/ReceivePage.vue')
const Outbound = () => import('../views/outbound/index.vue')
const OutboundDetail = () => import('../views/outbound/detail.vue')
const OutboundAllocation = () => import('../views/outbound/AllocationPage.vue')
const OutboundPick = () => import('../views/outbound/PickPage.vue')
const OutboundShip = () => import('../views/outbound/ShipPage.vue')
const Inventory = () => import('../views/inventory/index.vue')
const InventoryCycleCount = () => import('../views/inventory/CycleCountPage.vue')
const InventoryMove = () => import('../views/inventory/MovePage.vue')
const Profile = () => import('../views/profile/index.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', component: Login, meta: { title: '登录', public: true } },
  { path: '/home', component: Home, meta: { title: '首页', menuKey: 'home' } },
  { path: '/inbound', component: Inbound, meta: { title: '入库', menuKey: 'inbound' } },
  { path: '/inbound/:id', component: InboundDetail, meta: { title: '入库单详情', menuKey: 'inbound' } },
  { path: '/inbound/:orderId/sn-collect/:lineId', component: InboundSnCollect, meta: { title: '入库 SN 采集', menuKey: 'inbound' } },
  { path: '/inbound/:orderId/receive', component: InboundReceive, meta: { title: '入库收货', menuKey: 'inbound' } },
  { path: '/inbound/:orderId/receive/:lineId', component: InboundReceive, meta: { title: '入库收货', menuKey: 'inbound' } },
  { path: '/outbound', component: Outbound, meta: { title: '出库', menuKey: 'outbound' } },
  { path: '/outbound/:id', component: OutboundDetail, meta: { title: '发运订单详情', menuKey: 'outbound' } },
  { path: '/outbound/:orderId/allocation', component: OutboundAllocation, meta: { title: '出库分配', menuKey: 'outbound' } },
  { path: '/outbound/:orderId/pick', component: OutboundPick, meta: { title: '出库拣货', menuKey: 'outbound' } },
  { path: '/outbound/:orderId/pick/:lineId', component: OutboundPick, meta: { title: '出库拣货', menuKey: 'outbound' } },
  { path: '/outbound/:orderId/ship', component: OutboundShip, meta: { title: '出库发货', menuKey: 'outbound' } },
  { path: '/outbound/:orderId/ship/:lineId', component: OutboundShip, meta: { title: '出库发货', menuKey: 'outbound' } },
  { path: '/inventory', component: Inventory, meta: { title: '库存', menuKey: 'inventory' } },
  { path: '/inventory/cycle-count', component: InventoryCycleCount, meta: { title: '库存盘点', menuKey: 'inventory' } },
  { path: '/inventory/move', component: InventoryMove, meta: { title: '库存移库', menuKey: 'inventory' } },
  { path: '/profile', component: Profile, meta: { title: '我的', menuKey: 'profile' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const token = getToken()
  if (!to.meta.public && !token) {
    return '/login'
  }
  if (to.path === '/login' && token) {
    return '/home'
  }
  const menuKey = to.meta.menuKey as MobileMenuKey | undefined
  if (menuKey && !canAccessMenu(menuKey, getStoredUser())) {
    return '/home'
  }
})

export default router
