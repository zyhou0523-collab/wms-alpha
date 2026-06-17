import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layout/MainLayout.vue'
import Login from '../views/login/Login.vue'
import Dashboard from '../views/dashboard/Dashboard.vue'
import ProductPage from '../views/masterdata/ProductPage.vue'
import CustomerPage from '../views/masterdata/CustomerPage.vue'
import WarehousePage from '../views/warehouse/WarehousePage.vue'
import LocationPage from '../views/warehouse/LocationPage.vue'
import InventoryPage from '../views/inventory/InventoryPage.vue'
import SnPage from '../views/inventory/SnPage.vue'
import InboundOrderPage from '../views/inbound/InboundOrderPage.vue'
import InboundOrderDetail from '../views/inbound/InboundOrderDetail.vue'
import SnBindingPage from '../views/inbound/SnBindingPage.vue'
import OutboundOrderPage from '../views/outbound/OutboundOrderPage.vue'
import InterfaceLogPage from '../views/interfacecenter/InterfaceLogPage.vue'
import UserPage from '../views/system/UserPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/login', component: Login, meta: { title: '登录' } },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: Dashboard, meta: { title: '数据驾驶舱' } },
      { path: 'masterdata/products', component: ProductPage, meta: { title: '产品主数据' } },
      { path: 'masterdata/customers', component: CustomerPage, meta: { title: '客户主数据' } },
      { path: 'warehouse/warehouses', component: WarehousePage, meta: { title: '仓库管理' } },
      { path: 'warehouse/locations', component: LocationPage, meta: { title: '库位管理' } },
      { path: 'inventory/list', component: InventoryPage, meta: { title: '库存查询' } },
      { path: 'inventory/sn', component: SnPage, meta: { title: 'SN 查询' } },
      { path: 'inbound/arrival-notices', component: InboundOrderPage, meta: { title: '预期到货通知单' } },
      { path: 'inbound/arrival-notices/:id', component: InboundOrderDetail, meta: { title: '预期到货通知单详情' } },
      { path: 'inbound/sn-bindings', component: SnBindingPage, meta: { title: 'SN 绑定' } },
      { path: 'inbound/orders', redirect: '/inbound/arrival-notices' },
      { path: 'inbound/production', redirect: '/inbound/arrival-notices' },
      { path: 'outbound/shipping-orders', component: OutboundOrderPage, meta: { title: '发运订单', outboundMode: 'orders' } },
      { path: 'outbound/orders', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/sales', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/transfers', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/picking', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/review', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/shipping', redirect: '/outbound/shipping-orders' },
      { path: 'interface/logs', component: InterfaceLogPage, meta: { title: '接口日志' } },
      { path: 'system/users', component: UserPage, meta: { title: '系统用户' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.token) {
    return '/login'
  }
  if (to.path === '/login' && auth.token) {
    return '/dashboard'
  }
})

export default router
