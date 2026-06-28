<template>
  <div class="workbench-page">
    <div class="workbench-header">
      <div>
        <div class="page-title">我的工作台</div>
        <div class="page-subtitle">聚合仓库人员日常待办、库存预警和高频业务入口</div>
      </div>
      <el-button type="primary" :loading="loading" @click="load">刷新工作台</el-button>
    </div>

    <el-row :gutter="12">
      <el-col v-for="card in pendingCards" :key="card.key" :xs="12" :sm="12" :md="6">
        <div class="todo-card" :class="card.tone" @click="go(card.path)">
          <div class="todo-icon">
            <el-icon><component :is="card.icon" /></el-icon>
          </div>
          <div>
            <div class="todo-title">{{ card.title }}</div>
            <div class="todo-number">{{ formatNumber(card.value) }}</div>
            <div class="todo-desc">{{ card.desc }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="section-row">
      <el-col :xs="24" :lg="15">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>
            <div class="card-header">
              <span>库存快速查询</span>
              <el-button link type="primary" @click="go('/inventory/list')">查看更多</el-button>
            </div>
          </template>
          <el-form :inline="true" :model="inventoryQuery" class="compact-form">
            <el-form-item label="产品编码">
              <el-input v-model="inventoryQuery.productCode" clearable placeholder="产品编码" />
            </el-form-item>
            <el-form-item label="产品名称">
              <el-input v-model="inventoryQuery.productName" clearable placeholder="产品名称" />
            </el-form-item>
            <el-form-item label="仓库">
              <el-input v-model="inventoryQuery.warehouseCode" clearable placeholder="仓库编码" />
            </el-form-item>
            <el-form-item label="货主">
              <el-input v-model="inventoryQuery.owner" clearable placeholder="货主" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="searchInventory">查询</el-button>
              <el-button @click="resetInventory">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table :data="inventoryRows" height="300">
            <el-table-column prop="warehouseName" label="仓库" min-width="140" />
            <el-table-column prop="productCode" label="产品编码" min-width="150" />
            <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="totalQty" label="总库存" width="90" />
            <el-table-column prop="availableQty" label="可用" width="80" />
            <el-table-column prop="allocatedQty" label="已分配" width="90" />
            <el-table-column prop="frozenQty" label="冻结" width="80" />
            <el-table-column prop="unit" label="单位" width="70" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="9">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>安全库存预警</template>
          <el-table :data="safetyWarnings" height="365">
            <el-table-column prop="warehouseName" label="仓库" min-width="130" />
            <el-table-column prop="productCode" label="产品编码" min-width="140" />
            <el-table-column prop="availableQty" label="当前" width="70" />
            <el-table-column prop="safetyStockQty" label="安全" width="70" />
            <el-table-column prop="shortageQty" label="缺口" width="70" />
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
      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>待处理入库单</template>
          <el-table :data="pendingInbound" height="300">
            <el-table-column prop="inboundOrderNo" label="入库单号" min-width="150" />
            <el-table-column prop="inboundType" label="入库类型" width="110" />
            <el-table-column prop="warehouseName" label="仓库" min-width="130" />
            <el-table-column prop="lineCount" label="行数" width="70" />
            <el-table-column prop="pendingReceiveQty" label="待收货" width="90" />
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="go(`/inbound/arrival-notices/${row.id}`)">查看</el-button>
                <el-button link type="primary" @click="go('/inbound/arrival-notices')">收货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>待处理出库单</template>
          <el-table :data="pendingOutbound" height="300">
            <el-table-column prop="outboundOrderNo" label="出库单号" min-width="150" />
            <el-table-column prop="outboundType" label="出库类型" width="110" />
            <el-table-column prop="warehouseName" label="仓库" min-width="130" />
            <el-table-column prop="customerName" label="客户" min-width="130" show-overflow-tooltip />
            <el-table-column prop="orderQty" label="订单数量" width="90" />
            <el-table-column prop="status" label="状态" width="110">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default>
                <el-button link type="primary" @click="go('/outbound/shipping-orders')">分配</el-button>
                <el-button link type="primary" @click="go('/outbound/shipping-orders')">发货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="12" class="section-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>待办业务入口</template>
          <div class="todo-groups">
            <div v-for="group in groupedTodos" :key="group.name" class="todo-group">
              <div class="group-title">{{ group.name }}</div>
              <div v-for="item in group.items" :key="item.title" class="todo-entry" @click="go(item.path)">
                <span>{{ item.title }}</span>
                <strong>{{ item.count }}</strong>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="page-card panel-card">
          <template #header>业务快捷入口</template>
          <div class="entry-grid">
            <div v-for="entry in businessEntries" :key="entry.title" class="business-entry" @click="go(entry.path)">
              <el-icon><component :is="entry.icon || 'Menu'" /></el-icon>
              <span>{{ entry.title }}</span>
              <em>{{ entry.group }}</em>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { workbenchApi } from '../../api/workbench'

const router = useRouter()
const loading = ref(false)
const summary = ref<any>({})
const inventoryRows = ref<any[]>([])
const safetyWarnings = ref<any[]>([])
const todoList = ref<any[]>([])
const pendingInbound = ref<any[]>([])
const pendingOutbound = ref<any[]>([])
const businessEntries = ref<any[]>([])
const inventoryQuery = reactive({
  productCode: '',
  productName: '',
  warehouseCode: '',
  owner: ''
})

const pendingCards = computed(() => [
  { key: 'receive', title: '待收货', value: summary.value.pendingReceiveCount || 0, desc: '入库单 / 明细待处理', icon: 'Download', tone: 'blue', path: '/inbound/arrival-notices' },
  { key: 'shelve', title: '待上架', value: summary.value.pendingShelveCount || 0, desc: '已收货未完成上架', icon: 'Finished', tone: 'green', path: '/inbound/arrival-notices' },
  { key: 'pick', title: '待拣货', value: summary.value.pendingPickCount || 0, desc: '出库订单待拣货', icon: 'Box', tone: 'orange', path: '/outbound/shipping-orders' },
  { key: 'ship', title: '待发货', value: summary.value.pendingShipCount || 0, desc: '已复核待发货', icon: 'Van', tone: 'red', path: '/outbound/shipping-orders' }
])

const groupedTodos = computed(() => {
  const groups = new Map<string, any[]>()
  todoList.value.forEach((item) => {
    const key = item.group || '其他'
    groups.set(key, [...(groups.get(key) || []), item])
  })
  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await workbenchApi.get()
    summary.value = data.summary || {}
    inventoryRows.value = data.inventoryRows || []
    safetyWarnings.value = data.safetyWarnings || []
    todoList.value = data.todoList || []
    pendingInbound.value = data.pendingInbound || []
    pendingOutbound.value = data.pendingOutbound || []
    businessEntries.value = data.businessEntries || []
  } finally {
    loading.value = false
  }
}

async function searchInventory() {
  inventoryRows.value = await workbenchApi.inventoryQuery({ ...inventoryQuery, limit: 8 })
}

function resetInventory() {
  inventoryQuery.productCode = ''
  inventoryQuery.productName = ''
  inventoryQuery.warehouseCode = ''
  inventoryQuery.owner = ''
  searchInventory()
}

function go(path: string) {
  router.push(path)
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
</script>

<style scoped>
.workbench-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workbench-header {
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

.section-row {
  width: 100%;
}

.todo-card {
  min-height: 112px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 16px;
  display: flex;
  gap: 14px;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s;
}

.todo-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 8px 22px rgba(15, 23, 42, .08);
}

.todo-icon {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.todo-card.blue .todo-icon { color: #1677ff; background: #eaf3ff; }
.todo-card.green .todo-icon { color: #16a34a; background: #eafaf0; }
.todo-card.orange .todo-icon { color: #f97316; background: #fff7ed; }
.todo-card.red .todo-icon { color: #dc2626; background: #fef2f2; }

.todo-title {
  color: #6b7280;
}

.todo-number {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.todo-desc {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 12px;
}

.panel-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.compact-form {
  margin-bottom: 8px;
}

.compact-form :deep(.el-form-item) {
  margin-bottom: 10px;
}

.todo-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.todo-group {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #fbfdff;
}

.group-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.todo-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 0;
  border-top: 1px solid #eef2f7;
  cursor: pointer;
}

.todo-entry:first-of-type {
  border-top: 0;
}

.todo-entry span {
  color: #4b5563;
}

.todo-entry strong {
  color: #1677ff;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.business-entry {
  min-height: 92px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  background: #fff;
}

.business-entry:hover {
  border-color: #93c5fd;
  background: #f8fbff;
}

.business-entry .el-icon {
  color: #1677ff;
  font-size: 22px;
}

.business-entry span {
  color: #1f2937;
  font-weight: 600;
}

.business-entry em {
  color: #9ca3af;
  font-size: 12px;
  font-style: normal;
}

@media (max-width: 1080px) {
  .todo-groups,
  .entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .workbench-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .todo-groups,
  .entry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
