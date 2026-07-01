# WMS移动端mock service与正式接口替换准备说明

## 1. 当前请求层结论

移动端已经具备统一请求层，页面没有直接绕过 service 调接口。

| 层级 | 文件 | 说明 |
| --- | --- | --- |
| 统一请求层 | `mobile/src/api/request.ts` | 所有 service 统一调用 `request()`；根据 `VITE_USE_MOCK` 决定走 mock 或真实后端。 |
| mock 数据与逻辑 | `mobile/src/api/mock.ts` | 覆盖登录、入库、出库、库存查询、SN 查询；包含成功和部分失败场景。 |
| 登录 service | `mobile/src/api/auth.ts` | 登录和当前用户信息。 |
| 入库 service | `mobile/src/api/inbound.ts` | 入库列表、详情、SN 采集、收货、SAP 回传、取消操作。 |
| 出库 service | `mobile/src/api/outbound.ts` | 发运订单、分配、拣货、发货、SAP 回传、取消操作。 |
| 库存 service | `mobile/src/api/inventory.ts` | 首页统计、库存查询、SN 查询。 |

当前 mock 开关规则：

```ts
isMockMode = import.meta.env.VITE_USE_MOCK === 'true'
  || (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK !== 'false')
```

因此开发环境默认走 mock；正式联调需要设置 `VITE_USE_MOCK=false`，并确认 `VITE_API_BASE_URL` 指向后端。

## 2. service清单

| 序号 | 模块 | service文件 | 方法名称 | 当前mock | 真实接口路径 | 方法 | 请求参数 | 响应结构 | 页面调用位置 | 是否需要后端正式化 | 替换风险 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 登录 | `mobile/src/api/auth.ts` | `loginApi` | 是 | `/api/auth/login` | POST | `username`, `password` | `{ token, user }` | `mobile/src/stores/user.ts`, `mobile/src/views/login/index.vue` | 已有后端接口，需确认角色字段 | 中 |
| 2 | 用户信息 | `mobile/src/api/auth.ts` | `meApi` | 是 | `/api/auth/me` | GET | 无 | `UserInfo` | `mobile/src/stores/user.ts` | 已有后端接口，需确认菜单权限字段 | 中 |
| 3 | 首页统计 | `mobile/src/api/inventory.ts` | `getWorkbenchSummary` | 是 | `/api/workbench/summary` | GET | 无 | `WorkbenchSummary` | 当前首页主要用入库/出库列表聚合，未直接调用该方法 | 需要确认是否作为正式首页统计入口 | 中 |
| 4 | 入库单列表 | `mobile/src/api/inbound.ts` | `listInboundOrders` | 是 | `/api/inbound-orders` | GET | `pageNum`, `pageSize`, `orderNo`, `supplier`, `inboundType`, `sapPlant`, `sapStorageLocation`, `status` | `PageResult<InboundOrder>` | `mobile/src/views/inbound/index.vue`, `mobile/src/views/home/index.vue` | 已有 | 低 |
| 5 | 入库单详情 | `mobile/src/api/inbound.ts` | `getInboundOrder` | 是 | `/api/inbound-orders/{id}` | GET | `id` | `InboundDetail` | `mobile/src/views/inbound/detail.vue`, `ReceivePage.vue` | 已有 | 低 |
| 6 | SN采集上下文 | `mobile/src/api/inbound.ts` | `getSnCollectContext` | 是 | `/api/inbound-orders/{orderId}/lines/{lineId}/sn-collect-context` | GET | `orderId`, `lineId` | `SnCollectContext` | `mobile/src/views/inbound/SnCollectPage.vue` | 已有 | 中 |
| 7 | 已采集SN | `mobile/src/api/inbound.ts` | `listCollectedSns` | 是 | `/api/inbound-orders/{orderId}/lines/{lineId}/collected-sns` | GET | `orderId`, `lineId` | `CollectedSn[]` | `SnCollectPage.vue` | 已有 | 中 |
| 8 | SN采集校验 | `mobile/src/api/inbound.ts` | `validateSnCollection` | 是 | `/api/inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection` | POST | `orderId`, `lineId`, `productId`, `palletCode`, `boxCode`, `serialNumbers`, `operator` | `SnValidationResult` | `SnCollectPage.vue` | 已有 | 中 |
| 9 | SN采集确认 | `mobile/src/api/inbound.ts` | `confirmSnCollection` | 是 | `/api/inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection` | POST | 同上 | `InboundDetail` | `SnCollectPage.vue` | 已有 | 中 |
| 10 | 取消SN采集 | `mobile/src/api/inbound.ts` | `cancelSnCollection` | 是 | `/api/inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection` | POST | `operator`, `serialNumbers` | `{ successCount }` 或后端结果 | `SnCollectPage.vue`, `inbound/detail.vue` | 已有，需确认返回结构 | 中 |
| 11 | 收货 | `mobile/src/api/inbound.ts` | `receiveInboundOrder` | 是 | `/api/inbound-orders/{orderId}/receive` | POST | `locationCode`, `operator`, `lines[{ lineId, productId, receiveQty, receiveSnList }]` | `InboundDetail & { receiptNo? }` | `ReceivePage.vue` | 已有 | 中 |
| 12 | 取消收货 | `mobile/src/api/inbound.ts` | `cancelInboundReceipt` | 是 | `/api/inbound-orders/{orderId}/receipts/{receiptId}/cancel` | POST | `operator`, `reason` | `InboundDetail` | `ReceivePage.vue`, `inbound/detail.vue` | 已有 | 中 |
| 13 | 入库SAP回传 | `mobile/src/api/inbound.ts` | `sapPostInboundOrder` | 是 | `/api/inbound-orders/{id}/sap-post` | POST | `operator` | `InboundDetail` | `inbound/index.vue`, `inbound/detail.vue` | 已有，后端兼容 `/post-sap` | 低 |
| 14 | 入库SAP重传 | `mobile/src/api/inbound.ts` | `retryInboundSap` | 是 | `/api/inbound-orders/retry-sap` | POST | `orderIds` | `{ successCount }` 或后端结果 | `inbound/index.vue`, `inbound/detail.vue` | 已有，需确认失败明细返回 | 中 |
| 15 | 取消入库单 | `mobile/src/api/inbound.ts` | `cancelInboundOrder` | 是 | `/api/inbound-orders/{id}/cancel` | POST | `operator`, `reason` | `InboundDetail` | `inbound/detail.vue` | 已有 | 中 |
| 16 | 发运订单列表 | `mobile/src/api/outbound.ts` | `listOutboundOrders` | 是 | `/api/outbound-orders` | GET | `pageNum`, `pageSize`, `orderNo`, `customer`, `shipFromCountry`, `productCode`, `status`, `sapPostStatus` | `PageResult<OutboundOrder>` | `outbound/index.vue`, `home/index.vue` | 已有 | 低 |
| 17 | 发运订单详情 | `mobile/src/api/outbound.ts` | `getOutboundOrder` | 是 | `/api/outbound-orders/{id}` | GET | `id` | `OutboundDetail` | `outbound/detail.vue`, `PickPage.vue`, `ShipPage.vue` | 已有 | 低 |
| 18 | 分配视图 | `mobile/src/api/outbound.ts` | `getOutboundAllocationView` | 是 | `/api/outbound-orders/{id}/allocations` | GET | `id` | `OutboundDetail` 含 `availableInventory`, `recommendedInventory` | `AllocationPage.vue` | 已有 | 中 |
| 19 | 自动分配 | `mobile/src/api/outbound.ts` | `allocateOutboundAuto` | 是 | `/api/outbound-orders/{id}/allocate-auto` | POST | `operator` | `OutboundDetail` | `AllocationPage.vue`, `outbound/detail.vue` | 已有 | 中 |
| 20 | 人工分配 | `mobile/src/api/outbound.ts` | `allocateOutboundManual` | 是 | `/api/outbound-orders/{id}/allocate-manual` | POST | `lineId`, `serialNumbers?`, `quantity?`, `locationCode?`, `operator` | `OutboundDetail` | `AllocationPage.vue` | 已有 | 中 |
| 21 | 整单取消分配 | `mobile/src/api/outbound.ts` | `releaseOutboundAllocation` | 是 | `/api/outbound-orders/{id}/release-allocation` | POST | `operator`, `reason` | `OutboundDetail` | `AllocationPage.vue`, `outbound/detail.vue` | 已有 | 中 |
| 22 | 指定取消分配 | `mobile/src/api/outbound.ts` | `cancelOutboundAllocations` | 是 | `/api/outbound-orders/{id}/allocations/cancel` | POST | `allocationIds`, `operator`, `reason` | `OutboundDetail` | `AllocationPage.vue`, `outbound/detail.vue` | 已有 | 中 |
| 23 | 拣货 | `mobile/src/api/outbound.ts` | `pickOutboundOrder` | 是 | `/api/outbound-orders/{id}/pick` | POST | `lineId`, `pickMode`, `serialNumbers?`, `quantity?`, `locationCode?`, `operator` | `OutboundDetail` | `PickPage.vue` | 已有 | 中 |
| 24 | 扫码拣货 | `mobile/src/api/outbound.ts` | `pickScanOutboundOrder` | 是 | `/api/outbound-orders/{id}/pick-scan` | POST | 同拣货 | `OutboundDetail` | 当前页面主要调用 `pickOutboundOrder`，扫码数据进入同一 payload | 已有，建议页面后续明确使用扫码接口 | 中 |
| 25 | 取消拣货 | `mobile/src/api/outbound.ts` | `cancelOutboundPick` | 是 | `/api/outbound-orders/{id}/picks/{pickId}/cancel` | POST | `operator`, `reason` | `OutboundDetail` | `PickPage.vue`, `outbound/detail.vue` | 已有 | 中 |
| 26 | 批量取消拣货 | `mobile/src/api/outbound.ts` | `cancelOutboundPicks` | 是 | `/api/outbound-orders/{id}/picks/cancel` | POST | `pickIds`, `operator`, `reason` | `OutboundDetail` | service 已有，页面当前主要用单条取消 | 已有，需确认返回结构 | 中 |
| 27 | 发货 | `mobile/src/api/outbound.ts` | `shipOutboundOrder` | 是 | `/api/outbound-orders/{id}/ship` | POST | `lineId?`, `shipQty?`, `carrierName`, `trackingNo`, `shipper`, `remark`, `forceSapFail?`, `forceTraceFail?`, `operator` | `OutboundDetail` | `ShipPage.vue` | 已有；`force*` 仅演示字段，正式接口需禁用 | 高 |
| 28 | 取消发货 | `mobile/src/api/outbound.ts` | `cancelOutboundShipment` | 是 | `/api/outbound-orders/{id}/shipments/{shipmentId}/cancel` | POST | `operator`, `reason` | `OutboundDetail` | `ShipPage.vue`, `outbound/detail.vue` | 已有 | 高 |
| 29 | 批量取消发货 | `mobile/src/api/outbound.ts` | `cancelOutboundShipments` | 是 | `/api/outbound-orders/{id}/shipments/cancel` | POST | `shipmentIds`, `operator`, `reason` | `OutboundDetail` 或批量结果 | service 已有，页面当前主要用单条取消 | 已有，需确认返回结构 | 高 |
| 30 | 出库SAP回传 | `mobile/src/api/outbound.ts` | `postOutboundSap` | 是 | `/api/outbound-orders/{id}/post-sap` | POST | `operator`, `forceSapFail` | `OutboundDetail` | `outbound/detail.vue` | 已有；`forceSapFail` 正式接口需禁用 | 中 |
| 31 | 出库SAP重传 | `mobile/src/api/outbound.ts` | `retryOutboundSap` | 是 | `/api/outbound-orders/retry-sap` | POST | `orderId`, `operator` | `OutboundDetail` | `outbound/detail.vue` | 已有，需确认单 ID / 数组参数统一 | 中 |
| 32 | 库存查询 | `mobile/src/api/inventory.ts` | `listInventory` | 是 | `/api/inventory` | GET | 任意筛选参数，默认 `pageNum`, `pageSize` | `PageResult<InventoryRow>` | `inventory/index.vue` | 已有 | 低 |
| 33 | SN查询 | `mobile/src/api/inventory.ts` | `listSerialNumbers` | 是 | `/api/serial-numbers` | GET | 任意筛选参数，默认 `pageNum`, `pageSize` | `PageResult<Record<string, unknown>>` | service 已有，当前库存页入口提示为扫码查询模式 | 已有，页面可进一步补独立列表 | 低 |

## 3. mock接口清单

当前 `mobile/src/api/mock.ts` 覆盖：

- `/auth/login`
- `/auth/me`
- `/workbench/summary`
- `/inbound-orders`
- `/inbound-orders/{id}`
- `/inbound-orders/{id}/receive`
- `/inbound-orders/{id}/sap-post`
- `/inbound-orders/{id}/post-sap`
- `/inbound-orders/{id}/cancel`
- `/inbound-orders/{id}/receipts/{receiptId}/cancel`
- `/inbound-orders/{orderId}/lines/{lineId}/sn-collect-context`
- `/inbound-orders/{orderId}/lines/{lineId}/collected-sns`
- `/inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection`
- `/inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection`
- `/inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection`
- `/inbound-orders/retry-sap`
- `/outbound-orders`
- `/outbound-orders/{id}`
- `/outbound-orders/{id}/allocations`
- `/outbound-orders/{id}/allocate-auto`
- `/outbound-orders/{id}/allocate-manual`
- `/outbound-orders/{id}/release-allocation`
- `/outbound-orders/{id}/allocations/cancel`
- `/outbound-orders/{id}/pick`
- `/outbound-orders/{id}/pick-scan`
- `/outbound-orders/{id}/picks/{pickId}/cancel`
- `/outbound-orders/{id}/picks/cancel`
- `/outbound-orders/{id}/ship`
- `/outbound-orders/{id}/shipments/{shipmentId}/cancel`
- `/outbound-orders/{id}/shipments/cancel`
- `/outbound-orders/{id}/post-sap`
- `/outbound-orders/retry-sap`
- `/inventory`
- `/serial-numbers`

## 4. 已接真实接口清单

移动端 service 已经全部按真实后端 URL 组织。当前运行时是否走真实接口取决于环境变量，不取决于页面层。

正式切换方式建议：

```bash
cd mobile
$env:VITE_USE_MOCK="false"
$env:VITE_API_BASE_URL="http://localhost:8080"
npm run dev
```

注意：`request.ts` 在 `baseURL=/api` 且 URL 以 `/api/` 开头时会自动去重，避免 `/api/api`。

## 5. 页面调用关系

| 页面 | service依赖 |
| --- | --- |
| `mobile/src/views/login/index.vue` | `useUserStore.login()` -> `loginApi()` |
| `mobile/src/stores/user.ts` | `loginApi()`, `meApi()` |
| `mobile/src/views/home/index.vue` | `listInboundOrders()`, `listOutboundOrders()`；未直接调用 `getWorkbenchSummary()` |
| `mobile/src/views/inbound/index.vue` | `listInboundOrders()`, `sapPostInboundOrder()`, `retryInboundSap()` |
| `mobile/src/views/inbound/detail.vue` | `getInboundOrder()`, `sapPostInboundOrder()`, `retryInboundSap()`, `cancelInboundOrder()`, `cancelSnCollection()`, `cancelInboundReceipt()` |
| `mobile/src/views/inbound/SnCollectPage.vue` | `getSnCollectContext()`, `listCollectedSns()`, `validateSnCollection()`, `confirmSnCollection()`, `cancelSnCollection()` |
| `mobile/src/views/inbound/ReceivePage.vue` | `getInboundOrder()`, `receiveInboundOrder()`, `cancelInboundReceipt()` |
| `mobile/src/views/outbound/index.vue` | `listOutboundOrders()` |
| `mobile/src/views/outbound/detail.vue` | `getOutboundOrder()`, `allocateOutboundAuto()`, `releaseOutboundAllocation()`, `cancelOutboundAllocations()`, `cancelOutboundPick()`, `cancelOutboundShipment()`, `postOutboundSap()`, `retryOutboundSap()` |
| `mobile/src/views/outbound/AllocationPage.vue` | `getOutboundAllocationView()`, `allocateOutboundAuto()`, `allocateOutboundManual()`, `releaseOutboundAllocation()`, `cancelOutboundAllocations()` |
| `mobile/src/views/outbound/PickPage.vue` | `getOutboundOrder()`, `pickOutboundOrder()`, `cancelOutboundPick()` |
| `mobile/src/views/outbound/ShipPage.vue` | `getOutboundOrder()`, `shipOutboundOrder()`, `cancelOutboundShipment()` |
| `mobile/src/views/inventory/index.vue` | `listInventory()`；`listSerialNumbers()` service 已有但页面未形成独立 SN 列表 |

## 6. 响应字段重点

### 入库

`InboundOrder` 主要字段：

- `id`, `order_no`, `source_order_no`, `inbound_type`, `source_system`
- `warehouse_code`, `warehouse_name`, `owner_code`, `owner_name`
- `supplier_code`, `supplier_name`
- `sap_plant`, `sap_storage_location`
- `status`, `sap_post_status`, `sap_post_result`, `sap_material_doc_no`
- `line_count`, `planned_qty`, `received_qty`, `collected_qty`, `pending_receive_qty`

`InboundDetail` 主要字段：

- `order`
- `details` / `lines`
- `serialNumbers`
- `receiptRecords`
- `operationLogs`
- `interfaceLogs`

### SN采集

`SnCollectionPayload` 必须保持：

- `orderId`
- `lineId`
- `productId`
- `palletCode`
- `boxCode`
- `serialNumbers`
- `operator`

这是后续正式化最高优先级校验点，页面层不得绕过 `lineId`。

### 出库

`OutboundOrder` 主要字段：

- `id`, `order_no`, `shipment_order_no`, `order_type`, `outbound_type`
- `warehouse_code`, `warehouse_name`, `owner_code`, `owner_name`
- `customer_code`, `customer_name`, `ship_from_country`
- `status`, `sap_post_status`, `sap_post_result`, `sap_material_doc_no`
- `line_count`, `planned_qty`, `allocated_qty`, `picked_qty`, `shipped_qty`

`OutboundDetail` 主要字段：

- `order`
- `details` / `lines`
- `allocations`
- `pickingRecords`
- `shipments`
- `operationLogs`
- `interfaceLogs`
- `availableInventory`
- `recommendedInventory`

### 库存

`InventoryRow` 当前移动端字段较少：

- `id`
- `warehouse_code`, `warehouse_name`
- `location_code`
- `product_code`, `product_name`
- `total_qty`, `available_qty`, `allocated_qty`
- `inventory_status`

正式替换时建议补齐：

- `owner_code`, `owner_name`
- `area_code`
- `batch_no`
- `pallet_code`, `box_code`
- `sn_managed`
- `frozen_qty`, `quality_status`

## 7. 替换优先级

| 优先级 | 范围 | 原因 |
| --- | --- | --- |
| P0 | 登录、用户信息、权限字段 | 影响所有页面访问和菜单显隐。 |
| P0 | 入库列表/详情、出库列表/详情 | 页面基础数据入口，替换风险较低。 |
| P1 | SN采集、收货、拣货、发货 | 会改变业务状态，必须和后端校验完全一致。 |
| P1 | SAP回传/重传 | 涉及接口日志和外部系统状态。 |
| P2 | 取消操作 | 需要唯一记录 ID 和严格状态校验。 |
| P2 | 库存查询、SN查询 | 查询型接口风险低，但字段需要补齐多货主维度。 |
| P3 | 首页统计 | 当前首页可通过列表聚合，后续建议切到正式 summary 接口。 |

## 8. 替换风险

1. 开发环境默认走 mock，真实联调必须显式设置 `VITE_USE_MOCK=false`。
2. 首页统计当前通过入库/出库列表聚合，不是直接使用 `/api/workbench/summary`。
3. 部分批量取消接口返回结构需要确认，例如批量取消发货 mock 返回 `{ successCount, failedItems }`，service 类型仍写 `OutboundDetail`。
4. 出库发货和 SAP 回传里存在 `forceSapFail`、`forceTraceFail` 这类演示字段，正式接口不建议开放。
5. `pickScanOutboundOrder()` service 已有，但当前拣货页面主要把扫码结果汇总后调用 `pickOutboundOrder()`，若后端要求区分扫码拣货接口，需要页面轻微调整。
6. 移动端库存查询字段少于 PC 端，多货主正式联调前建议补齐 `owner_code/owner_name`。
7. 接口日志当前通过详情接口返回，移动端没有独立接口日志查询 service；若后端改为分页查询，需要新增 service 方法但不应改业务含义。
8. mock 错误格式是抛 `Error`，真实接口是 `{ code, message, data }`；`request.ts` 已适配，但错误码枚举仍需后端确认。

## 9. 需要后端确认的问题

1. 登录返回的 `role_code`, `warehouse_scope`, `status` 是否稳定。
2. `/api/workbench/summary` 是否作为移动端首页正式统计接口。
3. 入库详情是否稳定返回 `details/lines`, `serialNumbers`, `receiptRecords`, `operationLogs`, `interfaceLogs`。
4. SN采集取消接口返回是否统一为 `{ successCount, failedItems? }`。
5. 收货接口返回是否包含 `receiptNo`。
6. SAP重传接口是否返回单据详情、统计结果，还是只返回成功数量。
7. 出库批量取消分配、拣货、发货的返回结构是否统一。
8. 出库 SAP 重传使用 `orderId` 还是 `orderIds`。
9. 拣货是否必须调用 `/pick-scan` 才算扫码拣货，还是 `/pick` 可承载扫码结果。
10. 接口日志是否继续由详情接口返回，还是提供移动端分页接口。
11. 库存查询和 SN 查询是否补齐货主、质量、冻结、锁定状态字段。
12. 正式接口是否需要统一错误码，例如 `BUSINESS_VALIDATION_FAILED`, `DUPLICATE_SN`, `INSUFFICIENT_STOCK`。

## 10. 下一步替换建议

1. 保持当前 `mobile/src/api/request.ts` 和 service 方法名不变。
2. 先在真实后端环境设置 `VITE_USE_MOCK=false` 做只读接口联调：登录、列表、详情、库存、SN查询。
3. 再联调状态变更接口：SN采集、收货、分配、拣货、发货。
4. 最后联调逆向操作和 SAP 回传，重点验证接口日志和状态回退。
5. 为所有关键按钮、输入框补 `data-testid` 后，再将 `docs/mobile-e2e-test-scripts.md` 转成自动化测试。
6. 正式上线前移除或禁用页面上的演示失败开关字段，避免把 `forceSapFail` 一类参数传给正式后端。

