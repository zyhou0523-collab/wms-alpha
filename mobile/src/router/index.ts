import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { getToken } from '../utils/auth'

const Login = () => import('../views/login/index.vue')
const Home = () => import('../views/home/index.vue')
const Inbound = () => import('../views/inbound/index.vue')
const Outbound = () => import('../views/outbound/index.vue')
const Inventory = () => import('../views/inventory/index.vue')
const Profile = () => import('../views/profile/index.vue')

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', component: Login, meta: { title: '登录', public: true } },
  { path: '/home', component: Home, meta: { title: '首页' } },
  { path: '/inbound', component: Inbound, meta: { title: '入库' } },
  { path: '/outbound', component: Outbound, meta: { title: '出库' } },
  { path: '/inventory', component: Inventory, meta: { title: '库存' } },
  { path: '/profile', component: Profile, meta: { title: '我的' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const token = getToken()
  if (!to.meta.public && !token) {
    return '/login'
  }
  if (to.path === '/login' && token) {
    return '/home'
  }
})

export default router
