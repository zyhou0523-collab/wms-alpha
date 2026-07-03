<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="1280px" destroy-on-close>
    <div v-loading="loading">
      <el-form :model="form" label-width="112px" class="create-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="订单类型" required>
              <el-select v-model="form.inboundType" style="width: 100%">
                <el-option v-for="item in inboundTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源系统" required>
              <el-input v-model.trim="form.sourceSystem" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="来源单号">
              <el-input v-model.trim="form.sourceOrderNo" placeholder="手工单可为空" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货主" required>
              <el-select v-model="form.ownerCode" filterable style="width: 100%" @change="handleOwnerChange">
                <el-option
                  v-for="owner in ownerOptions"
                  :key="owner.value"
                  :label="owner.label"
                  :value="owner.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货主名称">
              <el-input v-model.trim="form.ownerName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="SAP 工厂" required>
              <el-input v-model.trim="form.sapPlant" placeholder="默认按货主带出，如 3060" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出库国家">
              <el-input v-model.trim="form.shipFromCountry" placeholder="中国、美国、德国、越南、泰国" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="入库仓库" required>
              <el-select v-model="form.warehouseCode" filterable style="width: 100%">
                <el-option
                  v-for="warehouse in warehouses"
                  :key="warehouse.warehouse_code"
                  :label="`${warehouse.warehouse_code} / ${warehouse.warehouse_name}`"
                  :value="warehouse.warehouse_code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划到货日" required>
              <el-date-picker v-model="form.planArrivalDate" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注">
              <el-input v-model.trim="form.remark" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="line-toolbar">
        <strong>产品明细</strong>
        <el-button type="primary" plain @click="addLine">添加明细行</el-button>
      </div>
      <el-table :data="lines" border>
        <el-table-column prop="lineNo" label="行号" width="76" />
        <el-table-column label="产品编码" min-width="260">
          <template #default="{ row }">
            <el-select
              v-model="row.productId"
              filterable
              placeholder="按货主选择产品"
              style="width: 100%"
              @change="selectProduct(row)"
            >
              <el-option
                v-for="product in products"
                :key="product.productId || product.id"
                :label="`${product.productCode || product.product_code} / ${product.productName || product.product_name}`"
                :value="product.productId || product.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="76" />
        <el-table-column label="SN 管理" width="95">
          <template #default="{ row }">
            <el-tag :type="row.snRequired ? 'success' : 'info'">{{ row.snRequired ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" width="140">
          <template #default="{ row }">
            <el-input-number v-model="row.plannedQty" :min="1" style="width: 116px" />
          </template>
        </el-table-column>
        <el-table-column label="SAP 工厂" width="130">
          <template #default="{ row }">
            <el-input v-model.trim="row.sapPlant" />
          </template>
        </el-table-column>
        <el-table-column label="SAP 库存地点" width="150">
          <template #default="{ row }">
            <el-input v-model.trim="row.sapStorageLocation" placeholder="可为空" />
          </template>
        </el-table-column>
        <el-table-column label="批次号" width="160">
          <template #default="{ row }">
            <el-input v-model.trim="row.batchNo" />
          </template>
        </el-table-column>
        <el-table-column label="质量状态" width="120">
          <template #default="{ row }">
            <el-select v-model="row.qualityStatus">
              <el-option label="合格" value="QUALIFIED" />
              <el-option label="待检" value="PENDING" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="132">
          <template #default="{ row, $index }">
            <el-button link type="primary" @click="copyLine(row)">复制</el-button>
            <el-button link type="danger" :disabled="lines.length === 1" @click="removeLine($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { customerService, inboundService, productService, warehouseService } from '../../../api/services'

type Row = Record<string, any>

const props = defineProps<{
  modelValue: boolean
  mode?: 'create' | 'edit'
  orderId?: number | null
  initialData?: Row | null
}>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'success'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const products = ref<Row[]>([])
const warehouses = ref<Row[]>([])
const ownerOptions = ref([
  { label: '3060 / 杭州利沃得', value: '3060', name: '杭州利沃得' },
  { label: '1000 / 海兴电力', value: '1000', name: '海兴电力' }
])
const form = reactive<Row>({
  inboundType: 'PRODUCTION',
  sourceSystem: 'MANUAL',
  sourceOrderNo: '',
  ownerCode: '3060',
  ownerName: '杭州利沃得',
  shipFromCountry: '中国',
  sapPlant: '3060',
  warehouseCode: 'HZ',
  planArrivalDate: new Date().toISOString().slice(0, 10),
  remark: ''
})
const lines = ref<Row[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})
const dialogTitle = computed(() => props.mode === 'edit' ? '编辑预期到货通知单' : '新建预期到货通知单')

const inboundTypeOptions = [
  { value: 'PRODUCTION', label: '生产入库' },
  { value: 'STOCKING', label: '备货入库' },
  { value: 'RMA', label: '售后 RMA 入库' },
  { value: 'TRANSFER', label: '调拨入库' },
  { value: 'SUPPLIER_VMI', label: '供应商 VMI 入库' },
  { value: 'OTHER', label: '其他入库' }
]

watch(
  () => props.modelValue,
  async (open) => {
    if (open) await openDialog()
  }
)

async function openDialog() {
  loading.value = true
  try {
    const [ownerData, warehouseData] = await Promise.all([
      customerService.options({ type: 'OWNER' }),
      warehouseService.list({ pageNum: 1, pageSize: 200, status: 'ACTIVE' })
    ])
    if (ownerData?.length) {
      ownerOptions.value = ownerData.map((owner: Row) => ({
        label: `${owner.customerCode || owner.customer_code} / ${owner.customerName || owner.customer_name}`,
        value: owner.customerCode || owner.customer_code,
        name: owner.customerName || owner.customer_name
      }))
    }
    warehouses.value = warehouseData.items || []
    Object.assign(form, {
      inboundType: 'PRODUCTION',
      sourceSystem: 'MANUAL',
      sourceOrderNo: '',
      ownerCode: ownerOptions.value.find((item) => item.value === '3060') ? '3060' : ownerOptions.value[0]?.value,
      ownerName: '',
      shipFromCountry: '中国',
      sapPlant: '',
      warehouseCode: warehouses.value[0]?.warehouse_code || 'HZ',
      planArrivalDate: new Date().toISOString().slice(0, 10),
      remark: ''
    })
    setOwnerNameAndPlant()
    if (props.mode === 'edit' && props.initialData?.order) {
      const order = props.initialData.order
      form.ownerCode = order.owner_code || order.ownerCode || form.ownerCode
      form.ownerName = order.owner_name || order.ownerName || form.ownerName
      form.sapPlant = order.sap_plant || order.sapPlant || form.ownerCode || form.sapPlant
    }
    await loadProducts()
    if (props.mode === 'edit' && props.initialData?.order) {
      fillEditForm(props.initialData)
      return
    }
    lines.value = []
    addLine()
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  products.value = await productService.options({ ownerCode: form.ownerCode, status: 'ACTIVE' })
}

async function handleOwnerChange() {
  setOwnerNameAndPlant()
  await loadProducts()
  lines.value = []
  addLine()
}

function setOwnerNameAndPlant() {
  const owner = ownerOptions.value.find((item) => item.value === form.ownerCode)
  form.ownerName = owner?.name || ''
  form.sapPlant = form.ownerCode || form.sapPlant || '3060'
}

function addLine(source?: Row) {
  lines.value.push({
    uid: Date.now() + Math.random(),
    lineNo: (lines.value.length + 1) * 10,
    productId: source?.productId || null,
    productCode: source?.productCode || '',
    productName: source?.productName || '',
    unit: source?.unit || '',
    snRequired: Boolean(source?.snRequired),
    plannedQty: source?.plannedQty || 1,
    sapPlant: source?.sapPlant || form.sapPlant,
    sapStorageLocation: source?.sapStorageLocation || '',
    batchNo: source?.batchNo || '',
    qualityStatus: source?.qualityStatus || 'QUALIFIED'
  })
}

function copyLine(row: Row) {
  addLine({ ...row })
  renumberLines()
}

function removeLine(index: number) {
  lines.value.splice(index, 1)
  renumberLines()
}

function renumberLines() {
  lines.value.forEach((line, lineIndex) => {
    line.lineNo = (lineIndex + 1) * 10
  })
}

function selectProduct(row: Row) {
  const product = products.value.find((item) => Number(item.productId || item.id) === Number(row.productId))
  row.productCode = product?.productCode || product?.product_code || ''
  row.productName = product?.productName || product?.product_name || ''
  row.unit = product?.unit || ''
  row.snRequired = Boolean(product?.snRequired ?? product?.sn_managed)
  row.sapPlant = row.sapPlant || form.sapPlant
}

function fillEditForm(data: Row) {
  const order = data.order || {}
  Object.assign(form, {
    inboundType: order.inbound_type || order.inboundType || 'PRODUCTION',
    sourceSystem: order.source_system || order.sourceSystem || 'MANUAL',
    sourceOrderNo: order.source_order_no || order.sourceOrderNo || '',
    ownerCode: order.owner_code || order.ownerCode || form.ownerCode,
    ownerName: order.owner_name || order.ownerName || '',
    shipFromCountry: order.ship_from_country || order.shipFromCountry || '',
    sapPlant: order.sap_plant || order.sapPlant || order.owner_code || form.sapPlant,
    warehouseCode: order.warehouse_code || order.warehouseCode || form.warehouseCode,
    planArrivalDate: order.plan_arrival_date || order.planArrivalDate || form.planArrivalDate,
    remark: order.remark || ''
  })
  const details = data.details || data.lines || []
  lines.value = details.map((line: Row) => {
    const product = products.value.find((item) => Number(item.productId || item.id) === Number(line.product_id || line.productId)) ||
      products.value.find((item) => (item.productCode || item.product_code) === (line.product_code || line.productCode))
    return {
      uid: Date.now() + Math.random(),
      lineNo: Number(line.line_no || line.lineNo || 10),
      productId: line.product_id || line.productId || product?.productId || product?.id || null,
      productCode: line.product_code || line.productCode || product?.productCode || product?.product_code || '',
      productName: line.product_name || line.productName || product?.productName || product?.product_name || '',
      unit: line.unit || product?.unit || '',
      snRequired: Number(line.sn_required ?? line.snRequired ?? product?.sn_managed ?? 0) === 1 || line.snRequired === true,
      plannedQty: Number(line.planned_qty || line.plannedQty || 1),
      sapPlant: line.sap_plant || line.sapPlant || form.sapPlant,
      sapStorageLocation: line.sap_storage_location || line.sapStorageLocation || '',
      batchNo: line.batch_no || line.batchNo || '',
      qualityStatus: line.quality_status || line.qualityStatus || 'QUALIFIED'
    }
  })
  if (!lines.value.length) addLine()
}

async function submit() {
  if (!form.inboundType || !form.sourceSystem || !form.ownerCode || !form.sapPlant || !form.warehouseCode || !form.planArrivalDate) {
    ElMessage.warning('请补充订单类型、来源系统、货主、SAP 工厂、入库仓库和计划到货日')
    return
  }
  if (lines.value.some((line) => !line.productId || Number(line.plannedQty || 0) <= 0)) {
    ElMessage.warning('请补充产品明细和大于 0 的计划数量')
    return
  }
  submitting.value = true
  try {
    const payload = {
      inboundType: form.inboundType,
      sourceSystem: form.sourceSystem,
      sourceOrderNo: form.sourceOrderNo,
      ownerCode: form.ownerCode,
      ownerName: form.ownerName,
      shipFromCountry: form.shipFromCountry,
      sapPlant: form.sapPlant,
      warehouseCode: form.warehouseCode,
      planArrivalDate: form.planArrivalDate,
      remark: form.remark,
      lines: lines.value.map((line) => ({
        lineNo: line.lineNo,
        productId: line.productId,
        productCode: line.productCode,
        productName: line.productName,
        plannedQty: line.plannedQty,
        sapPlant: line.sapPlant || form.sapPlant,
        sapStorageLocation: line.sapStorageLocation,
        snRequired: Boolean(line.snRequired),
        batchNo: line.batchNo,
        qualityStatus: line.qualityStatus
      }))
    }
    if (props.mode === 'edit' && props.orderId) {
      await inboundService.update(Number(props.orderId), { ...payload, operator: 'wh_admin' })
      ElMessage.success('预期到货通知单已保存')
    } else {
      await inboundService.create(payload)
      ElMessage.success('预期到货通知单创建成功')
    }
    visible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-form {
  margin-bottom: 12px;
}

.line-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 10px;
}
</style>
