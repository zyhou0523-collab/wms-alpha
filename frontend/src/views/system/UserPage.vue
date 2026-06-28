<template>
  <AlphaListPage
    title="系统用户"
    subtitle="Alpha 版用户角色模拟，正式版将接入统一认证和 RBAC"
    :columns="columns"
    :search-fields="searchFields"
    :fetcher="userService.list"
  />
</template>

<script setup lang="ts">
import AlphaListPage from '../../components/AlphaListPage.vue'
import { userService } from '../../api/services'

const roleOptions = [
  { label: '系统管理员', value: 'ADMIN' },
  { label: '仓库管理员', value: 'WAREHOUSE_ADMIN' },
  { label: '计划人员', value: 'PLANNER' },
  { label: '物流人员', value: 'LOGISTICS' },
  { label: '售后人员', value: 'AFTERSALE' },
  { label: '管理层', value: 'MANAGER' }
]

const columns = [
  { prop: 'username', label: '账号', width: 140 },
  { prop: 'display_name', label: '姓名', width: 140 },
  { prop: 'role_code', label: '角色编码', width: 160 },
  { prop: 'role_name', label: '角色名称', width: 160 },
  { prop: 'warehouse_scope', label: '仓库范围', width: 220 },
  { prop: 'status', label: '状态', type: 'status', width: 100 },
  { prop: 'created_at', label: '创建时间', width: 180 }
]

const searchFields = [
  { prop: 'username', label: '账号' },
  { prop: 'roleCode', label: '角色', type: 'select', options: roleOptions },
  { prop: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'DISABLED' }] }
]
</script>

