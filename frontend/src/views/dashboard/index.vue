<template>
  <div class="dashboard-page">
    <el-card shadow="never" class="page-card filter-card">
      <div class="filter-line">
        <div>
          <div class="page-title">全局库存看板</div>
          <div class="page-subtitle">按集团、地区部、仓库三个层级查看库存、预警和作业态势</div>
        </div>
        <div class="filter-actions">
          <el-tabs v-model="activeLevel" class="level-tabs" @tab-change="onLevelChange">
            <el-tab-pane label="集团层" name="GROUP" />
            <el-tab-pane label="地区部层" name="REGION" />
            <el-tab-pane label="仓库层" name="WAREHOUSE" />
          </el-tabs>
          <el-select v-model="filters.region" clearable placeholder="区域" class="filter-select" @change="load">
            <el-option v-for="region in regionOptions" :key="region" :label="region" :value="region" />
          </el-select>
          <el-select v-model="filters.warehouseId" clearable filterable placeholder="仓库" class="filter-select" @change="load">
            <el-option
              v-for="warehouse in warehouseOptions"
              :key="warehouse.warehouseId"
              :label="warehouse.warehouseName"
              :value="warehouse.warehouseId"
            />
          </el-select>
          <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="12" class="section-row">
      <el-col v-for="card in kpiCards" :key="card.key" :xs="12" :sm="8" :md="6" :lg="4">
        <div class="dashboard-kpi" :class="card.tone" @click="handleKpiClick(card)">
          <div class="kpi-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-number">{{ formatNumber(card.value) }}<span>{{ card.unit }}</span></div>
            <div class="kpi-tip">{{ card.tip }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="warning-strip">
      <el-alert :title="safetyAlert" type="warning" show-icon :closable="false" />
      <el-alert :title="agingAlert" type="error" show-icon :closable="false" />
      <el-alert :title="sapAlert" type="info" show-icon :closable="false" />
    </div>

    <el-row :gutter="12" class="section-row">
      <el-col :xs="24" :lg="7">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>库存结构</template>
          <div class="structure-box">
            <div class="donut" :style="ringStyle">
              <div class="donut-center">
                <strong>{{ formatNumber(structureTotal) }}</strong>
                <span>总量</span>
              </div>
            </div>
            <div class="legend-list">
              <div v-for="item in structure" :key="item.name" class="legend-row">
                <span class="legend-dot" :style="{ backgroundColor: item.color }" />
                <span>{{ item.name }}</span>
                <strong>{{ formatNumber(item.value) }}</strong>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>区域 / 仓库分布</template>
          <div class="warehouse-map">
            <div v-for="item in warehouseMap" :key="item.warehouseCode" class="warehouse-point-card">
              <div class="point-head">
                <span class="map-dot" :class="{ alert: Number(item.warningCount || 0) > 0 }" />
                <strong>{{ item.warehouseName }}</strong>
              </div>
              <div class="point-meta">{{ item.country }} · {{ item.city }} · {{ item.warehouseType }}</div>
              <div class="point-stats">
                <span>库存 {{ formatNumber(item.stockQty) }}</span>
                <el-tag size="small" :type="Number(item.warningCount || 0) > 0 ? 'warning' : 'success'">
                  预警 {{ item.warningCount || 0 }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="7">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>安全库存预警</template>
          <el-table :data="safetyWarnings" height="300">
            <el-table-column prop="productCode" label="产品编码" min-width="130" />
            <el-table-column prop="warehouseName" label="仓库" min-width="120" />
            <el-table-column prop="shortageQty" label="缺口" width="72" />
            <el-table-column prop="warningLevel" label="等级" width="76">
              <template #default="{ row }">
                <el-tag size="small" :type="warningTag(row.warningLevel)">{{ levelLabel(row.warningLevel) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="section-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>近 6 个月入出库趋势</template>
          <div class="line-chart">
            <svg viewBox="0 0 560 210" preserveAspectRatio="none">
              <line v-for="y in 5" :key="y" x1="20" :y1="y * 36" x2="540" :y2="y * 36" class="grid-line" />
              <polyline :points="trendPoints(trend.inboundQty)" class="trend-line inbound" />
              <polyline :points="trendPoints(trend.outboundQty)" class="trend-line outbound" />
              <polyline :points="trendPoints(trend.stockBalance)" class="trend-line balance" />
            </svg>
            <div class="line-axis">
              <span v-for="month in trend.xAxis || []" :key="month">{{ String(month).slice(5) }}</span>
            </div>
            <div class="chart-legend">
              <span><i class="legend-dot inbound" />入库数量</span>
              <span><i class="legend-dot outbound" />出库数量</span>
              <span><i class="legend-dot balance" />库存余额</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>仓库作业分布</template>
          <div class="operation-bars">
            <div v-for="item in warehouseOperations" :key="item.warehouseCode" class="operation-row">
              <div class="operation-name">{{ item.warehouseName }}</div>
              <div class="bar-stack">
                <span class="bar inbound" :style="{ width: barWidth(item.inboundQty) }" />
                <span class="bar outbound" :style="{ width: barWidth(item.outboundQty) }" />
                <span class="bar count" :style="{ width: barWidth(item.countQty) }" />
                <span class="bar exception" :style="{ width: barWidth(item.exceptionQty) }" />
              </div>
              <div class="operation-total">{{ totalOperation(item) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="section-row">
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>TOP5 安全库存预警产品</template>
          <el-table :data="safetyWarnings.slice(0, 5)" height="260">
            <el-table-column type="index" label="TOP" width="64" />
            <el-table-column prop="productCode" label="产品编码" min-width="150" />
            <el-table-column prop="productName" label="产品名称" min-width="170" show-overflow-tooltip />
            <el-table-column prop="availableQty" label="当前库存" width="100" />
            <el-table-column prop="safetyStockQty" label="安全库存" width="100" />
            <el-table-column prop="shortageQty" label="缺口" width="80" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>TOP5 长库龄产品</template>
          <el-table :data="agingWarnings.slice(0, 5)" height="260">
            <el-table-column type="index" label="TOP" width="64" />
            <el-table-column prop="productCode" label="产品编码" min-width="150" />
            <el-table-column prop="warehouseName" label="仓库" min-width="130" />
            <el-table-column prop="batchNo" label="批次 / SN" min-width="130" />
            <el-table-column prop="agingDays" label="库龄天数" width="100" />
            <el-table-column prop="thresholdDays" label="阈值" width="80" />
            <el-table-column prop="batteryFlag" label="电池类" width="80" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { dashboardApi, DashboardFilter } from '../../api/dashboard'

const router = useRouter()
const loading = ref(false)
const activeLevel = ref<'GROUP' | 'REGION' | 'WAREHOUSE'>('GROUP')
const filters = reactive<DashboardFilter>({ level: 'GROUP', region: '', warehouseId: '' })
const summary = ref<any>({})
const structure = ref<any[]>([])
const warehouseMap = ref<any[]>([])
const trend = ref<any>({ xAxis: [], inboundQty: [], outboundQty: [], stockBalance: [] })
const warehouseOperations = ref<any[]>([])
const safetyWarnings = ref<any[]>([])
const agingWarnings = ref<any[]>([])

const kpiCards = computed(() => [
  { key: 'totalStockQty', label: '总库存数量', value: summary.value.totalStockQty || 0, unit: 'PCS', tip: '当前筛选范围', icon: 'Box', tone: 'blue', path: '/inventory/list' },
  { key: 'availableStockQty', label: '可用库存数量', value: summary.value.availableStockQty || 0, unit: 'PCS', tip: '可直接作业库存', icon: 'CircleCheck', tone: 'green', path: '/inventory/list' },
  { key: 'allocatedStockQty', label: '已分配库存数量', value: summary.value.allocatedStockQty || 0, unit: 'PCS', tip: '已锁定待出库', icon: 'Connection', tone: 'cyan', path: '/outbound/shipping-orders' },
  { key: 'frozenStockQty', label: '冻结库存数量', value: summary.value.frozenStockQty || 0, unit: 'PCS', tip: '冻结 / 质控关注', icon: 'Lock', tone: 'orange', path: '/inventory/list' },
  { key: 'safetyWarningSkuCount', label: '安全库存预警 SKU', value: summary.value.safetyWarningSkuCount || 0, unit: '个', tip: '低于安全库存', icon: 'Warning', tone: 'red', path: '/inventory/list' },
  { key: 'agingWarningSkuCount', label: '长库龄 / 呆滞 SKU', value: summary.value.agingWarningSkuCount || 0, unit: '个', tip: '超过库龄阈值', icon: 'Timer', tone: 'purple', path: '/inventory/list' }
])

const regionOptions = computed(() => {
  const values = warehouseMap.value.map((item) => item.region).filter(Boolean)
  return Array.from(new Set(values))
})

const warehouseOptions = computed(() => warehouseMap.value)

const structureTotal = computed(() => structure.value.reduce((sum, item) => sum + Number(item.value || 0), 0))

const ringStyle = computed(() => {
  if (!structureTotal.value) {
    return { background: '#eef2f7' }
  }
  let start = 0
  const parts = structure.value.map((item, index) => {
    const percent = (Number(item.value || 0) / structureTotal.value) * 100
    const end = start + percent
    const color = item.color || ['#22c55e', '#3b82f6', '#f97316', '#eab308', '#ef4444'][index]
    const segment = `${color} ${start}% ${end}%`
    start = end
    return segment
  })
  return { background: `conic-gradient(${parts.join(', ')})` }
})

const safetyAlert = computed(() => `安全库存预警：当前有 ${summary.value.safetyWarningSkuCount || 0} 个产品低于安全库存，请及时补货。`)
const agingAlert = computed(() => `长库龄预警：当前有 ${summary.value.agingWarningSkuCount || 0} 个批次 / SKU 超过库龄阈值。`)
const sapAlert = computed(() => `SAP 回传异常：当前有 ${summary.value.sapFailedCount || 0} 条 SAP 回传失败记录。`)

const trendMax = computed(() => {
  const values = [...(trend.value.inboundQty || []), ...(trend.value.outboundQty || []), ...(trend.value.stockBalance || [])].map(Number)
  return Math.max(...values, 1)
})

const operationMax = computed(() => {
  const values = warehouseOperations.value.flatMap((item) => [
    Number(item.inboundQty || 0),
    Number(item.outboundQty || 0),
    Number(item.countQty || 0),
    Number(item.exceptionQty || 0)
  ])
  return Math.max(...values, 1)
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    filters.level = activeLevel.value
    const params = cleanParams(filters)
    const [summaryData, structureData, mapData, trendData, operationData, safetyData, agingData] = await Promise.all([
      dashboardApi.summary(params),
      dashboardApi.inventoryStructure(params),
      dashboardApi.warehouseMap(params),
      dashboardApi.inoutTrend(params),
      dashboardApi.warehouseOperations(params),
      dashboardApi.safetyWarnings({ ...params, limit: 10 }),
      dashboardApi.agingWarnings({ ...params, limit: 10 })
    ])
    summary.value = summaryData
    structure.value = structureData
    warehouseMap.value = mapData
    trend.value = trendData
    warehouseOperations.value = operationData
    safetyWarnings.value = safetyData
    agingWarnings.value = agingData
  } finally {
    loading.value = false
  }
}

function onLevelChange() {
  if (activeLevel.value === 'GROUP') {
    filters.region = ''
    filters.warehouseId = ''
  }
  if (activeLevel.value === 'REGION') {
    filters.warehouseId = ''
  }
  load()
}

function cleanParams(source: DashboardFilter): DashboardFilter {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== '' && value !== undefined && value !== null)) as DashboardFilter
}

function handleKpiClick(card: any) {
  if (card.path) {
    router.push(card.path)
    return
  }
  ElMessage.info(`${card.label}：${formatNumber(card.value)}${card.unit}`)
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString()
}

function warningTag(level: string) {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  return 'info'
}

function levelLabel(level: string) {
  return ({ HIGH: '高', MEDIUM: '中', LOW: '低' } as Record<string, string>)[level] || level
}

function trendPoints(values: number[] = []) {
  if (!values.length) return ''
  const width = 520
  const height = 170
  const left = 20
  const top = 18
  const step = values.length === 1 ? width : width / (values.length - 1)
  return values.map((value, index) => {
    const x = left + index * step
    const y = top + height - (Number(value || 0) / trendMax.value) * height
    return `${x},${y}`
  }).join(' ')
}

function barWidth(value: unknown) {
  const percent = Math.max(4, Math.round((Number(value || 0) / operationMax.value) * 100))
  return `${percent}%`
}

function totalOperation(item: any) {
  return Number(item.inboundQty || 0) + Number(item.outboundQty || 0) + Number(item.countQty || 0) + Number(item.exceptionQty || 0)
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-card {
  border-radius: 6px;
}

.filter-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.page-subtitle {
  margin-top: 6px;
  color: #6b7280;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.level-tabs {
  min-width: 280px;
}

.filter-select {
  width: 150px;
}

.section-row {
  width: 100%;
}

.dashboard-kpi {
  min-height: 116px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 14px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
}

.dashboard-kpi:hover {
  border-color: #93c5fd;
  box-shadow: 0 8px 22px rgba(15, 23, 42, .08);
}

.kpi-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.dashboard-kpi.blue .kpi-icon { color: #1677ff; background: #eaf3ff; }
.dashboard-kpi.green .kpi-icon { color: #16a34a; background: #eafaf0; }
.dashboard-kpi.cyan .kpi-icon { color: #0891b2; background: #ecfeff; }
.dashboard-kpi.orange .kpi-icon { color: #f97316; background: #fff7ed; }
.dashboard-kpi.red .kpi-icon { color: #dc2626; background: #fef2f2; }
.dashboard-kpi.purple .kpi-icon { color: #7c3aed; background: #f5f3ff; }

.kpi-body {
  min-width: 0;
}

.kpi-label {
  color: #6b7280;
  font-size: 13px;
}

.kpi-number {
  margin-top: 8px;
  font-size: 25px;
  line-height: 1;
  font-weight: 700;
  color: #111827;
}

.kpi-number span {
  margin-left: 4px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.kpi-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #9ca3af;
}

.warning-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.panel-card {
  height: 100%;
}

.structure-box {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.donut {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.donut-center {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px #e5e7eb;
}

.donut-center strong {
  font-size: 22px;
}

.donut-center span {
  color: #6b7280;
  font-size: 12px;
}

.legend-list {
  flex: 1;
  min-width: 150px;
}

.legend-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  color: #4b5563;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.warehouse-map {
  min-height: 300px;
  padding: 10px;
  border-radius: 6px;
  background:
    linear-gradient(135deg, rgba(22, 119, 255, .08), rgba(34, 197, 94, .08)),
    radial-gradient(circle at 20% 30%, rgba(22, 119, 255, .12), transparent 26%),
    radial-gradient(circle at 75% 58%, rgba(34, 197, 94, .12), transparent 28%);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.warehouse-point-card {
  background: rgba(255, 255, 255, .92);
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}

.point-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, .16);
}

.map-dot.alert {
  background: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, .16);
}

.point-meta {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
}

.point-stats {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.line-chart {
  height: 300px;
}

.line-chart svg {
  width: 100%;
  height: 220px;
}

.grid-line {
  stroke: #eef2f7;
  stroke-width: 1;
}

.trend-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-line.inbound { stroke: #22c55e; }
.trend-line.outbound { stroke: #f97316; }
.trend-line.balance { stroke: #1677ff; }

.line-axis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  color: #6b7280;
  font-size: 12px;
  text-align: center;
}

.chart-legend {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  justify-content: center;
  color: #4b5563;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chart-legend .legend-dot.inbound { background: #22c55e; }
.chart-legend .legend-dot.outbound { background: #f97316; }
.chart-legend .legend-dot.balance { background: #1677ff; }

.operation-bars {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
}

.operation-row {
  display: grid;
  grid-template-columns: 130px 1fr 42px;
  align-items: center;
  gap: 10px;
}

.operation-name {
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-stack {
  height: 16px;
  display: flex;
  gap: 2px;
  align-items: center;
}

.bar {
  display: inline-block;
  height: 100%;
  min-width: 4px;
  border-radius: 3px;
}

.bar.inbound { background: #22c55e; }
.bar.outbound { background: #f97316; }
.bar.count { background: #1677ff; }
.bar.exception { background: #ef4444; }

.operation-total {
  text-align: right;
  color: #111827;
  font-weight: 600;
}

@media (max-width: 1180px) {
  .filter-line {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-actions {
    justify-content: flex-start;
  }

  .warning-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .warehouse-map {
    grid-template-columns: 1fr;
  }

  .structure-box {
    flex-direction: column;
  }
}
</style>
