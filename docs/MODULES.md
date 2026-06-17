# WMS Alpha 模块与菜单说明

## 1. 菜单结构

| 一级菜单 | 二级菜单 | 前端路由 | 说明 |
|---|---|---|---|
| 数据驾驶舱 | 集团总览 | `/dashboard` | KPI、库存结构、预警、趋势 |
| 基础数据 | 产品主数据 | `/masterdata/products` | 产品维护、SN 管理标识、安全库存 |
| 基础数据 | 客户主数据 | `/masterdata/customers` | 客户和 VMI 客户维护 |
| 仓库设置 | 仓库管理 | `/warehouse/warehouses` | 集团总仓、区域仓、售后仓、VMI 仓 |
| 仓库设置 | 库位管理 | `/warehouse/locations` | 库位、容量、冻结状态 |
| 入库管理 | 预期到货通知单 | `/inbound/arrival-notices` | 入库单主表列表，不同入库类型通过订单类型区分 |
| 入库管理 | SN 绑定 | `/inbound/sn-bindings` | 查看和删除 ASN 采集的 SN/箱/托盘绑定关系 |
| 出库管理 | 发运订单 | `/outbound/shipping-orders` | 出库单主表列表，不同出库类型通过订单类型区分 |
| 库存管理 | 库存查询 | `/inventory/list` | 多仓、多状态库存查询 |
| 库存管理 | SN 查询 | `/inventory/sn` | SN 状态、托盘、箱、出入库单追溯 |
| 接口中心 | 接口日志 | `/interface/logs` | SAP、MES、履约、CRM、追溯 Mock 日志 |
| 系统设置 | 系统用户 | `/system/users` | Alpha 用户、角色模拟 |

## 2. 单据展示口径

- 入库列表按 `wms_inbound_order` 主表维度分页，一张预期到货通知单只显示一行。
- 出库列表按 `wms_outbound_order` 主表维度分页，一张发运订单只显示一行。
- 产品行明细只在详情页子表展示，不作为列表主行。
- 详情页采用“主表信息 + 明细行 + SN/作业记录 + 接口日志 + 操作日志”的主从结构。
- 入库不再设置独立“上架”二级菜单；收货时选择目标库位，完成 SN 与库位落位。
