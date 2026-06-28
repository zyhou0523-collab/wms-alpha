# Database

## 初始化

```bash
mysql -uroot -p123456 < schema.sql
mysql -uroot -p123456 wms_alpha < seed.sql
```

脚本默认创建数据库 `wms_alpha`，字符集为 `utf8mb4`。

## 数据范围

- 6 个仓库，覆盖集团总仓、区域销售仓、第三方仓、售后仓、客户 VMI 仓、供应商 VMI 仓。
- 10 个产品、5 个客户、5 个供应商。
- 100 条 SN、50 条库存记录。
- 10 条入库单、10 条出库单。
- 20 条接口日志。

