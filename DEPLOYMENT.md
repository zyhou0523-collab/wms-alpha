# Deployment

## 本地开发部署

```bash
docker compose up -d mysql
cd backend && mvn spring-boot:run
cd ../frontend && npm install && npm run dev
```

## 前端部署

可选方案：

- Vercel
- Netlify
- Nginx 静态站点
- 云服务器静态目录

构建：

```bash
cd frontend
npm install
npm run build
```

部署 `frontend/dist`。

生产环境需要设置：

```text
VITE_API_BASE_URL=https://your-backend-domain/api
```

## 后端部署

可选方案：

- 云服务器 + Java 17 + Maven
- Docker 镜像
- Render / Railway 等托管平台

构建：

```bash
cd backend
mvn clean package
```

运行：

```bash
java -jar target/*.jar
```

环境变量：

```text
SERVER_PORT=8080
WMS_DB_URL=jdbc:mysql://<host>:3306/wms_alpha?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
WMS_DB_USER=<user>
WMS_DB_PASSWORD=<password>
```

## 数据库部署

推荐 MySQL 8。

初始化顺序：

```bash
mysql -u<user> -p < sql/01_schema.sql
mysql -u<user> -p wms_alpha < sql/02_seed_master_data.sql
mysql -u<user> -p wms_alpha < sql/03_seed_business_data.sql
```

## Docker Compose

当前 Compose 至少提供 MySQL 一键启动：

```bash
docker compose up -d mysql
```

前后端默认采用本地启动，便于 Codex 或开发者调试源码。

## 在线演示建议

- 前端：Vercel / Netlify / Nginx
- 后端：云服务器 / Render / Railway
- 数据库：云 MySQL
- 前端设置 `VITE_API_BASE_URL` 指向后端 `/api`
- 后端设置 `WMS_CORS_ALLOWED_ORIGINS` 允许前端域名
