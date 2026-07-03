<template>
  <AlphaListPage
    :title="t('inventory.title')"
    :subtitle="t('inventory.subtitle')"
    :columns="columns"
    :search-fields="searchFields"
    :fetcher="inventoryService.list"
    :show-create="false"
    highlight-inventory
    scan-enabled
  >
    <template #toolbar="{ selectedRows, reload }">
      <el-button type="primary" @click="openQuickMove(selectedRows, reload)">{{ t('inventory.move') }}</el-button>
      <el-button @click="mockToolbarAction(t('common.export'))">{{ t('common.export') }}</el-button>
      <el-button @click="reload()">{{ t('common.refresh') }}</el-button>
    </template>
  </AlphaListPage>

  <el-dialog v-model="quickMoveVisible" title="库存移动" width="1180px" destroy-on-close>
    <el-alert
      class="quick-move-alert"
      type="info"
      show-icon
      :closable="false"
      title="快捷移动将创建库存移动单并立即确认，后端仍会校验库存状态、SN 状态、货主、仓库和目标库位。"
    />

    <el-form :model="quickMoveForm" label-width="110px" class="quick-move-form">
      <el-row :gutter="14">
        <el-col :span="6">
          <el-form-item :label="t('inventory.move')">
            <el-select v-model="quickMoveForm.moveType" style="width: 100%">
              <el-option v-for="item in moveTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('inventory.owner')">
            <el-input :model-value="`${quickMoveForm.ownerCode} ${quickMoveForm.ownerName}`" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('inventory.warehouseCode')">
            <el-input :model-value="`${quickMoveForm.warehouseCode} ${quickMoveForm.warehouseName}`" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('inventory.locationCode')">
            <el-input v-model="quickMoveForm.toLocationCode" clearable placeholder="不填则默认原库位" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('inventory.palletCode')">
            <el-input v-model="quickMoveForm.toPalletCode" clearable placeholder="可选" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item :label="t('inventory.boxCode')">
            <el-input v-model="quickMoveForm.toBoxCode" clearable placeholder="可选" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注">
            <el-input v-model="quickMoveForm.remark" clearable placeholder="库存查询页面快捷移动" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="quick-move-title">
      <span>已选库存明细</span>
      <span class="quick-move-summary">共 {{ quickMoveLines.length }} 行，{{ quickMoveForm.snMode ? 'SN 管理按 SN 移动' : '非 SN 产品按数量移动' }}</span>
    </div>
    <el-table v-loading="quickMoveLoading" :data="quickMoveLines" border stripe max-height="420">
      <el-table-column prop="lineNo" label="行号" width="70" />
        <el-table-column prop="productCode" :label="t('inventory.productCode')" width="160" show-overflow-tooltip />
        <el-table-column prop="productName" :label="t('inventory.productName')" min-width="180" show-overflow-tooltip />
        <el-table-column prop="snRequired" :label="t('inventory.snManaged')" width="95">
        <template #default="{ row }">
          <el-tag :type="row.snRequired ? 'success' : 'info'" effect="light">{{ row.snRequired ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="snCode" label="SN" width="170" show-overflow-tooltip />
      <el-table-column prop="batchNo" :label="t('inventory.batch')" width="150" show-overflow-tooltip />
      <el-table-column prop="fromLocationCode" label="来源库位" width="125" />
      <el-table-column prop="fromPalletCode" label="来源托盘码" width="145" show-overflow-tooltip />
      <el-table-column prop="fromBoxCode" label="来源箱码" width="145" show-overflow-tooltip />
      <el-table-column prop="availableQty" :label="t('inventory.availableQty')" width="95" />
      <el-table-column label="本次移动数量" width="150">
        <template #default="{ row }">
          <span v-if="row.snRequired">1</span>
          <el-input-number
            v-else
            v-model="row.moveQty"
            :min="1"
            :max="row.availableQty"
            size="small"
            controls-position="right"
            style="width: 118px"
          />
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="70" />
    </el-table>

    <template #footer>
      <el-button @click="quickMoveVisible = false">取消</el-button>
      <el-button type="primary" :loading="quickMoveSaving" @click="submitQuickMove">确认移动</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AlphaListPage from '../../components/AlphaListPage.vue'
import { inventoryMoveService, inventoryService } from '../../api/services'
import { inventoryStatusLabel, useI18n } from '../../i18n'

type InventoryRow = Record<string, any>
type ReloadFn = () => Promise<void> | void
const { t } = useI18n()

const moveTypeOptions = [
  { label: '库位移动', value: 'LOCATION_MOVE' },
  { label: '托盘变更', value: 'PALLET_CHANGE' },
  { label: '箱码变更', value: 'BOX_CHANGE' },
  { label: '包装重绑', value: 'PACKAGE_REBIND' },
  { label: '库区移动', value: 'AREA_MOVE' },
  { label: '综合移动', value: 'MIXED_MOVE' }
]

const inventoryStatusOptions = computed(() => ['QUALIFIED', 'PENDING', 'FROZEN', 'UNQUALIFIED'].map((item) => ({ label: inventoryStatusLabel(item), value: item })))

const columns = computed(() => [
  { prop: 'warehouse_code', label: t('inventory.warehouseCode'), width: 160 },
  { prop: 'warehouse_name', label: t('inventory.warehouseName'), width: 170 },
  { prop: 'owner_code', label: t('inventory.owner'), width: 120 },
  { prop: 'owner_name', label: t('inventory.ownerName'), width: 160 },
  { prop: 'area_code', label: t('inventory.area'), width: 120 },
  { prop: 'location_code', label: t('inventory.location'), width: 130 },
  { prop: 'product_code', label: t('inventory.productCode'), width: 170 },
  { prop: 'product_name', label: t('inventory.productName'), width: 170 },
  { prop: 'sn_managed', label: t('inventory.snManaged'), type: 'boolean', width: 95 },
  { prop: 'batch_no', label: t('inventory.batch'), width: 170 },
  { prop: 'pallet_code', label: t('inventory.palletCode'), width: 150 },
  { prop: 'box_code', label: t('inventory.boxCode'), width: 150 },
  { prop: 'inventory_status', label: t('inventory.inventoryStatus'), type: 'status', width: 110 },
  { prop: 'total_qty', label: t('inventory.totalQty'), width: 90 },
  { prop: 'available_qty', label: t('inventory.availableQty'), width: 100 },
  { prop: 'allocated_qty', label: t('inventory.allocatedQty'), width: 90 },
  { prop: 'frozen_qty', label: t('inventory.frozenQty'), width: 80 },
  { prop: 'safety_stock', label: t('inventory.safetyStock'), width: 100 },
  { prop: 'inbound_date', label: t('inventory.inboundDate'), width: 120 },
  { prop: 'vmi_flag', label: 'VMI', type: 'boolean', width: 80 }
])

const searchFields = computed(() => [
  { prop: 'warehouseCode', label: t('inventory.warehouseCode') },
  { prop: 'ownerCode', label: t('inventory.owner') },
  { prop: 'locationCode', label: t('inventory.locationCode') },
  { prop: 'productCode', label: t('inventory.productCode') },
  { prop: 'batchNo', label: t('inventory.batch') },
  { prop: 'palletCode', label: t('inventory.palletCode') },
  { prop: 'boxCode', label: t('inventory.boxCode') },
  { prop: 'inventoryStatus', label: t('inventory.inventoryStatus'), type: 'select', options: inventoryStatusOptions.value }
])

const quickMoveVisible = ref(false)
const quickMoveLoading = ref(false)
const quickMoveSaving = ref(false)
const quickMoveReload = ref<ReloadFn | null>(null)
const quickMoveLines = ref<InventoryRow[]>([])
const quickMoveForm = reactive({
  moveType: 'MIXED_MOVE',
  ownerCode: '',
  ownerName: '',
  warehouseCode: '',
  warehouseName: '',
  toLocationCode: '',
  toPalletCode: '',
  toBoxCode: '',
  remark: '库存查询页面快捷移动',
  snMode: false
})

async function openQuickMove(selectedRows: InventoryRow[], reload: ReloadFn) {
  if (!selectedRows?.length) {
    ElMessage.warning('请先选择需要移动的库存。')
    return
  }
  if (!validateSelection(selectedRows)) return

  const first = selectedRows[0]
  resetQuickMoveForm()
  quickMoveReload.value = reload
  quickMoveForm.ownerCode = text(first, 'owner_code', 'ownerCode')
  quickMoveForm.ownerName = text(first, 'owner_name', 'ownerName')
  quickMoveForm.warehouseCode = text(first, 'warehouse_code', 'warehouseCode')
  quickMoveForm.warehouseName = text(first, 'warehouse_name', 'warehouseName')
  quickMoveForm.snMode = isSnManaged(first)
  quickMoveVisible.value = true
  quickMoveLoading.value = true

  try {
    quickMoveLines.value = quickMoveForm.snMode
      ? await buildSnMoveLines(selectedRows)
      : buildQtyMoveLines(selectedRows)
    if (!quickMoveLines.value.length) {
      ElMessage.warning('未找到可移动库存，请重新选择。')
      quickMoveVisible.value = false
    }
  } catch (error) {
    quickMoveVisible.value = false
    ElMessage.error(error instanceof Error ? error.message : '库存移动明细生成失败')
  } finally {
    quickMoveLoading.value = false
  }
}

function validateSelection(rows: InventoryRow[]) {
  const ownerCodes = unique(rows.map((row) => text(row, 'owner_code', 'ownerCode')))
  if (ownerCodes.length > 1) {
    ElMessage.warning('一次库存移动只能选择同一货主的库存，请重新选择。')
    return false
  }
  const warehouseCodes = unique(rows.map((row) => text(row, 'warehouse_code', 'warehouseCode')))
  if (warehouseCodes.length > 1) {
    ElMessage.warning('一次库存移动只能选择同一仓库的库存，请重新选择。')
    return false
  }
  const snFlags = unique(rows.map((row) => (isSnManaged(row) ? 'SN' : 'QTY')))
  if (snFlags.length > 1) {
    ElMessage.warning('SN 管理产品和非 SN 管理产品请分开执行库存移动。')
    return false
  }
  const invalidStatus = rows.find((row) => text(row, 'inventory_status', 'inventoryStatus') !== 'QUALIFIED')
  if (invalidStatus) {
    ElMessage.warning('当前库存不是合格可用状态，不允许移动。')
    return false
  }
  if (!isSnManaged(rows[0])) {
    const frozen = rows.find((row) => numberValue(row.frozen_qty ?? row.frozenQty) > 0)
    if (frozen) {
      ElMessage.warning('当前库存已冻结，不允许移动。')
      return false
    }
    const allocated = rows.find((row) => numberValue(row.allocated_qty ?? row.allocatedQty) > 0)
    if (allocated) {
      ElMessage.warning('当前库存已分配出库，不允许移动。')
      return false
    }
    const insufficient = rows.find((row) => numberValue(row.available_qty ?? row.availableQty) <= 0)
    if (insufficient) {
      ElMessage.warning('当前库存可用数量不足，不允许移动。')
      return false
    }
  }
  return true
}

async function buildSnMoveLines(rows: InventoryRow[]) {
  const lines: InventoryRow[] = []
  for (const row of rows) {
    const baseQuery = {
      warehouseCode: text(row, 'warehouse_code', 'warehouseCode'),
      ownerCode: text(row, 'owner_code', 'ownerCode'),
      locationCode: text(row, 'location_code', 'locationCode'),
      productCode: text(row, 'product_code', 'productCode')
    }
    const exactData = await inventoryMoveService.stockCandidates({
      ...baseQuery,
      palletCode: text(row, 'pallet_code', 'palletCode'),
      boxCode: text(row, 'box_code', 'boxCode')
    })
    let sns = filterMovableSns(exactData.sns || [], row, true)
    if (!sns.length && (text(row, 'pallet_code', 'palletCode') || text(row, 'box_code', 'boxCode'))) {
      const looseData = await inventoryMoveService.stockCandidates(baseQuery)
      sns = filterMovableSns(looseData.sns || [], row, false)
    }
    if (!sns.length) {
      throw new Error(`产品 ${text(row, 'product_code', 'productCode')} 在库位 ${text(row, 'location_code', 'locationCode')} 未找到可移动 SN。`)
    }
    sns.forEach((sn: InventoryRow) => {
      lines.push({
        lineNo: (lines.length + 1) * 10,
        stockId: row.id,
        productCode: text(row, 'product_code', 'productCode'),
        productName: text(row, 'product_name', 'productName'),
        snRequired: true,
        snCode: text(sn, 'sn_code', 'snCode'),
        batchNo: text(row, 'batch_no', 'batchNo'),
        fromLocationCode: text(sn, 'location_code', 'locationCode') || text(row, 'location_code', 'locationCode'),
        fromPalletCode: text(sn, 'pallet_code', 'palletCode') || text(row, 'pallet_code', 'palletCode'),
        fromBoxCode: text(sn, 'box_code', 'boxCode') || text(row, 'box_code', 'boxCode'),
        availableQty: 1,
        moveQty: 1,
        unit: text(row, 'unit') || 'PCS'
      })
    })
  }
  return lines
}

function buildQtyMoveLines(rows: InventoryRow[]) {
  return rows.map((row, index) => {
    const availableQty = numberValue(row.available_qty ?? row.availableQty)
    return {
      lineNo: (index + 1) * 10,
      stockId: row.id,
      productCode: text(row, 'product_code', 'productCode'),
      productName: text(row, 'product_name', 'productName'),
      snRequired: false,
      snCode: '',
      batchNo: text(row, 'batch_no', 'batchNo'),
      fromLocationCode: text(row, 'location_code', 'locationCode'),
      fromPalletCode: text(row, 'pallet_code', 'palletCode'),
      fromBoxCode: text(row, 'box_code', 'boxCode'),
      availableQty,
      moveQty: availableQty,
      unit: text(row, 'unit') || 'PCS'
    }
  })
}

async function submitQuickMove() {
  if (!validateQuickMoveForm()) return
  await ElMessageBox.confirm('确认移动后将创建库存移动单并立即扣减/增加库存，是否继续？', '确认库存移动', { type: 'warning' })
  quickMoveSaving.value = true
  try {
    const payload = buildQuickMovePayload()
    const created = await inventoryMoveService.create(payload)
    const orderId = Number(created?.order?.id || created?.id)
    if (!orderId) throw new Error('库存移动单创建成功但未返回单据 ID，无法确认移动。')
    await inventoryMoveService.confirm(orderId, { operator: 'wh_admin' })
    ElMessage.success('库存移动成功。')
    quickMoveVisible.value = false
    await quickMoveReload.value?.()
  } finally {
    quickMoveSaving.value = false
  }
}

function validateQuickMoveForm() {
  if (!quickMoveForm.toLocationCode && !quickMoveForm.toPalletCode && !quickMoveForm.toBoxCode) {
    ElMessage.warning('请至少填写一个目标库位、目标托盘码或目标箱码。')
    return false
  }
  for (const line of quickMoveLines.value) {
    if (line.snRequired && !line.snCode) {
      ElMessage.warning('SN 管理产品必须按 SN 移动，请补充 SN。')
      return false
    }
    if (!line.snRequired) {
      const qty = numberValue(line.moveQty)
      if (qty <= 0) {
        ElMessage.warning('本次移动数量必须大于 0。')
        return false
      }
      if (qty > numberValue(line.availableQty)) {
        ElMessage.warning('移动数量不能大于可用库存数量。')
        return false
      }
    }
  }
  return true
}

function buildQuickMovePayload() {
  const first = quickMoveLines.value[0]
  return {
    moveType: quickMoveForm.moveType,
    ownerCode: quickMoveForm.ownerCode,
    ownerName: quickMoveForm.ownerName,
    warehouseCode: quickMoveForm.warehouseCode,
    fromLocationCode: first.fromLocationCode,
    toLocationCode: quickMoveForm.toLocationCode || first.fromLocationCode,
    fromPalletCode: first.fromPalletCode,
    toPalletCode: quickMoveForm.toPalletCode || first.fromPalletCode,
    fromBoxCode: first.fromBoxCode,
    toBoxCode: quickMoveForm.toBoxCode || first.fromBoxCode,
    operator: 'wh_admin',
    remark: quickMoveForm.remark || '库存查询页面快捷移动',
    lines: quickMoveLines.value.map((line) => ({
      lineNo: line.lineNo,
      productCode: line.productCode,
      snCode: line.snCode,
      batchNo: line.batchNo,
      fromLocationCode: line.fromLocationCode,
      toLocationCode: quickMoveForm.toLocationCode || line.fromLocationCode,
      fromPalletCode: line.fromPalletCode,
      toPalletCode: quickMoveForm.toPalletCode || line.fromPalletCode,
      fromBoxCode: line.fromBoxCode,
      toBoxCode: quickMoveForm.toBoxCode || line.fromBoxCode,
      moveQty: line.snRequired ? 1 : numberValue(line.moveQty),
      unit: line.unit
    }))
  }
}

function resetQuickMoveForm() {
  quickMoveForm.moveType = 'MIXED_MOVE'
  quickMoveForm.ownerCode = ''
  quickMoveForm.ownerName = ''
  quickMoveForm.warehouseCode = ''
  quickMoveForm.warehouseName = ''
  quickMoveForm.toLocationCode = ''
  quickMoveForm.toPalletCode = ''
  quickMoveForm.toBoxCode = ''
  quickMoveForm.remark = '库存查询页面快捷移动'
  quickMoveForm.snMode = false
  quickMoveLines.value = []
}

function matchSource(sn: InventoryRow, row: InventoryRow) {
  return text(sn, 'product_code', 'productCode') === text(row, 'product_code', 'productCode')
    && text(sn, 'warehouse_code', 'warehouseCode') === text(row, 'warehouse_code', 'warehouseCode')
    && text(sn, 'location_code', 'locationCode') === text(row, 'location_code', 'locationCode')
    && nullableMatch(text(sn, 'pallet_code', 'palletCode'), text(row, 'pallet_code', 'palletCode'))
    && nullableMatch(text(sn, 'box_code', 'boxCode'), text(row, 'box_code', 'boxCode'))
}

function filterMovableSns(sns: InventoryRow[], row: InventoryRow, strictPackaging: boolean) {
  return sns
    .filter((sn) => strictPackaging ? matchSource(sn, row) : matchSourceWithoutPackaging(sn, row))
    .filter((sn) => text(sn, 'status') === 'ON_SHELF')
    .filter((sn) => text(sn, 'quality_status', 'qualityStatus') === 'QUALIFIED')
    .filter((sn) => !boolValue(sn.locked_flag ?? sn.lockedFlag))
}

function matchSourceWithoutPackaging(sn: InventoryRow, row: InventoryRow) {
  return text(sn, 'product_code', 'productCode') === text(row, 'product_code', 'productCode')
    && text(sn, 'warehouse_code', 'warehouseCode') === text(row, 'warehouse_code', 'warehouseCode')
    && text(sn, 'location_code', 'locationCode') === text(row, 'location_code', 'locationCode')
}

function nullableMatch(left: string, right: string) {
  return !right || left === right
}

function isSnManaged(row: InventoryRow) {
  return boolValue(row.sn_managed ?? row.snManaged ?? row.sn_required ?? row.snRequired)
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function boolValue(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const normalized = String(value ?? '').toLowerCase()
  return ['1', 'true', 'y', 'yes', '是'].includes(normalized)
}

function text(row: InventoryRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row?.[key] ?? row?.[toSnake(key)]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return ''
}

function toSnake(key: string) {
  return key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
}

function mockToolbarAction(name: string) {
  ElMessage.success(`${name}功能已在 Alpha 页面模拟完成`)
}
</script>

<style scoped>
.quick-move-alert {
  margin-bottom: 14px;
}

.quick-move-form {
  margin-bottom: 8px;
}

.quick-move-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0 10px;
  font-weight: 700;
}

.quick-move-summary {
  color: var(--wms-text-secondary);
  font-size: 13px;
  font-weight: 400;
}
</style>
