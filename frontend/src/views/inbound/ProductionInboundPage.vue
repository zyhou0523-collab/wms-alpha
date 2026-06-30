<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">生产入库</div>
          <div class="muted">MES SN 下发、扫码收货、托盘/箱/SN 绑定、上架、SAP 入库回传闭环</div>
        </div>
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </template>

    <el-form :model="query" inline label-width="96px">
      <el-form-item label="入库单号">
        <el-input v-model="query.orderNo" clearable placeholder="IN202606110001" />
      </el-form-item>
      <el-form-item label="SAP 工单">
        <el-input v-model="query.sourceOrderNo" clearable placeholder="MO202606110001" />
      </el-form-item>
      <el-form-item label="MES 工单">
        <el-input v-model="query.mesWorkOrderNo" clearable placeholder="MES-MO-202606110001" />
      </el-form-item>
      <el-form-item label="仓库">
        <el-input v-model="query.warehouseCode" clearable placeholder="HZ" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="请选择" style="width: 160px">
          <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="primary" @click="openCreate">新增生产入库</el-button>
      <el-button @click="openSapMock">模拟 SAP 工单下发</el-button>
      <el-button @click="mockTip('导入')">导入</el-button>
      <el-button @click="mockTip('导出')">导出</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" border stripe>
      <el-table-column type="index" label="序号" width="64" />
      <el-table-column prop="order_no" label="入库单号" width="170" />
      <el-table-column prop="source_order_no" label="SAP 工单" width="170" />
      <el-table-column prop="mes_work_order_no" label="MES 工单" width="190" />
      <el-table-column prop="product_code" label="产品编码" width="170" />
      <el-table-column prop="product_name" label="产品名称" width="170" />
      <el-table-column prop="warehouse_code" label="仓库编码" width="160" />
      <el-table-column prop="planned_qty" label="计划" width="80" />
      <el-table-column prop="received_qty" label="已收" width="80" />
      <el-table-column prop="shelved_qty" label="已上架" width="90" />
      <el-table-column prop="sap_material_doc_no" label="SAP 凭证" width="140" />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="420">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="openMes(row)">MES 下发</el-button>
          <el-button link type="primary" @click="openReceive(row)">收货</el-button>
          <el-button link type="primary" @click="openBind(row)">绑定</el-button>
          <el-button link type="primary" @click="openPutaway(row)">上架</el-button>
          <el-button link type="success" @click="sapPost(row, false)">SAP 回传</el-button>
          <el-button link type="danger" @click="sapPost(row, true)">失败模拟</el-button>
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

  <el-dialog v-model="formVisible" :title="formMode === 'create' ? '新增生产入库' : '编辑生产入库'" width="680px">
    <el-form :model="form" label-width="120px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="入库单号"><el-input v-model="form.orderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="SAP 工单"><el-input v-model="form.sapWorkOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="MES 工单"><el-input v-model="form.mesWorkOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="产品编码"><el-input v-model="form.productCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="仓库编码"><el-input v-model="form.warehouseCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="计划数量"><el-input-number v-model="form.plannedQty" :min="1" style="width: 100%" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="formVisible = false">取消</el-button>
      <el-button type="primary" @click="saveForm">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="sapMockVisible" title="模拟 SAP 生产工单下发" width="680px">
    <el-form :model="sapMockForm" label-width="130px">
      <el-row :gutter="12">
        <el-col :span="12"><el-form-item label="入库单号"><el-input v-model="sapMockForm.inboundOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="SAP 工单"><el-input v-model="sapMockForm.sapWorkOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="MES 工单"><el-input v-model="sapMockForm.mesWorkOrderNo" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="产品编码"><el-input v-model="sapMockForm.productCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="仓库编码"><el-input v-model="sapMockForm.warehouseCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="数量"><el-input-number v-model="sapMockForm.qty" :min="1" style="width: 100%" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="sapMockVisible = false">取消</el-button>
      <el-button type="primary" @click="submitSapMock">下发</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="mesVisible" title="模拟 MES SN 下发" width="680px">
    <el-form :model="mesForm" label-width="120px">
      <el-form-item label="MES 工单"><el-input v-model="mesForm.mesWorkOrderNo" /></el-form-item>
      <el-form-item label="产品编码"><el-input v-model="mesForm.productCode" /></el-form-item>
      <el-form-item label="SN 列表">
        <el-input v-model="mesForm.serialText" type="textarea" :rows="8" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="mesVisible = false">取消</el-button>
      <el-button type="primary" @click="submitMes">下发</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="receiveVisible" title="扫码收货" width="680px">
    <el-alert type="info" show-icon :closable="false" title="可粘贴多行 SN，确认后状态从 ISSUED 流转到 INBOUND。" />
    <el-input v-model="receiveForm.serialText" class="dialog-textarea" type="textarea" :rows="8" />
    <template #footer>
      <el-button @click="receiveVisible = false">取消</el-button>
      <el-button type="primary" @click="submitReceive">确认收货</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="bindVisible" title="托盘/箱/SN 绑定" width="720px">
    <el-form :model="bindForm" label-width="110px">
      <el-form-item label="托盘码"><el-input v-model="bindForm.palletCode" /></el-form-item>
      <el-form-item label="箱码"><el-input v-model="bindForm.boxCode" /></el-form-item>
      <el-form-item label="SN 列表"><el-input v-model="bindForm.serialText" type="textarea" :rows="8" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="bindVisible = false">取消</el-button>
      <el-button type="primary" @click="submitBind">确认绑定</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="putawayVisible" title="上架" width="680px">
    <el-form :model="putawayForm" label-width="110px">
      <el-form-item label="目标库位"><el-input v-model="putawayForm.locationCode" /></el-form-item>
      <el-form-item label="托盘码"><el-input v-model="putawayForm.palletCode" placeholder="可选，留空则上架当前单据全部已收 SN" /></el-form-item>
      <el-form-item label="SN 列表"><el-input v-model="putawayForm.serialText" type="textarea" :rows="6" placeholder="可选" /></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="putawayVisible = false">取消</el-button>
      <el-button type="primary" @click="submitPutaway">确认上架</el-button>
    </template>
  </el-dialog>

  <el-drawer v-model="detailVisible" title="生产入库详情" size="62%">
    <template v-if="detail.order">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="入库单">{{ detail.order.order_no }}</el-descriptions-item>
        <el-descriptions-item label="SAP 工单">{{ detail.order.source_order_no }}</el-descriptions-item>
        <el-descriptions-item label="MES 工单">{{ detail.order.mes_work_order_no }}</el-descriptions-item>
        <el-descriptions-item label="产品">{{ detail.order.product_code }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.order.warehouse_code }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(detail.order.status)">{{ detail.order.status }}</el-tag></el-descriptions-item>
      </el-descriptions>
      <el-tabs class="detail-tabs">
        <el-tab-pane label="SN">
          <el-table :data="detail.serialNumbers || []" border height="260">
            <el-table-column prop="sn_code" label="SN" width="170" />
            <el-table-column prop="status" label="状态" width="110"><template #default="{ row }"><el-tag :type="statusType(row.status)">{{ row.status }}</el-tag></template></el-table-column>
            <el-table-column prop="pallet_code" label="托盘" width="170" />
            <el-table-column prop="box_code" label="箱码" width="170" />
            <el-table-column prop="location_code" label="库位" width="130" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="绑定">
          <el-table :data="detail.bindings || []" border height="220">
            <el-table-column prop="pallet_code" label="托盘码" />
            <el-table-column prop="box_code" label="箱码" />
            <el-table-column prop="sn_code" label="SN" />
            <el-table-column prop="bind_status" label="状态" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="操作日志">
          <el-table :data="detail.operationLogs || []" border height="220">
            <el-table-column prop="action" label="动作" />
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="result" label="结果" />
            <el-table-column prop="message" label="说明" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="接口日志">
          <el-table :data="detail.interfaceLogs || []" border height="220">
            <el-table-column prop="interface_name" label="接口" />
            <el-table-column prop="status" label="状态" />
            <el-table-column prop="error_message" label="失败原因" />
            <el-table-column prop="created_at" label="时间" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { productionInboundService } from '../../api/services'

const statusOptions = ['CREATED', 'RECEIVING', 'RECEIVED', 'BOUND', 'ON_SHELF', 'SAP_FAILED', 'CLOSED']
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const selectedId = ref<number>()
const query = reactive<any>({ pageNum: 1, pageSize: 10 })
const form = reactive<any>({})
const sapMockForm = reactive<any>({ inboundOrderNo: 'IN-MOCK-001', sapWorkOrderNo: 'MO-MOCK-001', mesWorkOrderNo: 'MES-MO-MOCK-001', productCode: 'GT3-30KD1R11001', warehouseCode: 'HZ', qty: 10 })
const mesForm = reactive<any>({})
const receiveForm = reactive<any>({})
const bindForm = reactive<any>({})
const putawayForm = reactive<any>({ locationCode: 'A01-01-01' })
const detail = ref<any>({})
const formVisible = ref(false)
const sapMockVisible = ref(false)
const mesVisible = ref(false)
const receiveVisible = ref(false)
const bindVisible = ref(false)
const putawayVisible = ref(false)
const detailVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await productionInboundService.list({ ...query })
    rows.value = data.items
    total.value = data.total
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
  Object.assign(form, { orderNo: '', sapWorkOrderNo: 'MO202606110001', mesWorkOrderNo: 'MES-MO-202606110001', productCode: 'GT3-30KD1R11001', warehouseCode: 'HZ', plannedQty: 10 })
  formMode.value = 'create'
  formVisible.value = true
}

function openEdit(row: any) {
  selectedId.value = row.id
  Object.assign(form, { orderNo: row.order_no, sapWorkOrderNo: row.source_order_no, mesWorkOrderNo: row.mes_work_order_no, productCode: row.product_code, warehouseCode: row.warehouse_code, plannedQty: row.planned_qty })
  formMode.value = 'edit'
  formVisible.value = true
}

async function saveForm() {
  if (formMode.value === 'create') await productionInboundService.create({ ...form })
  else if (selectedId.value) await productionInboundService.update(selectedId.value, { ...form })
  ElMessage.success('保存成功')
  formVisible.value = false
  await load()
}

function openSapMock() {
  sapMockVisible.value = true
}

async function submitSapMock() {
  await productionInboundService.sapProductionOrder({ ...sapMockForm })
  ElMessage.success('SAP 生产工单已下发')
  sapMockVisible.value = false
  await load()
}

function openMes(row: any) {
  selectedId.value = row.id
  Object.assign(mesForm, {
    mesWorkOrderNo: row.mes_work_order_no,
    productCode: row.product_code,
    serialText: Array.from({ length: Number(row.planned_qty || 10) }, (_, i) => `SN-GT3-${String(i + 1).padStart(4, '0')}`).join('\n')
  })
  mesVisible.value = true
}

async function submitMes() {
  await productionInboundService.mesSnPush({ mesWorkOrderNo: mesForm.mesWorkOrderNo, productCode: mesForm.productCode, serialNumbers: parseLines(mesForm.serialText) })
  ElMessage.success('MES SN 下发成功，接口日志已记录')
  mesVisible.value = false
  await load()
}

async function openDetail(row: any) {
  detail.value = await productionInboundService.detail(row.id)
  detailVisible.value = true
}

async function openReceive(row: any) {
  selectedId.value = row.id
  const data = await productionInboundService.detail(row.id)
  const remainingQty = Math.max(Number(data.order.planned_qty || 0) - Number(data.order.received_qty || 0), 0)
  receiveForm.serialText = (data.serialNumbers || [])
    .filter((sn: any) => sn.status === 'ISSUED' && sn.product_code === data.order.product_code)
    .slice(0, remainingQty)
    .map((sn: any) => sn.sn_code)
    .join('\n')
  receiveVisible.value = true
}

async function submitReceive() {
  if (!selectedId.value) return
  await productionInboundService.receive(selectedId.value, { serialNumbers: parseLines(receiveForm.serialText), operator: 'wh_admin' })
  ElMessage.success('收货成功')
  receiveVisible.value = false
  await load()
}

async function openBind(row: any) {
  selectedId.value = row.id
  const data = await productionInboundService.detail(row.id)
  Object.assign(bindForm, {
    palletCode: 'PLT202606110001',
    boxCode: 'BOX202606110001',
    serialText: (data.serialNumbers || []).filter((sn: any) => sn.status === 'INBOUND').map((sn: any) => sn.sn_code).join('\n')
  })
  bindVisible.value = true
}

async function submitBind() {
  if (!selectedId.value) return
  await productionInboundService.bindPackage(selectedId.value, { palletCode: bindForm.palletCode, boxCode: bindForm.boxCode, serialNumbers: parseLines(bindForm.serialText), operator: 'wh_admin' })
  ElMessage.success('绑定成功')
  bindVisible.value = false
  await load()
}

async function openPutaway(row: any) {
  selectedId.value = row.id
  Object.assign(putawayForm, { locationCode: 'A01-01-01', palletCode: 'PLT202606110001', serialText: '' })
  putawayVisible.value = true
}

async function submitPutaway() {
  if (!selectedId.value) return
  await productionInboundService.putaway(selectedId.value, { locationCode: putawayForm.locationCode, palletCode: putawayForm.palletCode, serialNumbers: parseLines(putawayForm.serialText), operator: 'wh_admin' })
  ElMessage.success('上架成功，库存已更新')
  putawayVisible.value = false
  await load()
}

async function sapPost(row: any, forceFail: boolean) {
  try {
    await productionInboundService.sapPost(row.id, { forceFail, operator: 'admin' })
    if (forceFail) ElMessage.warning('SAP 失败已模拟，接口日志可查看失败原因')
    else ElMessage.success('SAP 回传成功')
  } catch {
    if (forceFail) ElMessage.warning('SAP 失败已模拟，接口日志可查看失败原因')
  } finally {
    await load()
  }
}

function parseLines(value = '') {
  return String(value).split(/\r?\n|,|;|\s+/).map((item) => item.trim()).filter(Boolean)
}

function statusType(status: string) {
  if (['CLOSED', 'ON_SHELF'].includes(status)) return 'success'
  if (['SAP_FAILED', 'FAILED'].includes(status)) return 'danger'
  if (['RECEIVING', 'BOUND'].includes(status)) return 'warning'
  if (['RECEIVED', 'INBOUND'].includes(status)) return 'primary'
  return 'info'
}

function mockTip(name: string) {
  ElMessage.success(`${name}功能已模拟完成`)
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.dialog-textarea {
  margin-top: 12px;
}

.detail-tabs {
  margin-top: 16px;
}
</style>
