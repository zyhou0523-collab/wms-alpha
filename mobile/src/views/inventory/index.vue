<template>
  <main class="page with-tab">
    <van-nav-bar title="库存作业" fixed placeholder />
    <WarehouseSwitcher @changed="load" />
    <ScanInput
      v-model="scanValue"
      label="库存码"
      placeholder="扫描库位、托盘、箱码、产品或 SN"
      :accepted-types="['LOCATION', 'PALLET', 'BOX', 'PRODUCT', 'SN']"
      :duplicate-list="scannedCodes"
      @scan-detail="handleScan"
    />

    <section class="quick-row">
      <van-button type="primary" block @click="focusInventorySearch">库存查询</van-button>
      <van-button block @click="notifyPrepared('SN 查询')">SN 查询</van-button>
      <van-button block disabled>移动/盘点暂不开放</van-button>
    </section>

    <section class="section-title">库存查询</section>
    <PageState
      v-if="loading || errorMessage || rows.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && rows.length === 0"
      empty-text="暂无库存数据"
      @retry="load"
    />
    <van-cell-group v-else inset>
      <van-cell v-for="row in rows" :key="row.id" :title="row.product_code || '-'" :label="row.product_name">
        <template #value>
          <div class="inventory-value">
            <strong>{{ row.available_qty ?? '-' }}</strong>
            <span>{{ row.location_code }}</span>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { InventoryRow, listInventory } from '../../api/inventory'
import PageState from '../../components/PageState.vue'
import ScanInput from '../../components/ScanInput.vue'
import WarehouseSwitcher from '../../components/WarehouseSwitcher.vue'
import { success } from '../../utils/feedback'
import type { ScanResult } from '../../utils/scan'
import MobileTabbar from '../shared/MobileTabbar.vue'

const loading = ref(false)
const errorMessage = ref('')
const scanValue = ref('')
const scannedCodes = ref<string[]>([])
const rows = ref<InventoryRow[]>([])

function handleScan(result: ScanResult) {
  scannedCodes.value.push(result.value)
  success(`已识别${typeLabel(result.type)}：${result.value}`)
}

function notifyPrepared(action: string) {
  success(`${action}已进入扫码查询模式`)
}

function focusInventorySearch() {
  success('请扫描库位、产品、托盘、箱码或 SN 查询库存')
}

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listInventory({ pageSize: 8 })
    rows.value = data.items || []
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
    UNKNOWN: '未知条码'
  }[type]
}

onMounted(load)
</script>
