<template>
  <AlphaListPage
    title="仓库管理"
    subtitle="维护真实物理仓库主数据，仓库类型仅作为属性，不作为全局仓库切换选项。"
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
const warehouseTypes = ['综合仓', '成品仓', '制造仓', '海外仓', '备件仓', 'VMI 仓'].map((item) => ({ label: item, value: item }))
const organizations = ['集团', '欧洲地区部', '东南亚地区部', '南亚地区部', '非洲地区部', '拉美地区部'].map((item) => ({ label: item, value: item }))

const columns = [
  { prop: 'warehouse_code', label: '仓库编码', width: 120 },
  { prop: 'warehouse_name', label: '仓库名称', width: 140 },
  { prop: 'organization', label: '所属组织', width: 140 },
  { prop: 'region', label: '所属地区', width: 110 },
  { prop: 'warehouse_type', label: '仓库类型', width: 110 },
  { prop: 'country', label: '国家', width: 100 },
  { prop: 'city', label: '城市', width: 110 },
  { prop: 'manager', label: '负责人', width: 110 },
  { prop: 'contact', label: '联系方式', width: 140 },
  { prop: 'status', label: '状态', type: 'status', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 170 },
  { prop: 'remark', label: '备注', minWidth: 180 }
]

const searchFields = [
  { prop: 'warehouseCode', label: '仓库编码' },
  { prop: 'warehouseName', label: '仓库名称' },
  { prop: 'organization', label: '所属组织', type: 'select', options: organizations },
  { prop: 'warehouseType', label: '仓库类型', type: 'select', options: warehouseTypes },
  { prop: 'region', label: '所属地区' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]

const formFields = [
  { prop: 'warehouse_code', label: '仓库编码' },
  { prop: 'warehouse_name', label: '仓库名称' },
  { prop: 'organization', label: '所属组织', type: 'select', options: organizations },
  { prop: 'region', label: '所属地区' },
  { prop: 'warehouse_type', label: '仓库类型', type: 'select', options: warehouseTypes },
  { prop: 'country', label: '国家' },
  { prop: 'city', label: '城市' },
  { prop: 'manager', label: '负责人' },
  { prop: 'contact', label: '联系方式' },
  { prop: 'code_prefix', label: '编码前缀' },
  { prop: 'remark', label: '备注' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
</script>
