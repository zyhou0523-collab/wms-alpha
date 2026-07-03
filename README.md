# WMS Alpha

WMS Alpha 是面向新能源制造业成品仓储场景的 WMS PC 端原型系统，用于演示基础数据、仓库设置、入库闭环、出库 / 发运闭环、库存查询、SN 追踪、库存移动、库存盘点、数据驾驶舱、报表中心、接口中心、系统管理和多语种基础能力。

当前版本：**WMS PC V2.3**

Git 仓库：https://github.com/zyhou0523-collab/wms-alpha.git

## V2.3 发布信息

- 版本号：WMS PC V2.3
- 版本类型：PC 端演示环境治理与稳定版
- 发布日期：2026-07-03
- 发布分支：`release/wms-pc-v2.3`
- 发布 Tag：`WMS_PC_V2.3`
- 发布说明：[docs/RELEASE_NOTE_V2.3.md](./docs/RELEASE_NOTE_V2.3.md)

## 主要功能模块

- 数据驾驶舱：全局库存看板、KPI 指标、库存分布、库存预警和业务趋势展示。
- 工作台：待办入口、库存快捷查询、业务单据入口和演示导航。
- 基础数据：产品、客户、供应商、货主等主数据维护。
- 仓库设置：仓库、库区、库位、托盘码打印等仓储基础配置。
- 入库管理：预期到货通知单、SN 采集、收货确认、取消收货、SAP 入库回传和重传。
- 出库管理：发运订单、库存分配、人工指定分配、拣货、发货、取消分配、取消拣货、取消发货、关单、SAP 出库回传和重传。
- 库存管理：库存查询、SN 查询、多货主库存、库存移动、库存盘点和库存流水。
- 报表中心：进出存报表、入库日报、出库日报、库龄报表、SN 报表等演示报表。
- 接口中心：SAP Mock、MES Mock、履约系统 Mock、接口日志和失败重试。
- 系统管理：用户、角色、菜单、部门、岗位、字典、参数、通知公告、操作日志、登录日志、字段管理和数据权限。
- 多语种能力：初步支持 zh-CN、en-US、pt-BR、es-ES，已覆盖状态词条和部分页面文案。

## 技术栈

- 前端：Vue 3 + TypeScript + Element Plus + Vite + ECharts
- 后端：Java 17 + Spring Boot 3 + Spring JDBC
- 数据库：MySQL 8
- 接口：REST API + Swagger UI
- 演示：Vite 本地开发服务，支持前端 Mock 模式

## 本地启动

完整步骤请参考 [QUICK_START.md](./QUICK_START.md)。

```bash
git clone https://github.com/zyhou0523-collab/wms-alpha.git
cd wms-alpha
git checkout release/wms-pc-v2.3

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

访问地址：

- 前端：http://localhost:5173
- 后端：http://localhost:8080
- Swagger：http://localhost:8080/swagger-ui/index.html

如只需前端 Mock 演示：

```bash
cd frontend
npm install
VITE_USE_MOCK=true npm run dev
```

Windows PowerShell：

```powershell
cd frontend
npm install
$env:VITE_USE_MOCK="true"
npm run dev
```

## 默认账号

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

以上账号为本地 demo 环境账号，不应作为生产环境账号使用。

## 演示路径

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

更多演示说明请参考 [DEMO_GUIDE.md](./DEMO_GUIDE.md) 和 [docs/RELEASE_NOTE_V2.3.md](./docs/RELEASE_NOTE_V2.3.md)。

## 目录说明

```text
wms-alpha/
├── backend/              # Spring Boot 后端
├── frontend/             # Vue 3 前端
├── sql/                  # 标准数据库初始化脚本
├── database/             # 历史数据库脚本备份
├── docs/                 # 产品、架构、数据库、API、发布文档
├── mock/                 # 外部系统 Mock 样例数据
├── scripts/              # 初始化、启动、构建、发布检查脚本
├── screenshots/          # 演示截图占位目录
├── docker-compose.yml    # MySQL 一键启动
├── .env.example          # 环境变量模板
└── README.md
```

## 分支说明

- `main`：主线分支。
- `release/wms-pc-v1.5`：WMS PC V1.5 发布分支。
- `release/wms-pc-v2.0`：WMS PC V2.0 发布分支。
- `release/wms-pc-v2.0.1`：WMS PC V2.0.1 发布分支。
- `release/wms-pc-v2.2`：WMS PC V2.2 演示验证分支。
- `release/wms-pc-v2.3`：WMS PC V2.3 发布分支。

## V2.3 文档索引

- 状态治理说明：[docs/ORDER_STATUS_GOVERNANCE.md](./docs/ORDER_STATUS_GOVERNANCE.md)
- 按钮权限矩阵：[docs/ORDER_ACTION_PERMISSION_MATRIX.md](./docs/ORDER_ACTION_PERMISSION_MATRIX.md)
- demo 数据清洗报告：[docs/DEMO_DATA_STATUS_CLEANUP_REPORT.md](./docs/DEMO_DATA_STATUS_CLEANUP_REPORT.md)
- 状态产品决策清单：[docs/ORDER_STATUS_PRODUCT_DECISION_LIST.md](./docs/ORDER_STATUS_PRODUCT_DECISION_LIST.md)
- 多语种设计说明：[docs/WMS_I18N_DESIGN.md](./docs/WMS_I18N_DESIGN.md)

## 已知问题

- 当前多语种能力为初步能力，重点覆盖状态词条和部分页面文案，完整国际化仍需后续分批推进。
- 入库关闭流程、`BOUND` 是否作为主状态、出库复核状态是否保留等事项仍需产品确认。
- 本地环境若未安装 Maven / JDK，后端自动化测试需在具备 Java 构建工具的环境中执行。

## 后续计划

- 基于产品决策清单推进出入库状态体系下一轮确认。
- 完善多语种架构和后端错误消息国际化。
- 增强接口契约测试、端到端测试和发布流水线。
- 与真实 SAP / MES / 履约系统开展联调。
