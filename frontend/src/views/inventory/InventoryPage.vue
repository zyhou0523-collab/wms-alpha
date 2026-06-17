<template>
  <AlphaListPage
    title="库存查询"
    subtitle="多仓、多库区、多状态库存统一查询；低安全库存和长库龄自动高亮"
    :columns="columns"
    :search-fields="searchFields"
    :fetcher="inventoryService.list"
    highlight-inventory
    scan-enabled
  />
</template>

<script setup lang="ts">
import AlphaListPage from '../../components/AlphaListPage.vue'
import { inventoryService } from '../../api/services'

const inventoryStatusOptions = ['QUALIFIED', 'PENDING', 'FROZEN', 'UNQUALIFIED'].map((item) => ({ label: item, value: item }))

const columns = [
  { prop: 'warehouse_code', label: '仓库编码', width: 160 },
  { prop: 'warehouse_name', label: '仓库名称', width: 170 },
  { prop: 'area_code', label: '库区', width: 120 },
  { prop: 'location_code', label: '库位', width: 130 },
  { prop: 'product_code', label: '产品编码', width: 170 },
  { prop: 'product_name', label: '产品名称', width: 170 },
  { prop: 'batch_no', label: '批次', width: 170 },
  { prop: 'inventory_status', label: '库存状态', type: 'status', width: 110 },
  { prop: 'total_qty', label: '总库存', width: 90 },
  { prop: 'available_qty', label: '可用库存', width: 100 },
  { prop: 'allocated_qty', label: '已分配', width: 90 },
  { prop: 'frozen_qty', label: '冻结', width: 80 },
  { prop: 'safety_stock', label: '安全库存', width: 100 },
  { prop: 'inbound_date', label: '入库日期', width: 120 },
  { prop: 'vmi_flag', label: 'VMI', type: 'boolean', width: 80 }
]

const searchFields = [
  { prop: 'warehouseCode', label: '仓库编码' },
  { prop: 'locationCode', label: '库位编码' },
  { prop: 'productCode', label: '产品编码' },
  { prop: 'batchNo', label: '批次' },
  { prop: 'inventoryStatus', label: '库存状态', type: 'select', options: inventoryStatusOptions }
]
</script>

