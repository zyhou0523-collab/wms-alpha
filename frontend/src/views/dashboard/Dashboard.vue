<template>
  <div>
    <el-row :gutter="12">
      <el-col v-for="card in cards" :key="card.key" :xs="12" :sm="8" :md="6" :lg="6">
        <div class="kpi-card">
          <div class="kpi-label">{{ card.label }}</div>
          <div class="kpi-value">{{ card.value }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="dashboard-row">
      <el-col :span="12">
        <el-card shadow="never" class="page-card">
          <template #header>仓库类型库存分布</template>
          <div v-for="item in summary.warehouseDistribution || []" :key="item.warehouse_type" class="bar-row">
            <span>{{ item.warehouse_type }}</span>
            <el-progress :percentage="percent(item.total_qty)" :stroke-width="12" />
            <strong>{{ item.total_qty }}</strong>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="page-card">
          <template #header>低库存预警</template>
          <el-table :data="summary.lowStockRows || []" height="280">
            <el-table-column prop="product_code" label="产品编码" />
            <el-table-column prop="product_name" label="产品名称" />
            <el-table-column prop="available_qty" label="可用" width="80" />
            <el-table-column prop="safety_stock" label="安全库存" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="page-card dashboard-row">
      <template #header>
        <div class="header-line">
          <span>接口异常提醒</span>
          <el-button type="primary" @click="load">刷新看板</el-button>
        </div>
      </template>
      <el-table :data="summary.recentInterfaceErrors || []" border>
        <el-table-column prop="interface_name" label="接口名称" />
        <el-table-column prop="business_doc_no" label="业务单号" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'FAILED' ? 'danger' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="异常信息" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { dashboardSummaryApi } from '../../api/services'

const summary = ref<any>({ kpis: {} })
const cards = computed(() => [
  { key: 'totalQty', label: '总库存数量', value: summary.value.kpis?.totalQty ?? 0 },
  { key: 'availableQty', label: '可用库存', value: summary.value.kpis?.availableQty ?? 0 },
  { key: 'allocatedQty', label: '已分配库存', value: summary.value.kpis?.allocatedQty ?? 0 },
  { key: 'frozenQty', label: '冻结库存', value: summary.value.kpis?.frozenQty ?? 0 },
  { key: 'lowStockSku', label: '安全库存低位 SKU', value: summary.value.kpis?.lowStockSku ?? 0 },
  { key: 'agedSku', label: '长库龄 SKU', value: summary.value.kpis?.agedSku ?? 0 },
  { key: 'interfaceFailed', label: '接口失败数', value: summary.value.kpis?.interfaceFailed ?? 0 },
  { key: 'todayInboundQty', label: '今日入库数', value: summary.value.kpis?.todayInboundQty ?? 0 }
])

onMounted(load)

async function load() {
  summary.value = await dashboardSummaryApi()
}

function percent(value: number) {
  const max = Math.max(...(summary.value.warehouseDistribution || []).map((item: any) => Number(item.total_qty || 0)), 1)
  return Math.round((Number(value || 0) / max) * 100)
}
</script>

<style scoped>
.dashboard-row {
  margin-top: 12px;
}

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 64px;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

.header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

