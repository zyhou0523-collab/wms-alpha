# WMS 当前接口初步清单

## 一、说明

本文件基于当前后端 Controller 注解和前端调用方式梳理，属于迁移前的初步接口清单。后续 SaaS 化时应进一步补充请求体、响应体、错误码、权限码、幂等规则和接口契约测试。

后端统一 API 前缀主要为 `/api`。

## 二、认证与菜单

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/auth/login` | 登录 |
| `GET` | `/api/auth/me` | 当前用户 |
| `GET` | `/api/menus` | 当前菜单 |

## 三、数据驾驶舱与工作台

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/dashboard/summary` | 驾驶舱汇总 |
| `GET` | `/api/dashboard/inventory-structure` | 库存结构 |
| `GET` | `/api/dashboard/warehouse-map` | 仓库地图 |
| `GET` | `/api/dashboard/inout-trend` | 进出趋势 |
| `GET` | `/api/dashboard/warehouse-operation` | 仓库作业 |
| `GET` | `/api/dashboard/safety-warnings` | 安全库存预警 |
| `GET` | `/api/dashboard/aging-warnings` | 库龄预警 |
| `GET` | `/api/workbench` | 工作台首页 |
| `GET` | `/api/workbench/summary` | 工作台汇总 |
| `GET` | `/api/workbench/inventory-query` | 库存快捷查询 |
| `GET` | `/api/workbench/todo-list` | 待办列表 |
| `GET` | `/api/workbench/pending-inbound` | 待处理入库 |
| `GET` | `/api/workbench/pending-outbound` | 待处理出库 |

## 四、主数据与仓库

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/products` | 产品列表 |
| `POST` | `/api/products` | 新建产品 |
| `PUT` | `/api/products/{id}` | 更新产品 |
| `DELETE` | `/api/products/{id}` | 删除产品 |
| `GET` | `/api/products/options` | 产品选项 |
| `GET` | `/api/products/export-template` | 产品导入模板 |
| `GET` | `/api/products/export` | 产品导出 |
| `POST` | `/api/products/import` | 产品导入 |
| `GET` | `/api/customers` | 客户列表 |
| `POST` | `/api/customers` | 新建客户 |
| `PUT` | `/api/customers/{id}` | 更新客户 |
| `DELETE` | `/api/customers/{id}` | 删除客户 |
| `GET` | `/api/customers/options` | 客户选项 |
| `GET` | `/api/customers/export-template` | 客户导入模板 |
| `GET` | `/api/customers/export` | 客户导出 |
| `POST` | `/api/customers/import` | 客户导入 |
| `GET` | `/api/warehouses` | 仓库列表 |
| `POST` | `/api/warehouses` | 新建仓库 |
| `PUT` | `/api/warehouses/{id}` | 更新仓库 |
| `DELETE` | `/api/warehouses/{id}` | 删除仓库 |
| `GET` | `/api/locations` | 库位列表 |
| `POST` | `/api/locations` | 新建库位 |
| `PUT` | `/api/locations/{id}` | 更新库位 |
| `DELETE` | `/api/locations/{id}` | 删除库位 |

## 五、入库管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/inbound-orders` | 入库单列表 |
| `GET` | `/api/inbound/arrival-notices` | 预期到货通知单列表兼容路径 |
| `POST` | `/api/inbound-orders` | 新建入库单 |
| `PUT` | `/api/inbound-orders/{id}` | 更新入库单 |
| `GET` | `/api/inbound-orders/{id}` | 入库单详情 |
| `POST` | `/api/inbound-orders/{id}/receive` | 收货 |
| `POST` | `/api/inbound-orders/{id}/cancel` | 取消单据 |
| `POST` | `/api/inbound-orders/{id}/close` | 关闭单据 |
| `POST` | `/api/inbound-orders/{id}/receipts/{receiptId}/cancel` | 取消收货批次 |
| `POST` | `/api/inbound-orders/{id}/bind-package` | 包装绑定 |
| `GET` | `/api/inbound-orders/{orderId}/sn-collect-context` | SN 采集上下文 |
| `GET` | `/api/inbound-orders/{orderId}/lines/{lineId}/sn-collect-context` | 行级 SN 采集上下文 |
| `GET` | `/api/inbound-orders/{orderId}/lines/{lineId}/collected-sns` | 已采集 SN |
| `POST` | `/api/inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection` | 校验 SN 采集 |
| `POST` | `/api/inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection` | 确认 SN 采集 |
| `POST` | `/api/inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection` | 取消 SN 采集 |
| `POST` | `/api/inbound-orders/{id}/sap-post` | SAP 入库回传 |
| `POST` | `/api/inbound-orders/{id}/post-sap` | SAP 入库回传兼容路径 |
| `POST` | `/api/inbound-orders/retry-sap` | 批量重传 SAP |
| `GET` | `/api/inbound-orders/import-template` | 导入模板 |
| `POST` | `/api/inbound-orders/import` | 导入 |
| `POST` | `/api/inbound-orders/export` | 导出 |
| `GET` | `/api/inbound/sn-bindings` | SN 绑定列表 |
| `GET` | `/api/inbound/sn-bindings/export` | SN 绑定导出 |
| `DELETE` | `/api/inbound/sn-bindings/{id}` | 删除 SN 绑定 |
| `POST` | `/api/inbound/sn-bindings/bulk-delete` | 批量删除 SN 绑定 |

## 六、出库管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/outbound-orders` | 发运订单列表 |
| `GET` | `/api/outbound-orders/{id}` | 发运订单详情 |
| `POST` | `/api/outbound-orders` | 新建发运订单 |
| `POST` | `/api/outbound-orders/{id}/allocate-auto` | 自动分配 |
| `POST` | `/api/outbound-orders/{id}/allocate-manual` | 人工分配 |
| `POST` | `/api/outbound-orders/{id}/release-allocation` | 释放分配 |
| `POST` | `/api/outbound-orders/{id}/allocations/cancel` | 批量取消分配 |
| `GET` | `/api/outbound-orders/{id}/allocation-candidates` | 分配候选库存 |
| `GET` | `/api/outbound-orders/{id}/allocations` | 分配记录 |
| `POST` | `/api/outbound-orders/{id}/pick` | 拣货 |
| `POST` | `/api/outbound-orders/{id}/pick-scan` | 扫码拣货 |
| `POST` | `/api/outbound-orders/{id}/picks/{pickId}/cancel` | 取消拣货 |
| `POST` | `/api/outbound-orders/{id}/picks/cancel` | 批量取消拣货 |
| `POST` | `/api/outbound-orders/{id}/picking-tasks` | 生成拣货任务 |
| `GET` | `/api/outbound-orders/{id}/pick-records` | 拣货记录 |
| `POST` | `/api/outbound-orders/{id}/ship` | 发货确认 |
| `POST` | `/api/outbound-orders/{id}/shipments/{shipmentId}/cancel` | 取消发货 |
| `POST` | `/api/outbound-orders/{id}/shipments/cancel` | 批量取消发货 |
| `GET` | `/api/outbound-orders/{id}/picking-list` | 拣货单 |
| `GET` | `/api/outbound-orders/{id}/shipments` | 发货记录 |
| `POST` | `/api/outbound-orders/{id}/post-sap` | SAP 出库回传 |
| `POST` | `/api/outbound-orders/retry-sap` | 批量重传 SAP |
| `POST` | `/api/outbound-orders/{id}/cancel` | 取消发运订单 |
| `POST` | `/api/outbound-orders/{id}/close` | 关闭发运订单 |
| `GET` | `/api/outbound-orders/{id}/interface-logs` | 发运订单接口日志 |
| `GET` | `/api/outbound-orders/{id}/status-flow` | 发运订单状态流 |

## 七、库存、盘点与移动

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/inventory` | 库存查询 |
| `GET` | `/api/serial-numbers` | SN 查询 |
| `GET` | `/api/inventory/transactions` | 库存流水 |
| `GET` | `/api/inventory/count-orders` | 盘点单列表 |
| `GET` | `/api/inventory/count-orders/{id}` | 盘点单详情 |
| `POST` | `/api/inventory/count-orders` | 新建盘点单 |
| `POST` | `/api/inventory/count-orders/{id}/generate-lines` | 生成盘点行 |
| `POST` | `/api/inventory/count-orders/{id}/record` | 录入盘点结果 |
| `POST` | `/api/inventory/count-orders/{id}/confirm-difference` | 确认差异 |
| `POST` | `/api/inventory/count-orders/{id}/adjust` | 执行调整 |
| `POST` | `/api/inventory/count-orders/{id}/cancel` | 取消盘点 |
| `GET` | `/api/inventory/move-orders` | 移动单列表 |
| `GET` | `/api/inventory/move-orders/{id}` | 移动单详情 |
| `POST` | `/api/inventory/move-orders` | 新建移动单 |
| `POST` | `/api/inventory/move-orders/{id}/confirm` | 确认移动 |
| `POST` | `/api/inventory/move-orders/{id}/cancel` | 取消移动 |
| `GET` | `/api/inventory/move-orders/stock-candidates` | 移动候选库存 |

## 八、报表

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/reports/{reportKey}` | 报表查询 |
| `POST` | `/api/reports/{reportKey}/export` | 报表导出 |

报表 key 由前端配置驱动，包括进出存、入库日报、出库日报、标准库龄、分段库龄、出库 SN、入库 SN 等。

## 九、接口中心与外部系统 mock

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/interface-logs` | 接口日志 |
| `POST` | `/api/interface-logs/{id}/retry` | 接口重试 |
| `GET` | `/api/mock-configs` | Mock 配置 |
| `PUT` | `/api/mock-configs/{id}` | 更新 Mock 配置 |
| `POST` | `/api/mock/mes/sn-push` | MES SN 下发 |
| `POST` | `/api/mock/sap/production-orders` | SAP 生产订单 |
| `POST` | `/api/mock/fulfillment/outbound-orders` | 履约发运订单 |
| `POST` | `/api/mock/trace/outbound-sn` | 追溯 SN 回传 |
| `POST` | `/api/mock/sap/material-documents` | SAP 物料凭证 |
| `POST` | `/api/mock/crm/customers` | CRM 客户同步 |

## 十、系统管理

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/system/users` | 用户列表 |
| `POST` | `/api/system/users` | 新建用户 |
| `PUT` | `/api/system/users/{id}` | 更新用户 |
| `DELETE` | `/api/system/users/{id}` | 删除用户 |
| `POST` | `/api/system/users/{id}/reset-password` | 重置密码 |
| `GET` | `/api/system/users/{id}/roles` | 用户角色 |
| `POST` | `/api/system/users/{id}/roles` | 保存用户角色 |
| `GET` | `/api/system/roles` | 角色列表 |
| `POST` | `/api/system/roles` | 新建角色 |
| `PUT` | `/api/system/roles/{id}` | 更新角色 |
| `DELETE` | `/api/system/roles/{id}` | 删除角色 |
| `GET` | `/api/system/roles/{id}/menus` | 角色菜单 |
| `POST` | `/api/system/roles/{id}/menus` | 保存角色菜单 |
| `GET` | `/api/system/menus` | 菜单列表 |
| `GET` | `/api/system/menus/tree` | 菜单树 |
| `POST` | `/api/system/menus` | 新建菜单 |
| `PUT` | `/api/system/menus/{id}` | 更新菜单 |
| `DELETE` | `/api/system/menus/{id}` | 删除菜单 |
| `GET` | `/api/system/{resource}` | 通用资源查询 |
| `POST` | `/api/system/{resource}` | 通用资源新增 |
| `PUT` | `/api/system/{resource}/{id}` | 通用资源更新 |
| `DELETE` | `/api/system/{resource}/{id}` | 通用资源删除 |

通用资源包括部门、岗位、字典、参数、通知、操作日志、登录日志、字段配置、数据权限、接口日志等。

## 十一、迁移补充项

后续进入 SaaS 平台前，应补充：

1. API 权限码与菜单按钮绑定关系。
2. 请求体、响应体、错误码和业务异常枚举。
3. 租户、组织、仓库、货主数据权限参数。
4. 接口幂等键、重复提交策略和审计字段。
5. OpenAPI 契约导出和接口自动化测试。
