# WMS Alpha 数据库设计

## 1. 核心表

| 表名 | 说明 | 关键字段 |
|---|---|---|
| `wms_inbound_order` | 预期到货通知单表头 | order_no、source_order_no、inbound_type、status、warehouse_id、owner_code、owner_name、related_order_no、sap_post_status |
| `wms_inbound_order_detail` | 预期到货通知单明细 | order_id、line_no、product_id、planned_qty、received_qty、status |
| `wms_package_binding` | 入库 SN 绑定关系 | sn_code、box_code、pallet_code、inbound_order_no |
| `wms_outbound_order` | 发运订单表头 | order_no、source_order_no、outbound_type、status、warehouse_id、customer_id、planned_qty、allocated_qty、picked_qty、review_qty、shipped_qty |
| `wms_outbound_order_detail` | 发运订单明细 | order_id、line_no、product_id、planned_qty、allocated_qty、picked_qty、review_qty、shipped_qty、status |
| `wms_serial_number` | SN 库存追溯 | sn_code、product_id、warehouse_id、location_id、pallet_code、box_code、inbound_order_no、outbound_order_no、status |
| `wms_inventory` | 库存余额 | warehouse_id、location_id、product_id、batch_no、inventory_status、total_qty、available_qty、allocated_qty |
| `wms_inventory_transaction` | 库存流水 | transaction_type、business_doc_no、sn_code、qty、before_qty、after_qty |
| `wms_interface_log` | 接口日志 | interface_name、business_doc_no、source_system、target_system、status、retry_count |
| `wms_operation_log` | 操作日志 | module、business_doc_no、action、operator、result |

## 2. 主从结构口径

- 入库列表查询 `wms_inbound_order` 主表，一张 ASN 只显示一行。
- 入库详情通过 `wms_inbound_order_detail` 展示产品行明细，通过 `wms_serial_number` 和 `wms_package_binding` 展示 SN 采集结果。
- 出库列表查询 `wms_outbound_order` 主表，一张发运订单只显示一行。
- 出库详情通过 `wms_outbound_order_detail` 展示产品行明细，通过分配、拣货、复核、发货记录表展示作业过程。
- 明细行不作为列表主数据分页，避免一张多产品单据在列表中重复出现。

## 3. 入库表头字段

预期到货通知单表头逻辑字段：

- 预期到货通知单号：`order_no`
- 来源单号：`source_order_no`
- 订单类型：`inbound_type`
- 订单状态：`status`
- 仓库编码/名称：关联 `wms_warehouse`
- 货主/货主名称：`owner_code`、`owner_name`，可由供应商、客户或仓库货主信息派生
- 关联单号：`related_order_no`，可关联 MES 工单、采购 ASN、RMA 或调拨单
- 回传 SAP 状态：`sap_post_status`
- 创建/更新信息：`created_at`、`created_by`、`updated_at`、`updated_by`

## 4. 入库明细字段

预期到货通知单明细字段：

- 行号：`line_no`
- 产品 ID：`product_id`
- 产品描述：关联 `md_product.product_name`
- 行状态：`status`
- 预期数量：`planned_qty`
- 收货数量：`received_qty`
- SAP 工厂：演示阶段由仓库编码或扩展字段映射

## 5. SN 绑定约束

- `wms_package_binding.sn_code` 唯一，保证一个 SN 只能存在一条有效绑定关系。
- `box_code` 允许为空，是否必填由产品档案决定。
- `pallet_code`、`box_code`、`sn_code`、`inbound_order_no` 在采集时做业务校验。
- 删除绑定关系后，需要同步清空 `wms_serial_number` 中的托盘码、箱码，支持重新采集。

## 6. 状态与作业说明

- 入库状态：`CREATED` 创建、`RECEIVING` 部分收货、`RECEIVED` 完全收货、`CLOSED` 订单关闭、`SAP_FAILED` 回传失败。
- 入库不再设置独立上架动作；收货时选择目标库位，完成 SN 与库存库位落位。
- 出库扣减只允许在发货确认阶段发生，分配阶段只锁定库存和 SN。

## 7. 2026-06-15 行级 SN 采集字段补充

本轮迭代将 SN 采集从入库单表头调整为入库明细行维度，新增以下字段：

- `wms_serial_number.inbound_order_line_id`：记录 SN 来源的入库明细行，用于产品行数量联动、重复采集校验和删除回退。
- `wms_package_binding.inbound_order_line_id`：记录箱托绑定关系来源的入库明细行，用于 SN 绑定列表追溯和错误绑定删除。

行级数量规则：

- `wms_inbound_order_detail.planned_qty` 为产品行计划数量。
- `wms_inbound_order_detail.received_qty` 为该产品行已完成 SN 采集数量。
- 确认采集时必须满足 `received_qty + 本次有效 SN 数量 <= planned_qty`。
- 删除带 `inbound_order_line_id` 的绑定关系时，释放 SN 与明细行关系，并回退该行 `received_qty`。

库存识别规则：

- SN 采集只写 `wms_serial_number` 和 `wms_package_binding`，并刷新入库明细/主表数量状态。
- SN 采集不写入 `wms_inventory`，也不增加 `available_qty`。
- 后续需要恢复上架或入账识别时，应由独立库存入账动作把 `INBOUND` 状态 SN 转为可用库存。
