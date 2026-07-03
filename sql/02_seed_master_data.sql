USE wms_alpha;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE wms_operation_log;
TRUNCATE TABLE wms_interface_log;
TRUNCATE TABLE wms_mock_config;
TRUNCATE TABLE wms_outbound_status_history;
TRUNCATE TABLE wms_outbound_exception;
TRUNCATE TABLE wms_inventory_count_adjustment;
TRUNCATE TABLE wms_inventory_count_line;
TRUNCATE TABLE wms_inventory_count_order;
TRUNCATE TABLE wms_inventory_move_line;
TRUNCATE TABLE wms_inventory_move_order;
TRUNCATE TABLE wms_inventory_transaction;
TRUNCATE TABLE wms_shipment_record;
TRUNCATE TABLE wms_outbound_review_record;
TRUNCATE TABLE wms_picking_record;
TRUNCATE TABLE wms_picking_task;
TRUNCATE TABLE wms_inventory_allocation;
TRUNCATE TABLE wms_outbound_order_detail;
TRUNCATE TABLE wms_outbound_order;
TRUNCATE TABLE wms_inbound_receipt_sn;
TRUNCATE TABLE wms_inbound_receipt_line;
TRUNCATE TABLE wms_inbound_receipt;
TRUNCATE TABLE wms_inbound_order_detail;
TRUNCATE TABLE wms_inbound_order;
TRUNCATE TABLE wms_package_binding;
TRUNCATE TABLE wms_serial_number;
TRUNCATE TABLE wms_inventory;
TRUNCATE TABLE wms_location;
TRUNCATE TABLE wms_area;
TRUNCATE TABLE wms_warehouse;
TRUNCATE TABLE md_supplier;
TRUNCATE TABLE md_customer;
TRUNCATE TABLE md_product;
TRUNCATE TABLE sys_user_owner;
TRUNCATE TABLE sys_user_warehouse;
TRUNCATE TABLE sys_role_owner;
TRUNCATE TABLE sys_role_warehouse;
TRUNCATE TABLE sys_user_role;
TRUNCATE TABLE sys_role_menu;
TRUNCATE TABLE sys_data_scope;
TRUNCATE TABLE sys_field_config;
TRUNCATE TABLE sys_login_log;
TRUNCATE TABLE sys_notice;
TRUNCATE TABLE sys_config;
TRUNCATE TABLE sys_dict_data;
TRUNCATE TABLE sys_dict_type;
TRUNCATE TABLE sys_menu;
TRUNCATE TABLE sys_post;
TRUNCATE TABLE sys_dept;
TRUNCATE TABLE sys_role;
TRUNCATE TABLE sys_user;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO sys_dept (id, parent_id, dept_code, dept_name, leader, phone, email, order_num, status) VALUES
(1, 0, 'HQ', '集团总部', 'Admin User', '0571-100000', 'hq@example.com', 1, 'ACTIVE'),
(2, 1, 'OPS', '供应链运营部', '王经理', '0571-100001', 'ops@example.com', 2, 'ACTIVE'),
(3, 1, 'INBOUND', '入库作业组', '李主管', '0571-100002', 'inbound@example.com', 3, 'ACTIVE'),
(4, 1, 'OUTBOUND', '出库发运组', '赵主管', '0571-100003', 'outbound@example.com', 4, 'ACTIVE'),
(5, 1, 'INVENTORY', '库存管理组', '陈主管', '0571-100004', 'inventory@example.com', 5, 'ACTIVE'),
(6, 1, 'IT', '信息系统部', '系统管理员', '0571-100005', 'it@example.com', 6, 'ACTIVE');

INSERT INTO sys_post (id, post_code, post_name, post_sort, status, remark) VALUES
(1, 'SYS_ADMIN', '系统管理员', 1, 'ACTIVE', '系统配置和权限维护'),
(2, 'WMS_MANAGER', 'WMS 主管', 2, 'ACTIVE', '仓储业务管理'),
(3, 'INBOUND_OPERATOR', '入库操作员', 3, 'ACTIVE', 'SN 采集、收货、SAP 入库回传'),
(4, 'OUTBOUND_OPERATOR', '出库操作员', 4, 'ACTIVE', '分配、拣货、发货、SAP 出库回传'),
(5, 'INVENTORY_OPERATOR', '库存操作员', 5, 'ACTIVE', '库存查询、移动、盘点'),
(6, 'MASTER_DATA_ADMIN', '主数据维护员', 6, 'ACTIVE', '产品、客户、仓库主数据维护');

INSERT INTO sys_role (id, role_code, role_name, role_sort, data_scope, warehouse_scope, owner_scope, status, remark) VALUES
(1, 'ADMIN', '系统管理员', 1, 'ALL', '*', '*', 'ACTIVE', '拥有全部系统菜单和数据权限'),
(2, 'WMS_MANAGER', 'WMS 主管', 2, 'ALL_WAREHOUSE', '*', '*', 'ACTIVE', '查看驾驶舱、工作台、报表和全部 WMS 单据'),
(3, 'INBOUND_OPERATOR', '入库操作员', 3, 'CUSTOM', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SUP-CATL-VMI', '1000,3060', 'ACTIVE', '处理预期到货、SN 采集、收货和入库回传'),
(4, 'OUTBOUND_OPERATOR', '出库发运员', 4, 'CUSTOM', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SZ-AFTERSALE', '1000,3060', 'ACTIVE', '处理发运订单、分配、拣货和发货'),
(5, 'INVENTORY_ADMIN', '库存管理员', 5, 'CUSTOM', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-GZ-3PL,WH-SZ-AFTERSALE', '1000,3060', 'ACTIVE', '维护库存移动、盘点和库存查询'),
(6, 'MASTER_DATA_ADMIN', '主数据管理员', 6, 'ALL', '*', '*', 'ACTIVE', '维护产品、客户、仓库、库位等基础数据'),
(7, 'INTERFACE_ADMIN', '接口管理员', 7, 'ALL', '*', '*', 'ACTIVE', '维护 Mock 配置并处理接口失败重试'),
(8, 'OWNER_VIEWER', '货主查看员', 8, 'OWNER', 'WH-HZ-CENTRAL,WH-SH-REGION', '3060', 'ACTIVE', '只查看指定货主库存、单据和报表');

INSERT INTO sys_user (
  id, username, password_hash, display_name, nickname, dept_id, post_id, mobile, email,
  role_code, role_name, warehouse_scope, owner_scope, default_warehouse_code, default_owner_code, remark, status
) VALUES
(1, 'admin', 'admin123', '系统管理员', 'Admin', 6, 1, '13800001000', 'admin@example.com', 'ADMIN', '系统管理员', '*', '*', 'WH-HZ-CENTRAL', '1000', '默认超级管理员', 'ACTIVE'),
(2, 'wh_admin', '123456', '仓库主管', 'WMS 主管', 2, 2, '13800001001', 'whadmin@example.com', 'WMS_MANAGER', 'WMS 主管', '*', '*', 'WH-HZ-CENTRAL', '1000', '仓储运营主管', 'ACTIVE'),
(3, 'inbound01', '123456', '入库作业员', '入库一号', 3, 3, '13800001002', 'inbound01@example.com', 'INBOUND_OPERATOR', '入库操作员', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SUP-CATL-VMI', '1000,3060', 'WH-HZ-CENTRAL', '3060', '负责 SN 采集与收货', 'ACTIVE'),
(4, 'outbound01', '123456', '出库发运员', '出库一号', 4, 4, '13800001003', 'outbound01@example.com', 'OUTBOUND_OPERATOR', '出库发运员', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SZ-AFTERSALE', '1000,3060', 'WH-HZ-CENTRAL', '3060', '负责分配、拣货和发货', 'ACTIVE'),
(5, 'inventory01', '123456', '库存管理员', '库存一号', 5, 5, '13800001004', 'inventory01@example.com', 'INVENTORY_ADMIN', '库存管理员', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-GZ-3PL,WH-SZ-AFTERSALE', '1000,3060', 'WH-HZ-CENTRAL', '1000', '负责移动和盘点', 'ACTIVE'),
(6, 'masterdata01', '123456', '主数据维护员', '主数据一号', 6, 6, '13800001005', 'mdm@example.com', 'MASTER_DATA_ADMIN', '主数据管理员', '*', '*', 'WH-HZ-CENTRAL', '1000', '负责基础资料维护', 'ACTIVE'),
(7, 'interface01', '123456', '接口管理员', '接口一号', 6, 1, '13800001006', 'interface@example.com', 'INTERFACE_ADMIN', '接口管理员', '*', '*', 'WH-HZ-CENTRAL', '1000', '负责接口日志和 Mock 配置', 'ACTIVE'),
(8, 'owner3060', '123456', '货主查看员', '货主 3060', 2, 2, '13800001007', 'owner3060@example.com', 'OWNER_VIEWER', '货主查看员', 'WH-HZ-CENTRAL,WH-SH-REGION', '3060', 'WH-HZ-CENTRAL', '3060', '演示货主维度查看权限', 'ACTIVE');

INSERT INTO sys_menu (id, parent_id, menu_name, menu_type, path, component, perms, icon, order_num, visible, status, remark) VALUES
(1, 0, '数据驾驶舱', 'DIR', NULL, NULL, NULL, 'Monitor', 1, 1, 'ACTIVE', ''),
(101, 1, '全局库存看板', 'MENU', '/dashboard', 'dashboard/index', 'dashboard:view', 'DataBoard', 1, 1, 'ACTIVE', ''),
(2, 0, '工作台', 'DIR', NULL, NULL, NULL, 'HomeFilled', 2, 1, 'ACTIVE', ''),
(201, 2, '我的工作台', 'MENU', '/dashboard/workbench', 'workbench/index', 'workbench:view', 'HomeFilled', 1, 1, 'ACTIVE', ''),
(3, 0, '基础数据', 'DIR', NULL, NULL, NULL, 'Collection', 3, 1, 'ACTIVE', ''),
(301, 3, '产品主数据', 'MENU', '/masterdata/products', 'masterdata/ProductPage', 'masterdata:product:list', 'Goods', 1, 1, 'ACTIVE', ''),
(302, 3, '客户主数据', 'MENU', '/masterdata/customers', 'masterdata/CustomerPage', 'masterdata:customer:list', 'User', 2, 1, 'ACTIVE', ''),
(4, 0, '仓库设置', 'DIR', NULL, NULL, NULL, 'OfficeBuilding', 4, 1, 'ACTIVE', ''),
(401, 4, '仓库管理', 'MENU', '/warehouse/warehouses', 'warehouse/WarehousePage', 'warehouse:list', 'OfficeBuilding', 1, 1, 'ACTIVE', ''),
(402, 4, '库位管理', 'MENU', '/warehouse/locations', 'warehouse/LocationPage', 'warehouse:location:list', 'Location', 2, 1, 'ACTIVE', ''),
(5, 0, '入库管理', 'DIR', NULL, NULL, NULL, 'Download', 5, 1, 'ACTIVE', ''),
(501, 5, '预期到货通知单', 'MENU', '/inbound/arrival-notices', 'inbound/InboundOrderPage', 'inbound:order:list', 'Document', 1, 1, 'ACTIVE', ''),
(502, 5, 'SN 绑定', 'MENU', '/inbound/sn-bindings', 'inbound/SnBindingPage', 'inbound:sn:list', 'Tickets', 2, 1, 'ACTIVE', ''),
(6, 0, '出库管理', 'DIR', NULL, NULL, NULL, 'Upload', 6, 1, 'ACTIVE', ''),
(601, 6, '发运订单', 'MENU', '/outbound/shipping-orders', 'outbound/OutboundOrderPage', 'outbound:shipping:list', 'Van', 1, 1, 'ACTIVE', ''),
(7, 0, '库存管理', 'DIR', NULL, NULL, NULL, 'Box', 7, 1, 'ACTIVE', ''),
(701, 7, '库存查询', 'MENU', '/inventory/list', 'inventory/InventoryPage', 'inventory:list', 'Box', 1, 1, 'ACTIVE', ''),
(702, 7, 'SN 查询', 'MENU', '/inventory/sn', 'inventory/SnPage', 'inventory:sn:list', 'Tickets', 2, 1, 'ACTIVE', ''),
(703, 7, '库存盘点', 'MENU', '/inventory/count', 'inventory/InventoryCountPage', 'inventory:count:list', 'Checked', 3, 1, 'ACTIVE', ''),
(704, 7, '库存移动', 'MENU', '/inventory/move', 'inventory/InventoryMovePage', 'inventory:move:list', 'Switch', 4, 1, 'ACTIVE', ''),
(8, 0, '报表中心', 'DIR', NULL, NULL, NULL, 'DataAnalysis', 8, 1, 'ACTIVE', ''),
(801, 8, '进出存报表', 'MENU', '/reports/inout-stock', 'reports/InoutStockReport', 'reports:inout:list', 'TrendCharts', 1, 1, 'ACTIVE', ''),
(802, 8, '入库日报表', 'MENU', '/reports/inbound-daily', 'reports/InboundDailyReport', 'reports:inbound:list', 'DataLine', 2, 1, 'ACTIVE', ''),
(803, 8, '出库日报表', 'MENU', '/reports/outbound-daily', 'reports/OutboundDailyReport', 'reports:outbound:list', 'DataLine', 3, 1, 'ACTIVE', ''),
(804, 8, '标准库龄报表', 'MENU', '/reports/standard-aging', 'reports/StandardAgingReport', 'reports:aging:list', 'Timer', 4, 1, 'ACTIVE', ''),
(805, 8, '分段库龄报表', 'MENU', '/reports/segment-aging', 'reports/SegmentAgingReport', 'reports:aging:segment', 'PieChart', 5, 1, 'ACTIVE', ''),
(806, 8, '出库 SN 报表', 'MENU', '/reports/outbound-sn', 'reports/OutboundSnReport', 'reports:outbound-sn:list', 'Tickets', 6, 1, 'ACTIVE', ''),
(807, 8, '入库 SN 报表', 'MENU', '/reports/inbound-sn', 'reports/InboundSnReport', 'reports:inbound-sn:list', 'Tickets', 7, 1, 'ACTIVE', ''),
(9, 0, '接口中心', 'DIR', NULL, NULL, NULL, 'Connection', 9, 1, 'ACTIVE', ''),
(901, 9, '接口日志', 'MENU', '/interface/logs', 'interfacecenter/InterfaceLogPage', 'interface:log:list', 'Connection', 1, 1, 'ACTIVE', ''),
(10, 0, '系统管理', 'DIR', NULL, NULL, NULL, 'Setting', 10, 1, 'ACTIVE', ''),
(1001, 10, '用户管理', 'MENU', '/system/users', 'system/SystemAdminPage', 'system:user:list', 'User', 1, 1, 'ACTIVE', ''),
(1002, 10, '角色管理', 'MENU', '/system/roles', 'system/SystemAdminPage', 'system:role:list', 'Avatar', 2, 1, 'ACTIVE', ''),
(1003, 10, '菜单管理', 'MENU', '/system/menus', 'system/SystemAdminPage', 'system:menu:list', 'Menu', 3, 1, 'ACTIVE', ''),
(1004, 10, '部门管理', 'MENU', '/system/depts', 'system/SystemAdminPage', 'system:dept:list', 'OfficeBuilding', 4, 1, 'ACTIVE', ''),
(1005, 10, '岗位管理', 'MENU', '/system/posts', 'system/SystemAdminPage', 'system:post:list', 'Postcard', 5, 1, 'ACTIVE', ''),
(1006, 10, '字典管理', 'MENU', '/system/dict', 'system/SystemAdminPage', 'system:dict:list', 'Collection', 6, 1, 'ACTIVE', ''),
(1007, 10, '参数设置', 'MENU', '/system/config', 'system/SystemAdminPage', 'system:config:list', 'Tools', 7, 1, 'ACTIVE', ''),
(1008, 10, '通知公告', 'MENU', '/system/notice', 'system/SystemAdminPage', 'system:notice:list', 'Bell', 8, 1, 'ACTIVE', ''),
(1009, 10, '操作日志', 'MENU', '/system/operlog', 'system/SystemAdminPage', 'system:operlog:list', 'Memo', 9, 1, 'ACTIVE', ''),
(1010, 10, '登录日志', 'MENU', '/system/loginlog', 'system/SystemAdminPage', 'system:loginlog:list', 'Monitor', 10, 1, 'ACTIVE', ''),
(1011, 10, '字段管理', 'MENU', '/system/field', 'system/SystemAdminPage', 'system:field:list', 'Grid', 11, 1, 'ACTIVE', ''),
(1012, 10, '数据权限', 'MENU', '/system/data-scope', 'system/SystemAdminPage', 'system:data-scope:list', 'Lock', 12, 1, 'ACTIVE', ''),
(1013, 10, '接口日志', 'MENU', '/system/interface-log', 'system/SystemAdminPage', 'system:interface-log:list', 'Connection', 13, 1, 'ACTIVE', ''),
(1101, 1001, '用户新增', 'BUTTON', NULL, NULL, 'system:user:add', NULL, 1, 1, 'ACTIVE', ''),
(1102, 1001, '用户编辑', 'BUTTON', NULL, NULL, 'system:user:edit', NULL, 2, 1, 'ACTIVE', ''),
(1103, 1001, '用户删除', 'BUTTON', NULL, NULL, 'system:user:remove', NULL, 3, 1, 'ACTIVE', ''),
(1104, 1002, '角色分配菜单', 'BUTTON', NULL, NULL, 'system:role:menu', NULL, 1, 1, 'ACTIVE', ''),
(1105, 1012, '数据权限维护', 'BUTTON', NULL, NULL, 'system:data-scope:edit', NULL, 1, 1, 'ACTIVE', '');

INSERT INTO sys_user_role (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8);

INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 1, id FROM sys_menu;
INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 2, id FROM sys_menu WHERE id NOT BETWEEN 1001 AND 1105;
INSERT INTO sys_role_menu (role_id, menu_id) VALUES
(3, 2), (3, 201), (3, 5), (3, 501), (3, 502), (3, 7), (3, 701), (3, 702), (3, 9), (3, 901),
(4, 2), (4, 201), (4, 6), (4, 601), (4, 7), (4, 701), (4, 702), (4, 9), (4, 901),
(5, 2), (5, 201), (5, 7), (5, 701), (5, 702), (5, 703), (5, 704), (5, 8), (5, 801), (5, 804), (5, 805),
(6, 2), (6, 201), (6, 3), (6, 301), (6, 302), (6, 4), (6, 401), (6, 402),
(7, 2), (7, 201), (7, 9), (7, 901), (7, 10), (7, 1013),
(8, 1), (8, 101), (8, 2), (8, 201), (8, 7), (8, 701), (8, 702), (8, 8), (8, 801), (8, 806), (8, 807);

INSERT INTO sys_role_warehouse (role_id, warehouse_code) VALUES
(3, 'WH-HZ-CENTRAL'), (3, 'WH-SH-REGION'), (3, 'WH-SUP-CATL-VMI'),
(4, 'WH-HZ-CENTRAL'), (4, 'WH-SH-REGION'), (4, 'WH-SZ-AFTERSALE'),
(5, 'WH-HZ-CENTRAL'), (5, 'WH-SH-REGION'), (5, 'WH-GZ-3PL'), (5, 'WH-SZ-AFTERSALE'),
(8, 'WH-HZ-CENTRAL'), (8, 'WH-SH-REGION');

INSERT INTO sys_role_owner (role_id, owner_code) VALUES
(3, '1000'), (3, '3060'), (4, '1000'), (4, '3060'), (5, '1000'), (5, '3060'), (8, '3060');

INSERT INTO sys_user_warehouse (user_id, warehouse_code) VALUES
(3, 'WH-HZ-CENTRAL'), (3, 'WH-SH-REGION'), (3, 'WH-SUP-CATL-VMI'),
(4, 'WH-HZ-CENTRAL'), (4, 'WH-SH-REGION'), (4, 'WH-SZ-AFTERSALE'),
(5, 'WH-HZ-CENTRAL'), (5, 'WH-SH-REGION'), (5, 'WH-GZ-3PL'), (5, 'WH-SZ-AFTERSALE'),
(8, 'WH-HZ-CENTRAL'), (8, 'WH-SH-REGION');

INSERT INTO sys_user_owner (user_id, owner_code) VALUES
(3, '1000'), (3, '3060'), (4, '1000'), (4, '3060'), (5, '1000'), (5, '3060'), (8, '3060');

INSERT INTO sys_dict_type (dict_name, dict_type, status, remark) VALUES
('系统状态', 'sys_normal_disable', 'ACTIVE', '启用/停用'),
('菜单类型', 'sys_menu_type', 'ACTIVE', '目录/菜单/按钮'),
('WMS 入库订单类型', 'wms_inbound_type', 'ACTIVE', '生产/备货/RMA/调拨/VMI'),
('WMS 出库订单类型', 'wms_outbound_type', 'ACTIVE', '销售/调拨/售后'),
('WMS 发运订单状态', 'wms_outbound_order_status', 'ACTIVE', '主状态 + 历史兼容状态'),
('WMS 预期到货通知单状态', 'wms_inbound_order_status', 'ACTIVE', '主状态 + 历史兼容状态'),
('SAP 回传状态', 'wms_sap_post_status', 'ACTIVE', '未回传/成功/失败，POSTED 为兼容值');

INSERT INTO sys_dict_data (dict_type, dict_label, dict_value, dict_sort, list_class, is_default, status, remark) VALUES
('sys_normal_disable', '启用', 'ACTIVE', 1, 'success', 1, 'ACTIVE', ''),
('sys_normal_disable', '停用', 'DISABLED', 2, 'danger', 0, 'ACTIVE', ''),
('sys_menu_type', '目录', 'DIR', 1, 'primary', 0, 'ACTIVE', ''),
('sys_menu_type', '菜单', 'MENU', 2, 'success', 1, 'ACTIVE', ''),
('sys_menu_type', '按钮', 'BUTTON', 3, 'warning', 0, 'ACTIVE', ''),
('wms_inbound_type', '生产入库', 'PRODUCTION', 1, 'primary', 1, 'ACTIVE', ''),
('wms_inbound_type', '备货入库', 'STOCKING', 2, 'success', 0, 'ACTIVE', ''),
('wms_inbound_type', '售后 RMA 入库', 'RMA', 3, 'warning', 0, 'ACTIVE', ''),
('wms_inbound_type', '调拨入库', 'TRANSFER', 4, 'info', 0, 'ACTIVE', ''),
('wms_outbound_type', '销售出库', 'SALES', 1, 'primary', 1, 'ACTIVE', ''),
('wms_outbound_type', '调拨出库', 'TRANSFER', 2, 'success', 0, 'ACTIVE', ''),
('wms_outbound_type', '售后出库', 'AFTERSALE', 3, 'warning', 0, 'ACTIVE', ''),
('wms_outbound_order_status', '创建', 'CREATED', 1, 'info', 1, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分分配', 'PARTIAL_ALLOCATED', 2, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全分配', 'ALLOCATED', 3, 'primary', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分拣货', 'PARTIAL_PICKED', 4, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全拣货', 'PICKED', 5, 'primary', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '部分发运', 'PARTIAL_SHIPPED', 6, 'warning', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '完全发运', 'SHIPPED', 7, 'success', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '订单关闭', 'CLOSED', 8, 'success', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '订单取消', 'CANCELED', 9, 'danger', 0, 'ACTIVE', '主状态'),
('wms_outbound_order_status', '待分配', 'PENDING_ALLOC', 101, 'warning', 0, 'ACTIVE', '兼容状态：历史待分配'),
('wms_outbound_order_status', '拣货中', 'PICKING', 102, 'warning', 0, 'ACTIVE', '兼容状态：历史拣货中'),
('wms_outbound_order_status', '复核中', 'REVIEWING', 103, 'warning', 0, 'ACTIVE', '兼容状态：历史复核中'),
('wms_outbound_order_status', '已复核', 'REVIEWED', 104, 'primary', 0, 'ACTIVE', '兼容状态：历史复核完成'),
('wms_outbound_order_status', '回传成功', 'CALLBACK_SUCCESS', 105, 'success', 0, 'ACTIVE', '兼容状态：旧回调状态，后续使用 sap_post_status'),
('wms_outbound_order_status', '回传失败', 'CALLBACK_FAILED', 106, 'danger', 0, 'ACTIVE', '兼容状态：旧回调状态，后续使用 sap_post_status'),
('wms_outbound_order_status', '分配异常', 'ALLOCATION_EXCEPTION', 107, 'danger', 0, 'ACTIVE', '兼容状态：历史分配异常'),
('wms_inbound_order_status', '创建', 'CREATED', 1, 'info', 1, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '部分收货', 'PARTIAL_RECEIVED', 2, 'warning', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '完全收货', 'RECEIVED', 3, 'success', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '订单关闭', 'CLOSED', 4, 'success', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '订单取消', 'CANCELED', 5, 'danger', 0, 'ACTIVE', '主状态'),
('wms_inbound_order_status', '收货中', 'RECEIVING', 101, 'warning', 0, 'ACTIVE', '兼容状态：历史收货中'),
('wms_inbound_order_status', '已绑定', 'BOUND', 102, 'primary', 0, 'ACTIVE', '兼容状态：包装绑定流程保留'),
('wms_inbound_order_status', '已上架', 'ON_SHELF', 103, 'success', 0, 'ACTIVE', '兼容状态：上架流程保留'),
('wms_inbound_order_status', 'SAP 回传失败', 'SAP_FAILED', 104, 'danger', 0, 'ACTIVE', '兼容状态：后续使用 sap_post_status=FAILED'),
('wms_sap_post_status', '未回传', 'NOT_POSTED', 1, 'info', 1, 'ACTIVE', ''),
('wms_sap_post_status', '回传成功', 'SUCCESS', 2, 'success', 0, 'ACTIVE', ''),
('wms_sap_post_status', '回传失败', 'FAILED', 3, 'danger', 0, 'ACTIVE', ''),
('wms_sap_post_status', '已回传', 'POSTED', 101, 'success', 0, 'ACTIVE', '兼容状态：历史成功值');

INSERT INTO sys_config (config_name, config_key, config_value, config_type, status, remark) VALUES
('系统名称', 'wms.system.name', 'WMS Alpha', 'Y', 'ACTIVE', '页面标题和登录标识'),
('默认仓库', 'wms.default.warehouse', 'WH-HZ-CENTRAL', 'Y', '用户未配置时的默认仓库'),
('默认货主', 'wms.default.owner', '1000', 'Y', '用户未配置时的默认货主'),
('SN 扫码去重', 'wms.sn.scan.dedup', 'true', 'Y', 'SN 采集和拣货扫码重复校验'),
('SAP Mock 开关', 'wms.mock.sap.enabled', 'true', 'Y', 'SAP 入库/出库 Mock 回传');

INSERT INTO sys_notice (notice_title, notice_type, notice_content, status, created_by) VALUES
('WMS PC V2.0 演示版本发布', 'NOTICE', '当前版本支持入库、出库、库存移动、盘点、驾驶舱、报表和系统管理演示。', 'PUBLISHED', 'admin'),
('盘点作业提醒', 'NOTICE', '本周演示库存盘点请使用 WH-HZ-CENTRAL 仓库数据。', 'PUBLISHED', 'inventory01'),
('SAP Mock 维护窗口', 'NOTICE', '接口 Mock 可通过接口中心和系统管理接口日志查看失败与重试记录。', 'DRAFT', 'interface01');

INSERT INTO sys_login_log (username, ipaddr, login_location, browser, os, status, message, login_time) VALUES
('admin', '127.0.0.1', '本机演示环境', 'Chrome', 'Windows', 'SUCCESS', '登录成功', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
('inbound01', '127.0.0.1', '本机演示环境', 'Chrome', 'Windows', 'SUCCESS', '登录成功', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('outbound01', '127.0.0.1', '本机演示环境', 'Chrome', 'Windows', 'SUCCESS', '登录成功', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('owner3060', '127.0.0.1', '本机演示环境', 'Edge', 'Windows', 'FAILED', '密码错误', DATE_SUB(NOW(), INTERVAL 3 HOUR));

INSERT INTO sys_field_config (page_code, page_name, field_code, field_name, field_type, visible, required, editable, order_num, role_codes, remark) VALUES
('inbound.arrival', '预期到货通知单', 'owner_code', '货主', 'SELECT', 1, 1, 1, 10, 'ADMIN,WMS_MANAGER,INBOUND_OPERATOR', '多货主入库必填'),
('inbound.arrival', '预期到货通知单', 'sap_post_status', '回传 SAP 状态', 'SELECT', 1, 0, 0, 20, 'ADMIN,WMS_MANAGER,INBOUND_OPERATOR,INTERFACE_ADMIN', ''),
('outbound.shipping', '发运订单', 'owner_code', '货主', 'SELECT', 1, 1, 1, 10, 'ADMIN,WMS_MANAGER,OUTBOUND_OPERATOR', '多货主出库必填'),
('outbound.shipping', '发运订单', 'carrier_name', '承运商', 'TEXT', 1, 0, 1, 20, 'ADMIN,WMS_MANAGER,OUTBOUND_OPERATOR', ''),
('inventory.list', '库存查询', 'owner_code', '货主', 'SELECT', 1, 0, 0, 10, 'ADMIN,WMS_MANAGER,INVENTORY_ADMIN,OWNER_VIEWER', ''),
('inventory.sn', 'SN 查询', 'owner_code', '货主', 'SELECT', 1, 0, 0, 10, 'ADMIN,WMS_MANAGER,INVENTORY_ADMIN,OWNER_VIEWER', ''),
('reports.inout', '进出存报表', 'owner_code', '货主', 'SELECT', 1, 0, 0, 10, 'ADMIN,WMS_MANAGER,OWNER_VIEWER', ''),
('system.users', '用户管理', 'warehouse_scope', '仓库范围', 'TEXT', 1, 0, 1, 30, 'ADMIN', '系统管理员维护');

INSERT INTO sys_data_scope (scope_code, scope_name, role_code, role_name, scope_type, dept_codes, warehouse_codes, owner_codes, status, remark) VALUES
('DS-ADMIN-ALL', '系统管理员全量权限', 'ADMIN', '系统管理员', 'ALL', '*', '*', '*', 'ACTIVE', '全菜单全数据'),
('DS-INBOUND-HZ-SH', '入库操作仓库与货主范围', 'INBOUND_OPERATOR', '入库操作员', 'WAREHOUSE_OWNER', 'INBOUND', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SUP-CATL-VMI', '1000,3060', 'ACTIVE', '限制入库相关作业数据'),
('DS-OUTBOUND-HZ-SH', '出库发运仓库与货主范围', 'OUTBOUND_OPERATOR', '出库发运员', 'WAREHOUSE_OWNER', 'OUTBOUND', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-SZ-AFTERSALE', '1000,3060', 'ACTIVE', '限制出库相关作业数据'),
('DS-INVENTORY-CN', '库存管理员仓库范围', 'INVENTORY_ADMIN', '库存管理员', 'WAREHOUSE_OWNER', 'INVENTORY', 'WH-HZ-CENTRAL,WH-SH-REGION,WH-GZ-3PL,WH-SZ-AFTERSALE', '1000,3060', 'ACTIVE', '限制库存移动与盘点范围'),
('DS-OWNER-3060', '货主 3060 查看权限', 'OWNER_VIEWER', '货主查看员', 'OWNER', 'OPS', 'WH-HZ-CENTRAL,WH-SH-REGION', '3060', 'ACTIVE', '只查看 3060 货主');

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at) VALUES
('SYSTEM', 'admin', 'CREATE_USER', 'admin', 'SUCCESS', '初始化系统管理员', DATE_SUB(NOW(), INTERVAL 4 HOUR)),
('SYSTEM', 'OUTBOUND_OPERATOR', 'ASSIGN_ROLE_MENU', 'admin', 'SUCCESS', '配置出库角色菜单权限', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('SYSTEM', 'DS-OWNER-3060', 'UPDATE_DATA_SCOPE', 'admin', 'SUCCESS', '配置货主 3060 查看权限', DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO md_product (product_code, product_name, category, spec_model, unit, sn_managed, battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status) VALUES
('GT3-30KD1R11001', '宸ュ晢涓氬偍鑳界數姹犲寘', '鎴愬搧', 'GT3-30K-D1R1', 'PCS', 1, 1, 730, 20, 180, 'ACTIVE'),
('GT3-50KD1R11002', '鎴风敤鍌ㄨ兘鐢垫睜鍖?, '鎴愬搧', 'GT3-50K-D1R1', 'PCS', 1, 1, 730, 15, 180, 'ACTIVE'),
('INV-10K-AC001', '鍌ㄨ兘閫嗗彉鍣?10K', '鎴愬搧', 'INV-10K-AC', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('INV-20K-AC002', '鍌ㄨ兘閫嗗彉鍣?20K', '鎴愬搧', 'INV-20K-AC', 'PCS', 1, 0, 365, 8, 150, 'ACTIVE'),
('PCS-100K-001', 'PCS 鍙樻祦鍣?100K', '鎴愬搧', 'PCS-100K', 'PCS', 1, 0, 365, 5, 120, 'ACTIVE'),
('BMS-MAIN-001', 'BMS 涓绘帶鏉?, '澶囦欢', 'BMS-MAIN', 'PCS', 1, 0, 365, 30, 240, 'ACTIVE'),
('CABLE-HV-001', '楂樺帇绾挎潫', '澶囦欢', 'HV-CABLE', 'PCS', 0, 0, 365, 50, 240, 'ACTIVE'),
('FAN-DC-001', '鐩存祦鏁ｇ儹椋庢墖', '澶囦欢', 'DC-FAN', 'PCS', 0, 0, 365, 40, 240, 'ACTIVE'),
('FUSE-500A-001', '500A 鐔旀柇鍣?, '澶囦欢', 'FUSE-500A', 'PCS', 0, 0, 365, 60, 240, 'ACTIVE'),
('PACK-COVER-001', '鐢垫睜鍖呬笂鐩?, '澶囦欢', 'PACK-COVER', 'PCS', 0, 0, 365, 20, 240, 'DISABLED');

INSERT INTO md_product (product_code, product_name, category, spec_model, unit, sn_managed, battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status) VALUES
('BLF51-5R31101', '鐢垫睜妯″潡澶囦欢', '澶囦欢', 'BLF51-5R3', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('HP3-12KD2R11101', '閫嗗彉鍣ㄦ垚鍝?, '鎴愬搧', 'HP3-12K-D2R1', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('GT3-20KD1R11001', '鍌ㄨ兘鐢垫睜鍖?20K', '鎴愬搧', 'GT3-20K-D1R1', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('GT3-10KD1R11001', '鍌ㄨ兘鐢垫睜鍖?10K', '鎴愬搧', 'GT3-10K-D1R1', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('SP-BMS-001', 'BMS 鎺у埗鏉?, '渚涘簲鍟?VMI 鐗╂枡', 'SP-BMS', 'PCS', 1, 0, 365, 20, 240, 'ACTIVE'),
('SP-CABLE-001', '楂樺帇绾挎潫', '渚涘簲鍟?VMI 鐗╂枡', 'SP-CABLE', 'PCS', 1, 0, 365, 30, 240, 'ACTIVE');

INSERT INTO md_product (
  owner_code, owner_name, product_code, product_name, product_name_en,
  category, spec_model, product_family, product_class, unit, sn_managed,
  battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status
) VALUES
('1000', '娴峰叴鐢靛姏', 'GT3-10KD1R11004', '涓夌浉骞剁綉閫嗗彉鍣?, 'Three-phase Grid-tied Inverter', '鎴愬搧', 'GT3-10K-D1R1', '閫嗗彉鍣?, '骞剁綉閫嗗彉鍣?, 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('1000', '娴峰叴鐢靛姏', 'HXEDE081R10002', '鐢佃〃妯″潡', 'Meter Module', '鎴愬搧', 'HXEDE081R1', '鐢佃〃', '璁￠噺妯″潡', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('1000', '娴峰叴鐢靛姏', 'LHECCHR11002', '鍏呯數妯″潡', 'Charging Module', '鎴愬搧', 'LHECCHR1', '鍏呯數', '鍏呯數妯″潡', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('1000', '娴峰叴鐢靛姏', 'BHF-B10250R11001', '鍌ㄨ兘鐢垫睜鍖?, 'Battery Pack', '鎴愬搧', 'BHF-B10250R1', '鐢垫睜', '鍌ㄨ兘鐢垫睜鍖?, 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('3060', '鏉窞鍒╂矁寰?, 'GT3-10KD1R11004', '涓夌浉骞剁綉閫嗗彉鍣?, 'Three-phase Grid-tied Inverter', '鎴愬搧', 'GT3-10K-D1R1', '閫嗗彉鍣?, '骞剁綉閫嗗彉鍣?, 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('3060', '鏉窞鍒╂矁寰?, 'HXEDE081R10002', '鐢佃〃妯″潡', 'Meter Module', '鎴愬搧', 'HXEDE081R1', '鐢佃〃', '璁￠噺妯″潡', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('3060', '鏉窞鍒╂矁寰?, 'LHECCHR11002', '鍏呯數妯″潡', 'Charging Module', '鎴愬搧', 'LHECCHR1', '鍏呯數', '鍏呯數妯″潡', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('3060', '鏉窞鍒╂矁寰?, 'BHF-B10250R11001', '鍌ㄨ兘鐢垫睜鍖?, 'Battery Pack', '鎴愬搧', 'BHF-B10250R1', '鐢垫睜', '鍌ㄨ兘鐢垫睜鍖?, 'PCS', 1, 1, 730, 10, 180, 'ACTIVE');

INSERT INTO md_customer (customer_code, customer_name, customer_type, country_region, contact_name, contact_phone, delivery_address, vmi_flag, status) VALUES
('CUST-TESLA-001', 'Tesla Energy China', '鐩撮攢瀹㈡埛', '涓浗', '鐜嬬粡鐞?, '13800000001', '涓婃捣涓存腐鏂拌兘婧愬洯鍖?, 1, 'ACTIVE'),
('CUST-BYD-002', '姣斾簹杩偍鑳戒簨涓氶儴', '鐩撮攢瀹㈡埛', '涓浗', '鏉庣粡鐞?, '13800000002', '娣卞湷鍧北鍖?, 1, 'ACTIVE'),
('CUST-SG-003', 'State Grid Demo', '娓犻亾瀹㈡埛', '涓浗', '璧电粡鐞?, '13800000003', '鍖椾含娴锋穩鍖?, 0, 'ACTIVE'),
('CUST-EU-004', 'EU Solar Partner', '娴峰瀹㈡埛', '寰峰浗', 'Anna', '+49-10001', 'Berlin Demo Street 1', 0, 'ACTIVE'),
('CUST-AU-005', 'AU Energy Storage', '娴峰瀹㈡埛', '婢冲ぇ鍒╀簹', 'Smith', '+61-10002', 'Sydney Demo Road 2', 0, 'ACTIVE');

UPDATE md_customer SET customer_type = 'CUSTOMER';

INSERT INTO md_customer (customer_code, customer_name, customer_type, country_region, contact_name, contact_phone, delivery_address, vmi_flag, status) VALUES
('1000', '娴峰叴鐢靛姏', 'OWNER', '涓浗', '', '', '', 0, 'ACTIVE'),
('3060', '鏉窞鍒╂矁寰?, 'OWNER', '涓浗', '', '', '', 0, 'ACTIVE'),
('SUP-CATL-001', 'CATL 渚涘簲鍟?, 'SUPPLIER', '涓浗', '寮犲伐', '13900000001', '', 1, 'ACTIVE'),
('SUP-BYD-001', 'BYD 渚涘簲鍟?, 'SUPPLIER', '涓浗', '鏉庡伐', '13900000002', '', 0, 'ACTIVE'),
('SUP-VMI-001', 'VMI 渚涘簲鍟咥', 'SUPPLIER', '涓浗', '鐜嬪伐', '13900000003', '', 1, 'ACTIVE');

INSERT INTO md_supplier (supplier_code, supplier_name, supplier_type, contact_name, contact_phone, vmi_flag, status) VALUES
('SUP-CATL-001', '瀹佸痉鏃朵唬鐢佃姱渚涘簲鍟?, '鐢佃姱渚涘簲鍟?, '寮犲伐', '13900000001', 1, 'ACTIVE'),
('SUP-EVE-002', '浜跨含閿傝兘渚涘簲鍟?, '鐢佃姱渚涘簲鍟?, '鍒樺伐', '13900000002', 0, 'ACTIVE'),
('SUP-FOX-003', '缁撴瀯浠朵緵搴斿晢', '缁撴瀯浠?, '闄堝伐', '13900000003', 0, 'ACTIVE'),
('SUP-DHL-004', 'DHL 浠撳偍鐗╂祦', '鐗╂祦鏈嶅姟鍟?, 'DHL Ops', '13900000004', 0, 'ACTIVE'),
('SUP-SF-005', '椤轰赴渚涘簲閾?, '鐗╂祦鏈嶅姟鍟?, 'SF Ops', '13900000005', 0, 'ACTIVE');

INSERT INTO wms_warehouse (warehouse_code, warehouse_name, warehouse_type, region, country, city, owner_type, owner_code, own_flag, vmi_flag, status) VALUES
('WH-HZ-CENTRAL', '鏉窞闆嗗洟鎬讳粨', '闆嗗洟鎬讳粨', '鍗庝笢', '涓浗', '鏉窞', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-SH-REGION', '涓婃捣鍖哄煙閿€鍞粨', '鍖哄煙閿€鍞粨', '鍗庝笢', '涓浗', '涓婃捣', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-GZ-3PL', '骞垮窞绗笁鏂逛粨', '绗笁鏂逛粨', '鍗庡崡', '涓浗', '骞垮窞', 'SUPPLIER', 'SUP-DHL-004', 0, 0, 'ACTIVE'),
('WH-SZ-AFTERSALE', '娣卞湷鍞悗浠?, '鍞悗浠?, '鍗庡崡', '涓浗', '娣卞湷', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-CUST-TESLA-VMI', 'Tesla 瀹㈡埛 VMI 浠?, '瀹㈡埛 VMI 浠?, '鍗庝笢', '涓浗', '涓婃捣', 'CUSTOMER', 'CUST-TESLA-001', 0, 1, 'ACTIVE'),
('WH-SUP-CATL-VMI', 'CATL 渚涘簲鍟?VMI 浠?, '渚涘簲鍟?VMI 浠?, '鍗庝笢', '涓浗', '瀹佸痉', 'SUPPLIER', 'SUP-CATL-001', 0, 1, 'ACTIVE');

INSERT INTO wms_area (warehouse_id, area_code, area_name, area_type, quality_status_limit, status) VALUES
(1, 'AREA-GOOD-01', '鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(1, 'AREA-QC-01', '寰呮鍖?, 'QC', 'PENDING', 'ACTIVE'),
(2, 'AREA-GOOD-01', '鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(2, 'AREA-QC-01', '寰呮鍖?, 'QC', 'PENDING', 'ACTIVE'),
(3, 'AREA-GOOD-01', '鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(3, 'AREA-QC-01', '寰呮鍖?, 'QC', 'PENDING', 'ACTIVE'),
(4, 'AREA-GOOD-01', '鍞悗鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(4, 'AREA-REPAIR-01', '寰呬慨鍖?, 'REPAIR', 'PENDING', 'ACTIVE'),
(4, 'AREA-SCRAP-01', '鎶ュ簾鍖?, 'SCRAP', 'UNQUALIFIED', 'ACTIVE'),
(5, 'AREA-GOOD-01', '瀹㈡埛 VMI 鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(5, 'AREA-QC-01', '瀹㈡埛 VMI 寰呮鍖?, 'QC', 'PENDING', 'ACTIVE'),
(6, 'AREA-GOOD-01', '渚涘簲鍟?VMI 鑹搧鍖?, 'GOOD', 'QUALIFIED', 'ACTIVE'),
(6, 'AREA-QC-01', '渚涘簲鍟?VMI 寰呮鍖?, 'QC', 'PENDING', 'ACTIVE');

INSERT INTO wms_location (warehouse_id, area_id, location_code, location_name, rack_no, level_no, column_no, capacity, frozen_flag, status)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 30
)
SELECT
  ((n - 1) % 6) + 1,
  CASE ((n - 1) % 6) + 1
    WHEN 1 THEN IF(n % 5 = 0, 2, 1)
    WHEN 2 THEN IF(n % 5 = 0, 4, 3)
    WHEN 3 THEN IF(n % 5 = 0, 6, 5)
    WHEN 4 THEN IF(n % 5 = 0, 8, 7)
    WHEN 5 THEN IF(n % 5 = 0, 11, 10)
    ELSE IF(n % 5 = 0, 13, 12)
  END,
  CONCAT(CHAR(64 + (((n - 1) % 6) + 1)), LPAD(((n - 1) % 5) + 1, 2, '0'), '-01-', LPAD(n, 2, '0')),
  CONCAT('鏍囧噯搴撲綅-', LPAD(n, 2, '0')),
  CONCAT('R', LPAD(((n - 1) % 5) + 1, 2, '0')),
  CONCAT('L', ((n - 1) % 3) + 1),
  CONCAT('C', LPAD(n, 2, '0')),
  100,
  IF(n IN (7, 18), 1, 0),
  'ACTIVE'
FROM seq;

