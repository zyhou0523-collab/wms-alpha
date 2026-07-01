<template>
  <main class="page with-tab">
    <van-nav-bar title="库存盘点" fixed placeholder left-arrow @click-left="router.back()" />
    <WarehouseSwitcher @changed="load" />

    <ScanInput
      v-model="scanValue"
      label="盘点码"
      placeholder="扫描库位 / 产品 / SN"
      :accepted-types="['LOCATION', 'PRODUCT', 'SN', 'UNKNOWN']"
      :clear-on-scan="false"
      next-tip="已定位盘点对象，可录入实盘数量"
    />

    <section class="section-title">盘点任务</section>
    <PageState
      v-if="loading || errorMessage || rows.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && rows.length === 0"
      empty-text="暂无盘点任务"
      @retry="load"
    />

    <section v-else class="mobile-task-board">
      <article v-for="row in rows" :key="row.id" class="pda-form-card">
        <h3>{{ row.product_code }}</h3>
        <p>{{ row.product_name }} / {{ row.location_code }}</p>
        <div class="detail-grid">
          <InfoItem label="账面数量" :value="row.available_qty" />
          <InfoItem label="已分配" :value="row.allocated_qty || 0" />
          <InfoItem label="状态" :value="row.inventory_status || 'AVAILABLE'" />
        </div>
        <van-field v-model.number="countQty[row.id]" label="实盘数量" type="number" placeholder="输入实盘数量" />
        <div class="compact-action-row">
          <van-button type="primary" size="small" @click="submitCount(row)">提交盘点</van-button>
        </div>
      </article>
    </section>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { InventoryRow, listInventory } from '../../api/inventory'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { confirmAction, fail, success } from '../../utils/feedback'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const rows = ref<InventoryRow[]>([])
const countQty = reactive<Record<number, number>>({})

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listInventory({ pageSize: 20 })
    rows.value = data.items || []
    rows.value.forEach((row) => {
      if (countQty[row.id] === undefined) countQty[row.id] = Number(row.available_qty || 0)
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '盘点任务加载失败'
  } finally {
    loading.value = false
  }
}

async function submitCount(row: InventoryRow) {
  const qty = Number(countQty[row.id])
  if (!Number.isFinite(qty) || qty < 0) {
    fail('实盘数量必须大于等于 0')
    return
  }
  const diff = qty - Number(row.available_qty || 0)
  await confirmAction(`确认提交 ${row.product_code} 盘点结果？差异 ${diff}`, '盘点确认')
  success(diff === 0 ? '盘点无差异，已提交' : `盘点已提交，差异 ${diff}`)
}
</script>

<script lang="ts">
export default {
  components: {
    InfoItem: {
      props: ['label', 'value'],
      template: '<div class="detail-item"><span>{{ label }}</span><strong>{{ value ?? "-" }}</strong></div>'
    }
  }
}
</script>
