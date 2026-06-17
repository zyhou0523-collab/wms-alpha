<template>
  <AlphaListPage
    title="库位管理"
    subtitle="维护库位容量、冻结状态，支持打印库位码模拟"
    :columns="columns"
    :search-fields="searchFields"
    :form-fields="formFields"
    :fetcher="locationService.list"
    :creator="locationService.create"
    :updater="locationService.update"
    :remover="locationService.remove"
  />
</template>

<script setup lang="ts">
import AlphaListPage from '../../components/AlphaListPage.vue'
import { locationService } from '../../api/services'

const statusOptions = [{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }]

const columns = [
  { prop: 'location_code', label: '库位编码', width: 150 },
  { prop: 'location_name', label: '库位名称', width: 160 },
  { prop: 'warehouse_code', label: '仓库编码', width: 160 },
  { prop: 'warehouse_name', label: '仓库名称', width: 170 },
  { prop: 'area_code', label: '库区编码', width: 130 },
  { prop: 'rack_no', label: '货架', width: 80 },
  { prop: 'level_no', label: '层', width: 80 },
  { prop: 'column_no', label: '列', width: 80 },
  { prop: 'capacity', label: '容量', width: 90 },
  { prop: 'frozen_flag', label: '冻结', type: 'boolean', width: 90 },
  { prop: 'status', label: '状态', type: 'status', width: 100 }
]

const searchFields = [
  { prop: 'locationCode', label: '库位编码' },
  { prop: 'warehouseCode', label: '仓库编码' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

const formFields = [
  { prop: 'warehouse_id', label: '仓库 ID', type: 'number' },
  { prop: 'area_id', label: '库区 ID', type: 'number' },
  { prop: 'location_code', label: '库位编码' },
  { prop: 'location_name', label: '库位名称' },
  { prop: 'rack_no', label: '货架' },
  { prop: 'level_no', label: '层' },
  { prop: 'column_no', label: '列' },
  { prop: 'capacity', label: '容量', type: 'number' },
  { prop: 'frozen_flag', label: '冻结', type: 'switch' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
</script>

