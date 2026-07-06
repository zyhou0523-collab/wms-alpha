-- WMS PC V2.3 outbound shipping order close-flow demo data.
-- Idempotent: each block is guarded by NOT EXISTS for repeatable execution.

INSERT INTO wms_inventory (
  warehouse_id, area_id, location_id, product_id, owner_code, owner_name,
  batch_no, pallet_code, box_code, inventory_status,
  total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date, vmi_flag
)
SELECT w.id, a.id, l.id, p.id, '3060', '杭州利沃得',
       'BATCH-OUT-CLOSE-HXEDE-202607', 'PLT-OUT-CLOSE-HXEDE', 'BOX-OUT-CLOSE-HXEDE', 'QUALIFIED',
       200, 190, 0, 0, 0, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 0
FROM md_product p
JOIN wms_warehouse w ON w.warehouse_code IN ('HZ', 'WH-HZ-CENTRAL')
JOIN wms_area a ON a.warehouse_id = w.id
JOIN wms_location l ON l.warehouse_id = w.id
WHERE p.product_code = 'HXEDE081R10002'
  AND NOT EXISTS (
    SELECT 1 FROM wms_inventory i
    WHERE i.batch_no = 'BATCH-OUT-CLOSE-HXEDE-202607'
      AND i.product_id = p.id
      AND i.warehouse_id = w.id
  )
LIMIT 1;

INSERT INTO wms_inventory (
  warehouse_id, area_id, location_id, product_id, owner_code, owner_name,
  batch_no, pallet_code, box_code, inventory_status,
  total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date, vmi_flag
)
SELECT w.id, a.id, l.id, p.id, '3060', '杭州利沃得',
       'BATCH-OUT-CLOSE-LHEC-202607', 'PLT-OUT-CLOSE-LHEC', 'BOX-OUT-CLOSE-LHEC', 'QUALIFIED',
       200, 190, 0, 0, 0, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 0
FROM md_product p
JOIN wms_warehouse w ON w.warehouse_code IN ('HZ', 'WH-HZ-CENTRAL')
JOIN wms_area a ON a.warehouse_id = w.id
JOIN wms_location l ON l.warehouse_id = w.id
WHERE p.product_code = 'LHECCHR11002'
  AND NOT EXISTS (
    SELECT 1 FROM wms_inventory i
    WHERE i.batch_no = 'BATCH-OUT-CLOSE-LHEC-202607'
      AND i.product_id = p.id
      AND i.warehouse_id = w.id
  )
LIMIT 1;

INSERT INTO wms_outbound_order (
  order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
  owner_code, owner_name, consignee_code, consignee_name, expected_ship_time, related_order_no, sales_order_no,
  target_owner_code, target_owner_name, required_delivery_time, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
  status, logistics_company, carrier_name, tracking_no, sap_post_status, sap_post_result, parent_order_no, split_flag, remark, created_at
)
SELECT 'SO-OUT-DEMO-FULL-SHIP-CLOSE-001', 'SO-DEMO-FULL-SHIP-CLOSE-001', 'FULFILLMENT', 'SALES_OUTBOUND',
       w.id, NULL, c.id, '3060', '杭州利沃得', c.customer_code, c.customer_name,
       DATE_SUB(NOW(), INTERVAL 2 HOUR), 'SO-DEMO-FULL-SHIP-CLOSE-001', 'SO-DEMO-FULL-SHIP-CLOSE-001',
       NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 5, 5, 5, 5, 5,
       'SHIPPED', 'SF', 'SF', 'SO-OUT-DEMO-FULL-SHIP-CLOSE-001-TRACK', 'NOT_POSTED', '', NULL, 0,
       '完全发运关闭演示：关闭时不生成分单', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM wms_warehouse w
LEFT JOIN md_customer c ON c.customer_code = 'CUST-TESLA-001'
WHERE w.warehouse_code IN ('HZ', 'WH-HZ-CENTRAL')
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order WHERE order_no = 'SO-OUT-DEMO-FULL-SHIP-CLOSE-001')
LIMIT 1;

INSERT INTO wms_outbound_order (
  order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
  owner_code, owner_name, consignee_code, consignee_name, expected_ship_time, related_order_no, sales_order_no,
  target_owner_code, target_owner_name, required_delivery_time, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
  status, logistics_company, carrier_name, tracking_no, sap_post_status, sap_post_result, parent_order_no, split_flag, remark, created_at
)
SELECT 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-DEMO-PARTIAL-SHIP-CLOSE-001', 'FULFILLMENT', 'SALES_OUTBOUND',
       w.id, NULL, c.id, '3060', '杭州利沃得', c.customer_code, c.customer_name,
       DATE_SUB(NOW(), INTERVAL 1 HOUR), 'SO-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-DEMO-PARTIAL-SHIP-CLOSE-001',
       NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 7, 2, 2, 2, 2,
       'PARTIAL_SHIPPED', 'SF', 'SF', 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001-TRACK', 'NOT_POSTED', '', NULL, 0,
       '部分发运关闭演示：选择生成剩余分单', DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_warehouse w
LEFT JOIN md_customer c ON c.customer_code = 'CUST-TESLA-001'
WHERE w.warehouse_code IN ('HZ', 'WH-HZ-CENTRAL')
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order WHERE order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001')
LIMIT 1;

INSERT INTO wms_outbound_order (
  order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
  owner_code, owner_name, consignee_code, consignee_name, expected_ship_time, related_order_no, sales_order_no,
  target_owner_code, target_owner_name, required_delivery_time, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
  status, logistics_company, carrier_name, tracking_no, sap_post_status, sap_post_result, parent_order_no, split_flag, remark, created_at
)
SELECT 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001', 'SO-DEMO-PARTIAL-SHIP-NOSPLIT-001', 'FULFILLMENT', 'SALES_OUTBOUND',
       w.id, NULL, c.id, '3060', '杭州利沃得', c.customer_code, c.customer_name,
       DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'SO-DEMO-PARTIAL-SHIP-NOSPLIT-001', 'SO-DEMO-PARTIAL-SHIP-NOSPLIT-001',
       NULL, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY), 7, 2, 2, 2, 2,
       'PARTIAL_SHIPPED', 'SF', 'SF', 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001-TRACK', 'NOT_POSTED', '', NULL, 0,
       '部分发运关闭演示：选择仅关闭原单', DATE_SUB(NOW(), INTERVAL 30 MINUTE)
FROM wms_warehouse w
LEFT JOIN md_customer c ON c.customer_code = 'CUST-TESLA-001'
WHERE w.warehouse_code IN ('HZ', 'WH-HZ-CENTRAL')
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order WHERE order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001')
LIMIT 1;

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 3, '3060', COALESCE(p.unit, 'PCS'), 0, 3, 3, 3, 3, 'BATCH-OUT-CLOSE-HXEDE-202607', 'SHIPPED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'SO-OUT-DEMO-FULL-SHIP-CLOSE-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 10)
LIMIT 1;
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 20, p.id, 2, '3060', COALESCE(p.unit, 'PCS'), 0, 2, 2, 2, 2, 'BATCH-OUT-CLOSE-LHEC-202607', 'SHIPPED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'LHECCHR11002'
WHERE o.order_no = 'SO-OUT-DEMO-FULL-SHIP-CLOSE-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 20)
LIMIT 1;

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 4, '3060', COALESCE(p.unit, 'PCS'), 0, 2, 2, 2, 2, 'BATCH-OUT-CLOSE-HXEDE-202607', 'PARTIAL_SHIPPED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 10)
LIMIT 1;
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 20, p.id, 3, '3060', COALESCE(p.unit, 'PCS'), 0, 0, 0, 0, 0, 'BATCH-OUT-CLOSE-LHEC-202607', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'LHECCHR11002'
WHERE o.order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 20)
LIMIT 1;

INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 10, p.id, 5, '3060', COALESCE(p.unit, 'PCS'), 0, 2, 2, 2, 2, 'BATCH-OUT-CLOSE-HXEDE-202607', 'PARTIAL_SHIPPED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'HXEDE081R10002'
WHERE o.order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 10)
LIMIT 1;
INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, sap_plant, unit, sn_required, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
SELECT o.id, 20, p.id, 2, '3060', COALESCE(p.unit, 'PCS'), 0, 0, 0, 0, 0, 'BATCH-OUT-CLOSE-LHEC-202607', 'CREATED'
FROM wms_outbound_order o JOIN md_product p ON p.product_code = 'LHECCHR11002'
WHERE o.order_no = 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001'
  AND NOT EXISTS (SELECT 1 FROM wms_outbound_order_detail d WHERE d.order_id = o.id AND d.line_no = 20)
LIMIT 1;

INSERT INTO wms_inventory_allocation (
  allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id, warehouse_id, location_id,
  product_id, batch_no, sn_code, allocated_qty, allocation_mode, allocation_status, picker, picked_at, reviewer, reviewed_at, created_at
)
SELECT CONCAT('ALLOC-', o.order_no, '-', d.line_no, '-SHIP'), o.id, o.order_no, d.id, i.id, i.warehouse_id, i.location_id,
       d.product_id, d.batch_no, NULL, d.shipped_qty, 'AUTO_FIFO', 'SHIPPED', 'wh_admin', DATE_SUB(NOW(), INTERVAL 1 HOUR),
       'logistics', DATE_SUB(NOW(), INTERVAL 50 MINUTE), DATE_SUB(NOW(), INTERVAL 1 HOUR)
FROM wms_outbound_order o
JOIN wms_outbound_order_detail d ON d.order_id = o.id
JOIN wms_inventory i ON i.product_id = d.product_id AND i.batch_no = d.batch_no AND i.warehouse_id = o.warehouse_id
WHERE o.order_no IN ('SO-OUT-DEMO-FULL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001')
  AND d.shipped_qty > 0
  AND NOT EXISTS (
    SELECT 1 FROM wms_inventory_allocation a
    WHERE a.allocation_no = CONCAT('ALLOC-', o.order_no, '-', d.line_no, '-SHIP')
  );

INSERT INTO wms_shipment_record (shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, shipment_status, sap_post_status, sap_material_doc_no, sap_post_result, remark, created_at)
SELECT CONCAT('SHP-', o.order_no, '-01'), o.id, o.order_no, 'SF', o.tracking_no, o.shipped_qty, 'logistics',
       DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'SHIPPED', 'NOT_POSTED', '', '', '发运订单关闭流程演示发货记录', DATE_SUB(NOW(), INTERVAL 30 MINUTE)
FROM wms_outbound_order o
WHERE o.order_no IN ('SO-OUT-DEMO-FULL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001')
  AND o.shipped_qty > 0
  AND NOT EXISTS (
    SELECT 1 FROM wms_shipment_record s WHERE s.shipment_no = CONCAT('SHP-', o.order_no, '-01')
  );

INSERT INTO outbound_shipment_line (shipment_id, outbound_order_line_id, line_no, product_id, product_code, ship_qty, sap_post_qty, sap_post_status)
SELECT s.id, d.id, d.line_no, d.product_id, p.product_code, d.shipped_qty, 0, 'NOT_POSTED'
FROM wms_shipment_record s
JOIN wms_outbound_order o ON o.id = s.outbound_order_id
JOIN wms_outbound_order_detail d ON d.order_id = o.id
JOIN md_product p ON p.id = d.product_id
WHERE o.order_no IN ('SO-OUT-DEMO-FULL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001')
  AND d.shipped_qty > 0
  AND NOT EXISTS (
    SELECT 1 FROM outbound_shipment_line sl
    WHERE sl.shipment_id = s.id AND sl.outbound_order_line_id = d.id
  );

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at)
SELECT 'OUTBOUND', o.order_no, 'SEED_OUTBOUND_CLOSE_DEMO', 'system', 'SUCCESS', '初始化发运订单关闭流程演示数据', o.created_at
FROM wms_outbound_order o
WHERE o.order_no IN ('SO-OUT-DEMO-FULL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-CLOSE-001', 'SO-OUT-DEMO-PARTIAL-SHIP-NOSPLIT-001')
  AND NOT EXISTS (
    SELECT 1 FROM wms_operation_log l
    WHERE l.module = 'OUTBOUND'
      AND l.business_doc_no = o.order_no
      AND l.action = 'SEED_OUTBOUND_CLOSE_DEMO'
  );
