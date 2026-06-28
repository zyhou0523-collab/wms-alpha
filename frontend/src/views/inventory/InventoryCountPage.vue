<template>
  <div class="inventory-op-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">库存盘点</div>
            <div class="page-subtitle">支持全仓、库区、库位、产品、货主、批次、托盘、SN 范围盘点，保留账面快照并形成差异调整闭环。</div>
          </div>
          <div class="header-actions">
            <el-button @click="load">刷新</el-button>
            <el-button type="primary" @click="openCreate">新建盘点单</el-button>
          </div>
        </div>
      </template>

      <el-form :model="query" inline label-width="88px" class="query-form">
        <el-form-item label="盘点单号">
          <el-input v-model="query.countOrderNo" clearable placeholder="请输入" />
        </el-form-item>
        <el-form-item label="盘点类型">
          <el-select v-model="query.countType" clearable placeholder="请选择">
            <el-option v-for="item in countTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="请选择">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        title="盘点流程：新建盘点单 → 生成账面快照 → 录入实盘 → 差异确认 → 调整生效 → 写库存流水/操作日志。"
      />

      <el-table v-loading="loading" :data="rows" border stripe>
        <el-table-column prop="count_order_no" label="盘点单号" width="180" fixed="left" />
        <el-table-column prop="count_type" label="盘点类型" width="120">
          <template #default="{ row }">{{ labelOf(countTypeOptions, row.count_type) }}</template>
        </el-table-column>
        <el-table-column prop="count_scope" label="盘点范围" width="120" />
        <el-table-column prop="warehouse_code" label="仓库" width="150" />
        <el-table-column prop="owner_code" label="货主" width="110" />
        <el-table-column prop="owner_name" label="货主名称" width="150" />
        <el-table-column prop="location_code" label="库位" width="120" />
        <el-table-column prop="product_code" label="产品" width="150" />
        <el-table-column prop="status" label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">{{ labelOf(statusOptions, row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="line_count" label="明细行数" width="100" />
        <el-table-column prop="diff_count" label="差异行数" width="100" />
        <el-table-column prop="freeze_flag" label="冻结" width="90">
          <template #default="{ row }">
            <el-tag :type="row.freeze_flag ? 'warning' : 'info'" effect="plain">{{ row.freeze_flag ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by" label="创建人" width="110" />
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="['CREATED','COUNTING'].includes(row.status)" link type="primary" @click="generateLines(row)">生成快照</el-button>
            <el-button v-if="['CREATED','COUNTING','RECORDED'].includes(row.status)" link type="primary" @click="openRecord(row)">盘点录入</el-button>
            <el-button v-if="['RECORDED','COUNTING'].includes(row.status)" link type="warning" @click="confirmDifference(row)">差异确认</el-button>
            <el-button v-if="['DIFF_CONFIRMED','RECORDED'].includes(row.status)" link type="success" @click="adjust(row)">调整生效</el-button>
            <el-button v-if="['CREATED','COUNTING'].includes(row.status)" link type="danger" @click="cancel(row)">取消</el-button>
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

    <el-dialog v-model="createVisible" title="新建盘点单" width="980px" destroy-on-close>
      <el-form :model="createForm" label-width="110px">
        <el-row :gutter="14">
          <el-col :span="8">
            <el-form-item label="盘点类型">
              <el-select v-model="createForm.countType" style="width: 100%">
                <el-option v-for="item in countTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="盘点范围">
              <el-select v-model="createForm.countScope" style="width: 100%">
                <el-option v-for="item in scopeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="冻结库存">
              <el-switch v-model="createForm.freezeFlag" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仓库编码">
              <el-input v-model="createForm.warehouseCode" placeholder="WH-HZ-CENTRAL" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货主编码">
              <el-input v-model="createForm.ownerCode" placeholder="3060" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货主名称">
              <el-input v-model="createForm.ownerName" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库区">
              <el-input v-model="createForm.areaCode" placeholder="AREA-GOOD-01" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="库位">
              <el-input v-model="createForm.locationCode" placeholder="A01-01-01" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品编码">
              <el-input v-model="createForm.productCode" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="批次">
              <el-input v-model="createForm.batchNo" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="托盘码">
              <el-input v-model="createForm.palletCode" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="SN">
              <el-input v-model="createForm.snCode" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="createForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">生成盘点明细</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="盘点单详情" size="82%">
      <template v-if="detail.order">
        <el-descriptions title="盘点主信息" :column="4" border>
          <el-descriptions-item label="盘点单号">{{ detail.order.count_order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ labelOf(statusOptions, detail.order.status) }}</el-descriptions-item>
          <el-descriptions-item label="盘点类型">{{ labelOf(countTypeOptions, detail.order.count_type) }}</el-descriptions-item>
          <el-descriptions-item label="盘点范围">{{ detail.order.count_scope }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detail.order.warehouse_code }}</el-descriptions-item>
          <el-descriptions-item label="货主">{{ detail.order.owner_code }} {{ detail.order.owner_name }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ detail.order.product_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="冻结库存">{{ detail.order.freeze_flag ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ detail.order.created_by }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.order.created_at }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ detail.order.end_time || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.order.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-tabs class="detail-tabs">
          <el-tab-pane label="盘点明细">
            <el-table :data="detail.lines || []" border stripe height="360">
              <el-table-column prop="line_no" label="行号" width="80" />
              <el-table-column prop="owner_code" label="货主" width="100" />
              <el-table-column prop="warehouse_code" label="仓库" width="130" />
              <el-table-column prop="location_code" label="库位" width="120" />
              <el-table-column prop="product_code" label="产品编码" width="160" />
              <el-table-column prop="product_name" label="产品名称" min-width="180" show-overflow-tooltip />
              <el-table-column prop="sn_required" label="SN管理" width="90">
                <template #default="{ row }">{{ row.sn_required ? '是' : '否' }}</template>
              </el-table-column>
              <el-table-column prop="sn_code" label="SN" width="160" />
              <el-table-column prop="pallet_code" label="托盘" width="140" />
              <el-table-column prop="box_code" label="箱码" width="140" />
              <el-table-column prop="book_qty" label="账面" width="80" />
              <el-table-column prop="actual_qty" label="实盘" width="80" />
              <el-table-column prop="diff_qty" label="差异" width="80" />
              <el-table-column prop="diff_type" label="差异类型" width="120" />
              <el-table-column prop="line_status" label="行状态" width="110" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="差异明细">
            <el-table :data="detail.differences || []" border stripe>
              <el-table-column prop="line_no" label="行号" width="80" />
              <el-table-column prop="diff_type" label="差异类型" width="120" />
              <el-table-column prop="product_code" label="产品" width="150" />
              <el-table-column prop="sn_code" label="SN" width="160" />
              <el-table-column prop="book_qty" label="账面" width="80" />
              <el-table-column prop="actual_qty" label="实盘" width="80" />
              <el-table-column prop="diff_qty" label="差异" width="80" />
              <el-table-column prop="diff_reason" label="差异原因" min-width="180" />
              <el-table-column prop="handling_method" label="处理方式" width="150" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="调整/流水">
            <el-table :data="detail.adjustments || []" border stripe class="mb12">
              <el-table-column prop="adjustment_no" label="调整号" width="190" />
              <el-table-column prop="adjustment_type" label="调整类型" width="130" />
              <el-table-column prop="qty" label="数量" width="90" />
              <el-table-column prop="operator" label="操作人" width="110" />
              <el-table-column prop="remark" label="说明" min-width="220" />
              <el-table-column prop="created_at" label="时间" width="170" />
            </el-table>
            <el-table :data="detail.transactions || []" border stripe>
              <el-table-column prop="transaction_no" label="流水号" width="200" />
              <el-table-column prop="transaction_type" label="类型" width="130" />
              <el-table-column prop="product_code" label="产品" width="150" />
              <el-table-column prop="sn_code" label="SN" width="150" />
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

    <el-dialog v-model="recordVisible" title="盘点录入" width="1180px" destroy-on-close>
      <el-alert type="info" show-icon :closable="false" title="SN 管理产品可扫描 SN，非 SN 产品录入实盘数量；提交后系统自动计算盘盈、盘亏和库位差异。" />
      <el-form class="scan-form" inline>
        <el-form-item label="扫描 SN">
          <el-input v-model="scanText" clearable placeholder="支持粘贴多行 SN" style="width: 360px" />
        </el-form-item>
        <el-form-item>
          <el-button @click="applyScan">加入扫描结果</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="recordLines" border stripe height="420">
        <el-table-column prop="line_no" label="行号" width="70" />
        <el-table-column prop="product_code" label="产品编码" width="150" />
        <el-table-column prop="sn_code" label="SN" width="160" />
        <el-table-column prop="location_code" label="账面库位" width="120" />
        <el-table-column prop="book_qty" label="账面" width="80" />
        <el-table-column label="实盘数量" width="150">
          <template #default="{ row }">
            <el-input-number v-model="row.actualQty" :min="0" :max="999999" size="small" />
          </template>
        </el-table-column>
        <el-table-column label="实盘库位" width="150">
          <template #default="{ row }">
            <el-input v-model="row.actualLocationCode" size="small" placeholder="可选" />
          </template>
        </el-table-column>
        <el-table-column label="差异原因" min-width="200">
          <template #default="{ row }">
            <el-input v-model="row.diffReason" size="small" placeholder="盘盈/盘亏原因" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="recordVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitRecord">提交盘点结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inventoryCountService } from '../../api/services'

const countTypeOptions = [
  { label: '全盘', value: 'FULL' },
  { label: '动态盘点', value: 'DYNAMIC' },
  { label: '循环盘点', value: 'CYCLE' },
  { label: '指定范围盘点', value: 'RANGE' }
]
const scopeOptions = ['WAREHOUSE', 'AREA', 'LOCATION', 'PRODUCT', 'OWNER', 'BATCH', 'PALLET', 'SN'].map((value) => ({ label: value, value }))
const statusOptions = [
  { label: '创建', value: 'CREATED' },
  { label: '盘点中', value: 'COUNTING' },
  { label: '已录入', value: 'RECORDED' },
  { label: '差异已确认', value: 'DIFF_CONFIRMED' },
  { label: '已调整', value: 'ADJUSTED' },
  { label: '已关闭', value: 'CLOSED' },
  { label: '已取消', value: 'CANCELED' }
]

const query = reactive<any>({ pageNum: 1, pageSize: 10 })
const rows = ref<any[]>([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const createVisible = ref(false)
const detailVisible = ref(false)
const recordVisible = ref(false)
const currentOrder = ref<any>(null)
const detail = reactive<any>({})
const recordLines = ref<any[]>([])
const scanText = ref('')
const createForm = reactive<any>({
  countType: 'RANGE',
  countScope: 'LOCATION',
  warehouseCode: 'WH-HZ-CENTRAL',
  ownerCode: '3060',
  ownerName: '杭州利沃得',
  locationCode: 'A01-01-01',
  freezeFlag: false,
  remark: ''
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    const page = await inventoryCountService.list({ ...query })
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

async function submitCreate() {
  saving.value = true
  try {
    const data = await inventoryCountService.create({ ...createForm })
    ElMessage.success('盘点单已创建并生成快照')
    createVisible.value = false
    await load()
    showDetail(data)
  } finally {
    saving.value = false
  }
}

async function openDetail(row: any) {
  const data = await inventoryCountService.detail(Number(row.id))
  showDetail(data)
}

function showDetail(data: any) {
  Object.keys(detail).forEach((key) => delete detail[key])
  Object.assign(detail, data)
  detailVisible.value = true
}

async function generateLines(row: any) {
  await inventoryCountService.generateLines(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('盘点快照已生成')
  await load()
}

async function openRecord(row: any) {
  currentOrder.value = row
  const data = await inventoryCountService.detail(Number(row.id))
  recordLines.value = (data.lines || []).map((line: any) => ({
    ...line,
    actualQty: line.actual_qty ?? (line.sn_required ? 0 : line.book_qty),
    actualLocationCode: line.actual_location_code || '',
    diffReason: line.diff_reason || ''
  }))
  scanText.value = ''
  recordVisible.value = true
}

function applyScan() {
  const sns = scanText.value.split(/\s+/).map((item) => item.trim()).filter(Boolean)
  const set = new Set(sns)
  recordLines.value.forEach((line) => {
    if (line.sn_code && set.has(line.sn_code)) {
      line.actualQty = 1
    }
  })
  ElMessage.success(`已匹配 ${sns.length} 条扫描输入，未在快照中的 SN 会在提交时由后端识别为盘盈/异常。`)
}

async function submitRecord() {
  if (!currentOrder.value) return
  saving.value = true
  try {
    const scannedSns = scanText.value.split(/\s+/).map((item) => item.trim()).filter(Boolean)
    await inventoryCountService.record(Number(currentOrder.value.id), {
      operator: 'wh_admin',
      scannedSns,
      lines: recordLines.value.map((line) => ({
        id: line.id,
        actualQty: line.actualQty,
        actualLocationCode: line.actualLocationCode,
        diffReason: line.diffReason
      }))
    })
    ElMessage.success('盘点结果已提交')
    recordVisible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function confirmDifference(row: any) {
  await ElMessageBox.confirm('确认差异后才能生成库存调整，是否继续？', '差异确认', { type: 'warning' })
  await inventoryCountService.confirmDifference(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('差异已确认')
  await load()
}

async function adjust(row: any) {
  await ElMessageBox.confirm('调整生效会改写 WMS 库存、SN 状态并写入库存流水，是否继续？', '调整生效', { type: 'warning' })
  await inventoryCountService.adjust(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('库存调整已生效')
  await load()
}

async function cancel(row: any) {
  await ElMessageBox.confirm('确认取消该盘点单？如已冻结库存会释放冻结。', '取消盘点', { type: 'warning' })
  await inventoryCountService.cancel(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('盘点单已取消')
  await load()
}

function labelOf(options: { label: string; value: string }[], value: string) {
  return options.find((item) => item.value === value)?.label || value || '-'
}

function statusType(status: string) {
  if (['ADJUSTED', 'CLOSED'].includes(status)) return 'success'
  if (['CANCELED'].includes(status)) return 'info'
  if (['RECORDED', 'DIFF_CONFIRMED'].includes(status)) return 'warning'
  if (['COUNTING'].includes(status)) return 'primary'
  return 'info'
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
.detail-tabs,
.scan-form {
  margin: 12px 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.mb12 {
  margin-bottom: 12px;
}
</style>
