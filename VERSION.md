# WMS 独立版 V2.4

版本号：WMS 独立版 V2.4

版本类型：PC 独立系统冻结版 / SaaS 化迁移基线

冻结日期：2026-07-06

Git 仓库：https://github.com/zyhou0523-collab/wms-alpha.git

Git 分支：release/wms-PCstandalone-v2.4

Tag：PCwms-standalone-v2.4

## 版本说明

WMS 独立版 V2.4 基于 `release/wms-pc-v2.3` 继续冻结整理，重点保留当前可运行、可演示、可查询、可创建、可测试的 WMS 独立系统状态，作为后续迁移到供应链 SaaS 平台前的稳定基线。

## 本版本重点

1. 冻结当前 WMS 独立系统能力，保留入库、出库、库存、报表、接口、系统管理和多语种基础能力。
2. 纳入 V2.3 后续演示验证修复，包括入库关闭、部分收货分单、出库部分发运关单分单、完全发运普通关闭等演示链路。
3. 生成独立版冻结说明、当前功能清单、数据库结构说明、接口初步清单和 SaaS 化迁移注意事项。
4. 记录当前运行验证结果、环境限制和已知问题。
5. 创建稳定分支和版本 tag，作为后续平台化迁移的对照基线。

## 发布边界

- 本轮只做独立版冻结、文档更新、构建检查、分支和 tag 固化。
- 本轮不新增业务功能，不做平台化改造。
- 本轮不覆盖 `main`、`master`、`release/wms-pc-v2.3`、`release/wms-pc-v2.2` 或其他历史分支。
- 本轮不写入在线翻译 API Key、真实密码、真实 token 或其他敏感信息。

## 冻结文档

- [WMS 独立版 V2.4 冻结说明](./docs/WMS_STANDALONE_V2.4_FREEZE_NOTE.md)
- [WMS 当前功能清单](./docs/WMS_CURRENT_FEATURE_LIST.md)
- [WMS 当前数据库结构说明](./docs/WMS_CURRENT_DATABASE_STRUCTURE.md)
- [WMS 当前接口初步清单](./docs/WMS_CURRENT_API_LIST.md)
- [WMS 后续 SaaS 化迁移注意事项](./docs/WMS_SAAS_MIGRATION_NOTES.md)
