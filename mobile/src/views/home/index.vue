<template>
  <main class="page with-tab home-page">
    <header class="pda-header">
      <div>
        <div class="eyebrow">WMS Alpha PDA</div>
        <h1>移动工作台</h1>
      </div>
      <div class="user-pill">{{ displayName }}</div>
    </header>

    <WarehouseSwitcher @changed="loadHomeSummary" />

    <section class="warehouse-strip">
      <span>当前仓库</span>
      <strong>{{ userStore.currentWarehouse }}</strong>
    </section>

    <section class="scan-entry-card" @click="router.push('/inbound?scene=scan')">
      <div>
        <span>现场扫码优先</span>
        <strong>扫描单据 / SN / 箱码 / 托盘 / 库位</strong>
      </div>
      <b>扫码</b>
    </section>

    <section class="section-title">业务看板</section>
    <section class="metric-grid home-metric-grid">
      <div v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ loading ? '-' : metric.value }}</strong>
      </div>
    </section>
    <p v-if="errorMessage" class="home-error">{{ errorMessage }}</p>

    <template v-for="group in actionGroups" :key="group.title">
      <section v-if="group.actions.length" class="section-title home-group-title">{{ group.title }}</section>
      <section v-if="group.actions.length" class="action-grid">
        <button
          v-for="action in group.actions"
          :key="action.title"
          class="pda-action"
          type="button"
          @click="router.push(action.path)"
        >
          <span class="action-icon">{{ action.icon }}</span>
          <strong>{{ action.title }}</strong>
          <small>{{ action.desc }}</small>
        </button>
      </section>
    </template>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listInboundOrders, type InboundOrder } from '../../api/inbound'
import { listOutboundOrders, type OutboundOrder } from '../../api/outbound'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { useUserStore } from '../../stores/user'
import { useWarehouseStore } from '../../stores/warehouse'
import { filterMobileActions, type MobileAction } from '../../utils/permission'
import MobileTabbar from '../shared/MobileTabbar.vue'

type HomeSummary = {
  pendingReceiveOrders: number
  partialReceivedOrders: number
  inboundSapPendingOrders: number
  outboundOrders: number
  pendingAllocationOrders: number
  pendingPickOrders: number
  pendingShipOrders: number
  outboundSapPendingOrders: number
}

const router = useRouter()
const userStore = useUserStore()
const warehouseStore = useWarehouseStore()
const loading = ref(false)
const errorMessage = ref('')
const summary = reactive<HomeSummary>({
  pendingReceiveOrders: 0,
  partialReceivedOrders: 0,
  inboundSapPendingOrders: 0,
  outboundOrders: 0,
  pendingAllocationOrders: 0,
  pendingPickOrders: 0,
  pendingShipOrders: 0,
  outboundSapPendingOrders: 0
})

const displayName = computed(() => userStore.user?.display_name || userStore.user?.username || '未登录')

const actions: MobileAction[] = [
  { title: '入库作业', desc: '按 PC 入库主流程处理', icon: '入', path: '/inbound?scene=inbound-work', menuKey: 'inbound' },
  { title: '预期到货通知单', desc: '查看 ASN 主表与行明细', icon: 'ASN', path: '/inbound?scene=arrival-notice', menuKey: 'inbound' },
  { title: '入库 SN 采集', desc: '按订单和行号采集 SN', icon: 'SN', path: '/inbound?scene=sn-collect', menuKey: 'inbound' },
  { title: '入库收货', desc: 'SN 产品采集后收货', icon: '收', path: '/inbound?scene=receive', menuKey: 'inbound' },
  { title: '入库 SAP 回传', desc: '回传 / 失败重传', icon: 'SAP', path: '/inbound?scene=sap-post', menuKey: 'inbound' },
  { title: '发运订单', desc: '查看发运主表与行明细', icon: '发', path: '/outbound?scene=shipping-order', menuKey: 'outbound' },
  { title: '库存分配', desc: '自动分配 / 人工指定', icon: '分', path: '/outbound?scene=allocation', menuKey: 'outbound' },
  { title: '拣货作业', desc: '按分配结果或直接拣货', icon: '拣', path: '/outbound?scene=pick', menuKey: 'outbound' },
  { title: '发货作业', desc: '整单 / 行明细 / 部分发货', icon: '运', path: '/outbound?scene=ship', menuKey: 'outbound' },
  { title: '出库 SAP 回传', desc: '发货批次回传 / 重传', icon: 'SAP', path: '/outbound?scene=sap-post', menuKey: 'outbound' },
  { title: '库存查询', desc: '仓库 / 库位 / 产品库存', icon: '库', path: '/inventory?scene=stock', menuKey: 'inventory' },
  { title: 'SN 查询', desc: 'SN 状态与库存追溯', icon: 'SN', path: '/inventory?scene=sn', menuKey: 'snQuery' }
]

const availableActions = computed(() => filterMobileActions(actions, userStore.user))

const actionGroups = computed(() => [
  {
    title: '入库作业',
    actions: availableActions.value.filter((action) => action.menuKey === 'inbound')
  },
  {
    title: '出库作业',
    actions: availableActions.value.filter((action) => action.menuKey === 'outbound')
  },
  {
    title: '库存与 SN 查询',
    actions: availableActions.value.filter((action) => ['inventory', 'snQuery'].includes(String(action.menuKey)))
  }
])

const metrics = computed(() => [
  { label: '待收货单据数', value: summary.pendingReceiveOrders },
  { label: '部分收货单据数', value: summary.partialReceivedOrders },
  { label: '待 SAP 回传入库单数', value: summary.inboundSapPendingOrders },
  { label: '发运订单数', value: summary.outboundOrders },
  { label: '待分配发运订单数', value: summary.pendingAllocationOrders },
  { label: '待拣货发运订单数', value: summary.pendingPickOrders },
  { label: '待发货发运订单数', value: summary.pendingShipOrders },
  { label: '出库 SAP 待回传/失败', value: summary.outboundSapPendingOrders }
])

onMounted(() => {
  warehouseStore.initFromUser(userStore.user)
  loadHomeSummary()
})

async function loadHomeSummary() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [inboundData, outboundData] = await Promise.all([
      listInboundOrders({ pageSize: 200 }),
      listOutboundOrders({ pageSize: 200 })
    ])
    calculateInboundSummary(inboundData.items || [])
    calculateOutboundSummary(outboundData.items || [])
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '首页统计加载失败'
  } finally {
    loading.value = false
  }
}

function calculateInboundSummary(rows: InboundOrder[]) {
  summary.pendingReceiveOrders = rows.filter((row) => ['CREATED', 'RECEIVING'].includes(String(row.status || ''))
    && numberOf(row.planned_qty) > numberOf(row.received_qty)).length
  summary.partialReceivedOrders = rows.filter((row) => row.status === 'PARTIAL_RECEIVED').length
  summary.inboundSapPendingOrders = rows.filter((row) => {
    const sapStatus = String(row.sap_post_status || '')
    return numberOf(row.received_qty) > 0 && ['NOT_POSTED', 'FAILED'].includes(sapStatus)
  }).length
}

function calculateOutboundSummary(rows: OutboundOrder[]) {
  summary.outboundOrders = rows.length
  summary.pendingAllocationOrders = rows.filter((row) => ['CREATED', 'PENDING_ALLOC', 'PARTIAL_ALLOCATED', 'ALLOCATION_EXCEPTION'].includes(String(row.status || ''))).length
  summary.pendingPickOrders = rows.filter((row) => !isOutboundTerminal(row)
    && numberOf(row.picked_qty) < numberOf(row.planned_qty)).length
  summary.pendingShipOrders = rows.filter((row) => !isOutboundTerminal(row)
    && numberOf(row.picked_qty) > numberOf(row.shipped_qty)).length
  summary.outboundSapPendingOrders = rows.filter((row) => {
    const sapStatus = String(row.sap_post_status || '')
    return numberOf(row.shipped_qty) > 0 && ['NOT_POSTED', 'FAILED', ''].includes(sapStatus)
  }).length
}

function isOutboundTerminal(row: OutboundOrder) {
  return ['CANCELED', 'CLOSED', 'SHIPPED', 'CALLBACK_SUCCESS'].includes(String(row.status || ''))
}

function numberOf(value: unknown) {
  return Number(value || 0)
}
</script>
