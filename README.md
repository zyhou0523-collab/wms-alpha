# WMS Alpha

## 项目简介

WMS Alpha 是面向制造业新能源成品仓储场景的 WMS 原型系统，用于演示基础数据、仓库库位、库存 SN、入库闭环、SAP Mock 回传、接口日志和操作日志等核心能力。

当前工程已经整理为可发布到 GitHub / Gitee / GitLab 的标准全栈项目，便于后续通过 Git 地址拉取代码、启动本地 Web 页面并继续迭代。

## 当前版本

WMS PC V1.5

## V1.5 发布信息

- 版本号：V1.5
- 版本类型：PC 端阶段版本
- Git 仓库：https://github.com/zyhou0523-collab/wms-alpha.git
- 发布分支：release/wms-pc-v1.5
- 发布 Tag：WMS_PC_V1.5
- 本版本重点：发货管理模块、数据驾驶舱看板、数据报表

## 已完成功能

- 数据驾驶舱
- 基础数据：产品主数据、客户/供应商/货主主数据
- 仓库设置：仓库、库区、库位
- 库存管理：库存查询、SN 查询
- 入库管理：预期到货通知单、主从结构、行明细展开
- 新建入库单、产品行复制、SN 管理和非 SN 管理差异收货
- SN 采集、托盘/箱/SN 绑定、SN 绑定列表
- 收货确认、SAP 入库 Mock 回传、失败重传
- 产品/客户/入库单/SN 绑定导入导出
- 接口日志、操作日志
- 出库 Alpha 原型页面和 Mock 数据

## 技术栈

- 前端：Vue 3 + TypeScript + Element Plus + Vite
- 后端：Java 17 + Spring Boot 3 + Spring JDBC
- 数据库：MySQL 8
- 接口：REST API + Swagger UI
- 演示：Vite 本地开发服务，支持前端 Mock 模式

## 快速启动

请查看 [QUICK_START.md](./QUICK_START.md)。

最短路径：

```bash
git clone <your-git-url>
cd wms-alpha
docker compose up -d mysql

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

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | 系统管理员 |
| wh_admin | 123456 | 仓库管理员 |
| planner | 123456 | 计划人员 |
| logistics | 123456 | 物流人员 |
| aftersale | 123456 | 售后人员 |
| manager | 123456 | 管理层 |

## 目录说明

```text
wms-alpha/
├── backend/              # Spring Boot 后端
├── frontend/             # Vue 3 前端
├── sql/                  # 标准数据库初始化脚本
├── database/             # 历史数据库脚本备份
├── docs/                 # 产品、架构、数据库、API、演示文档
├── mock/                 # 外部系统 Mock 样例数据
├── scripts/              # 初始化、启动、构建、发布检查脚本
├── screenshots/          # 演示截图占位目录
├── docker-compose.yml    # MySQL 一键启动
├── .env.example          # 环境变量模板
└── README.md
```

## Codex / 开发者通过 Git 地址启动演示

```bash
git clone <your-git-url>
cd wms-alpha

# 启动数据库
docker compose up -d mysql

# 启动后端
cd backend
mvn spring-boot:run

# 启动前端
cd ../frontend
npm install
npm run dev
```

浏览器访问：

```text
http://localhost:5173
```

如果只需要前端 Mock 演示：

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

## Web 演示说明

入库演示路径请查看 [DEMO_GUIDE.md](./DEMO_GUIDE.md)。

部署到在线环境请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 已知问题

请查看 [docs/KNOWN_ISSUES.md](./docs/KNOWN_ISSUES.md)。

## 后续计划

- 出库闭环继续增强：分配、拣货、复核、发货、SAP 扣减、追溯回传
- 接口中心增强：Mock 配置、失败重试、异常处理
- 库存策略：FIFO、批次、库龄、冻结、补货
- VMI、RMA、售后维修、盘点、打印标签
- Excel 多 Sheet 正式导入导出替换当前 CSV Alpha 能力
