# WMS PC Demo Data Status Cleanup Report

## 1. 清洗背景

前两轮已完成出入库订单状态字典、状态显示、按钮权限和后端状态校验治理。本轮聚焦历史 demo 数据和 seed 数据，目标是让演示环境中的订单主状态、SAP 回传状态、按钮显示和演示流程符合最新状态治理规则。

本轮不删除 demo 单据，不清空系统管理数据，不修改入库收货、出库分配、拣货、发货核心流程。

## 2. 清洗前状态分布

用户要求的数据库统计 SQL：

```sql
SELECT status, sap_post_status, COUNT(*)
FROM wms_outbound_order
GROUP BY status, sap_post_status;

SELECT status, sap_post_status, COUNT(*)
FROM wms_inbound_order
GROUP BY status, sap_post_status;
```

当前电脑未检测到 `mysql` 客户端，无法直接连接本机 MySQL 执行上述聚合 SQL。本轮已按 `sql/03_seed_business_data.sql` 和 `frontend/src/api/mock.ts` 的演示数据源完成清洗前识别，并新增 `sql/05_demo_status_cleanup.sql` 用于当前数据库安全迁移。

### 2.1 发运订单清洗前识别

| 状态 | SAP 状态 | 数量 | 是否推荐 | 处理建议 |
| --- | --- | ---: | --- | --- |
| PENDING_ALLOC | 空 | 2 | 否，兼容状态 | 转为 CREATED，SAP 状态补 NOT_POSTED |
| REVIEWED | 空 | 1 | 否，兼容状态 | 已拣货未发货，转为 PICKED |
| PICKING | 空 | 1 | 否，兼容状态 | 按已拣货数量转为 PARTIAL_PICKED |
| CALLBACK_SUCCESS | POSTED / 空 | 2 | 否 | 主状态转 CLOSED，SAP 状态转 SUCCESS |
| CALLBACK_FAILED | FAILED / 空 | 1 | 否 | 主状态转 CLOSED，SAP 状态保留 FAILED |
| ALLOCATED | 空 | 1 | 是 | SAP 状态补 NOT_POSTED |
| CREATED | NOT_POSTED | 2 | 是 | 保留 |
| PARTIAL_PICKED | NOT_POSTED | 1 | 是 | 保留 |
| PARTIAL_SHIPPED | SUCCESS | 1 | 是 | 保留 |

### 2.2 预期到货通知单清洗前识别

| 状态 | SAP 状态 | 数量 | 是否推荐 | 处理建议 |
| --- | --- | ---: | --- | --- |
| CREATED | 空 / NOT_POSTED | 4 | 是 | 空 SAP 状态补 NOT_POSTED |
| PARTIAL_RECEIVED | POSTED | 1 | 是 | SAP 状态 POSTED 转 SUCCESS |
| PARTIAL_RECEIVED | FAILED | 1 | 是 | 保留，用于 SAP 失败可重传演示 |
| RECEIVING | 空 | 前端 mock 旧初始化存在 | 否，兼容状态 | 按收货数量转 PARTIAL_RECEIVED / RECEIVED |
| BOUND | POSTED / 空 | 前端 mock 旧初始化存在 | 兼容状态 | 可判断已上架时转 ON_SHELF，否则保留兼容 |
| SAP_FAILED | 空 | 当前 seed 未新增 | 否 | 主状态按收货数量回推，SAP 状态转 FAILED |

## 3. 清洗规则

| 历史状态 | 清洗规则 |
| --- | --- |
| CALLBACK_SUCCESS | 主状态按数量回推；已发货完成的 demo 单据转 CLOSED，`sap_post_status=SUCCESS` |
| CALLBACK_FAILED | 主状态按数量回推；已发货完成的 demo 单据转 CLOSED，`sap_post_status=FAILED` |
| ALLOCATION_EXCEPTION | 不再作为订单主状态；按分配/拣货/发货数量回推，失败原因保留在异常/操作日志 |
| PENDING_ALLOC | 无分配时转 CREATED，有分配时转 PARTIAL_ALLOCATED / ALLOCATED |
| PICKING | 按拣货数量转 PARTIAL_PICKED / PICKED |
| REVIEWING / REVIEWED | 按拣货/发货数量转 PARTIAL_PICKED / PICKED / PARTIAL_SHIPPED / SHIPPED |
| SAP_FAILED | 不再作为入库订单主状态；按收货数量回推，`sap_post_status=FAILED` |
| RECEIVING | 按收货数量回推为 CREATED / PARTIAL_RECEIVED / RECEIVED |
| BOUND | 有收货/上架数量时按数量回推；无法判断的纯绑定历史状态保留兼容展示 |
| POSTED | 作为 SAP 历史兼容值转为 SUCCESS |

## 4. 清洗后状态分布

### 4.1 发运订单 seed 清洗后

| 状态 | SAP 状态 | 数量 |
| --- | --- | ---: |
| CREATED | NOT_POSTED | 4 |
| ALLOCATED | NOT_POSTED | 1 |
| PICKED | NOT_POSTED | 1 |
| PARTIAL_PICKED | NOT_POSTED | 2 |
| PARTIAL_SHIPPED | SUCCESS | 1 |
| CLOSED | SUCCESS | 2 |
| CLOSED | FAILED | 1 |

### 4.2 预期到货通知单 seed 清洗后

| 状态 | SAP 状态 | 数量 |
| --- | --- | ---: |
| CREATED | NOT_POSTED | 4 |
| PARTIAL_RECEIVED | SUCCESS | 1 |
| PARTIAL_RECEIVED | FAILED | 1 |
| RECEIVED | SUCCESS | 1 |
| ON_SHELF | SUCCESS | 1 |
| CANCELED | NOT_POSTED | 1 |

## 5. 保留的兼容状态

以下状态继续保留在字典和显示映射中，用于历史数据兼容，不作为新 demo 主流程推荐状态：

- 发运订单：PENDING_ALLOC、PICKING、REVIEWING、REVIEWED、CALLBACK_SUCCESS、CALLBACK_FAILED、ALLOCATION_EXCEPTION
- 预期到货通知单：RECEIVING、BOUND、SAP_FAILED
- SAP 回传：POSTED

## 6. 不再新增的历史状态

新 seed、mock 初始化和新增出库单默认值不再新增以下订单主状态：

- CALLBACK_SUCCESS
- CALLBACK_FAILED
- ALLOCATION_EXCEPTION
- PENDING_ALLOC
- PICKING
- REVIEWING
- REVIEWED
- SAP_FAILED
- RECEIVING

`BOUND` 仅作为包装绑定流程和历史兼容展示保留，不再作为预期到货通知单推荐主状态 seed。

## 7. Seed 更新说明

- `sql/01_schema.sql`：发运订单和发运订单明细默认状态从 `PENDING_ALLOC` 调整为 `CREATED`。
- `sql/03_seed_business_data.sql`：历史发运订单主状态迁移为 CREATED、PICKED、PARTIAL_PICKED、CLOSED；SAP 历史 `POSTED` 迁移为 `SUCCESS`；补齐入库 RECEIVED、ON_SHELF、CANCELED 演示单。
- `sql/05_demo_status_cleanup.sql`：新增可重复执行的当前库清洗脚本，仅更新出入库订单、明细和 SAP 状态，并写入一次性清洗操作日志。
- `frontend/src/api/mock.ts`：前端 mock 初始化和本地存储加载时自动迁移历史状态，避免页面刷新后旧状态反弹。

## 8. 页面验证结果

本轮验证结果：

- 前端构建已通过：`npm run build` 成功。
- 本地原型服务已验证可访问：`http://127.0.0.1:5179/` 返回 200。
- 已打开目标原型页：`http://127.0.0.1:5179/outbound/shipping-orders`。
- 内置浏览器自动化在刷新和读取 DOM 时连续超时，因此本轮未能稳定自动读取页面表格文本。

待人工或后续自动化复核项：

- 发运订单列表不再出现 CALLBACK_SUCCESS、CALLBACK_FAILED、ALLOCATION_EXCEPTION 作为主状态标签。
- 发运订单 SAP 成功/失败通过 `sap_post_status` 显示。
- 预期到货通知单 CREATED 继续显示为“创建”。
- 入库 SAP 失败不再显示为订单主状态。
- 清洗后的 demo 场景仍覆盖创建、分配、拣货、发运、关闭、SAP 成功、SAP 失败、入库部分收货。

## 9. 后续建议

- 在后端增加一次正式数据库迁移版本，将 `sql/05_demo_status_cleanup.sql` 纳入部署流程。
- 后续如果启用 Flyway/Liquibase，建议把状态字典、状态清洗和演示数据版本化。
- 对旧 `BOUND` 入库单，如果后续需要严格收敛，可补充包装绑定与上架记录的判定字段后再迁移。
