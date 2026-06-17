USE wms_alpha;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE wms_operation_log;
TRUNCATE TABLE wms_interface_log;
TRUNCATE TABLE wms_mock_config;
TRUNCATE TABLE wms_outbound_status_history;
TRUNCATE TABLE wms_outbound_exception;
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
TRUNCATE TABLE sys_user;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO sys_user (username, password_hash, display_name, role_code, role_name, warehouse_scope, status) VALUES
('admin', 'admin123', '系统管理员', 'ADMIN', '系统管理员', '*', 'ACTIVE'),
('wh_admin', '123456', '仓库管理员', 'WAREHOUSE_ADMIN', '仓库管理员', 'WH-HZ-CENTRAL,WH-SH-REGION', 'ACTIVE'),
('planner', '123456', '计划人员', 'PLANNER', '计划人员', '*', 'ACTIVE'),
('logistics', '123456', '物流人员', 'LOGISTICS', '物流人员', 'WH-HZ-CENTRAL,WH-SH-REGION', 'ACTIVE'),
('aftersale', '123456', '售后人员', 'AFTERSALE', '售后人员', 'WH-SZ-AFTERSALE', 'ACTIVE'),
('manager', '123456', '管理层', 'MANAGER', '管理层', '*', 'ACTIVE');

INSERT INTO md_product (product_code, product_name, category, spec_model, unit, sn_managed, battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status) VALUES
('GT3-30KD1R11001', '工商业储能电池包', '成品', 'GT3-30K-D1R1', 'PCS', 1, 1, 730, 20, 180, 'ACTIVE'),
('GT3-50KD1R11002', '户用储能电池包', '成品', 'GT3-50K-D1R1', 'PCS', 1, 1, 730, 15, 180, 'ACTIVE'),
('INV-10K-AC001', '储能逆变器 10K', '成品', 'INV-10K-AC', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('INV-20K-AC002', '储能逆变器 20K', '成品', 'INV-20K-AC', 'PCS', 1, 0, 365, 8, 150, 'ACTIVE'),
('PCS-100K-001', 'PCS 变流器 100K', '成品', 'PCS-100K', 'PCS', 1, 0, 365, 5, 120, 'ACTIVE'),
('BMS-MAIN-001', 'BMS 主控板', '备件', 'BMS-MAIN', 'PCS', 1, 0, 365, 30, 240, 'ACTIVE'),
('CABLE-HV-001', '高压线束', '备件', 'HV-CABLE', 'PCS', 0, 0, 365, 50, 240, 'ACTIVE'),
('FAN-DC-001', '直流散热风扇', '备件', 'DC-FAN', 'PCS', 0, 0, 365, 40, 240, 'ACTIVE'),
('FUSE-500A-001', '500A 熔断器', '备件', 'FUSE-500A', 'PCS', 0, 0, 365, 60, 240, 'ACTIVE'),
('PACK-COVER-001', '电池包上盖', '备件', 'PACK-COVER', 'PCS', 0, 0, 365, 20, 240, 'DISABLED');

INSERT INTO md_product (product_code, product_name, category, spec_model, unit, sn_managed, battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status) VALUES
('BLF51-5R31101', '电池模块备件', '备件', 'BLF51-5R3', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('HP3-12KD2R11101', '逆变器成品', '成品', 'HP3-12K-D2R1', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('GT3-20KD1R11001', '储能电池包 20K', '成品', 'GT3-20K-D1R1', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('GT3-10KD1R11001', '储能电池包 10K', '成品', 'GT3-10K-D1R1', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('SP-BMS-001', 'BMS 控制板', '供应商 VMI 物料', 'SP-BMS', 'PCS', 1, 0, 365, 20, 240, 'ACTIVE'),
('SP-CABLE-001', '高压线束', '供应商 VMI 物料', 'SP-CABLE', 'PCS', 1, 0, 365, 30, 240, 'ACTIVE');

INSERT INTO md_product (
  owner_code, owner_name, product_code, product_name, product_name_en,
  category, spec_model, product_family, product_class, unit, sn_managed,
  battery_flag, shelf_life_days, safety_stock, aging_threshold_days, status
) VALUES
('1000', '海兴电力', 'GT3-10KD1R11004', '三相并网逆变器', 'Three-phase Grid-tied Inverter', '成品', 'GT3-10K-D1R1', '逆变器', '并网逆变器', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('1000', '海兴电力', 'HXEDE081R10002', '电表模块', 'Meter Module', '成品', 'HXEDE081R1', '电表', '计量模块', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('1000', '海兴电力', 'LHECCHR11002', '充电模块', 'Charging Module', '成品', 'LHECCHR1', '充电', '充电模块', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('1000', '海兴电力', 'BHF-B10250R11001', '储能电池包', 'Battery Pack', '成品', 'BHF-B10250R1', '电池', '储能电池包', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE'),
('3060', '杭州利沃得', 'GT3-10KD1R11004', '三相并网逆变器', 'Three-phase Grid-tied Inverter', '成品', 'GT3-10K-D1R1', '逆变器', '并网逆变器', 'PCS', 1, 0, 365, 10, 150, 'ACTIVE'),
('3060', '杭州利沃得', 'HXEDE081R10002', '电表模块', 'Meter Module', '成品', 'HXEDE081R1', '电表', '计量模块', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('3060', '杭州利沃得', 'LHECCHR11002', '充电模块', 'Charging Module', '成品', 'LHECCHR1', '充电', '充电模块', 'PCS', 0, 0, 365, 20, 180, 'ACTIVE'),
('3060', '杭州利沃得', 'BHF-B10250R11001', '储能电池包', 'Battery Pack', '成品', 'BHF-B10250R1', '电池', '储能电池包', 'PCS', 1, 1, 730, 10, 180, 'ACTIVE');

INSERT INTO md_customer (customer_code, customer_name, customer_type, country_region, contact_name, contact_phone, delivery_address, vmi_flag, status) VALUES
('CUST-TESLA-001', 'Tesla Energy China', '直销客户', '中国', '王经理', '13800000001', '上海临港新能源园区', 1, 'ACTIVE'),
('CUST-BYD-002', '比亚迪储能事业部', '直销客户', '中国', '李经理', '13800000002', '深圳坪山区', 1, 'ACTIVE'),
('CUST-SG-003', 'State Grid Demo', '渠道客户', '中国', '赵经理', '13800000003', '北京海淀区', 0, 'ACTIVE'),
('CUST-EU-004', 'EU Solar Partner', '海外客户', '德国', 'Anna', '+49-10001', 'Berlin Demo Street 1', 0, 'ACTIVE'),
('CUST-AU-005', 'AU Energy Storage', '海外客户', '澳大利亚', 'Smith', '+61-10002', 'Sydney Demo Road 2', 0, 'ACTIVE');

UPDATE md_customer SET customer_type = 'CUSTOMER';

INSERT INTO md_customer (customer_code, customer_name, customer_type, country_region, contact_name, contact_phone, delivery_address, vmi_flag, status) VALUES
('1000', '海兴电力', 'OWNER', '中国', '', '', '', 0, 'ACTIVE'),
('3060', '杭州利沃得', 'OWNER', '中国', '', '', '', 0, 'ACTIVE'),
('SUP-CATL-001', 'CATL 供应商', 'SUPPLIER', '中国', '张工', '13900000001', '', 1, 'ACTIVE'),
('SUP-BYD-001', 'BYD 供应商', 'SUPPLIER', '中国', '李工', '13900000002', '', 0, 'ACTIVE'),
('SUP-VMI-001', 'VMI 供应商A', 'SUPPLIER', '中国', '王工', '13900000003', '', 1, 'ACTIVE');

INSERT INTO md_supplier (supplier_code, supplier_name, supplier_type, contact_name, contact_phone, vmi_flag, status) VALUES
('SUP-CATL-001', '宁德时代电芯供应商', '电芯供应商', '张工', '13900000001', 1, 'ACTIVE'),
('SUP-EVE-002', '亿纬锂能供应商', '电芯供应商', '刘工', '13900000002', 0, 'ACTIVE'),
('SUP-FOX-003', '结构件供应商', '结构件', '陈工', '13900000003', 0, 'ACTIVE'),
('SUP-DHL-004', 'DHL 仓储物流', '物流服务商', 'DHL Ops', '13900000004', 0, 'ACTIVE'),
('SUP-SF-005', '顺丰供应链', '物流服务商', 'SF Ops', '13900000005', 0, 'ACTIVE');

INSERT INTO wms_warehouse (warehouse_code, warehouse_name, warehouse_type, region, country, city, owner_type, owner_code, own_flag, vmi_flag, status) VALUES
('WH-HZ-CENTRAL', '杭州集团总仓', '集团总仓', '华东', '中国', '杭州', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-SH-REGION', '上海区域销售仓', '区域销售仓', '华东', '中国', '上海', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-GZ-3PL', '广州第三方仓', '第三方仓', '华南', '中国', '广州', 'SUPPLIER', 'SUP-DHL-004', 0, 0, 'ACTIVE'),
('WH-SZ-AFTERSALE', '深圳售后仓', '售后仓', '华南', '中国', '深圳', 'SELF', NULL, 1, 0, 'ACTIVE'),
('WH-CUST-TESLA-VMI', 'Tesla 客户 VMI 仓', '客户 VMI 仓', '华东', '中国', '上海', 'CUSTOMER', 'CUST-TESLA-001', 0, 1, 'ACTIVE'),
('WH-SUP-CATL-VMI', 'CATL 供应商 VMI 仓', '供应商 VMI 仓', '华东', '中国', '宁德', 'SUPPLIER', 'SUP-CATL-001', 0, 1, 'ACTIVE');

INSERT INTO wms_area (warehouse_id, area_code, area_name, area_type, quality_status_limit, status) VALUES
(1, 'AREA-GOOD-01', '良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(1, 'AREA-QC-01', '待检区', 'QC', 'PENDING', 'ACTIVE'),
(2, 'AREA-GOOD-01', '良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(2, 'AREA-QC-01', '待检区', 'QC', 'PENDING', 'ACTIVE'),
(3, 'AREA-GOOD-01', '良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(3, 'AREA-QC-01', '待检区', 'QC', 'PENDING', 'ACTIVE'),
(4, 'AREA-GOOD-01', '售后良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(4, 'AREA-REPAIR-01', '待修区', 'REPAIR', 'PENDING', 'ACTIVE'),
(4, 'AREA-SCRAP-01', '报废区', 'SCRAP', 'UNQUALIFIED', 'ACTIVE'),
(5, 'AREA-GOOD-01', '客户 VMI 良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(5, 'AREA-QC-01', '客户 VMI 待检区', 'QC', 'PENDING', 'ACTIVE'),
(6, 'AREA-GOOD-01', '供应商 VMI 良品区', 'GOOD', 'QUALIFIED', 'ACTIVE'),
(6, 'AREA-QC-01', '供应商 VMI 待检区', 'QC', 'PENDING', 'ACTIVE');

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
  CONCAT('标准库位-', LPAD(n, 2, '0')),
  CONCAT('R', LPAD(((n - 1) % 5) + 1, 2, '0')),
  CONCAT('L', ((n - 1) % 3) + 1),
  CONCAT('C', LPAD(n, 2, '0')),
  100,
  IF(n IN (7, 18), 1, 0),
  'ACTIVE'
FROM seq;

INSERT INTO wms_inventory (warehouse_id, area_id, location_id, product_id, batch_no, inventory_status, total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date, vmi_flag) VALUES
(1, 1, 1, 1, 'BATCH-OUT-DEMO', 'QUALIFIED', 42, 30, 7, 0, 0, DATE_SUB(CURDATE(), INTERVAL 40 DAY), 0),
(1, 1, 7, 1, 'BATCH-FROZEN-DEMO', 'FROZEN', 5, 0, 0, 5, 0, DATE_SUB(CURDATE(), INTERVAL 60 DAY), 0),
(1, 1, 1, 1, 'BATCH-UNQUAL-DEMO', 'UNQUALIFIED', 5, 0, 0, 0, 5, DATE_SUB(CURDATE(), INTERVAL 55 DAY), 0),
(1, 1, 1, 2, 'BATCH-GT50-DEMO', 'QUALIFIED', 15, 15, 0, 0, 0, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 0),
(2, 3, 2, 1, 'BATCH-SH-DEMO', 'QUALIFIED', 12, 12, 0, 0, 0, DATE_SUB(CURDATE(), INTERVAL 25 DAY), 0),
(4, 7, 4, 6, 'BATCH-AFTERSALE-DEMO', 'QUALIFIED', 8, 6, 2, 0, 0, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 0);

INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, locked_order_no, inbound_order_no, outbound_order_no, sold_flag, market_flag, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 30
)
SELECT
  CONCAT('SN-OUT-', LPAD(n, 4, '0')),
  1,
  CONCAT('MES-OUT-DEMO-', LPAD(n, 4, '0')),
  1,
  1,
  CONCAT('PLT-OUT-', LPAD(CEIL(n / 10), 4, '0')),
  CONCAT('BOX-OUT-', LPAD(CEIL(n / 5), 4, '0')),
  'ON_SHELF',
  'QUALIFIED',
  0,
  NULL,
  CONCAT('IN-OUT-DEMO-', LPAD(n, 4, '0')),
  NULL,
  0,
  0,
  DATE_SUB(NOW(), INTERVAL (70 - n) DAY)
FROM seq;

INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, locked_order_no, inbound_order_no, outbound_order_no, sold_flag, market_flag, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 10
)
SELECT
  CONCAT('SN-BAD-', LPAD(n, 4, '0')),
  1,
  CONCAT('MES-BAD-DEMO-', LPAD(n, 4, '0')),
  1,
  IF(n <= 5, 7, 1),
  'PLT-BAD-0001',
  CONCAT('BOX-BAD-', LPAD(CEIL(n / 5), 4, '0')),
  'ON_SHELF',
  IF(n <= 5, 'QUALIFIED', 'UNQUALIFIED'),
  IF(n = 10, 1, 0),
  IF(n = 10, 'OUT-OTHER-LOCK', NULL),
  CONCAT('IN-BAD-DEMO-', LPAD(n, 4, '0')),
  IF(n = 10, 'OUT-OTHER-LOCK', NULL),
  0,
  0,
  DATE_SUB(NOW(), INTERVAL (100 - n) DAY)
FROM seq;

INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, locked_order_no, inbound_order_no, outbound_order_no, sold_flag, market_flag, created_at)
VALUES
('SN-ALLOC-0001', 1, 'MES-HIS-ALLOC-001', 1, 1, 'PLT-HIS-0001', 'BOX-HIS-0001', 'ALLOCATED', 'QUALIFIED', 1, 'OUT202606120002', 'IN-HIS-0001', 'OUT202606120002', 0, 0, DATE_SUB(NOW(), INTERVAL 80 DAY)),
('SN-ALLOC-0002', 1, 'MES-HIS-ALLOC-002', 1, 1, 'PLT-HIS-0001', 'BOX-HIS-0001', 'ALLOCATED', 'QUALIFIED', 1, 'OUT202606120002', 'IN-HIS-0002', 'OUT202606120002', 0, 0, DATE_SUB(NOW(), INTERVAL 79 DAY)),
('SN-ALLOC-0003', 1, 'MES-HIS-ALLOC-003', 1, 1, 'PLT-HIS-0001', 'BOX-HIS-0001', 'ALLOCATED', 'QUALIFIED', 1, 'OUT202606120002', 'IN-HIS-0003', 'OUT202606120002', 0, 0, DATE_SUB(NOW(), INTERVAL 78 DAY)),
('SN-ALLOC-0004', 1, 'MES-HIS-ALLOC-004', 1, 1, 'PLT-HIS-0001', 'BOX-HIS-0001', 'ALLOCATED', 'QUALIFIED', 1, 'OUT202606120002', 'IN-HIS-0004', 'OUT202606120002', 0, 0, DATE_SUB(NOW(), INTERVAL 77 DAY)),
('SN-REV-0001', 1, 'MES-HIS-REV-001', 1, 1, 'PLT-HIS-0002', 'BOX-HIS-0002', 'REVIEWED', 'QUALIFIED', 1, 'OUT202606120003', 'IN-HIS-0005', 'OUT202606120003', 0, 0, DATE_SUB(NOW(), INTERVAL 76 DAY)),
('SN-REV-0002', 1, 'MES-HIS-REV-002', 1, 1, 'PLT-HIS-0002', 'BOX-HIS-0002', 'REVIEWED', 'QUALIFIED', 1, 'OUT202606120003', 'IN-HIS-0006', 'OUT202606120003', 0, 0, DATE_SUB(NOW(), INTERVAL 75 DAY)),
('SN-REV-0003', 1, 'MES-HIS-REV-003', 1, 1, 'PLT-HIS-0002', 'BOX-HIS-0002', 'REVIEWED', 'QUALIFIED', 1, 'OUT202606120003', 'IN-HIS-0007', 'OUT202606120003', 0, 0, DATE_SUB(NOW(), INTERVAL 74 DAY)),
('SN-SHIP-0001', 1, 'MES-HIS-SHIP-001', 1, 1, 'PLT-HIS-0003', 'BOX-HIS-0003', 'SHIPPED', 'QUALIFIED', 0, NULL, 'IN-HIS-0008', 'OUT202606120005', 1, 1, DATE_SUB(NOW(), INTERVAL 73 DAY)),
('SN-SHIP-0002', 1, 'MES-HIS-SHIP-002', 1, 1, 'PLT-HIS-0003', 'BOX-HIS-0003', 'SHIPPED', 'QUALIFIED', 0, NULL, 'IN-HIS-0009', 'OUT202606120005', 1, 1, DATE_SUB(NOW(), INTERVAL 72 DAY)),
('SN-SHIP-0003', 1, 'MES-HIS-SHIP-003', 1, 1, 'PLT-HIS-0003', 'BOX-HIS-0003', 'SHIPPED', 'QUALIFIED', 0, NULL, 'IN-HIS-0010', 'OUT202606120005', 1, 1, DATE_SUB(NOW(), INTERVAL 71 DAY)),
('SN-SHIP-0004', 1, 'MES-HIS-SHIP-004', 1, 1, 'PLT-HIS-0003', 'BOX-HIS-0003', 'SHIPPED', 'QUALIFIED', 0, NULL, 'IN-HIS-0011', 'OUT202606120005', 1, 1, DATE_SUB(NOW(), INTERVAL 70 DAY)),
('SN-SHIP-0005', 1, 'MES-HIS-SHIP-005', 1, 1, 'PLT-HIS-0003', 'BOX-HIS-0003', 'SHIPPED', 'QUALIFIED', 0, NULL, 'IN-HIS-0012', 'OUT202606120005', 1, 1, DATE_SUB(NOW(), INTERVAL 69 DAY));

INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, locked_order_no, inbound_order_no, outbound_order_no, sold_flag, market_flag, created_at)
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 10
)
SELECT
  CONCAT('SN-GT3-', LPAD(n, 4, '0')),
  1,
  'MES-MO-202606110001',
  NULL,
  NULL,
  NULL,
  NULL,
  'ISSUED',
  'QUALIFIED',
  0,
  NULL,
  NULL,
  NULL,
  0,
  0,
  DATE_SUB(NOW(), INTERVAL n DAY)
FROM seq;

INSERT INTO wms_package_binding (pallet_code, box_code, sn_code, product_id, inbound_order_no, bind_order_no, bind_status, bind_time)
SELECT pallet_code, box_code, sn_code, product_id, inbound_order_no, inbound_order_no, 'BOUND', NOW()
FROM wms_serial_number
WHERE pallet_code IS NOT NULL AND box_code IS NOT NULL
LIMIT 40;

INSERT INTO wms_inbound_order (order_no, source_order_no, mes_work_order_no, inbound_type, source_system, warehouse_id, supplier_id, customer_id, planned_qty, received_qty, status, sap_material_doc_no, sap_post_status, remark, created_at)
VALUES
('IN202606110001', 'MO202606110001', 'MES-MO-202606110001', 'PRODUCTION', 'SAP', 1, NULL, NULL, 10, 0, 'CREATED', NULL, NULL, '生产入库演示单', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('IN202606110002', 'ASN202606110002', 'MES-MO-202606110002', 'STOCKING', 'FULFILLMENT', 2, 1, NULL, 12, 12, 'CLOSED', '5000000002', 'POSTED', '备货入库演示单', DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status)
SELECT id, 1, IF(order_no = 'IN202606110001', 1, 2), planned_qty, received_qty,
       IF(status = 'CLOSED', received_qty, 0), CONCAT('BATCH-IN-', order_no), 'QUALIFIED'
FROM wms_inbound_order;

INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status)
SELECT id, 2, 3, 4, 2, 0, CONCAT('BATCH-IN-', order_no, '-L2'), 'QUALIFIED'
FROM wms_inbound_order
WHERE order_no = 'IN202606110002';

UPDATE wms_inbound_order
SET planned_qty = 16, received_qty = 14, status = 'PARTIAL_RECEIVED'
WHERE order_no = 'IN202606110002';

UPDATE wms_inbound_order_detail
SET status = CASE
  WHEN received_qty = 0 THEN 'CREATED'
  WHEN received_qty >= planned_qty THEN 'RECEIVED'
  ELSE 'PARTIAL_RECEIVED'
END;

INSERT INTO wms_inbound_order (
  order_no, source_order_no, mes_work_order_no, inbound_type, source_system,
  warehouse_id, supplier_id, customer_id, planned_qty, received_qty, status,
  sap_material_doc_no, sap_post_status, sap_post_result, remark, created_at
) VALUES
('IN202606110100', 'MO202606110100', 'MES-MO-202606110100', 'PRODUCTION', 'SAP', 1, NULL, NULL, 23, 2, 'PARTIAL_RECEIVED', NULL, 'FAILED', 'SAP 回传失败：物料移动类型缺失', '多行生产入库演示单', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('IN202606110101', 'STOCK202606110101', 'MES-STOCK202606110101', 'STOCKING', 'FULFILLMENT', 2, NULL, NULL, 10, 0, 'CREATED', NULL, 'NOT_POSTED', '', '多行备货入库演示单', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('IN202606110102', 'POVMI202606110102', 'MES-POVMI202606110102', 'SUPPLIER_VMI', 'SAP', 6, 1, NULL, 50, 0, 'CREATED', NULL, 'NOT_POSTED', '', '多行供应商 VMI 入库演示单', DATE_SUB(NOW(), INTERVAL 1 HOUR));

INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 10, p.id, 10, 2, 0, 'BATCH-IN202606110100-10', 'QUALIFIED', 'PARTIAL_RECEIVED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'GT3-30KD1R11001'
WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 20, p.id, 5, 0, 0, 'BATCH-IN202606110100-20', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'BLF51-5R31101'
WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 30, p.id, 8, 0, 0, 'BATCH-IN202606110100-30', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'HP3-12KD2R11101'
WHERE o.order_no = 'IN202606110100';

INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 10, p.id, 6, 0, 0, 'BATCH-IN202606110101-10', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'GT3-20KD1R11001'
WHERE o.order_no = 'IN202606110101';
INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 20, p.id, 4, 0, 0, 'BATCH-IN202606110101-20', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'GT3-10KD1R11001'
WHERE o.order_no = 'IN202606110101';

INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 10, p.id, 20, 0, 0, 'BATCH-IN202606110102-10', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'SP-BMS-001'
WHERE o.order_no = 'IN202606110102';
INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status, status)
SELECT o.id, 20, p.id, 30, 0, 0, 'BATCH-IN202606110102-20', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o JOIN md_product p ON p.product_code = 'SP-CABLE-001'
WHERE o.order_no = 'IN202606110102';

INSERT INTO wms_inbound_order (
  order_no, source_order_no, mes_work_order_no, inbound_type, source_system,
  warehouse_id, owner_code, owner_name, sap_plant, planned_qty, received_qty,
  status, sap_post_status, sap_post_result, remark, created_by, updated_by, created_at
) VALUES (
  'IN-DEMO-SN-MIX-001', 'MO-DEMO-SN-MIX-001', 'MES-DEMO-SN-MIX-001',
  'PRODUCTION', 'SAP', 1, '3060', '杭州利沃得', '3060', 12, 0,
  'CREATED', 'NOT_POSTED', '', 'SN/非SN混合收货演示单', 'wh_admin', 'wh_admin', NOW()
);

UPDATE wms_inbound_order
SET ship_from_country = CASE order_no
  WHEN 'IN202606110001' THEN '中国'
  WHEN 'IN202606110002' THEN '美国'
  WHEN 'IN202606110100' THEN '德国'
  WHEN 'IN202606110101' THEN '越南'
  WHEN 'IN202606110102' THEN '泰国'
  WHEN 'IN-DEMO-SN-MIX-001' THEN '中国'
  ELSE COALESCE(ship_from_country, '中国')
END;

INSERT INTO wms_inbound_order_detail (
  order_id, line_no, product_id, planned_qty, received_qty, shelved_qty,
  sap_plant, sap_storage_location, sn_required, owner_code,
  batch_no, quality_status, status
)
SELECT o.id, 10, p.id, 3, 0, 0, '3060', '1001', 1, '3060',
       'BATCH-IN-DEMO-SN-MIX-001-10', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o
JOIN md_product p ON p.owner_code = '3060' AND p.product_code = 'GT3-10KD1R11004'
WHERE o.order_no = 'IN-DEMO-SN-MIX-001';

INSERT INTO wms_inbound_order_detail (
  order_id, line_no, product_id, planned_qty, received_qty, shelved_qty,
  sap_plant, sap_storage_location, sn_required, owner_code,
  batch_no, quality_status, status
)
SELECT o.id, 20, p.id, 5, 0, 0, '3060', '1001', 0, '3060',
       'BATCH-IN-DEMO-SN-MIX-001-20', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o
JOIN md_product p ON p.owner_code = '3060' AND p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'IN-DEMO-SN-MIX-001';

INSERT INTO wms_inbound_order_detail (
  order_id, line_no, product_id, planned_qty, received_qty, shelved_qty,
  sap_plant, sap_storage_location, sn_required, owner_code,
  batch_no, quality_status, status
)
SELECT o.id, 30, p.id, 4, 0, 0, '3060', '1001', 0, '3060',
       'BATCH-IN-DEMO-SN-MIX-001-30', 'QUALIFIED', 'CREATED'
FROM wms_inbound_order o
JOIN md_product p ON p.owner_code = '3060' AND p.product_code = 'LHECCHR11002'
WHERE o.order_no = 'IN-DEMO-SN-MIX-001';

INSERT INTO wms_serial_number (
  sn_code, product_id, mes_work_order_no, warehouse_id, location_id,
  pallet_code, box_code, status, quality_status, locked_flag,
  inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at
)
SELECT sn.sn_code, p.id, 'MES-DEMO-SN-MIX-001', NULL, NULL,
       NULL, NULL, 'ISSUED', 'QUALIFIED', 0,
       NULL, NULL, 0, 0, NOW()
FROM (
  SELECT 'SN-MIX-GT3-0001' AS sn_code UNION ALL
  SELECT 'SN-MIX-GT3-0002' UNION ALL
  SELECT 'SN-MIX-GT3-0003'
) sn
JOIN md_product p ON p.owner_code = '3060' AND p.product_code = 'GT3-10KD1R11004';

INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at)
SELECT 'SN-IN100-GT30-R001', d.product_id, 'MES-MO-202606110100', 1, NULL, 'PLT-IN100-001', 'BOX-IN100-001', 'RECEIVED', 'QUALIFIED', 0, o.order_no, d.id, 0, 0, NOW()
FROM wms_inbound_order o JOIN wms_inbound_order_detail d ON d.order_id = o.id AND d.line_no = 10 WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at)
SELECT 'SN-IN100-GT30-R002', d.product_id, 'MES-MO-202606110100', 1, NULL, 'PLT-IN100-001', 'BOX-IN100-001', 'RECEIVED', 'QUALIFIED', 0, o.order_no, d.id, 0, 0, NOW()
FROM wms_inbound_order o JOIN wms_inbound_order_detail d ON d.order_id = o.id AND d.line_no = 10 WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at)
SELECT 'SN-IN100-BLF-C001', d.product_id, 'MES-MO-202606110100', 1, NULL, 'PLT-IN100-002', 'BOX-IN100-002', 'COLLECTED', 'QUALIFIED', 0, o.order_no, d.id, 0, 0, NOW()
FROM wms_inbound_order o JOIN wms_inbound_order_detail d ON d.order_id = o.id AND d.line_no = 20 WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at)
SELECT 'SN-IN100-BLF-C002', d.product_id, 'MES-MO-202606110100', 1, NULL, 'PLT-IN100-002', 'BOX-IN100-002', 'COLLECTED', 'QUALIFIED', 0, o.order_no, d.id, 0, 0, NOW()
FROM wms_inbound_order o JOIN wms_inbound_order_detail d ON d.order_id = o.id AND d.line_no = 20 WHERE o.order_no = 'IN202606110100';
INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, inbound_order_line_id, sold_flag, market_flag, created_at)
SELECT 'SN-IN102-BMS-C001', d.product_id, 'MES-POVMI202606110102', 6, NULL, 'PLT-IN102-001', 'BOX-IN102-001', 'COLLECTED', 'QUALIFIED', 0, o.order_no, d.id, 0, 0, NOW()
FROM wms_inbound_order o JOIN wms_inbound_order_detail d ON d.order_id = o.id AND d.line_no = 10 WHERE o.order_no = 'IN202606110102';

INSERT INTO wms_package_binding (pallet_code, box_code, sn_code, product_id, inbound_order_no, inbound_order_line_id, bind_order_no, bind_status, bind_time)
SELECT pallet_code, box_code, sn_code, product_id, inbound_order_no, inbound_order_line_id, inbound_order_no, 'BOUND', NOW()
FROM wms_serial_number
WHERE sn_code LIKE 'SN-IN10%';

INSERT INTO wms_inbound_receipt (receipt_no, inbound_order_id, inbound_order_no, receipt_time, receipt_user, status, sap_post_status, sap_post_result, created_at)
SELECT 'RCV20260611010001', id, order_no, DATE_SUB(NOW(), INTERVAL 90 MINUTE), 'wh_admin', 'RECEIVED', 'FAILED', 'SAP 回传失败：物料移动类型缺失', DATE_SUB(NOW(), INTERVAL 90 MINUTE)
FROM wms_inbound_order
WHERE order_no = 'IN202606110100';
INSERT INTO wms_inbound_receipt_line (receipt_id, inbound_order_line_id, line_no, product_id, product_code, receive_qty, sap_post_qty, sap_post_status, sap_post_result)
SELECT r.id, d.id, d.line_no, d.product_id, p.product_code, 2, 0, 'FAILED', 'SAP 回传失败：物料移动类型缺失'
FROM wms_inbound_receipt r
JOIN wms_inbound_order_detail d ON d.order_id = r.inbound_order_id AND d.line_no = 10
JOIN md_product p ON p.id = d.product_id
WHERE r.receipt_no = 'RCV20260611010001';
INSERT INTO wms_inbound_receipt_sn (receipt_id, receipt_line_id, sn_code, product_id, inbound_order_line_id, pallet_code, box_code)
SELECT r.id, rl.id, sn.sn_code, sn.product_id, sn.inbound_order_line_id, sn.pallet_code, sn.box_code
FROM wms_inbound_receipt r
JOIN wms_inbound_receipt_line rl ON rl.receipt_id = r.id
JOIN wms_serial_number sn ON sn.inbound_order_line_id = rl.inbound_order_line_id AND sn.status = 'RECEIVED'
WHERE r.receipt_no = 'RCV20260611010001';

INSERT INTO wms_outbound_order (
  order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
  planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, status,
  logistics_company, tracking_no, shipper, ship_time, sap_material_doc_no, sap_post_status, trace_post_status, remark, created_at
) VALUES
('OUT202606120001', 'SO202606120001', 'FULFILLMENT', 'SALES', 1, NULL, 1, 5, 0, 0, 0, 0, 'PENDING_ALLOC', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '销售出库完整演示起点', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('OUT202606120002', 'SO202606120002', 'FULFILLMENT', 'SALES', 1, NULL, 2, 4, 4, 0, 0, 0, 'ALLOCATED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '已分配销售单，可演示生成拣货任务', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUT202606120003', 'SO202606120003', 'FULFILLMENT', 'SALES', 1, NULL, 3, 3, 3, 3, 3, 0, 'REVIEWED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '已复核销售单，可直接演示发货', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('OUT202606120004', 'STO202606120004', 'SAP', 'TRANSFER', 1, 2, NULL, 6, 0, 0, 0, 0, 'PENDING_ALLOC', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '集团总仓调拨至上海区域仓', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('OUT202606120005', 'STO202606120005', 'SAP', 'TRANSFER', 1, 2, NULL, 5, 5, 5, 5, 5, 'CALLBACK_SUCCESS', 'SF', 'SF202606120005', 'logistics', DATE_SUB(NOW(), INTERVAL 3 DAY), '4900000005', 'POSTED', 'POSTED', '已发货调拨历史单', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('OUT202606120006', 'AS202606120006', 'CRM', 'AFTERSALE', 4, NULL, 1, 2, 2, 1, 0, 0, 'PICKING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '售后发货演示单', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('OUT202606120007', 'SO202606120007', 'FULFILLMENT', 'SALES', 2, NULL, 4, 2, 2, 2, 2, 2, 'CALLBACK_SUCCESS', 'DHL', 'DHL202606120007', 'logistics', DATE_SUB(NOW(), INTERVAL 4 DAY), '4900000007', 'POSTED', 'POSTED', '历史销售发货记录', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('OUT202606120008', 'SO202606120008', 'FULFILLMENT', 'SALES', 3, NULL, 5, 1, 1, 1, 1, 1, 'CALLBACK_FAILED', 'SF', 'SF202606120008', 'logistics', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 'FAILED', 'POSTED', 'SAP 扣减失败演示单', DATE_SUB(NOW(), INTERVAL 6 DAY));

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT id, 1,
       IF(outbound_type = 'AFTERSALE', 6, 1),
       planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
       CONCAT('BATCH-OUT-', order_no),
       status
FROM wms_outbound_order;

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT id, 2, 3, 2, 0, 0, 0, 0, CONCAT('BATCH-OUT-', order_no, '-L2'), status
FROM wms_outbound_order
WHERE order_no = 'OUT202606120004';

UPDATE wms_outbound_order
SET planned_qty = 8
WHERE order_no = 'OUT202606120004';

INSERT INTO wms_inventory_allocation (
  allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
  warehouse_id, location_id, product_id, batch_no, sn_code, allocation_mode, allocation_status,
  picker, picked_at, reviewer, reviewed_at, created_at
)
SELECT CONCAT('ALLOC-', o.order_no, '-', s.sn_code), o.id, o.order_no, d.id, 1,
       o.warehouse_id, s.location_id, s.product_id, 'BATCH-OUT-DEMO', s.sn_code, 'AUTO',
       CASE
         WHEN o.order_no = 'OUT202606120002' THEN 'ALLOCATED'
         WHEN o.order_no = 'OUT202606120003' THEN 'REVIEWED'
         WHEN o.order_no = 'OUT202606120005' THEN 'SHIPPED'
         ELSE 'ALLOCATED'
       END,
       IF(o.order_no IN ('OUT202606120003', 'OUT202606120005'), 'wh_admin', NULL),
       IF(o.order_no IN ('OUT202606120003', 'OUT202606120005'), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
       IF(o.order_no IN ('OUT202606120003', 'OUT202606120005'), 'logistics', NULL),
       IF(o.order_no IN ('OUT202606120003', 'OUT202606120005'), DATE_SUB(NOW(), INTERVAL 20 HOUR), NULL),
       DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM wms_serial_number s
JOIN wms_outbound_order o ON (
  (o.order_no = 'OUT202606120002' AND s.sn_code IN ('SN-ALLOC-0001', 'SN-ALLOC-0002', 'SN-ALLOC-0003', 'SN-ALLOC-0004'))
  OR (o.order_no = 'OUT202606120003' AND s.sn_code IN ('SN-REV-0001', 'SN-REV-0002', 'SN-REV-0003'))
  OR (o.order_no = 'OUT202606120005' AND s.sn_code IN ('SN-SHIP-0001', 'SN-SHIP-0002', 'SN-SHIP-0003', 'SN-SHIP-0004', 'SN-SHIP-0005'))
)
JOIN wms_outbound_order_detail d ON d.order_id = o.id;

INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK202606120001', id, order_no, warehouse_id, 1, 1, 4, 0, 'PENDING', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120002';
INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK202606120002', id, order_no, warehouse_id, 1, 1, 3, 3, 'PICKED', 'wh_admin', DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120003';
INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK202606120003', id, order_no, warehouse_id, 1, 1, 5, 5, 'PICKED', 'wh_admin', DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120005';
INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK202606120004', id, order_no, warehouse_id, 4, 6, 2, 1, 'PICKING', 'wh_admin', DATE_SUB(NOW(), INTERVAL 5 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120006';
INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK202606120005', id, order_no, warehouse_id, 2, 1, 2, 2, 'PICKED', 'wh_admin', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120007';

INSERT INTO wms_picking_record (task_id, task_no, outbound_order_id, outbound_order_no, sn_code, location_id, picker, result, error_message, created_at)
SELECT t.id, t.task_no, t.outbound_order_id, t.outbound_order_no, a.sn_code, t.location_id, 'wh_admin', 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM wms_picking_task t
JOIN wms_inventory_allocation a ON a.outbound_order_id = t.outbound_order_id
WHERE t.task_no IN ('PICK202606120002', 'PICK202606120003');

INSERT INTO wms_outbound_review_record (outbound_order_id, outbound_order_no, sn_code, reviewer, result, error_message, created_at)
SELECT o.id, o.order_no, a.sn_code, 'logistics', 'SUCCESS', NULL, DATE_SUB(NOW(), INTERVAL 20 HOUR)
FROM wms_outbound_order o
JOIN wms_inventory_allocation a ON a.outbound_order_id = o.id
WHERE o.order_no IN ('OUT202606120003', 'OUT202606120005');

INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120001', id, order_no, 'SF', 'SF202606120005', 3, 'logistics', DATE_SUB(NOW(), INTERVAL 3 DAY), '调拨发货第一批', DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120005';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120002', id, order_no, 'DHL', 'DHL202606120007', 2, 'logistics', DATE_SUB(NOW(), INTERVAL 4 DAY), '海外销售发货', DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120007';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120003', id, order_no, 'SF', 'SF202606120008', 1, 'logistics', DATE_SUB(NOW(), INTERVAL 5 DAY), 'SAP 失败演示', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120008';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120004', id, order_no, 'SF', 'SF202606120005-2', 2, 'logistics', DATE_SUB(NOW(), INTERVAL 2 DAY), '调拨发货第二批', DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120005';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120005', id, order_no, 'SF', 'SF202606120006', 1, 'logistics', DATE_SUB(NOW(), INTERVAL 1 HOUR), '售后部分发货演示', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120006';

INSERT INTO wms_inventory_transaction (transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id, sn_code, batch_no, qty, before_qty, after_qty, operator, remark, created_at)
SELECT CONCAT('TXN-', o.order_no, '-', a.sn_code), 'OUTBOUND_SHIP', o.order_no, o.warehouse_id, a.location_id, a.product_id, a.sn_code, a.batch_no, -1, NULL, NULL, 'logistics', '发货扣减库存', DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM wms_outbound_order o
JOIN wms_inventory_allocation a ON a.outbound_order_id = o.id
WHERE o.order_no = 'OUT202606120005';

INSERT INTO wms_interface_log (interface_name, source_system, target_system, business_doc_no, http_method, request_url, request_body, response_body, status, retry_count, error_message, created_at) VALUES
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120005', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 5), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120007', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 2), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120008', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 1), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120003', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 3), JSON_OBJECT('traceStatus', 'PENDING'), 'WARNING', 0, '待发货确认后回传', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120006', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 1), JSON_OBJECT('traceStatus', 'FAILED'), 'FAILED', 2, '追溯服务模拟超时', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120005', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 5), JSON_OBJECT('sapMaterialDocNo', '4900000005'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120007', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 2), JSON_OBJECT('sapMaterialDocNo', '4900000007'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120008', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 1), JSON_OBJECT('sapMaterialDocNo', NULL), 'FAILED', 2, 'SAP 库存地点不存在', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120003', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 3), JSON_OBJECT('postingStatus', 'PENDING'), 'WARNING', 0, '待发货确认后过账', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120006', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 1), JSON_OBJECT('sapMaterialDocNo', '4900000006'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('FULFILLMENT_ORDER_PUSH', 'FULFILLMENT', 'WMS', 'OUT202606120001', 'POST', '/api/mock/fulfillment/outbound-orders', JSON_OBJECT('sourceOrderNo', 'SO202606120001'), JSON_OBJECT('outboundOrderNo', 'OUT202606120001'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO wms_mock_config (interface_name, target_system, enabled, force_fail, delay_ms, failure_message, updated_by) VALUES
('SAP_INBOUND_POSTING', 'SAP', 1, 0, 120, 'SAP 入库过账 Mock 失败', 'system'),
('SAP_OUTBOUND_POSTING', 'SAP', 1, 0, 120, 'SAP 出库扣减 Mock 失败', 'system'),
('TRACE_OUTBOUND_SN', 'TRACE', 1, 0, 120, '追溯系统 Mock 超时', 'system'),
('MES_SN_PUSH', 'WMS', 1, 0, 80, 'MES SN 下发 Mock 失败', 'system'),
('FULFILLMENT_ORDER_PUSH', 'WMS', 1, 0, 100, '履约单据下发 Mock 失败', 'system');

INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120001', id, order_no, NULL, NULL, 'INSUFFICIENT_STOCK', '可用库存不足，无法分配 20 个 SN', 'OPEN', 'system', DATE_SUB(NOW(), INTERVAL 3 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120001';
INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120002', id, order_no, 'PICK202606120001', 'SN-BAD-0006', 'SN_UNQUALIFIED', '不合格 SN 不允许分配或拣货', 'OPEN', 'wh_admin', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120002';
INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120003', id, order_no, 'PICK202606120001', 'SN-OUT-0030', 'SN_MISMATCH', '该 SN 不属于当前出库单分配范围', 'OPEN', 'wh_admin', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120002';

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at) VALUES
('INBOUND', 'IN202606110001', 'CREATE_PRODUCTION_ORDER', 'system', 'SUCCESS', 'SAP Mock 创建生产入库单', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUTBOUND', 'OUT202606120001', 'CREATE_OUTBOUND_ORDER', 'system', 'SUCCESS', '履约系统下发销售订单', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('OUTBOUND', 'OUT202606120002', 'ALLOCATE_AUTO', 'wh_admin', 'SUCCESS', '系统自动分配 4 个 SN', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUTBOUND', 'OUT202606120003', 'REVIEW_SN', 'logistics', 'SUCCESS', '出库复核完成', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
('OUTBOUND', 'OUT202606120005', 'SHIP_CONFIRM', 'logistics', 'SUCCESS', '发货确认并触发追溯/SAP 回传', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('OUTBOUND', 'OUT202606120008', 'SAP_OUTBOUND_POSTING', 'system', 'FAILED', 'SAP 库存地点不存在', DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO wms_outbound_status_history (outbound_order_id, outbound_order_no, from_status, to_status, action, operator, message, created_at)
SELECT id, order_no, NULL, status, 'SEED_STATUS', 'system', '演示数据初始化', created_at
FROM wms_outbound_order;
