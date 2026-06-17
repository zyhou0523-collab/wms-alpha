<template>
  <el-card class="page-card outbound-page" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">发运订单</div>
          <div class="muted">销售出库、调拨出库、售后出库统一在发运订单主表中管理，产品明细行在详情中查看。</div>
        </div>
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </template>

    <el-form :model="query" inline label-width="96px" class="query-form">
      <el-form-item label="发运订单号">
        <el-input v-model="query.orderNo" clearable placeholder="OUT202606120001" />
      </el-form-item>
      <el-form-item label="来源单号">
        <el-input v-model="query.sourceOrderNo" clearable placeholder="SO / STO / RMA" />
      </el-form-item>
      <el-form-item label="订单类型">
        <el-select v-model="query.outboundType" clearable filterable placeholder="全部" style="width: 180px">
          <el-option v-for="item in outboundTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="发货仓">
        <el-input v-model="query.warehouseCode" clearable placeholder="WH-HZ-CENTRAL" />
      </el-form-item>
      <el-form-item label="客户">
        <el-input v-model="query.customerCode" clearable placeholder="CUST-TESLA-001" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable filterable placeholder="全部" style="width: 180px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增模拟</el-button>
    </div>

    <el-alert
      class="list-alert"
      type="info"
      show-icon
      :closable="false"
      title="列表只展示发运订单主表，一张发运订单仅一行；明细行、分配、拣货、复核、发货和日志请在详情中查看。"
    />

    <el-table v-loading="loading" :data="rows" border stripe style="width: 100%">
      <el-table-column type="index" label="序号" width="64" />
      <el-table-column prop="order_no" label="发运订单号" width="180" show-overflow-tooltip />
      <el-table-column prop="source_system" label="来源系统" width="110" />
      <el-table-column prop="outbound_type" label="订单类型" width="120">
        <template #default="{ row }">{{ outboundTypeLabel(row.outbound_type) }}</template>
      </el-table-column>
      <el-table-column prop="source_order_no" label="来源单号" width="170" show-overflow-tooltip />
      <el-table-column prop="customer_code" label="客户编码" width="140" show-overflow-tooltip />
      <el-table-column prop="customer_name" label="客户名称" width="170" show-overflow-tooltip />
      <el-table-column prop="warehouse_code" label="发货仓" width="150" show-overflow-tooltip />
      <el-table-column prop="target_warehouse_code" label="目标仓库" width="150" show-overflow-tooltip />
      <el-table-column prop="line_count" label="产品行数" width="90" />
      <el-table-column prop="planned_qty" label="订单数量" width="100" />
      <el-table-column prop="allocated_qty" label="分配数量" width="100" />
      <el-table-column prop="picked_qty" label="拣货数量" width="100" />
      <el-table-column prop="review_qty" label="复核数量" width="100" />
      <el-table-column prop="shipped_qty" label="发货数量" width="100" />
      <el-table-column prop="status" label="状态" width="130">
        <template #default="{ row }"><el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="170" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="390">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="canAllocate(row)" link type="primary" @click="openAllocation(row)">库存分配</el-button>
          <el-button v-if="canGeneratePicking(row)" link type="primary" @click="generatePicking(row)">生成拣货</el-button>
          <el-button v-if="canPick(row)" link type="primary" @click="openPickingFromOrder(row)">扫码拣货</el-button>
          <el-button v-if="canReview(row)" link type="warning" @click="openReview(row)">出库复核</el-button>
          <el-button v-if="canShip(row)" link type="success" @click="openShipment(row)">发货确认</el-button>
          <el-button v-if="row.status === 'CALLBACK_FAILED'" link type="warning" @click="retryTrace(row)">重试追溯</el-button>
          <el-button v-if="row.status === 'CALLBACK_FAILED'" link type="warning" @click="retrySap(row)">重试 SAP</el-button>
          <el-button v-if="canCancel(row)" link type="danger" @click="cancelAllocation(row)">取消出库</el-button>
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

  <el-dialog v-model="createVisible" title="新增模拟发运订单" width="760px">
    <el-form :model="createForm" label-width="120px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="发运订单号"><el-input v-model="createForm.outboundOrderNo" placeholder="留空自动生成" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="来源单号"><el-input v-model="createForm.sourceOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="来源系统"><el-input v-model="createForm.sourceSystem" /></el-form-item></el-col>
        <el-col :span="12">
          <el-form-item label="订单类型">
            <el-select v-model="createForm.outboundType" style="width: 100%">
              <el-option v-for="item in outboundTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12"><el-form-item label="产品编码"><el-input v-model="createForm.productCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="发货仓"><el-input v-model="createForm.warehouseCode" /></el-form-item></el-col>
        <el-col v-if="createForm.outboundType === 'TRANSFER'" :span="12"><el-form-item label="目标仓"><el-input v-model="createForm.targetWarehouseCode" /></el-form-item></el-col>
        <el-col v-else :span="12"><el-form-item label="客户编码"><el-input v-model="createForm.customerCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="数量"><el-input-number v-model="createForm.qty" :min="1" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="24"><el-form-item label="备注"><el-input v-model="createForm.remark" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取消</el-button>
      <el-button type="primary" @click="submitCreate">创建</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="detailVisible" title="发运订单详情" size="72%">
    <template v-if="detail.order">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="发运订单">{{ detail.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ outboundTypeLabel(detail.order.outbound_type) }}</el-descriptions-item>
        <el-descriptions-item label="来源单">{{ detail.order.source_order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(detail.order.status)">{{ statusLabel(detail.order.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="发货仓">{{ detail.order.warehouse_code }}</el-descriptions-item>
        <el-descriptions-item label="目标仓">{{ detail.order.target_warehouse_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ detail.order.customer_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="SAP 凭证">{{ detail.order.sap_material_doc_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ detail.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="分配数量">{{ detail.order.allocated_qty }}</el-descriptions-item>
        <el-descriptions-item label="拣货数量">{{ detail.order.picked_qty }}</el-descriptions-item>
        <el-descriptions-item label="发货数量">{{ detail.order.shipped_qty }}</el-descriptions-item>
      </el-descriptions>
      <el-tabs class="detail-tabs">
        <el-tab-pane label="产品明细">
          <el-table :data="detail.details || []" border height="220">
            <el-table-column prop="line_no" label="行号" width="80" />
            <el-table-column prop="product_code" label="产品编码" width="170" />
            <el-table-column prop="product_name" label="产品名称" min-width="180" />
            <el-table-column prop="planned_qty" label="订单" width="80" />
            <el-table-column prop="allocated_qty" label="分配" width="80" />
            <el-table-column prop="picked_qty" label="拣货" width="80" />
            <el-table-column prop="review_qty" label="复核" width="80" />
            <el-table-column prop="shipped_qty" label="发货" width="80" />
            <el-table-column prop="status" label="行状态" width="120" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="分配记录">
          <el-table :data="detail.allocations || []" border height="260">
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="location_code" label="库位" width="130" />
            <el-table-column prop="batch_no" label="批次" width="160" />
            <el-table-column prop="allocation_status" label="状态" width="120" />
            <el-table-column prop="allocation_mode" label="模式" width="100" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="拣货记录">
          <el-table :data="detail.pickingRecords || []" border height="240">
            <el-table-column prop="task_no" label="任务号" />
            <el-table-column prop="sn_code" label="SN" />
            <el-table-column prop="location_code" label="库位" />
            <el-table-column prop="picker" label="拣货人" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="复核记录">
          <el-table :data="detail.reviewRecords || []" border height="240">
            <el-table-column prop="sn_code" label="SN" />
            <el-table-column prop="reviewer" label="复核人" />
            <el-table-column prop="result" label="结果" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="发货记录">
          <el-table :data="detail.shipments || []" border height="240">
            <el-table-column prop="shipment_no" label="发货记录号" />
            <el-table-column prop="carrier" label="承运商" />
            <el-table-column prop="tracking_no" label="物流单号" />
            <el-table-column prop="shipped_qty" label="数量" />
            <el-table-column prop="shipper" label="发货人" />
            <el-table-column prop="ship_time" label="发货时间" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="接口日志">
          <el-table :data="detail.interfaceLogs || []" border height="260">
            <el-table-column prop="interface_name" label="接口" width="190" />
            <el-table-column prop="source_system" label="来源" width="90" />
            <el-table-column prop="target_system" label="目标" width="90" />
            <el-table-column prop="status" label="状态" width="100" />
            <el-table-column prop="retry_count" label="重试" width="80" />
            <el-table-column prop="error_message" label="失败原因" />
            <el-table-column prop="created_at" label="时间" width="170" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="操作日志">
          <el-table :data="detail.operationLogs || []" border height="240">
            <el-table-column prop="action" label="动作" />
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="result" label="结果" />
            <el-table-column prop="message" label="说明" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>

  <el-drawer v-model="allocationVisible" title="库存分配" size="70%">
    <template v-if="allocationData.order">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="发运订单">{{ allocationData.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ allocationData.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="已分配">{{ allocationData.order.allocated_qty }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusLabel(allocationData.order.status) }}</el-descriptions-item>
      </el-descriptions>
      <div class="action-strip">
        <el-button type="primary" @click="autoAllocate">系统自动分配 FIFO</el-button>
        <el-button type="success" :disabled="!selectedSn.length" @click="manualAllocate">人工指定库存</el-button>
        <el-button type="danger" plain @click="cancelCurrentAllocation">取消分配</el-button>
      </div>
      <el-tabs>
        <el-tab-pane label="推荐分配库存">
          <el-table :data="allocationData.recommendedInventory || []" border height="220">
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="location_code" label="库位" width="130" />
            <el-table-column prop="batch_no" label="批次" width="170" />
            <el-table-column prop="inbound_date" label="入库日期" width="140" />
            <el-table-column prop="product_code" label="产品" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="可用库存/人工指定">
          <el-table :data="allocationData.availableInventory || []" border height="320" @selection-change="onManualSelection">
            <el-table-column type="selection" width="44" :selectable="selectableInventory" />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="location_code" label="库位" width="130" />
            <el-table-column prop="batch_no" label="批次" width="160" />
            <el-table-column prop="inventory_status" label="库存状态" width="110" />
            <el-table-column prop="quality_status" label="质量状态" width="110" />
            <el-table-column prop="locked_flag" label="锁定" width="80">
              <template #default="{ row }">{{ row.locked_flag ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="frozen_flag" label="冻结库位" width="100">
              <template #default="{ row }">{{ row.frozen_flag ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="分配结果">
          <el-table :data="allocationData.allocations || []" border height="260">
            <el-table-column prop="allocation_no" label="分配记录" width="190" />
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="location_code" label="库位" width="130" />
            <el-table-column prop="allocation_mode" label="模式" width="100" />
            <el-table-column prop="allocation_status" label="状态" width="120" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>

  <el-dialog v-model="scanVisible" :title="scanTask?.task_no ? `扫码拣货 ${scanTask.task_no}` : '扫码拣货'" width="680px">
    <el-input ref="scanInputRef" v-model="scanText" class="scan-box" type="textarea" :rows="8" placeholder="扫描或粘贴 SN，回车分隔" />
    <template #footer>
      <el-button @click="scanVisible = false">取消</el-button>
      <el-button type="primary" @click="submitPickingScan">确认拣货</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="reviewVisible" title="出库复核" width="680px">
    <el-input v-model="reviewText" class="scan-box" type="textarea" :rows="8" placeholder="扫描或粘贴待复核 SN" />
    <template #footer>
      <el-button @click="reviewVisible = false">取消</el-button>
      <el-button type="primary" @click="submitReview">确认复核</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="shipmentVisible" title="发货确认" width="720px">
    <el-form :model="shipmentForm" label-width="110px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="承运商"><el-input v-model="shipmentForm.carrier" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="物流单号"><el-input v-model="shipmentForm.trackingNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="发货人"><el-input v-model="shipmentForm.shipper" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="发货时间"><el-date-picker v-model="shipmentForm.shipTime" type="datetime" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="24"><el-form-item label="备注"><el-input v-model="shipmentForm.remark" /></el-form-item></el-col>
        <el-col :span="12"><el-checkbox v-model="shipmentForm.forceTraceFail">模拟追溯回传失败</el-checkbox></el-col>
        <el-col :span="12"><el-checkbox v-model="shipmentForm.forceSapFail">模拟 SAP 扣减失败</el-checkbox></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="shipmentVisible = false">取消</el-button>
      <el-button type="success" @click="submitShipment">确认发货</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { outboundService } from '../../api/services'

type Row = Record<string, any>

const loading = ref(false)
const rows = ref<Row[]>([])
const total = ref(0)
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })
const createVisible = ref(false)
const detailVisible = ref(false)
const allocationVisible = ref(false)
const scanVisible = ref(false)
const reviewVisible = ref(false)
const shipmentVisible = ref(false)
const createForm = reactive<Row>({})
const shipmentForm = reactive<Row>({})
const allocationData = ref<Row>({})
const detail = ref<Row>({})
const selectedSn = ref<string[]>([])
const selectedOrder = ref<Row | null>(null)
const scanTask = ref<Row | null>(null)
const scanText = ref('')
const reviewText = ref('')
const scanInputRef = ref()

const outboundTypeOptions = [
  ['SALES', '销售出库'],
  ['TRANSFER', '调拨出库'],
  ['AFTERSALE', '售后出库']
].map(([value, label]) => ({ value, label }))

const statusOptions = [
  ['PENDING_ALLOC', '待分配'],
  ['ALLOCATED', '已分配'],
  ['ALLOCATION_EXCEPTION', '分配异常'],
  ['PICKING', '拣货中'],
  ['PICKED', '已拣货'],
  ['REVIEWING', '复核中'],
  ['REVIEWED', '已复核'],
  ['SHIPPED', '已发货'],
  ['CALLBACK_SUCCESS', '回传成功'],
  ['CALLBACK_FAILED', '回传失败'],
  ['CANCELED', '已取消']
].map(([value, label]) => ({ value, label }))

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await outboundService.list({ ...query })
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
  query.pageNum = 1
  load()
}

function openCreate() {
  Object.assign(createForm, {
    outboundOrderNo: '',
    sourceOrderNo: `SO${Date.now()}`,
    sourceSystem: 'FULFILLMENT',
    outboundType: 'SALES',
    warehouseCode: 'WH-HZ-CENTRAL',
    targetWarehouseCode: 'WH-SH-REGION',
    customerCode: 'CUST-TESLA-001',
    productCode: 'GT3-30KD1R11001',
    qty: 5,
    remark: '页面新增模拟'
  })
  createVisible.value = true
}

async function submitCreate() {
  if (createForm.outboundType === 'TRANSFER') await outboundService.createTransferMock({ ...createForm })
  else if (createForm.outboundType === 'SALES') await outboundService.createSalesMock({ ...createForm })
  else await outboundService.createShippingMock({ ...createForm })
  ElMessage.success('模拟发运订单已创建')
  createVisible.value = false
  await load()
}

async function openDetail(row: Row) {
  detail.value = await outboundService.detail(Number(row.id))
  detailVisible.value = true
}

async function openAllocation(row: Row) {
  selectedOrder.value = row
  selectedSn.value = []
  allocationData.value = await outboundService.allocationView(Number(row.id))
  allocationVisible.value = true
}

async function autoAllocate() {
  if (!selectedOrder.value) return
  const data = await outboundService.allocateAuto(Number(selectedOrder.value.id), { operator: 'wh_admin' })
  allocationData.value = await outboundService.allocationView(Number(selectedOrder.value.id))
  const status = data?.order?.status || allocationData.value?.order?.status
  if (status === 'ALLOCATION_EXCEPTION') ElMessage.warning('库存不足，已生成分配异常记录')
  else ElMessage.success('自动分配完成，库存和 SN 已锁定')
  await load()
}

async function manualAllocate() {
  if (!selectedOrder.value) return
  await outboundService.allocateManual(Number(selectedOrder.value.id), { serialNumbers: selectedSn.value, operator: 'wh_admin' })
  ElMessage.success('人工指定分配完成')
  allocationData.value = await outboundService.allocationView(Number(selectedOrder.value.id))
  selectedSn.value = []
  await load()
}

async function cancelCurrentAllocation() {
  if (!selectedOrder.value) return
  await outboundService.cancelAllocation(Number(selectedOrder.value.id), { operator: 'wh_admin' })
  ElMessage.success('分配已取消，库存和 SN 锁定已释放')
  allocationData.value = await outboundService.allocationView(Number(selectedOrder.value.id))
  await load()
}

async function cancelAllocation(row: Row) {
  await outboundService.cancelAllocation(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('出库已取消或分配已释放')
  await load()
}

async function generatePicking(row: Row) {
  await outboundService.generatePickingTasks(Number(row.id), { operator: 'wh_admin' })
  ElMessage.success('拣货任务已生成')
  await load()
}

async function openPickingFromOrder(row: Row) {
  const data = await outboundService.detail(Number(row.id))
  const task = (data.pickingTasks || []).find((item: Row) => item.status !== 'PICKED') || (data.pickingTasks || [])[0]
  if (!task) {
    ElMessage.warning('请先生成拣货任务')
    return
  }
  openPicking(task)
}

async function openPicking(task: Row) {
  scanTask.value = task
  scanText.value = ''
  scanVisible.value = true
  await nextTick()
  scanInputRef.value?.focus?.()
}

async function submitPickingScan() {
  if (!scanTask.value) return
  await outboundService.scanPicking(Number(scanTask.value.id), { serialNumbers: parseLines(scanText.value), operator: 'wh_admin' })
  ElMessage.success('拣货扫描完成')
  scanVisible.value = false
  await load()
}

async function openReview(row: Row) {
  selectedOrder.value = row
  const data = await outboundService.detail(Number(row.id))
  reviewText.value = (data.allocations || [])
    .filter((item: Row) => item.allocation_status === 'PICKED')
    .map((item: Row) => item.sn_code)
    .join('\n')
  reviewVisible.value = true
}

async function submitReview() {
  if (!selectedOrder.value) return
  await outboundService.review(Number(selectedOrder.value.id), { serialNumbers: parseLines(reviewText.value), operator: 'logistics' })
  ElMessage.success('出库复核完成')
  reviewVisible.value = false
  await load()
}

function openShipment(row: Row) {
  selectedOrder.value = row
  Object.assign(shipmentForm, {
    carrier: 'SF',
    trackingNo: `SF${Date.now()}`,
    shipper: 'logistics',
    shipTime: new Date(),
    remark: '',
    forceTraceFail: false,
    forceSapFail: false
  })
  shipmentVisible.value = true
}

async function submitShipment() {
  if (!selectedOrder.value) return
  await outboundService.ship(Number(selectedOrder.value.id), { ...shipmentForm, operator: 'logistics' })
  ElMessage.success('发货确认完成，已扣减库存并触发追溯/SAP Mock')
  shipmentVisible.value = false
  await load()
}

async function retryTrace(row: Row) {
  await outboundService.traceCallback(Number(row.id), { operator: 'admin' })
  ElMessage.success('追溯回传已重试')
  await load()
}

async function retrySap(row: Row) {
  await outboundService.sapCallback(Number(row.id), { operator: 'admin' })
  ElMessage.success('SAP 出库扣减已重试')
  await load()
}

function onManualSelection(selection: Row[]) {
  selectedSn.value = selection.map((row) => String(row.sn_code))
}

function selectableInventory(row: Row) {
  return row.sn_status === 'ON_SHELF'
    && row.inventory_status === 'QUALIFIED'
    && row.quality_status === 'QUALIFIED'
    && !row.locked_flag
    && !row.frozen_flag
    && Number(row.available_qty || 0) > 0
}

function parseLines(value = '') {
  return String(value).split(/\r?\n|,|;|\s+/).map((item) => item.trim()).filter(Boolean)
}

function canAllocate(row: Row) {
  return ['PENDING_ALLOC', 'ALLOCATION_EXCEPTION'].includes(row.status)
}

function canGeneratePicking(row: Row) {
  return row.status === 'ALLOCATED'
}

function canPick(row: Row) {
  return row.status === 'PICKING'
}

function canReview(row: Row) {
  return ['PICKED', 'REVIEWING'].includes(row.status)
}

function canShip(row: Row) {
  return row.status === 'REVIEWED'
}

function canCancel(row: Row) {
  return ['PENDING_ALLOC', 'ALLOCATED', 'ALLOCATION_EXCEPTION'].includes(row.status)
}

function outboundTypeLabel(value: string) {
  return outboundTypeOptions.find((item) => item.value === value)?.label || value || '-'
}

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label || status || '-'
}

function statusType(status: string) {
  if (['CALLBACK_SUCCESS', 'SHIPPED', 'REVIEWED', 'PICKED'].includes(status)) return 'success'
  if (['CALLBACK_FAILED', 'ALLOCATION_EXCEPTION', 'CANCELED'].includes(status)) return 'danger'
  if (['PICKING', 'REVIEWING', 'PENDING_ALLOC'].includes(status)) return 'warning'
  if (status === 'ALLOCATED') return 'primary'
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

.query-form {
  padding: 4px 0 2px;
}

.toolbar,
.action-strip {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-strip {
  margin-top: 12px;
}

.list-alert {
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.scan-box {
  margin-top: 12px;
}

.detail-tabs {
  margin-top: 16px;
}
</style>
