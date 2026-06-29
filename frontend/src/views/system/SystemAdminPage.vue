<template>
  <div class="system-page">
    <aside v-if="activeConfig.sideTree" class="system-side">
      <div class="side-title">{{ activeConfig.sideTree.title }}</div>
      <el-input v-model="sideKeyword" clearable placeholder="筛选节点" class="side-filter" />
      <el-tree
        :data="filteredSideTree"
        node-key="id"
        default-expand-all
        highlight-current
        :props="{ label: 'label', children: 'children' }"
        @node-click="handleSideNodeClick"
      />
    </aside>

    <el-card class="system-card" shadow="never">
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">{{ activeConfig.title }}</div>
            <div class="muted">{{ activeConfig.subtitle }}</div>
          </div>
          <el-button type="primary" @click="load">刷新</el-button>
        </div>
      </template>

      <el-form :model="query" inline label-width="88px" class="query-form">
        <el-form-item v-for="field in activeConfig.searchFields" :key="field.prop" :label="field.label">
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
        <el-button v-if="!activeConfig.readonly" type="primary" @click="openAdd">新增</el-button>
        <el-button v-if="!activeConfig.readonly" :disabled="!selectedRows.length" @click="openBatchNotice">批量操作</el-button>
        <el-button @click="exportRows">导出</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="rows"
        border
        stripe
        style="width: 100%"
        @selection-change="selectedRows = $event"
      >
        <el-table-column type="selection" width="42" />
        <el-table-column
          v-for="column in activeConfig.columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tag v-if="column.type === 'status'" :type="statusType(row[column.prop])" effect="light">
              {{ statusLabel(row[column.prop]) }}
            </el-tag>
            <el-tag v-else-if="column.type === 'switch'" :type="Number(row[column.prop]) === 1 ? 'success' : 'info'" effect="light">
              {{ Number(row[column.prop]) === 1 ? '是' : '否' }}
            </el-tag>
            <span v-else>{{ row[column.prop] ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button link type="primary" @click="openView(row)">查看</el-button>
            <el-button v-if="!activeConfig.readonly" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="activeConfig.key === 'roles'" link type="primary" @click="openMenuAssign(row)">分配菜单</el-button>
            <el-button v-if="activeConfig.key === 'users'" link type="primary" @click="openRoleAssign(row)">分配角色</el-button>
            <el-button v-if="activeConfig.key === 'users'" link type="warning" @click="resetUserPassword(row)">重置密码</el-button>
            <el-popconfirm v-if="!activeConfig.readonly" title="确认删除该记录？" @confirm="removeRow(row)">
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
          :page-sizes="[10, 20, 50, 100]"
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </el-card>
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="860px">
    <el-descriptions v-if="dialogMode === 'view'" :column="2" border>
      <el-descriptions-item v-for="column in activeConfig.columns" :key="column.prop" :label="column.label">
        {{ currentRow[column.prop] ?? '-' }}
      </el-descriptions-item>
    </el-descriptions>
    <el-form v-else :model="form" label-width="120px">
      <el-row :gutter="12">
        <el-col v-for="field in activeConfig.formFields" :key="field.prop" :span="field.span || 12">
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
            <el-input v-else-if="field.type === 'textarea'" v-model="form[field.prop]" type="textarea" :rows="4" />
            <el-input v-else-if="field.type === 'password'" v-model="form[field.prop]" type="password" show-password />
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

  <el-dialog v-model="menuAssignVisible" title="分配菜单权限" width="640px">
    <el-alert type="info" show-icon :closable="false" title="目录、菜单、按钮权限会一起保存到角色菜单关系中。" />
    <el-tree
      ref="menuTreeRef"
      class="assign-tree"
      :data="menuTree"
      node-key="id"
      show-checkbox
      default-expand-all
      :props="{ label: 'label', children: 'children' }"
    />
    <template #footer>
      <el-button @click="menuAssignVisible = false">取消</el-button>
      <el-button type="primary" @click="saveMenuAssign">保存</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="roleAssignVisible" title="分配用户角色" width="560px">
    <el-checkbox-group v-model="checkedRoleIds" class="role-checks">
      <el-checkbox v-for="role in roleRows" :key="role.id" :label="role.id">
        {{ role.role_name }}（{{ role.role_code }}）
      </el-checkbox>
    </el-checkbox-group>
    <template #footer>
      <el-button @click="roleAssignVisible = false">取消</el-button>
      <el-button type="primary" @click="saveRoleAssign">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { systemService } from '../../api/services'

interface OptionItem {
  label: string
  value: string | number
}

interface FieldConfig {
  prop: string
  label: string
  type?: 'text' | 'select' | 'switch' | 'number' | 'textarea' | 'password'
  options?: OptionItem[]
  span?: number
}

interface ColumnConfig {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  type?: 'status' | 'switch'
}

interface PageConfig {
  key: string
  resource: string
  title: string
  subtitle: string
  columns: ColumnConfig[]
  searchFields: FieldConfig[]
  formFields: FieldConfig[]
  readonly?: boolean
  sideTree?: { title: string; resource: string; labelProp: string }
}

type Row = Record<string, any>

const route = useRoute()
const statusOptions = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' }
]
const publishOptions = [
  { label: '已发布', value: 'PUBLISHED' },
  { label: '草稿', value: 'DRAFT' },
  { label: '停用', value: 'DISABLED' }
]
const roleOptions = [
  { label: '系统管理员', value: 'ADMIN' },
  { label: 'WMS 主管', value: 'WMS_MANAGER' },
  { label: '入库操作员', value: 'INBOUND_OPERATOR' },
  { label: '出库发运员', value: 'OUTBOUND_OPERATOR' },
  { label: '库存管理员', value: 'INVENTORY_ADMIN' },
  { label: '主数据管理员', value: 'MASTER_DATA_ADMIN' },
  { label: '接口管理员', value: 'INTERFACE_ADMIN' },
  { label: '货主查看员', value: 'OWNER_VIEWER' }
]
const deptOptions = [
  { label: '集团总部', value: 1 },
  { label: '供应链运营部', value: 2 },
  { label: '入库作业组', value: 3 },
  { label: '出库发运组', value: 4 },
  { label: '库存管理组', value: 5 },
  { label: '信息系统部', value: 6 }
]
const postOptions = [
  { label: '系统管理员', value: 1 },
  { label: 'WMS 主管', value: 2 },
  { label: '入库操作员', value: 3 },
  { label: '出库操作员', value: 4 },
  { label: '库存操作员', value: 5 },
  { label: '主数据维护员', value: 6 }
]
const menuTypeOptions = [
  { label: '目录', value: 'DIR' },
  { label: '菜单', value: 'MENU' },
  { label: '按钮', value: 'BUTTON' }
]
const dataScopeOptions = [
  { label: '全部数据', value: 'ALL' },
  { label: '全部仓库', value: 'ALL_WAREHOUSE' },
  { label: '自定义仓库/货主', value: 'CUSTOM' },
  { label: '指定货主', value: 'OWNER' }
]

const configs: Record<string, PageConfig> = {
  users: {
    key: 'users',
    resource: 'users',
    title: '用户管理',
    subtitle: '维护 WMS 用户、角色、部门、岗位、仓库范围和货主范围。',
    sideTree: { title: '部门组织', resource: 'depts', labelProp: 'dept_name' },
    searchFields: [
      { prop: 'username', label: '用户名称' },
      { prop: 'roleCode', label: '角色', type: 'select', options: roleOptions },
      { prop: 'deptName', label: '部门' },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions }
    ],
    columns: [
      { prop: 'username', label: '账号', width: 130 },
      { prop: 'display_name', label: '姓名', width: 130 },
      { prop: 'dept_name', label: '部门', width: 150 },
      { prop: 'post_name', label: '岗位', width: 150 },
      { prop: 'role_name', label: '角色', width: 150 },
      { prop: 'warehouse_scope', label: '仓库范围', minWidth: 220 },
      { prop: 'owner_scope', label: '货主范围', width: 150 },
      { prop: 'status', label: '状态', type: 'status', width: 100 },
      { prop: 'updated_at', label: '更新时间', width: 170 }
    ],
    formFields: [
      { prop: 'username', label: '账号' },
      { prop: 'password', label: '初始密码', type: 'password' },
      { prop: 'display_name', label: '姓名' },
      { prop: 'nickname', label: '昵称' },
      { prop: 'dept_id', label: '部门', type: 'select', options: deptOptions },
      { prop: 'post_id', label: '岗位', type: 'select', options: postOptions },
      { prop: 'role_code', label: '主角色', type: 'select', options: roleOptions },
      { prop: 'warehouse_scope', label: '仓库范围' },
      { prop: 'owner_scope', label: '货主范围' },
      { prop: 'default_warehouse_code', label: '默认仓库' },
      { prop: 'default_owner_code', label: '默认货主' },
      { prop: 'mobile', label: '手机号' },
      { prop: 'email', label: '邮箱' },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions },
      { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
    ]
  },
  roles: {
    key: 'roles',
    resource: 'roles',
    title: '角色管理',
    subtitle: '维护角色、菜单权限、仓库范围、货主范围和数据权限策略。',
    searchFields: [
      { prop: 'keyword', label: '角色名称' },
      { prop: 'roleCode', label: '角色编码' },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions }
    ],
    columns: [
      { prop: 'role_code', label: '角色编码', width: 170 },
      { prop: 'role_name', label: '角色名称', width: 170 },
      { prop: 'data_scope', label: '数据范围', width: 150 },
      { prop: 'warehouse_scope', label: '仓库范围', minWidth: 220 },
      { prop: 'owner_scope', label: '货主范围', width: 160 },
      { prop: 'status', label: '状态', type: 'status', width: 100 },
      { prop: 'updated_at', label: '更新时间', width: 170 }
    ],
    formFields: [
      { prop: 'role_code', label: '角色编码' },
      { prop: 'role_name', label: '角色名称' },
      { prop: 'role_sort', label: '排序', type: 'number' },
      { prop: 'data_scope', label: '数据范围', type: 'select', options: dataScopeOptions },
      { prop: 'warehouse_scope', label: '仓库范围' },
      { prop: 'owner_scope', label: '货主范围' },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions },
      { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
    ]
  },
  menus: {
    key: 'menus',
    resource: 'menus',
    title: '菜单管理',
    subtitle: '维护目录、菜单、按钮权限，与当前 WMS 菜单保持一致。',
    sideTree: { title: '菜单树', resource: 'menus', labelProp: 'menu_name' },
    searchFields: [
      { prop: 'menuName', label: '菜单名称' },
      { prop: 'menuType', label: '菜单类型', type: 'select', options: menuTypeOptions },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions }
    ],
    columns: [
      { prop: 'menu_name', label: '菜单名称', width: 180 },
      { prop: 'menu_type', label: '类型', width: 90 },
      { prop: 'path', label: '路由地址', minWidth: 220 },
      { prop: 'perms', label: '权限标识', minWidth: 220 },
      { prop: 'order_num', label: '排序', width: 80 },
      { prop: 'visible', label: '显示', type: 'switch', width: 90 },
      { prop: 'status', label: '状态', type: 'status', width: 100 }
    ],
    formFields: [
      { prop: 'parent_id', label: '上级菜单 ID', type: 'number' },
      { prop: 'menu_name', label: '菜单名称' },
      { prop: 'menu_type', label: '菜单类型', type: 'select', options: menuTypeOptions },
      { prop: 'path', label: '路由地址' },
      { prop: 'component', label: '组件路径' },
      { prop: 'perms', label: '权限标识' },
      { prop: 'icon', label: '图标' },
      { prop: 'order_num', label: '排序', type: 'number' },
      { prop: 'visible', label: '是否显示', type: 'switch' },
      { prop: 'status', label: '状态', type: 'select', options: statusOptions }
    ]
  },
  depts: simpleConfig('depts', '部门管理', '维护组织部门，供用户和数据权限引用。', [
    ['dept_code', '部门编码', 140],
    ['dept_name', '部门名称', 180],
    ['leader', '负责人', 120],
    ['phone', '联系电话', 140],
    ['order_num', '排序', 80],
    ['status', '状态', 100, 'status']
  ], [
    { prop: 'deptName', label: '部门名称' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ], [
    { prop: 'parent_id', label: '上级部门 ID', type: 'number' },
    { prop: 'dept_code', label: '部门编码' },
    { prop: 'dept_name', label: '部门名称' },
    { prop: 'leader', label: '负责人' },
    { prop: 'phone', label: '联系电话' },
    { prop: 'email', label: '邮箱' },
    { prop: 'order_num', label: '排序', type: 'number' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ]),
  posts: simpleConfig('posts', '岗位管理', '维护系统岗位，支持用户主档绑定。', [
    ['post_code', '岗位编码', 160],
    ['post_name', '岗位名称', 180],
    ['post_sort', '排序', 90],
    ['status', '状态', 100, 'status'],
    ['remark', '备注', 240]
  ], [
    { prop: 'postName', label: '岗位名称' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ], [
    { prop: 'post_code', label: '岗位编码' },
    { prop: 'post_name', label: '岗位名称' },
    { prop: 'post_sort', label: '排序', type: 'number' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
  ]),
  dict: simpleConfig('dict', '字典管理', '维护 WMS 状态、类型、SAP 回传等枚举字典。', [
    ['dict_name', '字典名称', 180],
    ['dict_type', '字典类型', 220],
    ['status', '状态', 100, 'status'],
    ['remark', '备注', 260],
    ['updated_at', '更新时间', 170]
  ], [
    { prop: 'dictType', label: '字典类型' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ], [
    { prop: 'dict_name', label: '字典名称' },
    { prop: 'dict_type', label: '字典类型' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
  ], 'dict-types'),
  config: simpleConfig('config', '参数设置', '维护系统名称、默认仓库、默认货主、Mock 开关等参数。', [
    ['config_name', '参数名称', 180],
    ['config_key', '参数键名', 240],
    ['config_value', '参数键值', 220],
    ['config_type', '系统内置', 100],
    ['status', '状态', 100, 'status']
  ], [
    { prop: 'configKey', label: '参数键名' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ], [
    { prop: 'config_name', label: '参数名称' },
    { prop: 'config_key', label: '参数键名' },
    { prop: 'config_value', label: '参数键值' },
    { prop: 'config_type', label: '系统内置', type: 'select', options: [{ label: '是', value: 'Y' }, { label: '否', value: 'N' }] },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
  ], 'configs'),
  notice: simpleConfig('notice', '通知公告', '发布系统公告、演示提醒和作业通知。', [
    ['notice_title', '公告标题', 240],
    ['notice_type', '公告类型', 120],
    ['status', '状态', 100, 'status'],
    ['created_by', '创建人', 120],
    ['created_at', '创建时间', 170]
  ], [
    { prop: 'noticeTitle', label: '公告标题' },
    { prop: 'noticeType', label: '公告类型' },
    { prop: 'status', label: '状态', type: 'select', options: publishOptions }
  ], [
    { prop: 'notice_title', label: '公告标题', span: 24 },
    { prop: 'notice_type', label: '公告类型', type: 'select', options: [{ label: '通知', value: 'NOTICE' }, { label: '公告', value: 'ANNOUNCEMENT' }] },
    { prop: 'status', label: '状态', type: 'select', options: publishOptions },
    { prop: 'notice_content', label: '公告内容', type: 'textarea', span: 24 },
    { prop: 'created_by', label: '创建人' }
  ], 'notices'),
  operlog: readonlyConfig('operlog', '操作日志', '查询 WMS 核心动作和系统管理操作记录。', 'operlogs', [
    ['module', '模块', 120],
    ['business_doc_no', '业务单号', 180],
    ['action', '操作类型', 180],
    ['operator', '操作人', 120],
    ['result', '结果', 100, 'status'],
    ['message', '操作说明', 260],
    ['created_at', '操作时间', 170]
  ], [
    { prop: 'module', label: '模块' },
    { prop: 'operator', label: '操作人' },
    { prop: 'result', label: '结果', type: 'select', options: [{ label: '成功', value: 'SUCCESS' }, { label: '失败', value: 'FAILED' }] }
  ]),
  loginlog: readonlyConfig('loginlog', '登录日志', '查询用户登录成功、失败和终端信息。', 'loginlogs', [
    ['username', '用户账号', 140],
    ['ipaddr', '登录 IP', 140],
    ['login_location', '登录地点', 180],
    ['browser', '浏览器', 120],
    ['os', '操作系统', 120],
    ['status', '状态', 100, 'status'],
    ['message', '消息', 220],
    ['login_time', '登录时间', 170]
  ], [
    { prop: 'username', label: '用户账号' },
    { prop: 'status', label: '状态', type: 'select', options: [{ label: '成功', value: 'SUCCESS' }, { label: '失败', value: 'FAILED' }] }
  ]),
  field: simpleConfig('field', '字段管理', '按页面维护字段显示、必填、可编辑和角色可见范围。', [
    ['page_code', '页面编码', 180],
    ['page_name', '页面名称', 180],
    ['field_code', '字段编码', 180],
    ['field_name', '字段名称', 160],
    ['field_type', '字段类型', 110],
    ['visible', '显示', 90, 'switch'],
    ['required', '必填', 90, 'switch'],
    ['editable', '可编辑', 90, 'switch'],
    ['role_codes', '角色范围', 240]
  ], [
    { prop: 'pageCode', label: '页面编码' },
    { prop: 'fieldName', label: '字段名称' }
  ], [
    { prop: 'page_code', label: '页面编码' },
    { prop: 'page_name', label: '页面名称' },
    { prop: 'field_code', label: '字段编码' },
    { prop: 'field_name', label: '字段名称' },
    { prop: 'field_type', label: '字段类型' },
    { prop: 'visible', label: '显示', type: 'switch' },
    { prop: 'required', label: '必填', type: 'switch' },
    { prop: 'editable', label: '可编辑', type: 'switch' },
    { prop: 'order_num', label: '排序', type: 'number' },
    { prop: 'role_codes', label: '角色范围', span: 24 },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
  ], 'fields'),
  'data-scope': simpleConfig('data-scope', '数据权限', '维护部门、仓库、货主维度的数据访问范围。', [
    ['scope_code', '范围编码', 170],
    ['scope_name', '范围名称', 200],
    ['role_name', '适用角色', 150],
    ['scope_type', '范围类型', 150],
    ['warehouse_codes', '仓库范围', 260],
    ['owner_codes', '货主范围', 180],
    ['status', '状态', 100, 'status']
  ], [
    { prop: 'roleCode', label: '角色', type: 'select', options: roleOptions },
    { prop: 'scopeType', label: '范围类型', type: 'select', options: dataScopeOptions },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions }
  ], [
    { prop: 'scope_code', label: '范围编码' },
    { prop: 'scope_name', label: '范围名称' },
    { prop: 'role_code', label: '角色编码', type: 'select', options: roleOptions },
    { prop: 'role_name', label: '角色名称' },
    { prop: 'scope_type', label: '范围类型', type: 'select', options: dataScopeOptions },
    { prop: 'dept_codes', label: '部门范围' },
    { prop: 'warehouse_codes', label: '仓库范围', span: 24 },
    { prop: 'owner_codes', label: '货主范围' },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
    { prop: 'remark', label: '备注', type: 'textarea', span: 24 }
  ], 'data-scopes'),
  'interface-log': readonlyConfig('interface-log', '接口日志', '从系统管理入口查看 SAP、追溯、MES、履约等外部回传日志。', 'interface-log', [
    ['interface_name', '接口名称', 190],
    ['source_system', '来源系统', 120],
    ['target_system', '目标系统', 120],
    ['business_doc_no', '业务单号', 180],
    ['status', '状态', 100, 'status'],
    ['retry_count', '重试次数', 100],
    ['error_message', '失败原因', 260],
    ['created_at', '请求时间', 170]
  ], [
    { prop: 'interfaceName', label: '接口名称' },
    { prop: 'targetSystem', label: '目标系统' },
    { prop: 'status', label: '状态', type: 'select', options: [{ label: '成功', value: 'SUCCESS' }, { label: '失败', value: 'FAILED' }] }
  ])
}

const activeConfig = computed(() => configs[String(route.meta.systemPage || 'users')] || configs.users)
const loading = ref(false)
const rows = ref<Row[]>([])
const selectedRows = ref<Row[]>([])
const total = ref(0)
const query = reactive<Row>({ pageNum: 1, pageSize: 10 })
const form = reactive<Row>({})
const currentRow = ref<Row>({})
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('view')
const sideRows = ref<Row[]>([])
const sideKeyword = ref('')
const menuTree = ref<Row[]>([])
const menuTreeRef = ref<any>()
const menuAssignVisible = ref(false)
const roleAssignVisible = ref(false)
const roleRows = ref<Row[]>([])
const checkedRoleIds = ref<number[]>([])
const assignTarget = ref<Row>({})

const dialogTitle = computed(() => {
  if (dialogMode.value === 'add') return `新增${activeConfig.value.title}`
  if (dialogMode.value === 'edit') return `编辑${activeConfig.value.title}`
  return `查看${activeConfig.value.title}`
})

const filteredSideTree = computed(() => {
  if (!sideKeyword.value) return buildTree(sideRows.value, activeConfig.value.sideTree?.labelProp || 'label')
  return buildTree(sideRows.value.filter((row) => String(row[activeConfig.value.sideTree?.labelProp || 'label']).includes(sideKeyword.value)), activeConfig.value.sideTree?.labelProp || 'label')
})

onMounted(load)

watch(() => route.fullPath, async () => {
  resetQueryOnly()
  await load()
})

async function load() {
  loading.value = true
  try {
    if (activeConfig.value.sideTree) await loadSideRows()
    const data = await systemService.list(activeConfig.value.resource, { ...query })
    rows.value = data.items
    total.value = data.total
    selectedRows.value = []
  } finally {
    loading.value = false
  }
}

async function loadSideRows() {
  const side = activeConfig.value.sideTree
  if (!side) return
  const data = await systemService.list(side.resource, { pageNum: 1, pageSize: 100 })
  sideRows.value = data.items
}

function search() {
  query.pageNum = 1
  load()
}

function reset() {
  resetQueryOnly()
  load()
}

function resetQueryOnly() {
  Object.keys(query).forEach((key) => {
    if (!['pageNum', 'pageSize'].includes(key)) delete query[key]
  })
  query.pageNum = 1
  query.pageSize ||= 10
}

function openAdd() {
  Object.keys(form).forEach((key) => delete form[key])
  activeConfig.value.formFields.forEach((field) => {
    if (field.type === 'switch') form[field.prop] = 1
    if (field.prop === 'status') form[field.prop] = 'ACTIVE'
  })
  dialogMode.value = 'add'
  dialogVisible.value = true
}

function openEdit(row: Row) {
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, row)
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

function openView(row: Row) {
  currentRow.value = row
  dialogMode.value = 'view'
  dialogVisible.value = true
}

async function save() {
  if (dialogMode.value === 'add') {
    await systemService.create(activeConfig.value.resource, { ...form })
    ElMessage.success('新增成功')
  } else if (form.id) {
    await systemService.update(activeConfig.value.resource, Number(form.id), { ...form })
    ElMessage.success('保存成功')
  }
  dialogVisible.value = false
  await load()
}

async function removeRow(row: Row) {
  await systemService.remove(activeConfig.value.resource, Number(row.id))
  ElMessage.success('删除成功')
  await load()
}

async function resetUserPassword(row: Row) {
  await systemService.resetPassword(Number(row.id))
  ElMessage.success('密码已重置为 123456')
}

async function openRoleAssign(row: Row) {
  assignTarget.value = row
  const [roles, assigned] = await Promise.all([
    systemService.list('roles', { pageNum: 1, pageSize: 100 }),
    systemService.userRoles(Number(row.id))
  ])
  roleRows.value = roles.items
  checkedRoleIds.value = assigned.map((item) => Number(item.id))
  roleAssignVisible.value = true
}

async function saveRoleAssign() {
  await systemService.saveUserRoles(Number(assignTarget.value.id), checkedRoleIds.value)
  ElMessage.success('角色分配已保存')
  roleAssignVisible.value = false
}

async function openMenuAssign(row: Row) {
  assignTarget.value = row
  const [menus, checkedKeys] = await Promise.all([
    systemService.menuTree(),
    systemService.roleMenus(Number(row.id))
  ])
  menuTree.value = buildTree(menus, 'menu_name')
  menuAssignVisible.value = true
  await nextTick()
  menuTreeRef.value?.setCheckedKeys(checkedKeys)
}

async function saveMenuAssign() {
  const checked = menuTreeRef.value?.getCheckedKeys(false) || []
  const halfChecked = menuTreeRef.value?.getHalfCheckedKeys?.() || []
  const menuIds = Array.from(new Set([...checked, ...halfChecked])).map(Number)
  await systemService.saveRoleMenus(Number(assignTarget.value.id), menuIds)
  ElMessage.success('菜单权限已保存')
  menuAssignVisible.value = false
}

function exportRows() {
  ElMessage.success('当前列表导出已在 Alpha 原型中模拟完成')
}

function openBatchNotice() {
  ElMessage.info(`已选择 ${selectedRows.value.length} 条记录，Alpha 版本保留批量入口`)
}

function handleSideNodeClick(node: Row) {
  if (activeConfig.value.key === 'users') {
    query.deptName = node.dept_name
  } else if (activeConfig.value.key === 'menus') {
    query.menuName = node.menu_name
  }
  search()
}

function buildTree(sourceRows: Row[], labelProp: string) {
  const map = new Map<number, Row>()
  const roots: Row[] = []
  sourceRows.forEach((row) => {
    map.set(Number(row.id), { ...row, label: row[labelProp] || row.menu_name || row.dept_name || row.id, children: [] })
  })
  map.forEach((node) => {
    const parentId = Number(node.parent_id || 0)
    if (parentId && map.has(parentId)) map.get(parentId)?.children.push(node)
    else roots.push(node)
  })
  return roots
}

function statusType(value: unknown) {
  const status = String(value || '')
  if (['ACTIVE', 'SUCCESS', 'PUBLISHED'].includes(status)) return 'success'
  if (['DISABLED', 'FAILED'].includes(status)) return 'danger'
  if (['DRAFT', 'WARNING'].includes(status)) return 'warning'
  return 'info'
}

function statusLabel(value: unknown) {
  const status = String(value || '')
  const map: Record<string, string> = {
    ACTIVE: '启用',
    DISABLED: '停用',
    SUCCESS: '成功',
    FAILED: '失败',
    PUBLISHED: '已发布',
    DRAFT: '草稿'
  }
  return map[status] || status || '-'
}

function simpleConfig(
  key: string,
  title: string,
  subtitle: string,
  columnRows: Array<[string, string, number?, string?]>,
  searchFields: FieldConfig[],
  formFields: FieldConfig[],
  resource = key
): PageConfig {
  return {
    key,
    resource,
    title,
    subtitle,
    searchFields,
    columns: columnRows.map(([prop, label, width, type]) => ({ prop, label, width, type: type as any })),
    formFields
  }
}

function readonlyConfig(
  key: string,
  title: string,
  subtitle: string,
  resource: string,
  columnRows: Array<[string, string, number?, string?]>,
  searchFields: FieldConfig[]
): PageConfig {
  return {
    ...simpleConfig(key, title, subtitle, columnRows, searchFields, [], resource),
    readonly: true
  }
}
</script>

<style scoped>
.system-page {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: 14px;
}

.system-page:not(:has(.system-side)) {
  display: block;
}

.system-side,
.system-card {
  border-radius: 8px;
}

.system-side {
  background: #fff;
  border: 1px solid var(--wms-border);
  padding: 12px;
  min-height: calc(100vh - 96px);
}

.side-title {
  font-weight: 700;
  margin-bottom: 10px;
}

.side-filter {
  margin-bottom: 10px;
}

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
  padding-top: 2px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.assign-tree {
  margin-top: 12px;
  border: 1px solid var(--wms-border);
  border-radius: 6px;
  padding: 10px;
  max-height: 420px;
  overflow: auto;
}

.role-checks {
  display: grid;
  gap: 10px;
}

@media (max-width: 1100px) {
  .system-page {
    grid-template-columns: 1fr;
  }

  .system-side {
    min-height: auto;
  }
}
</style>
