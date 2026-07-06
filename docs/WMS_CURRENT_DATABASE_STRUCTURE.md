# WMS 当前数据库结构说明

## 一、总体说明

当前 WMS 独立版数据库以 MySQL 8 为目标，核心 DDL 位于 `sql/01_schema.sql`，主数据和 demo 数据位于 `sql/02_seed_master_data.sql`、`sql/03_seed_business_data.sql`，状态治理和关闭流程补充脚本位于 `sql/04_seed_status_governance.sql` 到 `sql/07_outbound_close_flow.sql`。

数据库设计以单体 WMS 演示为目标，尚未引入 SaaS 多租户字段、统一组织中心字段、统一审计字段和跨系统数据隔离策略。

## 二、系统权限相关表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `sys_dept` | 部门组织 | `dept_code`、`dept_name`、`parent_id` |
| `sys_post` | 岗位 | `post_code`、`post_name` |
| `sys_role` | 角色 | `role_code`、`role_name`、`data_scope`、`warehouse_scope`、`owner_scope` |
| `sys_user` | 用户 | `username`、`password_hash`、`display_name`、`dept_id`、`status` |
| `sys_menu` | 菜单/按钮权限 | `menu_name`、`menu_type`、`path`、`component`、`perms` |
| `sys_user_role` | 用户角色关系 | `user_id`、`role_id` |
| `sys_role_menu` | 角色菜单关系 | `role_id`、`menu_id` |
| `sys_role_warehouse` | 角色仓库权限 | `role_id`、`warehouse_code` |
| `sys_role_owner` | 角色货主权限 | `role_id`、`owner_code` |
| `sys_user_warehouse` | 用户仓库权限 | `user_id`、`warehouse_code` |
| `sys_user_owner` | 用户货主权限 | `user_id`、`owner_code` |
| `sys_data_scope` | 数据权限配置 | `scope_code`、`role_code`、`warehouse_codes`、`owner_codes` |

迁移注意：SaaS 化后这些表应优先与平台统一用户、租户、角色、权限、数据范围模型合并或映射。

## 三、系统配置与字典表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `sys_dict_type` | 字典类型 | `dict_name`、`dict_type`、`status` |
| `sys_dict_data` | 字典项 | `dict_type`、`dict_label`、`dict_value`、`dict_sort` |
| `sys_config` | 参数配置 | `config_key`、`config_value` |
| `sys_notice` | 通知公告 | `notice_title`、`notice_type`、`status` |
| `sys_field_config` | 页面字段配置 | `page_code`、`field_code`、`visible`、`required`、`editable` |

当前重点字典：

- `wms_outbound_order_status`
- `wms_inbound_order_status`
- `wms_sap_post_status`

## 四、主数据表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `md_product` | 产品主数据 | `product_code`、`product_name`、`owner_code`、`sn_managed`、`battery_flag`、`safety_stock` |
| `md_customer` | 客户/货主/供应商类客户资料 | `customer_code`、`customer_name`、`customer_type`、`country_region` |
| `md_supplier` | 供应商 | `supplier_code`、`supplier_name`、`supplier_type` |

迁移注意：平台化后应明确产品、客户、供应商、货主是否由 MDM/SRM/CRM 统一维护，WMS 侧只保留快照或引用。

## 五、仓库基础表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_warehouse` | 仓库 | `warehouse_code`、`warehouse_name`、`warehouse_type`、`owner_code` |
| `wms_area` | 库区 | `area_code`、`area_name`、`area_type`、`quality_status_limit` |
| `wms_location` | 库位 | `location_code`、`rack_no`、`level_no`、`capacity`、`frozen_flag` |

仓库、库区、库位是库存、入库、出库、移动和盘点的核心关联维度。

## 六、库存与 SN 表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_inventory` | 库存余额 | `warehouse_id`、`location_id`、`product_id`、`owner_code`、`batch_no`、`total_qty`、`available_qty`、`allocated_qty` |
| `wms_serial_number` | SN 主档与状态 | `sn_code`、`product_id`、`warehouse_id`、`location_id`、`status`、`locked_flag`、`inbound_order_no`、`outbound_order_no` |
| `wms_package_binding` | 托盘/箱/SN 绑定 | `pallet_code`、`box_code`、`sn_code`、`bind_status` |
| `wms_inventory_transaction` | 库存流水 | `transaction_no`、`transaction_type`、`business_doc_no`、`qty`、`before_qty`、`after_qty` |

迁移注意：库存余额、SN 状态和库存流水应设计为强一致核心模型，平台化时需要补充租户、组织、仓库授权和审计字段。

## 七、入库业务表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_inbound_order` | 预期到货通知单表头 | `order_no`、`source_order_no`、`inbound_type`、`warehouse_id`、`owner_code`、`planned_qty`、`received_qty`、`status`、`sap_post_status`、`split_from_order_no` |
| `wms_inbound_order_detail` | 入库明细 | `order_id`、`line_no`、`product_id`、`planned_qty`、`received_qty`、`shelved_qty`、`sap_storage_location`、`status` |
| `wms_inbound_receipt` | 收货批次 | `receipt_no`、`inbound_order_id`、`receipt_time`、`receipt_user`、`sap_post_status` |
| `wms_inbound_receipt_line` | 收货批次明细 | `receipt_id`、`inbound_order_line_id`、`receive_qty`、`sap_post_qty` |
| `wms_inbound_receipt_sn` | 收货 SN | `receipt_id`、`receipt_line_id`、`sn_code` |

当前已支持部分收货关闭生成分单，分单来源字段为 `split_from_order_no`。

## 八、出库业务表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_outbound_order` | 发运订单表头 | `order_no`、`source_order_no`、`outbound_type`、`warehouse_id`、`customer_id`、`planned_qty`、`allocated_qty`、`picked_qty`、`shipped_qty`、`status`、`sap_post_status`、`parent_order_no` |
| `wms_outbound_order_detail` | 发运订单明细 | `order_id`、`line_no`、`product_id`、`planned_qty`、`allocated_qty`、`picked_qty`、`shipped_qty`、`status` |
| `wms_inventory_allocation` | 库存分配记录 | `allocation_no`、`outbound_order_id`、`inventory_id`、`sn_code`、`allocated_qty`、`allocation_status` |
| `wms_picking_task` | 拣货任务 | `task_no`、`outbound_order_id`、`location_id`、`plan_qty`、`picked_qty`、`status` |
| `wms_picking_record` | 拣货记录 | `task_id`、`sn_code`、`picker`、`result` |
| `wms_outbound_review_record` | 出库复核记录 | `outbound_order_id`、`sn_code`、`reviewer`、`result` |
| `wms_shipment_record` | 发货记录 | `shipment_no`、`outbound_order_id`、`shipped_qty`、`shipper`、`sap_post_status` |
| `outbound_shipment_line` | 发货明细 | `shipment_id`、`outbound_order_line_id`、`ship_qty`、`sap_post_status` |
| `outbound_shipment_sn` | 发货 SN | `shipment_id`、`shipment_line_id`、`sn_code` |
| `wms_outbound_exception` | 出库异常 | `exception_no`、`outbound_order_no`、`exception_type`、`message` |
| `wms_outbound_status_history` | 出库状态历史 | `from_status`、`to_status`、`action`、`operator` |

当前已支持部分发运关闭生成剩余分单，分单来源字段为 `parent_order_no`。

## 九、盘点与移动表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_inventory_count_order` | 盘点单 | `count_order_no`、`count_type`、`count_scope`、`status` |
| `wms_inventory_count_line` | 盘点明细 | `count_order_id`、`book_qty`、`actual_qty`、`diff_qty`、`line_status` |
| `wms_inventory_count_adjustment` | 盘点调整 | `adjustment_no`、`adjustment_type`、`qty`、`result` |
| `wms_inventory_move_order` | 移动单 | `move_order_no`、`move_type`、`status`、`from_location_id`、`to_location_id` |
| `wms_inventory_move_line` | 移动明细 | `move_order_id`、`product_id`、`sn_code`、`move_qty`、`line_status` |

## 十、日志与接口表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `wms_interface_log` | 外部接口日志 | `interface_name`、`source_system`、`target_system`、`business_doc_no`、`status`、`error_message` |
| `wms_mock_config` | Mock 配置 | `interface_name`、`target_system`、`enabled`、`force_fail`、`delay_ms` |
| `wms_operation_log` | 操作日志 | `module`、`business_doc_no`、`action`、`operator`、`result`、`message` |
| `sys_login_log` | 登录日志 | `username`、`ipaddr`、`status`、`login_time` |

## 十一、SQL 脚本说明

| 脚本 | 用途 |
|---|---|
| `sql/01_schema.sql` | 主 schema |
| `sql/02_seed_master_data.sql` | 系统、主数据、仓库基础 seed |
| `sql/03_seed_business_data.sql` | 入库、出库、库存、报表 demo 数据 |
| `sql/04_seed_status_governance.sql` | 状态字典治理 seed |
| `sql/05_demo_status_cleanup.sql` | 历史 demo 状态清洗 |
| `sql/06_inbound_close_flow.sql` | 入库关闭流程演示数据补充 |
| `sql/07_outbound_close_flow.sql` | 出库关闭流程演示数据补充 |

## 十二、SaaS 化数据库改造提醒

1. 所有核心业务表需补充 `tenant_id`、`org_id` 或平台统一组织字段。
2. 用户、角色、菜单、部门、岗位建议迁移到平台 IAM，不在 WMS 模块重复维护。
3. 主数据建议从平台 MDM/SRM/CRM 引用，WMS 保留必要业务快照。
4. 接口日志、操作日志、登录日志应接入平台统一审计。
5. 库存表、SN 表和库存流水需要优先设计强一致、可追溯、可补偿机制。
6. 历史兼容状态不要硬删除，应通过映射表或迁移脚本平滑收敛。
