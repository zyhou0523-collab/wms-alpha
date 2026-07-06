# WMS 当前功能清单

## 一、功能总览

当前 WMS 独立版定位为新能源制造业成品仓储 PC 端原型系统，覆盖从基础资料、仓库配置、入库、出库、库存、报表到系统管理的主要演示链路。系统可在前端 mock 模式下独立演示，也可连接 Spring Boot 后端和 MySQL 演示。

## 二、一级菜单与页面

| 一级菜单 | 页面 | 路由 | 说明 |
|---|---|---|---|
| 数据驾驶舱 | 数据驾驶舱 | `/dashboard` | 库存 KPI、地图、趋势、预警 |
| 工作台 | 我的工作台 | `/dashboard/workbench` | 待办、快捷入口、库存查询入口 |
| 基础数据 | 产品主数据 | `/masterdata/products` | 产品、SN 管理、安全库存、库龄字段 |
| 基础数据 | 客户主数据 | `/masterdata/customers` | 客户、供应商、货主类主数据演示 |
| 仓库设置 | 仓库管理 | `/warehouse/warehouses` | 仓库编码、类型、区域、状态 |
| 仓库设置 | 库位管理 | `/warehouse/locations` | 库区、库位、容量、冻结标识 |
| 入库管理 | 预期到货通知单 | `/inbound/arrival-notices` | 创建、SN 采集、收货、关闭、SAP 回传 |
| 入库管理 | 预期到货通知单详情 | `/inbound/arrival-notices/:id` | 单据头、明细、SN、收货记录、日志 |
| 入库管理 | SN 绑定 | `/inbound/sn-bindings` | 托盘/箱/SN 绑定查询与维护 |
| 出库管理 | 发运订单 | `/outbound/shipping-orders` | 发运订单、分配、拣货、发货、关闭、SAP 回传 |
| 出库管理 | 条码打印 | `/outbound/code-print` | 条码/标签打印演示 |
| 库存管理 | 库存查询 | `/inventory/list` | 库存、货主、库位、质量状态查询 |
| 库存管理 | SN 查询 | `/inventory/sn` | SN 状态、锁定、入库/出库关联 |
| 库存管理 | 库存盘点 | `/inventory/count` | 创建盘点、记录、差异确认、调整 |
| 库存管理 | 库存移动 | `/inventory/move` | 库位移动、托盘变更、移动确认 |
| 报表中心 | 进出存报表 | `/reports/inout-stock` | 库存收发存统计 |
| 报表中心 | 入库日报表 | `/reports/inbound-daily` | 入库维度日报 |
| 报表中心 | 出库日报表 | `/reports/outbound-daily` | 出库维度日报 |
| 报表中心 | 标准库龄报表 | `/reports/standard-aging` | 标准库龄统计 |
| 报表中心 | 分段库龄报表 | `/reports/segment-aging` | 分段库龄统计 |
| 报表中心 | 出库 SN 报表 | `/reports/outbound-sn` | 出库 SN 明细 |
| 报表中心 | 入库 SN 报表 | `/reports/inbound-sn` | 入库 SN 明细 |
| 接口中心 | 接口日志 | `/interface/logs` | SAP/MES/Fulfillment/Trace 调用记录 |
| 系统管理 | 用户管理 | `/system/users` | 用户、角色分配、重置密码 |
| 系统管理 | 角色管理 | `/system/roles` | 角色、菜单权限、数据范围 |
| 系统管理 | 菜单管理 | `/system/menus` | 菜单、按钮权限配置演示 |
| 系统管理 | 部门管理 | `/system/depts` | 组织结构 |
| 系统管理 | 岗位管理 | `/system/posts` | 岗位字典 |
| 系统管理 | 字典管理 | `/system/dict` | 订单状态、SAP 状态等字典 |
| 系统管理 | 参数设置 | `/system/config` | 系统参数 |
| 系统管理 | 通知公告 | `/system/notice` | 公告维护 |
| 系统管理 | 操作日志 | `/system/operlog` | 业务操作日志 |
| 系统管理 | 登录日志 | `/system/loginlog` | 登录审计 |
| 系统管理 | 字段管理 | `/system/field` | 页面字段配置演示 |
| 系统管理 | 数据权限 | `/system/data-scope` | 仓库/货主授权 |

## 三、入库管理能力

### 1. 页面按钮

| 页面 | 主要按钮 |
|---|---|
| 预期到货通知单列表 | 查询、重置、新建、编辑、采集 SN、收货、取消、关闭、回传 SAP、重传 SAP、导入、导出、模板下载 |
| 预期到货通知单详情 | 编辑、采集 SN、收货、关闭、回传 SAP、返回 |
| SN 绑定 | 查询、删除、批量删除、导出 |

### 2. 业务流程

1. 创建预期到货通知单。
2. 对 SN 管理产品执行 SN 采集。
3. 执行收货确认，形成收货批次和收货明细。
4. 支持取消收货。
5. 支持部分收货或完全收货后关闭单据。
6. 部分收货关闭时可选择生成剩余分单。
7. SAP 入库回传与订单关闭保持独立。

### 3. 核心状态

- 订单主状态：`CREATED`、`PARTIAL_RECEIVED`、`RECEIVED`、`ON_SHELF`、`CLOSED`、`CANCELED`。
- SAP 状态：`NOT_POSTED`、`SUCCESS`、`FAILED`。
- 兼容状态：`RECEIVING`、`BOUND`、`SAP_FAILED`。

### 4. 核心字段

- 表头：`order_no`、`source_order_no`、`mes_work_order_no`、`inbound_type`、`warehouse_id`、`owner_code`、`sap_plant`、`planned_qty`、`received_qty`、`status`、`sap_post_status`、`split_from_order_no`。
- 明细：`line_no`、`product_id`、`planned_qty`、`received_qty`、`shelved_qty`、`batch_no`、`sap_storage_location`、`status`。
- 收货：`receipt_no`、`receipt_time`、`receipt_user`、`sap_post_status`、`sap_material_doc_no`。

## 四、出库管理能力

### 1. 页面按钮

| 页面 | 主要按钮 |
|---|---|
| 发运订单列表 | 查询、重置、新建、分配库存、拣货、发货、取消分配、取消拣货、取消发货、关闭、取消、回传 SAP、重传 SAP、导入、导出 |
| 发运订单详情 | 分配、拣货、发货、关闭、回传 SAP、查看明细、查看日志 |
| 条码打印 | 条码查询、打印记录演示 |

### 2. 业务流程

1. 创建发运订单。
2. 按 FIFO 或人工指定方式分配库存。
3. 生成拣货任务并执行拣货。
4. 执行发货确认并扣减库存。
5. 支持取消分配、取消拣货、取消发货。
6. 完全发运订单关闭时直接关闭，不提示生成分单。
7. 部分发运订单关闭时可选择生成剩余分单。
8. 关闭后触发 SAP 出库回传，失败时保留重传入口。

### 3. 核心状态

- 订单主状态：`CREATED`、`PARTIAL_ALLOCATED`、`ALLOCATED`、`PARTIAL_PICKED`、`PICKED`、`PARTIAL_SHIPPED`、`SHIPPED`、`CLOSED`、`CANCELED`。
- 兼容状态：`PENDING_ALLOC`、`PICKING`、`REVIEWING`、`REVIEWED`、`CALLBACK_SUCCESS`、`CALLBACK_FAILED`、`ALLOCATION_EXCEPTION`。
- SAP 状态：`NOT_POSTED`、`SUCCESS`、`FAILED`。

### 4. 核心字段

- 表头：`order_no`、`source_order_no`、`outbound_type`、`warehouse_id`、`customer_id`、`owner_code`、`planned_qty`、`allocated_qty`、`picked_qty`、`review_qty`、`shipped_qty`、`status`、`sap_post_status`、`parent_order_no`。
- 明细：`line_no`、`product_id`、`planned_qty`、`allocated_qty`、`picked_qty`、`review_qty`、`shipped_qty`、`batch_no`、`status`。
- 分配：`allocation_no`、`inventory_id`、`sn_code`、`allocated_qty`、`allocation_status`。
- 发货：`shipment_no`、`shipped_qty`、`shipper`、`ship_time`、`sap_post_status`。

## 五、库存管理能力

| 能力 | 说明 |
|---|---|
| 库存查询 | 按仓库、库位、货主、产品、批次、质量状态查询库存 |
| SN 查询 | 查询 SN 状态、锁定状态、入库单、出库单、销售标识 |
| 库存移动 | 支持库位移动、托盘变更、移动确认和取消 |
| 库存盘点 | 支持创建盘点、生成盘点行、录入结果、差异确认和调整 |
| 库存流水 | 记录入库、出库、移动、盘点调整等库存变化 |

## 六、接口与 mock 能力

| 外部系统 | 当前能力 |
|---|---|
| SAP | 生产订单下发、入库过账、出库物料凭证 mock |
| MES | SN 下发 mock |
| Fulfillment | 发运订单下发 mock |
| Trace | 出库 SN 追溯回传 mock |
| CRM | 客户资料同步 mock |

## 七、已知问题

1. 当前账号密码为 demo 值，未实现生产级密码策略和 SSO。
2. 多语种仍为初步能力，未覆盖所有后端错误消息。
3. 后端自动化测试覆盖不足。
4. 当前 Docker Compose 仅启动 MySQL，不包含完整前后端容器。
5. 导入导出以 CSV 为主，复杂 Excel 多 Sheet 仍需后续增强。
6. SaaS 多租户、统一权限中心、统一审计、统一消息中心尚未接入。
