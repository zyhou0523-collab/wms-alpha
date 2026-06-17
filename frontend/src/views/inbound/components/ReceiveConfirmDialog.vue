<template>
  <el-dialog v-model="visible" title="入库收货确认" width="1220px" destroy-on-close>
    <div v-loading="loading">
      <el-descriptions v-if="detail.order" title="单据主信息" :column="4" border>
        <el-descriptions-item label="入库单号">{{ detail.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">{{ inboundTypeLabel(detail.order.inbound_type) }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ detail.order.source_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库仓库">{{ detail.order.warehouse_code }} / {{ detail.order.warehouse_name }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="statusType(detail.order.status)">{{ statusLabel(detail.order.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="计划总数">{{ detail.order.planned_qty }}</el-descriptions-item>
        <el-descriptions-item label="已收总数">{{ detail.order.received_qty }}</el-descriptions-item>
        <el-descriptions-item label="本次收货">{{ totalReceiveQty }}</el-descriptions-item>
      </el-descriptions>

      <el-alert
        class="receive-tip"
        type="info"
        show-icon
        :closable="false"
        title="SN 管理产品必须先采集 SN，再按待收 SN 收货；非 SN 管理产品可直接输入本次收货数量。"
      />

      <el-form class="receive-form" label-width="96px">
        <el-form-item label="目标库位" required>
          <el-select
            v-model="selectedLocationCode"
            filterable
            placeholder="请选择本次收货目标库位"
            style="width: 360px"
          >
            <el-option
              v-for="location in locationOptions"
              :key="location.location_code"
              :label="`${location.location_code} / ${location.location_name || location.area_code || ''}`"
              :value="location.location_code"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table :data="receiveRows" border height="390" empty-text="当前没有可收货的产品行">
        <el-table-column label="选择" width="70">
          <template #default="{ row }">
            <el-checkbox
              :model-value="selectedLineIds.includes(Number(row.id))"
              :disabled="!row.canReceive"
              @change="toggleLine(Number(row.id))"
            />
          </template>
        </el-table-column>
        <el-table-column type="expand" width="46">
          <template #default="{ row }">
            <el-table v-if="row.snRequired" :data="row.pendingSerials" border size="small" empty-text="该产品行暂无待收货 SN">
              <el-table-column prop="sn_code" label="SN" width="210" show-overflow-tooltip />
              <el-table-column prop="product_code" label="产品编码" width="180" />
              <el-table-column prop="pallet_code" label="托盘码" width="180" show-overflow-tooltip />
              <el-table-column prop="box_code" label="箱码" width="160" show-overflow-tooltip />
              <el-table-column prop="created_at" label="采集时间" width="180" show-overflow-tooltip />
              <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row: sn }">
                  <el-tag type="warning">{{ snStatusLabel(sn.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-alert
              v-else
              type="success"
              :closable="false"
              title="非 SN 管理产品不需要展开 SN 明细，直接在本次收货数量中录入即可。"
            />
          </template>
        </el-table-column>
        <el-table-column prop="line_no" label="行号" width="76" />
        <el-table-column prop="product_code" label="产品编码" width="170" show-overflow-tooltip />
        <el-table-column prop="product_name" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="SN 管理" width="95">
          <template #default="{ row }">
            <el-tag :type="row.snRequired ? 'success' : 'info'">{{ row.snRequired ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planned_qty" label="计划数量" width="96" />
        <el-table-column prop="received_qty" label="历史已收" width="96" />
        <el-table-column label="已采集待收" width="110">
          <template #default="{ row }">{{ row.pendingSerials.length }}</template>
        </el-table-column>
        <el-table-column label="本次收货" width="140">
          <template #default="{ row }">
            <span v-if="row.snRequired">{{ selectedLineIds.includes(Number(row.id)) ? row.pendingSerials.length : 0 }}</span>
            <el-input-number
              v-else
              v-model="row.receiveQty"
              :min="0"
              :max="row.remainingQty"
              :disabled="!selectedLineIds.includes(Number(row.id))"
              style="width: 112px"
            />
          </template>
        </el-table-column>
        <el-table-column label="收货后累计" width="110">
          <template #default="{ row }">{{ Number(row.received_qty || 0) + selectedReceiveQty(row) }}</template>
        </el-table-column>
        <el-table-column label="剩余未收" width="100">
          <template #default="{ row }">{{ Math.max(Number(row.planned_qty || 0) - Number(row.received_qty || 0) - selectedReceiveQty(row), 0) }}</template>
        </el-table-column>
        <el-table-column label="作业提示" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.receiveHint }}</template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!totalReceiveQty || !selectedLocationCode" @click="submit">
        确认收货
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { inboundService, locationService } from '../../../api/services'

type Row = Record<string, any>

const props = withDefaults(defineProps<{
  modelValue: boolean
  orderId: number | null
  lineId?: number | null
}>(), {
  lineId: null
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'success'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const detail = reactive<Row>({})
const receiveRows = ref<Row[]>([])
const selectedLineIds = ref<number[]>([])
const selectedLocationCode = ref('')
const locationOptions = ref<Row[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const totalReceiveQty = computed(() => receiveRows.value.reduce((sum, row) => sum + selectedReceiveQty(row), 0))

watch(
  () => props.modelValue,
  async (open) => {
    if (open) await load()
  }
)

watch(
  () => props.lineId,
  async () => {
    if (props.modelValue) await load()
  }
)

async function load() {
  if (!props.orderId) return
  loading.value = true
  selectedLineIds.value = []
  selectedLocationCode.value = ''
  try {
    const data = await inboundService.detail(props.orderId)
    Object.keys(detail).forEach((key) => delete detail[key])
    Object.assign(detail, data)
    buildReceiveRows()
    await loadLocations(String(detail.order?.warehouse_code || ''))
    selectedLineIds.value = receiveRows.value.filter((row) => row.canReceive).map((line) => Number(line.id))
  } finally {
    loading.value = false
  }
}

function buildReceiveRows() {
  const serials = detail.serialNumbers || []
  receiveRows.value = (detail.details || [])
    .filter((line: Row) => !props.lineId || Number(line.id) === Number(props.lineId))
    .map((line: Row) => {
      const snRequired = Number(line.sn_required ?? 1) === 1
      const pendingSerials = serials.filter((sn: Row) => Number(sn.inbound_order_line_id) === Number(line.id) && sn.status === 'COLLECTED')
      const remainingQty = Math.max(Number(line.planned_qty || 0) - Number(line.received_qty || 0), 0)
      const canReceive = snRequired ? pendingSerials.length > 0 : remainingQty > 0
      return {
        ...line,
        snRequired,
        pendingSerials,
        remainingQty,
        receiveQty: snRequired ? pendingSerials.length : remainingQty,
        canReceive,
        receiveHint: snRequired
          ? (pendingSerials.length ? '按已采集 SN 收货' : '需先采集 SN')
          : '非 SN 管理，可直接收货'
      }
    })
}

async function loadLocations(warehouseCode: string) {
  const result = await locationService.list({ warehouseCode, pageNum: 1, pageSize: 200 })
  locationOptions.value = result.items || []
  selectedLocationCode.value = locationOptions.value[0]?.location_code || ''
}

function selectedReceiveQty(row: Row) {
  if (!selectedLineIds.value.includes(Number(row.id))) return 0
  if (row.snRequired) return row.pendingSerials.length
  return Math.min(Number(row.receiveQty || 0), Number(row.remainingQty || 0))
}

function toggleLine(id: number) {
  selectedLineIds.value = selectedLineIds.value.includes(id)
    ? selectedLineIds.value.filter((item) => item !== id)
    : [...selectedLineIds.value, id]
}

async function submit() {
  if (!props.orderId) return
  const lines = receiveRows.value
    .filter((line: Row) => selectedLineIds.value.includes(Number(line.id)))
    .filter((line: Row) => selectedReceiveQty(line) > 0)
    .map((line: Row) => ({
      lineId: Number(line.id),
      productId: Number(line.product_id),
      receiveQty: line.snRequired ? undefined : selectedReceiveQty(line),
      receiveSnList: line.snRequired ? line.pendingSerials.map((sn: Row) => sn.sn_code) : []
    }))
  if (!lines.length) {
    ElMessage.warning('请至少选择一行可收货产品')
    return
  }
  if (!selectedLocationCode.value) {
    ElMessage.warning('请选择本次收货目标库位')
    return
  }
  submitting.value = true
  try {
    const result = await inboundService.receive(props.orderId, { lines, locationCode: selectedLocationCode.value, operator: 'wh_admin' })
    ElMessage.success(`收货成功，批次 ${result.receiptNo || ''}`)
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

function inboundTypeLabel(value: string) {
  const map: Row = {
    PRODUCTION: '生产入库',
    STOCKING: '备货入库',
    RMA: '售后 RMA 入库',
    TRANSFER: '调拨入库',
    SUPPLIER_VMI: '供应商 VMI 入库',
    OTHER: '其他入库'
  }
  return map[value] || value || '-'
}

function statusLabel(value: string) {
  const map: Row = {
    CREATED: '创建',
    PARTIAL_RECEIVED: '部分收货',
    RECEIVING: '部分收货',
    RECEIVED: '完全收货',
    ON_SHELF: '已上架',
    CLOSED: '已关闭',
    CANCELED: '已取消'
  }
  return map[value] || value || '-'
}

function statusType(value: string) {
  if (['RECEIVED', 'ON_SHELF', 'CLOSED'].includes(value)) return 'success'
  if (['CANCELED'].includes(value)) return 'danger'
  if (['PARTIAL_RECEIVED', 'RECEIVING'].includes(value)) return 'warning'
  return 'info'
}

function snStatusLabel(value: string) {
  const map: Row = {
    COLLECTED: '已采集/待收货',
    RECEIVED: '已收货',
    ON_SHELF: '已上架'
  }
  return map[value] || value || '-'
}
</script>

<style scoped>
.receive-tip {
  margin: 14px 0;
}

.receive-form {
  margin-bottom: 12px;
}
</style>
