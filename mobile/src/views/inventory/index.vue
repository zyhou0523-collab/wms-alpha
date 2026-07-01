<template>
  <main class="page with-tab">
    <van-nav-bar title="库存作业" fixed placeholder />
    <WarehouseSwitcher @changed="load" />

    <ScanInput
      v-model="scanValue"
      label="库存码"
      placeholder="扫描库位、托盘、箱码、产品或 SN"
      :accepted-types="['LOCATION', 'PALLET', 'BOX', 'PRODUCT', 'SN', 'UNKNOWN']"
      :clear-on-scan="false"
      @scan-detail="handleScan"
    />

    <section class="quick-row">
      <van-button :type="mode === 'stock' ? 'primary' : 'default'" block @click="mode = 'stock'; load()">库存查询</van-button>
      <van-button :type="mode === 'sn' ? 'primary' : 'default'" block @click="mode = 'sn'; load()">SN 查询</van-button>
      <van-button block @click="router.push('/inventory/cycle-count')">库存盘点</van-button>
      <van-button block @click="router.push('/inventory/move')">库存移库</van-button>
    </section>

    <section class="section-title">{{ mode === 'stock' ? '库存查询' : 'SN 查询' }}</section>
    <PageState
      v-if="loading || errorMessage || displayRows.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && displayRows.length === 0"
      empty-text="暂无库存或 SN 数据"
      @retry="load"
    />

    <van-cell-group v-else inset>
      <van-cell v-for="row in displayRows" :key="row.key" :title="row.title" :label="row.label">
        <template #value>
          <div class="inventory-value">
            <strong>{{ row.qty }}</strong>
            <span>{{ row.location }}</span>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listInventory, listSerialNumbers, type InventoryRow } from '../../api/inventory'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { success } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'
import MobileTabbar from '../shared/MobileTabbar.vue'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const mode = ref<'stock' | 'sn'>('stock')
const inventoryRows = ref<InventoryRow[]>([])
const snRows = ref<Record<string, any>[]>([])

const displayRows = computed(() => {
  if (mode.value === 'stock') {
    return inventoryRows.value.map((row) => ({
      key: `stock-${row.id}`,
      title: row.product_code || '-',
      label: `${row.product_name || '-'} / ${row.warehouse_name || row.warehouse_code || '-'}`,
      qty: row.available_qty ?? '-',
      location: row.location_code || '-'
    }))
  }
  return snRows.value.map((row) => ({
    key: `sn-${row.id}`,
    title: row.sn_code || '-',
    label: `${row.product_code || '-'} / ${row.warehouse_name || row.warehouse_code || '-'}`,
    qty: row.status || '-',
    location: row.location_code || '-'
  }))
})

onMounted(load)

function handleScan(result: ScanResult) {
  scanValue.value = result.value
  if (result.type === 'SN') mode.value = 'sn'
  success(`已识别${typeLabel(result.type)}：${result.value}`)
  load()
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (mode.value === 'stock') {
      const data = await listInventory({ pageSize: 20, keyword: scanValue.value })
      inventoryRows.value = data.items || []
    } else {
      const data = await listSerialNumbers({ pageSize: 20, keyword: scanValue.value })
      snRows.value = data.items || []
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '库存数据加载失败'
  } finally {
    loading.value = false
  }
}

function typeLabel(type: ScanResult['type']) {
  return {
    SN: 'SN',
    BOX: '箱码',
    PALLET: '托盘码',
    LOCATION: '库位码',
    DOCUMENT: '单据号',
    PRODUCT: '产品编码',
    UNKNOWN: '条码'
  }[type]
}
</script>
