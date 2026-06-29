# WMS Alpha

WMS Alpha 是面向新能源制造业成品仓储场景的 WMS PC 端原型系统，用于演示基础数据、仓库设置、入库闭环、出库 / 发货闭环、库存查询、SN 追溯、库存移动、库存盘点、数据驾驶舱、数据报表和系统管理等核心能力。

当前版本：**WMS PC V2.0.1**

Git 仓库：https://github.com/zyhou0523-collab/wms-alpha.git

## V2.0.1 发布信息

- 版本号：V2.0.1
- 版本类型：PC 端系统管理增强版本
- 发布日期：2026-06-29
- 发布分支：`release/wms-pc-v2.0.1`
- 发布 Tag：`WMS_PC_V2.0.1`
- 版本说明：在 V2.0 基础上补齐系统管理模块，按照若依 RuoYi 风格完善用户、角色、菜单、部门、岗位、字典、参数、通知公告、操作日志、登录日志、字段管理和数据权限能力。

## 主要功能模块

- 数据驾驶舱：全球库存看板、KPI 指标、世界地图库存分布、全球 / 地区部 / 仓库层级穿透、安全库存预警、呆滞库存预警。
- 工作台：待办入口、库存查询、安全库存预警、业务单据入口。
- 基础数据：产品主数据、客户 / 供应商 / 货主主数据。
- 仓库设置：仓库、库区、库位、托盘码打印。
- 入库管理：预期到货通知单、SN 采集 / 托盘箱码绑定、收货确认、取消收货、SAP 入库回传与重传、导入导出。
- 出库 / 发货管理：发运订单、库存分配、人工指定分配、拣货、发货、取消分配、取消拣货、取消发货、订单关闭、部分发运、分单处理、SAP 出库回传。
- 库存管理：库存查询、SN 查询、多货主库存、库存移动、库存查询快捷移动、库存盘点、库存流水。
- 数据报表：进出存报表、入库日报表、出库日报表、标准库龄报表、分段库龄报表、出库 SN 报表、入库 SN 报表。
- 接口中心：SAP Mock、MES Mock、履约系统 Mock、追溯系统 Mock、接口日志、失败重试。
- 系统管理：用户管理、角色管理、菜单管理、部门管理、岗位管理、字典管理、参数设置、通知公告、操作日志、登录日志、字段管理、数据权限、接口日志。

## 技术栈

- 前端：Vue 3 + TypeScript + Element Plus + Vite + ECharts
- 后端：Java 17 + Spring Boot 3 + Spring JDBC
- 数据库：MySQL 8
- 接口：REST API + Swagger UI
- 演示：Vite 本地开发服务，支持前端 Mock 模式

## 快速启动

完整步骤请查看 [QUICK_START.md](./QUICK_START.md)。

```bash
git clone https://github.com/zyhou0523-collab/wms-alpha.git
cd wms-alpha
git checkout release/wms-pc-v2.0.1

docker compose up -d mysql

mysql -uroot -p123456 < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql

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

## 演示说明

- 入库演示路径请查看 [DEMO_GUIDE.md](./DEMO_GUIDE.md)。
- V2.0.1 发布说明请查看 [docs/RELEASE_NOTE_V2.0.1.md](./docs/RELEASE_NOTE_V2.0.1.md)。
- 部署到在线环境请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

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
- `release/wms-pc-v2.0`：WMS PC V2.0 发布分支，追加库存移动、库存盘点和库存查询快捷移动。
- `release/wms-pc-v2.0.1`：WMS PC V2.0.1 发布分支，追加系统管理增强能力。

## 已知问题

请查看 [docs/KNOWN_ISSUES.md](./docs/KNOWN_ISSUES.md)。

## 后续计划

- PDA / 移动端作业。
- 与真实 SAP / MES / 履约系统接口联调。
- 更细粒度按钮权限与数据权限拦截。
- 审计日志和安全策略增强。
