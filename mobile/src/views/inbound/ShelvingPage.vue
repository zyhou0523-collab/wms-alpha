<template>
  <main class="page with-tab">
    <van-nav-bar title="入库上架" fixed placeholder left-arrow @click-left="router.back()" />
    <WarehouseSwitcher @changed="load" />

    <ScanInput
      v-model="locationCode"
      label="库位码"
      placeholder="扫描或输入目标库位"
      :accepted-types="['LOCATION', 'UNKNOWN']"
      :clear-on-scan="false"
      next-tip="已识别目标库位，可选择任务确认上架"
    />

    <section class="section-title">待上架任务</section>
    <PageState
      v-if="loading || errorMessage || tasks.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && tasks.length === 0"
      empty-text="暂无待上架任务"
      @retry="load"
    />

    <section v-else class="mobile-task-board">
      <article v-for="task in tasks" :key="task.id" class="mobile-task-card">
        <div>
          <h3>{{ task.orderNo }}</h3>
          <p>{{ task.warehouseName }} / {{ task.supplierName }}</p>
          <p>已收货 {{ task.receivedQty }} 件，推荐库位 {{ task.recommendLocation }}</p>
          <div class="compact-action-row">
            <van-button type="primary" size="small" @click="confirmShelve(task)">确认上架</van-button>
            <van-button plain size="small" @click="router.push(`/inbound/${task.orderId}`)">详情</van-button>
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
import { listInboundOrders } from '../../api/inbound'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { confirmAction, fail, success } from '../../utils/feedback'
import MobileTabbar from '../shared/MobileTabbar.vue'

type ShelvingTask = {
  id: string
  orderId: number
  orderNo: string
  supplierName: string
  warehouseName: string
  receivedQty: number
  recommendLocation: string
  status: string
}

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const locationCode = ref('')
const tasks = ref<ShelvingTask[]>([])

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listInboundOrders({ pageSize: 100 })
    tasks.value = (data.items || [])
      .filter((row) => Number(row.received_qty || 0) > 0)
      .map((row, index) => ({
        id: `${row.id}-${index}`,
        orderId: Number(row.id),
        orderNo: row.order_no,
        supplierName: row.supplier_name || row.owner_name || '-',
        warehouseName: row.warehouse_name || row.warehouse_code || '-',
        receivedQty: Number(row.received_qty || 0),
        recommendLocation: index % 2 === 0 ? 'FG-L-A01-001' : 'NE-L-A01-001',
        status: '待上架'
      }))
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '上架任务加载失败'
  } finally {
    loading.value = false
  }
}

async function confirmShelve(task: ShelvingTask) {
  if (!locationCode.value.trim()) {
    fail('请先扫描或输入目标库位')
    return
  }
  await confirmAction(`确认将 ${task.orderNo} 上架到 ${locationCode.value}？`, '上架确认')
  task.status = '已上架'
  success(`上架完成：${task.orderNo}`)
}
</script>
