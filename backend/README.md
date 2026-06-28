# WMS Alpha Backend

## 技术栈

- Java 17
- Spring Boot 3
- Spring Web
- Spring JDBC
- MySQL 8

## 启动

```bash
cd backend
mvn spring-boot:run
```

默认连接：

```text
jdbc:mysql://localhost:3306/wms_alpha
user: root
password: 123456
```

可通过环境变量覆盖：

```bash
set WMS_DB_URL=jdbc:mysql://localhost:3306/wms_alpha
set WMS_DB_USER=root
set WMS_DB_PASSWORD=123456
```

## 关键接口

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/menus`
- `GET /api/products`
- `GET /api/warehouses`
- `GET /api/inventory`
- `GET /api/dashboard/summary`
- `POST /api/mock/mes/sn-push`

Swagger 地址：`http://localhost:8080/swagger-ui/index.html`

