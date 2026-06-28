<template>
  <main class="page with-tab">
    <van-nav-bar title="入库作业" fixed placeholder />
    <ScanInput v-model="scanValue" label="ASN/SN" placeholder="扫描 ASN 单号或 SN" @confirm="handleScan" />

    <section class="section-title">待处理入库单</section>
    <MobileOrderCard
      v-for="order in orders"
      :key="order.id"
      :title="order.order_no"
      :status="order.status"
      :meta="[
        { label: '仓库', value: order.warehouse_name },
        { label: '计划', value: order.planned_qty },
        { label: '已收', value: order.received_qty },
        { label: 'SAP', value: order.sap_post_status }
      ]"
    >
      <template #actions>
        <van-button type="primary" size="small">收货</van-button>
        <van-button size="small">SN 采集</van-button>
      </template>
    </MobileOrderCard>

    <van-empty v-if="!loading && orders.length === 0" description="暂无入库任务" />
    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { InboundOrder, listInboundOrders } from '../../api/inbound'
import MobileOrderCard from '../../components/MobileOrderCard.vue'
import ScanInput from '../../components/ScanInput.vue'
import MobileTabbar from '../shared/MobileTabbar.vue'

const loading = ref(false)
const scanValue = ref('')
const orders = ref<InboundOrder[]>([])

function handleScan(value: string) {
  showToast(`已扫描：${value}`)
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await listInboundOrders({ pageSize: 5 })
    orders.value = data.items || []
  } finally {
    loading.value = false
  }
})
</script>
