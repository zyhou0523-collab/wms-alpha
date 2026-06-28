<template>
  <AlphaListPage
    title="仓库管理"
    subtitle="覆盖集团总仓、区域销售仓、售后仓、客户 VMI 仓和供应商 VMI 仓"
    :columns="columns"
    :search-fields="searchFields"
    :form-fields="formFields"
    :fetcher="warehouseService.list"
    :creator="warehouseService.create"
    :updater="warehouseService.update"
    :remover="warehouseService.remove"
  />
</template>

<script setup lang="ts">
import AlphaListPage from '../../components/AlphaListPage.vue'
import { warehouseService } from '../../api/services'

const statusOptions = [{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }]
const warehouseTypes = ['集团总仓', '区域销售仓', '第三方仓', '售后仓', '客户 VMI 仓', '供应商 VMI 仓'].map((item) => ({ label: item, value: item }))

const columns = [
  { prop: 'warehouse_code', label: '仓库编码', width: 170 },
  { prop: 'warehouse_name', label: '仓库名称', width: 180 },
  { prop: 'warehouse_type', label: '仓库类型', width: 130 },
  { prop: 'region', label: '区域', width: 100 },
  { prop: 'city', label: '城市', width: 100 },
  { prop: 'own_flag', label: '自有仓', type: 'boolean', width: 90 },
  { prop: 'vmi_flag', label: 'VMI 仓', type: 'boolean', width: 90 },
  { prop: 'status', label: '状态', type: 'status', width: 100 }
]

const searchFields = [
  { prop: 'warehouseCode', label: '仓库编码' },
  { prop: 'warehouseName', label: '仓库名称' },
  { prop: 'warehouseType', label: '仓库类型', type: 'select', options: warehouseTypes },
  { prop: 'region', label: '区域' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

const formFields = [
  { prop: 'warehouse_code', label: '仓库编码' },
  { prop: 'warehouse_name', label: '仓库名称' },
  { prop: 'warehouse_type', label: '仓库类型', type: 'select', options: warehouseTypes },
  { prop: 'region', label: '区域' },
  { prop: 'country', label: '国家' },
  { prop: 'city', label: '城市' },
  { prop: 'owner_type', label: '货主类型' },
  { prop: 'owner_code', label: '货主编码' },
  { prop: 'own_flag', label: '自有仓', type: 'switch' },
  { prop: 'vmi_flag', label: 'VMI 仓', type: 'switch' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
</script>

