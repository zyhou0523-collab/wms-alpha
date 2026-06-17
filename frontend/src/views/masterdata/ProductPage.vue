<template>
  <AlphaListPage
    title="产品主数据"
    subtitle="按货主维度维护产品主数据；同一货主下产品编码唯一，不同货主可重复。"
    :columns="columns"
    :search-fields="searchFields"
    :form-fields="formFields"
    :fetcher="productService.list"
    :creator="productService.create"
    :updater="productService.update"
    :remover="productService.remove"
  >
    <template #toolbar="{ query, reload }">
      <el-button @click="downloadTemplate">导入模板</el-button>
      <el-button @click="productFileInput?.click()">导入</el-button>
      <el-button @click="exportRows(query)">导出</el-button>
      <input ref="productFileInput" class="hidden-file-input" type="file" accept=".csv,.txt" @change="(event) => importRows(event, reload)" />
    </template>
  </AlphaListPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import AlphaListPage from '../../components/AlphaListPage.vue'
import { productService } from '../../api/services'
import { downloadTextFile, importResultHtml, parseCsvRows, readTextFile } from '../../utils/fileTransfer'

const productFileInput = ref<HTMLInputElement>()

const statusOptions = [{ label: '有效', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }]
const yesNoOptions = [{ label: '是', value: 1 }, { label: '否', value: 0 }]
const ownerOptions = [{ label: '1000 / 海兴电力', value: '1000' }, { label: '3060 / 杭州利沃得', value: '3060' }]

const columns = [
  { prop: 'owner_code', label: '货主', width: 130 },
  { prop: 'product_code', label: '产品编码', width: 170 },
  { prop: 'product_name', label: '产品名称（中文）', width: 220 },
  { prop: 'product_name_en', label: '产品名称（英文）', width: 220 },
  { prop: 'spec_model', label: '产品型号', width: 150 },
  { prop: 'product_family', label: '产品族', width: 120 },
  { prop: 'product_class', label: '产品类', width: 140 },
  { prop: 'category', label: '类别', width: 100 },
  { prop: 'unit', label: '单位', width: 80 },
  { prop: 'sn_managed', label: 'SN管理', type: 'boolean', width: 100 },
  { prop: 'battery_flag', label: '电池类', type: 'boolean', width: 90 },
  { prop: 'safety_stock', label: '安全库存', width: 100 },
  { prop: 'aging_threshold_days', label: '库龄阈值', width: 100 },
  { prop: 'status', label: '状态', type: 'status', width: 100 }
]

const searchFields = [
  { prop: 'ownerCode', label: '货主', type: 'select', options: ownerOptions },
  { prop: 'productCode', label: '产品编码' },
  { prop: 'productName', label: '产品名称' },
  { prop: 'productFamily', label: '产品族' },
  { prop: 'productClass', label: '产品类' },
  { prop: 'snManaged', label: 'SN管理', type: 'select', options: yesNoOptions },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

const formFields = [
  { prop: 'owner_code', label: '货主', type: 'select', options: ownerOptions },
  { prop: 'owner_name', label: '货主名称' },
  { prop: 'product_code', label: '产品编码' },
  { prop: 'product_name', label: '产品名称（中文）' },
  { prop: 'product_name_en', label: '产品名称（英文）' },
  { prop: 'spec_model', label: '产品型号' },
  { prop: 'product_family', label: '产品族' },
  { prop: 'product_class', label: '产品类' },
  { prop: 'category', label: '类别' },
  { prop: 'unit', label: '单位' },
  { prop: 'sn_managed', label: 'SN管理', type: 'switch' },
  { prop: 'battery_flag', label: '电池类', type: 'switch' },
  { prop: 'safety_stock', label: '安全库存', type: 'number' },
  { prop: 'aging_threshold_days', label: '库龄阈值', type: 'number' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

async function downloadTemplate() {
  downloadTextFile(await productService.exportTemplate())
}

async function exportRows(query: Record<string, unknown>) {
  downloadTextFile(await productService.exportData({ ...query }))
}

async function importRows(event: Event, reload: () => Promise<void>) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const rows = parseCsvRows(await readTextFile(file))
    const result = await productService.importRows(rows)
    await ElMessageBox.alert(importResultHtml(result), '产品主数据导入结果', { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' })
    await reload()
  } finally {
    input.value = ''
  }
}
</script>

<style scoped>
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
</style>
