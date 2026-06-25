<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div>
        <div class="dashboard-title-row">
          <h1>全球新能源仓储数据看板</h1>
          <el-radio-group v-model="activeLevel" size="small" class="layer-switch" @change="onLayerChange">
            <el-radio-button label="GROUP">集团层</el-radio-button>
            <el-radio-button label="REGION">地区部层</el-radio-button>
            <el-radio-button label="WAREHOUSE">仓库层</el-radio-button>
          </el-radio-group>
        </div>
        <p>按全球、地区部、仓库三层穿透查看库存分布、预警和作业态势。</p>
      </div>
      <div class="hero-actions">
        <el-select v-model="selectedRegionCode" clearable placeholder="地区部" class="hero-select" @change="onRegionSelect">
          <el-option v-for="region in regionOptions" :key="region.code" :label="region.name" :value="region.code" />
        </el-select>
        <el-select v-model="selectedWarehouseCode" clearable filterable placeholder="仓库" class="hero-select" @change="onWarehouseSelect">
          <el-option v-for="warehouse in allWarehouses" :key="warehouse.code" :label="warehouse.name" :value="warehouse.code" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="load">刷新</el-button>
        <span class="update-time">更新时间：{{ lastUpdatedText }}</span>
      </div>
    </section>

    <section class="kpi-grid">
      <button v-for="card in kpiCards" :key="card.key" class="kpi-card" :class="card.tone" @click="handleKpiClick(card.path)">
        <span class="kpi-icon">
          <el-icon><component :is="card.icon" /></el-icon>
        </span>
        <span class="kpi-text">
          <span class="kpi-label">{{ card.label }}</span>
          <strong>{{ formatNumber(card.value) }}</strong>
          <span class="kpi-meta">{{ card.unit }} · {{ card.tip }}</span>
        </span>
      </button>
    </section>

    <section class="warning-grid">
      <div class="bi-card aging-card">
        <div class="card-title danger">
          <el-icon><Warning /></el-icon>
          呆滞库存专区（库龄分布）
        </div>
        <div class="aging-band">
          <span v-for="bucket in agingBuckets" :key="bucket.name" :style="{ width: `${bucket.value}%`, backgroundColor: bucket.color }" />
        </div>
        <div class="aging-legend">
          <span v-for="bucket in agingBuckets" :key="bucket.name">
            <i :style="{ backgroundColor: bucket.color }" />
            {{ bucket.name }}
          </span>
        </div>
        <div class="aging-amounts">
          <div>
            <span>超360天呆滞金额</span>
            <strong>￥{{ formatNumber(Math.round(currentStats.staleAmount * 0.42)) }} 万</strong>
          </div>
          <div>
            <span>180-360天呆滞金额</span>
            <strong>￥{{ formatNumber(Math.round(currentStats.staleAmount * 0.58)) }} 万</strong>
          </div>
        </div>
      </div>

      <div class="bi-card safety-card">
        <div class="safety-title">
          <span>
            <el-icon><Bell /></el-icon>
            安全库存低位预警专区
          </span>
          <strong>当前缺口 {{ formatNumber(currentStats.safetyShortage) }} PCS</strong>
        </div>
        <el-table :data="safetyRows" height="118" size="small" class="compact-table">
          <el-table-column type="index" label="序号" width="58" />
          <el-table-column prop="productCode" label="产品ID" min-width="128" />
          <el-table-column prop="warehouseName" label="仓库" min-width="130" />
          <el-table-column prop="availableQty" label="库存量" width="86" />
          <el-table-column prop="inTransitQty" label="在途量" width="82" />
          <el-table-column prop="pendingShipQty" label="待发货量" width="92" />
          <el-table-column prop="shortageQty" label="库存缺口" width="96">
            <template #default="{ row }">
              <span class="negative">-{{ formatNumber(row.shortageQty) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <section class="dashboard-main-grid">
      <div class="left-stack">
        <div class="bi-card product-card">
          <div class="card-title">产品线库存结构</div>
          <div class="donut-wrap">
            <div class="donut" :style="productDonutStyle">
              <div class="donut-center">
                <span>总库存</span>
                <strong>{{ formatTenThousand(currentStats.inventoryQty) }}万</strong>
              </div>
            </div>
          </div>
          <div class="product-legend">
            <span v-for="item in scaledProductStructure" :key="item.name">
              <i :style="{ backgroundColor: item.color }" />
              {{ item.name }}
            </span>
          </div>
        </div>

        <div class="bi-card top-country-card">
          <div class="card-title">TOP5 销量国家</div>
          <div class="country-bars">
            <div v-for="country in scaledTopCountries" :key="country.country" class="country-row">
              <span>{{ country.country }}</span>
              <div class="country-track">
                <i :style="{ width: `${country.percent}%` }" />
              </div>
              <strong>{{ formatNumber(country.salesQty) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="bi-card map-card">
        <div class="map-header">
          <div>
            <div class="card-title">全球库存分布穿透地图</div>
            <div class="map-breadcrumb">
              <button v-for="(item, index) in breadcrumbItems" :key="item.code" @click="goBreadcrumb(index)">
                {{ item.name }}
              </button>
            </div>
          </div>
          <div class="map-tools">
            <span>当前层级：{{ activeLevelLabel }}</span>
            <el-button size="small" text type="primary" :disabled="activeLevel === 'GROUP'" @click="goBreadcrumb(Math.max(0, breadcrumbItems.length - 2))">
              返回上级
            </el-button>
          </div>
        </div>

        <div class="world-map" @mouseleave="hoveredNode = null">
          <svg viewBox="0 0 1000 520" role="img" aria-label="全球库存分布地图">
            <path
              v-for="land in worldMapPaths"
              :key="land.name"
              class="land"
              :d="land.d"
            />
            <g
              v-for="node in visibleMapNodes"
              :key="node.code"
              class="map-node"
              :class="[node.status.toLowerCase(), node.type === 'CENTRAL_WAREHOUSE' ? 'central' : '', { selected: selectedNode?.code === node.code }]"
              :transform="`translate(${node.x * 10}, ${node.y * 5.2})`"
              tabindex="0"
              role="button"
              @click="drillNode(node)"
              @keyup.enter="drillNode(node)"
              @mouseenter="hoveredNode = node"
            >
              <circle class="node-halo" :r="nodeRadius(node) + 9" />
              <circle class="node-dot" :r="nodeRadius(node)" />
              <text x="12" y="-10">{{ node.name }}</text>
            </g>
          </svg>

          <div v-if="hoveredNode" class="map-tooltip" :style="{ left: `${hoveredNode.x}%`, top: `${hoveredNode.y}%` }">
            <strong>{{ hoveredNode.name }}</strong>
        <span>节点类型：{{ nodeTypeLabel(hoveredNode) }}</span>
            <span v-if="hoveredNode.type !== 'REGION'">仓库类型：{{ hoveredNode.warehouseType || '区域仓' }}</span>
            <span>国家 / 城市：{{ hoveredNode.country }} · {{ hoveredNode.city }}</span>
            <span>库存数量：{{ formatNumber(hoveredNode.inventoryQty) }} PCS</span>
            <span>库存金额：{{ formatNumber(hoveredNode.inventoryAmount) }} 万元</span>
            <span>仓库数量：{{ hoveredNode.warehouseCount }}</span>
            <span>SKU 数：{{ formatNumber(hoveredNode.skuCount) }}</span>
            <span>货主数：{{ formatNumber(hoveredNode.owners) }}</span>
            <span>预警数量：{{ hoveredNode.warningCount }}</span>
            <span>长库龄预警：{{ formatNumber(hoveredNode.staleQty) }} PCS</span>
            <span>异常数量：{{ hoveredNode.exceptionCount }}</span>
          </div>

          <div class="map-hint">
            <el-icon><Location /></el-icon>
            点击地图节点可下钻，图表与 KPI 会同步刷新
          </div>

          <div class="logistics-status">
            <strong>全球物流节点状态</strong>
            <span><i class="normal" />正常运转节点：{{ logisticsStatus.normal }}</span>
            <span><i class="warning" />拥堵预警节点：{{ logisticsStatus.warning }}</span>
            <span><i class="blocked" />异常中断节点：{{ logisticsStatus.blocked }}</span>
          </div>
        </div>
      </div>

      <div class="right-stack">
        <div class="bi-card trend-card">
          <div class="card-title">近半年销售和售后出库情况</div>
          <svg class="line-chart" viewBox="0 0 420 220" preserveAspectRatio="none">
            <line v-for="y in 5" :key="y" x1="36" :y1="y * 35" x2="400" :y2="y * 35" class="grid-line" />
            <polyline :points="salesLinePoints('salesQty')" class="sales-line" />
            <polyline :points="salesLinePoints('afterSalesQty')" class="after-line" />
            <circle v-for="point in salesDots('salesQty')" :key="`s-${point.x}`" :cx="point.x" :cy="point.y" r="4" class="sales-dot" />
            <circle v-for="point in salesDots('afterSalesQty')" :key="`a-${point.x}`" :cx="point.x" :cy="point.y" r="4" class="after-dot" />
          </svg>
          <div class="chart-axis">
            <span v-for="row in scopedTrend" :key="row.month">{{ row.month.slice(5) }}</span>
          </div>
          <div class="mini-legend">
            <span><i class="after" />售后量</span>
            <span><i class="sales" />销售量</span>
          </div>
        </div>

        <div class="bi-card regional-card">
          <div class="card-title">各地区部库存分布</div>
          <div class="stacked-bars">
            <div v-for="row in scopedRegionalDistribution" :key="row.regionName" class="stacked-row">
              <span>{{ row.regionName }}</span>
              <div class="stacked-track">
                <i class="sales" :style="{ width: `${regionalWidth(row.salesQty)}%` }" />
                <i class="faulty" :style="{ width: `${regionalWidth(row.faultyQty)}%` }" />
                <i class="after" :style="{ width: `${regionalWidth(row.afterSalesQty)}%` }" />
              </div>
            </div>
          </div>
          <div class="mini-legend">
            <span><i class="sales" />销售品</span>
            <span><i class="faulty" />故障品</span>
            <span><i class="after" />售后品</span>
          </div>
        </div>
      </div>
    </section>

    <section class="analysis-grid">
      <div class="bi-card analysis-card top-aging-card">
        <div class="card-title">TOP5 长库龄产品</div>
        <el-table :data="scopedTopAgingProducts" size="small" height="218" class="compact-table">
          <el-table-column prop="productCode" label="产品编码" min-width="150" />
          <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="warehouseName" label="仓库" min-width="130" show-overflow-tooltip />
          <el-table-column prop="agingDays" label="库龄" width="86">
            <template #default="{ row }">
              <span class="aging-days">{{ row.agingDays }} 天</span>
            </template>
          </el-table-column>
          <el-table-column prop="batteryFlag" label="电池" width="76">
            <template #default="{ row }">
              <el-tag size="small" :type="row.batteryFlag === '是' ? 'warning' : 'info'">{{ row.batteryFlag }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handlingSuggestion" label="处理建议" min-width="180" show-overflow-tooltip />
        </el-table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  agingBuckets,
  findRegion,
  findWarehouse,
  flattenWarehouses,
  getTopAgingProducts,
  globalMapNodes,
  regionMapNodes,
  productLineStructure,
  salesAfterSalesTrend,
  sumNodes,
  topSalesCountries,
  type DashboardLayer,
  type GlobalMapNode
} from './globalMapData'
import worldGeoJson from '../../assets/map/world.json'

const router = useRouter()
const loading = ref(false)
const activeLevel = ref<DashboardLayer>('GROUP')
const selectedRegionCode = ref('')
const selectedWarehouseCode = ref('')
const hoveredNode = ref<GlobalMapNode | null>(null)

const refreshStamp = ref('')

onMounted(load)

const regionOptions = computed(() => regionMapNodes)
const allWarehouses = computed(() => flattenWarehouses())
const selectedRegion = computed(() => findRegion(selectedRegionCode.value))
const selectedWarehouse = computed(() => findWarehouse(selectedWarehouseCode.value))
const globalStats = computed(() => sumNodes(globalMapNodes))
const worldMapPaths = computed(() => {
  const features = (worldGeoJson as any).features || []
  return features
    .map((feature: any, index: number) => ({
      name: feature.properties?.name || `land-${index}`,
      d: geometryToPath(feature.geometry)
    }))
    .filter((item: { d: string }) => item.d)
})

const currentStats = computed(() => {
  if (activeLevel.value === 'WAREHOUSE' && selectedWarehouse.value) return selectedWarehouse.value
  if (activeLevel.value === 'REGION' && selectedRegion.value) return selectedRegion.value
  return globalStats.value
})

const selectedNode = computed(() => {
  if (activeLevel.value === 'WAREHOUSE') return selectedWarehouse.value || null
  if (activeLevel.value === 'REGION') return selectedRegion.value || null
  return null
})

const visibleMapNodes = computed(() => {
  if (activeLevel.value === 'WAREHOUSE' && selectedWarehouse.value) return [selectedWarehouse.value]
  if (activeLevel.value === 'REGION') return selectedRegion.value?.children || []
  return globalMapNodes
})

const scopedWarehouses = computed(() => {
  if (activeLevel.value === 'WAREHOUSE' && selectedWarehouse.value) return [selectedWarehouse.value]
  if (activeLevel.value === 'REGION' && selectedRegion.value) return selectedRegion.value.children || []
  return flattenWarehouses()
})

const breadcrumbItems = computed(() => {
  const items = [{ code: 'GLOBAL', name: '全球' }]
  if (selectedRegion.value) items.push({ code: selectedRegion.value.code, name: selectedRegion.value.name })
  if (selectedWarehouse.value) items.push({ code: selectedWarehouse.value.code, name: selectedWarehouse.value.name })
  return items
})

const activeLevelLabel = computed(() => ({ GROUP: '全球', REGION: '地区部', WAREHOUSE: '仓库' }[activeLevel.value]))
const staleRate = computed(() => Math.round((currentStats.value.staleQty / Math.max(currentStats.value.inventoryQty, 1)) * 100))
const lastUpdatedText = computed(() => {
  if (!refreshStamp.value) return '2026-03-17 10:00'
  return new Date(refreshStamp.value).toLocaleString('zh-CN', { hour12: false })
})

const kpiCards = computed(() => [
  { key: 'globalQty', label: '全球总库存（PCS）', value: currentStats.value.inventoryQty, unit: 'PCS', tip: activeLevelLabel.value, icon: 'Box', tone: 'blue', path: '/inventory/list' },
  { key: 'globalAmount', label: '全球总库存金额（万元）', value: currentStats.value.inventoryAmount, unit: '万元', tip: `${currentStats.value.warehouseCount} 个节点`, icon: 'TrendCharts', tone: 'purple', path: '/inventory/list' },
  { key: 'turnover', label: '全球库存周转天（天）', value: currentStats.value.turnoverDays, unit: '天', tip: '滚动 180 天', icon: 'RefreshRight', tone: 'green', path: '' },
  { key: 'staleQty', label: '呆滞库存数量（PCS）', value: currentStats.value.staleQty, unit: 'PCS', tip: `占比 ${staleRate.value}%`, icon: 'Tickets', tone: 'red', path: '/inventory/list' },
  { key: 'staleAmount', label: '呆滞库存金额（万元）', value: currentStats.value.staleAmount, unit: '万元', tip: `预警 ${currentStats.value.warningCount} 个`, icon: 'Warning', tone: 'orange', path: '/inventory/list' }
])

const safetyRows = computed(() => {
  const productCodes = ['GT3-50KD1R11002', 'PACK-HV-280AH', 'INV-50K-001', 'BMS-MAIN-001', 'SP-CABLE-001', 'FUSE-500A-001']
  const productNames = ['工商业储能电池包', '高压电池簇', '50kW 储能逆变器', 'BMS 主控板', '高压线束', '熔断器']
  return scopedWarehouses.value
    .filter((warehouse) => warehouse.warningCount > 0 || warehouse.safetyShortage > 0)
    .sort((a, b) => b.safetyShortage - a.safetyShortage)
    .slice(0, 6)
    .map((warehouse, index) => ({
      productCode: productCodes[index % productCodes.length],
      productName: productNames[index % productNames.length],
      warehouseName: warehouse.name,
      availableQty: Math.max(12, Math.round(warehouse.availableQty / 1000)),
      inTransitQty: 18 + index * 9,
      pendingShipQty: 54 + index * 7,
      shortageQty: Math.max(24, Math.round(warehouse.safetyShortage / 100))
    }))
})

const productTotal = computed(() => productLineStructure.reduce((sum, row) => sum + row.value, 0))
const scaledProductStructure = computed(() => {
  const ratio = currentStats.value.inventoryQty / Math.max(globalStats.value.inventoryQty, 1)
  return productLineStructure.map((row) => ({ ...row, qty: Math.max(1, Math.round(row.value * ratio * 10000)) }))
})

const productDonutStyle = computed(() => {
  let start = 0
  const parts = productLineStructure.map((row) => {
    const end = start + (row.value / productTotal.value) * 100
    const segment = `${row.color} ${start}% ${end}%`
    start = end
    return segment
  })
  return { background: `conic-gradient(${parts.join(', ')})` }
})

const scaledTopCountries = computed(() => {
  const ratio = Math.max(0.36, currentStats.value.inventoryQty / Math.max(globalStats.value.inventoryQty, 1))
  const max = Math.max(...topSalesCountries.map((row) => row.salesQty), 1)
  return topSalesCountries.map((row) => ({ ...row, salesQty: Math.round(row.salesQty * ratio), percent: Math.round((row.salesQty / max) * 100) }))
})

const scopedTrend = computed(() => {
  const ratio = Math.max(0.42, currentStats.value.inventoryQty / Math.max(globalStats.value.inventoryQty, 1))
  return salesAfterSalesTrend.map((row) => ({ ...row, salesQty: Math.round(row.salesQty * ratio), afterSalesQty: Math.round(row.afterSalesQty * ratio) }))
})

const scopedRegionalDistribution = computed(() => visibleMapNodes.value.map((node) => ({
  regionName: node.name,
  salesQty: Math.max(8, Math.round(node.availableQty / 1000)),
  faultyQty: Math.max(3, Math.round(node.frozenQty / 700)),
  afterSalesQty: Math.max(5, Math.round(node.allocatedQty / 650))
})))
const scopedTopAgingProducts = computed(() => {
  if (activeLevel.value === 'WAREHOUSE' && selectedWarehouse.value) return getTopAgingProducts(selectedWarehouse.value.code)
  if (activeLevel.value === 'REGION' && selectedRegion.value) return getTopAgingProducts(selectedRegion.value.code)
  return getTopAgingProducts('GLOBAL')
})
const trendMax = computed(() => Math.max(...scopedTrend.value.flatMap((row) => [row.salesQty, row.afterSalesQty]), 1))
const regionalMax = computed(() => Math.max(...scopedRegionalDistribution.value.map((row) => row.salesQty + row.faultyQty + row.afterSalesQty), 1))

const logisticsStatus = computed(() => {
  const nodes = flattenWarehouses()
  return {
    normal: nodes.filter((node) => node.status === 'NORMAL').length,
    warning: nodes.filter((node) => node.status === 'WARNING').length,
    blocked: nodes.filter((node) => node.status === 'BLOCKED').length
  }
})

async function load() {
  loading.value = true
  try {
    refreshStamp.value = new Date().toISOString()
  } finally {
    loading.value = false
  }
}

function onLayerChange(value: DashboardLayer) {
  activeLevel.value = value
  if (value === 'GROUP') {
    selectedRegionCode.value = ''
    selectedWarehouseCode.value = ''
  }
  if (value === 'REGION' && !selectedRegionCode.value) {
    selectedRegionCode.value = regionOptions.value[0]?.code || ''
    selectedWarehouseCode.value = ''
  }
  if (value === 'WAREHOUSE' && !selectedWarehouseCode.value) {
    const firstWarehouse = selectedRegion.value?.children?.[0] || allWarehouses.value[0]
    selectedRegionCode.value = firstWarehouse?.regionCode || ''
    selectedWarehouseCode.value = firstWarehouse?.code || ''
  }
  load()
}

function onRegionSelect(value: string) {
  selectedWarehouseCode.value = ''
  activeLevel.value = value ? 'REGION' : 'GROUP'
  load()
}

function onWarehouseSelect(value: string) {
  const warehouse = findWarehouse(value)
  if (warehouse) {
    selectedRegionCode.value = warehouse.regionCode || ''
    activeLevel.value = 'WAREHOUSE'
  } else if (selectedRegionCode.value) {
    activeLevel.value = 'REGION'
  } else {
    activeLevel.value = 'GROUP'
  }
  load()
}

function drillNode(node: GlobalMapNode) {
  hoveredNode.value = node
  if (node.type === 'REGION') {
    selectedRegionCode.value = node.code
    selectedWarehouseCode.value = ''
    activeLevel.value = 'REGION'
  } else {
    selectedRegionCode.value = node.regionCode || ''
    selectedWarehouseCode.value = node.code
    activeLevel.value = 'WAREHOUSE'
  }
  load()
}

function goBreadcrumb(index: number) {
  if (index <= 0) {
    activeLevel.value = 'GROUP'
    selectedRegionCode.value = ''
    selectedWarehouseCode.value = ''
  } else if (index === 1) {
    activeLevel.value = 'REGION'
    selectedWarehouseCode.value = ''
  }
  load()
}

function handleKpiClick(path: string) {
  if (path) router.push(path)
}

function geometryToPath(geometry: any) {
  if (!geometry) return ''
  const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  return polygons
    .map((polygon: number[][][]) => polygon.map((ring) => ringToPath(ring)).join(' '))
    .join(' ')
}

function ringToPath(ring: number[][]) {
  return ring
    .map(([longitude, latitude], index) => {
      const { x, y } = projectCoordinate(longitude, latitude)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ') + ' Z'
}

function projectCoordinate(longitude: number, latitude: number) {
  return {
    x: Number((((longitude + 180) / 360) * 1000).toFixed(1)),
    y: Number((((90 - latitude) / 180) * 520).toFixed(1))
  }
}

function formatNumber(value: unknown) {
  return Number(value || 0).toLocaleString()
}

function formatTenThousand(value: unknown) {
  return Math.round(Number(value || 0) / 10000).toLocaleString()
}

function nodeRadius(node: GlobalMapNode) {
  const max = Math.max(...globalMapNodes.map((item) => item.inventoryQty), 1)
  const base = Math.max(7, Math.round((node.inventoryQty / max) * 13))
  return node.type === 'CENTRAL_WAREHOUSE' ? base + 4 : base
}

function nodeTypeLabel(node: GlobalMapNode) {
  if (node.type === 'CENTRAL_WAREHOUSE') return '集团中央仓'
  return node.type === 'REGION' ? '地区部 / 大区' : '仓库'
}

function salesLinePoints(key: 'salesQty' | 'afterSalesQty') {
  return salesDots(key).map((point) => `${point.x},${point.y}`).join(' ')
}

function salesDots(key: 'salesQty' | 'afterSalesQty') {
  const width = 340
  const left = 42
  const top = 22
  const height = 150
  const rows = scopedTrend.value
  const step = rows.length <= 1 ? width : width / (rows.length - 1)
  return rows.map((row, index) => ({
    x: left + step * index,
    y: top + height - (Number(row[key] || 0) / trendMax.value) * height
  }))
}

function regionalWidth(value: number) {
  return Math.max(4, Math.round((value / regionalMax.value) * 100))
}
</script>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 88px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #1f2a44;
}

.dashboard-hero,
.bi-card,
.kpi-card {
  border: 1px solid #dfe7f3;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, .06);
}

.dashboard-hero {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
}

.dashboard-title-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.dashboard-title-row h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.dashboard-hero p {
  margin: 5px 0 0;
  color: #60708f;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-select {
  width: 156px;
}

.update-time {
  color: #7b8baa;
  font-weight: 600;
  white-space: nowrap;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.kpi-card {
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.kpi-card.blue { background: linear-gradient(135deg, #eef6ff, #ffffff); }
.kpi-card.purple { background: linear-gradient(135deg, #f2f3ff, #ffffff); }
.kpi-card.green { background: linear-gradient(135deg, #ecfdf5, #ffffff); }
.kpi-card.red { background: linear-gradient(135deg, #fff1f2, #ffffff); }
.kpi-card.orange { background: linear-gradient(135deg, #fff7ed, #ffffff); }

.kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  background: rgba(22, 119, 255, .11);
  color: #1677ff;
}

.kpi-card.green .kpi-icon { background: rgba(16, 185, 129, .13); color: #10b981; }
.kpi-card.red .kpi-icon { background: rgba(239, 68, 68, .12); color: #ef4444; }
.kpi-card.orange .kpi-icon { background: rgba(249, 115, 22, .14); color: #f97316; }
.kpi-card.purple .kpi-icon { background: rgba(99, 102, 241, .12); color: #6366f1; }

.kpi-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label,
.kpi-meta {
  color: #62708d;
  font-size: 12px;
}

.kpi-text strong {
  color: #111827;
  font-size: 23px;
  line-height: 1;
}

.warning-grid {
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr);
  gap: 10px;
}

.bi-card {
  padding: 12px 14px;
  min-width: 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #172033;
}

.card-title.danger { color: #ef4444; }

.safety-card {
  border-color: #ffd591;
}

.safety-title {
  min-height: 36px;
  margin: -12px -14px 10px;
  padding: 8px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #ffd591;
  border-radius: 8px 8px 0 0;
  background: linear-gradient(90deg, #fff7e6, #fffbe6);
  color: #ad6800;
  font-weight: 800;
}

.safety-title span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.safety-title strong {
  font-size: 12px;
  color: #d46b08;
}

.aging-band {
  height: 16px;
  margin-top: 20px;
  border-radius: 5px;
  overflow: hidden;
  display: flex;
}

.aging-legend,
.mini-legend,
.product-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  justify-content: center;
  margin-top: 10px;
  color: #60708f;
  font-size: 12px;
}

.aging-legend i,
.mini-legend i,
.product-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.aging-amounts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.aging-amounts div {
  padding: 7px 10px;
  border-radius: 6px;
  background: #fff7ed;
  color: #f97316;
}

.aging-amounts span,
.aging-amounts strong {
  display: block;
}

.aging-amounts span {
  font-size: 12px;
}

.negative {
  color: #ef4444;
  font-weight: 800;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: .86fr 2.28fr .96fr;
  gap: 10px;
  align-items: stretch;
}

.left-stack,
.right-stack {
  display: grid;
  gap: 10px;
}

.product-card,
.trend-card,
.regional-card {
  min-height: 225px;
}

.top-country-card {
  min-height: 205px;
}

.map-card {
  min-height: 456px;
  padding: 12px 14px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.map-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #60708f;
  font-size: 12px;
}

.map-breadcrumb {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.map-breadcrumb button {
  border: 0;
  border-radius: 999px;
  background: #eef6ff;
  color: #1677ff;
  padding: 4px 10px;
  cursor: pointer;
}

.world-map {
  position: relative;
  height: 402px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 8px;
  background:
    radial-gradient(circle at 53% 52%, rgba(22, 119, 255, .08), transparent 32%),
    linear-gradient(180deg, #f4f8ff, #edf3f9);
}

.world-map svg {
  width: 100%;
  height: 100%;
}

.land {
  fill: #e5edf6;
  stroke: #bdcadb;
  stroke-width: .75;
  vector-effect: non-scaling-stroke;
}

.map-node {
  cursor: pointer;
  outline: none;
}

.node-halo {
  fill: rgba(22, 119, 255, .16);
  transition: fill .18s;
}

.node-dot {
  fill: #1677ff;
  stroke: #fff;
  stroke-width: 3;
  transition: transform .18s;
}

.map-node.normal .node-dot {
  fill: #16c784;
}

.map-node.warning .node-dot {
  fill: #f59e0b;
}

.map-node.blocked .node-dot {
  fill: #ef4444;
}

.map-node.central .node-dot {
  fill: #8b5cf6;
}

.map-node.central.warning .node-dot {
  fill: #f97316;
}

.map-node.central.blocked .node-dot {
  fill: #ef4444;
}

.map-node.central .node-halo {
  fill: rgba(139, 92, 246, .18);
}

.map-node:hover .node-halo,
.map-node.selected .node-halo {
  fill: rgba(22, 119, 255, .3);
}

.map-node.central:hover .node-halo,
.map-node.central.selected .node-halo {
  fill: rgba(249, 115, 22, .28);
}

.map-node text {
  fill: #334155;
  font-size: 12px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, .9);
  stroke-width: 4;
}

.map-tooltip {
  position: absolute;
  z-index: 5;
  min-width: 188px;
  transform: translate(14px, -50%);
  padding: 10px 12px;
  border: 1px solid #dbe6f6;
  border-radius: 8px;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 10px 28px rgba(15, 23, 42, .14);
  pointer-events: none;
}

.map-tooltip strong,
.map-tooltip span {
  display: block;
}

.map-tooltip strong {
  margin-bottom: 6px;
}

.map-tooltip span {
  color: #60708f;
  font-size: 12px;
  line-height: 1.75;
}

.map-hint {
  position: absolute;
  left: 22px;
  top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e7f0ff;
  color: #1677ff;
  font-weight: 700;
  font-size: 12px;
}

.logistics-status {
  position: absolute;
  left: 22px;
  bottom: 18px;
  display: grid;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .94);
  box-shadow: 0 6px 18px rgba(15, 23, 42, .1);
}

.logistics-status span {
  color: #60708f;
  font-size: 12px;
}

.logistics-status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}

.normal { background: #1677ff; }
.warning { background: #f59e0b; }
.blocked { background: #ef4444; }

.donut-wrap {
  height: 138px;
  display: grid;
  place-items: center;
}

.donut {
  width: 126px;
  height: 126px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.donut-center {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #fff;
  display: grid;
  place-items: center;
  align-content: center;
  box-shadow: inset 0 0 0 1px #e5edf7;
}

.donut-center span {
  color: #7b8baa;
  font-size: 12px;
}

.donut-center strong {
  font-size: 17px;
}

.country-bars {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.country-row {
  display: grid;
  grid-template-columns: 54px 1fr 48px;
  gap: 10px;
  align-items: center;
  color: #60708f;
}

.country-track,
.stacked-track {
  height: 15px;
  border-radius: 3px;
  background: #eef3f9;
  overflow: hidden;
}

.country-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #3b82f6;
}

.line-chart {
  width: 100%;
  height: 148px;
  margin-top: 8px;
}

.grid-line {
  stroke: #e9eff7;
  stroke-width: 1;
}

.sales-line,
.after-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sales-line { stroke: #3b82f6; }
.after-line { stroke: #16c784; }
.sales-dot { fill: #3b82f6; }
.after-dot { fill: #16c784; }

.chart-axis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  color: #8b99b4;
  font-size: 12px;
  text-align: center;
}

.mini-legend i.sales,
.stacked-track .sales,
.amount-track i { background: #3b82f6; }
.mini-legend i.after,
.stacked-track .after { background: #16c784; }
.mini-legend i.faulty,
.stacked-track .faulty { background: #ef4444; }

.stacked-bars {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.stacked-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px;
  align-items: center;
  color: #60708f;
  font-size: 12px;
}

.stacked-track {
  display: flex;
  gap: 2px;
}

.stacked-track i {
  height: 100%;
  min-width: 4px;
  display: block;
}

.analysis-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.analysis-card {
  min-height: 250px;
}

.top-aging-card {
  padding-bottom: 10px;
}

.aging-days {
  color: #ef4444;
  font-weight: 800;
}

.amount-list,
.rank-tabs {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.amount-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 108px 78px;
  gap: 10px;
  align-items: center;
}

.amount-row strong,
.amount-row span {
  display: block;
}

.amount-row span {
  margin-top: 2px;
  color: #7b8baa;
  font-size: 12px;
}

.amount-row em {
  color: #172033;
  font-style: normal;
  font-weight: 800;
  text-align: right;
}

.amount-track {
  height: 9px;
  border-radius: 999px;
  background: #edf3fb;
  overflow: hidden;
}

.amount-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.rank-row {
  display: grid;
  grid-template-columns: 1fr 44px 54px;
  gap: 8px;
  align-items: center;
  color: #60708f;
}

.rank-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-row strong {
  color: #172033;
  text-align: right;
}

.rank-row small {
  color: #ef4444;
  text-align: right;
}

.sap-error-line {
  margin-top: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff1f2;
  color: #b91c1c;
  display: grid;
  gap: 3px;
  font-size: 12px;
}

:deep(.compact-table .el-table__cell) {
  padding: 4px 0;
}

@media (max-width: 1500px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboard-main-grid,
  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .left-stack,
  .right-stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .dashboard-hero,
  .dashboard-title-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .warning-grid,
  .left-stack,
  .right-stack,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .world-map {
    height: 360px;
  }
}
</style>
