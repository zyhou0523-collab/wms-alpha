# WMS PC 多语种能力设计

## 一、多语种目标

为 WMS PC 端建立可持续扩展的多语种能力，第一阶段覆盖登录页、顶部导航、左侧菜单、通用按钮、订单状态、发运订单列表、预期到货通知单列表和库存查询部分字段。后续逐步扩展到全部模块、后端错误码和系统管理字典。

## 二、支持语种

| 语种 | 编码 |
| --- | --- |
| 简体中文 | `zh-CN` |
| English | `en-US` |
| Português | `pt-BR` |
| Español | `es-ES` |

默认语种为 `zh-CN`。

## 三、前端 i18n 方案

当前项目未安装 `vue-i18n`，且本轮不依赖网络安装新包。第一阶段实现轻量本地 i18n 适配层：

- `frontend/src/i18n/index.ts`：语言状态、`t()`、菜单标题、状态标签辅助函数。
- `frontend/src/i18n/lang/*.ts`：本地人工词条包。
- 语言偏好写入 `localStorage.wms_locale`。
- 刷新后自动恢复语言。

该适配层只封装显示逻辑，不改变业务数据、状态编码或接口协议。后续如正式引入 `vue-i18n`，可将当前词条包平移为 `messages`。

## 四、词条文件结构

当前文件：

- `frontend/src/i18n/lang/zh-CN.ts`
- `frontend/src/i18n/lang/en-US.ts`
- `frontend/src/i18n/lang/pt-BR.ts`
- `frontend/src/i18n/lang/es-ES.ts`

主要结构：

```ts
export default {
  common: {},
  login: {},
  menu: {},
  outbound: {},
  inbound: {},
  inventory: {},
  status: {},
  sapStatus: {},
  inventoryStatus: {}
}
```

## 五、语言切换逻辑

- 登录页提供语言切换入口。
- 登录后主布局右上角用户信息附近提供语言切换入口。
- 切换后当前页面立即响应。
- 语言写入 `localStorage`。
- `document.documentElement.lang` 同步为当前语种编码。

## 六、菜单和状态国际化方案

菜单：

- 当前菜单来自 mock 接口，返回中文标题。
- `menuTitle(title, path)` 优先按路径映射翻译，路径不可识别时按中文标题映射。
- 未维护词条时回退原中文标题。

状态：

- 订单业务状态仍使用原编码，如 `CREATED`、`PARTIAL_SHIPPED`。
- 页面显示调用 `statusLabel()`。
- SAP 回传状态调用 `sapStatusLabel()`。
- 库存状态调用 `inventoryStatusLabel()`。
- 未维护词条时回退状态编码，避免页面报错。

## 七、在线翻译 API 预留方案

采用“人工词条包 + 后端缓存 + 在线翻译辅助”的模式：

1. 前端优先读取本地词条。
2. 本地没有时，可请求后端翻译缓存。
3. 缓存没有且启用在线翻译时，由后端调用翻译平台。
4. 翻译结果写入缓存。
5. 翻译不可用时回退中文或 key。

本轮只新增前端 API 封装 `frontend/src/api/i18n.ts`，不强制调用后端，不写入任何 API Key。

## 八、后端翻译缓存设计

建议表：`sys_i18n_message`

| 字段 | 说明 |
| --- | --- |
| id | 主键 |
| message_key | 词条 key |
| source_text | 原文 |
| locale | 语言编码 |
| translated_text | 译文 |
| source | `manual` / `baidu` / `google` |
| module | 模块 |
| status | 启用 / 停用 |
| created_at | 创建时间 |
| updated_at | 更新时间 |

建议唯一索引：`message_key + locale`。

## 九、环境变量配置

默认不启用在线翻译：

```env
TRANSLATE_PROVIDER=none
TRANSLATE_ENABLED=false
TRANSLATE_API_KEY=
TRANSLATE_SECRET=
```

安全要求：

- API Key/Secret 只能来自环境变量或后端安全配置。
- 不写死在前端代码。
- 不提交真实密钥。
- 没有翻译平台账号时系统仍可启动。

## 十、当前已完成范围

- 新增四语种本地词条包。
- 新增 `useI18n()`、`t()`、菜单标题和状态标签辅助函数。
- 登录页增加语言切换并覆盖标题、账号、密码、登录按钮。
- 主布局右上角增加语言切换并覆盖菜单、面包屑、退出登录。
- 发运订单列表覆盖页面标题、查询条件、通用按钮、SAP 状态、订单状态。
- 预期到货通知单列表覆盖页面标题、查询条件、通用按钮、SAP 状态、订单状态。
- 库存查询覆盖页面标题、查询字段、主要列名、通用按钮、库存状态。
- 新增在线翻译 API 前端预留封装。

## 十一、后续补充计划

- 正式评估并引入 `vue-i18n`，统一插件化能力。
- 将所有页面文本从硬编码逐步迁移到词条。
- 后端增加 `sys_i18n_message` 表和缓存接口。
- 后端错误码和校验提示国际化。
- 系统管理字典增加多语种字段或字典翻译子表。
- 报表、图表、导入导出模板多语种化。
- 葡萄牙语和西班牙语词条由业务人员二次校对。
