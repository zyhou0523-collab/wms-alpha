<template>
  <main class="page with-tab outbound-list-page">
    <van-nav-bar title="发运订单" fixed placeholder />

    <ScanInput
      v-model="scanValue"
      label="发运订单号"
      placeholder="扫描或输入发运订单号"
      :accepted-types="['DOCUMENT', 'UNKNOWN']"
      clear-on-scan
      @scan-detail="handleScan"
    />

    <van-cell-group inset class="filter-card">
      <van-field v-model="query.orderNo" label="订单号" clearable placeholder="SO-OUT-202606110001" />
      <van-field v-model="query.customer" label="客户" clearable placeholder="客户编码 / 名称" />
      <van-field v-model="query.shipFromCountry" label="出库国家" clearable placeholder="中国 / 德国" />
      <van-field v-model="query.productCode" label="产品编码" clearable placeholder="GT3 / BMS" />
      <van-field label="订单状态">
        <template #input>
          <select v-model="query.status" class="mobile-select">
            <option value="">全部</option>
            <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </template>
      </van-field>
      <van-field label="SAP 回传">
        <template #input>
          <select v-model="query.sapPostStatus" class="mobile-select">
            <option value="">全部</option>
            <option value="NOT_POSTED">未回传</option>
            <option value="SUCCESS">成功</option>
            <option value="POSTED">成功</option>
            <option value="FAILED">失败</option>
          </select>
        </template>
      </van-field>
      <div class="filter-actions">
        <van-button block type="primary" @click="search">查询</van-button>
        <van-button block plain @click="reset">重置</van-button>
      </div>
    </van-cell-group>

    <section class="section-title">发运订单列表</section>
    <PageState
      v-if="loading || errorMessage || orders.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && orders.length === 0"
      empty-text="暂无发运订单"
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
            <div class="order-title compact-title">{{ order.shipment_order_no || order.order_no }}</div>
            <div class="order-subtitle">{{ customerText(order) }}</div>
          </template>
          <template #value>
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
          </template>
        </van-cell>
        <div class="card-tag-row">
          <StatusTag :status="order.sap_post_status" :label="sapStatusLabel(order.sap_post_status)" />
          <span>{{ orderTypeLabel(order.order_type || order.outbound_type) }}</span>
        </div>
        <div class="order-meta">
          <div class="order-meta-item">
            <span>出库国家</span>
            <strong>{{ order.ship_from_country || order.shipFromCountry || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>货主</span>
            <strong>{{ [order.owner_code, order.owner_name].filter(Boolean).join(' / ') || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>仓库</span>
            <strong>{{ order.warehouse_name || order.warehouse_code || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>发运日期</span>
            <strong>{{ order.expected_ship_time || '-' }}</strong>
          </div>
          <div class="order-meta-item">
            <span>产品行数</span>
            <strong>{{ order.line_count || order.lines?.length || 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>订单总数量</span>
            <strong>{{ order.planned_qty || 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>已分配数量</span>
            <strong>{{ order.allocated_qty || 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>已拣货数量</span>
            <strong>{{ order.picked_qty || 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>已发货数量</span>
            <strong>{{ order.shipped_qty || 0 }}</strong>
          </div>
          <div class="order-meta-item">
            <span>SAP 回传状态</span>
            <strong>{{ sapStatusLabel(order.sap_post_status) }}</strong>
          </div>
        </div>
      </van-cell-group>
    </template>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listOutboundOrders, type OutboundListParams, type OutboundOrder } from '../../api/outbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import StatusTag from '../../components/StatusTag.vue'
import { fail, success } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const orders = ref<OutboundOrder[]>([])
const query = reactive<OutboundListParams>({
  pageNum: 1,
  pageSize: 20,
  orderNo: '',
  customer: '',
  shipFromCountry: '',
  productCode: '',
  status: '',
  sapPostStatus: ''
})

const statusOptions = [
  { value: 'CREATED', label: '创建' },
  { value: 'PENDING_ALLOC', label: '创建' },
  { value: 'PARTIAL_ALLOCATED', label: '部分分配' },
  { value: 'ALLOCATED', label: '完全分配' },
  { value: 'PARTIAL_PICKED', label: '部分拣货' },
  { value: 'PICKED', label: '完全拣货' },
  { value: 'PARTIAL_SHIPPED', label: '部分发运' },
  { value: 'SHIPPED', label: '完全发运' },
  { value: 'CLOSED', label: '订单关闭' },
  { value: 'CANCELED', label: '订单取消' }
]

const orderTypeOptions = [
  { value: 'SALES_OUTBOUND', label: '销售出库' },
  { value: 'AFTERSALE_OUTBOUND', label: '售后出库' },
  { value: 'WAREHOUSE_TRANSFER', label: '仓库调拨' },
  { value: 'STO_OUTBOUND', label: 'STO 出库' },
  { value: 'WORK_ORDER_ISSUE', label: '工单领料出库' },
  { value: 'MATERIAL_REQUISITION', label: '领料单出库' },
  { value: 'REWORK_OUTBOUND', label: '返工出库' },
  { value: 'RETURN_OUTBOUND', label: '退货出库' },
  { value: 'OTHER_OUTBOUND', label: '其他出库' }
]

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listOutboundOrders(cleanQuery())
    orders.value = data.items || []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '发运订单加载失败'
  } finally {
    loading.value = false
  }
}

function cleanQuery() {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')) as OutboundListParams
}

function search() {
  query.pageNum = 1
  load()
}

function reset() {
  Object.assign(query, { pageNum: 1, pageSize: 20, orderNo: '', customer: '', shipFromCountry: '', productCode: '', status: '', sapPostStatus: '' })
  load()
}

async function handleScan(result: ScanResult) {
  query.orderNo = result.value
  await load()
  const matched = orders.value.find((order) => [order.order_no, order.shipment_order_no].includes(result.value))
  if (matched) {
    success('已定位到发运订单')
    openDetail(matched)
    return
  }
  fail('未找到该发运订单')
}

function openDetail(order: OutboundOrder) {
  router.push(`/outbound/${order.id}`)
}

function customerText(order: OutboundOrder) {
  return order.customer_name || order.consignee_name || order.customer_code || order.consignee_code || '-'
}

function orderTypeLabel(value?: string) {
  const alias: Record<string, string> = { SALES: 'SALES_OUTBOUND', TRANSFER: 'WAREHOUSE_TRANSFER', AFTERSALE: 'AFTERSALE_OUTBOUND' }
  const normalized = alias[String(value || '')] || String(value || '')
  return orderTypeOptions.find((item) => item.value === normalized)?.label || value || '-'
}

function statusLabel(value?: string) {
  const alias: Record<string, string> = {
    PENDING_ALLOC: '创建',
    ALLOCATION_EXCEPTION: '分配异常',
    CALLBACK_SUCCESS: '回传成功',
    CALLBACK_FAILED: '回传失败'
  }
  return statusOptions.find((item) => item.value === value)?.label || alias[String(value || '')] || value || '-'
}

function sapStatusLabel(value?: string) {
  if (!value || value === 'NOT_POSTED') return '未回传'
  if (['SUCCESS', 'POSTED'].includes(value)) return '成功'
  if (value === 'FAILED') return '失败'
  return value
}
</script>
