# WMS 独立版 V2.4 冻结说明

## 一、冻结目标

本次冻结将当前 WMS PC 独立系统固化为 `WMS 独立版 V2.4`，用于后续迁移到供应链 SaaS 平台前的稳定基线。冻结目标不是继续开发业务功能，而是保留一个可运行、可演示、可回溯、可对照的独立版本，避免平台化改造破坏当前业务闭环。

## 二、版本标识

| 项目 | 内容 |
|---|---|
| 冻结版本 | WMS 独立版 V2.4 |
| 源仓库 | `https://github.com/zyhou0523-collab/wms-alpha.git` |
| 冻结来源分支 | `release/wms-pc-v2.3` |
| 建议稳定分支 | `release/wms-PCstandalone-v2.4` |
| 建议版本标签 | `PCwms-standalone-v2.4` |
| 冻结日期 | 2026-07-06 |
| 冻结性质 | 独立版稳定快照，供 SaaS 化迁移对照 |

## 三、冻结时 Git 检查结果

冻结前检查结果：

- 当前分支：`release/wms-pc-v2.3`。
- 远程仓库：`origin https://github.com/zyhou0523-collab/wms-alpha.git`。
- 最近发布点：`3af85e1 chore: release WMS PC V2.3`，带 tag `WMS_PC_V2.3`。
- 冻结前存在未提交内容，主要来自 V2.3 后续演示验证修复：
  - 入库预期到货通知单关闭流程、部分收货关单分单逻辑。
  - 出库发运订单完全发运/部分发运关闭分单弹窗修复。
  - 出入库关闭相关 mock demo 数据和 SQL 脚本。
  - 状态按钮权限和 schema/seed 补充。

本次冻结提交应包含上述未提交内容和本次新增冻结文档。

## 四、本次冻结包含的业务范围

| 模块 | 冻结内容 |
|---|---|
| 数据驾驶舱 | 库存概览、趋势、仓库地图、预警信息 |
| 工作台 | 业务待办、快捷入口、库存查询入口 |
| 基础数据 | 产品、客户、供应商、货主字段基础能力 |
| 仓库设置 | 仓库、库区、库位维护 |
| 入库管理 | 预期到货通知单、SN 采集、收货、取消收货、关闭、SAP 回传 |
| 出库管理 | 发运订单、分配、拣货、发货、取消操作、关闭、SAP 回传、条码打印 |
| 库存管理 | 库存查询、SN 查询、库存移动、库存盘点、库存流水 |
| 报表中心 | 进出存、入库日报、出库日报、库龄、SN 报表 |
| 接口中心 | SAP/MES/履约/追溯 mock、接口日志、失败重试 |
| 系统管理 | 用户、角色、菜单、部门、岗位、字典、参数、日志、字段、数据权限 |
| 多语种 | `zh-CN`、`en-US`、`pt-BR`、`es-ES` 的基础状态词条和部分页面文案 |

## 五、技术栈与依赖

| 层级 | 当前实现 |
|---|---|
| 前端 | Vue 3、TypeScript、Element Plus、Pinia、Vue Router、Vite |
| 后端 | Java 17、Spring Boot 3.3.5、Spring JDBC、Spring Web、Validation |
| 数据库 | MySQL 8，初始化脚本位于 `sql/` |
| API 文档 | Springdoc OpenAPI，默认 `/swagger-ui/index.html` |
| 本地演示 | Vite dev server，支持 `VITE_USE_MOCK=true` 前端 mock 模式 |
| 外部系统 | SAP、MES、Fulfillment、Trace、CRM 均为 mock 对接 |

## 六、启动方式

### 完整后端模式

```bash
docker compose up -d mysql

mysql -uroot -p123456 wms_alpha < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql
mysql -uroot -p123456 wms_alpha < sql/03_seed_business_data.sql
mysql -uroot -p123456 wms_alpha < sql/04_seed_status_governance.sql
mysql -uroot -p123456 wms_alpha < sql/05_demo_status_cleanup.sql
mysql -uroot -p123456 wms_alpha < sql/06_inbound_close_flow.sql
mysql -uroot -p123456 wms_alpha < sql/07_outbound_close_flow.sql

cd backend
mvn spring-boot:run

cd ../frontend
npm install
npm run dev
```

### 前端 mock 演示模式

```powershell
cd frontend
npm install
$env:VITE_USE_MOCK="true"
npm run dev
```

## 七、环境变量

| 变量 | 含义 | 默认值 |
|---|---|---|
| `SERVER_PORT` | 后端端口 | `8080` |
| `MYSQL_HOST` | MySQL 地址 | `localhost` |
| `MYSQL_PORT` | MySQL 端口 | `3306` |
| `MYSQL_DATABASE` | 数据库名 | `wms_alpha` |
| `MYSQL_USERNAME` | 数据库用户 | `root` |
| `MYSQL_PASSWORD` | 数据库密码 | `123456` |
| `WMS_DB_URL` | Spring JDBC URL | 见 `.env.example` |
| `WMS_DB_USER` | Spring 数据库用户 | `root` |
| `WMS_DB_PASSWORD` | Spring 数据库密码 | `123456` |
| `VITE_API_BASE_URL` | 前端 API 基地址 | `/api` |
| `VITE_USE_MOCK` | 前端 mock 开关 | `false` |

## 八、验证结果

| 验证项 | 结果 |
|---|---|
| 前端构建 | `npm.cmd run build` 通过 |
| 前端访问 | `http://127.0.0.1:5179/outbound/shipping-orders` 返回 200 |
| 页面验证 | 发运订单页面可访问，三张 V2.4 出库关闭演示单可见 |
| 后端本机探测 | `http://127.0.0.1:8080/api/auth/me` 当前本机未连接，后端未运行 |
| Maven 环境 | 当前电脑未检测到 `mvn`，仓库也未提供 Maven Wrapper |
| Java 环境 | 当前电脑未检测到 `java` 命令 |

说明：后端代码结构和依赖已检查，但当前本机环境缺少 Java/Maven，无法在本机完成 `mvn clean test` 或启动后端验证。后续在具备 JDK 17 和 Maven 3.8+ 的环境执行后端验证。

核心页面轻量验证结果：

| 路由 | 验证文本 | 结果 |
|---|---|---|
| `/dashboard` | 数据驾驶舱 | 通过 |
| `/inbound/arrival-notices` | 预期到货通知单 | 通过 |
| `/outbound/shipping-orders` | 发运订单 | 通过 |
| `/inventory/list` | 库存查询 | 通过 |
| `/system/users` | 用户管理 | 通过 |

## 九、默认账号

| 账号 | 密码 | 角色 |
|---|---|---|
| `admin` | `admin123` | 系统管理员 |
| `wh_admin` | `123456` | WMS 主管 |
| `inbound01` | `123456` | 入库操作员 |
| `outbound01` | `123456` | 出库发运员 |
| `inventory01` | `123456` | 库存管理员 |
| `masterdata01` | `123456` | 主数据管理员 |
| `interface01` | `123456` | 接口管理员 |
| `owner3060` | `123456` | 货主查看员 |

这些账号仅用于本地 demo，不可作为生产账号方案。

## 十、冻结后禁止事项

1. 不在冻结分支上继续大规模业务改造。
2. 不直接删除历史 demo 数据和兼容状态。
3. 不把 SaaS 多租户、统一认证、真实 SAP/MES 改造直接混入独立版冻结分支。
4. 不把真实密码、token、API Key 或客户真实数据提交到仓库。
5. 不覆盖 `main`、`release/wms-pc-v2.3`、`release/wms-pc-v2.2` 等历史分支。

## 十一、相关文档

- [WMS 当前功能清单](./WMS_CURRENT_FEATURE_LIST.md)
- [WMS 当前数据库结构说明](./WMS_CURRENT_DATABASE_STRUCTURE.md)
- [WMS 当前接口初步清单](./WMS_CURRENT_API_LIST.md)
- [WMS 后续 SaaS 化迁移注意事项](./WMS_SAAS_MIGRATION_NOTES.md)
- [WMS PC V2.3 发布说明](./RELEASE_NOTE_V2.3.md)
