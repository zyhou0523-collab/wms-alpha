<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">{{ title }}</div>
          <div v-if="subtitle" class="muted">{{ subtitle }}</div>
        </div>
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </template>

    <el-form :model="query" inline label-width="96px" class="query-form">
      <el-form-item v-for="field in searchFields" :key="field.prop" :label="field.label">
        <el-select
          v-if="field.type === 'select'"
          v-model="query[field.prop]"
          clearable
          filterable
          placeholder="请选择"
          style="width: 180px"
        >
          <el-option v-for="option in field.options || []" :key="option.value" :label="option.label" :value="option.value" />
        </el-select>
        <el-input v-else v-model="query[field.prop]" clearable placeholder="请输入" style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button v-if="showCreate !== false" type="primary" @click="openAdd">新增</el-button>
      <slot name="toolbar" :query="query" :rows="rows" :selected-rows="selectedRows" :reload="load">
        <el-button @click="mockAction('导入')">导入</el-button>
        <el-button @click="mockAction('导出')">导出</el-button>
      </slot>
      <el-button v-if="scanEnabled" @click="scanVisible = true">扫码输入</el-button>
    </div>

    <el-alert
      v-if="highlightInventory"
      class="list-alert"
      type="warning"
      show-icon
      :closable="false"
      title="红色行表示库存低于安全库存，橙色行表示长库龄库存。"
    />

    <el-table
      v-loading="loading"
      :data="rows"
      border
      stripe
      :row-class-name="rowClassName"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="42" />
      <el-table-column type="index" label="序号" width="64" />
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-tag v-if="column.type === 'status'" :type="statusType(row[column.prop])" effect="light">
            {{ row[column.prop] || '-' }}
          </el-tag>
          <el-tag v-else-if="column.type === 'boolean'" :type="row[column.prop] ? 'success' : 'info'" effect="light">
            {{ row[column.prop] ? '是' : '否' }}
          </el-tag>
          <span v-else>{{ row[column.prop] ?? '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="220">
        <template #default="{ row }">
          <el-button link type="primary" @click="openView(row)">查看</el-button>
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确认删除该记录？" @confirm="removeRow(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
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

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
    <el-descriptions v-if="dialogMode === 'view'" :column="2" border>
      <el-descriptions-item v-for="column in columns" :key="column.prop" :label="column.label">
        {{ currentRow[column.prop] ?? '-' }}
      </el-descriptions-item>
    </el-descriptions>
    <el-form v-else :model="form" label-width="130px">
      <el-row :gutter="12">
        <el-col v-for="field in activeFormFields" :key="field.prop" :span="12">
          <el-form-item :label="field.label">
            <el-select
              v-if="field.type === 'select'"
              v-model="form[field.prop]"
              clearable
              filterable
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option v-for="option in field.options || []" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
            <el-switch v-else-if="field.type === 'switch'" v-model="form[field.prop]" :active-value="1" :inactive-value="0" />
            <el-input-number v-else-if="field.type === 'number'" v-model="form[field.prop]" :min="0" style="width: 100%" />
            <el-input v-else v-model="form[field.prop]" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button v-if="dialogMode !== 'view'" type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="scanVisible" title="扫码输入模拟" width="560px">
    <el-alert type="info" show-icon :closable="false" title="Alpha 阶段使用普通输入框模拟扫码，支持粘贴多行 SN。" />
    <el-input v-model="scanText" class="scan-input" type="textarea" :rows="6" placeholder="请输入或粘贴 SN / 箱码 / 托盘码" />
    <template #footer>
      <el-button @click="scanVisible = false">取消</el-button>
      <el-button type="primary" @click="mockAction('扫码校验')">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PageResult } from '../api/http'

export interface FieldOption {
  label: string
  value: string | number
}

export interface FieldConfig {
  prop: string
  label: string
  type?: string
  options?: FieldOption[]
}

export interface ColumnConfig {
  prop: string
  label: string
  width?: number | string
  type?: string
}

const props = defineProps<{
  title: string
  subtitle?: string
  columns: ColumnConfig[]
  searchFields: FieldConfig[]
  formFields?: FieldConfig[]
  fetcher: (params: Record<string, unknown>) => Promise<PageResult<Record<string, any>>>
  creator?: (data: Record<string, unknown>) => Promise<unknown>
  updater?: (id: number, data: Record<string, unknown>) => Promise<unknown>
  remover?: (id: number) => Promise<unknown>
  showCreate?: boolean
  highlightInventory?: boolean
  scanEnabled?: boolean
}>()

const loading = ref(false)
const rows = ref<Record<string, any>[]>([])
const selectedRows = ref<Record<string, any>[]>([])
const total = ref(0)
const query = reactive<Record<string, any>>({ pageNum: 1, pageSize: 10 })
const form = reactive<Record<string, any>>({})
const currentRow = ref<Record<string, any>>({})
const dialogVisible = ref(false)
const scanVisible = ref(false)
const scanText = ref('')
const dialogMode = ref<'add' | 'edit' | 'view'>('view')

const activeFormFields = computed<FieldConfig[]>(() => props.formFields?.length
  ? props.formFields
  : props.columns
      .filter((item) => item.prop !== 'id')
      .map((item) => ({ prop: item.prop, label: item.label, type: 'text' }))
)
const dialogTitle = computed(() => dialogMode.value === 'add' ? `新增${props.title}` : dialogMode.value === 'edit' ? `编辑${props.title}` : `查看${props.title}`)

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await props.fetcher({ ...query })
    rows.value = data.items
    selectedRows.value = []
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

function handleSelectionChange(selection: Record<string, any>[]) {
  selectedRows.value = selection
}

function openAdd() {
  Object.keys(form).forEach((key) => delete form[key])
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function openEdit(row: Record<string, any>) {
  Object.assign(form, row)
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function openView(row: Record<string, any>) {
  currentRow.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

async function save() {
  if (dialogMode.value === 'add') {
    if (props.creator) await props.creator({ ...form })
    else ElMessage.success('新增已在 Alpha 页面模拟完成')
  }
  if (dialogMode.value === 'edit') {
    if (props.updater && form.id) await props.updater(Number(form.id), { ...form })
    else ElMessage.success('编辑已在 Alpha 页面模拟完成')
  }
  dialogVisible.value = false
  await load()
}

async function removeRow(row: Record<string, any>) {
  if (props.remover && row.id) {
    await props.remover(Number(row.id))
    await load()
    return
  }
  ElMessage.success('删除已在 Alpha 页面模拟完成')
}

function mockAction(name: string) {
  ElMessage.success(`${name}功能已模拟完成`)
  scanVisible.value = false
  scanText.value = ''
}

function statusType(value: unknown) {
  const status = String(value || '')
  if (['CLOSED', 'ON_SHELF', 'SHIPPED', 'SUCCESS', 'ACTIVE', 'QUALIFIED', 'TRACED'].includes(status)) return 'success'
  if (['FAILED', 'FROZEN', 'UNQUALIFIED', 'DISABLED'].includes(status)) return 'danger'
  if (['WARNING', 'PENDING', 'RECEIVING', 'PICKING'].includes(status)) return 'warning'
  if (['ALLOCATED', 'PICKED', 'RECEIVED', 'INBOUND'].includes(status)) return 'primary'
  return 'info'
}

function rowClassName({ row }: { row: Record<string, any> }) {
  if (!props.highlightInventory) return ''
  if (row.low_stock || row.lowStock) return 'table-low-stock'
  if (row.aged) return 'table-aged-stock'
  return ''
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

.list-alert {
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.scan-input {
  margin-top: 12px;
}
</style>
