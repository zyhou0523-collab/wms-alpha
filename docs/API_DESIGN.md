# WMS Alpha API 设计

## 1. 通用响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "items": [],
  "total": 100,
  "pageNum": 1,
  "pageSize": 10
}
```

## 2. 入库：预期到货通知单

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/api/inbound-orders` | 预期到货通知单主表分页列表 |
| GET | `/api/inbound/arrival-notices` | 兼容入口，同样返回主表分页列表 |
| GET | `/api/inbound-orders/{id}` | 单据详情，返回主表、明细、SN、操作日志、接口日志 |
| POST | `/api/inbound-orders` | 新增模拟入库单 |
| POST | `/api/inbound-orders/{id}/receive` | 收货，支持 `serialNumbers`、`locationCode`、`operator` |
| POST | `/api/inbound-orders/{id}/bind-package` | SN 绑定采集，支持托盘码、可选箱码、SN 列表 |
| POST | `/api/inbound-orders/{id}/sap-post` | SAP 入库回传 Mock |

列表查询条件：

- `orderNo`
- `sourceOrderNo`
- `inboundType`
- `warehouseCode`
- `owner`
- `sapPostStatus`
- `createdStart`
- `createdEnd`
- `status`
- `pageNum`
- `pageSize`

列表返回要求：

- 只返回入库单主表维度，一张单据只返回一行。
- 返回聚合字段：`line_count`、`planned_qty`、`received_qty`。
- 明细行不在列表平铺，统一在详情 `details` 中返回。

入库类型枚举：

- `PRODUCTION`：生产入库
- `STOCKING`：备货入库
- `RMA`：售后 RMA 入库
- `TRANSFER`：调拨入库
- `SUPPLIER_VMI`：供应商 VMI 入库
- `OTHER`：其他入库

入库状态枚举：

```text
CREATED -> RECEIVING -> RECEIVED -> CLOSED
                         `-> SAP_FAILED -> CLOSED
```

## 3. 入库：SN 绑定

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/api/inbound/sn-bindings` | SN 绑定列表，支持托盘码、ASN 单号、箱码、SN 码筛选 |
| DELETE | `/api/inbound/sn-bindings/{id}` | 删除单条 SN 绑定关系 |
| POST | `/api/inbound/sn-bindings/bulk-delete` | 批量删除 SN 绑定关系 |

SN 绑定唯一性：

- `sn_code` 全局唯一绑定。
- `box_code` 可为空，是否必填由产品档案决定。
- 删除绑定后，SN 的托盘码、箱码关系释放，可回到预期到货通知单重新采集。

## 4. 出库：发运订单

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/api/outbound/shipping-orders` | 发运订单主表分页查询 |
| GET | `/api/outbound-orders` | 兼容入口，同样返回主表分页列表 |
| POST | `/api/outbound/shipping-orders/mock` | 新增模拟发运订单 |
| GET | `/api/outbound/orders/{id}` | 发运订单详情，返回主表、明细、分配、拣货、复核、发货、接口日志、操作日志 |
| POST | `/api/outbound/orders/{id}/allocate-auto` | 自动库存分配 |
| POST | `/api/outbound/orders/{id}/allocate-manual` | 人工指定库存分配 |
| POST | `/api/outbound/orders/{id}/cancel-allocation` | 取消分配/取消出库 |
| POST | `/api/outbound/orders/{id}/picking-tasks` | 生成拣货任务 |
| POST | `/api/outbound/picking-tasks/{id}/scan` | 扫码拣货 |
| POST | `/api/outbound/picking-tasks/{id}/exception` | 拣货异常登记 |
| POST | `/api/outbound/orders/{id}/review` | 出库复核 |
| POST | `/api/outbound/orders/{id}/ship` | 发货确认，发货阶段扣减库存并触发外部回传 |
| POST | `/api/outbound/orders/{id}/trace-callback` | 追溯 SN 回传 Mock 或重试 |
| POST | `/api/outbound/orders/{id}/sap-callback` | SAP 出库扣减 Mock 或重试 |

列表返回要求：

- 只返回出库单主表维度，一张发运订单只返回一行。
- 返回聚合字段：`line_count`、订单总数、分配总数、拣货总数、复核总数、发货总数。
- 产品行明细只在详情 `details` 子表中返回。

出库类型枚举：

- `SALES`：销售出库
- `TRANSFER`：调拨出库
- `AFTERSALE`：售后出库

## 5. 查询与 Mock

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/api/inventory` | 库存查询 |
| GET | `/api/serial-numbers` | SN 查询 |
| GET | `/api/interface-logs` | 接口日志查询 |
| GET | `/api/dashboard/summary` | 数据驾驶舱统计 |
| POST | `/api/mock/sap/production-orders` | SAP 下发生产工单并创建入库单 |
| POST | `/api/mock/mes/sn-push` | MES 下发 SN |
| POST | `/api/mock/fulfillment/outbound-orders` | 履约发运订单下发 |
| POST | `/api/mock/trace/outbound-sn` | SN 回传追溯 |
| POST | `/api/mock/sap/material-documents` | SAP 单据过账 |

## 2026-06-15 行级 SN 采集接口补充

| 方法 | URL | 说明 |
|---|---|---|
| GET | `/api/inbound-orders/{orderId}/sn-collect-context` | 查询订单维度 SN 采集上下文，返回入库单主信息和当前订单所有产品明细行，用于列表页直接弹出采集窗口 |
| GET | `/api/inbound-orders/{orderId}/lines/{lineId}/sn-collect-context` | 查询当前 ASN 产品行的 SN 采集上下文，返回产品、计划数、已收数、剩余可采集数、仓库和行状态 |
| POST | `/api/inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection` | 按产品行校验 SN、托盘、箱码与数量，不写业务数据 |
| POST | `/api/inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection` | 重新校验后确认采集，写入 SN、箱托绑定、明细行已收数量、主表状态和操作日志 |

校验规则：

- 本次有效 SN 数量 + 当前明细行已收数量不能超过明细行计划数量。
- 已存在 SN 必须属于当前产品；现场新增 SN 必须写入当前产品 ID。
- 禁止重复录入、重复采集、跨 ASN 绑定、跨明细行绑定、质量不合格、锁定、已上架、已出库或已绑定其他箱托关系的 SN。
- SN 采集不直接增加 `wms_inventory`，库存入账由后续上架或入账逻辑处理。
