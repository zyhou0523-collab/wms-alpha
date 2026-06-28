# Quick Start

## 1. 环境要求

- JDK 17+
- Maven 3.8+
- Node.js 18+
- npm 9+
- MySQL 8+
- Docker / Docker Compose 可选

## 2. 启动数据库

推荐使用 Docker：

```bash
docker compose up -d mysql
```

首次启动 MySQL 容器时会自动执行 `sql/` 下的初始化脚本：

- `sql/01_schema.sql`
- `sql/02_seed_master_data.sql`
- `sql/03_seed_business_data.sql`

手工初始化：

```bash
mysql -uroot -p123456 -e "CREATE DATABASE IF NOT EXISTS wms_alpha DEFAULT CHARACTER SET utf8mb4;"
mysql -uroot -p123456 wms_alpha < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql
mysql -uroot -p123456 wms_alpha < sql/03_seed_business_data.sql
```

## 3. 启动后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端默认读取：

```text
jdbc:mysql://localhost:3306/wms_alpha
user: root
password: 123456
```

可通过环境变量覆盖，参考 `.env.example`。

## 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

## 5. 默认访问地址

- 前端：http://localhost:5173
- 后端：http://localhost:8080
- Swagger：http://localhost:8080/swagger-ui/index.html

## 6. 默认账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| admin | admin123 | 系统管理员 |
| wh_admin | 123456 | 仓库管理员 |
| planner | 123456 | 计划人员 |
| logistics | 123456 | 物流人员 |

## 7. 前端 Mock 演示模式

无需启动后端和数据库：

```bash
cd frontend
npm install
VITE_USE_MOCK=true npm run dev
```

Windows PowerShell：

```powershell
$env:VITE_USE_MOCK="true"
npm run dev
```

## 8. 常见问题

- 如果前端接口 404，请确认后端已在 `http://localhost:8080` 启动。
- 如果数据库连接失败，请确认 MySQL 容器已启动，并检查 `WMS_DB_URL/WMS_DB_USER/WMS_DB_PASSWORD`。
- 如果重新初始化数据库，删除 MySQL volume 后重新执行 `docker compose up -d mysql`。

## 9. 发布前检查

Linux / macOS / Git Bash：

```bash
bash scripts/check-release.sh
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-release.ps1
```
