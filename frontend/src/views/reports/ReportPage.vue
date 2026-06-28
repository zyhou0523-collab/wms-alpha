<template>
  <div class="report-page">
    <el-card class="report-header" shadow="never">
      <div>
        <h2>{{ config.title }}</h2>
        <p>{{ config.description }}</p>
      </div>
      <el-tag type="info" effect="plain">{{ config.dateFieldLabel }}</el-tag>
    </el-card>

    <el-card class="report-filter-card" shadow="never">
      <el-form :model="query" label-width="108px" class="report-filter-form">
        <el-row :gutter="12">
          <el-col v-for="field in config.filters" :key="field.prop" :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item :label="field.label">
              <el-date-picker
                v-if="field.type === 'dateRange'"
                v-model="query[field.prop]"
                class="full-control"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                range-separator="至"
              />
              <el-date-picker
                v-else-if="field.type === 'date'"
                v-model="query[field.prop]"
                class="full-control"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="query[field.prop]"
                clearable
                filterable
                class="full-control"
                :placeholder="field.placeholder || `请选择${field.label}`"
              >
                <el-option v-for="option in field.options || []" :key="String(option.value)" :label="option.label" :value="option.value" />
              </el-select>
              <el-input
                v-else
                v-model="query[field.prop]"
                clearable
                :placeholder="field.placeholder || `请输入${field.label}`"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div class="report-toolbar">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" :loading="exporting" @click="handleExport">导出</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </el-card>

    <div v-if="summaryCards.length" class="summary-grid">
      <el-card v-for="card in summaryCards" :key="card.label" class="summary-card" shadow="never">
        <span>{{ card.label }}</span>
        <strong>{{ summaryValue(card) }}<small v-if="card.suffix">{{ card.suffix }}</small></strong>
      </el-card>
    </div>

    <el-card class="report-table-card" shadow="never">
      <el-table v-loading="loading" :data="rows" border stripe class="report-table">
        <el-table-column type="index" width="56" label="序号" fixed="left" />
        <el-table-column
          v-for="column in config.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :align="column.type === 'number' ? 'right' : 'left'"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag v-if="column.type === 'status'" :type="statusTagType(cell(row, column.prop))" effect="plain">
              {{ cell(row, column.prop) || '-' }}
            </el-tag>
            <span v-else-if="column.type === 'boolean'">{{ boolText(cell(row, column.prop)) }}</span>
            <span v-else-if="column.type === 'number'" class="number-cell">{{ numberText(cell(row, column.prop)) }}</span>
            <span v-else>{{ displayText(cell(row, column.prop)) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="report-pagination">
        <el-pagination
          v-model:current-page="pager.pageNum"
          v-model:page-size="pager.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '../../api/report'
import { downloadTextFile } from '../../utils/fileTransfer'
import type { ReportConfig, ReportSummaryCard } from './reportConfigs'

const props = defineProps<{ config: ReportConfig }>()

const query = reactive<Record<string, any>>({})
const pager = reactive({ pageNum: 1, pageSize: 10 })
const rows = ref<Record<string, unknown>[]>([])
const total = ref(0)
const loading = ref(false)
const exporting = ref(false)

const summaryCards = computed(() => props.config.summaryCards || [])

watch(
  () => props.config.reportKey,
  () => {
    resetQuery()
    pager.pageNum = 1
    load()
  },
  { immediate: true }
)

async function load() {
  loading.value = true
  try {
    const page = await reportApi.list(props.config.reportKey, buildParams())
    rows.value = page.items || []
    total.value = page.total || 0
    pager.pageNum = page.pageNum || pager.pageNum
    pager.pageSize = page.pageSize || pager.pageSize
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pager.pageNum = 1
  load()
}

function handleReset() {
  resetQuery()
  handleSearch()
}

function handleSizeChange() {
  pager.pageNum = 1
  load()
}

async function handleExport() {
  exporting.value = true
  try {
    downloadTextFile(await reportApi.exportData(props.config.reportKey, buildParams(false)))
    ElMessage.success('报表已导出')
  } finally {
    exporting.value = false
  }
}

function resetQuery() {
  Object.keys(query).forEach((key) => delete query[key])
  props.config.filters.forEach((field) => {
    query[field.prop] = ''
  })
}

function buildParams(withPage = true) {
  const params: Record<string, unknown> = {}
  props.config.filters.forEach((field) => {
    const value = query[field.prop]
    if (Array.isArray(value) && field.type === 'dateRange') {
      if (value[0] && field.startProp) params[field.startProp] = value[0]
      if (value[1] && field.endProp) params[field.endProp] = value[1]
      return
    }
    if (value !== '' && value != null) params[field.prop] = value
  })
  if (withPage) {
    params.pageNum = pager.pageNum
    params.pageSize = pager.pageSize
  }
  return params
}

function cell(row: Record<string, unknown>, prop: string) {
  return row[prop] ?? row[toSnake(prop)] ?? ''
}

function toSnake(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function displayText(value: unknown) {
  return value === '' || value == null ? '-' : String(value)
}

function numberText(value: unknown) {
  if (value === '' || value == null) return '-'
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : String(value)
}

function boolText(value: unknown) {
  return value === true || Number(value) === 1 || String(value).toUpperCase() === 'TRUE' ? '是' : '否'
}

function summaryValue(card: ReportSummaryCard) {
  if (card.calc) return card.calc(rows.value)
  if (!card.prop) return '-'
  return rows.value.reduce((totalValue, row) => totalValue + Number(cell(row, card.prop || '') || 0), 0)
}

function statusTagType(value: unknown) {
  const text = String(value || '').toUpperCase()
  if (['FAILED', 'UNQUALIFIED', 'CANCELED', 'CANCELLED', '超期'].some((item) => text.includes(item))) return 'danger'
  if (['POSTED', 'SUCCESS', 'SHIPPED', 'RECEIVED', 'ON_SHELF', 'QUALIFIED', '正常'].some((item) => text.includes(item))) return 'success'
  if (['PENDING', 'NOT_POSTED', 'ALLOCATED', 'PICKED', 'WARNING', '关注'].some((item) => text.includes(item))) return 'warning'
  return 'info'
}
</script>

<style scoped>
.report-page {
  padding: 16px;
  background: #f5f7fb;
  min-height: calc(100vh - 50px);
}

.report-header {
  margin-bottom: 12px;
}

.report-header :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.report-header h2 {
  margin: 0;
  color: #1f2d3d;
  font-size: 22px;
}

.report-header p {
  margin: 8px 0 0;
  color: #606266;
}

.report-filter-card,
.report-table-card {
  margin-bottom: 12px;
}

.report-filter-form {
  margin-bottom: 4px;
}

.full-control {
  width: 100%;
}

.report-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card span {
  color: #6b7280;
}

.summary-card strong {
  color: #1f2d3d;
  font-size: 24px;
}

.summary-card small {
  margin-left: 6px;
  color: #909399;
  font-size: 12px;
}

.report-table {
  width: 100%;
}

.number-cell {
  font-variant-numeric: tabular-nums;
}

.report-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .report-toolbar {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}
</style>
