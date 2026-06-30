<template>
  <el-container class="app-shell">
    <el-aside width="220px" class="sidebar">
      <div class="brand">
        <span class="brand-mark">W</span>
        <span>WMS Alpha</span>
      </div>
      <el-menu
        router
        :default-active="route.path"
        background-color="#263445"
        text-color="#d7dde8"
        active-text-color="#ffffff"
        class="side-menu"
      >
        <template v-for="item in menus" :key="item.id">
          <el-menu-item v-if="!item.children?.length" :index="item.path">
            <el-icon><component :is="item.icon || 'Menu'" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="item.id">
            <template #title>
              <el-icon><component :is="item.icon || 'Menu'" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.id" :index="child.path">
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title || '页面' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-right">
          <el-select
            v-model="warehouse.currentWarehouseCode"
            class="warehouse-selector"
            size="small"
            placeholder="仓库范围"
            @change="handleWarehouseChange"
          >
            <el-option
              v-for="item in warehouse.options"
              :key="item.warehouse_code"
              :label="item.warehouse_name"
              :value="item.warehouse_code"
            />
          </el-select>
          <el-tag effect="plain">{{ auth.user?.role_name || 'Alpha 角色' }}</el-tag>
          <el-dropdown>
            <span class="user-entry">
              {{ auth.user?.display_name || auth.user?.username || '用户' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="content">
        <router-view :key="`${route.fullPath}-${warehouseViewKey}`" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWarehouseStore } from '../stores/warehouse'
import { menuApi } from '../api/services'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const warehouse = useWarehouseStore()
const menus = ref<any[]>([])
const warehouseViewKey = ref(0)

onMounted(async () => {
  menus.value = await menuApi()
  await auth.loadMe()
  warehouse.initFromUser(auth.user)
  window.addEventListener('wms-warehouse-change', refreshCurrentView)
})

onUnmounted(() => {
  window.removeEventListener('wms-warehouse-change', refreshCurrentView)
})

function handleWarehouseChange(code: string) {
  warehouse.setCurrentWarehouse(code, auth.user?.username)
}

function refreshCurrentView() {
  warehouseViewKey.value += 1
}

function logout() {
  warehouse.clear(auth.user?.username)
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.sidebar {
  background: var(--wms-sidebar);
  color: #fff;
}

.brand {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  font-size: 17px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--wms-primary);
}

.side-menu {
  border-right: 0;
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid var(--wms-border);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.warehouse-selector {
  width: 180px;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.content {
  padding: 16px;
  background: var(--wms-bg);
}
</style>
