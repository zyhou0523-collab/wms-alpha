# 预期到货通知单状态逻辑清单

本文档基于当前 `release/wms-pc-v2.2` 前端页面、mock API、seed demo 数据、按钮显示条件、操作日志和系统字典现状梳理。本文档只描述现状和疑点，不调整状态流转。

## 1. 当前预期到货通知单状态列表

| 状态编码 | 中文名称 | 页面显示 | 是否在字典中 | 是否在代码中使用 | 说明 |
| --- | --- | --- | --- | --- | --- |
| CREATED | 创建 | 创建 | 否 | 是 | 新建预期到货通知单成功后的标准状态。历史页面曾显示为“待收货”，状态编码本身一直存在。 |
| RECEIVING | 收货中 | 收货中 | 否 | 是 | 旧生产入库/收货逻辑可使用，列表筛选未作为主选项。 |
| PARTIAL_RECEIVED | 部分收货 | 部分收货 | 否 | 是 | 部分计划数量已收货。 |
| RECEIVED | 完全收货 | 完全收货 | 否 | 是 | 全部计划数量已收货。 |
| BOUND | 已绑定 | BOUND | 否 | 是 | 包装/箱托绑定流程写入，预期到货列表未作为主状态选项。 |
| ON_SHELF | 已上架 | 已上架 | 否 | 是 | 已完成上架。 |
| CLOSED | 已关闭 | 已关闭 | 否 | 兼容 | 前端筛选/刷新函数保留终态判断，但当前页面未提供关闭按钮。 |
| CANCELED | 已取消 | 已取消 | 否 | 是 | 创建态且无 SN/收货/上架数据时可取消。 |
| SAP_FAILED | SAP 回传失败 | SAP 回传失败 | 否 | 兼容 | 详情页状态映射保留，当前主流程更倾向使用 `sap_post_status=FAILED` 表示接口失败。 |

字典现状：系统管理字典含 `wms_inbound_type`，未发现预期到货通知单状态字典。状态显示目前由前端页面/i18n 词条维护。

## 2. 每个状态的进入条件

| 状态 | 进入条件 | 触发操作 | 涉及接口 | 涉及字段 |
| --- | --- | --- | --- | --- |
| CREATED | 新建/导入预期到货通知单；收货取消后数量归零；刷新汇总时收到数量为 0 | 新建、导入、编辑、取消收货 | `POST /inbound-orders`、`POST /inbound-orders/import`、`PUT /inbound-orders/{id}`、`POST /inbound-orders/{id}/receipts/{receiptId}/cancel` | `inboundOrders.status`、`inboundOrderLines.status`、`received_qty` |
| RECEIVING | 旧生产入库收货流程可能写入 | 旧收货流程 | `POST /inbound/production-orders/{id}/receive` 等旧路径 | `status` |
| PARTIAL_RECEIVED | 部分计划数量已收货 | 收货确认 | `POST /inbound-orders/{id}/receive` | `received_qty < planned_qty` |
| RECEIVED | 全部计划数量已收货 | 收货确认 | `POST /inbound-orders/{id}/receive` | `received_qty >= planned_qty` |
| BOUND | 包装绑定完成 | 箱/托绑定 | `POST /inbound-orders/{id}/bind-package` | `packageBindings.bind_status` |
| ON_SHELF | 已收货 SN 上架完成 | 上架 | `POST /inbound/production-orders/{id}/putaway` | `shelved_qty`、`serialNumbers.status=ON_SHELF` |
| CANCELED | 创建态取消 | 取消单据 | `POST /inbound-orders/{id}/cancel` | `status=CANCELED` |
| CLOSED | 当前页面无主动入口 | 兼容终态 | 无主页面入口 | `status=CLOSED` |

## 3. 每个状态下允许的操作

| 状态 | 允许操作 | 禁止操作 | 前端按钮显示 | 后端/mock 是否校验 |
| --- | --- | --- | --- | --- |
| CREATED | 查看、编辑、采集 SN、收货、取消、导出 | 回传 SAP、重传 SAP、上架 | 编辑、采集 SN、收货、取消 | 编辑/取消校验无 SN 采集、无收货、无上架、SAP 未成功。 |
| PARTIAL_RECEIVED | 查看、继续采集 SN、继续收货、回传 SAP/重传 SAP、导出 | 编辑、取消单据 | 采集 SN、收货、SAP 回传 | 收货校验剩余数量；SAP 回传按收货批次。 |
| RECEIVED | 查看、回传 SAP/重传 SAP、导出；旧流程可上架 | 编辑、取消单据、继续收货（无剩余时） | SAP 回传 | 收货/上架校验状态和数量。 |
| BOUND | 查看、上架、导出 | 编辑、取消单据 | 当前主列表未突出展示 | 上架校验 `RECEIVED/BOUND/ON_SHELF`。 |
| ON_SHELF | 查看、导出、必要时 SAP 重传 | 编辑、取消、收货取消 | 视 SAP 状态显示重传 | 取消收货校验已上架 SN 不允许直接取消。 |
| CLOSED | 查看、导出 | 业务操作 | 无主流程按钮 | 终态校验。 |
| CANCELED | 查看、导出 | 业务操作 | 无业务按钮 | 终态校验。 |

## 4. SAP 回传与订单状态关系

| 项 | 当前逻辑 |
| --- | --- |
| 订单状态字段 | `inboundOrders.status` 表示业务进度。 |
| SAP 状态字段 | `sap_post_status` 表示入库收货批次/订单汇总回传状态。 |
| SAP 状态值 | `NOT_POSTED`、`SUCCESS`、`FAILED`，历史兼容 `POSTED`。 |
| 回传 SAP 按钮条件 | 当前列表 `canSapPost(row)` 主要依赖 `pending_sap_receipt_count > 0`。 |
| 重传 SAP 条件 | `canSapPost(row)` 或订单 `sap_post_status` 为 `FAILED/NOT_POSTED`。 |
| SN 采集后状态是否变化 | SN 行状态变为 `COLLECTED`，订单主状态通常仍由收货数量汇总决定。 |
| 收货后状态如何变化 | `refreshInboundHeaderStatus` 根据 `received_qty/planned_qty/shelved_qty` 汇总为 `PARTIAL_RECEIVED/RECEIVED/ON_SHELF`。 |

## 5. 当前是否缺少“创建”状态

不缺少状态编码。`CREATED` 在 seed 数据、mock 新建、编辑/取消校验、前端按钮判断中均存在。

历史疑点主要来自页面中文显示：列表/详情曾把 `CREATED` 显示为“待收货”，容易让用户误以为缺少“创建”状态。本轮多语种词条已将 `CREATED` 显示为“创建”，但未改变任何状态流转。

## 6. 当前发现的疑似问题

- 预期到货通知单状态没有统一字典，页面/i18n/后端 mock 各自维护显示。
- `CREATED` 历史显示为“待收货”，容易与实际“可编辑/可取消”的创建态混淆。
- `RECEIVING`、`BOUND`、`SAP_FAILED` 在代码中存在，但列表筛选选项不完整。
- 页面提供 `CLOSED` 筛选，但当前主流程未发现关闭入口。
- SAP 回传是按收货批次处理，列表订单汇总状态与批次状态之间仍需要更清晰的产品说明。
- 新建后是否立即“待收货”应在下一轮产品层面确认：如果业务定义需要“待收货”，建议新增展示态或待办标签，而不是复用 `CREATED`。
