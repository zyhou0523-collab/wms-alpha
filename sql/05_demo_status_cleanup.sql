USE wms_alpha;

-- Demo status cleanup for release/wms-pc-v2.2.
-- Safe to run repeatedly: it updates legacy order statuses in place and writes
-- one cleanup operation log per affected document/status migration.

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at)
SELECT 'OUTBOUND', o.order_no, 'DEMO_STATUS_CLEANUP', 'system', 'SUCCESS',
       CONCAT('Legacy outbound status migrated: ', o.status),
       NOW()
FROM wms_outbound_order o
WHERE o.status IN ('CALLBACK_SUCCESS', 'CALLBACK_FAILED', 'ALLOCATION_EXCEPTION', 'PENDING_ALLOC', 'PICKING', 'REVIEWING', 'REVIEWED')
  AND NOT EXISTS (
    SELECT 1 FROM wms_operation_log l
    WHERE l.module = 'OUTBOUND'
      AND l.business_doc_no = o.order_no
      AND l.action = 'DEMO_STATUS_CLEANUP'
  );

UPDATE wms_outbound_order
SET sap_post_status = 'SUCCESS',
    sap_post_result = COALESCE(NULLIF(sap_post_result, ''), 'Legacy callback status migrated to sap_post_status=SUCCESS'),
    status = CASE
      WHEN planned_qty > 0 AND shipped_qty >= planned_qty THEN 'CLOSED'
      WHEN shipped_qty > 0 THEN 'PARTIAL_SHIPPED'
      WHEN planned_qty > 0 AND picked_qty >= planned_qty THEN 'PICKED'
      WHEN picked_qty > 0 OR review_qty > 0 THEN 'PARTIAL_PICKED'
      WHEN planned_qty > 0 AND allocated_qty >= planned_qty THEN 'ALLOCATED'
      WHEN allocated_qty > 0 THEN 'PARTIAL_ALLOCATED'
      ELSE 'CREATED'
    END
WHERE status = 'CALLBACK_SUCCESS';

UPDATE wms_outbound_order
SET sap_post_status = 'FAILED',
    sap_post_result = COALESCE(NULLIF(sap_post_result, ''), 'Legacy callback status migrated to sap_post_status=FAILED'),
    status = CASE
      WHEN planned_qty > 0 AND shipped_qty >= planned_qty THEN 'CLOSED'
      WHEN shipped_qty > 0 THEN 'PARTIAL_SHIPPED'
      WHEN planned_qty > 0 AND picked_qty >= planned_qty THEN 'PICKED'
      WHEN picked_qty > 0 OR review_qty > 0 THEN 'PARTIAL_PICKED'
      WHEN planned_qty > 0 AND allocated_qty >= planned_qty THEN 'ALLOCATED'
      WHEN allocated_qty > 0 THEN 'PARTIAL_ALLOCATED'
      ELSE 'CREATED'
    END
WHERE status = 'CALLBACK_FAILED';

UPDATE wms_outbound_order
SET sap_post_status = COALESCE(NULLIF(sap_post_status, ''), 'NOT_POSTED'),
    status = CASE
      WHEN shipped_qty > 0 AND planned_qty > 0 AND shipped_qty >= planned_qty THEN 'SHIPPED'
      WHEN shipped_qty > 0 THEN 'PARTIAL_SHIPPED'
      WHEN picked_qty > 0 AND planned_qty > 0 AND picked_qty >= planned_qty THEN 'PICKED'
      WHEN picked_qty > 0 OR review_qty > 0 THEN 'PARTIAL_PICKED'
      WHEN allocated_qty > 0 AND planned_qty > 0 AND allocated_qty >= planned_qty THEN 'ALLOCATED'
      WHEN allocated_qty > 0 THEN 'PARTIAL_ALLOCATED'
      ELSE 'CREATED'
    END
WHERE status IN ('ALLOCATION_EXCEPTION', 'PENDING_ALLOC', 'PICKING', 'REVIEWING', 'REVIEWED');

UPDATE wms_outbound_order
SET sap_post_status = 'SUCCESS'
WHERE sap_post_status = 'POSTED';

UPDATE wms_outbound_order
SET sap_post_status = 'NOT_POSTED'
WHERE sap_post_status IS NULL OR sap_post_status = '';

UPDATE wms_outbound_order_detail
SET status = CASE
  WHEN shipped_qty > 0 AND planned_qty > 0 AND shipped_qty >= planned_qty THEN 'SHIPPED'
  WHEN shipped_qty > 0 THEN 'PARTIAL_SHIPPED'
  WHEN picked_qty > 0 AND planned_qty > 0 AND picked_qty >= planned_qty THEN 'PICKED'
  WHEN picked_qty > 0 OR review_qty > 0 THEN 'PARTIAL_PICKED'
  WHEN allocated_qty > 0 AND planned_qty > 0 AND allocated_qty >= planned_qty THEN 'ALLOCATED'
  WHEN allocated_qty > 0 THEN 'PARTIAL_ALLOCATED'
  ELSE 'CREATED'
END
WHERE status IN ('CALLBACK_SUCCESS', 'CALLBACK_FAILED', 'ALLOCATION_EXCEPTION', 'PENDING_ALLOC', 'PICKING', 'REVIEWING', 'REVIEWED');

INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message, created_at)
SELECT 'INBOUND', o.order_no, 'DEMO_STATUS_CLEANUP', 'system', 'SUCCESS',
       CONCAT('Legacy inbound status migrated: ', o.status),
       NOW()
FROM wms_inbound_order o
WHERE (o.status IN ('SAP_FAILED', 'RECEIVING')
   OR (o.status = 'BOUND' AND o.received_qty > 0))
  AND NOT EXISTS (
    SELECT 1 FROM wms_operation_log l
    WHERE l.module = 'INBOUND'
      AND l.business_doc_no = o.order_no
      AND l.action = 'DEMO_STATUS_CLEANUP'
  );

UPDATE wms_inbound_order
SET sap_post_status = 'FAILED',
    sap_post_result = COALESCE(NULLIF(sap_post_result, ''), 'Legacy SAP_FAILED status migrated to sap_post_status=FAILED'),
    status = CASE
      WHEN planned_qty > 0 AND received_qty >= planned_qty THEN 'RECEIVED'
      WHEN received_qty > 0 THEN 'PARTIAL_RECEIVED'
      ELSE 'CREATED'
    END
WHERE status = 'SAP_FAILED';

UPDATE wms_inbound_order o
SET o.sap_post_status = COALESCE(NULLIF(o.sap_post_status, ''), 'NOT_POSTED'),
    o.status = CASE
      WHEN EXISTS (
        SELECT 1 FROM wms_inbound_order_detail d
        WHERE d.order_id = o.id
          AND d.shelved_qty > 0
      )
      AND NOT EXISTS (
        SELECT 1 FROM wms_inbound_order_detail d
        WHERE d.order_id = o.id
          AND d.shelved_qty < d.planned_qty
      ) THEN 'ON_SHELF'
      WHEN o.planned_qty > 0 AND o.received_qty >= o.planned_qty THEN 'RECEIVED'
      WHEN o.received_qty > 0 THEN 'PARTIAL_RECEIVED'
      ELSE 'CREATED'
    END
WHERE o.status = 'RECEIVING'
   OR (o.status = 'BOUND' AND o.received_qty > 0);

UPDATE wms_inbound_order
SET sap_post_status = 'SUCCESS'
WHERE sap_post_status = 'POSTED';

UPDATE wms_inbound_order
SET sap_post_status = 'NOT_POSTED'
WHERE sap_post_status IS NULL OR sap_post_status = '';

UPDATE wms_inbound_order_detail
SET status = CASE
  WHEN shelved_qty > 0 AND planned_qty > 0 AND shelved_qty >= planned_qty THEN 'ON_SHELF'
  WHEN received_qty > 0 AND planned_qty > 0 AND received_qty >= planned_qty THEN 'RECEIVED'
  WHEN received_qty > 0 THEN 'PARTIAL_RECEIVED'
  ELSE 'CREATED'
END
WHERE status IN ('SAP_FAILED', 'RECEIVING', 'BOUND');

-- Verification queries:
-- SELECT status, sap_post_status, COUNT(*) FROM wms_outbound_order GROUP BY status, sap_post_status;
-- SELECT status, sap_post_status, COUNT(*) FROM wms_inbound_order GROUP BY status, sap_post_status;
