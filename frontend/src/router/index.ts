import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layout/MainLayout.vue'
import Login from '../views/login/Login.vue'
import Dashboard from '../views/dashboard/index.vue'
import Workbench from '../views/workbench/index.vue'
import ProductPage from '../views/masterdata/ProductPage.vue'
import CustomerPage from '../views/masterdata/CustomerPage.vue'
import WarehousePage from '../views/warehouse/WarehousePage.vue'
import LocationPage from '../views/warehouse/LocationPage.vue'
import InventoryPage from '../views/inventory/InventoryPage.vue'
import SnPage from '../views/inventory/SnPage.vue'
import InventoryCountPage from '../views/inventory/InventoryCountPage.vue'
import InventoryMovePage from '../views/inventory/InventoryMovePage.vue'
import InboundOrderPage from '../views/inbound/InboundOrderPage.vue'
import InboundOrderDetail from '../views/inbound/InboundOrderDetail.vue'
import SnBindingPage from '../views/inbound/SnBindingPage.vue'
import OutboundOrderPage from '../views/outbound/OutboundOrderPage.vue'
import CodePrintPage from '../views/outbound/CodePrintPage.vue'
import InterfaceLogPage from '../views/interfacecenter/InterfaceLogPage.vue'
import SystemAdminPage from '../views/system/SystemAdminPage.vue'
import InoutStockReport from '../views/reports/InoutStockReport.vue'
import InboundDailyReport from '../views/reports/InboundDailyReport.vue'
import OutboundDailyReport from '../views/reports/OutboundDailyReport.vue'
import StandardAgingReport from '../views/reports/StandardAgingReport.vue'
import SegmentAgingReport from '../views/reports/SegmentAgingReport.vue'
import OutboundSnReport from '../views/reports/OutboundSnReport.vue'
import InboundSnReport from '../views/reports/InboundSnReport.vue'

const routes: RouteRecordRaw[] = [
  { path: '/login', component: Login, meta: { title: '登录' } },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: Dashboard, meta: { title: '数据驾驶舱' } },
      { path: 'dashboard/workbench', component: Workbench, meta: { title: '我的工作台' } },
      { path: 'masterdata/products', component: ProductPage, meta: { title: '产品主数据' } },
      { path: 'masterdata/customers', component: CustomerPage, meta: { title: '客户主数据' } },
      { path: 'warehouse/warehouses', component: WarehousePage, meta: { title: '仓库管理' } },
      { path: 'warehouse/locations', component: LocationPage, meta: { title: '库位管理' } },
      { path: 'inventory/list', component: InventoryPage, meta: { title: '库存查询' } },
      { path: 'inventory/sn', component: SnPage, meta: { title: 'SN 查询' } },
      { path: 'inventory/count', component: InventoryCountPage, meta: { title: '库存盘点' } },
      { path: 'inventory/move', component: InventoryMovePage, meta: { title: '库存移动' } },
      { path: 'inbound/arrival-notices', component: InboundOrderPage, meta: { title: '预期到货通知单' } },
      { path: 'inbound/arrival-notices/:id', component: InboundOrderDetail, meta: { title: '预期到货通知单详情' } },
      { path: 'inbound/sn-bindings', component: SnBindingPage, meta: { title: 'SN 绑定' } },
      { path: 'inbound/orders', redirect: '/inbound/arrival-notices' },
      { path: 'inbound/production', redirect: '/inbound/arrival-notices' },
      { path: 'outbound/shipping-orders', component: OutboundOrderPage, meta: { title: '发运订单', outboundMode: 'orders' } },
      { path: 'outbound/code-print', component: CodePrintPage, meta: { title: '条码打印' } },
      { path: 'outbound/orders', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/sales', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/transfers', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/picking', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/review', redirect: '/outbound/shipping-orders' },
      { path: 'outbound/shipping', redirect: '/outbound/shipping-orders' },
      { path: 'reports/inout-stock', component: InoutStockReport, meta: { title: '进出存报表' } },
      { path: 'reports/inbound-daily', component: InboundDailyReport, meta: { title: '入库日报表' } },
      { path: 'reports/outbound-daily', component: OutboundDailyReport, meta: { title: '出库日报表' } },
      { path: 'reports/standard-aging', component: StandardAgingReport, meta: { title: '标准库龄报表' } },
      { path: 'reports/segment-aging', component: SegmentAgingReport, meta: { title: '分段库龄报表' } },
      { path: 'reports/outbound-sn', component: OutboundSnReport, meta: { title: '出库 SN 报表' } },
      { path: 'reports/inbound-sn', component: InboundSnReport, meta: { title: '入库 SN 报表' } },
      { path: 'interface/logs', component: InterfaceLogPage, meta: { title: '接口日志' } },
      { path: 'system/user', redirect: '/system/users' },
      { path: 'system/users', component: SystemAdminPage, meta: { title: '用户管理', systemPage: 'users' } },
      { path: 'system/role', redirect: '/system/roles' },
      { path: 'system/roles', component: SystemAdminPage, meta: { title: '角色管理', systemPage: 'roles' } },
      { path: 'system/menu', redirect: '/system/menus' },
      { path: 'system/menus', component: SystemAdminPage, meta: { title: '菜单管理', systemPage: 'menus' } },
      { path: 'system/dept', redirect: '/system/depts' },
      { path: 'system/depts', component: SystemAdminPage, meta: { title: '部门管理', systemPage: 'depts' } },
      { path: 'system/post', redirect: '/system/posts' },
      { path: 'system/posts', component: SystemAdminPage, meta: { title: '岗位管理', systemPage: 'posts' } },
      { path: 'system/dict', component: SystemAdminPage, meta: { title: '字典管理', systemPage: 'dict' } },
      { path: 'system/config', component: SystemAdminPage, meta: { title: '参数设置', systemPage: 'config' } },
      { path: 'system/notice', component: SystemAdminPage, meta: { title: '通知公告', systemPage: 'notice' } },
      { path: 'system/operlog', component: SystemAdminPage, meta: { title: '操作日志', systemPage: 'operlog' } },
      { path: 'system/loginlog', component: SystemAdminPage, meta: { title: '登录日志', systemPage: 'loginlog' } },
      { path: 'system/field', component: SystemAdminPage, meta: { title: '字段管理', systemPage: 'field' } },
      { path: 'system/data-scope', component: SystemAdminPage, meta: { title: '数据权限', systemPage: 'data-scope' } },
      { path: 'system/interface-log', component: SystemAdminPage, meta: { title: '接口日志', systemPage: 'interface-log' } }
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
