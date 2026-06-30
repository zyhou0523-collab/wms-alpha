<template>
  <el-card class="page-card inbound-page" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">预期到货通知单</div>
          <div class="muted">入库单按主表维度展示；SN 采集与收货确认分离，SAP 按收货批次回传。</div>
        </div>
      </div>
    </template>

    <el-form :model="query" inline label-width="104px" class="query-form">
      <el-form-item label="通知单号">
        <el-input v-model="query.orderNo" clearable placeholder="IN202606110001" />
      </el-form-item>
      <el-form-item label="来源单号">
        <el-input v-model="query.sourceOrderNo" clearable placeholder="MO / ASN / RMA" />
      </el-form-item>
      <el-form-item label="订单类型">
        <el-select v-model="query.inboundType" clearable filterable placeholder="全部" style="width: 180px">
          <el-option v-for="item in inboundTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" clearable filterable placeholder="全部" style="width: 180px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库编码">
        <el-input v-model="query.warehouseCode" clearable placeholder="HZ" />
      </el-form-item>
      <el-form-item label="货主">
        <el-input v-model="query.owner" clearable placeholder="货主编码/名称" />
      </el-form-item>
      <el-form-item label="回传 SAP">
        <el-select v-model="query.sapPostStatus" clearable filterable placeholder="全部" style="width: 180px">
          <el-option v-for="item in sapStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="createdRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="createVisible = true">新建</el-button>
        <el-button @click="inboundImportInput?.click()">导入</el-button>
        <el-button type="warning" plain @click="retrySelectedSap">重传 SAP</el-button>
        <el-button @click="exportVisible = true">导出</el-button>
        <el-button @click="load">刷新</el-button>
        <el-button link type="primary" @click="downloadImportTemplate">导入模板</el-button>
        <input ref="inboundImportInput" class="hidden-file-input" type="file" accept=".csv,.txt" @change="importInboundRows" />
      </div>
    </div>

    <el-alert
      class="list-alert"
      type="info"
      show-icon
      :closable="false"
      title="列表仅展示入库单主表；采集 SN 后进入待收货，点击收货确认后才更新已收数量；SAP 回传按收货批次处理。"
    />

    <el-table v-loading="loading" :data="rows" border stripe style="width: 100%" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" :selectable="canRetrySap" />
      <el-table-column type="expand" width="48">
        <template #default="{ row }">
          <div class="inbound-line-expand-wrapper">
            <el-table :data="row.lines || []" border size="small" class="inbound-line-subtable" empty-text="暂无产品明细">
              <el-table-column prop="line_no" label="行号" width="70" />
              <el-table-column prop="product_code" label="产品编码" width="160" show-overflow-tooltip />
              <el-table-column prop="product_name" label="产品名称" width="180" show-overflow-tooltip />
              <el-table-column label="SN 管理" width="90">
                <template #default="{ row: line }">
                  <el-tag :type="isLineSnRequired(line) ? 'success' : 'info'" size="small">{{ isLineSnRequired(line) ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="sap_plant" label="SAP 工厂" width="100" />
              <el-table-column prop="sap_storage_location" label="SAP 库存地点" width="120" show-overflow-tooltip />
              <el-table-column prop="planned_qty" label="计划数量" width="90" align="right" />
              <el-table-column label="已采集" width="90" align="right">
                <template #default="{ row: line }">{{ line.collected_sn_qty || line.collectedQty || 0 }}</template>
              </el-table-column>
              <el-table-column label="待收货" width="90" align="right">
                <template #default="{ row: line }">{{ line.pending_receive_qty || line.pendingReceiveQty || 0 }}</template>
              </el-table-column>
              <el-table-column prop="received_qty" label="已收货" width="90" align="right" />
              <el-table-column prop="shelved_qty" label="已上架" width="90" align="right" />
              <el-table-column prop="line_status" label="行状态" width="100">
                <template #default="{ row: line }">
                  <el-tag :type="statusType(line.line_status || line.status)" size="small">{{ statusLabel(line.line_status || line.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="140">
                <template #default="{ row: line }">
                  <el-button v-if="isLineSnRequired(line)" link type="success" :disabled="!canLineCollectSn(row, line)" @click="openLineSnCollect(row, line)">采集 SN</el-button>
                  <el-button v-if="canLineReceive(row, line)" link type="primary" @click="openLineReceive(row, line)">收货</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="order_no" label="预期到货通知单号" width="180" show-overflow-tooltip />
      <el-table-column prop="source_order_no" label="来源单号" width="170" show-overflow-tooltip />
      <el-table-column prop="ship_from_country" label="出库国家" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.ship_from_country || row.shipFromCountry || '-' }}</template>
      </el-table-column>
      <el-table-column prop="inbound_type" label="订单类型" width="130">
        <template #default="{ row }">{{ inboundTypeLabel(row.inbound_type) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="warehouse_code" label="仓库编码" width="150" show-overflow-tooltip />
      <el-table-column prop="warehouse_name" label="仓库名称" width="170" show-overflow-tooltip />
      <el-table-column prop="owner_code" label="货主" width="130" show-overflow-tooltip />
      <el-table-column prop="owner_name" label="货主名称" width="170" show-overflow-tooltip />
      <el-table-column prop="related_order_no" label="关联单号" width="170" show-overflow-tooltip />
      <el-table-column prop="line_count" label="产品行数" width="90" />
      <el-table-column prop="planned_qty" label="计划总数" width="100" />
      <el-table-column prop="collected_qty" label="已采集数" width="100" />
      <el-table-column prop="pending_receive_qty" label="待收货数" width="100" />
      <el-table-column prop="received_qty" label="已收总数" width="100" />
      <el-table-column prop="shelved_qty" label="已上架数" width="100" />
      <el-table-column prop="sap_post_status" label="回传 SAP" width="130">
        <template #default="{ row }">
          <el-tag :type="sapStatusType(row.sap_post_status)">{{ sapStatusLabel(row.sap_post_status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sap_post_result" label="回传结果" width="220" show-overflow-tooltip>
        <template #default="{ row }">{{ row.sap_material_doc_no || row.sap_post_result || '-' }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" show-overflow-tooltip />
      <el-table-column prop="created_by" label="创建人" width="100" />
      <el-table-column prop="updated_at" label="更新时间" width="170" show-overflow-tooltip />
      <el-table-column prop="updated_by" label="更新人" width="100" />
      <el-table-column label="操作" fixed="right" width="360">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          <el-button v-if="canCollectSn(row)" link type="success" @click="openSnCollect(row)">采集 SN</el-button>
          <el-button v-if="canReceive(row)" link type="primary" @click="openReceive(row)">收货</el-button>
          <el-button v-if="canSapPost(row)" link type="warning" @click="submitSapPost(row)">SAP 回传</el-button>
          <el-button v-if="canCancelInbound(row)" link type="danger" @click="cancelInboundOrder(row)">取消</el-button>
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

  <SnCollectDialog
    v-model="snCollectVisible"
    :mode="snCollectMode"
    :order-id="selectedOrderId"
    :line-id="selectedSnCollectLineId"
    @success="load"
  />
  <ReceiveConfirmDialog
    v-model="receiveVisible"
    :order-id="selectedReceiveOrderId"
    :line-id="selectedReceiveLineId"
    @success="load"
  />
  <NewInboundOrderDialog
    v-model="createVisible"
    @success="load"
  />

  <el-dialog v-model="exportVisible" title="导出预期到货通知单" width="460px">
    <el-form label-width="96px">
      <el-form-item label="导出范围">
        <el-radio-group v-model="exportScope">
          <el-radio value="QUERY">当前查询结果</el-radio>
          <el-radio value="SELECTED" :disabled="!selectedRows.length">勾选数据</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="导出内容包含入库单表头和行明细，CSV 文件中用 Sheet1 / Sheet2 分段展示。"
      />
    </el-form>
    <template #footer>
      <el-button @click="exportVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmExport">导出</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inboundService } from '../../api/services'
import SnCollectDialog from './components/SnCollectDialog.vue'
import ReceiveConfirmDialog from './components/ReceiveConfirmDialog.vue'
import NewInboundOrderDialog from './components/NewInboundOrderDialog.vue'
import { downloadTextFile, importResultHtml, parseSectionedCsv, readTextFile } from '../../utils/fileTransfer'

type Row = Record<string, any>

const router = useRouter()
const loading = ref(false)
const rows = ref<Row[]>([])
const total = ref(0)
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })
const createdRange = ref<string[]>([])
const snCollectVisible = ref(false)
const selectedOrderId = ref<number | null>(null)
const selectedSnCollectLineId = ref<number | null>(null)
const snCollectMode = ref<'order' | 'line'>('order')
const receiveVisible = ref(false)
const createVisible = ref(false)
const exportVisible = ref(false)
const exportScope = ref<'QUERY' | 'SELECTED'>('QUERY')
const inboundImportInput = ref<HTMLInputElement>()
const selectedReceiveOrderId = ref<number | null>(null)
const selectedReceiveLineId = ref<number | null>(null)
const selectedRows = ref<Row[]>([])

const inboundTypeOptions = [
  ['PRODUCTION', '生产入库'],
  ['STOCKING', '备货入库'],
  ['RMA', '售后 RMA 入库'],
  ['TRANSFER', '调拨入库'],
  ['SUPPLIER_VMI', '供应商 VMI 入库'],
  ['OTHER', '其他入库']
].map(([value, label]) => ({ value, label }))

const statusOptions = [
  ['CREATED', '待收货'],
  ['PARTIAL_RECEIVED', '部分收货'],
  ['RECEIVED', '完全收货'],
  ['ON_SHELF', '已上架'],
  ['CLOSED', '已关闭'],
  ['CANCELED', '已取消']
].map(([value, label]) => ({ value, label }))

const sapStatusOptions = [
  ['NOT_POSTED', '未回传'],
  ['SUCCESS', '回传成功'],
  ['POSTED', '已回传'],
  ['FAILED', '回传失败']
].map(([value, label]) => ({ value, label }))

onMounted(load)

async function load() {
  loading.value = true
  try {
    const params = { ...query }
    if (createdRange.value?.length === 2) {
      params.createdStart = createdRange.value[0]
      params.createdEnd = createdRange.value[1]
    }
    const data = await inboundService.list(params)
    rows.value = data.items || []
    total.value = data.total || 0
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
  createdRange.value = []
  query.pageNum = 1
  load()
}

function openDetail(row: Row) {
  router.push(`/inbound/arrival-notices/${row.id}`)
}

function openSnCollect(row: Row) {
  selectedOrderId.value = Number(row.id)
  selectedSnCollectLineId.value = null
  snCollectMode.value = 'order'
  snCollectVisible.value = true
}

function openLineSnCollect(order: Row, line: Row) {
  selectedOrderId.value = Number(order.id)
  selectedSnCollectLineId.value = Number(line.id)
  snCollectMode.value = 'line'
  snCollectVisible.value = true
}

function openReceive(row: Row) {
  selectedReceiveOrderId.value = Number(row.id)
  selectedReceiveLineId.value = null
  receiveVisible.value = true
}

function openLineReceive(order: Row, line: Row) {
  selectedReceiveOrderId.value = Number(order.id)
  selectedReceiveLineId.value = Number(line.id)
  receiveVisible.value = true
}

async function submitSapPost(row: Row) {
  await inboundService.sapPost(Number(row.id), { operator: 'admin' })
  ElMessage.success('SAP 入库回传已触发')
  await load()
}

async function cancelInboundOrder(row: Row) {
  await ElMessageBox.confirm(
    `确认取消预期到货通知单 ${row.order_no}？取消后该单据进入终态。`,
    '取消预期到货通知单',
    { type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回' }
  )
  await inboundService.cancel(Number(row.id), {
    operator: 'wh_admin',
    reason: '页面取消预期到货通知单'
  })
  ElMessage.success('预期到货通知单已取消')
  await load()
}

function handleSelectionChange(selection: Row[]) {
  selectedRows.value = selection
}

async function retrySelectedSap() {
  const rows = selectedRows.value.filter(canRetrySap)
  if (!rows.length) {
    ElMessage.warning('请先选择需要重传 SAP 的入库单')
    return
  }
  await inboundService.retrySap(rows.map((row) => Number(row.id)))
  ElMessage.success('SAP 重传已触发')
  await load()
}

async function downloadImportTemplate() {
  downloadTextFile(await inboundService.importTemplate())
}

async function importInboundRows(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const data = parseSectionedCsv(await readTextFile(file))
    const result = await inboundService.importRows(data.headers, data.lines)
    await ElMessageBox.alert(importResultHtml(result), '预期到货通知单导入结果', { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' })
    await load()
  } finally {
    input.value = ''
  }
}

async function confirmExport() {
  if (exportScope.value === 'SELECTED' && !selectedRows.value.length) {
    ElMessage.warning('请先勾选需要导出的入库单')
    return
  }
  const queryParams = { ...query }
  if (createdRange.value?.length === 2) {
    queryParams.createdStart = createdRange.value[0]
    queryParams.createdEnd = createdRange.value[1]
  }
  const file = await inboundService.exportData({
    exportScope: exportScope.value,
    orderIds: selectedRows.value.map((row) => Number(row.id)),
    queryParams
  })
  downloadTextFile(file)
  exportVisible.value = false
}

function canCollectSn(row: Row) {
  const lines = row.lines || []
  if (lines.length) {
    return lines.some((line: Row) => canLineCollectSn(row, line))
  }
  const remainingCollectQty = Number(row.planned_qty || 0) - Number(row.received_qty || 0) - Number(row.pending_receive_qty || 0)
  return !['RECEIVED', 'ON_SHELF', 'CLOSED', 'CANCELED'].includes(row.status) && remainingCollectQty > 0
}

function canReceive(row: Row) {
  return ['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(row.status)
    && Number(row.planned_qty || 0) > Number(row.received_qty || 0)
}

function isLineSnRequired(line: Row) {
  return line.snRequired === true || Number(line.sn_required ?? 0) === 1
}

function linePendingReceiveQty(line: Row) {
  return Number(line.pending_receive_qty ?? line.pendingReceiveQty ?? 0)
}

function lineRemainingCollectQty(line: Row) {
  return Math.max(Number(line.planned_qty ?? line.planQty ?? 0) - Number(line.received_qty ?? line.receivedQty ?? 0) - linePendingReceiveQty(line), 0)
}

function lineRemainingReceiveQty(line: Row) {
  return Math.max(Number(line.planned_qty ?? line.planQty ?? 0) - Number(line.received_qty ?? line.receivedQty ?? 0), 0)
}

function canLineCollectSn(order: Row, line: Row) {
  return isLineSnRequired(line) && !['RECEIVED', 'ON_SHELF', 'CLOSED', 'CANCELED'].includes(order.status) && lineRemainingCollectQty(line) > 0
}

function canLineReceive(order: Row, line: Row) {
  if (!['CREATED', 'PARTIAL_RECEIVED', 'RECEIVING'].includes(order.status)) return false
  if (isLineSnRequired(line)) return linePendingReceiveQty(line) > 0
  return lineRemainingReceiveQty(line) > 0
}

function canSapPost(row: Row) {
  return Number(row.pending_sap_receipt_count || 0) > 0
}

function canRetrySap(row: Row) {
  return canSapPost(row) || ['FAILED', 'NOT_POSTED'].includes(row.sap_post_status)
}

function canCancelInbound(row: Row) {
  return row.status === 'CREATED'
    && Number(row.collected_qty || 0) === 0
    && Number(row.pending_receive_qty || 0) === 0
    && Number(row.received_qty || 0) === 0
    && !['SUCCESS', 'POSTED'].includes(row.sap_post_status)
}

function inboundTypeLabel(value: string) {
  return inboundTypeOptions.find((item) => item.value === value)?.label || value || '-'
}

function statusLabel(value: string) {
  return statusOptions.find((item) => item.value === value)?.label || value || '-'
}

function statusType(value: string) {
  if (['RECEIVED', 'ON_SHELF', 'CLOSED'].includes(value)) return 'success'
  if (['CANCELED'].includes(value)) return 'danger'
  if (['RECEIVING', 'PARTIAL_RECEIVED'].includes(value)) return 'warning'
  return 'info'
}

function sapStatusLabel(value: string) {
  if (!value) return '未回传'
  return sapStatusOptions.find((item) => item.value === value)?.label || value
}

function sapStatusType(value: string) {
  if (['POSTED', 'SUCCESS'].includes(value)) return 'success'
  if (value === 'FAILED') return 'danger'
  return 'info'
}
</script>

<style scoped>
.page-header {
  display: block;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
}

.query-form {
  padding: 4px 0 2px;
}

.list-alert {
  margin-bottom: 12px;
}

.inbound-page :deep(.el-table__expanded-cell) {
  padding: 0;
  background: #fbfdff;
}

.inbound-line-expand-wrapper {
  box-sizing: border-box;
  width: calc(100% - 112px);
  margin-left: 96px;
  margin-right: 16px;
  padding: 10px 0 12px 12px;
  border-left: 3px solid #dcdfe6;
}

.inbound-line-subtable {
  width: max-content;
  min-width: 1180px;
  max-width: none;
}

.inbound-line-subtable :deep(.el-table__cell) {
  padding: 6px 0;
}

.inbound-line-subtable :deep(.cell) {
  white-space: nowrap;
}

.inbound-line-subtable :deep(.el-table__header-wrapper th) {
  background: #f8fafc;
}

.inbound-line-subtable :deep(.el-table-fixed-column--left),
.inbound-line-subtable :deep(.el-table-fixed-column--right),
.inbound-line-subtable :deep(.is-fixed) {
  position: static !important;
  left: auto !important;
  right: auto !important;
  z-index: auto !important;
  box-shadow: none !important;
}

.hidden-file-input {
  display: none;
}

:deep(.import-result-table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(.import-result-table th),
:deep(.import-result-table td) {
  border: 1px solid #dcdfe6;
  padding: 6px 8px;
  text-align: left;
}

@media (max-width: 900px) {
  .inbound-line-expand-wrapper {
    width: calc(100% - 64px);
    margin-left: 48px;
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
