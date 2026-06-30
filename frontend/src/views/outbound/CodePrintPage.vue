<template>
  <div class="code-print-page">
    <div class="page-header no-print">
      <div>
        <h2>条码打印</h2>
        <p>按实体仓库生成托盘码 / 箱码，支持新码打印和历史码补打。</p>
      </div>
      <el-radio-group v-model="printType" size="large" @change="resetPreview">
        <el-radio-button label="PALLET">托盘码</el-radio-button>
        <el-radio-button label="BOX">箱码</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="16" class="no-print">
      <el-col :span="12">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-title">
              <span>新码打印</span>
              <el-tag type="info">{{ currentRule }}</el-tag>
            </div>
          </template>
          <el-form :model="generateForm" label-width="110px">
            <el-form-item label="实体仓库" required>
              <el-select v-model="generateForm.warehouseCode" filterable placeholder="请选择实体仓库">
                <el-option
                  v-for="warehouse in warehouses"
                  :key="warehouse.warehouse_code"
                  :label="`${warehouse.warehouse_name} / ${warehouse.warehouse_code}`"
                  :value="warehouse.warehouse_code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="打印数量" required>
              <el-input-number v-model="generateForm.quantity" :min="1" :max="100" />
              <span class="form-tip">单次最多 100 个</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateCodes">生成并预览</el-button>
              <el-button :disabled="!previewItems.length" @click="printPreview">打印预览</el-button>
            </el-form-item>
          </el-form>
          <el-alert
            :closable="false"
            type="success"
            show-icon
            :title="printType === 'PALLET' ? '托盘码格式：仓库编码 + TRACE + yyyyMMdd + 4 位流水号' : '箱码格式：仓库编码 + BOX + yyyyMMdd + 4 位流水号'"
          />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-title">
              <span>历史码补打</span>
              <el-tag type="warning">补打不生成新码</el-tag>
            </div>
          </template>
          <el-form label-width="110px">
            <el-form-item :label="printType === 'PALLET' ? '历史托盘码' : '历史箱码'" required>
              <el-input v-model.trim="reprintCode" clearable :placeholder="printType === 'PALLET' ? '如 HZTRACE202606300001' : '如 HZBOX202606300001'" />
            </el-form-item>
            <el-form-item>
              <el-button @click="searchCode">查询</el-button>
              <el-button type="primary" :disabled="!searchedRecord" @click="reprint">补打</el-button>
            </el-form-item>
          </el-form>
          <el-descriptions v-if="searchedRecord" :column="2" border size="small" class="record-desc">
            <el-descriptions-item label="码值">{{ searchedRecord.code_value }}</el-descriptions-item>
            <el-descriptions-item label="所属仓库">{{ searchedRecord.warehouse_name }}</el-descriptions-item>
            <el-descriptions-item label="首次打印">{{ searchedRecord.first_print_time }}</el-descriptions-item>
            <el-descriptions-item label="补打次数">{{ searchedRecord.reprint_count }}</el-descriptions-item>
            <el-descriptions-item label="最近打印">{{ searchedRecord.last_print_time }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ searchedRecord.status }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="preview-card">
      <template #header>
        <div class="card-title">
          <span>打印预览</span>
          <span class="muted">{{ previewItems.length ? `共 ${previewItems.length} 个${printTypeName}` : '请先生成新码或查询历史码' }}</span>
        </div>
      </template>
      <el-empty v-if="!previewItems.length" description="暂无预览内容" />
      <div v-else class="print-area">
        <div v-for="item in previewItems" :key="item.code_value" class="label-card">
          <div v-if="printType === 'PALLET'" class="qr-code" aria-label="二维码预览">
            <span v-for="(active, index) in qrCells(item.code_value)" :key="index" :class="{ active }" />
          </div>
          <div v-else class="barcode" aria-label="条形码预览">
            <span v-for="(bar, index) in barcodeBars(item.code_value)" :key="index" :style="{ width: `${bar}px` }" />
          </div>
          <strong>{{ item.code_value }}</strong>
          <small>{{ item.warehouse_name }} / {{ item.warehouse_code }}</small>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="panel-card no-print">
      <template #header>
        <div class="card-title">
          <span>打印记录</span>
          <el-button size="small" @click="loadRecords">刷新</el-button>
        </div>
      </template>
      <el-table :data="records" border>
        <el-table-column prop="code_type_name" label="码类型" width="100" />
        <el-table-column prop="code_value" label="码值" min-width="190" show-overflow-tooltip />
        <el-table-column prop="warehouse_name" label="实体仓库" width="120" />
        <el-table-column prop="warehouse_code" label="仓库编码" width="100" />
        <el-table-column prop="generated_date" label="生成日期" width="120" />
        <el-table-column prop="serial_no" label="流水号" width="90" />
        <el-table-column prop="reprint_count" label="补打次数" width="100" />
        <el-table-column prop="last_print_time" label="最近打印时间" width="170" />
        <el-table-column prop="created_by" label="创建人" width="100" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { codePrintService } from '../../api/services'

type PrintType = 'PALLET' | 'BOX'
type Row = Record<string, any>

const printType = ref<PrintType>('PALLET')
const warehouses = ref<Row[]>([])
const records = ref<Row[]>([])
const generatedItems = ref<Row[]>([])
const searchedRecord = ref<Row | null>(null)
const reprintCode = ref('')
const generateForm = reactive({ warehouseCode: '', quantity: 1 })

const printTypeName = computed(() => printType.value === 'PALLET' ? '托盘码' : '箱码')
const currentRule = computed(() => printType.value === 'PALLET' ? 'HZTRACE202606300001' : 'HZBOX202606300001')
const previewItems = computed(() => generatedItems.value.length ? generatedItems.value : searchedRecord.value ? [searchedRecord.value] : [])

onMounted(async () => {
  await loadWarehouses()
  await loadRecords()
})

async function loadWarehouses() {
  const result = await codePrintService.getAuthorizedWarehouses()
  warehouses.value = result.items || []
  generateForm.warehouseCode ||= warehouses.value[0]?.warehouse_code || ''
}

async function loadRecords() {
  const result = await codePrintService.getCodePrintRecords({ pageNum: 1, pageSize: 20, codeType: printType.value })
  records.value = result.items || []
}

function resetPreview() {
  generatedItems.value = []
  searchedRecord.value = null
  reprintCode.value = ''
  loadRecords()
}

async function generateCodes() {
  if (!generateForm.warehouseCode) return ElMessage.warning('请选择实体仓库')
  if (!generateForm.quantity || generateForm.quantity <= 0) return ElMessage.warning('打印数量必须大于 0')
  const service = printType.value === 'PALLET' ? codePrintService.generatePalletCodes : codePrintService.generateBoxCodes
  const result = await service({ warehouseCode: generateForm.warehouseCode, quantity: generateForm.quantity })
  generatedItems.value = result.items || []
  searchedRecord.value = null
  ElMessage.success(`已生成 ${generatedItems.value.length} 个${printTypeName.value}`)
  await loadRecords()
}

async function searchCode() {
  if (!reprintCode.value) return ElMessage.warning(`请输入历史${printTypeName.value}`)
  const service = printType.value === 'PALLET' ? codePrintService.searchPalletCode : codePrintService.searchBoxCode
  searchedRecord.value = await service(reprintCode.value)
  generatedItems.value = []
}

async function reprint() {
  if (!searchedRecord.value) return
  await ElMessageBox.confirm(`确认补打 ${searchedRecord.value.code_value}？补打不会生成新码。`, '补打确认', { type: 'warning' })
  const service = printType.value === 'PALLET' ? codePrintService.reprintPalletCode : codePrintService.reprintBoxCode
  searchedRecord.value = await service(searchedRecord.value.code_value)
  ElMessage.success('补打记录已更新')
  await loadRecords()
  printPreview()
}

function printPreview() {
  window.print()
}

function qrCells(code: string) {
  const chars = code.split('').map((char) => char.charCodeAt(0))
  return Array.from({ length: 121 }, (_, index) => {
    const border = index < 11 || index >= 110 || index % 11 === 0 || index % 11 === 10
    return border || ((chars[index % chars.length] + index * 7) % 5 < 2)
  })
}

function barcodeBars(code: string) {
  const chars = code.split('').map((char) => char.charCodeAt(0))
  return Array.from({ length: 48 }, (_, index) => 1 + ((chars[index % chars.length] + index) % 4))
}
</script>

<style scoped>
.code-print-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header,
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-header {
  padding: 18px 20px;
  background: #fff;
  border: 1px solid var(--wms-border);
  border-radius: 8px;
}

.page-header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #1f2937;
}

.page-header p,
.muted,
.form-tip {
  color: #667085;
}

.form-tip {
  margin-left: 12px;
}

.panel-card,
.preview-card {
  border-radius: 8px;
}

.record-desc {
  margin-top: 12px;
}

.print-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 18px;
}

.label-card {
  min-height: 220px;
  padding: 18px;
  border: 1px dashed #94a3b8;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #fff;
  break-inside: avoid;
}

.label-card strong {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 15px;
  color: #111827;
  word-break: break-all;
}

.label-card small {
  color: #667085;
}

.qr-code {
  width: 126px;
  height: 126px;
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(11, 1fr);
  gap: 2px;
  padding: 8px;
  background: #fff;
  border: 1px solid #111827;
}

.qr-code span {
  background: #fff;
}

.qr-code span.active {
  background: #111827;
}

.barcode {
  height: 96px;
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid #111827;
  background: #fff;
}

.barcode span {
  display: inline-block;
  background: #111827;
}

@media print {
  :global(.sidebar),
  :global(.topbar),
  .no-print {
    display: none !important;
  }

  :global(.content) {
    padding: 0 !important;
    background: #fff !important;
  }

  .preview-card {
    border: 0 !important;
    box-shadow: none !important;
  }

  .print-area {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
