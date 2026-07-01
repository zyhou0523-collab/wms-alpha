# WMS移动端正式接口替换联调检查报告

## 1. 本轮结论

本轮未将移动端 mock service 切换为正式后端接口。

原因：本机正式后端服务 `http://localhost:8080` 当前不可连接。按照任务前提“只有在后端接口已确认可用、字段已确认、状态枚举已确认的情况下，才执行正式接口替换”，本轮保留移动端 mock service，避免破坏当前移动端可演示状态。

## 2. 已完成检查

### 2.1 service 与后端路径核对

移动端已具备统一请求层：

- `mobile/src/api/request.ts`
- `mobile/src/api/auth.ts`
- `mobile/src/api/inbound.ts`
- `mobile/src/api/outbound.ts`
- `mobile/src/api/inventory.ts`
- `mobile/src/api/mock.ts`

后端正式接口路径已在代码层面确认存在：

- `backend/src/main/java/com/company/wms/auth/AuthController.java`
- `backend/src/main/java/com/company/wms/inbound/InboundController.java`
- `backend/src/main/java/com/company/wms/outbound/ShippingOrderController.java`
- `backend/src/main/java/com/company/wms/query/QueryController.java`
- `backend/src/main/java/com/company/wms/workbench/WorkbenchController.java`

### 2.2 本机接口探测结果

探测基础地址：

```text
http://localhost:8080
```

| 接口 | 结果 | 说明 |
| --- | --- | --- |
| `GET /api/auth/me` | 失败 | 无法连接到远程服务器 |
| `GET /api/inbound-orders?pageNum=1&pageSize=1` | 失败 | 无法连接到远程服务器 |
| `GET /api/outbound-orders?pageNum=1&pageSize=1` | 失败 | 无法连接到远程服务器 |
| `GET /api/inventory?pageNum=1&pageSize=1` | 失败 | 无法连接到远程服务器 |
| `GET /api/serial-numbers?pageNum=1&pageSize=1` | 失败 | 无法连接到远程服务器 |
| `GET /api/workbench/summary` | 失败 | 无法连接到远程服务器 |

## 3. 已替换真实接口清单

无。

本轮没有执行正式接口替换，也没有修改页面调用方式、service 方法名、请求参数或响应适配逻辑。

## 4. 保留 mock 的接口清单

以下接口继续保留 `mobile/src/api/mock.ts`：

| 模块 | 接口范围 | 保留原因 |
| --- | --- | --- |
| 登录与用户信息 | `/api/auth/login`, `/api/auth/me` | 后端服务不可连接，无法确认登录和 token 结构。 |
| 首页统计 | `/api/workbench/summary` | 后端服务不可连接，无法确认统计字段。 |
| 入库查询 | `/api/inbound-orders`, `/api/inbound-orders/{id}` | 后端服务不可连接，无法验证分页和详情结构。 |
| 入库SN采集 | SN上下文、校验、确认、取消采集 | 后端服务不可连接，不能验证 `orderId/lineId/productId` 等必填校验。 |
| 入库收货 | `/receive`, `/receipts/{receiptId}/cancel` | 后端服务不可连接，不能验证收货记录和状态回退。 |
| 入库SAP | `/sap-post`, `/retry-sap` | 后端服务不可连接，不能验证接口日志和失败重传结构。 |
| 出库查询 | `/api/outbound-orders`, `/api/outbound-orders/{id}` | 后端服务不可连接，无法验证发运订单详情结构。 |
| 出库分配 | 自动分配、人工分配、取消分配 | 后端服务不可连接，不能验证库存校验和状态规则。 |
| 出库拣货 | `/pick`, `/pick-scan`, `/picks/cancel` | 后端服务不可连接，不能验证扫码拣货和重复扫描规则。 |
| 出库发货 | `/ship`, `/shipments/{shipmentId}/cancel` | 后端服务不可连接，不能验证库存扣减和 SN 状态回退。 |
| 出库SAP | `/post-sap`, `/retry-sap` | 后端服务不可连接，不能验证出库 SAP 回传状态。 |
| 库存查询 | `/api/inventory` | 后端服务不可连接，不能验证多货主库存字段。 |
| SN查询 | `/api/serial-numbers` | 后端服务不可连接，不能验证 SN 状态、货主、库位字段。 |

## 5. 本轮修改文件

仅新增文档：

- `docs/mobile-real-api-cutover-test-report.md`

未修改：

- 移动端页面文件
- 移动端 service 文件
- 移动端请求层
- 后端接口
- PC端页面
- mock 数据

## 6. 联调测试结果

由于后端服务不可连接，本轮只能完成连接性检查，不能执行真实业务接口联调。

| 测试项 | 结果 |
| --- | --- |
| 入库单列表加载 | 未执行，后端不可连接 |
| 入库单详情加载 | 未执行，后端不可连接 |
| SN采集提交 | 未执行，后端不可连接 |
| 取消SN采集 | 未执行，后端不可连接 |
| 收货提交 | 未执行，后端不可连接 |
| 取消收货 | 未执行，后端不可连接 |
| 入库SAP回传 | 未执行，后端不可连接 |
| 入库SAP重传 | 未执行，后端不可连接 |
| 发运订单列表加载 | 未执行，后端不可连接 |
| 发运订单详情加载 | 未执行，后端不可连接 |
| 自动分配 | 未执行，后端不可连接 |
| 人工分配 | 未执行，后端不可连接 |
| 取消分配 | 未执行，后端不可连接 |
| 扫码拣货 | 未执行，后端不可连接 |
| 取消拣货 | 未执行，后端不可连接 |
| 发货 | 未执行，后端不可连接 |
| 取消发货 | 未执行，后端不可连接 |
| 出库SAP回传 | 未执行，后端不可连接 |
| 出库SAP重传 | 未执行，后端不可连接 |
| 库存查询 | 未执行，后端不可连接 |
| SN查询 | 未执行，后端不可连接 |

## 7. 异常测试结果

已验证异常：

| 异常项 | 结果 |
| --- | --- |
| 网络异常 / 后端不可连接 | 已验证，`localhost:8080` 连接失败 |

未执行异常：

- 500错误
- 401未登录
- 403无权限
- 参数缺失
- 状态不允许操作
- 数量超限
- SN重复
- 库存不足
- SAP回传失败
- 后端返回空数据

原因：后端服务不可连接，无法进入业务接口层。

## 8. 发现的后端问题

当前环境下最直接问题是：

```text
http://localhost:8080 无法连接
```

可能原因：

1. 后端 Spring Boot 未启动。
2. 后端端口不是 8080。
3. 后端启动失败。
4. 数据库未启动或后端连接数据库失败。
5. 本机防火墙或进程端口占用异常。

## 9. 需要后端补充或确认

后端服务恢复后，仍需逐项确认：

1. 登录返回字段：`token`, `user.role_code`, `warehouse_scope`。
2. 入库详情返回：`lines/details`, `serialNumbers`, `receiptRecords`, `operationLogs`, `interfaceLogs`。
3. SN采集取消返回结构：是否包含 `successCount`, `failedItems`。
4. 收货接口是否返回 `receiptNo`。
5. 入库 SAP 重传返回结构。
6. 出库批量取消分配、拣货、发货返回结构。
7. 出库 SAP 重传参数使用 `orderId` 还是 `orderIds`。
8. 拣货页面应调用 `/pick` 还是 `/pick-scan`。
9. 库存查询和 SN 查询是否补齐多货主字段。
10. 统一错误码和错误消息格式。

## 10. 回滚方式

本轮没有切换真实接口，因此无需业务回滚。

如后续已切换真实接口后需要回滚 mock：

```bash
cd mobile
$env:VITE_USE_MOCK="true"
npm run dev
```

或删除/不设置 `VITE_USE_MOCK=false`，开发环境会默认走 mock。

## 11. 后续建议

1. 先启动并确认后端：`http://localhost:8080` 可访问。
2. 用 `GET /api/auth/me`、`GET /api/inbound-orders`、`GET /api/outbound-orders` 先做只读接口烟测。
3. 只读接口成功后，将移动端开发环境设置为 `VITE_USE_MOCK=false`。
4. 按查询类、入库操作类、出库操作类的顺序逐步联调。
5. 每替换一类接口，立即执行移动端构建和核心流程回归。
6. 在正式切换前，不要删除 `mobile/src/api/mock.ts`，保留作为演示和回归兜底。

