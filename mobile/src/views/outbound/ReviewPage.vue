<template>
  <main class="page with-tab">
    <van-nav-bar title="出库复核" fixed placeholder left-arrow @click-left="router.back()" />
    <WarehouseSwitcher @changed="load" />

    <ScanInput
      v-model="scanValue"
      label="复核码"
      placeholder="扫描 SN / 箱码 / 产品编码"
      :accepted-types="['SN', 'BOX', 'PRODUCT', 'UNKNOWN']"
      :duplicate-list="scannedCodes"
      next-tip="复核码已记录，可继续连续扫码"
      @scan="handleScan"
    />

    <section class="section-title">待复核发运单</section>
    <PageState
      v-if="loading || errorMessage || tasks.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && tasks.length === 0"
      empty-text="暂无待复核任务"
      @retry="load"
    />

    <section v-else class="mobile-task-board">
      <article v-for="task in tasks" :key="task.id" class="mobile-task-card">
        <div>
          <h3>{{ task.orderNo }}</h3>
          <p>{{ task.customerName }} / {{ task.country }}</p>
          <p>已拣 {{ task.pickedQty }} 件，已复核 {{ task.reviewedQty }} 件</p>
          <div class="compact-action-row">
            <van-button type="primary" size="small" @click="confirmReview(task)">确认复核</van-button>
            <van-button plain size="small" @click="router.push(`/outbound/${task.orderId}/ship`)">去发货</van-button>
          </div>
        </div>
        <strong>{{ task.status }}</strong>
      </article>
    </section>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listOutboundOrders } from '../../api/outbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { confirmAction, fail, success } from '../../utils/feedback'
import MobileTabbar from '../shared/MobileTabbar.vue'

type ReviewTask = {
  id: string
  orderId: number
  orderNo: string
  customerName: string
  country: string
  pickedQty: number
  reviewedQty: number
  status: string
}

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const scannedCodes = ref<string[]>([])
const tasks = ref<ReviewTask[]>([])

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listOutboundOrders({ pageSize: 100 })
    tasks.value = (data.items || [])
      .filter((row) => Number(row.picked_qty || 0) > Number(row.shipped_qty || 0))
      .map((row, index) => ({
        id: `${row.id}-${index}`,
        orderId: Number(row.id),
        orderNo: row.shipment_order_no || row.order_no,
        customerName: row.customer_name || row.consignee_name || '-',
        country: row.ship_from_country || '-',
        pickedQty: Number(row.picked_qty || 0),
        reviewedQty: Math.max(Number(row.shipped_qty || 0), 0),
        status: '待复核'
      }))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '复核任务加载失败'
  } finally {
    loading.value = false
  }
}

function handleScan(value: string) {
  scannedCodes.value.push(value)
}

async function confirmReview(task: ReviewTask) {
  if (!scannedCodes.value.length) {
    fail('请先扫描 SN、箱码或产品编码完成复核')
    return
  }
  await confirmAction(`确认 ${task.orderNo} 已完成 ${scannedCodes.value.length} 条扫码复核？`, '复核确认')
  task.reviewedQty = Math.min(task.pickedQty, task.reviewedQty + scannedCodes.value.length)
  task.status = task.reviewedQty >= task.pickedQty ? '已复核' : '部分复核'
  scannedCodes.value = []
  success(`复核完成：${task.orderNo}`)
}
</script>
