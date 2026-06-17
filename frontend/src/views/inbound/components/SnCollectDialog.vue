<template>
  <el-dialog v-model="visible" title="SN 采集 / 托盘箱码绑定" width="1120px" class="sn-collect-dialog" destroy-on-close>
    <div v-loading="loading" class="sn-collect">
      <el-alert
        class="collect-tip"
        type="info"
        show-icon
        :closable="false"
        title="SN 采集必须归属到具体入库明细行；确认后只生成采集绑定关系，SN 状态为已采集/待收货，不增加已收货数量。"
      />

      <el-descriptions v-if="orderSummary" title="入库单主信息" :column="3" border>
        <el-descriptions-item label="入库单号">{{ orderSummary.inboundOrderNo || orderSummary.order_no }}</el-descriptions-item>
        <el-descriptions-item label="入库类型">{{ inboundTypeLabel(orderSummary.inboundType || orderSummary.inbound_type) }}</el-descriptions-item>
        <el-descriptions-item label="入库仓库">{{ warehouseText }}</el-descriptions-item>
        <el-descriptions-item label="来源系统">{{ orderSummary.sourceSystem || orderSummary.source_system || '-' }}</el-descriptions-item>
        <el-descriptions-item label="来源单号">{{ orderSummary.sourceDocNo || orderSummary.sourceOrderNo || orderSummary.source_order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单据状态">
          <el-tag :type="statusType(orderSummary.status || orderSummary.lineStatus)">
            {{ statusLabel(orderSummary.status || orderSummary.lineStatus) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <el-form :model="form" label-width="132px" class="collect-form">
        <el-form-item v-if="isOrderMode" label="行号 / 产品明细" required class="line-select-form-item">
          <el-select
            v-model="selectedLineId"
            :disabled="lineOptions.length === 1"
            filterable
            placeholder="请选择需要采集 SN 的产品明细行"
            style="width: 100%"
            @change="handleLineChange"
          >
            <el-option
              v-for="line in lineOptions"
              :key="line.lineId"
              :label="lineOptionLabel(line)"
              :value="line.lineId"
              :disabled="!isLineSnRequired(line) || Number(line.remainingQty || 0) <= 0"
            />
          </el-select>
        </el-form-item>

        <el-descriptions v-if="context" class="line-descriptions" title="当前产品明细" :column="4" border>
          <el-descriptions-item label="行号">{{ context.lineNo }}</el-descriptions-item>
          <el-descriptions-item label="产品 ID">{{ context.productId }}</el-descriptions-item>
          <el-descriptions-item label="产品编码">{{ context.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ context.productName }}</el-descriptions-item>
          <el-descriptions-item label="预期收货数量">{{ context.planQty }}</el-descriptions-item>
          <el-descriptions-item label="已收货数量">{{ context.receivedQty }}</el-descriptions-item>
          <el-descriptions-item label="已采集待收货">{{ context.pendingReceiveQty || 0 }}</el-descriptions-item>
          <el-descriptions-item label="本次已采集数量">{{ parsedSerials.length }}</el-descriptions-item>
          <el-descriptions-item label="剩余可采集数量">
            <el-tag :type="remainingAfterInput < 0 ? 'danger' : 'success'">
              {{ Math.max(remainingAfterInput, 0) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="重复数量">
            <el-tag :type="duplicateQty ? 'danger' : 'success'">{{ duplicateQty }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="行状态">
            <el-tag :type="statusType(context.lineStatus)">{{ statusLabel(context.lineStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="批次号">{{ context.batchNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="箱码要求">{{ context.boxRequired ? '必填' : '非必填' }}</el-descriptions-item>
        </el-descriptions>

        <el-empty
          v-else-if="isOrderMode"
          class="line-empty"
          description="请先选择需要采集 SN 的产品明细行"
        />

        <el-row :gutter="12" class="package-row">
          <el-col :span="12">
            <el-form-item label="托盘码" required>
              <el-input v-model.trim="form.palletCode" placeholder="请扫描或录入托盘码，如 PLT202606150001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="箱码">
              <el-input v-model.trim="form.boxCode" placeholder="非必填；按产品档案需要时录入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="扫描 SN" required>
          <el-input
            ref="snInputRef"
            v-model="form.serialText"
            type="textarea"
            :rows="7"
            class="scan-input"
            :disabled="!context"
            placeholder="逐个扫描或粘贴 SN，支持换行、英文逗号、中文逗号、空格分隔"
            @keydown.ctrl.enter.prevent="submit"
          />
        </el-form-item>
      </el-form>

      <div class="collect-toolbar">
        <div class="muted">
          切换产品明细行会清空当前 SN 输入和校验结果，防止不同产品 SN 混在同一次提交中。
        </div>
        <div>
          <el-button @click="clearInput">清空</el-button>
          <el-button type="primary" plain :disabled="!canValidate" @click="validateRemote">校验</el-button>
        </div>
      </div>

      <el-table :data="validationRows" border height="260" empty-text="录入 SN 后显示校验结果">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="snCode" label="SN" min-width="190" show-overflow-tooltip />
        <el-table-column prop="productCode" label="产品编码" width="170" show-overflow-tooltip />
        <el-table-column prop="existingStatus" label="原 SN 状态" width="120">
          <template #default="{ row }">{{ row.existingStatus || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="校验状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PASS' ? 'success' : 'danger'">
              {{ row.status === 'PASS' ? '通过' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="校验说明" min-width="280" show-overflow-tooltip />
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeSn(row.snCode)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">历史已采集 SN 记录</el-divider>
      <el-table
        v-loading="historySnLoading"
        :data="historySnList"
        border
        max-height="260"
        empty-text="当前产品明细暂无历史已采集 SN"
      >
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="snCode" label="SN" min-width="190" show-overflow-tooltip />
        <el-table-column prop="productCode" label="产品编码" width="160" show-overflow-tooltip />
        <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="lineNo" label="行号" width="80" />
        <el-table-column prop="palletCode" label="托盘码" width="160" show-overflow-tooltip />
        <el-table-column prop="boxCode" label="箱码" width="150" show-overflow-tooltip />
        <el-table-column prop="snStatus" label="SN 状态" width="120">
          <template #default="{ row }">
            <el-tag :type="snStatusType(row.snStatus)">{{ snStatusLabel(row.snStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="receiveStatus" label="收货状态" width="120">
          <template #default="{ row }">{{ receiveStatusLabel(row.receiveStatus || row.snStatus) }}</template>
        </el-table-column>
        <el-table-column prop="collectedAt" label="采集时间" width="170" show-overflow-tooltip />
        <el-table-column prop="receivedAt" label="收货时间" width="170" show-overflow-tooltip>
          <template #default="{ row }">{{ row.receivedAt || '-' }}</template>
        </el-table-column>
        <el-table-column prop="locationCode" label="当前库位" width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.locationCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="110">
          <template #default="{ row }">
            <el-button
              v-if="row.snStatus === 'COLLECTED'"
              link
              type="danger"
              @click="cancelHistorySn(row)"
            >
              取消采集
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="submit">
        确认采集
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { inboundService } from '../../../api/services'

type Row = Record<string, any>
type Mode = 'line' | 'order'

const props = withDefaults(defineProps<{
  modelValue: boolean
  mode?: Mode
  orderId: number | null
  lineId?: number | null
}>(), {
  mode: 'line',
  lineId: null
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'success'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const orderContext = ref<Row | null>(null)
const context = ref<Row | null>(null)
const selectedLineId = ref<number | null>(null)
const validationRows = ref<Row[]>([])
const historySnList = ref<Row[]>([])
const historySnLoading = ref(false)
const snInputRef = ref()
const form = reactive({
  palletCode: '',
  boxCode: '',
  serialText: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const isOrderMode = computed(() => props.mode === 'order')
const orderSummary = computed(() => orderContext.value || context.value)
const lineOptions = computed<Row[]>(() => (orderContext.value?.lines || []).filter((line: Row) => isLineSnRequired(line)))
const parsedSerials = computed(() => parseSerials(form.serialText))
const uniqueSerials = computed(() => Array.from(new Set(parsedSerials.value)))
const duplicateQty = computed(() => parsedSerials.value.length - uniqueSerials.value.length)
const historySnCodes = computed(() => new Set(historySnList.value
  .map((row) => String(row.snCode || row.sn_code || '').trim())
  .filter(Boolean)))
const remainingAfterInput = computed(() => Number(context.value?.remainingCollectQty ?? context.value?.remainingQty ?? 0) - uniqueSerials.value.length)
const canValidate = computed(() => Boolean(props.orderId && selectedLineId.value && context.value && context.value.snRequired !== false && form.palletCode && parsedSerials.value.length))
const canSubmit = computed(() => canValidate.value && validationRows.value.length > 0 && validationRows.value.every((row) => row.status === 'PASS'))
const warehouseText = computed(() => {
  const row = orderSummary.value || {}
  const code = row.warehouseCode || row.warehouse_code || ''
  const name = row.warehouseName || row.warehouse_name || ''
  return [code, name].filter(Boolean).join(' / ') || '-'
})

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await openDialog()
    }
  }
)

watch(
  () => [form.serialText, form.palletCode, context.value?.remainingQty],
  () => {
    validationRows.value = buildLocalRows()
  }
)

async function openDialog() {
  if (!props.orderId) return
  loading.value = true
  try {
    resetState()
    form.palletCode = nextPalletCode()
    if (isOrderMode.value) {
      orderContext.value = await inboundService.snCollectOrderContext(props.orderId)
      const defaultLine = lineOptions.value.find((line) => isLineSnRequired(line) && Number(line.remainingQty || 0) > 0)
      if (defaultLine) {
        selectedLineId.value = Number(defaultLine.lineId)
        await loadLineContext(selectedLineId.value, false)
      }
    } else if (props.lineId) {
      selectedLineId.value = Number(props.lineId)
      await loadLineContext(selectedLineId.value, false)
    }
    await nextTick()
    snInputRef.value?.focus?.()
  } finally {
    loading.value = false
  }
}

function resetState() {
  orderContext.value = null
  context.value = null
  selectedLineId.value = null
  form.boxCode = ''
  form.serialText = ''
  validationRows.value = []
  historySnList.value = []
}

async function handleLineChange(value: number) {
  if (!value) return
  clearInput()
  await loadLineContext(Number(value), false)
  await nextTick()
  snInputRef.value?.focus?.()
}

async function loadLineContext(lineId: number, regeneratePallet: boolean) {
  if (!props.orderId) return
  context.value = await inboundService.snCollectContext(props.orderId, lineId)
  selectedLineId.value = Number(lineId)
  form.boxCode = ''
  form.serialText = ''
  validationRows.value = []
  if (regeneratePallet || !form.palletCode) {
    form.palletCode = nextPalletCode()
  }
  await loadHistorySns(lineId)
}

async function loadHistorySns(lineId = selectedLineId.value) {
  if (!props.orderId || !lineId) {
    historySnList.value = []
    return
  }
  historySnLoading.value = true
  try {
    historySnList.value = await inboundService.collectedSns(props.orderId, Number(lineId)) || []
    if (form.serialText) {
      validationRows.value = buildLocalRows()
    }
  } finally {
    historySnLoading.value = false
  }
}

function buildLocalRows() {
  const seen = new Set<string>()
  let accepted = 0
  const remaining = Number(context.value?.remainingCollectQty ?? context.value?.remainingQty ?? 0)
  return parsedSerials.value.map((sn) => {
    const row: Row = {
      snCode: sn,
      productCode: context.value?.productCode || '-',
      status: 'PASS',
      message: '待后端校验'
    }
    if (!context.value) {
      row.status = 'FAILED'
      row.message = '请先选择需要采集 SN 的产品明细行'
    } else if (!form.palletCode) {
      row.status = 'FAILED'
      row.message = '托盘码必填'
    } else if (seen.has(sn)) {
      row.status = 'FAILED'
      row.message = '本次录入中存在重复 SN'
    } else if (historySnCodes.value.has(sn)) {
      row.status = 'FAILED'
      row.message = '该 SN 已在当前产品明细中采集过，请勿重复采集'
    } else if (accepted >= remaining) {
      row.status = 'FAILED'
      row.message = `当前产品最多还可采集 ${remaining} 个 SN，当前录入数量已超过允许数量`
    } else {
      seen.add(sn)
      accepted += 1
    }
    return row
  })
}

async function validateRemote() {
  if (!props.orderId || !selectedLineId.value || !context.value) {
    ElMessage.warning('请先选择需要采集 SN 的产品明细行')
    return false
  }
  if (!form.palletCode) {
    ElMessage.warning('请先录入托盘码')
    return false
  }
  if (!parsedSerials.value.length) {
    ElMessage.warning('请至少录入一个 SN')
    return false
  }
  const localRows = buildLocalRows()
  validationRows.value = localRows
  const localFailed = localRows.find((row) => row.status !== 'PASS')
  if (localFailed) {
    ElMessage.error(localFailed.message || '本地校验未通过')
    return false
  }
  const result = await inboundService.validateSnCollection(props.orderId, selectedLineId.value, payload())
  validationRows.value = result.items || []
  if (!result.valid) {
    ElMessage.error(result.message || 'SN 校验未通过')
    return false
  }
  ElMessage.success(result.message || 'SN 校验通过')
  return true
}

async function submit() {
  if (!props.orderId || !selectedLineId.value) {
    ElMessage.warning('请先选择需要采集 SN 的产品明细行')
    return
  }
  submitting.value = true
  try {
    const ok = await validateRemote()
    if (!ok) return
    await inboundService.confirmSnCollection(props.orderId, selectedLineId.value, payload())
    ElMessage.success(isOrderMode.value ? 'SN 采集成功，已进入待收货。' : 'SN 采集成功，当前产品明细已进入待收货。')
    clearInput()
    await refreshCurrentLine()
    emit('success')
    await nextTick()
    snInputRef.value?.focus?.()
  } finally {
    submitting.value = false
  }
}

async function refreshCurrentLine() {
  if (!props.orderId || !selectedLineId.value) return
  const currentLineId = Number(selectedLineId.value)
  if (isOrderMode.value) {
    orderContext.value = await inboundService.snCollectOrderContext(props.orderId)
  }
  await loadLineContext(currentLineId, false)
}

function payload() {
  return {
    orderId: props.orderId,
    lineId: selectedLineId.value,
    productId: context.value?.productId,
    palletCode: form.palletCode,
    boxCode: form.boxCode,
    serialNumbers: parsedSerials.value,
    operator: 'wh_admin'
  }
}

function clearInput() {
  form.serialText = ''
  validationRows.value = []
}

function removeSn(sn: string) {
  const next = parsedSerials.value.filter((item) => item !== sn)
  form.serialText = next.join('\n')
}

async function cancelHistorySn(row: Row) {
  if (!props.orderId || !selectedLineId.value || !row?.snCode) return
  try {
    await ElMessageBox.confirm(`确认取消 SN ${row.snCode} 的采集绑定关系吗？`, '取消采集', {
      type: 'warning',
      confirmButtonText: '确认取消',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }
  await inboundService.cancelSnCollection(props.orderId, selectedLineId.value, {
    serialNumbers: [row.snCode],
    operator: 'wh_admin'
  })
  ElMessage.success('已取消该 SN 采集绑定关系')
  await refreshCurrentLine()
  emit('success')
}

function parseSerials(value = '') {
  return String(value)
    .split(/\r?\n|,|，|;|；|\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function lineOptionLabel(line: Row) {
  return `行号 ${line.lineNo} | ${line.productCode} | ${line.productName} | SN管理 ${isLineSnRequired(line) ? '是' : '否'} | 预期 ${line.planQty} | 已收 ${line.receivedQty} | 待收 ${line.pendingReceiveQty || 0} | 可采 ${line.remainingQty}`
}

function isLineSnRequired(line: Row) {
  return line.snRequired !== false && Number(line.snRequired ?? 1) === 1
}

function nextPalletCode() {
  return `PLT${Date.now()}`
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
    CLOSED: '订单关闭',
    CANCELED: '已取消',
    SAP_FAILED: 'SAP 回传失败'
  }
  return map[value] || value || '-'
}

function statusType(value: string) {
  if (['RECEIVED', 'CLOSED', 'ON_SHELF'].includes(value)) return 'success'
  if (['SAP_FAILED', 'CANCELED'].includes(value)) return 'danger'
  if (['RECEIVING', 'PARTIAL_RECEIVED'].includes(value)) return 'warning'
  return 'info'
}

function snStatusLabel(value: string) {
  const map: Row = {
    COLLECTED: '已采集',
    RECEIVED: '已收货',
    INBOUND: '已入库',
    ON_SHELF: '已上架',
    CANCELED_COLLECT: '已取消'
  }
  return map[value] || value || '-'
}

function snStatusType(value: string) {
  if (['RECEIVED', 'INBOUND', 'ON_SHELF'].includes(value)) return 'success'
  if (value === 'COLLECTED') return 'warning'
  if (value === 'CANCELED_COLLECT') return 'danger'
  return 'info'
}

function receiveStatusLabel(value: string) {
  const map: Row = {
    PENDING_RECEIVE: '待收货',
    RECEIVED: '已收货',
    INBOUND: '已入库',
    ON_SHELF: '已上架',
    CANCELED: '已取消',
    CANCELED_COLLECT: '已取消',
    COLLECTED: '待收货'
  }
  return map[value] || value || '-'
}
</script>

<style scoped>
.sn-collect {
  max-height: 68vh;
  overflow-y: auto;
  padding-right: 4px;
}

.collect-tip {
  margin-bottom: 12px;
}

.collect-form {
  margin-top: 14px;
}

.sn-collect-dialog :deep(.el-form-item__label) {
  white-space: nowrap;
}

.line-select-form-item {
  width: 100%;
}

.line-select-form-item :deep(.el-select) {
  width: 100%;
}

.line-descriptions,
.line-empty,
.package-row {
  margin-top: 12px;
}

.scan-input :deep(.el-textarea__inner) {
  min-height: 160px;
  border-width: 2px;
  font-family: Consolas, Monaco, monospace;
  font-size: 15px;
  line-height: 1.6;
}

.collect-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 12px;
}
</style>
