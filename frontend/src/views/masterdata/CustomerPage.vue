<template>
  <AlphaListPage
    title="客户主数据"
    subtitle="统一维护客户、供应商、货主基础资料，供入库单货主和来源对象选择。"
    :columns="columns"
    :search-fields="searchFields"
    :form-fields="formFields"
    :fetcher="customerService.list"
    :creator="customerService.create"
    :updater="customerService.update"
    :remover="customerService.remove"
  >
    <template #toolbar="{ query, reload }">
      <el-button @click="downloadTemplate">导入模板</el-button>
      <el-button @click="customerFileInput?.click()">导入</el-button>
      <el-button @click="exportRows(query)">导出</el-button>
      <input ref="customerFileInput" class="hidden-file-input" type="file" accept=".csv,.txt" @change="(event) => importRows(event, reload)" />
    </template>
  </AlphaListPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import AlphaListPage from '../../components/AlphaListPage.vue'
import { customerService } from '../../api/services'
import { downloadTextFile, importResultHtml, parseCsvRows, readTextFile } from '../../utils/fileTransfer'

const customerFileInput = ref<HTMLInputElement>()

const statusOptions = [{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }]
const yesNoOptions = [{ label: '是', value: 1 }, { label: '否', value: 0 }]
const customerTypeOptions = [
  { label: '客户', value: 'CUSTOMER' },
  { label: '供应商', value: 'SUPPLIER' },
  { label: '货主', value: 'OWNER' }
]

const columns = [
  { prop: 'customer_code', label: '编码', width: 160 },
  { prop: 'customer_name', label: '名称', width: 200 },
  { prop: 'customer_type', label: '类型', width: 120 },
  { prop: 'country_region', label: '国家/地区', width: 120 },
  { prop: 'contact_name', label: '联系人', width: 100 },
  { prop: 'contact_phone', label: '联系电话', width: 130 },
  { prop: 'delivery_address', label: '地址', width: 220 },
  { prop: 'vmi_flag', label: 'VMI', type: 'boolean', width: 90 },
  { prop: 'status', label: '状态', type: 'status', width: 100 }
]

const searchFields = [
  { prop: 'customerCode', label: '编码' },
  { prop: 'customerName', label: '名称' },
  { prop: 'customerType', label: '类型', type: 'select', options: customerTypeOptions },
  { prop: 'vmiFlag', label: 'VMI', type: 'select', options: yesNoOptions },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

const formFields = [
  { prop: 'customer_code', label: '编码' },
  { prop: 'customer_name', label: '名称' },
  { prop: 'customer_type', label: '类型', type: 'select', options: customerTypeOptions },
  { prop: 'country_region', label: '国家/地区' },
  { prop: 'contact_name', label: '联系人' },
  { prop: 'contact_phone', label: '联系电话' },
  { prop: 'delivery_address', label: '地址' },
  { prop: 'vmi_flag', label: 'VMI', type: 'switch' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

async function downloadTemplate() {
  downloadTextFile(await customerService.exportTemplate())
}

async function exportRows(query: Record<string, unknown>) {
  downloadTextFile(await customerService.exportData({ ...query }))
}

async function importRows(event: Event, reload: () => Promise<void>) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const rows = parseCsvRows(await readTextFile(file))
    const result = await customerService.importRows(rows)
    await ElMessageBox.alert(importResultHtml(result), '客户主数据导入结果', { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' })
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
