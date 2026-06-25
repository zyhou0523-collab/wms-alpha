USE wms_alpha;

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
('IN202606110001', 'MO202606110001', 'MES-MO-202606110001', 'PRODUCTION', 'SAP', 1, NULL, NULL, 10, 0, 'CREATED', NULL, NULL, '鐢熶骇鍏ュ簱婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('IN202606110002', 'ASN202606110002', 'MES-MO-202606110002', 'STOCKING', 'FULFILLMENT', 2, 1, NULL, 12, 12, 'CLOSED', '5000000002', 'POSTED', '澶囪揣鍏ュ簱婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 2 DAY));

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
('IN202606110100', 'MO202606110100', 'MES-MO-202606110100', 'PRODUCTION', 'SAP', 1, NULL, NULL, 23, 2, 'PARTIAL_RECEIVED', NULL, 'FAILED', 'SAP 鍥炰紶澶辫触锛氱墿鏂欑Щ鍔ㄧ被鍨嬬己澶?, '澶氳鐢熶骇鍏ュ簱婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('IN202606110101', 'STOCK202606110101', 'MES-STOCK202606110101', 'STOCKING', 'FULFILLMENT', 2, NULL, NULL, 10, 0, 'CREATED', NULL, 'NOT_POSTED', '', '澶氳澶囪揣鍏ュ簱婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('IN202606110102', 'POVMI202606110102', 'MES-POVMI202606110102', 'SUPPLIER_VMI', 'SAP', 6, 1, NULL, 50, 0, 'CREATED', NULL, 'NOT_POSTED', '', '澶氳渚涘簲鍟?VMI 鍏ュ簱婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 1 HOUR));

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
  'PRODUCTION', 'SAP', 1, '3060', '鏉窞鍒╂矁寰?, '3060', 12, 0,
  'CREATED', 'NOT_POSTED', '', 'SN/闈濻N娣峰悎鏀惰揣婕旂ず鍗?, 'wh_admin', 'wh_admin', NOW()
);

UPDATE wms_inbound_order
SET ship_from_country = CASE order_no
  WHEN 'IN202606110001' THEN '涓浗'
  WHEN 'IN202606110002' THEN '缇庡浗'
  WHEN 'IN202606110100' THEN '寰峰浗'
  WHEN 'IN202606110101' THEN '瓒婂崡'
  WHEN 'IN202606110102' THEN '娉板浗'
  WHEN 'IN-DEMO-SN-MIX-001' THEN '涓浗'
  ELSE COALESCE(ship_from_country, '涓浗')
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
SELECT 'RCV20260611010001', id, order_no, DATE_SUB(NOW(), INTERVAL 90 MINUTE), 'wh_admin', 'RECEIVED', 'FAILED', 'SAP 鍥炰紶澶辫触锛氱墿鏂欑Щ鍔ㄧ被鍨嬬己澶?, DATE_SUB(NOW(), INTERVAL 90 MINUTE)
FROM wms_inbound_order
WHERE order_no = 'IN202606110100';
INSERT INTO wms_inbound_receipt_line (receipt_id, inbound_order_line_id, line_no, product_id, product_code, receive_qty, sap_post_qty, sap_post_status, sap_post_result)
SELECT r.id, d.id, d.line_no, d.product_id, p.product_code, 2, 0, 'FAILED', 'SAP 鍥炰紶澶辫触锛氱墿鏂欑Щ鍔ㄧ被鍨嬬己澶?
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
('OUT202606120001', 'SO202606120001', 'FULFILLMENT', 'SALES', 1, NULL, 1, 5, 0, 0, 0, 0, 'PENDING_ALLOC', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '閿€鍞嚭搴撳畬鏁存紨绀鸿捣鐐?, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('OUT202606120002', 'SO202606120002', 'FULFILLMENT', 'SALES', 1, NULL, 2, 4, 4, 0, 0, 0, 'ALLOCATED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '宸插垎閰嶉攢鍞崟锛屽彲婕旂ず鐢熸垚鎷ｈ揣浠诲姟', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUT202606120003', 'SO202606120003', 'FULFILLMENT', 'SALES', 1, NULL, 3, 3, 3, 3, 3, 0, 'REVIEWED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '宸插鏍搁攢鍞崟锛屽彲鐩存帴婕旂ず鍙戣揣', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('OUT202606120004', 'STO202606120004', 'SAP', 'TRANSFER', 1, 2, NULL, 6, 0, 0, 0, 0, 'PENDING_ALLOC', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '闆嗗洟鎬讳粨璋冩嫧鑷充笂娴峰尯鍩熶粨', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
('OUT202606120005', 'STO202606120005', 'SAP', 'TRANSFER', 1, 2, NULL, 5, 5, 5, 5, 5, 'CALLBACK_SUCCESS', 'SF', 'SF202606120005', 'logistics', DATE_SUB(NOW(), INTERVAL 3 DAY), '4900000005', 'POSTED', 'POSTED', '宸插彂璐ц皟鎷ㄥ巻鍙插崟', DATE_SUB(NOW(), INTERVAL 4 DAY)),
('OUT202606120006', 'AS202606120006', 'CRM', 'AFTERSALE', 4, NULL, 1, 2, 2, 1, 0, 0, 'PICKING', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '鍞悗鍙戣揣婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
('OUT202606120007', 'SO202606120007', 'FULFILLMENT', 'SALES', 2, NULL, 4, 2, 2, 2, 2, 2, 'CALLBACK_SUCCESS', 'DHL', 'DHL202606120007', 'logistics', DATE_SUB(NOW(), INTERVAL 4 DAY), '4900000007', 'POSTED', 'POSTED', '鍘嗗彶閿€鍞彂璐ц褰?, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('OUT202606120008', 'SO202606120008', 'FULFILLMENT', 'SALES', 3, NULL, 5, 1, 1, 1, 1, 1, 'CALLBACK_FAILED', 'SF', 'SF202606120008', 'logistics', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 'FAILED', 'POSTED', 'SAP 鎵ｅ噺澶辫触婕旂ず鍗?, DATE_SUB(NOW(), INTERVAL 6 DAY));

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
SELECT 'SHIP202606120001', id, order_no, 'SF', 'SF202606120005', 3, 'logistics', DATE_SUB(NOW(), INTERVAL 3 DAY), '璋冩嫧鍙戣揣绗竴鎵?, DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120005';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120002', id, order_no, 'DHL', 'DHL202606120007', 2, 'logistics', DATE_SUB(NOW(), INTERVAL 4 DAY), '娴峰閿€鍞彂璐?, DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120007';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120003', id, order_no, 'SF', 'SF202606120008', 1, 'logistics', DATE_SUB(NOW(), INTERVAL 5 DAY), 'SAP 澶辫触婕旂ず', DATE_SUB(NOW(), INTERVAL 5 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120008';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120004', id, order_no, 'SF', 'SF202606120005-2', 2, 'logistics', DATE_SUB(NOW(), INTERVAL 2 DAY), '璋冩嫧鍙戣揣绗簩鎵?, DATE_SUB(NOW(), INTERVAL 2 DAY)
FROM wms_outbound_order WHERE order_no = 'OUT202606120005';
INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark, created_at)
SELECT 'SHIP202606120005', id, order_no, 'SF', 'SF202606120006', 1, 'logistics', DATE_SUB(NOW(), INTERVAL 1 HOUR), '鍞悗閮ㄥ垎鍙戣揣婕旂ず', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120006';

INSERT INTO wms_inventory_transaction (transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id, sn_code, batch_no, qty, before_qty, after_qty, operator, remark, created_at)
SELECT CONCAT('TXN-', o.order_no, '-', a.sn_code), 'OUTBOUND_SHIP', o.order_no, o.warehouse_id, a.location_id, a.product_id, a.sn_code, a.batch_no, -1, NULL, NULL, 'logistics', '鍙戣揣鎵ｅ噺搴撳瓨', DATE_SUB(NOW(), INTERVAL 3 DAY)
FROM wms_outbound_order o
JOIN wms_inventory_allocation a ON a.outbound_order_id = o.id
WHERE o.order_no = 'OUT202606120005';

INSERT INTO wms_interface_log (interface_name, source_system, target_system, business_doc_no, http_method, request_url, request_body, response_body, status, retry_count, error_message, created_at) VALUES
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120005', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 5), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120007', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 2), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120008', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 1), JSON_OBJECT('traceStatus', 'RECEIVED'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120003', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 3), JSON_OBJECT('traceStatus', 'PENDING'), 'WARNING', 0, '寰呭彂璐х‘璁ゅ悗鍥炰紶', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('TRACE_OUTBOUND_SN', 'WMS', 'TRACE', 'OUT202606120006', 'POST', '/api/mock/trace/outbound-sn', JSON_OBJECT('snCount', 1), JSON_OBJECT('traceStatus', 'FAILED'), 'FAILED', 2, '杩芥函鏈嶅姟妯℃嫙瓒呮椂', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120005', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 5), JSON_OBJECT('sapMaterialDocNo', '4900000005'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120007', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 2), JSON_OBJECT('sapMaterialDocNo', '4900000007'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120008', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 1), JSON_OBJECT('sapMaterialDocNo', NULL), 'FAILED', 2, 'SAP 搴撳瓨鍦扮偣涓嶅瓨鍦?, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120003', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 3), JSON_OBJECT('postingStatus', 'PENDING'), 'WARNING', 0, '寰呭彂璐х‘璁ゅ悗杩囪处', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'OUT202606120006', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('qty', 1), JSON_OBJECT('sapMaterialDocNo', '4900000006'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('FULFILLMENT_ORDER_PUSH', 'FULFILLMENT', 'WMS', 'OUT202606120001', 'POST', '/api/mock/fulfillment/outbound-orders', JSON_OBJECT('sourceOrderNo', 'SO202606120001'), JSON_OBJECT('outboundOrderNo', 'OUT202606120001'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 2 HOUR));

INSERT INTO wms_mock_config (interface_name, target_system, enabled, force_fail, delay_ms, failure_message, updated_by) VALUES
('SAP_INBOUND_POSTING', 'SAP', 1, 0, 120, 'SAP 鍏ュ簱杩囪处 Mock 澶辫触', 'system'),
('SAP_OUTBOUND_POSTING', 'SAP', 1, 0, 120, 'SAP 鍑哄簱鎵ｅ噺 Mock 澶辫触', 'system'),
('TRACE_OUTBOUND_SN', 'TRACE', 1, 0, 120, '杩芥函绯荤粺 Mock 瓒呮椂', 'system'),
('MES_SN_PUSH', 'WMS', 1, 0, 80, 'MES SN 涓嬪彂 Mock 澶辫触', 'system'),
('FULFILLMENT_ORDER_PUSH', 'WMS', 1, 0, 100, '灞ョ害鍗曟嵁涓嬪彂 Mock 澶辫触', 'system');

INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120001', id, order_no, NULL, NULL, 'INSUFFICIENT_STOCK', '鍙敤搴撳瓨涓嶈冻锛屾棤娉曞垎閰?20 涓?SN', 'OPEN', 'system', DATE_SUB(NOW(), INTERVAL 3 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120001';
INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120002', id, order_no, 'PICK202606120001', 'SN-BAD-0006', 'SN_UNQUALIFIED', '涓嶅悎鏍?SN 涓嶅厑璁稿垎閰嶆垨鎷ｈ揣', 'OPEN', 'wh_admin', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120002';
INSERT INTO wms_outbound_exception (exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, status, operator, created_at)
SELECT 'EXC202606120003', id, order_no, 'PICK202606120001', 'SN-OUT-0030', 'SN_MISMATCH', '璇?SN 涓嶅睘浜庡綋鍓嶅嚭搴撳崟鍒嗛厤鑼冨洿', 'OPEN', 'wh_admin', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order WHERE order_no = 'OUT202606120002';

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at) VALUES
('INBOUND', 'IN202606110001', 'CREATE_PRODUCTION_ORDER', 'system', 'SUCCESS', 'SAP Mock 鍒涘缓鐢熶骇鍏ュ簱鍗?, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUTBOUND', 'OUT202606120001', 'CREATE_OUTBOUND_ORDER', 'system', 'SUCCESS', '灞ョ害绯荤粺涓嬪彂閿€鍞鍗?, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('OUTBOUND', 'OUT202606120002', 'ALLOCATE_AUTO', 'wh_admin', 'SUCCESS', '绯荤粺鑷姩鍒嗛厤 4 涓?SN', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OUTBOUND', 'OUT202606120003', 'REVIEW_SN', 'logistics', 'SUCCESS', '鍑哄簱澶嶆牳瀹屾垚', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
('OUTBOUND', 'OUT202606120005', 'SHIP_CONFIRM', 'logistics', 'SUCCESS', '鍙戣揣纭骞惰Е鍙戣拷婧?SAP 鍥炰紶', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('OUTBOUND', 'OUT202606120008', 'SAP_OUTBOUND_POSTING', 'system', 'FAILED', 'SAP 搴撳瓨鍦扮偣涓嶅瓨鍦?, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- 发运订单模块 v0.7 演示数据：销售 / 调拨 / STO / 部分发运
INSERT INTO wms_inventory (warehouse_id, area_id, location_id, product_id, batch_no, inventory_status, total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date)
SELECT 1, 1, 1, p.id, 'BATCH-SHIP-GT3-202606', 'QUALIFIED', 40, 35, 0, 0, 0, '2026-04-01'
FROM md_product p WHERE p.product_code = 'GT3-10KD1R11004' LIMIT 1;
INSERT INTO wms_inventory (warehouse_id, area_id, location_id, product_id, batch_no, inventory_status, total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date)
SELECT 1, 1, 1, p.id, 'BATCH-SHIP-HXEDE-202606', 'QUALIFIED', 80, 80, 0, 0, 0, '2026-04-03'
FROM md_product p WHERE p.product_code = 'HXEDE081R10002' LIMIT 1;
INSERT INTO wms_inventory (warehouse_id, area_id, location_id, product_id, batch_no, inventory_status, total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date)
SELECT 1, 1, 2, p.id, 'BATCH-SHIP-FROZEN-202606', 'QUALIFIED', 5, 0, 0, 5, 0, '2026-03-20'
FROM md_product p WHERE p.product_code = 'GT3-10KD1R11004' LIMIT 1;

INSERT INTO wms_serial_number (sn_code, product_id, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, inbound_order_no, created_at)
SELECT CONCAT('SN-SHIP-GT3-', LPAD(seq.n, 4, '0')), p.id, 1, 1, CONCAT('PLT-SHIP-', LPAD(CEIL(seq.n / 10), 3, '0')), CONCAT('BOX-SHIP-', LPAD(CEIL(seq.n / 5), 3, '0')), 'ON_SHELF', 'QUALIFIED', 0, 'IN-SHIP-DEMO', DATE_SUB(NOW(), INTERVAL seq.n DAY)
FROM (
  SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
  UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
) seq
JOIN md_product p ON p.product_code = 'GT3-10KD1R11004';
INSERT INTO wms_serial_number (sn_code, product_id, warehouse_id, location_id, pallet_code, box_code, status, quality_status, locked_flag, locked_order_no, inbound_order_no, created_at)
SELECT CONCAT('SN-SHIP-BAD-', LPAD(seq.n, 4, '0')), p.id, 1, 2, 'PLT-SHIP-FROZEN', 'BOX-SHIP-FROZEN', 'ON_SHELF', IF(seq.n <= 3, 'UNQUALIFIED', 'QUALIFIED'), IF(seq.n = 5, 1, 0), IF(seq.n = 5, 'OTHER-LOCK', NULL), 'IN-SHIP-BAD', NOW()
FROM (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) seq
JOIN md_product p ON p.product_code = 'GT3-10KD1R11004';

INSERT INTO wms_outbound_order (
  order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
  owner_code, owner_name, consignee_code, consignee_name, expected_ship_time, related_order_no, sales_order_no,
  target_owner_code, target_owner_name, required_delivery_time, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
  status, logistics_company, carrier_name, tracking_no, sap_post_status, sap_post_result, parent_order_no, split_flag, remark, created_at
) VALUES
('SO-OUT-202606110001', 'FUL-SO-202606110001', 'FULFILLMENT', 'SALES_OUTBOUND', 1, NULL, 1, '3060', '杭州利沃得', 'CUST-TESLA-001', 'Tesla Energy China', DATE_ADD(NOW(), INTERVAL 1 DAY), 'FUL-SO-202606110001', 'SO202606110001', NULL, NULL, DATE_ADD(NOW(), INTERVAL 2 DAY), 8, 0, 0, 0, 0, 'CREATED', NULL, NULL, NULL, 'NOT_POSTED', '', NULL, 0, '销售出库完整闭环演示起点', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('TR-OUT-202606110001', 'TR202606110001', 'WMS', 'WAREHOUSE_TRANSFER', 1, 2, NULL, '3060', '杭州利沃得', NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 'TR202606110001', NULL, '3060', '上海区域仓货主', DATE_ADD(NOW(), INTERVAL 2 DAY), 6, 0, 0, 0, 0, 'CREATED', NULL, NULL, NULL, 'NOT_POSTED', '', NULL, 0, '杭州总仓调拨至上海区域仓', DATE_SUB(NOW(), INTERVAL 25 MINUTE)),
('STO-OUT-202606110001', 'STO202606110001', 'SAP', 'STO_OUTBOUND', 1, 2, NULL, '3060', '杭州利沃得', NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 'STO202606110001', NULL, '3060', '上海区域仓货主', DATE_ADD(NOW(), INTERVAL 2 DAY), 4, 4, 2, 0, 0, 'PARTIAL_PICKED', NULL, NULL, NULL, 'NOT_POSTED', '', NULL, 0, 'STO 出库部分拣货演示', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
('SO-OUT-202606110002', 'FUL-SO-202606110002', 'FULFILLMENT', 'SALES_OUTBOUND', 1, NULL, 2, '3060', '杭州利沃得', 'CUST-BYD-002', '比亚迪储能事业部', DATE_SUB(NOW(), INTERVAL 1 DAY), 'FUL-SO-202606110002', 'SO202606110002', NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 5, 5, 5, 0, 2, 'PARTIAL_SHIPPED', 'SF', 'SF', 'SF202606110002', 'SUCCESS', 'SAP 出库扣减成功 4900009002', NULL, 0, '部分发运关单生成分单演示', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 3, '3060', 'PCS', 1, 0, 0, 0, 0, 'BATCH-SO-OUT-001-L10', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'GT3-10KD1R11004'
WHERE o.order_no = 'SO-OUT-202606110001';
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 20, p.id, 5, '3060', 'PCS', 0, 0, 0, 0, 0, 'BATCH-SO-OUT-001-L20', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'SO-OUT-202606110001';
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 2, '3060', 'PCS', 1, 0, 0, 0, 0, 'BATCH-TR-OUT-001-L10', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'GT3-10KD1R11004'
WHERE o.order_no = 'TR-OUT-202606110001';
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 20, p.id, 4, '3060', 'PCS', 0, 0, 0, 0, 0, 'BATCH-TR-OUT-001-L20', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'TR-OUT-202606110001';
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 4, '3060', 'PCS', 1, 4, 2, 0, 0, 'BATCH-STO-OUT-001-L10', 'PARTIAL_PICKED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'GT3-10KD1R11004'
WHERE o.order_no = 'STO-OUT-202606110001';
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 5, '3060', 'PCS', 1, 5, 5, 0, 2, 'BATCH-SO-OUT-002-L10', 'PARTIAL_SHIPPED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'GT3-10KD1R11004'
WHERE o.order_no = 'SO-OUT-202606110002';

INSERT INTO wms_inventory_allocation (
  allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id, warehouse_id, location_id,
  product_id, batch_no, sn_code, allocated_qty, allocation_mode, allocation_status, picker, picked_at, created_at
)
SELECT CONCAT('ALLOC-', o.order_no, '-', sn.sn_code), o.id, o.order_no, d.id, i.id, 1, 1, sn.product_id, i.batch_no, sn.sn_code, 1,
       'AUTO_FIFO', IF(sn.sn_code IN ('SN-SHIP-GT3-0001','SN-SHIP-GT3-0002','SN-SHIP-GT3-0006','SN-SHIP-GT3-0007','SN-SHIP-GT3-0008','SN-SHIP-GT3-0009','SN-SHIP-GT3-0010'), 'PICKED', 'ALLOCATED'),
       IF(sn.sn_code IN ('SN-SHIP-GT3-0001','SN-SHIP-GT3-0002','SN-SHIP-GT3-0006','SN-SHIP-GT3-0007','SN-SHIP-GT3-0008','SN-SHIP-GT3-0009','SN-SHIP-GT3-0010'), 'wh_admin', NULL),
       IF(sn.sn_code IN ('SN-SHIP-GT3-0001','SN-SHIP-GT3-0002','SN-SHIP-GT3-0006','SN-SHIP-GT3-0007','SN-SHIP-GT3-0008','SN-SHIP-GT3-0009','SN-SHIP-GT3-0010'), DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL),
       DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_serial_number sn
JOIN wms_inventory i ON i.product_id = sn.product_id AND i.warehouse_id = 1 AND i.location_id = 1 AND i.batch_no = 'BATCH-SHIP-GT3-202606'
JOIN wms_outbound_order o ON (
  (o.order_no = 'STO-OUT-202606110001' AND sn.sn_code IN ('SN-SHIP-GT3-0001','SN-SHIP-GT3-0002','SN-SHIP-GT3-0003','SN-SHIP-GT3-0004'))
  OR (o.order_no = 'SO-OUT-202606110002' AND sn.sn_code IN ('SN-SHIP-GT3-0006','SN-SHIP-GT3-0007','SN-SHIP-GT3-0008','SN-SHIP-GT3-0009','SN-SHIP-GT3-0010'))
)
JOIN wms_outbound_order_detail d ON d.order_id = o.id AND d.product_id = sn.product_id;

UPDATE wms_serial_number sn
JOIN wms_inventory_allocation a ON a.sn_code = sn.sn_code
SET sn.status = IF(a.allocation_status = 'PICKED', 'PICKED', 'ALLOCATED'),
    sn.locked_flag = 1,
    sn.locked_order_no = a.outbound_order_no,
    sn.outbound_order_no = a.outbound_order_no
WHERE a.outbound_order_no IN ('STO-OUT-202606110001', 'SO-OUT-202606110002');

INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK-STO-OUT-202606110001', o.id, o.order_no, 1, 1, d.product_id, 4, 2, 'PICKING', 'wh_admin', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_outbound_order o JOIN wms_outbound_order_detail d ON d.order_id = o.id
WHERE o.order_no = 'STO-OUT-202606110001';
INSERT INTO wms_picking_task (task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker, created_at)
SELECT 'PICK-SO-OUT-202606110002', o.id, o.order_no, 1, 1, d.product_id, 5, 5, 'PICKED', 'wh_admin', DATE_SUB(NOW(), INTERVAL 6 HOUR)
FROM wms_outbound_order o JOIN wms_outbound_order_detail d ON d.order_id = o.id
WHERE o.order_no = 'SO-OUT-202606110002';

INSERT INTO wms_picking_record (task_id, task_no, outbound_order_id, outbound_order_no, sn_code, location_id, picker, result, created_at)
SELECT t.id, t.task_no, t.outbound_order_id, t.outbound_order_no, a.sn_code, 1, 'wh_admin', 'SUCCESS', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_picking_task t
JOIN wms_inventory_allocation a ON a.outbound_order_id = t.outbound_order_id
WHERE a.allocation_status = 'PICKED' AND t.outbound_order_no IN ('STO-OUT-202606110001','SO-OUT-202606110002');

INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, shipment_status, sap_post_status, sap_material_doc_no, sap_post_result, remark, created_at)
SELECT 'SHP-SO-OUT-202606110002-01', id, order_no, 'SF', 'SF202606110002', 2, 'logistics', DATE_SUB(NOW(), INTERVAL 1 HOUR), 'SHIPPED', 'SUCCESS', '4900009002', 'SAP 出库扣减成功 4900009002', '部分发运批次', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order WHERE order_no = 'SO-OUT-202606110002';

INSERT INTO wms_interface_log (interface_name, source_system, target_system, business_doc_no, http_method, request_url, request_body, response_body, status, retry_count, error_message, created_at) VALUES
('FULFILLMENT_ORDER_PUSH', 'FULFILLMENT', 'WMS', 'SO-OUT-202606110001', 'POST', '/api/mock/fulfillment/outbound-orders', JSON_OBJECT('sourceOrderNo', 'FUL-SO-202606110001'), JSON_OBJECT('shipmentOrderNo', 'SO-OUT-202606110001'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('SAP_STO_PUSH', 'SAP', 'WMS', 'STO-OUT-202606110001', 'POST', '/api/mock/sap/sto-orders', JSON_OBJECT('sourceOrderNo', 'STO202606110001'), JSON_OBJECT('shipmentOrderNo', 'STO-OUT-202606110001'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
('SAP_OUTBOUND_POSTING', 'WMS', 'SAP', 'SO-OUT-202606110002', 'POST', '/api/mock/sap/material-documents', JSON_OBJECT('shipmentNo', 'SHP-SO-OUT-202606110002-01'), JSON_OBJECT('sapMaterialDocNo', '4900009002'), 'SUCCESS', 0, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR));

INSERT INTO wms_outbound_status_history (outbound_order_id, outbound_order_no, from_status, to_status, action, operator, message, created_at)
SELECT id, order_no, NULL, status, 'SEED_STATUS', 'system', '婕旂ず鏁版嵁鍒濆鍖?, created_at
FROM wms_outbound_order;
