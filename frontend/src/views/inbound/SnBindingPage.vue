<template>
  <el-card class="page-card sn-binding-page" shadow="never">
    <template #header>
      <div class="page-header">
        <div>
          <div class="page-title">SN 绑定</div>
          <div class="muted">集中查看入库单采集的 SN、箱码、托盘码、ASN 绑定关系；采集错误时可删除后回到预期到货通知单重新采集。</div>
        </div>
        <el-button type="primary" @click="load">刷新</el-button>
      </div>
    </template>

    <el-form :model="query" inline label-width="80px" class="query-form">
      <el-form-item label="托盘码">
        <el-input v-model="query.palletCode" clearable placeholder="PLT202606110001" />
      </el-form-item>
      <el-form-item label="ASN单号">
        <el-input v-model="query.asnNo" clearable placeholder="IN202606110001" />
      </el-form-item>
      <el-form-item label="箱码">
        <el-input v-model="query.boxCode" clearable placeholder="BOX202606110001" />
      </el-form-item>
      <el-form-item label="SN码">
        <el-input v-model="query.snCode" clearable placeholder="SN-GT3-0001" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <el-button type="danger" plain :disabled="!selectedIds.length" @click="bulkDelete">批量删除</el-button>
      <el-button @click="exportRows">导出</el-button>
      <span class="muted">已选择 {{ selectedIds.length }} 条</span>
    </div>

    <el-table v-loading="loading" :data="rows" border stripe style="width: 100%" @selection-change="onSelectionChange">
      <el-table-column type="selection" width="46" />
      <el-table-column type="index" label="序号" width="64" />
      <el-table-column prop="sn_code" label="SN码" min-width="180" show-overflow-tooltip />
      <el-table-column prop="box_code" label="箱码" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.box_code || '-' }}</template>
      </el-table-column>
      <el-table-column prop="pallet_code" label="托盘码" min-width="170" show-overflow-tooltip />
      <el-table-column prop="inbound_order_no" label="ASN单号" min-width="170" show-overflow-tooltip />
      <el-table-column prop="line_no" label="行号" width="90">
        <template #default="{ row }">{{ row.line_no || row.lineNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="product_code" label="产品编码" min-width="170" show-overflow-tooltip />
      <el-table-column prop="bind_time" label="绑定时间" width="170" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="100">
        <template #default="{ row }">
          <el-popconfirm title="确认删除该 SN 绑定关系？" @confirm="removeRow(row)">
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
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { snBindingService } from '../../api/services'
import { downloadTextFile } from '../../utils/fileTransfer'

type Row = Record<string, any>

const loading = ref(false)
const rows = ref<Row[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })

onMounted(load)

async function load() {
  loading.value = true
  try {
    const data = await snBindingService.list({ ...query })
    rows.value = data.items || []
    total.value = data.total || 0
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
  selectedIds.value = []
  query.pageNum = 1
  load()
}

function onSelectionChange(selection: Row[]) {
  selectedIds.value = selection.map((row) => Number(row.id))
}

async function removeRow(row: Row) {
  await snBindingService.remove(Number(row.id))
  ElMessage.success('绑定关系已删除，可回到预期到货通知单重新采集')
  await load()
}

async function bulkDelete() {
  await snBindingService.bulkRemove(selectedIds.value)
  ElMessage.success('选中绑定关系已删除')
  selectedIds.value = []
  await load()
}

async function exportRows() {
  downloadTextFile(await snBindingService.exportData({ ...query }))
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
</style>
