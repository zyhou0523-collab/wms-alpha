<template>
  <el-card class="page-card interface-page" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">接口中心</div>
          <div class="muted">查看外部系统 Mock 日志，处理失败重试，并配置 Mock 成败行为。</div>
        </div>
        <div class="header-actions">
          <el-button type="warning" plain @click="retrySelected">重试选中</el-button>
          <el-button @click="refreshCurrent">刷新</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="接口日志" name="logs">
        <el-form :model="query" inline label-width="92px" class="query-form">
          <el-form-item label="接口名称">
            <el-input v-model="query.interfaceName" clearable placeholder="SAP / MES / TRACE" />
          </el-form-item>
          <el-form-item label="来源系统">
            <el-input v-model="query.sourceSystem" clearable placeholder="WMS" />
          </el-form-item>
          <el-form-item label="目标系统">
            <el-input v-model="query.targetSystem" clearable placeholder="SAP" />
          </el-form-item>
          <el-form-item label="业务单号">
            <el-input v-model="query.businessDocNo" clearable placeholder="IN / OUT / RCV" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="query.status" clearable placeholder="全部" style="width: 150px">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchLogs">查询</el-button>
            <el-button @click="resetLogs">重置</el-button>
            <el-button @click="showFailedOnly">失败队列</el-button>
          </el-form-item>
        </el-form>

        <el-alert
          class="list-alert"
          type="warning"
          show-icon
          :closable="false"
          :title="`当前查询结果中有 ${failedCount} 条失败/警告日志，可在操作列或批量选择后触发人工重试。`"
        />

        <el-table
          v-loading="loading"
          :data="rows"
          border
          stripe
          style="width: 100%"
          @selection-change="selectedRows = $event"
        >
          <el-table-column type="selection" width="48" :selectable="isRetryable" />
          <el-table-column type="index" label="序号" width="64" />
          <el-table-column prop="interface_name" label="接口名称" width="190" show-overflow-tooltip />
          <el-table-column prop="source_system" label="来源系统" width="110" />
          <el-table-column prop="target_system" label="目标系统" width="110" />
          <el-table-column prop="business_doc_no" label="业务单号" width="170" show-overflow-tooltip />
          <el-table-column prop="request_url" label="请求 URL" min-width="220" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retry_count" label="重试次数" width="96" />
          <el-table-column prop="error_message" label="异常信息" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ row.error_message || '-' }}</template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" show-overflow-tooltip />
          <el-table-column label="操作" fixed="right" width="140">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button v-if="isRetryable(row)" link type="warning" @click="retryOne(row)">重试</el-button>
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
            @current-change="loadLogs"
            @size-change="loadLogs"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Mock 配置" name="configs">
        <el-alert
          class="list-alert"
          type="info"
          show-icon
          :closable="false"
          title="开启“强制失败”后，对应接口的人工重试会继续失败；关闭后重试会模拟成功并写入接口日志。"
        />

        <el-table v-loading="configLoading" :data="configRows" border stripe style="width: 100%">
          <el-table-column prop="interface_name" label="接口名称" width="220" show-overflow-tooltip />
          <el-table-column prop="target_system" label="目标系统" width="120" />
          <el-table-column prop="enabled" label="启用" width="100">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" :active-value="1" :inactive-value="0" @change="saveConfig(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="force_fail" label="强制失败" width="120">
            <template #default="{ row }">
              <el-switch v-model="row.force_fail" :active-value="1" :inactive-value="0" @change="saveConfig(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="delay_ms" label="模拟延迟(ms)" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.delay_ms" :min="0" :step="50" size="small" @change="saveConfig(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="failure_message" label="失败原因" min-width="260">
            <template #default="{ row }">
              <el-input v-model="row.failure_message" clearable @change="saveConfig(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="updated_by" label="更新人" width="100" />
          <el-table-column prop="updated_at" label="更新时间" width="170" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>

  <el-dialog v-model="detailVisible" title="接口日志详情" width="860px">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="接口名称">{{ currentRow.interface_name }}</el-descriptions-item>
      <el-descriptions-item label="业务单号">{{ currentRow.business_doc_no || '-' }}</el-descriptions-item>
      <el-descriptions-item label="来源系统">{{ currentRow.source_system }}</el-descriptions-item>
      <el-descriptions-item label="目标系统">{{ currentRow.target_system }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="statusType(currentRow.status)">{{ currentRow.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="重试次数">{{ currentRow.retry_count || 0 }}</el-descriptions-item>
      <el-descriptions-item label="请求 URL" :span="2">{{ currentRow.request_url }}</el-descriptions-item>
      <el-descriptions-item label="异常信息" :span="2">{{ currentRow.error_message || '-' }}</el-descriptions-item>
    </el-descriptions>
    <div class="payload-title">请求报文</div>
    <pre class="payload">{{ prettyJson(currentRow.request_body) }}</pre>
    <div class="payload-title">响应报文</div>
    <pre class="payload">{{ prettyJson(currentRow.response_body) }}</pre>
    <template #footer>
      <el-button @click="detailVisible = false">关闭</el-button>
      <el-button v-if="isRetryable(currentRow)" type="warning" @click="retryOne(currentRow)">重试</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { interfaceLogService, mockConfigService } from '../../api/services'

type Row = Record<string, any>

const activeTab = ref('logs')
const loading = ref(false)
const configLoading = ref(false)
const rows = ref<Row[]>([])
const configRows = ref<Row[]>([])
const selectedRows = ref<Row[]>([])
const total = ref(0)
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })
const detailVisible = ref(false)
const currentRow = ref<Row>({})

const statusOptions = ['SUCCESS', 'FAILED', 'WARNING'].map((value) => ({ label: value, value }))
const failedCount = computed(() => rows.value.filter((row) => isRetryable(row)).length)

onMounted(async () => {
  await loadLogs()
})

async function refreshCurrent() {
  if (activeTab.value === 'configs') await loadConfigs()
  else await loadLogs()
}

async function handleTabChange() {
  if (activeTab.value === 'configs' && !configRows.value.length) await loadConfigs()
}

async function loadLogs() {
  loading.value = true
  try {
    const data = await interfaceLogService.list({ ...query })
    rows.value = data.items || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

async function loadConfigs() {
  configLoading.value = true
  try {
    const data = await mockConfigService.list({ pageNum: 1, pageSize: 50 })
    configRows.value = data.items || []
  } finally {
    configLoading.value = false
  }
}

function searchLogs() {
  query.pageNum = 1
  loadLogs()
}

function resetLogs() {
  Object.keys(query).forEach((key) => {
    if (!['pageNum', 'pageSize'].includes(key)) delete query[key]
  })
  query.pageNum = 1
  loadLogs()
}

function showFailedOnly() {
  query.status = 'FAILED'
  searchLogs()
}

function openDetail(row: Row) {
  currentRow.value = row
  detailVisible.value = true
}

async function retrySelected() {
  const retryRows = selectedRows.value.filter(isRetryable)
  if (!retryRows.length) {
    ElMessage.warning('请先选择失败或警告接口日志')
    return
  }
  for (const row of retryRows) {
    await interfaceLogService.retry(Number(row.id), { operator: 'admin' })
  }
  ElMessage.success(`已触发 ${retryRows.length} 条接口日志重试`)
  await loadLogs()
}

async function retryOne(row: Row) {
  const result = await interfaceLogService.retry(Number(row.id), { operator: 'admin' })
  if (result.status === 'SUCCESS') ElMessage.success(result.message || '重试成功')
  else ElMessage.warning(result.message || '重试仍失败')
  detailVisible.value = false
  await loadLogs()
}

async function saveConfig(row: Row) {
  await mockConfigService.update(Number(row.id), {
    enabled: row.enabled,
    force_fail: row.force_fail,
    delay_ms: row.delay_ms,
    failure_message: row.failure_message,
    updatedBy: 'admin'
  })
  row.updated_by = 'admin'
  row.updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
  ElMessage.success('Mock 配置已保存')
}

function isRetryable(row: Row) {
  return ['FAILED', 'WARNING'].includes(row.status)
}

function statusType(status: string) {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'WARNING') return 'warning'
  return 'info'
}

function prettyJson(value: unknown) {
  if (!value) return '-'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  try {
    return JSON.stringify(JSON.parse(String(value)), null, 2)
  } catch {
    return String(value)
  }
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

.header-actions {
  display: flex;
  gap: 8px;
}

.query-form {
  padding-top: 4px;
}

.list-alert {
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.payload-title {
  margin: 14px 0 6px;
  font-weight: 700;
}

.payload {
  max-height: 220px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  white-space: pre-wrap;
}
</style>
