# WMS PC V2.3 发布说明

## 一、版本概述

WMS PC V2.3 是基于 `release/wms-pc-v2.2` 的演示环境治理与稳定版，发布分支为 `release/wms-pc-v2.3`，发布 tag 为 `WMS_PC_V2.3`。本版本重点不是扩展新功能，而是将前期完成的入库、出库、库存、系统管理、状态治理、多语种基础能力和 demo 数据修复成果整理为可发布、可演示、可继续迭代的版本。

## 二、版本范围

- 入库管理：预期到货通知单、SN 采集、收货、取消收货、SAP 回传。
- 出库 / 发运订单：发运订单、分配、拣货、发货、取消业务操作、关单、SAP 回传。
- 库存管理：库存查询、SN 查询、库存移动、库存盘点、库存流水。
- 数据驾驶舱：库存看板、业务指标和演示入口。
- 工作台：待办入口和业务快捷入口。
- 基础数据：产品、客户、供应商、货主等主数据。
- 仓库设置：仓库、库区、库位、托盘等基础配置。
- 报表中心：进出存、入库、出库、库龄和 SN 报表演示。
- 接口中心：SAP / MES / 履约系统 Mock 和接口日志。
- 系统管理：用户、角色、菜单、字典、参数、日志、字段和数据权限。
- 多语种能力：状态词条和部分页面文案的基础国际化。

## 三、V2.3新增和优化内容

- 整理并发布 WMS PC V2.3 版本文档。
- 完成发运订单、预期到货通知单、SAP 回传状态字典治理。
- 统一列表、详情、筛选项中的出入库状态显示。
- 统一发运订单和预期到货通知单按钮显示规则。
- 补齐后端状态校验，避免仅依赖前端隐藏按钮。
- 清洗历史 demo 数据中的不推荐订单主状态。
- 补齐可重复执行的状态治理和 demo 清洗 SQL。
- 补齐 zh-CN、en-US、pt-BR、es-ES 状态相关多语种词条。
- 新增状态治理、按钮权限矩阵、demo 数据清洗报告、产品决策清单等文档。

## 四、出库 / 发运订单优化说明

- 主状态统一为 `CREATED`、`PARTIAL_ALLOCATED`、`ALLOCATED`、`PARTIAL_PICKED`、`PICKED`、`PARTIAL_SHIPPED`、`SHIPPED`、`CLOSED`、`CANCELED`。
- 历史兼容状态 `PENDING_ALLOC`、`PICKING`、`REVIEWING`、`REVIEWED`、`CALLBACK_SUCCESS`、`CALLBACK_FAILED`、`ALLOCATION_EXCEPTION` 保留兼容展示，不再作为新 demo 的推荐主状态。
- SAP 回传结果统一使用 `sap_post_status`，不再使用回传成功 / 失败污染订单主状态。
- 按钮显示规则覆盖编辑、分配、拣货、发货、取消分配、取消拣货、取消发货、关闭、取消、SAP 回传和重传。
- 后端接口补充状态校验，非允许状态下返回明确错误原因。

## 五、入库 / 预期到货通知单优化说明

- 主状态统一为 `CREATED`、`PARTIAL_RECEIVED`、`RECEIVED`、`ON_SHELF`、`CLOSED`、`CANCELED`。
- `CREATED` 状态统一显示为“创建”，不再误显示为“待收货”。
- 历史兼容状态 `RECEIVING`、`BOUND`、`SAP_FAILED` 保留兼容展示，不再作为新 demo 的推荐主状态。
- `SAP_FAILED` 不再作为订单主状态，SAP 回传失败统一使用 `sap_post_status = FAILED`。
- 按钮显示规则覆盖编辑、采集 SN、收货、取消收货、上架、取消、SAP 回传和重传。

## 六、状态治理说明

- 新增和补齐系统字典类型：
  - `wms_outbound_order_status`
  - `wms_inbound_order_status`
  - `wms_sap_post_status`
- SAP 回传状态统一为 `NOT_POSTED`、`SUCCESS`、`FAILED`，历史值 `POSTED` 作为兼容值保留。
- 状态治理说明详见 [ORDER_STATUS_GOVERNANCE.md](./ORDER_STATUS_GOVERNANCE.md)。
- 按钮权限矩阵详见 [ORDER_ACTION_PERMISSION_MATRIX.md](./ORDER_ACTION_PERMISSION_MATRIX.md)。

## 七、多语种能力说明

- 当前版本初步支持 `zh-CN`、`en-US`、`pt-BR`、`es-ES`。
- 已重点补齐发运订单状态、预期到货通知单状态、SAP 回传状态相关词条。
- 全系统深度国际化、后端错误消息国际化、在线翻译能力仍作为后续优化项推进。
- 多语种设计说明详见 [WMS_I18N_DESIGN.md](./WMS_I18N_DESIGN.md)。

## 八、演示数据和全链路 demo 说明

V2.3 保留并整理以下演示场景：

- 发运订单创建、部分分配、完全分配、部分拣货、完全拣货、部分发运、完全发运、关闭且 SAP 成功、关闭且 SAP 失败。
- 入库预期到货通知单创建、部分收货、完全收货、已上架、SAP 回传失败、已取消。
- 库存查询、SN 查询、库存移动、库存盘点和库存流水。
- 系统管理中的用户、角色、菜单、字典、参数、日志、字段和数据权限演示。

demo 数据状态清洗详见 [DEMO_DATA_STATUS_CLEANUP_REPORT.md](./DEMO_DATA_STATUS_CLEANUP_REPORT.md)。

## 九、演示路径

- 出库 / 发运订单：`/outbound/shipping-orders`
- 入库 / 预期到货通知单：`/inbound/arrival-notices`
- 库存查询：`/inventory/list`
- SN 查询：`/inventory/sn`
- 库存移动：`/inventory/move`
- 库存盘点：`/inventory/count`
- 系统用户：`/system/users`
- 系统角色：`/system/roles`
- 系统菜单：`/system/menus`
- 系统字典：`/system/dict`

## 十、启动方式

```bash
docker compose up -d mysql

mysql -uroot -p123456 < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql
mysql -uroot -p123456 wms_alpha < sql/03_seed_business_data.sql
mysql -uroot -p123456 wms_alpha < sql/04_seed_status_governance.sql
mysql -uroot -p123456 wms_alpha < sql/05_demo_status_cleanup.sql

cd backend
mvn spring-boot:run

cd ../frontend
npm install
npm run dev
```

前端默认访问地址为 `http://localhost:5173`。当前演示环境也可使用实际启动端口，例如 `http://127.0.0.1:5179`。

## 十一、默认账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | 系统管理员 |
| wh_admin | 123456 | WMS 主管 |
| inbound01 | 123456 | 入库操作员 |
| outbound01 | 123456 | 出库发运员 |
| inventory01 | 123456 | 库存管理员 |
| masterdata01 | 123456 | 主数据管理员 |
| interface01 | 123456 | 接口管理员 |
| owner3060 | 123456 | 货主查看员 |

以上账号仅用于本地 demo 环境。

## 十二、已知问题

- 当前多语种能力仍为初步能力，未覆盖全系统所有文案。
- 入库是否需要“关闭”流程、`BOUND` 是否作为订单主状态、入库 SAP 回传按订单还是按收货批次展示，仍需产品确认。
- 出库 `REVIEWING` / `REVIEWED` 和 `PENDING_ALLOC` 的长期保留策略仍需产品确认。
- 如果本地未安装 Maven / JDK，后端自动化测试无法在本机执行。

## 十三、后续建议

- 先完成 [ORDER_STATUS_PRODUCT_DECISION_LIST.md](./ORDER_STATUS_PRODUCT_DECISION_LIST.md) 中的产品确认项。
- 将订单状态、作业任务状态、接口状态进一步拆分治理。
- 持续补齐端到端自动化测试和接口契约测试。
- 逐步推进全系统多语种和后端错误消息国际化。
- 接入真实 SAP / MES / 履约系统联调环境。
