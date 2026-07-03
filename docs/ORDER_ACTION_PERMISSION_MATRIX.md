# 出入库单据按钮权限矩阵

## 1. 背景

本轮治理目标是统一 PC 前端按钮显示规则与后端接口状态校验规则，避免出现“页面显示按钮但接口拒绝”或“接口允许但页面没有入口”的不一致问题。

本轮只处理按钮可见性和接口状态校验，不修改入库收货、出库分配、拣货、发货、库存扣减、SAP 回传触发时机等核心业务流程。

## 2. 发运订单状态-操作矩阵

| 状态 | 编辑 | 分配库存 | 拣货 | 发货 | 取消分配 | 取消拣货 | 取消发货 | 关闭 | 取消订单 | SAP 回传 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CREATED | 允许 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 允许 | 禁止 |
| PARTIAL_ALLOCATED | 禁止 | 允许 | 允许 | 禁止 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 |
| ALLOCATED | 禁止 | 禁止 | 允许 | 禁止 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 |
| PARTIAL_PICKED | 禁止 | 禁止 | 允许 | 允许 | 禁止 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 |
| PICKED | 禁止 | 禁止 | 禁止 | 允许 | 禁止 | 允许 | 禁止 | 禁止 | 禁止 | 禁止 |
| PARTIAL_SHIPPED | 禁止 | 禁止 | 禁止 | 允许 | 禁止 | 禁止 | 允许 | 允许 | 禁止 | 禁止 |
| SHIPPED | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 允许 | 禁止 | 禁止 |
| CLOSED | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 按 SAP 状态判断 |
| CANCELED | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 |

兼容状态说明：

| 兼容状态 | 处理方式 |
| --- | --- |
| PENDING_ALLOC | 兼容创建/待分配阶段，可继续分配或取消订单。 |
| PICKING | 兼容拣货中阶段，可继续拣货；如存在已拣货未发货数量，可继续发货。 |
| REVIEWING / REVIEWED | 兼容历史复核阶段，REVIEWED 可作为已拣货完成状态继续发货。 |
| CALLBACK_SUCCESS / CALLBACK_FAILED / ALLOCATION_EXCEPTION | 仅保留显示与历史数据兼容，不作为主流程推荐状态。 |

## 3. 预期到货通知单状态-操作矩阵

| 状态 | 编辑 | 采集 SN | 收货 | 取消收货 | 上架 | 取消单据 | SAP 回传 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CREATED | 允许 | 允许 | 允许 | 禁止 | 禁止 | 允许 | 禁止 |
| PARTIAL_RECEIVED | 禁止 | 允许 | 允许 | 允许 | 禁止 | 禁止 | 允许 |
| RECEIVED | 禁止 | 禁止 | 禁止 | 允许 | 按当前上架能力判断 | 禁止 | 允许 |
| ON_SHELF | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 必要时重传 |
| CLOSED | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 |
| CANCELED | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 | 禁止 |

兼容状态说明：

| 兼容状态 | 处理方式 |
| --- | --- |
| RECEIVING | 兼容历史收货中状态，可继续采集 SN 或收货。 |
| BOUND | 兼容历史绑定状态，可按当前上架能力处理上架或 SAP 重传。 |
| SAP_FAILED | 不再作为订单主状态使用，后续失败统一落到 sap_post_status = FAILED。 |

## 4. SAP 回传按钮规则

出库发运订单：

- 仅当 status = CLOSED 且 sap_post_status 属于 FAILED / NOT_POSTED / 空值时，显示并允许回传 SAP。
- status = CLOSED 且 sap_post_status = SUCCESS / POSTED 时，不显示、不允许回传 SAP。
- status 非 CLOSED 时，不显示、不允许手工回传 SAP。

入库预期到货通知单：

- 仅当订单已经产生收货批次，且存在 NOT_POSTED / FAILED 收货批次时，显示并允许回传 SAP。
- CREATED / CLOSED / CANCELED 状态不显示、不允许回传 SAP。
- SAP 成功回传后的收货批次不允许直接取消。

## 5. 前端按钮显示函数

统一封装文件：

- `frontend/src/constants/orderActionPermissions.ts`

发运订单函数：

- `canEditOutboundOrder(row)`
- `canAllocateOutboundOrder(row)`
- `canPickOutboundOrder(row, line?)`
- `canShipOutboundOrder(row, line?)`
- `canCloseOutboundOrder(row)`
- `canCancelOutboundOrder(row)`
- `canCancelAllocationOutboundOrder(row)`
- `canCancelPickOutboundOrder(row)`
- `canCancelShipOutboundOrder(row)`
- `canPostSapOutboundOrder(row)`
- `canRetrySapOutboundOrder(row)`

预期到货通知单函数：

- `canEditInboundOrder(row)`
- `canCollectSnInboundOrder(row, line?)`
- `canReceiveInboundOrder(row, line?)`
- `canCancelReceiveInboundOrder(row)`
- `canPutawayInboundOrder(row)`
- `canCancelInboundOrder(row)`
- `canPostSapInboundOrder(row)`
- `canRetrySapInboundOrder(row)`

已接入页面：

- 发运订单列表与详情按钮。
- 预期到货通知单列表按钮。
- 预期到货通知单详情按钮。

## 6. 后端状态校验函数

Java 后端发运订单：

- `validateOutboundEditable(order, operator)`
- `validateOutboundAllocatable(order, operator)`
- `validateOutboundPickable(order, operator)`
- `validateOutboundShippable(order, operator)`
- `validateOutboundClosable(order, operator)`
- `validateOutboundCancelable(order, operator)`
- `validateOutboundSapPostable(order, operator)`

Java 后端预期到货通知单：

- `validateInboundEditable(order, operator)`
- `validateInboundReceivable(order, operator)`
- `validateInboundCancelable(order, operator)`
- `validateInboundSapPostable(order, operator, pendingReceiptCount)`

Mock API 同步使用同一套前端规则函数，保证本地演示环境与页面按钮显示一致。

## 7. 异常提示规范

接口拒绝业务动作时，错误提示必须包含：

- 当前状态：例如“当前状态【SHIPPED】不允许发货”。
- 允许条件：例如“仅已拣货或部分发运状态允许发货”。
- 明确动作：例如“编辑发运订单”“取消收货”“回传 SAP”。

失败动作需要写入操作日志：

- 出库：`OUTBOUND` 模块操作日志，结果为 `FAILED`。
- 入库：`INBOUND` 模块操作日志，结果为 `FAILED`。

失败原因不得污染订单主状态；例如库存不足、SAP 失败、接口失败等应写入异常记录、操作日志或 `sap_post_status`，不再新增或滥用非正式主状态。
