# WMS 移动端端到端操作脚本

版本：WMS Mobile V2.0.1 业务逻辑对齐版  
适用范围：移动端登录、入库、SN 采集、收货、SAP 回传、发运订单、分配、拣货、发货、库存查询、SN 查询  
预览地址：`http://127.0.0.1:5176/home`

## 1. 自动化框架检查结论

当前项目未发现 Cypress、Playwright、Vitest、Jest 或其他端到端测试框架。

- `mobile/package.json` 仅包含 `dev`、`build`、`preview`。
- `frontend/package.json` 仅包含 `dev`、`build`、`preview`。
- 本轮不引入大型新测试框架。
- 本文档作为人工验收脚本，同时为后续自动化测试提供用例编号、数据、页面、接口和断言口径。

建议后续如要自动化，优先引入 Playwright，并为关键按钮补充稳定的 `data-testid`，避免依赖中文文本定位。

## 2. 通用测试环境

| 项目 | 内容 |
|---|---|
| 移动端地址 | `http://127.0.0.1:5176/home` |
| 默认账号 | `admin / admin123` |
| 仓库账号 | `wh_admin / 123456` |
| 推荐浏览器 | Chrome / Edge |
| 推荐预览模式 | 当前手机预览框模式，宽度约 390px |
| 数据来源 | `mobile/src/api/mock.ts` |
| 运行命令 | `cd mobile && npm run dev` |
| 构建检查 | `cd mobile && npm run build` |

## 3. 核心测试数据

### 3.1 入库数据

| 类型 | 单据 / 行 / SN | 用途 |
|---|---|---|
| 部分收货且 SAP 失败 | `IN202606110100` | 取消 SN、取消收货、入库 SAP 重传 |
| SN 管理行 | `IN202606110100` / 行 `10` / lineId `101` / `GT3-10KD1R11004` | SN 采集、SN 产品收货 |
| 非 SN 行 | `IN202606110100` / 行 `20` / lineId `102` / `HXEDE081R10002` | 非 SN 产品直接收货 |
| 新建混合入库单 | `IN-DEMO-SN-MIX-001` / id `2` | SN 管理与非 SN 管理完整入库闭环 |
| SN 管理行 | `IN-DEMO-SN-MIX-001` / 行 `10` / lineId `201` / `BMS-MAIN-001` | 新 SN 采集 |
| 非 SN 行 | `IN-DEMO-SN-MIX-001` / 行 `20` / lineId `202` / `SP-CABLE-001` | 直接收货 |
| 已采集未收货 SN | `SN-IN-1003`、`SN-IN-1004`、`SN-IN-1005` | 取消 SN、SN 产品收货 |
| 建议新采集 SN | `SN-MOB-IN-9001`、`SN-MOB-IN-9002` | 演示采集，避免与历史 SN 重复 |

### 3.2 出库数据

| 类型 | 单据 / 行 / SN | 用途 |
|---|---|---|
| 待分配发运订单 | `SO-OUT-202606110001` / id `1` | 自动分配、人工分配、拣货、发货闭环 |
| SN 管理出库行 | `SO-OUT-202606110001` / 行 `10` / lineId `1001` / `GT3-10KD1R11004` | SN 分配和扫码拣货 |
| 非 SN 出库行 | `SO-OUT-202606110001` / 行 `20` / lineId `1002` / `HXEDE081R10002` | 数量分配和拣货 |
| 可用 SN 库存 | `SN-OUT-1001` 至 `SN-OUT-1005` | 自动/人工分配、扫码拣货 |
| 冻结库存 | `SN-OUT-FROZEN-01` | 分配异常校验 |
| 不合格库存 | `SN-OUT-NG-01` | 分配异常校验 |
| 部分拣货订单 | `STO-OUT-202606110001` / id `2` | 取消分配、取消拣货、继续拣货 |
| 部分发货且 SAP 失败 | `SO-OUT-202606110003` / id `3` | 取消发货、出库 SAP 重传 |

## 4. 通用断言规则

| 类型 | 断言 |
|---|---|
| 页面展示 | 页面在手机预览框内显示，不卡死，不横向溢出 |
| 操作反馈 | 成功显示成功提示，失败显示业务原因 |
| 危险操作 | 取消 SN、取消收货、取消分配、取消拣货、取消发货必须二次确认 |
| 状态一致 | 状态名与 PC 端一致，不出现上架、复核、质检、装车、签收 |
| 库存规则 | 分配不扣减库存，发货确认后才扣减库存 |
| SAP 规则 | SAP 回传按收货/发货批次或当前 PC 端 mock 逻辑执行，失败后支持重传 |

## 5. 核心闭环脚本

### E2E-M-CORE-001 SN 管理产品入库闭环

| 字段 | 内容 |
|---|---|
| 脚本编号 | E2E-M-CORE-001 |
| 脚本名称 | SN 管理产品入库闭环 |
| 适用业务模块 | 入库管理 / 预期到货通知单 / SN 采集 / 收货 / SAP 回传 |
| 前置条件 | 移动端服务已启动，用户已具备入库权限；建议使用 `IN-DEMO-SN-MIX-001`，行 `201` 未采集、未收货 |
| 测试数据 | 账号 `admin/admin123`；单据 `IN-DEMO-SN-MIX-001`；行 `10`；产品 `BMS-MAIN-001`；托盘 `PLT-MOB-IN-001`；箱码 `BOX-MOB-IN-001`；SN `SN-MOB-IN-9001`、`SN-MOB-IN-9002`；库位 `A01-01-01` |
| 操作步骤 | 1. 打开 `/login` 登录；2. 进入首页；3. 点击“预期到货通知单”；4. 搜索 `IN-DEMO-SN-MIX-001`；5. 进入详情；6. 展开产品行，选择 SN 管理行 `10`；7. 点击“SN 采集”；8. 输入托盘、箱码；9. 连续录入两个 SN；10. 点击“确认采集”；11. 返回详情；12. 点击“收货”；13. 选择目标库位并确认收货；14. 返回详情；15. 点击 SAP 回传；16. 查看接口日志 |
| 预期结果 | SN 采集成功，SN 状态进入已采集/待收货；收货成功后行已收数量增加；单据状态变为部分收货或完全收货；SAP 回传成功或失败均写入接口日志 |
| 涉及页面 | `/home`、`/inbound`、`/inbound/2`、`/inbound/2/sn-collect/201`、`/inbound/2/receive/201` |
| 涉及接口 | `GET /api/inbound-orders`；`GET /api/inbound-orders/{id}`；`GET /api/inbound-orders/{id}/lines/{lineId}/sn-collect-context`；`POST /api/inbound-orders/{id}/lines/{lineId}/validate-sn-collection`；`POST /api/inbound-orders/{id}/lines/{lineId}/confirm-sn-collection`；`POST /api/inbound-orders/{id}/receive`；`POST /api/inbound-orders/{id}/sap-post` |
| 涉及状态变化 | `CREATED` -> `PARTIAL_RECEIVED` 或 `RECEIVED`；SN `COLLECTED` -> `RECEIVED`；SAP `NOT_POSTED` -> `SUCCESS/FAILED` |
| 异常校验点 | 重复 SN、超量 SN、托盘码为空、箱码必填时为空、SN 管理产品未采集直接收货 |
| 是否适合自动化 | 是 |
| 备注 | 自动化时建议每次使用唯一 SN，例如带时间戳后缀，避免 mock 状态被前序用例污染 |

### E2E-M-CORE-002 非 SN 产品入库闭环

| 字段 | 内容 |
|---|---|
| 脚本编号 | E2E-M-CORE-002 |
| 脚本名称 | 非 SN 产品入库闭环 |
| 适用业务模块 | 入库管理 / 收货 / SAP 回传 |
| 前置条件 | `IN-DEMO-SN-MIX-001` 行 `202` 为非 SN 管理产品，仍有剩余待收货数量 |
| 测试数据 | 单据 `IN-DEMO-SN-MIX-001`；行 `20`；产品 `SP-CABLE-001`；本次收货数量 `2`；库位 `A01-01-02` |
| 操作步骤 | 1. 登录；2. 进入入库单列表；3. 搜索并打开单据；4. 展开产品行；5. 确认非 SN 行不显示 SN 采集按钮；6. 点击收货；7. 输入本次收货数量；8. 确认收货；9. 返回详情查看数量；10. 执行 SAP 回传 |
| 预期结果 | 非 SN 行可直接录入数量收货；不会要求 SN；收货记录新增；状态进入部分收货或完全收货；SAP 回传生成接口日志 |
| 涉及页面 | `/inbound`、`/inbound/2`、`/inbound/2/receive/202` |
| 涉及接口 | `GET /api/inbound-orders`；`GET /api/inbound-orders/{id}`；`POST /api/inbound-orders/{id}/receive`；`POST /api/inbound-orders/{id}/sap-post` |
| 涉及状态变化 | 行 `CREATED` -> `PARTIAL_RECEIVED/RECEIVED`；单据按累计收货数量刷新 |
| 异常校验点 | 收货数量为空、等于 0、超过剩余数量 |
| 是否适合自动化 | 是 |
| 备注 | 自动化时避免与 SN 管理行混用断言 |

### E2E-M-CORE-003 出库分配拣货发货闭环

| 字段 | 内容 |
|---|---|
| 脚本编号 | E2E-M-CORE-003 |
| 脚本名称 | 出库分配拣货发货闭环 |
| 适用业务模块 | 出库管理 / 发运订单 / 库存分配 / 拣货 / 发货 / SAP 回传 |
| 前置条件 | 发运订单 `SO-OUT-202606110001` 为待分配状态，存在可用库存 |
| 测试数据 | 单据 `SO-OUT-202606110001`；SN 行 `1001`；非 SN 行 `1002`；可用 SN `SN-OUT-1001`；库位 `A01-01-01`；物流商 `SF`；物流单号 `SF-MOB-9001` |
| 操作步骤 | 1. 登录；2. 进入发运订单列表；3. 搜索 `SO-OUT-202606110001`；4. 进入详情；5. 点击自动分配；6. 查看分配记录；7. 进入拣货；8. 选择产品行；9. 扫描产品编码、库位和 SN；10. 提交拣货；11. 返回详情；12. 进入发货；13. 输入物流信息；14. 确认发货；15. 执行出库 SAP 回传；16. 查看接口日志 |
| 预期结果 | 自动分配后库存锁定但不扣减；拣货后已拣数量增加；发货后已发数量增加并扣减库存/SN 状态；SAP 回传成功或失败写日志 |
| 涉及页面 | `/outbound`、`/outbound/1`、`/outbound/1/allocation`、`/outbound/1/pick`、`/outbound/1/ship` |
| 涉及接口 | `GET /api/outbound-orders`；`GET /api/outbound-orders/{id}`；`POST /api/outbound-orders/{id}/allocate-auto`；`POST /api/outbound-orders/{id}/pick`；`POST /api/outbound-orders/{id}/ship`；`POST /api/outbound-orders/{id}/post-sap` |
| 涉及状态变化 | `PENDING_ALLOC` -> `ALLOCATED/PARTIAL_ALLOCATED` -> `PICKED/PARTIAL_PICKED` -> `SHIPPED/PARTIAL_SHIPPED` -> SAP `SUCCESS/FAILED` |
| 异常校验点 | 冻结库存、不合格库存、重复扫码、拣货超量、未拣货直接发货 |
| 是否适合自动化 | 是 |
| 备注 | 自动化建议先使用 mock 重置机制或隔离测试数据，否则前序分配会影响后续断言 |

### E2E-M-CORE-004 逆向操作闭环

| 字段 | 内容 |
|---|---|
| 脚本编号 | E2E-M-CORE-004 |
| 脚本名称 | 入库/出库逆向操作闭环 |
| 适用业务模块 | 入库取消 SN、取消收货；出库取消分配、取消拣货、取消发货 |
| 前置条件 | 存在可取消的采集记录、收货记录、分配记录、拣货记录、发货记录 |
| 测试数据 | 入库 `IN202606110100`，SN `SN-IN-1003`，可取消收货批次；出库 `STO-OUT-202606110001` 分配/拣货记录；出库 `SO-OUT-202606110003` 发货记录 `SHIP202606110301` |
| 操作步骤 | 1. 登录；2. 打开入库详情；3. 取消已采集未收货 SN；4. 取消未 SAP 成功的收货记录；5. 打开发运订单详情；6. 取消可取消分配；7. 取消可取消拣货；8. 打开部分发货订单；9. 取消未 SAP 成功发货记录；10. 查看状态、数量和日志 |
| 预期结果 | 所有取消动作均弹出二次确认；取消成功后数量回退；不可取消记录不显示或提示失败；操作日志/接口日志保留 |
| 涉及页面 | `/inbound/1`、`/outbound/2`、`/outbound/3` |
| 涉及接口 | `POST /api/inbound-orders/{id}/lines/{lineId}/cancel-sn-collection`；`POST /api/inbound-orders/{id}/receipts/{receiptId}/cancel`；`POST /api/outbound-orders/{id}/allocations/cancel`；`POST /api/outbound-orders/{id}/picks/{pickId}/cancel`；`POST /api/outbound-orders/{id}/shipments/{shipmentId}/cancel` |
| 涉及状态变化 | SN/收货/分配/拣货/发货数量按 PC 端规则回退；终态和 SAP 成功记录不可随意回退 |
| 异常校验点 | 取消已 SAP 成功收货/发货、取消已发货拣货、取消已拣货分配 |
| 是否适合自动化 | 部分适合 |
| 备注 | 逆向用例强依赖状态，自动化前建议准备独立可重复 seed |

## 6. 功能脚本矩阵

| 编号 | 脚本名称 | 模块 | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 涉及页面 | 涉及接口 | 状态变化 | 异常校验点 | 适合自动化 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E2E-M-001 | 移动端登录 | 认证 | 未登录 | `admin/admin123` | 打开 `/login`，输入账号密码，提交 | 跳转首页，显示用户和仓库 | `/login`、`/home` | `POST /api/auth/login`、`GET /api/auth/me` | 保存 token 和用户信息 | 密码错误、空账号 | 是 | 可断言 URL 和 localStorage |
| E2E-M-002 | 首页查看任务和入口 | 首页 | 已登录 | 默认 mock | 打开首页，查看统计卡片和入口分组 | 入库、出库、库存/SN 入口可见，禁止入口不可见 | `/home` | `GET /api/inbound-orders`、`GET /api/outbound-orders` | 无 | 数据加载失败提示 | 是 | 后续加 `data-testid` |
| E2E-M-003 | 入库单查询 | 入库 | 已登录 | `IN202606110100` | 进入入库列表，按单号搜索或扫码定位 | 只展示匹配单据，可进入详情 | `/inbound` | `GET /api/inbound-orders` | 无 | 无匹配提示 | 是 | 可用单据号定位 |
| E2E-M-004 | 入库单详情查看 | 入库 | 单据存在 | `IN202606110100` | 点击单据，展开表头、行明细、SN、收货、日志 | 主从信息完整展示 | `/inbound/1` | `GET /api/inbound-orders/{id}` | 无 | 空日志展示 | 是 | 断言行 `10/20` |
| E2E-M-005 | SN 管理产品 SN 采集 | 入库 SN | SN 行未满采 | `IN-DEMO-SN-MIX-001` 行 `201`，SN `SN-MOB-IN-9001` | 进入采集页，录入托盘、箱码、SN，确认 | SN 写入历史列表，待收货数量增加 | `/inbound/2/sn-collect/201` | `GET sn-collect-context`、`POST validate-sn-collection`、`POST confirm-sn-collection` | SN -> `COLLECTED` | 重复、超量、必填 | 是 | 使用唯一 SN |
| E2E-M-006 | 非 SN 产品直接收货 | 入库收货 | 非 SN 行存在待收货 | `IN-DEMO-SN-MIX-001` 行 `202`，数量 `2` | 进入收货页，选中非 SN 行，输入数量，确认 | 收货记录新增，已收数量增加 | `/inbound/2/receive/202` | `POST /api/inbound-orders/{id}/receive` | 行进入部分/完全收货 | 数量为空/超量 | 是 | 不显示 SN 采集要求 |
| E2E-M-007 | SN 产品采集后收货 | 入库收货 | SN 已采集未收货 | `IN202606110100` 行 `101`，SN `SN-IN-1003` | 进入收货页，选择 SN 行，目标库位确认 | SN 状态变为已收货，收货记录新增 | `/inbound/1/receive/101` | `POST /api/inbound-orders/{id}/receive` | `COLLECTED` -> `RECEIVED` | 未采集直接收货 | 是 | 依赖已采集 SN |
| E2E-M-008 | 部分收货 | 入库收货 | 剩余数量大于本次数量 | 行 `202`，收货 `2/6` | 输入小于剩余数量并确认 | 单据/行状态为部分收货 | `/inbound/2/receive/202` | `POST /api/inbound-orders/{id}/receive` | `CREATED` -> `PARTIAL_RECEIVED` | 数量 0 | 是 | 需独立数据避免污染 |
| E2E-M-009 | 完全收货 | 入库收货 | 本次收货等于剩余数量 | 行 `202` 剩余全量 | 输入剩余数量并确认 | 行/单据完全收货 | `/inbound/2/receive/202` | `POST /api/inbound-orders/{id}/receive` | -> `RECEIVED` | 超量 | 是 | 建议单独 seed |
| E2E-M-010 | 取消 SN 采集 | 入库逆向 | SN `COLLECTED` 且未收货 | `SN-IN-1003` | 入库详情或采集页点击取消，确认 | SN 采集关系删除/取消，数量回退 | `/inbound/1` | `POST cancel-sn-collection` | `COLLECTED` -> `CANCELED/CANCELED_COLLECT` | 已收货 SN 不允许取消 | 是 | 强状态依赖 |
| E2E-M-011 | 取消收货 | 入库逆向 | 收货记录未 SAP 成功 | `IN202606110100` 收货记录 | 点击取消收货并确认 | 已收数量回退，收货记录状态取消 | `/inbound/1` | `POST receipts/{receiptId}/cancel` | 数量回退 | SAP 成功记录不可取消 | 部分适合 | 依赖 receiptId |
| E2E-M-012 | 入库 SAP 回传 | 入库集成 | 存在待回传收货批次 | `IN202606110103` | 点击 SAP 回传，确认，查看日志 | SAP 状态成功或失败，接口日志新增 | `/inbound/3` | `POST /api/inbound-orders/{id}/sap-post` | `NOT_POSTED` -> `SUCCESS/FAILED` | 未收货是否允许以 PC 端为准 | 是 | mock 可能成功 |
| E2E-M-013 | 入库 SAP 失败重传 | 入库集成 | SAP 状态失败 | `IN202606110100` | 点击 SAP 重传，确认 | 重传成功，状态刷新，日志新增 | `/inbound/1` | `POST /api/inbound-orders/retry-sap` | `FAILED` -> `SUCCESS/FAILED` | 无失败记录时重传 | 是 | 用失败单 |
| E2E-M-014 | 发运订单查询 | 出库 | 已登录 | `SO-OUT-202606110001` | 进入发运列表，按订单号搜索 | 匹配订单展示 | `/outbound` | `GET /api/outbound-orders` | 无 | 无匹配提示 | 是 | 可扫码定位 |
| E2E-M-015 | 发运订单详情查看 | 出库 | 订单存在 | `SO-OUT-202606110001` | 打开详情，展开表头、行、分配、拣货、发货、日志 | 主从信息完整，出库国家展示 | `/outbound/1` | `GET /api/outbound-orders/{id}` | 无 | 空记录展示 | 是 | 断言行 `10/20` |
| E2E-M-016 | 自动分配 | 出库分配 | 订单待分配且有库存 | `SO-OUT-202606110001` | 详情或分配页点击自动分配，确认 | 分配记录新增，库存锁定，不扣减 | `/outbound/1/allocation` | `POST /api/outbound-orders/{id}/allocate-auto` | `PENDING_ALLOC` -> `ALLOCATED/PARTIAL_ALLOCATED` | 库存不足、冻结、不合格 | 是 | 状态污染明显 |
| E2E-M-017 | 人工分配 | 出库分配 | 存在可用库存 | 行 `1001`，SN `SN-OUT-1001` | 选择产品行和库存，确认人工分配 | 指定库存分配成功 | `/outbound/1/allocation` | `POST /api/outbound-orders/{id}/allocate-manual` | 分配数量增加 | 超可用、选冻结/不合格 | 是 | 需唯一库存 |
| E2E-M-018 | 取消分配 | 出库逆向 | 分配记录 `ALLOCATED` 且未拣货 | `STO-OUT-202606110001`，`ALLOC202606110203` | 点击取消分配，确认 | 分配释放，数量回退 | `/outbound/2` 或 `/outbound/2/allocation` | `POST allocations/cancel` 或 `POST release-allocation` | `ALLOCATED` -> `CANCELED/释放` | 已拣货分配不可取消 | 部分适合 | 强状态依赖 |
| E2E-M-019 | 扫码拣货 | 出库拣货 | 已分配或 PC 允许直接拣货 | `STO-OUT-202606110001`，SN `SN-OUT-2003` | 进入拣货页，选行，扫产品/库位/SN，提交 | 拣货记录新增，已拣数量增加 | `/outbound/2/pick` | `POST /api/outbound-orders/{id}/pick` 或 `pick-scan` | -> `PARTIAL_PICKED/PICKED` | 重复扫码、不属于分配 | 是 | 自动化需控制状态 |
| E2E-M-020 | 取消拣货 | 出库逆向 | 拣货记录未发货 | `PICK202606110201` | 在详情或拣货页取消拣货，确认 | 已拣数量回退 | `/outbound/2` 或 `/outbound/2/pick` | `POST picks/{pickId}/cancel` | 拣货记录取消 | 已发货拣货不可取消 | 部分适合 | 强状态依赖 |
| E2E-M-021 | 发货 | 出库发货 | 存在已拣未发记录 | `SO-OUT-202606110003` 行 `3002` | 进入发货页，输入物流信息，确认 | 发货记录新增，库存/SN 状态更新 | `/outbound/3/ship` | `POST /api/outbound-orders/{id}/ship` | `PICKED` -> `PARTIAL_SHIPPED/SHIPPED` | 未拣货直接发货 | 是 | 可先用部分发货单 |
| E2E-M-022 | 取消发货 | 出库逆向 | 发货记录未 SAP 成功 | `SHIP202606110301` | 点击取消发货，确认 | 发货数量回退，库存/SN 回退 | `/outbound/3` 或 `/outbound/3/ship` | `POST shipments/{shipmentId}/cancel` | 发货记录取消 | SAP 成功发货不可取消 | 部分适合 | 强状态依赖 |
| E2E-M-023 | 出库 SAP 回传 | 出库集成 | 存在已发货未回传 | 已发货订单 | 点击 SAP 回传，确认 | SAP 状态刷新，接口日志新增 | `/outbound/{id}` | `POST /api/outbound-orders/{id}/post-sap` | `NOT_POSTED` -> `SUCCESS/FAILED` | 未发货是否允许以 PC 端为准 | 是 | 以发货批次为准 |
| E2E-M-024 | 出库 SAP 失败重传 | 出库集成 | SAP 状态失败 | `SO-OUT-202606110003` | 点击 SAP 重传，确认 | 重传成功或仍失败，日志新增 | `/outbound/3` | `POST /api/outbound-orders/retry-sap` | `FAILED` -> `SUCCESS/FAILED` | 无失败记录时重传 | 是 | 用失败单 |
| E2E-M-025 | 库存查询 | 库存 | 已登录 | 产品 `GT3-10KD1R11004` / 库位 `A01-01-01` | 进入库存页，扫码或查看列表 | 库存卡片展示产品、库位、可用数量 | `/inventory` | `GET /api/inventory` | 无 | 无数据提示 | 是 | 当前为查询演示 |
| E2E-M-026 | SN 查询 | 库存/SN | 已登录 | `SN-OUT-0001` | 进入库存页，扫描 SN | 显示识别成功，后续可接 SN 查询结果 | `/inventory` | `GET /api/serial-numbers` | 无 | 无效 SN 提示 | 部分适合 | 当前页面为扫码查询入口 |

## 7. 异常场景脚本

| 编号 | 异常场景 | 模块 | 前置条件 | 测试数据 | 操作步骤 | 预期结果 | 涉及页面 | 涉及接口 | 状态变化 | 异常校验点 | 适合自动化 | 备注 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E2E-M-EX-001 | 重复 SN 采集 | 入库 SN | 已输入一个 SN | `SN-MOB-IN-9001` | 在本次待提交列表中重复录入同一 SN | 阻止提交，提示 SN 不能重复 | `/inbound/2/sn-collect/201` | 本地校验 / `POST validate-sn-collection` | 无 | 重复 SN | 是 | 本地即可拦截 |
| E2E-M-EX-002 | 超量 SN 采集 | 入库 SN | 剩余可采数量有限 | 行 `201`，输入超过计划数量的 SN | 连续录入超过剩余数量 | 阻止录入或校验失败 | `/inbound/2/sn-collect/201` | `POST validate-sn-collection` | 无 | 超量 | 是 | 需控制剩余数量 |
| E2E-M-EX-003 | 未采集 SN 直接收货 | 入库收货 | SN 行无待收货 SN | 行 `201` 未采集 | 直接进入收货并尝试提交 | 收货按钮不可用或提示需先采集 SN | `/inbound/2/receive/201` | `POST receive` 不应成功 | 无 | SN 管理产品未采集 | 是 | 前端和 mock 均应拦截 |
| E2E-M-EX-004 | 收货数量超过剩余数量 | 入库收货 | 非 SN 行有剩余数量 | 行 `202`，输入 `999` | 提交收货 | 提示数量不合法，不能超过剩余数量 | `/inbound/2/receive/202` | `POST receive` | 无 | 超量收货 | 是 | 数量输入校验 |
| E2E-M-EX-005 | 未收货直接 SAP 回传 | 入库 SAP | 单据无收货批次 | `IN-DEMO-SN-MIX-001` 初始状态 | 尝试 SAP 回传 | 按 PC 端规则：按钮不显示或提示无待回传批次 | `/inbound/2` | `POST sap-post` 不应产生有效回传 | 无 | 未收货回传 | 是 | 以 PC 端按钮规则为准 |
| E2E-M-EX-006 | 分配数量超过可用库存 | 出库分配 | 非 SN 行可用库存有限 | 行 `1002`，数量 `999` | 人工分配输入超量 | 提示不能超过可用库存/剩余待分配数量 | `/outbound/1/allocation` | `POST allocate-manual` | 无 | 超可用库存 | 是 | mock 校验可覆盖 |
| E2E-M-EX-007 | 重复扫码拣货 | 出库拣货 | 已扫一个 SN | `SN-OUT-2003` | 拣货页重复扫描同一 SN | 提示重复扫码，不能加入列表 | `/outbound/2/pick` | 本地校验 / `POST pick` | 无 | 重复 SN | 是 | 本地即可拦截 |
| E2E-M-EX-008 | 拣货数量超过已分配数量 | 出库拣货 | 非 SN 行已分配有限 | 行 `1002` | 输入超出已分配/剩余待拣数量 | 阻止提交并提示 | `/outbound/1/pick/1002` | `POST pick` | 无 | 拣货超量 | 是 | 兼容直接拣货规则 |
| E2E-M-EX-009 | 未拣货直接发货 | 出库发货 | 无已拣未发记录 | `SO-OUT-202606110001` 初始态 | 直接进入发货提交 | 按 PC 端规则阻止，提示无已拣货未发记录 | `/outbound/1/ship` | `POST ship` 不应成功 | 无 | 未拣货发货 | 是 | 不新增复核前置 |
| E2E-M-EX-010 | SAP 回传失败后重传 | 入库/出库 SAP | SAP 状态失败 | 入库 `IN202606110100`；出库 `SO-OUT-202606110003` | 点击重传并确认 | 重传后状态刷新，接口日志新增 | `/inbound/1`、`/outbound/3` | `POST retry-sap` | `FAILED` -> `SUCCESS/FAILED` | 失败原因展示 | 是 | 可作为回归重点 |

## 8. 后续自动化测试建议

1. 优先引入 Playwright，覆盖登录、入库闭环、出库闭环、逆向操作和异常校验。
2. 为移动端关键节点补充稳定选择器：
   - `data-testid="mobile-login-submit"`
   - `data-testid="mobile-inbound-card-{orderNo}"`
   - `data-testid="mobile-sn-input"`
   - `data-testid="mobile-receive-submit"`
   - `data-testid="mobile-outbound-card-{orderNo}"`
   - `data-testid="mobile-allocate-submit"`
   - `data-testid="mobile-pick-submit"`
   - `data-testid="mobile-ship-submit"`
3. 自动化前建议增加 mock reset 接口或测试初始化脚本，保证每条用例状态可重复。
4. 对状态变更类用例建议分层：
   - 冒烟测试：只读页面和按钮显隐；
   - 业务闭环测试：会改变 mock 状态；
   - 异常测试：验证校验和提示，不改变状态。
5. 当前不建议用中文文本作为唯一定位依据，因为后续 UI 文案可能调整。

## 9. 当前未覆盖说明

| 未覆盖项 | 原因 |
|---|---|
| 上架 | PC 端当前未开放，移动端禁止新增 |
| 复核 | PC 端当前未开放，移动端禁止新增 |
| 质检、审批、装车、签收、波次 | PC 端当前未开放，移动端禁止新增 |
| 库存移动、库存盘点移动端闭环 | 本轮移动端主流程不包含，当前库存页仅保留暂不开放提示 |
| 真机扫码硬件事件 | 当前仅 H5 输入框模拟扫码，需真实 PDA 或扫码枪进一步验证 |

