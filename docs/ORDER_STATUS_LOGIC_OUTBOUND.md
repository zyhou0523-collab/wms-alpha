# 发运订单状态逻辑清单

本文档基于当前 `release/wms-pc-v2.2` 前端页面、mock API、seed demo 数据、按钮显示条件、操作日志和系统字典现状梳理。本文档只描述现状和疑点，不调整状态流转。

## 1. 当前发运订单状态列表

| 状态编码 | 中文名称 | 页面显示 | 是否在字典中 | 是否在代码中使用 | 说明 |
| --- | --- | --- | --- | --- | --- |
| CREATED | 创建 | 创建 | 否 | 是 | 新建发运订单成功后的标准状态，允许编辑、分配、取消。 |
| PENDING_ALLOC | 待分配 | 待分配 | 否 | 是 | 旧 demo/旧接口仍使用；前端允许分配、取消，语义接近 CREATED。 |
| PARTIAL_ALLOCATED | 部分分配 | 部分分配 | 否 | 是 | 部分明细已有分配记录。 |
| ALLOCATED | 完全分配 | 完全分配 | 否 | 是 | 全部计划数量已分配，可进入拣货。 |
| PICKING | 拣货中 | PICKING | 否 | 是 | 旧拣货任务逻辑可能写入，当前主列表未配置中文选项。 |
| PARTIAL_PICKED | 部分拣货 | 部分拣货 | 否 | 是 | 部分数量已拣货。 |
| PICKED | 完全拣货 | 完全拣货 | 否 | 是 | 全部数量已拣货，可发运。 |
| REVIEWING | 复核中 | REVIEWING | 否 | 是 | 旧复核逻辑可能写入，当前发运订单页未作为主流程按钮展示。 |
| REVIEWED | 已复核 | 已复核 | 否 | 是 | 旧复核逻辑/库存分配记录可使用；当前 V3 发货允许 PICKED/REVIEWED 分配记录发货。 |
| PARTIAL_SHIPPED | 部分发运 | 部分发运 | 否 | 是 | 部分数量已发运。 |
| SHIPPED | 完全发运 | 完全发运 | 否 | 是 | 全部数量已发运；仍需用户关闭订单后触发 SAP。 |
| CLOSED | 订单关闭 | 订单关闭 | 否 | 是 | 用户点击关闭后进入；当前关闭时触发 SAP 回传。 |
| CANCELED | 订单取消 | 订单取消 | 否 | 是 | 创建/待分配阶段可取消。 |
| CALLBACK_SUCCESS | 回传成功 | 回传成功 | 否 | 兼容 | 旧 demo 数据/旧回调逻辑遗留状态；当前新发货流程不再写入。 |
| CALLBACK_FAILED | 回传失败 | 回传失败 | 否 | 兼容 | 旧 demo 数据/旧回调逻辑遗留状态；当前新发货流程不再写入。 |
| ALLOCATION_EXCEPTION | 分配异常 | 未作为主选项 | 否 | 兼容/死代码 | 旧分配异常逻辑残留，当前事务化自动分配失败会抛错和记录异常，不建议继续作为订单主状态使用。 |

字典现状：系统管理的字典类型当前包含 `sys_normal_disable`、`wms_inbound_type`、`wms_outbound_type`，未发现发运订单状态字典类型。

## 2. 每个状态的进入条件

| 状态 | 进入条件 | 触发操作 | 涉及接口 | 涉及字段 |
| --- | --- | --- | --- | --- |
| CREATED | 新建发运订单成功；拆分剩余数量时生成新单 | 新建、导入、关闭部分发运单生成余量分单 | `POST /outbound-orders`、`POST /outbound-orders/import`、`POST /outbound-orders/{id}/close` | `outboundOrders.status`、`outboundOrderLines.status/line_status` |
| PENDING_ALLOC | 旧 mock 出库单创建或旧 seed 数据 | 旧 mock 创建 | `/outbound/*/mock` | `outboundOrders.status` |
| PARTIAL_ALLOCATED | 部分计划数量分配成功 | 自动分配、人工分配 | `POST /outbound-orders/{id}/allocate-auto`、`allocate-manual` | `allocated_qty`、`inventoryAllocations.allocation_status` |
| ALLOCATED | 全部计划数量分配成功 | 自动分配、人工分配 | 同上 | 同上 |
| PARTIAL_PICKED | 部分数量已拣货 | 拣货 | `POST /outbound-orders/{id}/pick` | `picked_qty`、`inventoryAllocations.allocation_status=PICKED` |
| PICKED | 全部数量已拣货 | 拣货 | `POST /outbound-orders/{id}/pick` | 同上 |
| REVIEWED | 全部数量复核完成，或历史复核流程写入 | 复核 | `POST /outbound/orders/{id}/review` | `review_qty`、`allocation_status=REVIEWED` |
| PARTIAL_SHIPPED | 部分数量发运确认 | 发货 | `POST /outbound-orders/{id}/ship` | `shipped_qty`、`shipmentRecords.shipment_status` |
| SHIPPED | 全部数量发运确认 | 发货 | `POST /outbound-orders/{id}/ship` | 同上 |
| CLOSED | 已发货订单被用户关闭 | 关闭 | `POST /outbound-orders/{id}/close` | `status=CLOSED`、`sap_post_status` |
| CANCELED | 创建/待分配阶段取消 | 取消 | `POST /outbound-orders/{id}/cancel` | `status=CANCELED` |

## 3. 每个状态下允许的操作

| 状态 | 允许操作 | 禁止操作 | 前端按钮显示 | 后端/mock 是否校验 |
| --- | --- | --- | --- | --- |
| CREATED | 查看、编辑、分配库存、取消、导出 | 回传 SAP、关闭、发货 | 编辑、分配库存、取消 | 编辑校验无分配/拣货/发货/SAP 成功；取消校验状态。 |
| PENDING_ALLOC | 查看、分配库存、取消、导出 | 编辑、回传 SAP、关闭、发货 | 分配库存、取消 | 取消允许 `CREATED/PENDING_ALLOC`。 |
| PARTIAL_ALLOCATED | 查看、继续分配、拣货、取消分配、导出 | 编辑、取消订单、回传 SAP | 分配库存、拣货；详情可取消分配 | 分配/取消分配校验分配记录状态。 |
| ALLOCATED | 查看、拣货、取消分配、导出 | 编辑、取消订单、回传 SAP | 拣货；详情可取消分配 | 拣货校验分配记录。 |
| PARTIAL_PICKED | 查看、继续拣货、发货、取消拣货、导出 | 编辑、取消订单、回传 SAP | 拣货、发货；详情可取消拣货 | 发货校验 PICKED/REVIEWED 可发数量。 |
| PICKED | 查看、发货、取消拣货、导出 | 编辑、取消订单、回传 SAP | 发货；详情可取消拣货 | 同上。 |
| PARTIAL_SHIPPED | 查看、继续发货、取消发货、关闭、导出 | 编辑、取消订单、直接回传 SAP | 发货、关闭；详情可取消发货 | 关闭校验未发余量是否仍有分配/拣货阻塞。 |
| SHIPPED | 查看、关闭、导出 | 编辑、取消订单、直接回传 SAP | 关闭 | 关闭校验已发货数量大于 0。 |
| CLOSED | 查看、回传 SAP/重传 SAP、导出 | 编辑、分配、拣货、发货、取消发货、取消订单 | SAP 未回传/失败时显示回传 SAP；列表可批量重传 | `post-sap` 校验订单必须 CLOSED 且 SAP 未回传/失败。 |
| CANCELED | 查看、导出 | 所有业务操作 | 详情 | 后端终态校验。 |

## 4. SAP 回传状态与订单状态关系

| 项 | 当前逻辑 |
| --- | --- |
| 订单状态与 SAP 状态 | 订单主状态使用 `status`；SAP 回传状态使用 `sap_post_status`，两者独立。 |
| SAP 状态值 | `NOT_POSTED`、`SUCCESS`、`FAILED`，历史兼容 `POSTED`。 |
| 回传 SAP 按钮显示条件 | `status === CLOSED` 且 `sap_post_status` 为 `FAILED/NOT_POSTED/空`。 |
| 批量重传 SAP 条件 | 勾选订单中筛选 `canPostSap`，即已关闭且 SAP 未回传或失败。 |
| 发货完成后是否触发 SAP | 当前代码不触发 SAP；只更新 `PARTIAL_SHIPPED/SHIPPED` 和发货记录。 |
| 关闭订单时是否触发 SAP | 当前代码触发 SAP；失败时订单保持 `CLOSED`，`sap_post_status=FAILED`。 |
| SAP 失败后是否支持重传 | 支持 `POST /outbound-orders/{id}/post-sap` 和 `POST /outbound-orders/retry-sap`。 |

## 5. 当前发现的疑似问题

- 状态编码存在多套历史遗留：`PENDING_ALLOC`、`REVIEWED`、`CALLBACK_SUCCESS`、`CALLBACK_FAILED` 与当前 V3 主流程显示不完全一致。
- 字典管理中没有发运订单状态字典，状态中文主要散落在前端页面和 i18n 词条中。
- `PENDING_ALLOC` 页面语义与 `CREATED` 接近，建议下一轮统一或明确为“待分配”。
- 旧 demo 数据仍存在 `CALLBACK_SUCCESS/CALLBACK_FAILED`，而当前逻辑已改为订单状态和 SAP 状态分离。
- 旧接口 `/outbound/orders/{id}` 仍有复核、回调路径，当前主页面主要使用 `/outbound-orders/{id}`。
- `PICKING/REVIEWING/REVIEWED` 在代码中存在，但当前发运订单列表状态筛选未完整列出。
