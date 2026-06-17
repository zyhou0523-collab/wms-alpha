<template>
  <AlphaListPage
    title="SN 查询"
    subtitle="查询 SN 状态、托盘/箱绑定和出入库关联单据"
    :columns="columns"
    :search-fields="searchFields"
    :fetcher="snService.list"
    scan-enabled
  />
</template>

<script setup lang="ts">
import AlphaListPage from '../../components/AlphaListPage.vue'
import { snService } from '../../api/services'

const statusOptions = ['ISSUED', 'INBOUND', 'ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'TRACED'].map((item) => ({ label: item, value: item }))

const columns = [
  { prop: 'sn_code', label: 'SN', width: 170 },
  { prop: 'product_code', label: '产品编码', width: 170 },
  { prop: 'product_name', label: '产品名称', width: 170 },
  { prop: 'warehouse_code', label: '仓库', width: 150 },
  { prop: 'location_code', label: '库位', width: 130 },
  { prop: 'pallet_code', label: '托盘码', width: 170 },
  { prop: 'box_code', label: '箱码', width: 170 },
  { prop: 'status', label: '状态', type: 'status', width: 110 },
  { prop: 'inbound_order_no', label: '入库单', width: 160 },
  { prop: 'outbound_order_no', label: '出库单', width: 160 },
  { prop: 'sold_flag', label: '已售出', type: 'boolean', width: 90 }
]

const searchFields = [
  { prop: 'snCode', label: 'SN' },
  { prop: 'productCode', label: '产品编码' },
  { prop: 'palletCode', label: '托盘码' },
  { prop: 'boxCode', label: '箱码' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
</script>

