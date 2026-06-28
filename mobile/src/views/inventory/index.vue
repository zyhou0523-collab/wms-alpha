<template>
  <main class="page with-tab">
    <van-nav-bar title="库存作业" fixed placeholder />
    <ScanInput v-model="scanValue" label="库存码" placeholder="扫描库位、托盘、箱码或 SN" @confirm="handleScan" />

    <section class="quick-row">
      <van-button type="primary" block>库存移动</van-button>
      <van-button block>库存盘点</van-button>
      <van-button block>SN 查询</van-button>
    </section>

    <section class="section-title">库存查询</section>
    <van-cell-group inset>
      <van-cell v-for="row in rows" :key="row.id" :title="row.product_code || '-'" :label="row.product_name">
        <template #value>
          <div class="inventory-value">
            <strong>{{ row.available_qty ?? '-' }}</strong>
            <span>{{ row.location_code }}</span>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-empty v-if="!loading && rows.length === 0" description="暂无库存数据" />
    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { InventoryRow, listInventory } from '../../api/inventory'
import ScanInput from '../../components/ScanInput.vue'
import MobileTabbar from '../shared/MobileTabbar.vue'

const loading = ref(false)
const scanValue = ref('')
const rows = ref<InventoryRow[]>([])

function handleScan(value: string) {
  showToast(`已扫描：${value}`)
}

onMounted(async () => {
  loading.value = true
  try {
    const data = await listInventory({ pageSize: 8 })
    rows.value = data.items || []
  } finally {
    loading.value = false
  }
})
</script>
