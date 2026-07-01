<template>
  <main class="page with-tab">
    <van-nav-bar title="库存移库" fixed placeholder left-arrow @click-left="router.back()" />
    <WarehouseSwitcher @changed="load" />

    <section class="pda-form-card">
      <ScanInput
        v-model="sourceCode"
        label="源库位"
        placeholder="扫描源库位 / SN / 托盘 / 箱码"
        :accepted-types="['LOCATION', 'SN', 'PALLET', 'BOX', 'UNKNOWN']"
        :clear-on-scan="false"
      />
      <ScanInput
        v-model="targetCode"
        label="目标库位"
        placeholder="扫描目标库位"
        :accepted-types="['LOCATION', 'UNKNOWN']"
        :clear-on-scan="false"
      />
      <van-field v-model.number="moveQty" label="移动数量" type="number" placeholder="输入移动数量" />
    </section>

    <section class="section-title">可移动库存</section>
    <PageState
      v-if="loading || errorMessage || rows.length === 0"
      :loading="loading"
      :error="errorMessage"
      :empty="!loading && !errorMessage && rows.length === 0"
      empty-text="暂无可移动库存"
      @retry="load"
    />

    <section v-else class="mobile-task-board">
      <article v-for="row in rows" :key="row.id" class="mobile-task-card">
        <div>
          <h3>{{ row.product_code }}</h3>
          <p>{{ row.product_name }}</p>
          <p>{{ row.warehouse_name }} / {{ row.location_code }} / 可用 {{ row.available_qty }}</p>
          <div class="compact-action-row">
            <van-button type="primary" size="small" @click="confirmMove(row)">确认移动</van-button>
          </div>
        </div>
        <strong>{{ row.available_qty }}</strong>
      </article>
    </section>

    <MobileTabbar />
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
const sourceCode = ref('')
const targetCode = ref('')
const moveQty = ref(1)
const rows = ref<InventoryRow[]>([])

onMounted(load)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await listInventory({ pageSize: 20 })
    rows.value = data.items || []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '移库库存加载失败'
  } finally {
    loading.value = false
  }
}

async function confirmMove(row: InventoryRow) {
  const qty = Number(moveQty.value || 0)
  if (!sourceCode.value.trim()) {
    fail('请先扫描源库位、SN、托盘或箱码')
    return
  }
  if (!targetCode.value.trim()) {
    fail('请先扫描目标库位')
    return
  }
  if (qty <= 0 || qty > Number(row.available_qty || 0)) {
    fail('移动数量必须大于 0 且不能超过可用库存')
    return
  }
  await confirmAction(`确认移动 ${row.product_code} 数量 ${qty} 到 ${targetCode.value}？`, '移库确认')
  success(`移库完成：${row.product_code} -> ${targetCode.value}`)
}
</script>
