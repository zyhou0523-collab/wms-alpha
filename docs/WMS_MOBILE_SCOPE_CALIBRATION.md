# WMS 移动端迭代范围校准说明

> 本文用于校准 WMS Alpha 移动端后续迭代范围。移动端必须严格对齐 PC 端已经实现的业务逻辑，不新增 PC 端不存在的业务流程、业务状态或业务模块。

## 一、PC 端已实现功能清单

| 模块 | PC 端已实现能力 | 依据 |
|---|---|---|
| 入库管理 | 预期到货通知单列表、详情、主从结构、行明细、SN 采集、收货、取消采集、取消收货、取消单据、SAP 回传/重传 | `frontend/src/views/inbound/InboundOrderPage.vue`、`frontend/src/views/inbound/InboundOrderDetail.vue`、`backend/src/main/java/com/company/wms/inbound/InboundController.java` |
| 入库 SN 采集 | 按订单和行号采集 SN，必须携带 `orderId`、`lineId`、`productId`、`palletCode`、`boxCode`、`serialNumbers`，支持取消采集 | `frontend/src/views/inbound/components/SnCollectDialog.vue` |
| 入库收货 | 支持按订单/行明细收货，区分 SN 管理产品与非 SN 管理产品，支持取消收货 | `frontend/src/views/inbound/components/ReceiveConfirmDialog.vue` |
| 出库管理 | 发运订单列表、详情、主从结构、行明细、出库国家字段、库存分配、拣货、发货、关闭、取消 | `frontend/src/views/outbound/OutboundOrderPage.vue`、`backend/src/main/java/com/company/wms/outbound/ShippingOrderController.java` |
| 出库逆向 | 取消分配、取消拣货、取消发货 | `frontend/src/views/outbound/OutboundOrderPage.vue` |
| 出库 SAP | 出库 SAP 回传、失败重传、接口日志 | `backend/src/main/java/com/company/wms/outbound/ShippingOrderController.java` |
| 库存查询/SN 查询 | PC 端已有库存查询和 SN 查询能力 | `backend/src/main/java/com/company/wms/query/QueryController.java` |
| 库存移动/盘点 | PC 端已有库存移动、库存盘点接口和页面能力，但不属于本轮移动端入出库优先范围 | `backend/src/main/java/com/company/wms/inventory/InventoryOperationController.java` |

## 二、移动端本轮允许开发功能清单

| 移动端功能 | 对应 PC 端能力 | 允许范围 |
|---|---|---|
| 入库单列表 | 预期到货通知单列表 | 只展示 PC 端已有字段、状态、筛选逻辑 |
| 入库单详情 | 预期到货通知单详情 | 主信息、行明细、SN 明细、收货记录、接口日志可做移动端卡片化 |
| 入库 SN 采集 | PC 端 SN 采集 | 可做扫码优先、手工兜底，但接口参数和校验必须一致 |
| 入库收货 | PC 端收货 | 可按行/订单收货，SN 产品必须先采集，非 SN 产品可直接收货 |
| 取消 SN 采集 | PC 端取消采集 | 仅允许取消 PC 端允许取消的已采集 SN |
| 取消收货 | PC 端取消收货 | 仅按 PC 端已有规则开放 |
| SAP 入库回传/重传 | PC 端 SAP 回传 | 仅保留 PC 端已有状态和按钮含义 |
| 发运订单列表 | PC 端发运订单列表 | 展示主表与行明细，移动端用卡片替代表格 |
| 发运订单详情 | PC 端发运订单详情 | 主信息、行明细、分配、拣货、发货、日志 |
| 库存分配 | PC 端自动/人工分配 | 不新增新的分配策略 |
| 拣货 | PC 端拣货 | 可扫码拣货，但校验必须与 PC 一致 |
| 发货 | PC 端发货 | 支持整单/行明细/部分发货，按 PC 逻辑累计数量 |
| 取消分配/取消拣货/取消发货 | PC 端逆向操作 | 仅在 PC 端允许状态下开放 |
| 出库 SAP 回传/重传 | PC 端出库 SAP | 不新增额外外部系统流程 |

## 三、移动端本轮禁止开发功能清单

| 禁止项 | 原因 |
|---|---|
| 上架功能 | 当前 PC 端预期到货通知单页面没有 active 上架入口，移动端不得新增 |
| 出库复核功能 | 当前 PC 端发运订单页面和接口没有 active 复核流程，移动端不得新增 |
| 独立异常处理中心 | 当前 PC 端没有独立异常处理中心菜单和闭环页面 |
| 新的入库/出库状态 | 移动端状态必须复用 PC 端状态 |
| 新的审批流、质检流、波次、装车、签收 | PC 端当前未实现，不进入移动端 |
| 绕过 `lineId` 的订单级 SN 采集 | PC 端采集仍基于订单 + 行明细 |
| 在分配阶段扣减库存 | PC 端逻辑是发货确认后扣减 |
| 移动端自定义 SAP/追溯状态 | 必须沿用 PC 端字段和接口日志 |

## 四、移动端功能与 PC 端映射

| 移动端页面/能力 | PC 端文件、方法、字段或接口 | 状态/按钮约束 |
|---|---|---|
| 入库首页/列表 | `GET /api/inbound-orders`、`GET /api/inbound/arrival-notices` | 状态沿用创建、部分收货、完全收货、关闭、取消等 |
| 入库详情 | `GET /api/inbound-orders/{id}` | 展示主表、明细、SN、操作日志、接口日志 |
| SN 采集 | `GET /api/inbound-orders/{orderId}/sn-collect-context`、`POST /confirm-sn-collection` | 必须携带 `orderId`、`lineId`、`productId`、`palletCode`、`boxCode`、`serialNumbers` |
| 取消 SN 采集 | `POST /api/inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection` | 只对 PC 允许取消的采集记录开放 |
| 收货 | `POST /api/inbound-orders/{id}/receive` | SN 管理产品必须先采集，非 SN 产品可直接收货 |
| 取消收货 | `POST /api/inbound-orders/{id}/receipts/{receiptId}/cancel` | 按 PC 端按钮状态开放 |
| 入库 SAP | `POST /api/inbound-orders/{id}/sap-post`、`POST /api/inbound-orders/retry-sap` | 只处理未回传/失败重传 |
| 发运订单列表/详情 | `GET /api/outbound-orders`、`GET /api/outbound-orders/{id}` | 字段包括出库国家、货主、仓库、状态、数量 |
| 分配库存 | `POST /allocate-auto`、`POST /allocate-manual` | 不允许冻结、不合格、不可用库存 |
| 取消分配 | `POST /allocations/cancel`、`POST /release-allocation` | 已拣货部分不可随意取消 |
| 拣货 | `POST /pick`、`POST /pick-scan` | 扫码校验 SN/库存/锁定/重复扫描 |
| 取消拣货 | `POST /picks/{pickId}/cancel`、`POST /picks/cancel` | 按 PC 已实现规则 |
| 发货 | `POST /ship` | 发货后扣减库存、更新 SN、写流水和日志 |
| 取消发货 | `POST /shipments/{shipmentId}/cancel`、`POST /shipments/cancel` | 按 PC 端逆向规则 |
| 出库 SAP | `POST /post-sap`、`POST /retry-sap` | 只复用 PC 端 SAP 状态 |

## 五、后续推荐开发顺序

1. 入库单列表 + 入库详情移动端化。
2. SN 采集移动端扫码闭环。
3. 收货 + 取消收货。
4. SAP 入库回传/重传状态展示。
5. 发运订单列表 + 详情移动端化。
6. 分配、拣货、发货移动端扫码闭环。
7. 取消分配、取消拣货、取消发货。
8. 最后再评估库存查询、SN 查询、库存移动、库存盘点是否进入移动端。

## 六、当前存在的风险点

1. PC 端代码中存在历史 mock/遗留字段，例如 `putaway`、`review`，但当前主业务页面未开放，移动端不能误用。
2. 移动端首页已有一些快捷入口，后续需要按 PC 映射逐个确认；暂未对齐的入口建议先标记“暂不开放”。
3. 移动端扫码体验可以优化，但不能改变 PC 端校验规则。
4. SN 产品和非 SN 产品的差异收货逻辑必须严格复用 PC 端规则。
5. 发运订单状态较多，移动端按钮显示必须完全受 PC 端状态流转约束。
