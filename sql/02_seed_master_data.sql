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
('admin', 'admin123', '绯荤粺绠＄悊鍛?, 'ADMIN', '绯荤粺绠＄悊鍛?, '*', 'ACTIVE'),
('wh_admin', '123456', '浠撳簱绠＄悊鍛?, 'WAREHOUSE_ADMIN', '浠撳簱绠＄悊鍛?, 'WH-HZ-CENTRAL,WH-SH-REGION', 'ACTIVE'),
('planner', '123456', '璁″垝浜哄憳', 'PLANNER', '璁″垝浜哄憳', '*', 'ACTIVE'),
('logistics', '123456', '鐗╂祦浜哄憳', 'LOGISTICS', '鐗╂祦浜哄憳', 'WH-HZ-CENTRAL,WH-SH-REGION', 'ACTIVE'),
('aftersale', '123456', '鍞悗浜哄憳', 'AFTERSALE', '鍞悗浜哄憳', 'WH-SZ-AFTERSALE', 'ACTIVE'),
('manager', '123456', '绠＄悊灞?, 'MANAGER', '绠＄悊灞?, '*', 'ACTIVE');

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

