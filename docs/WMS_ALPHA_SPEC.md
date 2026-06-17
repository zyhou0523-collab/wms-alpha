# WMS Alpha 版系统开发规格说明书

版本：V0.1 Alpha  
适用对象：Codex / 全栈开发团队 / IT 评审 / 业务评审  
技术方向：Vue3 + Element Plus + Vite + Spring Boot / Java + MySQL + REST API + 若依 RuoYi 风格后台  
目标：可运行、可演示、可评审、可继续工程化、可替代 FLUX WMS 核心场景演示。

---

## 一、项目背景与建设目标

### 1.1 当前系统痛点

公司当前使用 FLUX WMS 系统，但存在以下问题：

| 痛点类型 | 当前问题 | 业务影响 | Alpha 版替代目标 |
|---|---|---|---|
| 成本问题 | 维护费用高 | 二开和维护成本不可控 | 自研可控代码底座，降低长期维护费用 |
| 源码不可控 | 系统未交付源码 | 无法自主排查、扩展、优化 | 前端、后端、数据库全部可交付 |
| 稳定性问题 | 数据库连接经常异常 | 影响收货、发货、库存查询等关键作业 | 本地可运行，接口和日志可追踪 |
| 集成问题 | SAP、MES、履约、销售易、追溯等接口依赖复杂 | 问题定位困难，失败缺少闭环 | 建立接口中心、Mock 接口、失败重试机制 |
| 库存透明不足 | 多仓、多区域、VMI、售后库存看板不统一 | 管理层无法实时掌握全局库存 | 建立统一库存驾驶舱 |
| SN 追溯要求高 | 新能源成品需要 SN 级追溯 | 出入库、防错、售后追溯风险较高 | 打通 SN 下发、入库、绑定、出库、追溯回传闭环 |

### 1.2 自研 WMS Alpha 版目标

Alpha 版用于验证自研 WMS 的业务可行性、技术可行性和替代 FLUX 核心场景能力。

| 目标 | 说明 |
|---|---|
| 可运行 | 支持本地启动前端、后端、MySQL 数据库，通过 SQL seed 初始化演示数据 |
| 可演示 | 可完整演示 MES 下发 SN、生产入库、托盘/箱/SN 绑定、上架、销售出库、发货、SN 回传、SAP 扣账 Mock |
| 可评审 | 菜单、页面、字段、流程、接口、数据状态可供业务、IT、管理层评审 |
| 可继续工程化 | 工程结构清晰，前后端分层，数据库模型规范，接口可替换为真实接口 |
| 可替代演示 | 围绕当前 FLUX WMS 的核心作业场景，验证自研 WMS 可承接关键流程 |

### 1.3 Alpha 版与正式版边界

| 范围 | Alpha 版 | 正式版 |
|---|---|---|
| 部署方式 | 本地 Docker / 本机启动 | 企业服务器 / 私有云 / K8s |
| 数据来源 | SQL seed + Mock 接口 | SAP / MES / 履约 / 销售易 / 追溯真实接口 |
| 用户体系 | 简化角色权限 | 企业统一认证、组织权限、数据权限 |
| 作业终端 | PC 页面模拟扫码 | PC + PDA + 条码枪 + 打印机 |
| 库存策略 | FIFO、指定库存、冻结校验、安全库存预警 | 多维策略引擎、波次、补货策略、库位优化 |
| 报表看板 | 固定看板 | 可配置 BI / 多维分析 |
| 接口处理 | Mock 接口 + 日志 + 手动重试 | MQ、幂等、补偿、监控告警 |
| 打印 | 模拟打印 / 导出 PDF | 标签打印机、模板配置、批量打印 |

### 1.4 不纳入 Alpha 版的内容

1. 不开发 PDA 原生 App，仅在 PC 页面提供“扫码输入框”模拟扫码。
2. 不接入真实 SAP、MES、履约系统、销售易、追溯系统，仅开发 Mock REST API。
3. 不实现复杂波次拣货、路径优化、自动补货算法。
4. 不实现真实打印机驱动，仅支持二维码预览和 PDF/图片模拟打印。
5. 不实现复杂多语言翻译，仅预留字段。
6. 不实现复杂审批流，仅用状态流转模拟。
7. 不实现真实财务结算，仅模拟 SAP 记账、VMI 结算结果。
8. 不实现高并发、大数据量性能优化，仅保证演示数据可稳定运行。
9. 不实现移动端 UI，仅保证 PC 端后台可演示。
10. 不实现正式主数据治理流程，仅支持手工维护、导入和 Mock 下发。

---

## 二、系统总体定位

### 2.1 系统名称

- 系统名称：新能源 WMS Alpha 版
- 英文名称：New Energy WMS Alpha
- 系统简称：WMS Alpha

### 2.2 管理对象

| 管理对象 | Alpha 版覆盖说明 |
|---|---|
| 新能源成品 | 支持产品主数据、SN、箱、托盘、库存、入库、出库 |
| 备件 | 支持普通库存、售后 RMA、售后发货 |
| SN 序列号 | 支持 MES 下发、入库绑定、出库复核、追溯回传 |
| 托盘/箱 | 支持托盘码、箱码、SN 绑定关系 |
| 库存 | 支持可用、已分配、冻结、待检、不合格、VMI 库存 |
| 仓库 | 支持集团总仓、区域销售仓、第三方仓、售后仓、客户 VMI 仓、供应商 VMI 仓 |
| 单据 | 支持入库单、出库单、盘点单、调整单、冻结单、RMA 单、VMI 消耗单 |
| 接口日志 | 支持 Mock 接口请求、响应、状态、失败重试 |

### 2.3 适用仓库类型

| 仓库类型 | 业务定位 | Alpha 版核心场景 |
|---|---|---|
| 集团总仓 | 工厂生产入库、集中存储、区域补货 | 生产入库、SN 绑定、上架、调拨出库 |
| 区域销售仓 | 贴近销售市场，响应销售发货 | 备货入库、销售出库、库存预警 |
| 第三方仓 | 外租或外部运营仓 | 备货入库、销售发货、库存查询 |
| 售后仓 | 售后备件、退换货、维修件管理 | RMA 入库、售后发货、状态隔离 |
| 客户 VMI 仓 | 我司货放客户处，客户领用后结算 | 寄售出库、客户消耗、SAP 结算 Mock |
| 供应商 VMI 仓 | 供应商货放我方仓，我方领用后结算 | 供应商备货、生产/售后领用、AP 结算 Mock |

### 2.4 目标用户

| 用户角色 | 使用场景 | Alpha 版权限 |
|---|---|---|
| 仓库管理员 | 收货、上架、拣货、发货、盘点、库存调整 | 入库、出库、库存、盘点全权限 |
| 生产人员 | 查询库存、生产入库、SN 入库 | 生产入库、库存查询 |
| 物流人员 | 发运、复核、发货 | 出库复核、发货确认 |
| 售后工程师 | RMA、售后发货、退货入库 | RMA、售后库存 |
| 计划/供应链人员 | 查看库存、预警、补货 | 看板、库存、VMI |
| IT 管理员 | 接口日志、系统配置、用户管理 | 接口中心、系统设置 |
| 管理层 | 查看库存、周转、预警、异常 | 数据驾驶舱、报表看板 |

### 2.5 核心业务价值

| 价值 | 具体体现 |
|---|---|
| 替代验证 | 验证自研系统可承接 FLUX 的核心入库、出库、库存、SN 追溯场景 |
| 库存透明 | 多仓、多区域、多状态库存统一查询 |
| 作业防错 | 扫码校验 SN、箱码、托盘码、订单数量、库存状态 |
| 追溯闭环 | SN 从 MES 下发、入库、绑定、出库、回传追溯形成闭环 |
| 接口可控 | 通过接口中心管理 SAP、MES、履约、销售易、追溯 Mock 调用 |
| 可扩展 | 代码结构、数据模型、REST API 预留正式工程化空间 |

---

## 三、Alpha 版功能范围

### 3.1 功能模块总览

| 模块 | 一级菜单 | Alpha 版定位 |
|---|---|---|
| 1 | 数据驾驶舱 | 展示全局库存、预警、库龄、区域仓分布 |
| 2 | 工作台 | 展示个人待办、异常、快捷入口 |
| 3 | 基础数据 | 产品、客户、供应商、批次、货主 |
| 4 | 仓库设置 | 仓库、库区、库位、策略、托盘码打印 |
| 5 | 入库管理 | 预期到货通知单统一入口，按订单类型区分生产入库、采购入库、备货入库、RMA 入库，支持收货、上架 |
| 6 | 出库管理 | 发运订单统一入口，按订单类型区分销售出库、调拨出库、售后出库，支持分配、拣货、复核、发货 |
| 7 | 库存管理 | 库存查询、移动、调整、盘点、冻结、预警 |
| 8 | 序列号/SN 管理 | MES SN 下发、SN 入库、SN 库存、SN 出库、追溯 |
| 9 | VMI 管理 | 客户 VMI、供应商 VMI、消耗、结算 |
| 10 | 售后/RMA 管理 | RMA 单、售后入库、售后发货、退货状态 |
| 11 | 接口中心 | Mock 接口、接口日志、失败重试 |
| 12 | 系统设置 | 用户、角色、字典、参数、操作日志 |

### 3.2 模块 1：数据驾驶舱

| 项目 | 规格 |
|---|---|
| 一级菜单 | 数据驾驶舱 |
| 二级菜单 | 集团总览、区域总览、仓库总览、库存预警看板、库龄/呆滞看板 |
| 页面类型 | 看板页 |
| 核心字段 | 总库存数量、库存金额、可用库存、冻结库存、待检库存、不合格库存、安全库存低位 SKU 数、长库龄 SKU 数、VMI 库存金额、RMA 待处理数、今日入库数、今日出库数 |
| 核心操作按钮 | 刷新、切换层级、选择区域、选择仓库、导出看板数据、查看明细 |
| 关键校验规则 | 管理层可看全部；仓库角色仅看授权仓库；库存金额为空时显示 0；预警项点击可跳转明细 |
| 演示数据要求 | 至少 1 个集团视图、3 个区域、6 类仓库、10 个预警 SKU、5 个长库龄 SKU |

页面组件：顶部 KPI 卡片、中部地图/区域分布、库存结构图、近 6 个月入出库趋势、异常列表。

### 3.3 模块 2：工作台

| 项目 | 规格 |
|---|---|
| 一级菜单 | 工作台 |
| 二级菜单 | 我的待办、异常提醒、快捷作业、今日作业统计 |
| 页面类型 | 看板页 + 列表页 |
| 核心字段 | 待收货单数、待上架单数、待拣货单数、待复核单数、接口失败数、库存异常数、RMA 待处理数 |
| 核心操作按钮 | 去收货、去上架、去拣货、去复核、查看异常、重试接口 |
| 关键校验规则 | 只显示当前用户授权仓库数据；待办数量与单据状态实时联动 |
| 演示数据要求 | 生产入库待办 1 条、销售出库待办 1 条、接口异常 2 条、库存预警 3 条 |

### 3.4 模块 3：基础数据

#### 3.4.1 产品主数据

| 项目 | 规格 |
|---|---|
| 一级菜单 | 基础数据 |
| 二级菜单 | 产品主数据 |
| 页面类型 | 列表页 / 详情页 / 新增页 / 导入页 |
| 核心字段 | 产品编码 SKU、产品名称、产品类别、规格型号、单位、是否 SN 管理、是否电池类、保质期天数、安全库存、长库龄阈值、状态 |
| 核心操作按钮 | 新增、编辑、启用、停用、导入、导出、查看库存 |
| 关键校验规则 | SKU 唯一；启用后不可删除；SN 管理产品入出库必须采集 SN；安全库存不能小于 0 |
| 演示数据要求 | 至少 10 个产品，其中 6 个成品、4 个备件；至少 5 个启用 SN 管理 |

#### 3.4.2 客户主数据

| 项目 | 规格 |
|---|---|
| 一级菜单 | 基础数据 |
| 二级菜单 | 客户主数据 |
| 页面类型 | 列表页 / 详情页 / 新增页 |
| 核心字段 | 客户编码、客户名称、客户类型、国家/地区、联系人、联系电话、收货地址、是否 VMI 客户、状态 |
| 核心操作按钮 | 新增、编辑、启用、停用、导入、导出 |
| 关键校验规则 | 客户编码唯一；VMI 客户必须绑定客户 VMI 仓 |
| 演示数据要求 | 至少 5 个客户，其中 2 个客户 VMI 客户 |

#### 3.4.3 供应商主数据

| 项目 | 规格 |
|---|---|
| 一级菜单 | 基础数据 |
| 二级菜单 | 供应商主数据 |
| 页面类型 | 列表页 / 详情页 / 新增页 |
| 核心字段 | 供应商编码、供应商名称、供应商类型、联系人、联系电话、是否 VMI 供应商、状态 |
| 核心操作按钮 | 新增、编辑、启用、停用、导入、导出 |
| 关键校验规则 | 供应商编码唯一；VMI 供应商必须绑定供应商 VMI 仓 |
| 演示数据要求 | 至少 3 个供应商，其中 1 个供应商 VMI |

#### 3.4.4 批次属性

| 项目 | 规格 |
|---|---|
| 一级菜单 | 基础数据 |
| 二级菜单 | 批次属性 |
| 页面类型 | 列表页 / 新增页 |
| 核心字段 | 批次号、产品编码、生产日期、入库日期、失效日期、质量状态 |
| 核心操作按钮 | 新增、编辑、导入、导出 |
| 关键校验规则 | 批次号 + 产品编码唯一；失效日期不能早于生产日期 |
| 演示数据要求 | 至少 10 条批次数据 |

### 3.5 模块 4：仓库设置

#### 3.5.1 仓库管理

| 项目 | 规格 |
|---|---|
| 一级菜单 | 仓库设置 |
| 二级菜单 | 仓库管理 |
| 页面类型 | 列表页 / 详情页 / 新增页 |
| 核心字段 | 仓库编码、仓库名称、仓库类型、所属区域、国家/城市、是否自有仓、是否 VMI 仓、状态 |
| 核心操作按钮 | 新增、编辑、启用、停用、查看库区 |
| 关键校验规则 | 仓库编码唯一；VMI 仓必须绑定客户或供应商 |
| 演示数据要求 | 集团总仓、区域销售仓、第三方仓、售后仓、客户 VMI 仓、供应商 VMI 仓各 1 个 |

#### 3.5.2 库区管理

| 项目 | 规格 |
|---|---|
| 一级菜单 | 仓库设置 |
| 二级菜单 | 库区管理 |
| 页面类型 | 列表页 / 新增页 |
| 核心字段 | 库区编码、库区名称、所属仓库、库区类型、质量状态限制、状态 |
| 核心操作按钮 | 新增、编辑、启用、停用、查看库位 |
| 关键校验规则 | 同一仓库下库区编码唯一；不合格库区不可存放合格库存 |
| 演示数据要求 | 每个仓库至少 2 个库区：良品区、待检区；售后仓增加待修区、报废区 |

#### 3.5.3 库位管理

| 项目 | 规格 |
|---|---|
| 一级菜单 | 仓库设置 |
| 二级菜单 | 库位管理 |
| 页面类型 | 列表页 / 新增页 / 导入页 |
| 核心字段 | 库位编码、库位名称、所属仓库、所属库区、货架、层、列、容量、是否冻结、状态 |
| 核心操作按钮 | 新增、编辑、冻结、解冻、导入、导出、打印库位码 |
| 关键校验规则 | 同一仓库库位编码唯一；冻结库位不可上架；容量不能小于已存数量 |
| 演示数据要求 | 至少 30 个库位 |

#### 3.5.4 托盘码打印

| 项目 | 规格 |
|---|---|
| 一级菜单 | 仓库设置 |
| 二级菜单 | 打印托盘码 |
| 页面类型 | 操作页 |
| 核心字段 | 打印数量、托盘码前缀、生成规则、二维码预览 |
| 核心操作按钮 | 生成、打印预览、导出 PDF |
| 关键校验规则 | 打印数量 1-500；托盘码全局唯一 |
| 演示数据要求 | 支持生成 PLT202606110001 至 PLT202606110020 |

### 3.6 模块 5：入库管理

| 二级菜单 | 页面类型 | 核心字段 | 核心操作按钮 | 关键校验规则 | 演示数据要求 |
|---|---|---|---|---|---|
| 预期到货通知单 | 列表页 / 详情页 / 新增页 / 收货操作页 / 上架操作页 | 到货通知单号、来源系统、订单类型、仓库、供应商/客户、关联单号、状态、计划到货日期、行号、产品编码、产品名称、行计划数量、行已收数量、行已上架数量、单据总数量 | 新增、接收 SAP/MES/履约/CRM Mock、收货、绑定托盘/箱/SN、上架、取消、关闭、SAP 入库回传 Mock、导入、导出 | 不同入库业务不拆二级菜单，必须通过订单类型字段区分；列表必须展示到产品行明细；已关闭不可收货；收货数量不能大于行计划数量；SN 管理产品必须录入 SN；同一 SN 不可重复入库；不合格品不可上架至良品区 | 生产入库、采购入库/备货入库、RMA 入库各 1 条；至少 1 张到货通知单包含 2 个产品行 |
| 入库回传异常 | 列表页 | 接口日志 ID、单据号、接口名称、失败原因、重试次数、最后重试时间、状态 | 查看请求、查看响应、手动重试、标记已处理 | 成功日志不可重试；最大自动重试 3 次 | 至少 2 条失败记录 |

### 3.7 模块 6：出库管理

| 二级菜单 | 页面类型 | 核心字段 | 核心操作按钮 | 关键校验规则 | 演示数据要求 |
|---|---|---|---|---|---|
| 发运订单 | 列表页 / 详情页 / 库存分配 / 拣货操作 / 复核操作 / 发货确认 | 发运订单号、来源系统、订单类型、来源单号、客户、发货仓、目标仓、收货地址、行号、产品编码、产品名称、行订单数量、行分配数量、行拣货数量、行复核数量、行发货数量、单据总数量、状态 | 接收履约/SAP/CRM Mock、新增模拟、自动分配、人工指定、释放分配、生成拣货任务、扫码拣货、异常登记、复核、发货、取消、追溯回传 Mock、SAP 扣账 Mock、失败重试 | 不同出库业务不拆二级菜单，必须通过订单类型字段区分；列表必须展示到产品行明细；不合格/冻结库存不可分配；SN 管理产品出库必须扫描 SN；出库数量不能超过行订单数量；销售、调拨、售后按订单类型套用差异校验 | 销售发运、调拨发运、售后发运各 1 条；至少 1 张发运订单包含 2 个产品行 |
| 出库回传异常 | 列表页 | 接口日志 ID、出库单号、接口名称、失败原因、重试次数、状态 | 查看、重试、标记已处理 | 已成功不可重试；重试保留历史日志 | 追溯回传失败 1 条、SAP 扣账失败 1 条 |

### 3.8 模块 7：库存管理

| 二级菜单 | 页面类型 | 核心字段 | 核心操作按钮 | 关键校验规则 | 演示数据要求 |
|---|---|---|---|---|---|
| 库存查询 | 列表页 / 详情页 | 仓库、库区、库位、产品编码、批次、库存状态、总库存、可用库存、已分配库存、冻结库存、VMI 标识 | 查询、导出、查看 SN、查看库存流水 | 可用库存 = 总库存 - 已分配 - 冻结 - 不合格 | 至少 50 条库存记录 |
| 库存移动 | 操作页 | 源仓库、源库位、目标仓库、目标库位、产品、批次、SN、数量 | 扫码移动、确认移动 | 源库存必须足够；目标库位未冻结；SN 移动必须逐个扫描 | 库位 A01 至 A02 移动 2 个 SN |
| 库存调整 | 新增页 / 审核模拟页 | 调整单号、仓库、库位、产品、调整前数量、调整后数量、调整原因、状态 | 新增、提交、审核通过、审核驳回、生效 | 已分配库存不可调减；调整必须写库存流水 | 盘盈、盘亏各 1 条 |
| 库存盘点 | 列表页 / 新增页 / 盘点录入页 | 盘点单号、盘点仓库、盘点范围、账面数量、实盘数量、差异数量、状态 | 创建盘点、生成明细、录入实盘、差异确认、生成调整单、关闭 | 盘点期间相关库存可选择冻结；差异确认后生成调整单 | 1 张盘点单，5 条明细，2 条差异 |
| 库存冻结 | 列表页 / 操作页 | 冻结单号、仓库、库位、产品、SN、数量、冻结原因、冻结状态 | 冻结、解冻、查看流水 | 已出库 SN 不可冻结；冻结库存不可分配出库 | 冻结 2 个 SN，解冻 1 个 SN |
| 安全库存预警 | 列表页 / 看板页 | 仓库、产品、当前可用库存、安全库存、缺口数量、是否允许补货、预警等级 | 查看库存、生成补货建议、导出 | 当前可用库存 < 安全库存时生成预警 | 至少 5 条低库存预警 |
| 长库龄预警 | 列表页 / 看板页 | 仓库、产品、批次、SN、入库日期、库龄天数、阈值天数、是否电池类、补电建议 | 查看明细、导出、标记已处理 | 库龄天数 > 产品长库龄阈值时预警；电池类产品显示补电建议 | 至少 5 条长库龄记录，其中 2 条电池类 |

### 3.9 模块 8：序列号/SN 管理

| 项目 | 规格 |
|---|---|
| 一级菜单 | 序列号/SN 管理 |
| 二级菜单 | MES 下发 SN、入库 SN、库存 SN、出库 SN、SN 追溯查询 |
| 页面类型 | 列表页 / 详情页 / 操作页 |
| 核心字段 | SN、产品编码、MES 工单号、SAP 工单号、箱码、托盘码、仓库、库位、SN 状态、质量状态、入库单号、出库单号 |
| 核心操作按钮 | 接收 MES Mock、绑定箱/托、入库确认、出库复核、追溯查询、导出 |
| 关键校验规则 | SN 全局唯一；SN 状态流转：已下发 → 已入库 → 已上架 → 已分配 → 已拣货 → 已出库 → 已回传追溯 |
| 演示数据要求 | 至少 20 个 SN，10 个用于生产入库，5 个用于销售出库，1 个用于 RMA |

### 3.10 模块 9：VMI 管理

| 二级菜单 | 页面类型 | 核心字段 | 核心操作按钮 | 关键校验规则 | 演示数据要求 |
|---|---|---|---|---|---|
| 客户 VMI 库存 / 出库 / 消耗 / 结算 | 列表页 / 操作页 / 结算页 | 客户、客户 VMI 仓、产品、SN、寄售库存、消耗数量、结算状态 | 寄售出库、录入消耗、扫码消耗、生成结算、推送 SAP Mock | 寄售出库只做库存转移，不做销售确认；消耗后才触发结算 | 客户 VMI 出库 1 单，消耗结算 1 单 |
| 供应商 VMI 库存 / 备货 / 领用 / 结算 | 列表页 / 操作页 / 结算页 | 供应商、供应商 VMI 仓、产品、批次、库存数量、领用数量、结算状态 | 备货入库、领用出库、生成结算、推送 SAP AP Mock | 供应商 VMI 库存必须带所有权标签；领用后才触发结算 | 供应商 VMI 领用 1 单，结算 1 单 |

### 3.11 模块 10：售后/RMA 管理

| 项目 | 规格 |
|---|---|
| 一级菜单 | 售后/RMA 管理 |
| 二级菜单 | RMA 单、售后退货入库、售后发货、售后库存 |
| 页面类型 | 列表页 / 详情页 / 操作页 |
| 核心字段 | RMA 单号、客户、原 SN、产品、退货原因、质检结果、售后处理方式、状态 |
| 核心操作按钮 | 接收销售易 Mock、审批模拟、生成入库单、生成售后出库单、关闭 |
| 关键校验规则 | RMA 入库必须校验原 SN 已售出；质检结果决定库存状态 |
| 演示数据要求 | RMA 入库 1 单、售后发货 1 单 |

### 3.12 模块 11：接口中心

| 项目 | 规格 |
|---|---|
| 一级菜单 | 接口中心 |
| 二级菜单 | Mock 接口配置、接口日志、失败重试、接口报文查看 |
| 页面类型 | 列表页 / 详情页 |
| 核心字段 | 接口编码、接口名称、来源系统、目标系统、方向、URL、请求报文、响应报文、状态、重试次数 |
| 核心操作按钮 | 启用、停用、查看请求、查看响应、手动重试、导出日志 |
| 关键校验规则 | 每次 Mock 调用必须记录日志；失败日志支持最多 3 次自动重试 |
| 演示数据要求 | SAP、MES、履约、销售易、追溯各至少 2 条接口日志 |

### 3.13 模块 12：系统设置

| 项目 | 规格 |
|---|---|
| 一级菜单 | 系统设置 |
| 二级菜单 | 用户管理、角色管理、菜单管理、数据字典、系统参数、操作日志 |
| 页面类型 | 列表页 / 新增页 / 详情页 |
| 核心字段 | 用户名、姓名、角色、仓库权限、状态、参数编码、参数值、操作人、操作时间 |
| 核心操作按钮 | 新增、编辑、启用、停用、分配角色、查看日志 |
| 关键校验规则 | admin 不可删除；仓库人员必须绑定仓库权限 |
| 演示数据要求 | admin、仓库管理员、生产人员、物流人员、售后人员、管理层各 1 个账号 |

---

## 四、核心业务流程

### 4.1 生产入库流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| SAP 下发生产工单 | SAP Mock | 生产工单号、产品、数量 | 创建生产入库 ASN | 待收货生产入库单 | SAP → WMS 生产工单接口 |
| MES 下发 SN | MES Mock | MES 工单号、SN 列表 | 校验 SN 唯一并写入 SN 表 | 已下发 SN | MES → WMS SN 下发接口 |
| 仓库扫码收货 | 仓库管理员 | 入库单号、SN | 校验 SN 属于工单，更新收货数量 | 入库单部分/全部收货 | 无 |
| 托盘/箱/SN 绑定 | 仓库管理员 | 托盘码、箱码、SN | 建立绑定关系 | 绑定记录 | 无 |
| 上架 | 仓库管理员 | 目标库位 | 生成库存，SN 状态改为已上架 | 可用/待检库存 | 无 |
| 入库回传 | 系统 | 入库结果 | 调用 SAP Mock 记账 | SAP 记账成功/失败 | WMS → SAP 入库过账接口 |

### 4.2 MES SN 下发与 SN 入库管理流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| MES 发送 SN | MES Mock | 工单号、产品、SN 列表 | 批量写入 SN 表 | SN 状态为已下发 | MES SN 下发 |
| WMS 接收校验 | 系统 | SN 列表 | 校验 SN 唯一、产品存在、工单存在 | 接收成功/失败日志 | 接口日志 |
| 仓库收货扫描 | 仓库管理员 | SN | 匹配入库单和工单 | SN 状态为已入库 | 无 |
| 绑定包装 | 仓库管理员 | 箱码、托盘码 | 建立托盘/箱/SN 关系 | 包装绑定关系 | 无 |
| 上架入库 | 仓库管理员 | 库位 | 生成库存和 SN 库位 | SN 状态为已上架 | 无 |

### 4.3 备货入库流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 履约下发备货单 | 履约 Mock | 备货单号、发货仓、收货仓、产品、数量 | 创建备货入库 ASN | 待收货 ASN | 履约 → WMS 备货单接口 |
| 仓库收货 | 仓库管理员 | ASN 单号、产品、数量/SN | 校验数量，更新收货明细 | 已收货记录 | 无 |
| 上架 | 仓库管理员 | 库位 | 增加区域仓库存 | 可用库存 | 无 |
| 回传 SAP | 系统 | 入库结果 | 模拟 SAP 库存增加 | 记账日志 | WMS → SAP 入库过账 |

### 4.4 销售出库流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 履约下发销售订单 | 履约 Mock | 销售订单、客户、产品、数量 | 创建订单类型为 SALES 的发运订单 | 待分配发运订单 | 履约 → WMS 发运订单 |
| 系统分配库存 | 仓库管理员/系统 | 出库单号 | 按 FIFO 分配可用库存 | 已分配库存 | 无 |
| 拣货 | 仓库管理员 | 扫描库位、SN | 校验 SN 属于分配结果 | 已拣货 | 无 |
| 出库复核 | 物流人员 | 扫描 SN/箱码 | 校验数量和 SN | 已复核 | 无 |
| 发货 | 物流人员 | 物流信息 | 扣减库存，SN 改为已出库 | 已发货 | 无 |
| SN 回传追溯 | 系统 | 出库 SN | 调用追溯 Mock | 追溯回传成功 | WMS → 追溯系统 |
| SAP 扣账 | 系统 | 出库结果 | 调用 SAP Mock | SAP 库存扣减 | WMS → SAP 出库过账 |
| 回传履约 | 系统 | 发货状态 | 更新订单状态 | 履约系统已发货 | WMS → 履约状态回传 |

### 4.5 调拨出库流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| SAP/STO 下发 | SAP Mock | STO 单号、发货仓、收货仓、产品、数量 | 创建订单类型为 TRANSFER 的发运订单 | 待分配 STO 发运订单 | SAP → WMS STO |
| 分配库存 | 仓库管理员 | STO 单号 | 按 FIFO 分配库存 | 已分配 | 无 |
| 拣货复核 | 仓库管理员 | SN/库位 | 校验库存状态 | 已复核 | 无 |
| 发货 | 物流人员 | 物流单号 | 扣减发货仓库存，生成在途 | 在途库存 | 无 |
| 自动生成收货 ASN | 系统 | 发货结果 | 在收货仓生成调拨入库单 | 待收货 ASN | 无 |
| SAP 过账 | 系统 | 调拨结果 | 模拟库存转储 | SAP STO 记账 | WMS → SAP |

### 4.6 售后 RMA 入库流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 销售易创建 RMA | 销售易 Mock | RMA 单号、客户、原 SN、退货原因 | WMS 创建 RMA 单 | 待入库 RMA | 销售易 → WMS |
| 校验原 SN | 系统 | 原 SN | 调用追溯 Mock 判断是否已售出 | 校验通过/失败 | WMS → 追溯 |
| 扫码入库 | 仓库管理员 | 原 SN | 生成售后入库记录 | 已收货 | 无 |
| 质检分流 | 售后/仓库 | 质检结果 | 分配良品、待修、报废库存状态 | 售后库存 | 无 |
| SAP 售后入库 | 系统 | 入库结果 | 模拟 SAP 售后退货入账 | SAP 记账日志 | WMS → SAP |

### 4.7 售后发货流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 销售易下发售后出库 | 销售易 Mock | 售后出库单、客户、备件、数量 | 创建售后出库单 | 待分配 | 销售易 → WMS |
| 分配备件库存 | 仓库管理员 | 出库单号 | 分配售后仓可用库存 | 已分配 | 无 |
| 拣货复核 | 仓库管理员 | 扫码 | 校验库存 | 已复核 | 无 |
| 发货 | 物流人员 | 物流信息 | 扣减售后库存 | 已发货 | 无 |
| SAP 扣账 | 系统 | 出库结果 | 模拟 SAP 售后库存扣减 | SAP 日志 | WMS → SAP |

### 4.8 客户 VMI 出库与消耗结算流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 创建寄售出库单 | 计划/履约 Mock | 客户、产品、数量 | 创建客户 VMI 出库单 | 待分配 | 履约 → WMS |
| 分配库存 | 仓库管理员 | 出库单号 | 校验客户 VMI 安全库存和可补货规则 | 已分配 | 无 |
| 发货至客户 VMI | 仓库/物流 | SN/数量 | 物理出库，转入客户 VMI 虚拟库存 | 客户 VMI 库存增加 | 无 |
| SAP 库存转移 | 系统 | 寄售出库结果 | 仅做库存转移，不做财务确认 | SAP 转储日志 | WMS → SAP |
| 客户消耗 | 客户/业务 | 消耗单或扫码 | 扣减客户 VMI 虚拟库存 | 消耗记录 | 无 |
| 结算 | 系统 | 消耗记录 | 推送 SAP 触发开票 Mock | VMI 结算单 | WMS → SAP |

### 4.9 供应商 VMI 领用与结算流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 供应商备货入库 | 仓库管理员 | 供应商、产品、数量 | 入库并标记供应商所有权 | 供应商 VMI 库存 | 无 |
| 生产/售后领用 | 生产/售后人员 | 领用单、产品、数量 | FIFO 分配供应商 VMI 库存 | 待出库 | 无 |
| 扫码出库 | 仓库管理员 | SN/批次/数量 | 扣减 VMI 库存 | 领用明细 | 无 |
| SAP AP 结算 | 系统 | 领用明细 | 推送 SAP 生成采购收货凭证 Mock | 供应商结算单 | WMS → SAP |

### 4.10 库存盘点流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 创建盘点单 | 仓库管理员 | 仓库、库区、产品范围 | 生成账面库存快照 | 盘点单 | 无 |
| 实盘录入 | 仓库管理员 | 实盘数量/SN | 记录实盘结果 | 盘点明细 | 无 |
| 差异计算 | 系统 | 账面和实盘 | 计算盘盈盘亏 | 差异清单 | 无 |
| 差异确认 | 仓库主管 | 确认结果 | 生成库存调整单 | 调整单 | 无 |
| 库存生效 | 系统 | 调整单 | 更新库存和流水 | 新库存 | 无 |

### 4.11 库存冻结/解冻流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 发起冻结 | 仓库管理员 | 产品/SN/批次/库位、原因 | 校验库存存在且未出库 | 冻结记录 | 无 |
| 冻结生效 | 系统 | 冻结记录 | 更新库存冻结数量、SN 状态 | 冻结库存 | 无 |
| 发起解冻 | 仓库管理员 | 冻结记录 | 校验冻结状态 | 解冻记录 | 无 |
| 解冻生效 | 系统 | 解冻记录 | 恢复可用库存 | 可用库存 | 无 |

### 4.12 安全库存预警流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 配置安全库存 | 计划人员 | 仓库、产品、安全库存 | 保存预警参数 | 安全库存配置 | 无 |
| 定时计算 | 系统 | 当前库存 | 比较可用库存和安全库存 | 预警记录 | 无 |
| 工作台提醒 | 系统 | 预警记录 | 推送待办和看板 | 低库存提醒 | 无 |
| 生成补货建议 | 计划人员 | 预警记录 | 计算缺口数量 | 补货建议 | 无 |

### 4.13 长库龄/呆滞库存预警流程

| 流程节点 | 操作角色 | 输入 | 系统处理 | 输出 | 关联接口 |
|---|---|---|---|---|---|
| 配置库龄阈值 | 计划/仓库 | 产品、阈值天数 | 保存阈值 | 阈值配置 | 无 |
| 定时计算库龄 | 系统 | 入库日期、当前日期 | 计算库龄天数 | 库龄结果 | 无 |
| 生成预警 | 系统 | 库龄结果 | 超阈值生成预警 | 呆滞库存记录 | 无 |
| 电池类补电提醒 | 系统 | 是否电池类 | 生成补电建议 | 补电预警 | 无 |
| 看板展示 | 管理层 | 预警数据 | 展示长库龄和呆滞趋势 | 库龄看板 | 无 |

---

## 五、数据库模型设计

### 5.1 数据库命名规范

1. 表名使用英文 snake_case。
2. 主键统一为 `id BIGINT PRIMARY KEY AUTO_INCREMENT`。
3. 所有业务表包含：`created_by`、`created_at`、`updated_by`、`updated_at`、`deleted_flag`。
4. 单据状态统一使用 `status VARCHAR(32)`。
5. 金额使用 `DECIMAL(18,2)`，数量使用 `DECIMAL(18,4)`。
6. SN 使用 `VARCHAR(64)`。
7. 业务单号使用 `VARCHAR(64)`。
8. 需要接口幂等的表增加 `source_system`、`source_doc_no`、`external_id`。

### 5.2 核心数据表清单

| 表名 | 中文名称 | 主要字段 | 主键/外键 | 示例数据 |
|---|---|---|---|---|
| product_master | 产品主数据 | id, product_code, product_name, product_category, model, unit, sn_required, battery_flag, shelf_life_days, safety_stock_qty, aging_threshold_days, status | PK: id; UNIQUE: product_code | GT3-30KD1R11001 |
| customer_master | 客户主数据 | id, customer_code, customer_name, customer_type, country, region, contact_name, contact_phone, address, vmi_flag, status | PK: id; UNIQUE: customer_code | CUST-TESLA-001 |
| supplier_master | 供应商主数据 | id, supplier_code, supplier_name, supplier_type, contact_name, contact_phone, vmi_flag, status | PK: id; UNIQUE: supplier_code | SUP-VMI-001 |
| warehouse | 仓库表 | id, warehouse_code, warehouse_name, warehouse_type, region, country, city, owner_type, related_customer_id, related_supplier_id, status | PK: id; FK: related_customer_id, related_supplier_id | WH-HZ-CENTRAL |
| warehouse_area | 库区表 | id, area_code, area_name, warehouse_id, area_type, quality_status_limit, status | PK: id; FK: warehouse_id | AREA-GOOD-01 |
| warehouse_location | 库位表 | id, location_code, location_name, warehouse_id, area_id, rack_no, level_no, column_no, capacity_qty, frozen_flag, status | PK: id; FK: warehouse_id, area_id | A01-01-01 |
| inventory_stock | 库存表 | id, warehouse_id, area_id, location_id, product_id, batch_no, owner_type, owner_id, total_qty, available_qty, allocated_qty, frozen_qty, quality_status, inbound_date, status | PK: id; FK: warehouse_id, area_id, location_id, product_id | 库存 10，可用 8 |
| serial_number | SN 表 | id, sn_code, product_id, mes_work_order_no, sap_work_order_no, warehouse_id, location_id, pallet_code, box_code, sn_status, quality_status, inbound_order_no, outbound_order_no, sold_flag | PK: id; UNIQUE: sn_code; FK: product_id | SN-GT3-0001 |
| package_binding | 托盘/箱/SN 绑定关系表 | id, pallet_code, box_code, sn_code, product_id, bind_order_no, bind_status, bind_time | PK: id; FK: product_id | PLT202606110001 / BOX202606110001 / SN-GT3-0001 |
| inbound_order | 入库单主表 | id, inbound_order_no, inbound_type, source_system, source_doc_no, warehouse_id, supplier_id, customer_id, plan_date, status, remark | PK: id; UNIQUE: inbound_order_no; FK: warehouse_id | IN202606110001 |
| inbound_order_line | 入库单明细表 | id, inbound_order_id, line_no, product_id, plan_qty, received_qty, shelved_qty, batch_no, quality_status, status | PK: id; FK: inbound_order_id, product_id | 计划 10，已收 5 |
| outbound_order | 出库单主表 | id, outbound_order_no, outbound_type, source_system, source_doc_no, warehouse_id, customer_id, supplier_id, status, ship_to_address, logistics_no | PK: id; UNIQUE: outbound_order_no; FK: warehouse_id | OUT202606110001 |
| outbound_order_line | 出库单明细表 | id, outbound_order_id, line_no, product_id, order_qty, allocated_qty, picked_qty, shipped_qty, batch_no, status | PK: id; FK: outbound_order_id, product_id | 订单 5，已分配 5 |
| count_order | 盘点单主表 | id, count_order_no, warehouse_id, count_scope, status, freeze_flag, remark | PK: id; UNIQUE: count_order_no; FK: warehouse_id | CNT202606110001 |
| count_order_line | 盘点单明细表 | id, count_order_id, product_id, location_id, book_qty, actual_qty, diff_qty, diff_reason | PK: id; FK: count_order_id, product_id, location_id | 账面 10，实盘 9 |
| inventory_adjustment | 库存调整单 | id, adjustment_no, warehouse_id, location_id, product_id, before_qty, after_qty, diff_qty, reason, status | PK: id; UNIQUE: adjustment_no; FK: warehouse_id, location_id, product_id | ADJ202606110001 |
| inventory_freeze_record | 库存冻结记录 | id, freeze_no, warehouse_id, location_id, product_id, sn_code, freeze_qty, reason, freeze_status | PK: id; UNIQUE: freeze_no; FK: warehouse_id, location_id, product_id | FRZ202606110001 |
| vmi_inventory_record | VMI 库存记录 | id, vmi_type, warehouse_id, customer_id, supplier_id, product_id, sn_code, stock_qty, consumed_qty, settlement_status | PK: id; FK: warehouse_id, customer_id, supplier_id, product_id | CUSTOMER_VMI 库存 10 |
| rma_order | RMA 售后单 | id, rma_no, source_system, customer_id, product_id, original_sn, return_reason, inspection_result, status | PK: id; UNIQUE: rma_no; FK: customer_id, product_id | RMA202606110001 |
| interface_log | 接口日志 | id, interface_code, interface_name, source_system, target_system, direction, business_doc_no, request_body, response_body, status, retry_count, error_message, created_at | PK: id | MES_SN_PUSH 成功 |
| operation_log | 操作日志 | id, user_id, username, module_name, operation_type, business_doc_no, before_data, after_data, ip_address, operation_time | PK: id | admin RECEIVE IN202606110001 |

### 5.3 建议字段类型细则

| 字段类型 | 推荐 MySQL 类型 |
|---|---|
| 主键 ID | BIGINT AUTO_INCREMENT |
| 业务单号 | VARCHAR(64) |
| 编码类 | VARCHAR(64) |
| 名称类 | VARCHAR(128) |
| 状态类 | VARCHAR(32) |
| 数量 | DECIMAL(18,4) |
| 金额 | DECIMAL(18,2) |
| 日期 | DATE |
| 时间 | DATETIME |
| 报文 | JSON |
| 备注 | VARCHAR(255) / TEXT |

---

## 六、接口契约设计

### 6.1 接口通用规范

| 项目 | 规范 |
|---|---|
| 协议 | HTTP REST |
| 数据格式 | JSON |
| 编码 | UTF-8 |
| 认证 | Alpha 版使用 Header：`X-Mock-Token: wms-alpha-token` |
| 幂等键 | `requestId` + `sourceSystem` + `businessDocNo` |
| 成功码 | `code = 0` |
| 失败码 | `code != 0` |
| 日志 | 每次请求必须写入 `interface_log` |
| 重试 | 出站接口失败自动重试 3 次；入站接口不自动重试，由上游重发或页面手动模拟 |

### 6.2 SAP → WMS：产品档案下发接口

- 接口名称：产品档案下发接口
- 调用方向：SAP → WMS
- 请求方式：POST
- URL：`/api/mock/sap/products`

请求参数 JSON 示例：

```json
{
  "requestId": "REQ-SAP-PROD-202606110001",
  "sourceSystem": "SAP",
  "products": [
    {
      "productCode": "GT3-30KD1R11001",
      "productName": "工商业储能电池包",
      "productCategory": "FINISHED_GOODS",
      "model": "GT3-30K",
      "unit": "PCS",
      "snRequired": true,
      "batteryFlag": true,
      "safetyStockQty": 50,
      "agingThresholdDays": 180
    }
  ]
}
```

返回结果 JSON 示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "createdCount": 1,
    "updatedCount": 0
  }
}
```

- 成功状态：产品新增或更新成功，记录接口日志 SUCCESS。
- 失败状态：SKU 为空、重复数据异常、字段格式错误，记录 FAILED。
- 重试机制：上游重发，WMS 保证幂等。
- 接口日志记录要求：记录 requestId、产品数量、请求报文、响应报文。

### 6.3 SAP → WMS：生产工单/ASN 下发接口

- 接口名称：生产工单下发接口
- 调用方向：SAP → WMS
- 请求方式：POST
- URL：`/api/mock/sap/production-orders`

```json
{
  "requestId": "REQ-SAP-MO-202606110001",
  "sourceSystem": "SAP",
  "workOrderNo": "MO202606110001",
  "warehouseCode": "WH-HZ-CENTRAL",
  "productCode": "GT3-30KD1R11001",
  "planQty": 10,
  "planDate": "2026-06-11"
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "inboundOrderNo": "IN202606110001",
    "status": "CREATED"
  }
}
```

- 成功状态：创建生产入库单。
- 失败状态：产品不存在、仓库不存在、工单重复。
- 重试机制：幂等处理，重复 requestId 返回原入库单。
- 接口日志记录要求：记录生产工单号、入库单号。

### 6.4 MES → WMS：SN 数据下发接口

- 接口名称：SN 数据下发接口
- 调用方向：MES → WMS
- 请求方式：POST
- URL：`/api/mock/mes/serial-numbers`

```json
{
  "requestId": "REQ-MES-SN-202606110001",
  "sourceSystem": "MES",
  "mesWorkOrderNo": "MES-MO-202606110001",
  "sapWorkOrderNo": "MO202606110001",
  "productCode": "GT3-30KD1R11001",
  "serialNumbers": [
    "SN-GT3-0001",
    "SN-GT3-0002",
    "SN-GT3-0003"
  ]
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "receivedCount": 3,
    "duplicateCount": 0
  }
}
```

- 成功状态：SN 写入，状态 ISSUED。
- 失败状态：SN 重复、产品不存在、工单不存在。
- 重试机制：支持幂等，重复 SN 不重复创建。
- 接口日志记录要求：记录 SN 数量、重复 SN 数量、失败明细。

### 6.5 履约系统 → WMS：发运订单下发接口

- 接口名称：发运订单下发接口
- 调用方向：履约系统 → WMS
- 请求方式：POST
- URL：`/api/mock/fulfillment/shipment-orders`

```json
{
  "requestId": "REQ-FUL-SO-202606110001",
  "sourceSystem": "FULFILLMENT",
  "shipmentOrderNo": "SO202606110001",
  "orderType": "SALES",
  "customerCode": "CUST-TESLA-001",
  "warehouseCode": "WH-HZ-REGION",
  "shipToAddress": "Shanghai Pudong",
  "lines": [
    {
      "lineNo": 10,
      "productCode": "GT3-30KD1R11001",
      "qty": 5
    }
  ]
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "outboundOrderNo": "OUT202606110001",
    "status": "CREATED"
  }
}
```

- 成功状态：创建订单类型为 `SALES` 的发运订单。
- 失败状态：客户不存在、仓库不存在、产品不存在。
- 重试机制：按 shipmentOrderNo 幂等。
- 接口日志记录要求：记录订单号、行数、目标仓库。

### 6.6 销售易 → WMS：RMA 单下发接口

- 接口名称：RMA 单下发接口
- 调用方向：销售易 → WMS
- 请求方式：POST
- URL：`/api/mock/xsy/rma-orders`

```json
{
  "requestId": "REQ-XSY-RMA-202606110001",
  "sourceSystem": "XSY",
  "rmaNo": "RMA202606110001",
  "customerCode": "CUST-TESLA-001",
  "productCode": "GT3-30KD1R11001",
  "originalSn": "SN-GT3-0001",
  "returnReason": "客户现场故障退回"
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "rmaNo": "RMA202606110001",
    "inboundOrderNo": "IN-RMA-202606110001",
    "status": "CREATED"
  }
}
```

- 成功状态：创建 RMA 单和售后入库单。
- 失败状态：原 SN 不存在、客户不存在、追溯校验失败。
- 重试机制：按 rmaNo 幂等。
- 接口日志记录要求：记录原 SN、RMA 单号、校验结果。

### 6.7 WMS → 追溯系统：出库 SN 回传接口

- 接口名称：出库 SN 回传接口
- 调用方向：WMS → 追溯系统
- 请求方式：POST
- URL：`/api/mock/trace/outbound-sn`

```json
{
  "requestId": "REQ-WMS-TRACE-202606110001",
  "sourceSystem": "WMS",
  "outboundOrderNo": "OUT202606110001",
  "customerCode": "CUST-TESLA-001",
  "shipDate": "2026-06-11",
  "serialNumbers": [
    "SN-GT3-0001",
    "SN-GT3-0002"
  ]
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "traceStatus": "RECEIVED",
    "receivedCount": 2
  }
}
```

- 成功状态：SN 标记为已回传追溯。
- 失败状态：追溯服务不可用、SN 状态异常。
- 重试机制：自动重试 3 次，失败进入出库回传异常。
- 接口日志记录要求：记录出库单、SN 数量、响应状态。

### 6.8 WMS → SAP：单据过账接口

- 接口名称：单据过账接口
- 调用方向：WMS → SAP
- 请求方式：POST
- URL：`/api/mock/sap/material-documents`

```json
{
  "requestId": "REQ-WMS-SAP-202606110001",
  "sourceSystem": "WMS",
  "businessType": "OUTBOUND_POSTING",
  "businessDocNo": "OUT202606110001",
  "warehouseCode": "WH-HZ-REGION",
  "lines": [
    {
      "productCode": "GT3-30KD1R11001",
      "qty": 5,
      "movementType": "601"
    }
  ]
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "sapMaterialDocNo": "4900000001",
    "postingStatus": "POSTED"
  }
}
```

- 成功状态：单据状态更新为 SAP_POSTED。
- 失败状态：SAP Mock 返回失败、移动类型错误。
- 重试机制：自动重试 3 次，失败进入接口异常。
- 接口日志记录要求：记录业务单号、移动类型、SAP 凭证号。

### 6.9 WMS 库存查询接口

- 接口名称：WMS 库存查询接口
- 调用方向：履约系统/销售易 → WMS
- 请求方式：POST
- URL：`/api/mock/wms/inventory/query`

```json
{
  "requestId": "REQ-INV-202606110001",
  "sourceSystem": "FULFILLMENT",
  "warehouseCode": "WH-HZ-REGION",
  "productCodes": [
    "GT3-30KD1R11001"
  ]
}
```

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "warehouseCode": "WH-HZ-REGION",
      "productCode": "GT3-30KD1R11001",
      "totalQty": 100,
      "availableQty": 80,
      "allocatedQty": 10,
      "frozenQty": 10
    }
  ]
}
```

---

## 七、页面原型说明

### 7.1 总体页面布局

采用若依后台管理系统风格：

1. 左侧菜单栏：支持一级菜单、二级菜单折叠。
2. 顶部导航栏：系统名称、面包屑、用户信息、退出登录。
3. 内容区：查询区、工具按钮区、表格区、分页区。
4. 列表页固定结构：查询条件 + 操作按钮 + 数据表格 + 分页。
5. 新增/编辑使用弹窗或抽屉。
6. 详情页使用抽屉，右侧展示主表、明细、日志、接口记录。
7. 扫码作业页突出扫码输入框，扫码后自动校验并追加明细。

### 7.2 查询条件规范

| 页面 | 查询条件 |
|---|---|
| 产品主数据 | 产品编码、产品名称、产品类别、是否 SN 管理、状态 |
| 客户主数据 | 客户编码、客户名称、客户类型、是否 VMI、状态 |
| 仓库管理 | 仓库编码、仓库名称、仓库类型、区域、状态 |
| 入库单 | 入库单号、来源单号、入库类型、仓库、状态、创建日期 |
| 出库单 | 出库单号、来源单号、出库类型、仓库、客户、状态、创建日期 |
| 库存查询 | 仓库、库区、库位、产品编码、批次、库存状态 |
| SN 查询 | SN、产品编码、托盘码、箱码、状态、出入库单号 |
| 接口日志 | 接口名称、来源系统、目标系统、业务单号、状态、时间范围 |

### 7.3 表格字段规范

表格通用字段：复选框、序号、业务编码/单号、业务类型、关键主数据、数量、状态标签、创建时间、操作列。操作列固定宽度 220px，按钮使用文字按钮：查看、编辑、删除、收货、上架、分配、拣货、复核、发货、重试。

### 7.4 状态标签颜色

| 状态 | 颜色建议 | 说明 |
|---|---|---|
| CREATED | 灰色 | 已创建 |
| RECEIVING / PICKING | 蓝色 | 处理中 |
| RECEIVED / PICKED | 青色 | 已完成中间作业 |
| ON_SHELF / SHIPPED / CLOSED | 绿色 | 已完成 |
| CANCELED | 灰色 | 已取消 |
| FAILED | 红色 | 失败 |
| WARNING | 橙色 | 预警 |
| FROZEN | 红色 | 冻结 |
| PENDING | 黄色 | 待检 |
| QUALIFIED | 绿色 | 合格 |
| UNQUALIFIED | 红色 | 不合格 |

### 7.5 异常提示规范

| 异常场景 | 页面提示 |
|---|---|
| SN 重复扫描 | 该 SN 已扫描，请勿重复操作 |
| SN 不属于当前单据 | 该 SN 不属于当前单据或未分配 |
| 库存不足 | 可用库存不足，无法分配 |
| 冻结库存出库 | 冻结库存不可出库 |
| 不合格库存出库 | 不合格库存不可分配出库 |
| 收货超量 | 收货数量不能超过计划数量 |
| 接口失败 | 接口调用失败，请在接口中心查看并重试 |
| 库位冻结 | 目标库位已冻结，不允许上架 |

### 7.6 扫码输入交互

1. 自动聚焦。
2. 支持回车触发。
3. 扫码成功后清空输入框。
4. 成功提示音可用浏览器提示代替。
5. 失败时红色提示并保留错误日志。
6. 支持扫描 SN、箱码、托盘码。
7. 支持批量模拟：粘贴多行 SN 后批量解析。

扫码页布局：左侧单据信息，中间扫码输入框 + 已扫描列表，右侧校验结果、异常列表，底部确认、取消、完成作业按钮。

### 7.7 导入导出要求

| 功能 | 要求 |
|---|---|
| 导入 | 支持 Excel/CSV 模板下载 |
| 导出 | 当前查询条件下导出 CSV |
| 导入校验 | 必填、唯一性、枚举值、数字格式 |
| 导入结果 | 成功条数、失败条数、失败原因 |
| Alpha 简化 | 可以先实现 CSV 导入导出 |

---

## 八、开发技术栈建议

### 8.1 推荐技术栈

| 层级 | 技术 |
|---|---|
| 前端 | Vue3 + Element Plus + Vite + Pinia + Vue Router |
| 后端 | Java 17 + Spring Boot 3.x |
| ORM | MyBatis Plus |
| 数据库 | MySQL 8 |
| 接口 | REST API |
| 权限 | Alpha 简化 JWT + 角色权限 |
| 文档 | OpenAPI/Swagger |
| 演示数据 | SQL seed 初始化 |
| 本地运行 | Docker Compose |
| 管理后台风格 | 若依 RuoYi 风格 |

### 8.2 推荐工程结构

```text
wms-alpha/
├── README.md
├── docker-compose.yml
├── docs/
│   ├── WMS_ALPHA_SPEC.md
│   ├── api-contract.md
│   ├── demo-script.md
│   └── database-design.md
├── sql/
│   ├── 01_schema.sql
│   ├── 02_seed_master_data.sql
│   ├── 03_seed_business_data.sql
│   └── 04_seed_interface_log.sql
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/company/wms/
│       │   ├── WmsApplication.java
│       │   ├── common/
│       │   ├── masterdata/
│       │   ├── warehouse/
│       │   ├── inbound/
│       │   ├── outbound/
│       │   ├── inventory/
│       │   ├── serial/
│       │   ├── vmi/
│       │   ├── rma/
│       │   ├── interfacecenter/
│       │   ├── dashboard/
│       │   └── system/
│       └── resources/
│           ├── application.yml
│           └── mapper/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── api/
        ├── assets/
        ├── components/
        ├── layout/
        ├── router/
        ├── stores/
        ├── utils/
        └── views/
            ├── dashboard/
            ├── workbench/
            ├── masterdata/
            ├── warehouse/
            ├── inbound/
            ├── outbound/
            ├── inventory/
            ├── serial/
            ├── vmi/
            ├── rma/
            ├── interfacecenter/
            └── system/
```

### 8.3 本地启动要求

```bash
# 1. 启动 MySQL
docker compose up -d mysql

# 2. 初始化数据库
mysql -uroot -p123456 wms_alpha < sql/01_schema.sql
mysql -uroot -p123456 wms_alpha < sql/02_seed_master_data.sql
mysql -uroot -p123456 wms_alpha < sql/03_seed_business_data.sql

# 3. 启动后端
cd backend
mvn spring-boot:run

# 4. 启动前端
cd frontend
npm install
npm run dev
```

默认访问地址：

```text
前端：http://localhost:5173
后端：http://localhost:8080
Swagger：http://localhost:8080/swagger-ui/index.html
MySQL：localhost:3306/wms_alpha
```

默认账号：

| 账号 | 密码 | 角色 |
|---|---|---|
| admin | admin123 | 系统管理员 |
| wh_admin | 123456 | 仓库管理员 |
| planner | 123456 | 计划人员 |
| logistics | 123456 | 物流人员 |
| aftersale | 123456 | 售后人员 |
| manager | 123456 | 管理层 |

---

## 九、Codex 开发任务拆分

| 任务编号 | 任务名称 | 输入材料 | 需要修改或新增的文件 | 交付物 | 验收标准 | 运行测试命令 |
|---|---|---|---|---|---|---|
| TASK-001 | 初始化 WMS Alpha 前后端工程 | 本规格说明书、技术栈要求 | docker-compose.yml、backend/pom.xml、frontend/package.json、README.md | 可启动的空工程 | 前端能显示登录页；后端健康检查返回 OK；MySQL 可连接 | docker compose up -d mysql；mvn spring-boot:run；npm run dev |
| TASK-002 | 创建数据库表结构和演示数据 | 第五章数据库模型 | sql/01_schema.sql、sql/02_seed_master_data.sql、sql/03_seed_business_data.sql | MySQL 表结构和演示数据 | 所有核心表可创建；seed 后有产品、仓库、库存、SN、单据数据 | mysql -uroot -p123456 wms_alpha < sql/01_schema.sql |
| TASK-003 | 实现后端公共层 | 工程结构、接口规范 | common/api/ApiResponse.java、common/exception/*、common/security/* | 统一响应、异常处理、分页对象、登录 Mock | 所有 API 返回统一 JSON；异常返回明确错误码 | mvn test |
| TASK-004 | 产品、客户、供应商主数据 CRUD | 基础数据功能规格 | masterdata/controller/*、masterdata/service/*、frontend/src/views/masterdata/* | 主数据列表、新增、编辑、启停用页面 | SKU/客户编码/供应商编码唯一校验有效 | mvn test -Dtest=MasterDataTest；npm run build |
| TASK-005 | 仓库、库区、库位、托盘码打印 | 仓库设置功能规格 | warehouse/*、frontend/src/views/warehouse/* | 仓库/库区/库位 CRUD、托盘码生成页面 | 库位冻结后不可上架；托盘码唯一 | mvn test -Dtest=WarehouseTest |
| TASK-006 | MES SN 下发、SN 查询、SN 状态流转 | SN 管理规格 | serial/*、frontend/src/views/serial/* | MES SN 列表、SN 库存页、SN 追溯页 | SN 唯一；状态可按流程流转；可按 SN 查询全链路 | mvn test -Dtest=SerialNumberTest |
| TASK-007 | 预期到货通知单统一入口 | 入库流程和页面规格 | inbound/*、frontend/src/views/inbound/* | 到货通知单列表按产品行展示、收货页、上架页、入库异常页 | 支持扫描 SN 收货；支持托盘/箱/SN 绑定；上架后增加库存；生产/采购/RMA 用订单类型区分 | mvn test -Dtest=InboundTest |
| TASK-008 | 发运订单统一入口 | 出库流程和页面规格 | outbound/*、frontend/src/views/outbound/* | 发运订单列表按产品行展示、库存分配、扫码拣货、复核发货 | FIFO 分配；冻结/不合格库存不可分配；销售/调拨/售后用订单类型区分；发货扣减库存 | mvn test -Dtest=OutboundTest |
| TASK-009 | 库存查询、移动、调整、盘点、冻结、预警 | 库存管理规格 | inventory/*、frontend/src/views/inventory/* | 库存查询、库存移动、调整、盘点、冻结、预警页面 | 库存数量计算正确；冻结后不可出库；预警数据可展示 | mvn test -Dtest=InventoryTest |
| TASK-010 | 客户 VMI 与供应商 VMI | VMI 业务流程 | vmi/*、frontend/src/views/vmi/* | 客户 VMI 库存、消耗、结算；供应商 VMI 领用、结算 | 客户 VMI 出库不触发财务确认；消耗后生成结算；供应商领用后生成 AP Mock | mvn test -Dtest=VmiTest |
| TASK-011 | RMA 单、售后入库、售后发货 | RMA 流程 | rma/*、frontend/src/views/rma/* | RMA 列表、RMA 入库、售后发货页面 | RMA 原 SN 校验；质检分流至良品/待修/报废 | mvn test -Dtest=RmaTest |
| TASK-012 | 实现 SAP、MES、履约、销售易、追溯 Mock 接口 | 第六章接口契约 | interfacecenter/*、frontend/src/views/interfacecenter/* | Mock API、接口日志、手动重试页面 | 每次接口调用记录日志；失败可重试；接口报文可查看 | mvn test -Dtest=InterfaceCenterTest |
| TASK-013 | 实现管理看板和个人工作台 | 数据驾驶舱和工作台规格 | dashboard/*、frontend/src/views/dashboard/*、frontend/src/views/workbench/* | 集团/区域/仓库库存看板、待办工作台 | KPI 数字与库存数据联动；点击预警可跳转明细 | mvn test -Dtest=DashboardTest；npm run build |
| TASK-014 | 打通核心演示闭环 | 第十章演示脚本 | docs/demo-script.md、backend/src/test/*DemoFlowTest.java | 一键初始化演示数据、完整演示流程 | 能完成 MES SN → 入库 → 上架 → 销售出库 → 追溯回传 → SAP 扣账 → 看板更新 | mvn test -Dtest=DemoFlowTest |

---

## 十、演示脚本

### 10.1 演示目标

演示自研 WMS Alpha 版可以替代 FLUX 的核心作业链路：

MES 下发 SN → 预期到货通知单（生产入库类型）→ 托盘/箱/SN 绑定 → 上架 → 库存查询 → 发运订单（销售出库类型）→ 系统分配库存 → 拣货 → 出库复核 → 发货 → SN 回传追溯 → SAP 库存扣减 Mock → 看板更新。

### 10.2 演示准备数据

| 数据类型 | 示例 |
|---|---|
| 产品 | GT3-30KD1R11001，工商业储能电池包，SN 管理 |
| 仓库 | WH-HZ-CENTRAL，杭州集团总仓 |
| 库区 | 良品区 AREA-GOOD-01 |
| 库位 | A01-01-01、A01-01-02 |
| 生产工单 | MO202606110001 |
| MES 工单 | MES-MO-202606110001 |
| SN | SN-GT3-0001 至 SN-GT3-0010 |
| 托盘码 | PLT202606110001 |
| 箱码 | BOX202606110001、BOX202606110002 |
| 销售订单 | SO202606110001 |
| 客户 | CUST-TESLA-001 |

### 10.3 演示步骤

#### 步骤 1：MES 下发 SN

操作路径：接口中心 → Mock 接口 → MES SN 下发

操作：点击“模拟 MES 下发 SN”，输入 `MES-MO-202606110001`，选择产品 `GT3-30KD1R11001`，下发 10 个 SN。

预期结果：SN 管理 → MES 下发 SN 报表出现 10 条 SN；SN 状态为 `ISSUED`；接口中心记录 `MES_SN_PUSH` 成功日志。

#### 步骤 2：SAP 下发生产工单并生成生产入库单

操作路径：接口中心 → Mock 接口 → SAP 生产工单下发

操作：输入生产工单 `MO202606110001`，产品选择 `GT3-30KD1R11001`，数量 10，仓库 `WH-HZ-CENTRAL`。

预期结果：入库管理 → 预期到货通知单中生成 `IN202606110001`，订单类型为 `PRODUCTION`，状态为 `CREATED`，来源单号为 `MO202606110001`。

#### 步骤 3：生产入库扫码收货

操作路径：入库管理 → 预期到货通知单 → 收货

操作：打开 `IN202606110001`，点击“收货”，扫描或粘贴 `SN-GT3-0001` 至 `SN-GT3-0010`，点击“确认收货”。

预期结果：入库单已收数量 = 10；SN 状态从 `ISSUED` 更新为 `INBOUND`；重复扫描提示“该 SN 已扫描，请勿重复操作”。

#### 步骤 4：托盘/箱/SN 绑定

操作路径：入库管理 → 预期到货通知单 → 绑定托盘/箱/SN

操作：输入托盘码 `PLT202606110001`；箱码 `BOX202606110001` 绑定 `SN-GT3-0001` 至 `SN-GT3-0005`；箱码 `BOX202606110002` 绑定 `SN-GT3-0006` 至 `SN-GT3-0010`；点击“确认绑定”。

预期结果：生成 10 条 `package_binding` 记录；SN 表写入托盘码和箱码；页面展示托盘 → 箱 → SN 层级关系。

#### 步骤 5：上架

操作路径：入库管理 → 预期到货通知单 → 上架

操作：选择入库单 `IN202606110001`，扫描托盘码 `PLT202606110001`，选择目标库位 `A01-01-01`，点击“确认上架”。

预期结果：库存表增加 10 件库存；可用库存增加 10；SN 状态更新为 `ON_SHELF`；入库单状态更新为 `ON_SHELF` 或 `CLOSED`；SAP 入库过账 Mock 成功。

#### 步骤 6：库存查询

操作路径：库存管理 → 库存查询

操作：查询产品 `GT3-30KD1R11001`，查询仓库 `WH-HZ-CENTRAL`。

预期结果：总库存 = 10；可用库存 = 10；已分配库存 = 0；冻结库存 = 0；点击“查看 SN”，显示 10 个 SN。

#### 步骤 7：销售订单下发

操作路径：接口中心 → Mock 接口 → 履约发运订单下发

操作：创建销售订单 `SO202606110001`，客户 `CUST-TESLA-001`，产品 `GT3-30KD1R11001`，数量 5，发货仓 `WH-HZ-CENTRAL`。

预期结果：出库管理 → 发运订单生成 `OUT202606110001`，订单类型为 `SALES`，状态为 `CREATED`，接口日志成功。

#### 步骤 8：系统分配库存

操作路径：出库管理 → 发运订单 → 分配库存

操作：打开出库单 `OUT202606110001`，点击“自动分配”，系统按 FIFO 分配 5 个 SN。

预期结果：已分配数量 = 5；可用库存从 10 减为 5；已分配库存从 0 增为 5；`SN-GT3-0001` 至 `SN-GT3-0005` 状态更新为 `ALLOCATED`；出库单状态更新为 `ALLOCATED`。

#### 步骤 9：扫码拣货

操作路径：出库管理 → 发运订单 → 拣货

操作：打开拣货页，扫描库位 `A01-01-01`，扫描 `SN-GT3-0001` 至 `SN-GT3-0005`，点击“完成拣货”。

预期结果：已拣数量 = 5；SN 状态更新为 `PICKED`；若扫描 `SN-GT3-0008`，提示“该 SN 不属于当前单据或未分配”。

#### 步骤 10：出库复核

操作路径：出库管理 → 发运订单 → 出库复核

操作：扫描箱码或逐个扫描 SN，确认数量 5，点击“复核完成”。

预期结果：复核数量 = 5；出库单状态更新为 `REVIEWED`；复核人、复核时间写入操作日志。

#### 步骤 11：发货

操作路径：出库管理 → 发运订单 → 发货

操作：输入物流公司 `SF`，输入物流单号 `SF202606110001`，点击“确认发货”。

预期结果：总库存从 10 减为 5；已分配库存从 5 减为 0；SN 状态更新为 `SHIPPED`；出库单状态更新为 `SHIPPED`。

#### 步骤 12：SN 回传追溯

系统自动调用追溯 Mock 接口 `/api/mock/trace/outbound-sn`，回传出库单号、客户、5 个 SN。

预期结果：接口中心出现 `TRACE_OUTBOUND_SN` 成功日志；SN 状态更新为 `TRACED`；SN `sold_flag` 更新为 1。

#### 步骤 13：SAP 库存扣减 Mock

系统自动调用 SAP 单据过账接口 `/api/mock/sap/material-documents`，移动类型为销售出库扣减。

预期结果：接口中心出现 `SAP_POSTING` 成功日志；出库单写入 SAP 凭证号 `4900000001`；出库单状态更新为 `CLOSED`。

#### 步骤 14：看板更新

操作路径：数据驾驶舱

预期结果：今日出库数量增加 5；产品库存从 10 变为 5；入出库趋势图更新；若当前库存低于安全库存，安全库存预警出现该 SKU；工作台待办减少，接口异常为 0。

---

## 十一、Alpha 版验收清单

| 验收项 | 验收标准 |
|---|---|
| 本地运行 | 前端、后端、MySQL 均可本地启动 |
| 数据初始化 | SQL seed 后可直接演示 |
| 菜单完整 | 12 个一级模块可访问 |
| 主数据 | 产品、客户、供应商、仓库、库区、库位可维护 |
| 入库闭环 | 生产入库可完成 SN 收货、绑定、上架 |
| 出库闭环 | 销售出库可完成分配、拣货、复核、发货 |
| 库存准确 | 入库增加库存，出库扣减库存，冻结影响可用库存 |
| SN 追溯 | SN 状态可完整流转并查询 |
| VMI | 客户 VMI 和供应商 VMI 可演示基本流程 |
| RMA | RMA 入库可校验原 SN 并分流库存 |
| 接口中心 | Mock 接口有请求、响应、状态、重试记录 |
| 看板 | 库存、预警、今日入出库数据可展示 |
| 可工程化 | 代码分层清晰，模块边界明确，接口可替换真实系统 |
# 2026-06-15 迭代修正：入库/出库单据主从结构与菜单收敛

本次迭代修正以下设计口径，优先级高于历史章节中关于“列表按产品行展示”或“上架”的旧描述：

1. 入库管理只保留统一单据入口“预期到货通知单”，不同业务通过 `inbound_type` 区分。
2. 出库管理只保留统一单据入口“发运订单”，不同业务通过 `outbound_type` 区分。
3. 入库列表按 `wms_inbound_order` 主表维度展示，一张单据只显示一行。
4. 出库列表按 `wms_outbound_order` 主表维度展示，一张单据只显示一行。
5. 产品明细行只在详情页子表展示，不再作为列表主行分页。
6. 入库详情页采用“主表信息 + 入库明细 + SN 明细 + 操作记录 + 接口日志”的结构。
7. 出库详情页采用“主表信息 + 产品明细 + 分配/拣货/复核/发货记录 + 接口日志 + 操作日志”的结构。
8. 入库取消独立上架作业；收货时选择目标库位，完成 SN 与库存库位落位。
9. 入库管理新增二级菜单“SN 绑定”，用于查看 ASN 中采集的 SN、箱码、托盘码绑定关系，支持单条删除和批量删除。
10. 入库类型统一为 `PRODUCTION`、`STOCKING`、`RMA`、`TRANSFER`、`SUPPLIER_VMI`、`OTHER`。
11. 入库订单状态统一为 `CREATED`（创建）、`RECEIVING`（部分收货）、`RECEIVED`（完全收货）、`CLOSED`（订单关闭），失败回传使用 `SAP_FAILED`。

## 2026-06-15 迭代修正：入库 SN 采集按产品行联动

本次修正覆盖入库 SN 采集弹窗、产品维度、数量校验和入库单联动，不调整菜单结构，不新增模块。

1. SN 采集入口从入库单表头下沉到入库详情页的入库明细行，每个产品行独立点击“采集 SN”。
2. SN 采集弹窗标题为“SN 采集 / 托盘箱码绑定”，展示 ASN 单号、入库类型、仓库、行号、产品编码、产品名称、计划数量、已收数量、本次录入数量、剩余可采集数量、托盘码、可选箱码和校验结果。
3. SN 输入支持换行、英文逗号、中文逗号、分号和空白分隔，自动去除空值并识别重复录入。
4. 数量校验以产品行为单位：`本次有效 SN 数量 + 行已收数量 <= 行计划数量`，超出时禁止确认。
5. 产品校验以当前明细行产品为准：已存在 SN 必须属于当前产品；新 SN 允许现场创建，但必须写入当前产品 ID，禁止生成无产品归属 SN。
6. 唯一性校验覆盖本次输入重复、当前 ASN 已采集、其他 ASN 已绑定、其他明细行已绑定、已入库/已上架/已出库状态、质量不合格和锁定 SN。
7. 确认采集后写入或更新 SN、箱托绑定、入库明细行已收数量和状态，并聚合刷新入库单主表状态。
8. SN 采集不等同于上架，不直接增加 `wms_inventory.available_qty`；库存入账仍由后续上架/入账逻辑识别。
9. SN 绑定列表删除带明细行关联的采集记录时，释放 SN 行关联并回退对应明细行已收数量，支持回到 ASN 重新采集。
