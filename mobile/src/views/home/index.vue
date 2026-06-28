<template>
  <main class="page with-tab">
    <header class="pda-header">
      <div>
        <div class="eyebrow">WMS Alpha PDA</div>
        <h1>首页</h1>
      </div>
      <div class="user-pill">{{ displayName }}</div>
    </header>

    <section class="warehouse-strip">
      <span>当前仓库</span>
      <strong>{{ userStore.currentWarehouse }}</strong>
    </section>

    <section class="metric-grid">
      <div class="metric-card">
        <span>今日待收货</span>
        <strong>{{ summary.pendingReceiveCount ?? '-' }}</strong>
      </div>
      <div class="metric-card">
        <span>今日待拣货</span>
        <strong>{{ summary.pendingPickCount ?? '-' }}</strong>
      </div>
      <div class="metric-card">
        <span>今日待发货</span>
        <strong>{{ summary.pendingShipCount ?? '-' }}</strong>
      </div>
    </section>

    <section class="action-grid">
      <button v-for="action in actions" :key="action.title" class="pda-action" @click="router.push(action.path)">
        <span class="action-icon">{{ action.icon }}</span>
        <strong>{{ action.title }}</strong>
        <small>{{ action.desc }}</small>
      </button>
    </section>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkbenchSummary, WorkbenchSummary } from '../../api/inventory'
import { useUserStore } from '../../stores/user'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const userStore = useUserStore()
const summary = reactive<WorkbenchSummary>({})

const displayName = computed(() => userStore.user?.display_name || userStore.user?.username || '未登录')

const actions = [
  { title: '入库作业', desc: '收货 / SN 采集', icon: '入', path: '/inbound' },
  { title: '出库作业', desc: '分配 / 拣货 / 发货', icon: '出', path: '/outbound' },
  { title: '库存查询', desc: '库位 / 产品 / 批次', icon: '查', path: '/inventory' },
  { title: '库存移动', desc: '库位 / 托盘 / 箱码', icon: '移', path: '/inventory' },
  { title: '库存盘点', desc: '盘点 / 差异处理', icon: '盘', path: '/inventory' },
  { title: 'SN 查询', desc: 'SN 追溯', icon: 'SN', path: '/inventory' }
]

onMounted(async () => {
  try {
    Object.assign(summary, await getWorkbenchSummary())
  } catch {
    Object.assign(summary, {
      pendingReceiveCount: 0,
      pendingPickCount: 0,
      pendingShipCount: 0
    })
  }
})
</script>
