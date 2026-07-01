<template>
  <main class="page with-tab inbound-list-page">
    <van-nav-bar title="预期到货通知单" fixed placeholder />

    <WarehouseSwitcher @changed="load" />

    <ScanInput
      v-model="scanValue"
      label="单据号"
      placeholder="扫描或输入预期到货通知单号"
      :accepted-types="['DOCUMENT', 'UNKNOWN']"
      clear-on-scan
      @scan-detail="handleScan"
    />

    <van-cell-group inset class="filter-card">
      <van-field v-model="query.orderNo" label="通知单号" clearable placeholder="IN202606110100" />
      <van-field v-model="query.supplier" label="供应商" clearable placeholder="供应商编码/名称" />
      <van-field label="订单类型">
        <template #input>
          <select v-model="query.inboundType" class="mobile-select">
            <option value="">全部</option>
            <option v-for="item in inboundTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
      </van-field>
      <van-field v-model="query.sapPlant" label="SAP 工厂" clearable placeholder="3060" />
      <van-field v-model="query.sapStorageLocation" label="SAP 库存地点" clearable placeholder="1001" />
      <van-field label="收货状态">
        <template #input>
          <select v-model="query.status" class="mobile-select">
            <option value="">全部</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
      </van-field>
      <div class="filter-actions">
        <van-button block type="primary" @click="search">查询</van-button>
        <van-button block plain @click="reset">重置</van-button>
      </div>
    </van-cell-group>

    <section class="section-title">入库单列表</section>
    <PageState
      v-if="loading || errorMessage || orders.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && orders.length === 0"
      empty-text="暂无预期到货通知单"
      @retry="load"
    />

    <template v-else>
      <van-cell-group
        v-for="order in orders"
        :key="order.id"
        inset
        class="inbound-card"
        @click="openDetail(order)"
      >
        <van-cell is-link>
          <template #title>
            <div class="order-title compact-title">{{ order.order_no }}</div>
            <div class="order-subtitle">{{ supplierText(order) }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>

        <div class="card-tag-row">
          <StatusTag :status="order.sap_post_status" :label="sapStatusLabel(order.sap_post_status)" />
          <span>{{ inboundTypeLabel(order.inbound_type) }}</span>
        </div>

        <div class="order-meta">
          <div class="order-meta-item">
            <span>订单类型</span>
            <strong>{{ inboundTypeLabel(order.inbound_type) }}</strong>
          </div>
          <div class="order-meta-item">
            <span>SAP 工厂</span>
            <strong>{{ order.sap_plant || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>SAP 库存地点</span>
            <strong>{{ order.sap_storage_location || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>到货日期</span>
            <strong>{{ order.plan_arrival_date || order.arrival_date || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>产品行数</span>
            <strong>{{ order.line_count ?? order.lines?.length ?? 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>订单总数量</span>
            <strong>{{ order.planned_qty ?? 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>已收货数量</span>
            <strong>{{ order.received_qty ?? 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>SAP 回传状态</span>
            <strong>{{ sapStatusLabel(order.sap_post_status) }}</strong>
          </div>
        </div>
        <div class="inline-actions card-actions" @click.stop>
          <van-button size="small" type="primary" plain @click="openDetail(order)">SN / 详情</van-button>
          <van-button size="small" type="success" plain @click="router.push(`/inbound/${order.id}/receive`)">收货</van-button>
          <van-button size="small" plain @click="router.push('/inbound/shelving')">上架</van-button>
          <van-button
            v-if="canSapPost(order)"
            size="small"
            type="warning"
            :plain="order.sap_post_status === 'FAILED'"
            @click="submitSapPost(order)"
          >
            {{ order.sap_post_status === 'FAILED' ? 'SAP 重传' : 'SAP 回传' }}
          </van-button>
          <van-button
            v-else-if="canRetrySap(order)"
            size="small"
            type="warning"
            plain
            @click="retrySap(order)"
          >
            SAP 重传
          </van-button>
        </div>
      </van-cell-group>
    </template>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listInboundOrders, retryInboundSap, sapPostInboundOrder, type InboundOrder, type InboundListParams } from '../../api/inbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import StatusTag from '../../components/StatusTag.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { confirmAction, fail, success, withLoading } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const orders = ref<InboundOrder[]>([])
const query = reactive<InboundListParams>({
  pageNum: 1,
  pageSize: 20,
  orderNo: '',
  supplier: '',
  inboundType: '',
  sapPlant: '',
  sapStorageLocation: '',
  status: ''
})

const inboundTypeOptions = [
  { value: 'PRODUCTION', label: '生产入库' },
  { value: 'STOCKING', label: '备货入库' },
  { value: 'RMA', label: '售后 RMA 入库' },
  { value: 'TRANSFER', label: '调拨入库' },
  { value: 'SUPPLIER_VMI', label: '供应商 VMI 入库' },
  { value: 'OTHER', label: '其他入库' }
]

const statusOptions = [
  { value: 'CREATED', label: '待收货' },
  { value: 'PARTIAL_RECEIVED', label: '部分收货' },
  { value: 'RECEIVED', label: '完全收货' },
  { value: 'CLOSED', label: '已关闭' },
  { value: 'CANCELED', label: '已取消' }
]

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listInboundOrders(cleanQuery())
    orders.value = data.items || []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '预期到货通知单加载失败'
  } finally {
    loading.value = false
  }
}

function cleanQuery() {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')) as InboundListParams
}

function search() {
  query.pageNum = 1
  load()
}

function reset() {
  Object.assign(query, {
    pageNum: 1,
    pageSize: 20,
    orderNo: '',
    supplier: '',
    inboundType: '',
    sapPlant: '',
    sapStorageLocation: '',
    status: ''
  })
  load()
}

async function handleScan(result: ScanResult) {
  query.orderNo = result.value
  await load()
  const matched = orders.value.find((order) => order.order_no === result.value)
  if (matched) {
    success('已定位到预期到货通知单')
    openDetail(matched)
    return
  }
  fail('未找到该预期到货通知单')
}

function openDetail(order: InboundOrder) {
  router.push(`/inbound/${order.id}`)
}

async function submitSapPost(order: InboundOrder) {
  const isRetry = order.sap_post_status === 'FAILED'
  await confirmAction(
    `确认对入库单 ${order.order_no} 发起 SAP 入库回传？待回传批次数：${order.pending_sap_receipt_count || 0}`,
    isRetry ? 'SAP 重传确认' : 'SAP 回传确认'
  )
  await withLoading('SAP 回传中', async () => {
    await sapPostInboundOrder(Number(order.id))
    await load()
  })
  success(isRetry ? 'SAP 重传已触发' : 'SAP 入库回传已触发')
}

async function retrySap(order: InboundOrder) {
  await confirmAction(`确认重传入库单 ${order.order_no} 的 SAP 失败记录？`, 'SAP 重传确认')
  await withLoading('SAP 重传中', async () => {
    await retryInboundSap([Number(order.id)])
    await load()
  })
  success('SAP 重传已触发')
}

function supplierText(order: InboundOrder) {
  return order.supplier_name || order.supplier_code || order.owner_name || '-'
}

function inboundTypeLabel(value?: string) {
  return inboundTypeOptions.find((item) => item.value === value)?.label || value || '-'
}

function statusLabel(value?: string) {
  const alias: Record<string, string> = { RECEIVING: '部分收货', ON_SHELF: '完全收货' }
  return statusOptions.find((item) => item.value === value)?.label || alias[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '已回传'
  if (value === 'FAILED') return '回传失败'
  return value
}

function canSapPost(order: InboundOrder) {
  return numberOf(order.pending_sap_receipt_count) > 0
}

function canRetrySap(order: InboundOrder) {
  return canSapPost(order) || ['FAILED', 'NOT_POSTED'].includes(String(order.sap_post_status || ''))
}

function numberOf(value: unknown) {
  const result = Number(value || 0)
  return Number.isFinite(result) ? result : 0
}
</script>
