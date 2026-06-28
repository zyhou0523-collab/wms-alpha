<template>
  <div class="inventory-op-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">库存移动</div>
            <div class="page-subtitle">支持库位移动、托盘变更、箱码变更和包装重绑；SN 产品按 SN 移动，非 SN 产品按数量移动。</div>
          </div>
          <div class="header-actions">
            <el-button @click="load">刷新</el-button>
            <el-button @click="openCandidates">库存候选</el-button>
            <el-button type="primary" @click="openCreate">新建移动单</el-button>
          </div>
        </div>
      </template>

      <el-form :model="query" inline label-width="88px" class="query-form">
        <el-form-item label="移动单号">
          <el-input v-model="query.moveOrderNo" clearable placeholder="请输入" />
        </el-form-item>
        <el-form-item label="移动类型">
          <el-select v-model="query.moveType" clearable placeholder="请选择">
            <el-option v-for="item in moveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="请选择">
            <el-option label="创建" value="CREATED" />
            <el-option label="已确认" value="CONFIRMED" />
            <el-option label="已取消" value="CANCELED" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-input v-model="query.warehouseCode" clearable placeholder="仓库编码" />
        </el-form-item>
        <el-form-item label="货主">
          <el-input v-model="query.ownerCode" clearable placeholder="货主编码/名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        class="flow-alert"
        type="info"
        show-icon
        :closable="false"
        title="移动确认会校验来源库存可用、SN 未冻结未分配、目标库位启用且同仓；确认后生成库存流水和操作日志。"
      />

      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column prop="move_order_no" label="移动单号" width="190" fixed="left" />
        <el-table-column prop="move_type" label="移动类型" width="130">
          <template #default="{ row }">{{ labelOf(moveTypeOptions, row.move_type) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_code" label="货主" width="110" />
        <el-table-column prop="owner_name" label="货主名称" width="150" />
        <el-table-column prop="warehouse_code" label="仓库" width="150" />
        <el-table-column prop="from_location_code" label="来源库位" width="130" />
        <el-table-column prop="to_location_code" label="目标库位" width="130" />
        <el-table-column prop="from_pallet_code" label="来源托盘" width="150" />
        <el-table-column prop="to_pallet_code" label="目标托盘" width="150" />
        <el-table-column prop="line_count" label="明细行数" width="100" />
        <el-table-column prop="total_move_qty" label="移动数量" width="100" />
        <el-table-column prop="created_by" label="创建人" width="110" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'CREATED'" link type="success" @click="confirmMove(row)">确认移动</el-button>
            <el-button v-if="row.status === 'CREATED'" link type="danger" @click="cancelMove(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50]"
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>

    <el-dialog v-model="createVisible" title="新建库存移动单" width="1180px" destroy-on-close>
      <el-form :model="createForm" label-width="110px">
        <el-row :gutter="14">
          <el-col :span="8">
            <el-form-item label="移动类型">
              <el-select v-model="createForm.moveType" style="width: 100%">
                <el-option v-for="item in moveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货主编码">
              <el-input v-model="createForm.ownerCode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仓库编码">
              <el-input v-model="createForm.warehouseCode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源库位">
              <el-input v-model="createForm.fromLocationCode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目标库位">
              <el-input v-model="createForm.toLocationCode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注">
              <el-input v-model="createForm.remark" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="subsection-title">
        <span>移动明细</span>
        <el-button link type="primary" @click="addLine">新增行</el-button>
      </div>
      <el-table :data="createForm.lines" border stripe>
        <el-table-column prop="lineNo" label="行号" width="80">
          <template #default="{ row }">
            <el-input-number v-model="row.lineNo" :min="1" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="产品编码" width="170">
          <template #default="{ row }">
            <el-input v-model="row.productCode" size="small" placeholder="非 SN 必填" />
          </template>
        </el-table-column>
        <el-table-column label="SN" width="170">
          <template #default="{ row }">
            <el-input v-model="row.snCode" size="small" placeholder="SN 产品必填" />
          </template>
        </el-table-column>
        <el-table-column label="批次" width="170">
          <template #default="{ row }">
            <el-input v-model="row.batchNo" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="来源托盘" width="150">
          <template #default="{ row }">
            <el-input v-model="row.fromPalletCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="目标托盘" width="150">
          <template #default="{ row }">
            <el-input v-model="row.toPalletCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="来源箱码" width="150">
          <template #default="{ row }">
            <el-input v-model="row.fromBoxCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="目标箱码" width="150">
          <template #default="{ row }">
            <el-input v-model="row.toBoxCode" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.moveQty" :min="1" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" @click="removeLine($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">保存移动单</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="库存移动详情" size="82%">
      <template v-if="detail.order">
        <el-descriptions title="移动主信息" :column="4" border>
          <el-descriptions-item label="移动单号">{{ detail.order.move_order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(detail.order.status) }}</el-descriptions-item>
          <el-descriptions-item label="移动类型">{{ labelOf(moveTypeOptions, detail.order.move_type) }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detail.order.warehouse_code }}</el-descriptions-item>
          <el-descriptions-item label="货主">{{ detail.order.owner_code }} {{ detail.order.owner_name }}</el-descriptions-item>
          <el-descriptions-item label="来源库位">{{ detail.order.from_location_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目标库位">{{ detail.order.to_location_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detail.order.created_by }}</el-descriptions-item>
          <el-descriptions-item label="确认人">{{ detail.order.confirmed_by || '-' }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ detail.order.confirmed_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源托盘">{{ detail.order.from_pallet_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目标托盘">{{ detail.order.to_pallet_code || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="移动明细">
            <el-table :data="detail.lines || []" border stripe>
              <el-table-column prop="line_no" label="行号" width="80" />
              <el-table-column prop="product_code" label="产品编码" width="160" />
              <el-table-column prop="product_name" label="产品名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="sn_required" label="SN管理" width="90">
                <template #default="{ row }">{{ row.sn_required ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column prop="sn_code" label="SN" width="170" />
              <el-table-column prop="batch_no" label="批次" width="170" />
              <el-table-column prop="from_location_code" label="来源库位" width="130" />
              <el-table-column prop="to_location_code" label="目标库位" width="130" />
              <el-table-column prop="from_pallet_code" label="来源托盘" width="150" />
              <el-table-column prop="to_pallet_code" label="目标托盘" width="150" />
              <el-table-column prop="move_qty" label="数量" width="90" />
              <el-table-column prop="line_status" label="行状态" width="110" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="库存流水">
            <el-table :data="detail.transactions || []" border stripe>
              <el-table-column prop="transaction_no" label="流水号" width="210" />
              <el-table-column prop="transaction_type" label="类型" width="120" />
              <el-table-column prop="product_code" label="产品" width="150" />
              <el-table-column prop="sn_code" label="SN" width="160" />
              <el-table-column prop="from_location_code" label="来源库位" width="120" />
              <el-table-column prop="to_location_code" label="目标库位" width="120" />
              <el-table-column prop="qty" label="变化量" width="90" />
              <el-table-column prop="operator" label="操作人" width="110" />
              <el-table-column prop="remark" label="说明" min-width="220" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="操作日志">
            <el-table :data="detail.operationLogs || []" border stripe>
              <el-table-column prop="action" label="操作" width="150" />
              <el-table-column prop="operator" label="操作人" width="120" />
              <el-table-column prop="result" label="结果" width="100" />
              <el-table-column prop="message" label="说明" min-width="260" />
              <el-table-column prop="created_at" label="时间" width="170" />
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-drawer>

    <el-drawer v-model="candidateVisible" title="可移动库存候选" size="78%">
      <el-form :model="candidateQuery" inline label-width="86px" class="query-form">
        <el-form-item label="仓库">
          <el-input v-model="candidateQuery.warehouseCode" />
        </el-form-item>
        <el-form-item label="货主">
          <el-input v-model="candidateQuery.ownerCode" />
        </el-form-item>
        <el-form-item label="库位">
          <el-input v-model="candidateQuery.locationCode" />
        </el-form-item>
        <el-form-item label="产品">
          <el-input v-model="candidateQuery.productCode" />
        </el-form-item>
        <el-form-item label="SN">
          <el-input v-model="candidateQuery.snCode" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCandidates">查询</el-button>
        </el-form-item>
      </el-form>
      <el-tabs>
        <el-tab-pane label="非 SN / 汇总库存">
          <el-table :data="candidates.inventory || []" border stripe height="360">
            <el-table-column prop="warehouse_code" label="仓库" width="140" />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="product_code" label="产品" width="160" />
            <el-table-column prop="batch_no" label="批次" width="160" />
            <el-table-column prop="pallet_code" label="托盘" width="140" />
            <el-table-column prop="box_code" label="箱码" width="140" />
            <el-table-column prop="inventory_status" label="状态" width="110" />
            <el-table-column prop="available_qty" label="可用" width="90" />
            <el-table-column prop="allocated_qty" label="已分配" width="90" />
            <el-table-column prop="frozen_qty" label="冻结" width="90" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="SN 库存">
          <el-table :data="candidates.sns || []" border stripe height="360">
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="warehouse_code" label="仓库" width="140" />
            <el-table-column prop="owner_code" label="货主" width="100" />
            <el-table-column prop="location_code" label="库位" width="120" />
            <el-table-column prop="product_code" label="产品" width="160" />
            <el-table-column prop="pallet_code" label="托盘" width="140" />
            <el-table-column prop="box_code" label="箱码" width="140" />
            <el-table-column prop="status" label="SN状态" width="110" />
            <el-table-column prop="quality_status" label="质量" width="110" />
            <el-table-column prop="locked_flag" label="锁定" width="90">
              <template #default="{ row }">{{ row.locked_flag ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inventoryMoveService } from '../../api/services'

const moveTypeOptions = [
  { label: '库位移动', value: 'LOCATION_MOVE' },
  { label: '托盘变更', value: 'PALLET_CHANGE' },
  { label: '箱码变更', value: 'BOX_CHANGE' },
  { label: '包装重绑', value: 'PACKAGE_REBIND' },
  { label: '库区移动', value: 'AREA_MOVE' },
  { label: '综合移动', value: 'MIXED_MOVE' }
]

const query = reactive<any>({ pageNum: 1, pageSize: 10 })
const rows = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const createVisible = ref(false)
const detailVisible = ref(false)
const candidateVisible = ref(false)
const detail = reactive<any>({})
const candidates = reactive<any>({ inventory: [], sns: [], locations: [] })
const candidateQuery = reactive<any>({ warehouseCode: 'WH-HZ-CENTRAL', ownerCode: '3060' })
const createForm = reactive<any>({
  moveType: 'LOCATION_MOVE',
  ownerCode: '3060',
  ownerName: '杭州利沃得',
  warehouseCode: 'WH-HZ-CENTRAL',
  fromLocationCode: 'A01-01-01',
  toLocationCode: 'A03-01-13',
  remark: '',
  lines: [
    {
      lineNo: 10,
      productCode: '',
      snCode: 'SN-OUT-0001',
      batchNo: 'BATCH-OUT-DEMO',
      fromPalletCode: 'PLT-OUT-0001',
      toPalletCode: 'PLT-OUT-0001',
      fromBoxCode: 'BOX-OUT-0001',
      toBoxCode: 'BOX-OUT-0001',
      moveQty: 1
    }
  ]
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    const page = await inventoryMoveService.list({ ...query })
    rows.value = page.items
    total.value = page.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  load()
}

function reset() {
  Object.keys(query).forEach((key) => {
    if (!['pageNum', 'pageSize'].includes(key)) delete query[key]
  })
  query.pageNum = 1
  load()
}

function openCreate() {
  createVisible.value = true
}

function addLine() {
  createForm.lines.push({
    lineNo: (createForm.lines.length + 1) * 10,
    productCode: '',
    snCode: '',
    batchNo: '',
    fromPalletCode: '',
    toPalletCode: '',
    fromBoxCode: '',
    toBoxCode: '',
    moveQty: 1
  })
}

function removeLine(index: number) {
  createForm.lines.splice(index, 1)
}

async function submitCreate() {
  saving.value = true
  try {
    const data = await inventoryMoveService.create({
      ...createForm,
      operator: 'wh_admin',
      lines: createForm.lines
    })
    ElMessage.success('库存移动单已创建')
    createVisible.value = false
    await load()
    showDetail(data)
  } finally {
    saving.value = false
  }
}

async function openDetail(row: any) {
  const data = await inventoryMoveService.detail(Number(row.id))
  showDetail(data)
}

function showDetail(data: any) {
  Object.keys(detail).forEach((key) => delete detail[key])
  Object.assign(detail, data)
  detailVisible.value = true
}

async function confirmMove(row: any) {
  await ElMessageBox.confirm('确认移动后将更新库存、SN 库位/托盘/箱码并生成库存流水，是否继续？', '确认移动', { type: 'warning' })
  await inventoryMoveService.confirm(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('库存移动已确认')
  await load()
}

async function cancelMove(row: any) {
  await ElMessageBox.confirm('确认取消该库存移动单？', '取消移动', { type: 'warning' })
  await inventoryMoveService.cancel(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('库存移动单已取消')
  await load()
}

async function openCandidates() {
  candidateVisible.value = true
  await loadCandidates()
}

async function loadCandidates() {
  const data = await inventoryMoveService.stockCandidates({ ...candidateQuery })
  Object.assign(candidates, data)
}

function labelOf(options: { label: string; value: string }[], value: string) {
  return options.find((item) => item.value === value)?.label || value || '-'
}

function statusText(status: string) {
  return ({ CREATED: '创建', CONFIRMED: '已确认', CANCELED: '已取消' } as Record<string, string>)[status] || status
}

function statusType(status: string) {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'CANCELED') return 'info'
  return 'primary'
}
</script>

<style scoped>
.inventory-op-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 4px;
  color: var(--wms-text-secondary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.query-form :deep(.el-input),
.query-form :deep(.el-select) {
  width: 180px;
}

.flow-alert,
.detail-tabs {
  margin: 12px 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.subsection-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 10px;
  font-weight: 700;
}
</style>
