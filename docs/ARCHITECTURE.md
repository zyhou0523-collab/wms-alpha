# WMS Alpha 系统架构说明

## 1. 建设目标

WMS Alpha 用于验证新能源仓储核心业务是否可以替代现有 FLUX WMS 的关键演示链路。系统优先保证本地可启动、可演示、可评审、可继续工程化，不在 Alpha 阶段追求复杂策略引擎、PDA 原生端、高并发和真实三方系统集成。

## 2. 总体架构

```text
Browser
  |
  | Vue3 + Element Plus + Vite
  v
Frontend SPA
  |
  | REST API / Mock fallback
  v
Spring Boot Backend
  |
  | JDBC
  v
MySQL 8

External Mock Systems
  |-- SAP
  |-- MES
  |-- Fulfillment
  |-- CRM
  `-- Trace
```

## 3. 前端架构

- 技术栈：Vue3、Vite、TypeScript、Element Plus、Pinia、Vue Router、Axios。
- 风格：参考若依 RuoYi 后台，包含左侧菜单、顶部导航、面包屑、内容区列表页。
- 页面模式：查询条件、工具按钮、数据表格、分页、详情/编辑弹窗。
- Mock 支持：通过 `VITE_USE_MOCK=true` 可启用前端本地 Mock，默认调用后端 API。

## 4. 后端架构

- 技术栈：Java 17、Spring Boot 3、Spring Web、Spring JDBC、MySQL Driver、Springdoc OpenAPI。
- 接口风格：REST API，统一返回 `{ code, message, data }`。
- 权限：Alpha 版使用简化 token 和角色模拟，默认用户来自 `sys_user`。
- 数据访问：使用 `NamedParameterJdbcTemplate`，便于后续替换 MyBatis Plus 或 JPA。
- Mock 集成：提供 `/api/mock/**` 接口并记录接口日志。

## 5. 数据架构

数据库为 MySQL 8，核心域包括：

- 主数据：产品、客户、供应商。
- 仓库配置：仓库、库区、库位。
- 库存域：库存、SN、托盘/箱/SN 绑定。
- 单据域：入库单、出库单及明细。
- 集成域：接口日志、操作日志。
- 系统域：用户和角色模拟。

## 6. 模块边界

- `masterdata`：产品、客户、供应商。
- `warehouse`：仓库、库区、库位。
- `inventory`：库存查询和安全/库龄预警。
- `serial`：SN 查询和追溯状态。
- `inbound`：入库单查询与演示数据。
- `outbound`：出库单查询与演示数据。
- `interfacecenter`：Mock 接口和接口日志。
- `dashboard`：库存 KPI、预警和趋势。
- `system`：用户、菜单、角色模拟。

## 7. Alpha 版非功能约束

- 本地演示优先，默认不接入企业统一认证。
- 接口请求保留日志，为真实系统接入预留字段。
- 数据量以演示数据为主，暂不做复杂分库分表和性能优化。
- 关键业务状态先用枚举字段模拟，正式版再抽象工作流。

