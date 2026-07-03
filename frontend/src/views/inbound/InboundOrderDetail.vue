<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">预期到货通知单详情</div>
          <div class="muted">按单据主表查看完整产品行、SN 明细、操作记录与接口日志。</div>
        </div>
        <div class="header-actions">
          <el-button @click="router.back()">返回</el-button>
          <el-button v-if="canEditOrder()" type="primary" plain @click="openEdit()">编辑</el-button>
          <el-button v-if="canCancelOrder()" type="danger" plain @click="cancelOrder()">取消单据</el-button>
          <el-button v-if="canReceiveOrder()" type="success" @click="openReceive()">收货</el-button>
          <el-button type="primary" @click="load">刷新</el-button>
        </div>
      </div>
    </template>

    <template v-if="detail.order">
      <el-descriptions title="单据主信息" :column="4" border>
        <el-descriptions-item label="入库单号">{{ detail.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ inboundTypeLabel(detail.order.inbound_type) }}</el-descriptions-item>
        <el-descriptions-item label="来源系统">{{ detail.order.source_system }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ detail.order.source_order_no }}</el-descriptions-item>
        <el-descriptions-item label="仓库编码">{{ detail.order.warehouse_code }}</el-descriptions-item>
        <el-descriptions-item label="仓库名称">{{ detail.order.warehouse_name }}</el-descriptions-item>
        <el-descriptions-item label="货主">{{ detail.order.owner_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="货主名称">{{ detail.order.owner_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="出库国家">{{ detail.order.ship_from_country || '-' }}</el-descriptions-item>
        <el-descriptions-item label="SAP 工厂">{{ detail.order.sap_plant || '-' }}</el-descriptions-item>
        <el-descriptions-item label="计划到货日期">{{ detail.order.plan_arrival_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品行数">{{ detail.order.line_count || detail.details?.length || 0 }}</el-descriptions-item>
        <el-descriptions-item label="计划总数量">{{ detail.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="已采集数量">{{ detail.order.collected_qty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="待收货数量">{{ detail.order.pending_receive_qty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="已收总数量">{{ detail.order.received_qty }}</el-descriptions-item>
        <el-descriptions-item label="已上架数量">{{ detail.order.shelved_qty || 0 }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(detail.order.status)">{{ statusLabel(detail.order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="回传 SAP">
          <el-tag :type="sapStatusType(detail.order.sap_post_status)">{{ sapStatusLabel(detail.order.sap_post_status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最近 SAP 凭证">{{ detail.order.sap_material_doc_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="回传结果">{{ detail.order.sap_post_result || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.order.created_by || 'system' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.order.created_at }}</el-descriptions-item>
        <el-descriptions-item label="更新人">{{ detail.order.updated_by || 'system' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.order.updated_at || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs class="detail-tabs">
        <el-tab-pane label="入库明细">
          <el-table :data="detail.details || []" border height="300">
            <el-table-column prop="line_no" label="行号" width="76" />
            <el-table-column prop="product_code" label="产品编码" width="170" show-overflow-tooltip />
            <el-table-column prop="product_name" label="产品名称" min-width="180" show-overflow-tooltip />
            <el-table-column label="SN 管理" width="95">
              <template #default="{ row }">
                <el-tag :type="isSnRequired(row) ? 'success' : 'info'">{{ isSnRequired(row) ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="batch_no" label="批次号" width="170" show-overflow-tooltip />
            <el-table-column prop="planned_qty" label="计划数量" width="96" />
            <el-table-column label="已采集数量" width="110">
              <template #default="{ row }">{{ row.collected_sn_qty || 0 }}</template>
            </el-table-column>
            <el-table-column label="待收货数量" width="110">
              <template #default="{ row }">{{ row.pending_receive_qty || 0 }}</template>
            </el-table-column>
            <el-table-column prop="received_qty" label="已收数量" width="96" />
            <el-table-column prop="shelved_qty" label="已上架数量" width="110" />
            <el-table-column label="剩余可采集" width="110">
              <template #default="{ row }">{{ remainingQty(row) }}</template>
            </el-table-column>
            <el-table-column prop="line_status" label="行状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusType(row.line_status || row.status)">
                  {{ statusLabel(row.line_status || row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sap_plant" label="SAP 工厂" width="120" />
            <el-table-column prop="sap_storage_location" label="SAP 库存地点" width="130" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="190">
              <template #default="{ row }">
                <el-button v-if="isSnRequired(row)" link type="primary" :disabled="!canCollectSn(row)" @click="openSnCollect(row)">
                  采集 SN
                </el-button>
                <el-button link type="success" :disabled="!canReceiveLine(row)" @click="openReceive(row)">
                  收货
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="SN 明细">
          <el-table :data="detail.serialNumbers || []" border height="300">
            <el-table-column prop="sn_code" label="SN" width="190" show-overflow-tooltip />
            <el-table-column prop="product_code" label="产品编码" width="170" show-overflow-tooltip />
            <el-table-column prop="box_code" label="箱码" width="160" show-overflow-tooltip />
            <el-table-column prop="pallet_code" label="托盘码" width="170" show-overflow-tooltip />
            <el-table-column prop="status" label="当前状态" width="140">
              <template #default="{ row }">
                <el-tag :type="snStatusType(row.status)">{{ snStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location_code" label="当前库位" width="140">
              <template #default="{ row }">{{ row.location_code || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="110">
              <template #default="{ row }">
                <el-button v-if="row.status === 'COLLECTED'" link type="danger" @click="cancelCollectedSn(row)">
                  取消采集
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="箱托绑定">
          <el-table :data="detail.bindings || []" border height="260">
            <el-table-column prop="sn_code" label="SN" width="190" show-overflow-tooltip />
            <el-table-column prop="pallet_code" label="托盘码" width="170" show-overflow-tooltip />
            <el-table-column prop="box_code" label="箱码" width="160" show-overflow-tooltip />
            <el-table-column prop="inbound_order_no" label="ASN 单号" width="180" show-overflow-tooltip />
            <el-table-column prop="inbound_order_line_id" label="明细行 ID" width="110" />
            <el-table-column prop="bind_status" label="绑定状态" width="110" />
            <el-table-column prop="bind_time" label="绑定时间" width="170" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="收货批次记录">
          <el-table :data="detail.receiptRecords || []" border height="300">
            <el-table-column prop="receipt_no" label="收货批次号" width="190" show-overflow-tooltip />
            <el-table-column prop="receipt_time" label="收货时间" width="170" show-overflow-tooltip />
            <el-table-column prop="receipt_user" label="收货人" width="100" />
            <el-table-column prop="line_no" label="行号" width="76" />
            <el-table-column prop="product_code" label="产品编码" width="170" show-overflow-tooltip />
            <el-table-column prop="receive_qty" label="本次收货数量" width="120" />
            <el-table-column prop="sap_post_status" label="SAP 回传状态" width="130">
              <template #default="{ row }">
                <el-tag :type="sapStatusType(row.sap_post_status)">{{ sapStatusLabel(row.sap_post_status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sap_material_doc_no" label="SAP 凭证号" width="150" show-overflow-tooltip />
            <el-table-column prop="sap_post_result" label="回传结果" min-width="220" show-overflow-tooltip />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button v-if="canCancelReceipt(row)" link type="danger" @click="cancelReceipt(row)">
                  取消收货
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="操作记录">
          <el-table :data="detail.operationLogs || []" border height="260">
            <el-table-column prop="operator" label="操作人" width="120" />
            <el-table-column prop="action" label="操作类型" width="190" />
            <el-table-column prop="created_at" label="操作时间" width="170" show-overflow-tooltip />
            <el-table-column prop="message" label="操作说明" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="接口日志">
          <el-table :data="detail.interfaceLogs || []" border height="260">
            <el-table-column prop="interface_name" label="接口名称" width="190" show-overflow-tooltip />
            <el-table-column prop="source_system" label="来源系统" width="110" />
            <el-table-column prop="target_system" label="目标系统" width="110" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="created_at" label="请求时间" width="170" show-overflow-tooltip />
            <el-table-column prop="error_message" label="失败原因" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>

    <el-empty v-else-if="!loading" description="未找到单据" />
  </el-card>

  <SnCollectDialog
    v-model="snDialogVisible"
    mode="line"
    :order-id="Number(route.params.id)"
    :line-id="selectedLineId"
    @success="load"
  />
  <ReceiveConfirmDialog
    v-model="receiveVisible"
    :order-id="Number(route.params.id)"
    :line-id="selectedReceiveLineId"
    @success="load"
  />
  <NewInboundOrderDialog
    v-model="editVisible"
    mode="edit"
    :order-id="detail.order?.id"
    :initial-data="detail"
    @success="handleEditSuccess"
  />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inboundService } from '../../api/services'
import {
  canCancelInboundOrder,
  canCancelReceiveInboundOrder,
  canCollectSnInboundOrder,
  canEditInboundOrder,
  canReceiveInboundOrder
} from '../../constants/orderActionPermissions'
import SnCollectDialog from './components/SnCollectDialog.vue'
import ReceiveConfirmDialog from './components/ReceiveConfirmDialog.vue'
import NewInboundOrderDialog from './components/NewInboundOrderDialog.vue'
import { sapStatusLabel as i18nSapStatusLabel, statusLabel as i18nStatusLabel } from '../../i18n'

type Row = Record<string, any>

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detail = ref<Row>({})
const snDialogVisible = ref(false)
const selectedLineId = ref<number | null>(null)
const receiveVisible = ref(false)
const selectedReceiveLineId = ref<number | null>(null)
const editVisible = ref(false)

const inboundTypeMap: Row = {
  PRODUCTION: '生产入库',
  STOCKING: '备货入库',
  RMA: '售后 RMA 入库',
  TRANSFER: '调拨入库',
  SUPPLIER_VMI: '供应商 VMI 入库',
  OTHER: '其他入库',
  STOCK_IN: '备货入库'
}

const statusMap: Row = {
  CREATED: '创建',
  PARTIAL_RECEIVED: '部分收货',
  RECEIVING: '部分收货',
  RECEIVED: '完全收货',
  ON_SHELF: '已上架',
  CLOSED: '订单关闭',
  CANCELED: '已取消',
  SAP_FAILED: 'SAP 回传失败'
}

onMounted(load)

async function load() {
  loading.value = true
  try {
    detail.value = await inboundService.detail(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

function openSnCollect(row: Row) {
  selectedLineId.value = Number(row.id)
  snDialogVisible.value = true
}

function openReceive(row?: Row) {
  selectedReceiveLineId.value = row?.id ? Number(row.id) : null
  receiveVisible.value = true
}

function openEdit() {
  editVisible.value = true
}

async function handleEditSuccess() {
  editVisible.value = false
  await load()
}

function canReceiveOrder() {
  const order = detail.value.order || {}
  return canReceiveInboundOrder({ ...order, lines: detail.value.details || [] })
}

function canReceiveLine(row: Row) {
  return canReceiveInboundOrder(detail.value.order || {}, row)
}

function canCollectSn(row: Row) {
  return canCollectSnInboundOrder(detail.value.order || {}, row)
}

function isSnRequired(row: Row) {
  return Number(row.sn_required ?? 1) === 1
}

function remainingQty(row: Row) {
  return Math.max(Number(row.planned_qty || 0) - Number(row.received_qty || 0) - Number(row.pending_receive_qty || 0), 0)
}

function receiveRemainingQty(row: Row) {
  return Math.max(Number(row.planned_qty || 0) - Number(row.received_qty || 0), 0)
}

async function cancelCollectedSn(row: Row) {
  await inboundService.cancelSnCollection(Number(route.params.id), Number(row.inbound_order_line_id), {
    serialNumbers: [row.sn_code],
    operator: 'wh_admin'
  })
  ElMessage.success('已取消未收货 SN 采集，可重新采集')
  await load()
}

async function cancelOrder() {
  await ElMessageBox.confirm(
    `确认取消预期到货通知单 ${detail.value.order?.order_no}？`,
    '取消预期到货通知单',
    { type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回' }
  )
  await inboundService.cancel(Number(route.params.id), {
    operator: 'wh_admin',
    reason: '详情页取消预期到货通知单'
  })
  ElMessage.success('预期到货通知单已取消')
  await load()
}

async function cancelReceipt(row: Row) {
  await ElMessageBox.confirm(
    `确认取消收货批次 ${row.receipt_no}？已回传 SAP 成功的批次不允许直接取消。`,
    '取消收货',
    { type: 'warning', confirmButtonText: '确认取消', cancelButtonText: '返回' }
  )
  await inboundService.cancelReceipt(Number(route.params.id), Number(row.receipt_id || row.id), {
    operator: 'wh_admin',
    reason: '详情页取消收货批次'
  })
  ElMessage.success('收货批次已取消')
  await load()
}

function canCancelOrder() {
  const order = detail.value.order || {}
  const hasCollectedSn = (detail.value.serialNumbers || []).some((row: Row) =>
    ['COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(row.status)
  )
  const hasReceipt = (detail.value.receiptRecords || []).some((row: Row) => row.status !== 'CANCELED')
  return canCancelInboundOrder(order) && !hasCollectedSn && !hasReceipt
}

function canEditOrder() {
  const order = detail.value.order || {}
  const hasCollectedSn = (detail.value.serialNumbers || []).some((row: Row) =>
    ['COLLECTED', 'RECEIVED', 'ON_SHELF'].includes(row.status)
  )
  const hasReceipt = (detail.value.receiptRecords || []).some((row: Row) => row.status !== 'CANCELED')
  return canEditInboundOrder(order) && !hasCollectedSn && !hasReceipt
}

function canCancelReceipt(row: Row) {
  return canCancelReceiveInboundOrder({
    ...row,
    status: detail.value.order?.status,
    receipt_status: row.status
  })
}

function inboundTypeLabel(value: string) {
  return inboundTypeMap[value] || value || '-'
}

function statusLabel(value: string) {
  return i18nStatusLabel(value, statusMap[value] || value || '-')
}

function statusType(value: string) {
  if (['RECEIVED', 'ON_SHELF', 'CLOSED'].includes(value)) return 'success'
  if (['SAP_FAILED', 'CANCELED'].includes(value)) return 'danger'
  if (['RECEIVING', 'PARTIAL_RECEIVED'].includes(value)) return 'warning'
  return 'info'
}

function sapStatusLabel(value: string) {
  return i18nSapStatusLabel(value || 'NOT_POSTED')
}

function sapStatusType(value: string) {
  if (['POSTED', 'SUCCESS'].includes(value)) return 'success'
  if (value === 'FAILED') return 'danger'
  return 'info'
}

function snStatusLabel(value: string) {
  const map: Row = {
    ISSUED: '已下发',
    COLLECTED: '已采集/待收货',
    RECEIVED: '已收货',
    ON_SHELF: '已上架',
    ALLOCATED: '已分配',
    SHIPPED: '已出库'
  }
  return map[value] || value || '-'
}

function snStatusType(value: string) {
  if (['RECEIVED', 'ON_SHELF'].includes(value)) return 'success'
  if (value === 'COLLECTED') return 'warning'
  return 'info'
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-tabs {
  margin-top: 18px;
}
</style>
