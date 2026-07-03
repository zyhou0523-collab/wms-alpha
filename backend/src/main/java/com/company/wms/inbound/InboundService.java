package com.company.wms.inbound;

import com.company.wms.common.CsvExport;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import com.company.wms.inbound.dto.BindPackageRequest;
import com.company.wms.inbound.dto.CreateProductionInboundRequest;
import com.company.wms.inbound.dto.PutawayRequest;
import com.company.wms.inbound.dto.ReceiveSnRequest;
import com.company.wms.inbound.dto.SapPostRequest;
import com.company.wms.inbound.dto.SnCollectionRequest;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class InboundService {
  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  public InboundService(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
  }

  public PageResult<Map<String, Object>> productionOrders(
      String orderNo,
      String sourceOrderNo,
      String mesWorkOrderNo,
      String warehouseCode,
      String status,
      int pageNum,
      int pageSize
  ) {
    Map<String, Object> params = params(
        "orderNo", repo.like(orderNo),
        "sourceOrderNo", repo.like(sourceOrderNo),
        "mesWorkOrderNo", repo.like(mesWorkOrderNo),
        "warehouseCode", repo.like(warehouseCode),
        "status", repo.like(status)
    );
    String from = """
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN (
          SELECT order_id,
                 COUNT(*) AS line_count,
                 SUM(planned_qty) AS total_planned_qty,
                 SUM(received_qty) AS total_received_qty
          FROM wms_inbound_order_detail
          GROUP BY order_id
        ) agg ON agg.order_id = o.id
        WHERE o.inbound_type = 'PRODUCTION'
          AND (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:sourceOrderNo IS NULL OR o.source_order_no LIKE :sourceOrderNo)
          AND (:mesWorkOrderNo IS NULL OR o.mes_work_order_no LIKE :mesWorkOrderNo)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:status IS NULL OR o.status LIKE :status)
        """;
    return repo.page(
        """
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_planned_qty, o.planned_qty) AS planned_qty,
               COALESCE(agg.total_received_qty, o.received_qty) AS received_qty
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    );
  }

  public Map<String, Object> detail(long id) {
    Map<String, Object> order = repo.one("""
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               s.supplier_code, s.supplier_name, c.customer_code, c.customer_name,
               COALESCE(o.owner_code, s.supplier_code, c.customer_code, w.owner_code, 'OWN') AS owner_code,
               COALESCE(o.owner_name, s.supplier_name, c.customer_name, w.warehouse_name) AS owner_name,
               COALESCE(o.mes_work_order_no, o.source_order_no) AS related_order_no,
               COALESCE(o.sap_post_status, 'NOT_POSTED') AS sap_post_status,
               COALESCE(o.sap_post_result, '') AS sap_post_result,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_planned_qty, o.planned_qty) AS planned_qty,
               COALESCE(agg.total_received_qty, o.received_qty) AS received_qty,
               COALESCE(agg.total_shelved_qty, 0) AS shelved_qty,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_no = o.order_no
                   AND sn.status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
               ) AS collected_qty,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_no = o.order_no
                   AND sn.status = 'COLLECTED'
               ) AS pending_receive_qty,
               'system' AS created_by,
               'system' AS updated_by
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN md_supplier s ON s.id = o.supplier_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        LEFT JOIN (
          SELECT order_id,
                 COUNT(*) AS line_count,
                 SUM(planned_qty) AS total_planned_qty,
                 SUM(received_qty) AS total_received_qty,
                 SUM(shelved_qty) AS total_shelved_qty
          FROM wms_inbound_order_detail
          GROUP BY order_id
        ) agg ON agg.order_id = o.id
        WHERE o.id = :id
        """, params("id", id));
    if (order == null) {
      throw new IllegalArgumentException("入库单不存在");
    }
    String orderNo = String.valueOf(order.get("order_no"));
    Map<String, Object> data = new HashMap<>();
    data.put("order", order);
    data.put("details", repo.query("""
        SELECT d.*, p.product_code, p.product_name, p.unit,
               COALESCE(d.sn_required, p.sn_managed) AS sn_required,
               COALESCE(d.sap_plant, o.sap_plant, w.warehouse_code) AS sap_plant,
               d.sap_storage_location,
               d.status AS line_status,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_line_id = d.id
                   AND sn.inbound_order_no = o.order_no
                   AND sn.status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
               ) AS collected_sn_qty,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_line_id = d.id
                   AND sn.inbound_order_no = o.order_no
                   AND sn.status = 'COLLECTED'
               ) AS pending_receive_qty
        FROM wms_inbound_order_detail d
        JOIN wms_inbound_order o ON o.id = d.order_id
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id = :id
        ORDER BY d.line_no
        """, params("id", id)));
    data.put("serialNumbers", repo.query("""
        SELECT s.*, p.product_code, p.product_name, w.warehouse_code, l.location_code
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE s.inbound_order_no = :orderNo OR s.mes_work_order_no = :mesWorkOrderNo
        ORDER BY s.sn_code
        """, params("orderNo", orderNo, "mesWorkOrderNo", nullToEmpty(order.get("mes_work_order_no")))));
    data.put("bindings", repo.query("""
        SELECT *
        FROM wms_package_binding
        WHERE bind_order_no = :orderNo OR inbound_order_no = :orderNo
        ORDER BY id DESC
        """, params("orderNo", orderNo)));
    data.put("receiptRecords", repo.query("""
        SELECT r.id AS receipt_id, r.receipt_no, r.receipt_time, r.receipt_user, r.status,
               r.sap_post_status, r.sap_material_doc_no, r.sap_post_result,
               rl.line_no, rl.product_id, rl.product_code, rl.receive_qty,
               rl.sap_post_qty, rl.sap_post_status AS line_sap_post_status,
               rl.sap_material_doc_no AS line_sap_material_doc_no,
               rl.sap_post_result AS line_sap_post_result
        FROM wms_inbound_receipt r
        JOIN wms_inbound_receipt_line rl ON rl.receipt_id = r.id
        WHERE r.inbound_order_id = :id
        ORDER BY r.id DESC, rl.line_no
        """, params("id", id)));
    data.put("operationLogs", repo.query("""
        SELECT *
        FROM wms_operation_log
        WHERE business_doc_no = :orderNo
        ORDER BY id DESC
        LIMIT 30
        """, params("orderNo", orderNo)));
    data.put("interfaceLogs", repo.query("""
        SELECT *
        FROM wms_interface_log
        WHERE business_doc_no = :orderNo OR business_doc_no = :sourceOrderNo OR business_doc_no = :mesWorkOrderNo
        ORDER BY id DESC
        LIMIT 30
        """, params(
        "orderNo", orderNo,
        "sourceOrderNo", nullToEmpty(order.get("source_order_no")),
        "mesWorkOrderNo", nullToEmpty(order.get("mes_work_order_no"))
    )));
    return data;
  }

  public Map<String, Object> orderSnCollectContext(long orderId) {
    Map<String, Object> order = repo.one("""
        SELECT o.id AS inbound_order_id,
               o.order_no AS inbound_order_no,
               o.inbound_type,
               o.source_system,
               o.source_order_no,
               o.mes_work_order_no,
               o.warehouse_id,
               w.warehouse_code,
               w.warehouse_name,
               o.status,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_planned_qty, o.planned_qty) AS planned_qty,
               COALESCE(agg.total_received_qty, o.received_qty) AS received_qty
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN (
          SELECT order_id,
                 COUNT(*) AS line_count,
                 SUM(planned_qty) AS total_planned_qty,
                 SUM(received_qty) AS total_received_qty
          FROM wms_inbound_order_detail
          GROUP BY order_id
        ) agg ON agg.order_id = o.id
        WHERE o.id = :orderId
        """, params("orderId", orderId));
    if (order == null) {
      throw new IllegalArgumentException("入库单不存在");
    }
    String orderNo = String.valueOf(order.get("inbound_order_no"));
    List<Map<String, Object>> lines = repo.query("""
        SELECT d.id AS lineId,
               d.line_no AS lineNo,
               d.product_id AS productId,
               p.product_code AS productCode,
               p.product_name AS productName,
               COALESCE(d.sn_required, p.sn_managed) AS snRequired,
               p.unit AS unit,
               COALESCE(d.sap_plant, o.sap_plant) AS sapPlant,
               d.sap_storage_location AS sapStorageLocation,
               d.planned_qty AS planQty,
               d.received_qty AS receivedQty,
               d.shelved_qty AS shelvedQty,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_line_id = d.id
                   AND sn.inbound_order_no = :orderNo
                   AND sn.status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
               ) AS alreadyCollectedSnQty,
               (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_line_id = d.id
                   AND sn.inbound_order_no = :orderNo
                   AND sn.status = 'COLLECTED'
               ) AS pendingReceiveQty,
               GREATEST(d.planned_qty - d.received_qty - (
                 SELECT COUNT(*)
                 FROM wms_serial_number sn
                 WHERE sn.inbound_order_line_id = d.id
                   AND sn.inbound_order_no = :orderNo
                   AND sn.status = 'COLLECTED'
               ), 0) AS remainingQty,
               d.status AS lineStatus,
               d.batch_no AS batchNo
        FROM wms_inbound_order_detail d
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id = :orderId
        ORDER BY d.line_no
        """, params("orderId", orderId, "orderNo", orderNo));

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("inboundOrderId", order.get("inbound_order_id"));
    data.put("inboundOrderNo", order.get("inbound_order_no"));
    data.put("inboundType", order.get("inbound_type"));
    data.put("sourceSystem", order.get("source_system"));
    data.put("sourceDocNo", order.get("source_order_no"));
    data.put("mesWorkOrderNo", order.get("mes_work_order_no"));
    data.put("warehouseId", order.get("warehouse_id"));
    data.put("warehouseCode", order.get("warehouse_code"));
    data.put("warehouseName", order.get("warehouse_name"));
    data.put("status", order.get("status"));
    data.put("lineCount", order.get("line_count"));
    data.put("plannedQty", order.get("planned_qty"));
    data.put("receivedQty", order.get("received_qty"));
    data.put("collectedQty", lines.stream().mapToInt(row -> intValue(row.get("alreadyCollectedSnQty"), 0)).sum());
    data.put("pendingReceiveQty", lines.stream().mapToInt(row -> intValue(row.get("pendingReceiveQty"), 0)).sum());
    data.put("lines", lines);
    return data;
  }

  public Map<String, Object> snCollectContext(long orderId, long lineId) {
    Map<String, Object> line = requireInboundLine(orderId, lineId);
    int plannedQty = intValue(line.get("planned_qty"), 0);
    int receivedQty = intValue(line.get("received_qty"), 0);
    int collectedQty = repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_line_id = :lineId
          AND inbound_order_no = :orderNo
          AND status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
        """, params("lineId", lineId, "orderNo", line.get("order_no"))).intValue();
    int pendingReceiveQty = repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_line_id = :lineId
          AND inbound_order_no = :orderNo
          AND status = 'COLLECTED'
        """, params("lineId", lineId, "orderNo", line.get("order_no"))).intValue();
    Map<String, Object> context = new LinkedHashMap<>();
    context.put("inboundOrderId", orderId);
    context.put("inboundOrderNo", line.get("order_no"));
    context.put("inboundType", line.get("inbound_type"));
    context.put("sourceSystem", line.get("source_system"));
    context.put("warehouseId", line.get("warehouse_id"));
    context.put("warehouseCode", line.get("warehouse_code"));
    context.put("warehouseName", line.get("warehouse_name"));
    context.put("lineId", line.get("line_id"));
    context.put("lineNo", line.get("line_no"));
    context.put("productId", line.get("product_id"));
    context.put("productCode", line.get("product_code"));
    context.put("productName", line.get("product_name"));
    context.put("snRequired", intValue(line.get("sn_required"), 0) == 1);
    context.put("unit", line.get("unit"));
    context.put("sapPlant", line.get("sap_plant"));
    context.put("sapStorageLocation", line.get("sap_storage_location"));
    context.put("planQty", plannedQty);
    context.put("receivedQty", receivedQty);
    context.put("collectedQty", collectedQty);
    context.put("pendingReceiveQty", pendingReceiveQty);
    context.put("remainingCollectQty", Math.max(plannedQty - receivedQty - pendingReceiveQty, 0));
    context.put("remainingQty", Math.max(plannedQty - receivedQty - pendingReceiveQty, 0));
    context.put("lineStatus", line.get("status"));
    context.put("batchNo", line.get("batch_no"));
    context.put("boxRequired", false);
    return context;
  }

  public List<Map<String, Object>> collectedSns(long orderId, long lineId) {
    requireInboundLine(orderId, lineId);
    return repo.query("""
        SELECT s.id,
               s.sn_code AS snCode,
               s.product_id AS productId,
               p.product_code AS productCode,
               p.product_name AS productName,
               d.id AS lineId,
               d.line_no AS lineNo,
               s.pallet_code AS palletCode,
               s.box_code AS boxCode,
               s.status AS snStatus,
               CASE
                 WHEN s.status = 'COLLECTED' THEN 'PENDING_RECEIVE'
                 WHEN s.status = 'RECEIVED' THEN 'RECEIVED'
                 WHEN s.status = 'ON_SHELF' THEN 'ON_SHELF'
                 WHEN s.status = 'CANCELED_COLLECT' THEN 'CANCELED'
                 ELSE s.status
               END AS receiveStatus,
               s.created_at AS collectedAt,
               (
                 SELECT MAX(r.receipt_time)
                 FROM wms_inbound_receipt_sn rs
                 JOIN wms_inbound_receipt r ON r.id = rs.receipt_id
                 WHERE rs.sn_code = s.sn_code
                   AND rs.inbound_order_line_id = s.inbound_order_line_id
               ) AS receivedAt,
               l.location_code AS locationCode
        FROM wms_serial_number s
        JOIN wms_inbound_order_detail d ON d.id = s.inbound_order_line_id
        JOIN wms_inbound_order o ON o.id = d.order_id
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE o.id = :orderId
          AND d.id = :lineId
          AND s.inbound_order_no = o.order_no
          AND s.status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF', 'CANCELED_COLLECT')
        ORDER BY s.created_at DESC, s.sn_code
        """, params("orderId", orderId, "lineId", lineId));
  }

  public Map<String, Object> validateSnCollection(long orderId, long lineId, SnCollectionRequest request) {
    Map<String, Object> line = requireInboundLine(orderId, lineId);
    String orderNo = String.valueOf(line.get("order_no"));
    if (intValue(line.get("sn_required"), 0) != 1) {
      failOperation(orderNo, "SN_COLLECTION_VALIDATE", request == null ? null : request.operator(), "当前产品不启用 SN 管理，无需采集 SN，请直接收货。");
    }
    long productId = ((Number) line.get("product_id")).longValue();
    int plannedQty = intValue(line.get("planned_qty"), 0);
    int receivedQty = intValue(line.get("received_qty"), 0);
    int pendingReceiveQty = repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_line_id = :lineId
          AND inbound_order_no = :orderNo
          AND status = 'COLLECTED'
        """, params("lineId", lineId, "orderNo", orderNo)).intValue();
    int remainingQty = Math.max(plannedQty - receivedQty - pendingReceiveQty, 0);
    List<String> serials = parseInputSerials(request == null ? null : request.serialNumbers());
    List<Map<String, Object>> items = new ArrayList<>();
    Set<String> seen = new LinkedHashSet<>();
    int acceptedQty = 0;
    boolean hasPallet = request != null && StringUtils.hasText(request.palletCode());
    boolean productMatched = request == null || request.productId() == null || request.productId().longValue() == productId;

    for (String sn : serials) {
      Map<String, Object> item = new LinkedHashMap<>();
      item.put("snCode", sn);
      item.put("productCode", line.get("product_code"));
      item.put("status", "PASS");
      item.put("message", "校验通过，可按当前产品行采集");

      if (!hasPallet) {
        failItem(item, "托盘码必填");
      } else if (!productMatched) {
        failItem(item, "弹窗产品与当前入库明细行不一致");
      } else if (!seen.add(sn)) {
        failItem(item, "本次录入中存在重复 SN");
      } else if (acceptedQty >= remainingQty) {
        failItem(item, "本次采集数量超过该产品行剩余可采集数量");
      } else {
        validateSingleSnForCollection(item, sn, line, productId, orderNo, lineId);
      }

      if ("PASS".equals(item.get("status"))) {
        acceptedQty++;
      }
      items.add(item);
    }

    int invalidQty = (int) items.stream().filter(item -> !"PASS".equals(item.get("status"))).count();
    Map<String, Object> result = new LinkedHashMap<>();
    result.putAll(snCollectContext(orderId, lineId));
    result.put("inputQty", serials.size());
    result.put("validQty", acceptedQty);
    result.put("invalidQty", invalidQty);
    result.put("valid", invalidQty == 0 && acceptedQty > 0 && acceptedQty <= remainingQty);
    result.put("items", items);
    result.put("message", buildSnValidationMessage(serials.size(), acceptedQty, invalidQty, remainingQty));
    return result;
  }

  @Transactional
  public Map<String, Object> confirmSnCollection(long orderId, long lineId, SnCollectionRequest request) {
    Map<String, Object> validation = validateSnCollection(orderId, lineId, request);
    if (!Boolean.TRUE.equals(validation.get("valid"))) {
      String message = String.valueOf(validation.get("message"));
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> items = (List<Map<String, Object>>) validation.get("items");
      for (Map<String, Object> item : items) {
        if (!"PASS".equals(item.get("status"))) {
          message = String.valueOf(item.get("message"));
          break;
        }
      }
      String orderNo = String.valueOf(validation.get("inboundOrderNo"));
      failOperation(orderNo, "SN_COLLECTION_CONFIRM", request == null ? null : request.operator(), message);
    }

    Map<String, Object> line = requireInboundLine(orderId, lineId);
    String orderNo = String.valueOf(line.get("order_no"));
    String palletCode = request.palletCode().trim();
    String boxCode = firstText(request.boxCode(), "");
    long productId = ((Number) line.get("product_id")).longValue();
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> items = (List<Map<String, Object>>) validation.get("items");
    List<String> serials = items.stream()
        .filter(item -> "PASS".equals(item.get("status")))
        .map(item -> String.valueOf(item.get("snCode")))
        .toList();

    for (String sn : serials) {
      Map<String, Object> existing = repo.one("SELECT id FROM wms_serial_number WHERE sn_code = :sn", params("sn", sn));
      if (existing == null) {
        jdbc.update("""
            INSERT INTO wms_serial_number (
              sn_code, product_id, owner_code, owner_name, warehouse_id, location_id, pallet_code, box_code, status,
              quality_status, locked_flag, inbound_order_no, inbound_order_line_id
            ) VALUES (
              :sn, :productId, :ownerCode, :ownerName, :warehouseId, NULL, :palletCode, :boxCode, 'COLLECTED',
              'QUALIFIED', 0, :orderNo, :lineId
            )
            """, params(
            "sn", sn,
            "productId", productId,
            "ownerCode", line.get("owner_code"),
            "ownerName", line.get("owner_name"),
            "warehouseId", line.get("warehouse_id"),
            "palletCode", palletCode,
            "boxCode", boxCode,
            "orderNo", orderNo,
            "lineId", lineId
        ));
      } else {
        jdbc.update("""
            UPDATE wms_serial_number
            SET product_id = :productId,
                owner_code = :ownerCode,
                owner_name = :ownerName,
                warehouse_id = :warehouseId,
                location_id = NULL,
                pallet_code = :palletCode,
                box_code = :boxCode,
                status = 'COLLECTED',
                quality_status = COALESCE(quality_status, 'QUALIFIED'),
                locked_flag = 0,
                locked_order_no = NULL,
                inbound_order_no = :orderNo,
                inbound_order_line_id = :lineId
            WHERE sn_code = :sn
            """, params(
            "sn", sn,
            "productId", productId,
            "ownerCode", line.get("owner_code"),
            "ownerName", line.get("owner_name"),
            "warehouseId", line.get("warehouse_id"),
            "palletCode", palletCode,
            "boxCode", boxCode,
            "orderNo", orderNo,
            "lineId", lineId
        ));
      }
      jdbc.update("""
          INSERT INTO wms_package_binding (
            pallet_code, box_code, sn_code, product_id, inbound_order_no,
            inbound_order_line_id, bind_order_no, bind_status, bind_time
          ) VALUES (
            :palletCode, :boxCode, :sn, :productId, :orderNo,
            :lineId, :orderNo, 'BOUND', NOW()
          )
          ON DUPLICATE KEY UPDATE
            pallet_code = VALUES(pallet_code),
            box_code = VALUES(box_code),
            product_id = VALUES(product_id),
            inbound_order_no = VALUES(inbound_order_no),
            inbound_order_line_id = VALUES(inbound_order_line_id),
            bind_order_no = VALUES(bind_order_no),
            bind_status = 'BOUND',
            bind_time = NOW()
          """, params(
          "palletCode", palletCode,
          "boxCode", boxCode,
          "sn", sn,
          "productId", productId,
          "orderNo", orderNo,
          "lineId", lineId
      ));
    }

    repo.operationLog("INBOUND", orderNo, "SN_COLLECT", operator(request.operator()), "SUCCESS",
        "按产品行采集 SN " + serials.size() + " 个，状态置为待收货，托盘 " + palletCode + (StringUtils.hasText(boxCode) ? "，箱 " + boxCode : ""));

    Map<String, Object> result = detail(orderId);
    result.put("collection", Map.of(
        "lineId", lineId,
        "palletCode", palletCode,
        "boxCode", boxCode,
        "collectedQty", serials.size()
    ));
    return result;
  }

  @Transactional
  public Map<String, Object> create(CreateProductionInboundRequest request) {
    Map<String, Object> warehouse = requireWarehouse(firstText(request.warehouseCode(), "WH-HZ-CENTRAL"));
    String orderNo = firstText(request.orderNo(), nextOrderNo());
    List<CreateProductionInboundRequest.Line> requestLines = request.lines() == null || request.lines().isEmpty()
        ? List.of(new CreateProductionInboundRequest.Line(1, null, request.productCode(), null, request.plannedQty(), null, null, null, null, "QUALIFIED"))
        : request.lines();
    List<Map<String, Object>> products = new ArrayList<>();
    int totalQty = 0;
    for (CreateProductionInboundRequest.Line line : requestLines) {
      Map<String, Object> product = line.productId() == null ? requireProduct(line.productCode(), request.ownerCode()) : requireProductById(line.productId());
      int qty = line.plannedQty() == null ? 1 : line.plannedQty();
      if (qty <= 0) {
        throw new IllegalArgumentException("计划数量必须大于 0");
      }
      products.add(product);
      totalQty += qty;
    }
    String inboundType = firstText(request.inboundType(), "PRODUCTION");
    String sourceSystem = firstText(request.sourceSystem(), "PRODUCTION".equals(inboundType) ? "SAP" : "MANUAL");
    String sourceOrderNo = firstText(request.sourceOrderNo(), firstText(request.sapWorkOrderNo(), orderNo));
    String mesWorkOrderNo = firstText(request.mesWorkOrderNo(), "MES-" + sourceOrderNo);
    String ownerCode = firstText(request.ownerCode(), "3060");
    String ownerName = firstText(request.ownerName(), "杭州利沃得");
    String sapPlant = firstText(request.sapPlant(), ownerCode);
    String shipFromCountry = firstText(request.shipFromCountry(), "");

    jdbc.update("""
        INSERT INTO wms_inbound_order (
          order_no, source_order_no, mes_work_order_no, inbound_type, source_system,
          warehouse_id, owner_code, owner_name, ship_from_country, sap_plant,
          planned_qty, received_qty, status, sap_post_status, sap_post_result,
          plan_arrival_date, remark
        ) VALUES (
          :orderNo, :sourceOrderNo, :mesWorkOrderNo, :inboundType, :sourceSystem,
          :warehouseId, :ownerCode, :ownerName, :shipFromCountry, :sapPlant,
          :qty, 0, 'CREATED', 'NOT_POSTED', '',
          :planArrivalDate, :remark
        )
        """, params(
        "orderNo", orderNo,
        "sourceOrderNo", sourceOrderNo,
        "mesWorkOrderNo", mesWorkOrderNo,
        "inboundType", inboundType,
        "sourceSystem", sourceSystem,
        "warehouseId", warehouse.get("id"),
        "ownerCode", ownerCode,
        "ownerName", ownerName,
        "shipFromCountry", shipFromCountry,
        "sapPlant", sapPlant,
        "qty", totalQty,
        "planArrivalDate", firstText(request.planArrivalDate(), null),
        "remark", firstText(request.remark(), "")
    ));
    long orderId = repo.number("SELECT id FROM wms_inbound_order WHERE order_no = :orderNo", params("orderNo", orderNo)).longValue();
    for (int i = 0; i < requestLines.size(); i++) {
      CreateProductionInboundRequest.Line line = requestLines.get(i);
      Map<String, Object> product = products.get(i);
      int lineNo = line.lineNo() == null ? (requestLines.size() == 1 ? 1 : (i + 1) * 10) : line.lineNo();
      int qty = line.plannedQty() == null ? 1 : line.plannedQty();
      jdbc.update("""
          INSERT INTO wms_inbound_order_detail (
            order_id, line_no, product_id, planned_qty, received_qty, shelved_qty,
            sap_plant, sap_storage_location, sn_required, owner_code,
            quality_status, batch_no, status
          ) VALUES (
            :orderId, :lineNo, :productId, :qty, 0, 0,
            :sapPlant, :sapStorageLocation, :snRequired, :ownerCode,
            :qualityStatus, :batchNo, 'CREATED'
          )
          """, params(
          "orderId", orderId,
          "lineNo", lineNo,
          "productId", product.get("id"),
          "qty", qty,
          "sapPlant", firstText(line.sapPlant(), sapPlant),
          "sapStorageLocation", firstText(line.sapStorageLocation(), ""),
          "snRequired", line.snRequired() == null ? product.get("sn_managed") : (line.snRequired() ? 1 : 0),
          "ownerCode", ownerCode,
          "qualityStatus", firstText(line.qualityStatus(), "QUALIFIED"),
          "batchNo", firstText(line.batchNo(), "BATCH-" + orderNo + "-" + lineNo)
      ));
    }
    repo.operationLog("INBOUND", orderNo, "CREATE_INBOUND_ORDER", "admin", "SUCCESS", "创建预期到货通知单，产品行 " + requestLines.size() + " 行");
    return detail(orderId);
  }

  @Transactional
  public Map<String, Object> update(long id, CreateProductionInboundRequest request) {
    Map<String, Object> order = requireOrder(id);
    validateInboundEditable(order, "admin");
    Map<String, Object> product = requireProduct(request.productCode());
    Map<String, Object> warehouse = requireWarehouse(request.warehouseCode());
    int qty = request.plannedQty() == null ? ((Number) order.get("planned_qty")).intValue() : request.plannedQty();
    jdbc.update("""
        UPDATE wms_inbound_order
        SET source_order_no = :sourceOrderNo,
            mes_work_order_no = :mesWorkOrderNo,
            warehouse_id = :warehouseId,
            planned_qty = :qty,
            remark = :remark
        WHERE id = :id
        """, params(
        "id", id,
        "sourceOrderNo", firstText(request.sapWorkOrderNo(), String.valueOf(order.get("source_order_no"))),
        "mesWorkOrderNo", firstText(request.mesWorkOrderNo(), String.valueOf(order.get("mes_work_order_no"))),
        "warehouseId", warehouse.get("id"),
        "qty", qty,
        "remark", firstText(request.remark(), "")
    ));
    jdbc.update("""
        UPDATE wms_inbound_order_detail
        SET product_id = :productId, planned_qty = :qty
        WHERE order_id = :id AND line_no = 1
        """, params("id", id, "productId", product.get("id"), "qty", qty));
    repo.operationLog("INBOUND", String.valueOf(order.get("order_no")), "EDIT_PRODUCTION_ORDER", "admin", "SUCCESS", "编辑生产入库单");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> receive(long id, ReceiveSnRequest request) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    if (request == null) {
      failOperation(orderNo, "RECEIVE_CONFIRM", null, "收货请求不能为空");
    }
    if (!StringUtils.hasText(request.locationCode())) {
      failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "请选择本次收货目标库位");
    }
    Map<String, Object> targetLocation = requireReceivingLocation(order, request.locationCode(), orderNo, request.operator());
    validateInboundReceivable(order, request.operator());
    List<ReceiveSnRequest.Line> requestLines = request.lines() == null ? List.of() : request.lines();
    if (requestLines.isEmpty() && request.serialNumbers() != null && !request.serialNumbers().isEmpty()) {
      Map<Long, List<String>> grouped = new LinkedHashMap<>();
      for (String sn : cleanSerials(request.serialNumbers())) {
        Map<String, Object> row = repo.one("""
            SELECT inbound_order_line_id
            FROM wms_serial_number
            WHERE sn_code = :sn AND inbound_order_no = :orderNo AND status = 'COLLECTED'
            """, params("sn", sn, "orderNo", orderNo));
        if (row == null || row.get("inbound_order_line_id") == null) {
          failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "SN 不属于当前单据待收货范围: " + sn);
        }
        long lineId = ((Number) row.get("inbound_order_line_id")).longValue();
        grouped.computeIfAbsent(lineId, key -> new ArrayList<>()).add(sn);
      }
      requestLines = grouped.entrySet().stream()
          .map(entry -> new ReceiveSnRequest.Line(entry.getKey(), null, null, entry.getValue()))
          .toList();
    }
    if (requestLines.isEmpty()) {
      failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "请至少选择一条待收货 SN");
    }

    String receiptNo = nextReceiptNo();
    jdbc.update("""
        INSERT INTO wms_inbound_receipt (
          receipt_no, inbound_order_id, inbound_order_no, receipt_time,
          receipt_user, status, sap_post_status, sap_post_result
        ) VALUES (
          :receiptNo, :orderId, :orderNo, NOW(),
          :receiptUser, 'RECEIVED', 'NOT_POSTED', ''
        )
        """, params("receiptNo", receiptNo, "orderId", id, "orderNo", orderNo, "receiptUser", operator(request.operator())));
    long receiptId = repo.number("SELECT id FROM wms_inbound_receipt WHERE receipt_no = :receiptNo", params("receiptNo", receiptNo)).longValue();

    int totalReceiveQty = 0;
    for (ReceiveSnRequest.Line receiveLine : requestLines) {
      if (receiveLine.lineId() == null) {
        failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "收货明细行不能为空");
      }
      Map<String, Object> line = requireInboundLine(id, receiveLine.lineId());
      long productId = ((Number) line.get("product_id")).longValue();
      if (receiveLine.productId() != null && receiveLine.productId().longValue() != productId) {
        failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "收货产品与入库明细行不一致");
      }
      List<String> serials = cleanSerials(receiveLine.receiveSnList());
      int plannedQty = intValue(line.get("planned_qty"), 0);
      int receivedQty = intValue(line.get("received_qty"), 0);
      boolean snRequired = intValue(line.get("sn_required"), intValue(line.get("sn_managed"), 0)) == 1;
      int thisReceiveQty = snRequired ? serials.size() : (receiveLine.receiveQty() == null ? 0 : receiveLine.receiveQty());
      if (snRequired && serials.isEmpty()) {
        failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "SN 管理产品必须先采集 SN 后再收货");
      }
      if (!snRequired && !serials.isEmpty()) {
        failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "非 SN 管理产品请填写本次收货数量，不需要扫描 SN");
      }
      if (!snRequired && thisReceiveQty <= 0) {
        continue;
      }
      if (snRequired) {
        int pendingQty = repo.number("""
          SELECT COUNT(*)
          FROM wms_serial_number
          WHERE inbound_order_line_id = :lineId
            AND inbound_order_no = :orderNo
            AND status = 'COLLECTED'
          """, params("lineId", receiveLine.lineId(), "orderNo", orderNo)).intValue();
        if (serials.size() > pendingQty) {
          failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "本次收货数量不能超过当前已采集待收货数量");
        }
      }
      if (receivedQty + thisReceiveQty > plannedQty) {
        failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(),
            "当前产品预期收货数量为" + plannedQty + "，历史已收货" + receivedQty
                + "，本次最多可收货" + Math.max(plannedQty - receivedQty, 0)
                + "，当前本次收货" + thisReceiveQty + "，已超过允许数量。");
      }
      for (String sn : serials) {
        Map<String, Object> row = repo.one("""
            SELECT *
            FROM wms_serial_number
            WHERE sn_code = :sn
              AND inbound_order_no = :orderNo
              AND inbound_order_line_id = :lineId
            """, params("sn", sn, "orderNo", orderNo, "lineId", receiveLine.lineId()));
        if (row == null) {
          failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "SN 不属于当前入库明细行: " + sn);
        }
        if (!"COLLECTED".equals(String.valueOf(row.get("status")))) {
          failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "仅允许收货已采集待收货 SN: " + sn);
        }
      }
      jdbc.update("""
          INSERT INTO wms_inbound_receipt_line (
            receipt_id, inbound_order_line_id, line_no, product_id, product_code,
            receive_qty, sap_post_qty, sap_post_status, sap_post_result
          ) VALUES (
            :receiptId, :lineId, :lineNo, :productId, :productCode,
            :receiveQty, 0, 'NOT_POSTED', ''
          )
          """, params(
          "receiptId", receiptId,
          "lineId", receiveLine.lineId(),
          "lineNo", line.get("line_no"),
          "productId", productId,
          "productCode", line.get("product_code"),
          "receiveQty", thisReceiveQty
      ));
      long receiptLineId = repo.number("""
          SELECT id
          FROM wms_inbound_receipt_line
          WHERE receipt_id = :receiptId AND inbound_order_line_id = :lineId
          ORDER BY id DESC
          LIMIT 1
          """, params("receiptId", receiptId, "lineId", receiveLine.lineId())).longValue();
      for (String sn : serials) {
        jdbc.update("""
            INSERT INTO wms_inbound_receipt_sn (
              receipt_id, receipt_line_id, sn_code, product_id, inbound_order_line_id,
              pallet_code, box_code
            )
            SELECT :receiptId, :receiptLineId, sn_code, product_id, inbound_order_line_id,
                   pallet_code, box_code
            FROM wms_serial_number
            WHERE sn_code = :sn
            """, params("receiptId", receiptId, "receiptLineId", receiptLineId, "sn", sn));
      }
      if (!serials.isEmpty()) {
        jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'RECEIVED',
              warehouse_id = :warehouseId,
              location_id = :locationId
          WHERE sn_code IN (:serials)
          """, params(
          "warehouseId", order.get("warehouse_id"),
          "locationId", targetLocation == null ? null : targetLocation.get("id"),
          "serials", serials
        ));
      }
      jdbc.update("""
          UPDATE wms_inbound_order_detail
          SET received_qty = received_qty + :qty,
              status = CASE
                WHEN received_qty + :qty >= planned_qty THEN 'RECEIVED'
                WHEN received_qty + :qty > 0 THEN 'PARTIAL_RECEIVED'
                ELSE 'CREATED'
              END
          WHERE id = :lineId AND order_id = :orderId
          """, params("qty", thisReceiveQty, "lineId", receiveLine.lineId(), "orderId", id));
      totalReceiveQty += thisReceiveQty;
    }
    if (totalReceiveQty == 0) {
      failOperation(orderNo, "RECEIVE_CONFIRM", request.operator(), "本次收货数量不能为 0");
    }
    refreshInboundHeaderStatus(id);
    repo.operationLog("INBOUND", orderNo, "RECEIVE_CONFIRM", operator(request.operator()), "SUCCESS",
        "收货确认 " + totalReceiveQty + " 件产品，收货批次 " + receiptNo);
    Map<String, Object> result = detail(id);
    result.put("receiptNo", receiptNo);
    return result;
  }

  @Transactional
  public Map<String, Object> cancel(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    validateInboundCancelable(order, cell(body, "operator"));
    int snCount = repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_no = :orderNo
          AND status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
        """, params("orderNo", orderNo)).intValue();
    int receiptCount = repo.number("""
        SELECT COUNT(*)
        FROM wms_inbound_receipt
        WHERE inbound_order_id = :id
          AND status <> 'CANCELED'
        """, params("id", id)).intValue();
    if (snCount > 0 || receiptCount > 0 || intValue(order.get("received_qty"), 0) > 0) {
      failOperation(orderNo, "CANCEL_INBOUND_ORDER", cell(body, "operator"), "当前单据已采集 SN 或已收货，不允许直接取消");
    }
    jdbc.update("UPDATE wms_inbound_order SET status = 'CANCELED' WHERE id = :id", params("id", id));
    jdbc.update("UPDATE wms_inbound_order_detail SET status = 'CANCELED' WHERE order_id = :id", params("id", id));
    repo.operationLog("INBOUND", orderNo, "CANCEL_INBOUND_ORDER", operator(cell(body, "operator")), "SUCCESS",
        firstText(cell(body, "reason"), "取消预期到货通知单"));
    return detail(id);
  }

  @Transactional
  public Map<String, Object> cancelReceipt(long id, long receiptId, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    Map<String, Object> receipt = repo.one("""
        SELECT *
        FROM wms_inbound_receipt
        WHERE id = :receiptId AND inbound_order_id = :orderId
        """, params("receiptId", receiptId, "orderId", id));
    if (receipt == null) {
      failOperation(orderNo, "CANCEL_RECEIPT", cell(body, "operator"), "收货批次不存在");
    }
    if ("CANCELED".equals(String.valueOf(receipt.get("status")))) {
      failOperation(orderNo, "CANCEL_RECEIPT", cell(body, "operator"), "收货批次已取消，请勿重复操作");
    }
    if (List.of("SUCCESS", "POSTED").contains(String.valueOf(receipt.get("sap_post_status")))) {
      failOperation(orderNo, "CANCEL_RECEIPT", cell(body, "operator"), "当前收货批次已回传 SAP 成功，不允许直接取消收货，请走 SAP 冲销流程。");
    }
    int putawayCount = repo.number("""
        SELECT COUNT(*)
        FROM wms_inbound_receipt_sn rs
        JOIN wms_serial_number sn ON sn.sn_code = rs.sn_code
        WHERE rs.receipt_id = :receiptId
          AND sn.status = 'ON_SHELF'
        """, params("receiptId", receiptId)).intValue();
    if (putawayCount > 0) {
      failOperation(orderNo, "CANCEL_RECEIPT", cell(body, "operator"), "当前收货批次已有 SN 上架，不允许直接取消收货");
    }

    List<Map<String, Object>> lines = repo.query("""
        SELECT *
        FROM wms_inbound_receipt_line
        WHERE receipt_id = :receiptId
        """, params("receiptId", receiptId));
    for (Map<String, Object> line : lines) {
      int qty = intValue(line.get("receive_qty"), 0);
      jdbc.update("""
          UPDATE wms_inbound_order_detail
          SET received_qty = GREATEST(received_qty - :qty, 0),
              status = CASE
                WHEN GREATEST(received_qty - :qty, 0) = 0 THEN 'CREATED'
                WHEN GREATEST(received_qty - :qty, 0) >= planned_qty THEN 'RECEIVED'
                ELSE 'PARTIAL_RECEIVED'
              END
          WHERE id = :lineId
          """, params("qty", qty, "lineId", line.get("inbound_order_line_id")));
    }
    List<String> serials = repo.query("""
        SELECT sn_code
        FROM wms_inbound_receipt_sn
        WHERE receipt_id = :receiptId
        ORDER BY sn_code
        """, params("receiptId", receiptId)).stream()
        .map(row -> String.valueOf(row.get("sn_code")))
        .toList();
    if (!serials.isEmpty()) {
      jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'COLLECTED',
              location_id = NULL
          WHERE sn_code IN (:serials)
            AND status = 'RECEIVED'
          """, params("serials", serials));
    }
    jdbc.update("""
        UPDATE wms_inbound_receipt_line
        SET sap_post_status = 'CANCELED',
            sap_post_result = :reason
        WHERE receipt_id = :receiptId
        """, params("receiptId", receiptId, "reason", firstText(cell(body, "reason"), "取消收货")));
    jdbc.update("""
        UPDATE wms_inbound_receipt
        SET status = 'CANCELED',
            sap_post_status = 'CANCELED',
            sap_post_result = :reason
        WHERE id = :receiptId
        """, params("receiptId", receiptId, "reason", firstText(cell(body, "reason"), "取消收货")));
    refreshInboundHeaderStatus(id);
    updateInboundSapSummary(id);
    repo.operationLog("INBOUND", orderNo, "CANCEL_RECEIPT", operator(cell(body, "operator")), "SUCCESS",
        "取消收货批次 " + receipt.get("receipt_no"));
    return detail(id);
  }

  @Transactional
  public Map<String, Object> bindPackage(long id, BindPackageRequest request) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    List<String> serials = cleanSerials(request.serialNumbers());
    if (!StringUtils.hasText(request.palletCode()) || serials.isEmpty()) {
      failOperation(orderNo, "BIND_PACKAGE", request.operator(), "托盘码和 SN 必填，箱码按产品档案要求可为空");
    }
    if (!List.of("CREATED", "PARTIAL_RECEIVED", "RECEIVING", "RECEIVED").contains(String.valueOf(order.get("status")))) {
      failOperation(orderNo, "BIND_PACKAGE", request.operator(), "当前状态不允许绑定");
    }
    for (String sn : serials) {
      Map<String, Object> row = requireSnForOrder(orderNo, sn);
      if (!List.of("COLLECTED", "RECEIVED", "ON_SHELF").contains(String.valueOf(row.get("status")))) {
        failOperation(orderNo, "BIND_PACKAGE", request.operator(), "SN 状态不允许绑定: " + sn);
      }
      Map<String, Object> existing = repo.one("SELECT * FROM wms_package_binding WHERE sn_code = :sn", params("sn", sn));
      if (existing != null && !orderNo.equals(String.valueOf(existing.get("inbound_order_no")))) {
        failOperation(orderNo, "BIND_PACKAGE", request.operator(), "SN 已存在其他 ASN 绑定关系: " + sn);
      }
    }
    for (String sn : serials) {
      jdbc.update("""
          INSERT INTO wms_package_binding (
            pallet_code, box_code, sn_code, product_id, inbound_order_no, bind_order_no, bind_status, bind_time
          ) VALUES (
            :palletCode, :boxCode, :sn, :productId, :orderNo, :orderNo, 'BOUND', NOW()
          )
          ON DUPLICATE KEY UPDATE
            pallet_code = VALUES(pallet_code),
            box_code = VALUES(box_code),
            bind_order_no = VALUES(bind_order_no),
            inbound_order_no = VALUES(inbound_order_no),
            bind_status = 'BOUND',
            bind_time = NOW()
          """, params(
          "palletCode", request.palletCode(),
          "boxCode", firstText(request.boxCode(), ""),
          "sn", sn,
          "productId", order.get("product_id"),
          "orderNo", orderNo
      ));
    }
    jdbc.update("""
        UPDATE wms_serial_number
        SET pallet_code = :palletCode, box_code = :boxCode
        WHERE sn_code IN (:serials)
        """, params("palletCode", request.palletCode(), "boxCode", firstText(request.boxCode(), ""), "serials", serials));
    repo.operationLog("INBOUND", orderNo, "BIND_PACKAGE", operator(request.operator()), "SUCCESS", "绑定托盘/箱/SN " + serials.size() + " 条");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> putaway(long id, PutawayRequest request) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    Map<String, Object> location = requireReceivingLocation(order, request.locationCode(), orderNo, request.operator());
    List<String> serials = cleanSerials(request.serialNumbers());
    if (serials.isEmpty() && StringUtils.hasText(request.palletCode())) {
      serials = repo.query("""
          SELECT sn_code
          FROM wms_serial_number
          WHERE inbound_order_no = :orderNo AND pallet_code = :palletCode
          ORDER BY sn_code
          """, params("orderNo", orderNo, "palletCode", request.palletCode()))
          .stream()
          .map(row -> String.valueOf(row.get("sn_code")))
          .toList();
    }
    if (serials.isEmpty()) {
      serials = repo.query("""
          SELECT sn_code
          FROM wms_serial_number
          WHERE inbound_order_no = :orderNo AND status IN ('RECEIVED', 'ON_SHELF')
          ORDER BY sn_code
          """, params("orderNo", orderNo))
          .stream()
          .map(row -> String.valueOf(row.get("sn_code")))
          .toList();
    }
    if (serials.isEmpty()) {
      failOperation(orderNo, "PUTAWAY", request.operator(), "没有可落位的 SN");
    }
    jdbc.update("""
        UPDATE wms_serial_number
        SET status = 'ON_SHELF',
            warehouse_id = :warehouseId,
            location_id = :locationId
        WHERE sn_code IN (:serials)
        """, params("warehouseId", order.get("warehouse_id"), "locationId", location.get("id"), "serials", serials));
    upsertInventory(order, location, serials.size());
    updateOrderQuantities(id, countReceived(orderNo), "RECEIVED", true);
    repo.operationLog("INBOUND", orderNo, "PUTAWAY", operator(request.operator()), "SUCCESS", "兼容旧入口落位 " + serials.size() + " 个 SN");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> sapPost(long id, SapPostRequest request) {
    Map<String, Object> order = requireOrder(id);
    String orderNo = String.valueOf(order.get("order_no"));
    List<Map<String, Object>> receipts = repo.query("""
        SELECT *
        FROM wms_inbound_receipt
        WHERE inbound_order_id = :id
          AND sap_post_status IN ('NOT_POSTED', 'FAILED')
        ORDER BY id
        """, params("id", id));
    validateInboundSapPostable(order, request == null ? null : request.operator(), receipts.size());
    if (receipts.isEmpty()) {
      failOperation(orderNo, "SAP_POSTING", request == null ? null : request.operator(), "当前单据没有待回传或失败的收货批次");
    }
    boolean forceFail = request != null && Boolean.TRUE.equals(request.forceFail());
    for (Map<String, Object> receipt : receipts) {
      long receiptId = ((Number) receipt.get("id")).longValue();
      List<Map<String, Object>> lines = repo.query("""
          SELECT line_no AS lineNo, product_id AS productId, product_code AS productCode, receive_qty AS receiveQty
          FROM wms_inbound_receipt_line
          WHERE receipt_id = :receiptId
          ORDER BY line_no
          """, params("receiptId", receiptId));
      Map<String, Object> requestBody = Map.of(
          "requestId", "REQ-WMS-SAP-IN-" + receipt.get("receipt_no"),
          "sourceSystem", "WMS",
          "businessType", "INBOUND_RECEIPT_POSTING",
          "inboundOrderNo", orderNo,
          "receiptNo", receipt.get("receipt_no"),
          "lines", lines
      );
      if (forceFail) {
        String error = "SAP 回传失败：物料移动类型缺失";
        jdbc.update("""
            UPDATE wms_inbound_receipt
            SET sap_post_status = 'FAILED', sap_post_result = :result
            WHERE id = :receiptId
            """, params("receiptId", receiptId, "result", error));
        jdbc.update("""
            UPDATE wms_inbound_receipt_line
            SET sap_post_status = 'FAILED', sap_post_result = :result
            WHERE receipt_id = :receiptId
            """, params("receiptId", receiptId, "result", error));
        repo.interfaceLog("SAP_INBOUND_RECEIPT_POSTING", "WMS", "SAP", orderNo,
            "/api/mock/sap/material-documents", requestBody, Map.of("code", 1, "message", error), "FAILED", error);
        repo.operationLog("INBOUND", orderNo, "SAP_POSTING", operator(request == null ? null : request.operator()), "FAILED",
            error + "，收货批次 " + receipt.get("receipt_no"));
        continue;
      }
      String materialDoc = "49" + (System.currentTimeMillis() % 100000000);
      String result = "SAP 入库过账成功，凭证号 " + materialDoc;
      jdbc.update("""
          UPDATE wms_inbound_receipt
          SET status = 'SAP_POSTED',
              sap_post_status = 'SUCCESS',
              sap_material_doc_no = :materialDoc,
              sap_post_result = :result
          WHERE id = :receiptId
          """, params("receiptId", receiptId, "materialDoc", materialDoc, "result", result));
      jdbc.update("""
          UPDATE wms_inbound_receipt_line
          SET sap_post_status = 'SUCCESS',
              sap_material_doc_no = :materialDoc,
              sap_post_result = :result,
              sap_post_qty = receive_qty
          WHERE receipt_id = :receiptId
          """, params("receiptId", receiptId, "materialDoc", materialDoc, "result", result));
      repo.interfaceLog("SAP_INBOUND_RECEIPT_POSTING", "WMS", "SAP", orderNo,
          "/api/mock/sap/material-documents", requestBody, Map.of("sapMaterialDocNo", materialDoc, "postingStatus", "SUCCESS"), "SUCCESS", null);
      repo.operationLog("INBOUND", orderNo, "SAP_POSTING", operator(request == null ? null : request.operator()), "SUCCESS",
          "SAP 按收货批次过账成功 " + materialDoc + "，收货批次 " + receipt.get("receipt_no"));
    }
    updateInboundSapSummary(id);
    return detail(id);
  }

  @Transactional
  public Map<String, Object> retrySap(List<Long> orderIds) {
    if (orderIds == null || orderIds.isEmpty()) {
      throw new IllegalArgumentException("请先选择需要重传 SAP 的入库单");
    }
    int handled = 0;
    List<String> messages = new ArrayList<>();
    for (Long orderId : orderIds) {
      try {
        sapPost(orderId, new SapPostRequest(false, "admin"));
        handled++;
      } catch (IllegalArgumentException ex) {
        messages.add(ex.getMessage());
      }
    }
    return Map.of("handled", handled, "message", handled + " 张入库单已触发 SAP 重传", "skipped", messages);
  }

  @Transactional
  public Map<String, Object> createFromSapMock(Map<String, Object> body) {
    String productCode = String.valueOf(body.getOrDefault("productCode", "GT3-30KD1R11001"));
    String warehouseCode = String.valueOf(body.getOrDefault("warehouseCode", "WH-HZ-CENTRAL"));
    String sapWorkOrderNo = String.valueOf(body.getOrDefault("sapWorkOrderNo", "MO" + System.currentTimeMillis()));
    String mesWorkOrderNo = String.valueOf(body.getOrDefault("mesWorkOrderNo", "MES-" + sapWorkOrderNo));
    int qty = intValue(body.get("qty"), 10);
    Map<String, Object> created = create(new CreateProductionInboundRequest(
        String.valueOf(body.getOrDefault("inboundOrderNo", "")),
        sapWorkOrderNo,
        mesWorkOrderNo,
        productCode,
        warehouseCode,
        qty,
        "SAP Mock 下发生产工单",
        "PRODUCTION",
        "SAP",
        sapWorkOrderNo,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
    ));
    Map<String, Object> order = (Map<String, Object>) created.get("order");
    repo.interfaceLog("SAP_PRODUCTION_ORDER_PUSH", "SAP", "WMS", sapWorkOrderNo,
        "/api/mock/sap/production-orders", body, Map.of("inboundOrderNo", order.get("order_no"), "status", "CREATED"), "SUCCESS", null);
    return created;
  }

  public Map<String, Object> importTemplate() {
    String content = String.join("\n",
        "# Sheet1：入库单表头",
        CsvExport.csv(inboundImportHeaderColumns(), List.of(List.of("TMP-IN-001", "生产入库", "SAP", "MO-DEMO-001", "3060", "杭州利沃得", "WH-HZ-CENTRAL", "杭州集团总仓", "中国", "3060", "2026-06-18", "导入模板示例"))),
        "",
        "# Sheet2：入库单明细",
        CsvExport.csv(inboundImportLineColumns(), List.of(List.of("TMP-IN-001", "10", "GT3-10KD1R11004", "三相并网逆变器", "3060", "1001", "BATCH-DEMO-001", "3", "QUALIFIED", "模板示例明细")))
    );
    return CsvExport.file("预期到货通知单导入模板.csv", content);
  }

  @Transactional
  public Map<String, Object> importInboundOrders(Map<String, Object> body) {
    List<Map<String, Object>> headers = bodyRows(body, "headers");
    List<Map<String, Object>> lines = bodyRows(body, "lines");
    Map<String, Object> result = importResult();
    Map<String, List<Map<String, Object>>> lineGroups = new HashMap<>();
    for (Map<String, Object> line : lines) {
      String key = cell(line, "入库单号", "orderNo", "inboundOrderNo");
      if (key.isBlank() && headers.size() == 1) {
        key = "__ONLY_HEADER__";
      }
      if (!key.isBlank()) {
        lineGroups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(line);
      }
    }
    for (int i = 0; i < headers.size(); i++) {
      Map<String, Object> header = headers.get(i);
      int rowNo = i + 2;
      String rawOrderNo = cell(header, "入库单号", "orderNo", "inboundOrderNo");
      String orderNo = rawOrderNo.isBlank() ? "IN" + System.currentTimeMillis() + i : rawOrderNo;
      String groupKey = rawOrderNo.isBlank() && headers.size() == 1 ? "__ONLY_HEADER__" : orderNo;
      String inboundTypeText = cell(header, "入库类型", "inboundType");
      String inboundType = parseInboundType(inboundTypeText);
      String sourceSystem = firstText(cell(header, "来源系统", "sourceSystem"), "MANUAL");
      String ownerCode = cell(header, "货主编码", "ownerCode");
      String ownerName = cell(header, "货主名称", "ownerName");
      String warehouseCode = cell(header, "入库仓库编码", "warehouseCode");
      String sapPlant = cell(header, "SAP 工厂", "sapPlant");
      List<Map<String, Object>> orderLines = lineGroups.getOrDefault(groupKey, List.of());
      String missing = firstMissing(List.of(
          List.of(inboundTypeText, "入库类型不能为空"),
          List.of(sourceSystem, "来源系统不能为空"),
          List.of(ownerCode, "货主编码不能为空"),
          List.of(ownerName, "货主名称不能为空"),
          List.of(warehouseCode, "入库仓库编码不能为空"),
          List.of(sapPlant, "SAP 工厂不能为空")
      ));
      if (missing != null) {
        importError(result, rowNo, missing);
        continue;
      }
      if (inboundType.isBlank()) {
        importError(result, rowNo, "入库类型不合法");
        continue;
      }
      if (repo.one("SELECT id FROM md_customer WHERE customer_code = :ownerCode", Map.of("ownerCode", ownerCode)) == null) {
        importError(result, rowNo, "货主不存在");
        continue;
      }
      if (repo.one("SELECT id FROM wms_warehouse WHERE warehouse_code = :warehouseCode", Map.of("warehouseCode", warehouseCode)) == null) {
        importError(result, rowNo, "仓库不存在");
        continue;
      }
      if (orderLines.isEmpty()) {
        importError(result, rowNo, "每个表头至少需要一条明细");
        continue;
      }
      Set<Integer> lineNos = new LinkedHashSet<>();
      List<CreateProductionInboundRequest.Line> requestLines = new ArrayList<>();
      boolean failed = false;
      for (int lineIndex = 0; lineIndex < orderLines.size(); lineIndex++) {
        Map<String, Object> line = orderLines.get(lineIndex);
        int lineRowNo = lineIndex + 2;
        int lineNo = intValue(cell(line, "行号", "lineNo"), 0);
        String productCode = cell(line, "产品编码", "productCode");
        int planQty = intValue(cell(line, "计划数量", "planQty"), 0);
        Map<String, Object> product = repo.one("SELECT * FROM md_product WHERE owner_code = :ownerCode AND product_code = :productCode", Map.of("ownerCode", ownerCode, "productCode", productCode));
        if (lineNo <= 0 || lineNos.contains(lineNo)) {
          importError(result, lineRowNo, "同一入库单下行号不能为空且不能重复");
          failed = true;
          continue;
        }
        if (product == null) {
          importError(result, lineRowNo, "产品不存在或不属于当前货主：" + ownerCode + "/" + productCode);
          failed = true;
          continue;
        }
        if (planQty <= 0) {
          importError(result, lineRowNo, "计划数量必须大于 0");
          failed = true;
          continue;
        }
        lineNos.add(lineNo);
        requestLines.add(new CreateProductionInboundRequest.Line(
            lineNo,
            ((Number) product.get("id")).longValue(),
            productCode,
            firstText(cell(line, "产品名称", "productName"), String.valueOf(product.get("product_name"))),
            planQty,
            firstText(cell(line, "SAP 工厂", "sapPlant"), sapPlant),
            cell(line, "SAP 库存地点", "sapStorageLocation"),
            null,
            cell(line, "批次号", "batchNo"),
            firstText(cell(line, "质量状态", "qualityStatus"), "QUALIFIED")
        ));
      }
      if (failed) {
        continue;
      }
      create(new CreateProductionInboundRequest(
          orderNo,
          null,
          null,
          null,
          warehouseCode,
          0,
          cell(header, "备注", "remark"),
          inboundType,
          sourceSystem,
          cell(header, "来源单号", "sourceDocNo", "sourceOrderNo"),
          cell(header, "计划到货日期", "planDate"),
          cell(header, "出库国家", "shipFromCountry"),
          sapPlant,
          ownerCode,
          ownerName,
          null,
          null,
          requestLines
      ));
      incrementSuccess(result);
    }
    finishImportResult(result);
    return result;
  }

  public Map<String, Object> exportInboundOrders(Map<String, Object> body) {
    String scope = String.valueOf(body.getOrDefault("exportScope", "QUERY"));
    @SuppressWarnings("unchecked")
    List<Number> orderIds = (List<Number>) body.getOrDefault("orderIds", List.of());
    @SuppressWarnings("unchecked")
    Map<String, Object> queryParams = (Map<String, Object>) body.getOrDefault("queryParams", Map.of());
    Map<String, Object> params = inboundExportParams(queryParams);
    String selectedFilter = "";
    if ("SELECTED".equals(scope)) {
      List<Long> ids = orderIds.stream().map(Number::longValue).toList();
      params.put("orderIds", ids.isEmpty() ? List.of(-1L) : ids);
      selectedFilter = " AND o.id IN (:orderIds)";
    }
    List<Map<String, Object>> headers = repo.query("""
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               COALESCE(o.owner_code, w.owner_code, 'OWN') AS owner_code,
               COALESCE(o.owner_name, w.warehouse_name) AS owner_name,
               COALESCE(o.sap_post_status, 'NOT_POSTED') AS sap_post_status,
               COALESCE(o.sap_post_result, '') AS sap_post_result,
               COALESCE(o.sap_material_doc_no, '') AS sap_material_doc_no,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_planned_qty, o.planned_qty) AS planned_qty,
               COALESCE(agg.total_received_qty, o.received_qty) AS received_qty,
               COALESCE(agg.total_shelved_qty, 0) AS shelved_qty,
               COALESCE(snagg.total_collected_qty, 0) AS collected_qty,
               COALESCE(snagg.total_pending_receive_qty, 0) AS pending_receive_qty
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN (
          SELECT order_id, COUNT(*) AS line_count, SUM(planned_qty) AS total_planned_qty, SUM(received_qty) AS total_received_qty, SUM(shelved_qty) AS total_shelved_qty
          FROM wms_inbound_order_detail GROUP BY order_id
        ) agg ON agg.order_id = o.id
        LEFT JOIN (
          SELECT inbound_order_no,
                 SUM(CASE WHEN status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF') THEN 1 ELSE 0 END) AS total_collected_qty,
                 SUM(CASE WHEN status = 'COLLECTED' THEN 1 ELSE 0 END) AS total_pending_receive_qty
          FROM wms_serial_number GROUP BY inbound_order_no
        ) snagg ON snagg.inbound_order_no = o.order_no
        WHERE (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:sourceOrderNo IS NULL OR o.source_order_no LIKE :sourceOrderNo)
          AND (:inboundType IS NULL OR o.inbound_type LIKE :inboundType)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR o.owner_code LIKE :owner OR o.owner_name LIKE :owner)
          AND (:sapPostStatus IS NULL OR COALESCE(o.sap_post_status, 'NOT_POSTED') LIKE :sapPostStatus)
          AND (:createdStart IS NULL OR o.created_at >= :createdStart)
          AND (:createdEnd IS NULL OR o.created_at < DATE_ADD(:createdEnd, INTERVAL 1 DAY))
          AND (:status IS NULL OR o.status LIKE :status)
        """ + selectedFilter + " ORDER BY o.id DESC", params);
    List<Long> ids = headers.stream().map(row -> ((Number) row.get("id")).longValue()).toList();
    List<Map<String, Object>> lines = ids.isEmpty() ? List.of() : repo.query("""
        SELECT o.order_no, d.line_no, p.product_code, p.product_name, d.sn_required,
               COALESCE(d.sap_plant, o.sap_plant, '') AS sap_plant,
               d.sap_storage_location, d.batch_no, d.planned_qty, d.received_qty, d.shelved_qty, d.status,
               (SELECT COUNT(*) FROM wms_serial_number sn WHERE sn.inbound_order_line_id = d.id AND sn.status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')) AS collected_qty,
               (SELECT COUNT(*) FROM wms_serial_number sn WHERE sn.inbound_order_line_id = d.id AND sn.status = 'COLLECTED') AS pending_receive_qty
        FROM wms_inbound_order_detail d
        JOIN wms_inbound_order o ON o.id = d.order_id
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id IN (:ids)
        ORDER BY o.id DESC, d.line_no
        """, Map.of("ids", ids));
    String content = String.join("\n",
        "# Sheet1：入库单表头",
        CsvExport.csv(inboundExportHeaderColumns(), headers.stream().map(row -> List.of(
            value(row, "order_no"), inboundTypeName(value(row, "inbound_type")), value(row, "source_system"), value(row, "source_order_no"),
            value(row, "owner_code"), value(row, "owner_name"), value(row, "warehouse_code"), value(row, "warehouse_name"),
            value(row, "ship_from_country"), value(row, "sap_plant"), value(row, "line_count"), value(row, "planned_qty"),
            value(row, "collected_qty"), value(row, "pending_receive_qty"), value(row, "received_qty"), value(row, "shelved_qty"),
            inboundStatusName(value(row, "status")), sapStatusName(value(row, "sap_post_status")),
            firstText(value(row, "sap_material_doc_no"), value(row, "sap_post_result")), value(row, "created_at")
        )).toList()),
        "",
        "# Sheet2：入库单明细",
        CsvExport.csv(inboundExportLineColumns(), lines.stream().map(row -> List.of(
            value(row, "order_no"), value(row, "line_no"), value(row, "product_code"), value(row, "product_name"),
            yesNo(row.get("sn_required")), value(row, "sap_plant"), value(row, "sap_storage_location"), value(row, "batch_no"),
            value(row, "planned_qty"), value(row, "collected_qty"), value(row, "pending_receive_qty"),
            value(row, "received_qty"), value(row, "shelved_qty"), inboundStatusName(value(row, "status"))
        )).toList())
    );
    return CsvExport.file("预期到货通知单_" + CsvExport.timestamp() + ".csv", content);
  }

  public Map<String, Object> exportSnBindings(String palletCode, String asnNo, String boxCode, String snCode) {
    Map<String, Object> params = params(
        "palletCode", repo.like(palletCode),
        "asnNo", repo.like(asnNo),
        "boxCode", repo.like(boxCode),
        "snCode", repo.like(snCode)
    );
    List<Map<String, Object>> rows = repo.query("""
        SELECT COALESCE(b.inbound_order_no, b.bind_order_no) AS inbound_order_no,
               d.line_no, p.product_code, p.product_name, b.sn_code, b.pallet_code, b.box_code,
               s.status AS sn_status, b.bind_status, w.warehouse_code, l.location_code,
               b.bind_time, s.updated_at AS receive_time, NULL AS shelve_time
        FROM wms_package_binding b
        LEFT JOIN wms_serial_number s ON s.sn_code = b.sn_code
        LEFT JOIN md_product p ON p.id = b.product_id
        LEFT JOIN wms_inbound_order_detail d ON d.id = b.inbound_order_line_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE (:palletCode IS NULL OR b.pallet_code LIKE :palletCode)
          AND (:asnNo IS NULL OR b.inbound_order_no LIKE :asnNo OR b.bind_order_no LIKE :asnNo)
          AND (:boxCode IS NULL OR b.box_code LIKE :boxCode)
          AND (:snCode IS NULL OR b.sn_code LIKE :snCode)
        ORDER BY b.id DESC
        """, params);
    List<List<?>> data = rows.stream().map(row -> List.of(
        value(row, "inbound_order_no"), value(row, "line_no"), value(row, "product_code"), value(row, "product_name"),
        value(row, "sn_code"), value(row, "pallet_code"), value(row, "box_code"), value(row, "sn_status"),
        value(row, "bind_status"), value(row, "warehouse_code"), value(row, "location_code"),
        value(row, "bind_time"), value(row, "receive_time"), value(row, "shelve_time")
    )).toList();
    return CsvExport.file("SN绑定数据_" + CsvExport.timestamp() + ".csv", CsvExport.csv(List.of("入库单号", "行号", "产品编码", "产品名称", "SN", "托盘码", "箱码", "SN 状态", "收货状态", "仓库编码", "库位编码", "采集时间", "收货时间", "上架时间"), data));
  }

  @Transactional
  public void deleteBinding(long id, String operator) {
    Map<String, Object> binding = repo.one("SELECT * FROM wms_package_binding WHERE id = :id", params("id", id));
    if (binding == null) {
      return;
    }
    String sn = String.valueOf(binding.get("sn_code"));
    String orderNo = nullToEmpty(binding.get("inbound_order_no"));
    Object lineId = binding.get("inbound_order_line_id");
    Map<String, Object> snRow = repo.one("SELECT status FROM wms_serial_number WHERE sn_code = :sn", params("sn", sn));
    if (lineId != null && (snRow == null || !"COLLECTED".equals(String.valueOf(snRow.get("status"))))) {
      failOperation(orderNo, "CANCEL_SN_COLLECT", operator, "仅允许取消已采集待收货 SN，已收货或已上架 SN 不允许取消: " + sn);
    }
    jdbc.update("DELETE FROM wms_package_binding WHERE id = :id", params("id", id));
    jdbc.update("""
        UPDATE wms_serial_number
        SET pallet_code = NULL,
            box_code = NULL,
            inbound_order_no = CASE WHEN :lineId IS NULL THEN inbound_order_no ELSE NULL END,
            inbound_order_line_id = CASE WHEN :lineId IS NULL THEN inbound_order_line_id ELSE NULL END,
            warehouse_id = CASE WHEN :lineId IS NULL THEN warehouse_id ELSE NULL END,
            location_id = CASE WHEN :lineId IS NULL THEN location_id ELSE NULL END,
            status = CASE WHEN :lineId IS NULL THEN status ELSE 'ISSUED' END
        WHERE sn_code = :sn
          AND (:lineId IS NULL OR status = 'COLLECTED')
        """, params("sn", sn, "lineId", lineId));
    repo.operationLog("INBOUND", orderNo, "CANCEL_SN_COLLECT", operator(operator), "SUCCESS", "取消未收货 SN 采集 " + sn);
  }

  @Transactional
  public Map<String, Object> cancelSnCollection(long orderId, long lineId, com.company.wms.inbound.dto.CancelSnCollectionRequest request) {
    Map<String, Object> line = requireInboundLine(orderId, lineId);
    String orderNo = String.valueOf(line.get("order_no"));
    List<String> serials = cleanSerials(request == null ? null : request.serialNumbers());
    if (serials.isEmpty()) {
      failOperation(orderNo, "CANCEL_SN_COLLECT", request == null ? null : request.operator(), "请选择需要取消采集的 SN");
    }
    for (String sn : serials) {
      Map<String, Object> row = repo.one("""
          SELECT *
          FROM wms_serial_number
          WHERE sn_code = :sn
            AND inbound_order_no = :orderNo
            AND inbound_order_line_id = :lineId
          """, params("sn", sn, "orderNo", orderNo, "lineId", lineId));
      if (row == null) {
        failOperation(orderNo, "CANCEL_SN_COLLECT", request == null ? null : request.operator(), "SN 不属于当前入库明细行: " + sn);
      }
      if (!"COLLECTED".equals(String.valueOf(row.get("status")))) {
        failOperation(orderNo, "CANCEL_SN_COLLECT", request == null ? null : request.operator(), "仅允许取消已采集待收货 SN: " + sn);
      }
    }
    jdbc.update("DELETE FROM wms_package_binding WHERE sn_code IN (:serials)", params("serials", serials));
    jdbc.update("""
        UPDATE wms_serial_number
        SET pallet_code = NULL,
            box_code = NULL,
            inbound_order_no = NULL,
            inbound_order_line_id = NULL,
            warehouse_id = NULL,
            location_id = NULL,
            status = 'ISSUED'
        WHERE sn_code IN (:serials)
        """, params("serials", serials));
    repo.operationLog("INBOUND", orderNo, "CANCEL_SN_COLLECT", operator(request == null ? null : request.operator()), "SUCCESS",
        "取消未收货 SN 采集 " + serials.size() + " 个");
    return detail(orderId);
  }

  @Transactional
  public void deleteBindings(List<Long> ids, String operator) {
    if (ids == null || ids.isEmpty()) {
      return;
    }
    for (Long id : ids) {
      deleteBinding(id, operator);
    }
  }

  private Map<String, Object> requireInboundLine(long orderId, long lineId) {
    Map<String, Object> line = repo.one("""
        SELECT d.id AS line_id, d.order_id, d.line_no, d.product_id, d.planned_qty,
               d.received_qty, d.shelved_qty, d.sap_plant, d.sap_storage_location,
               COALESCE(d.sn_required, p.sn_managed) AS sn_required,
               d.batch_no, d.quality_status, d.status,
               o.order_no, o.inbound_type, o.source_system, o.source_order_no,
               o.mes_work_order_no, o.warehouse_id, o.status AS order_status,
               o.owner_code, o.owner_name,
               w.warehouse_code, w.warehouse_name,
               p.product_code, p.product_name, p.unit, p.sn_managed
        FROM wms_inbound_order_detail d
        JOIN wms_inbound_order o ON o.id = d.order_id
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        JOIN md_product p ON p.id = d.product_id
        WHERE o.id = :orderId AND d.id = :lineId
        """, params("orderId", orderId, "lineId", lineId));
    if (line == null) {
      throw new IllegalArgumentException("入库明细行不存在");
    }
    return line;
  }

  private void validateSingleSnForCollection(
      Map<String, Object> item,
      String sn,
      Map<String, Object> line,
      long productId,
      String orderNo,
      long lineId
  ) {
    Map<String, Object> row = repo.one("SELECT * FROM wms_serial_number WHERE sn_code = :sn", params("sn", sn));
    Map<String, Object> binding = repo.one("SELECT * FROM wms_package_binding WHERE sn_code = :sn", params("sn", sn));
    if (row != null) {
      item.put("existingStatus", row.get("status"));
      item.put("qualityStatus", row.get("quality_status"));
      if (((Number) row.get("product_id")).longValue() != productId) {
        failItem(item, "SN 已存在，但产品与当前入库明细行不一致");
        return;
      }
      String inboundOrderNo = nullToEmpty(row.get("inbound_order_no"));
      Object rowLineId = row.get("inbound_order_line_id");
      if (StringUtils.hasText(inboundOrderNo) && orderNo.equals(inboundOrderNo)) {
        failItem(item, "SN 已在当前预期到货通知单中采集，不能重复采集");
        return;
      }
      if (StringUtils.hasText(inboundOrderNo) && !orderNo.equals(inboundOrderNo)) {
        failItem(item, "SN 已绑定其他预期到货通知单");
        return;
      }
      if (rowLineId != null && ((Number) rowLineId).longValue() != lineId) {
        failItem(item, "SN 已绑定其他入库明细行");
        return;
      }
      if (!"QUALIFIED".equals(String.valueOf(row.get("quality_status")))) {
        failItem(item, "SN 质量状态不是合格，禁止采集");
        return;
      }
      if (intValue(row.get("locked_flag"), 0) == 1) {
        failItem(item, "SN 已锁定，禁止采集");
        return;
      }
      if (!List.of("ISSUED").contains(String.valueOf(row.get("status")))) {
        failItem(item, "SN 状态已入库/上架/出库或不可采集: " + row.get("status"));
        return;
      }
    } else {
      item.put("message", "新 SN，将按当前产品现场创建并绑定");
    }
    if (binding != null) {
      failItem(item, "SN 已存在箱/托绑定关系，禁止重复绑定");
    }
  }

  private void failItem(Map<String, Object> item, String message) {
    item.put("status", "FAILED");
    item.put("message", message);
  }

  private String buildSnValidationMessage(int inputQty, int validQty, int invalidQty, int remainingQty) {
    if (inputQty == 0) {
      return "请至少录入一个 SN";
    }
    if (validQty > remainingQty) {
      return "本次有效 SN 数量超过该产品行剩余可采集数量";
    }
    if (invalidQty > 0) {
      return "存在 " + invalidQty + " 个异常 SN，请处理后再确认采集";
    }
    return "校验通过，本次可采集 " + validQty + " 个 SN";
  }

  private void validateInboundEditable(Map<String, Object> order, String operator) {
    String orderNo = String.valueOf(order.get("order_no"));
    if (!"CREATED".equals(inboundStatus(order))
        || intValue(order.get("received_qty"), 0) > 0
        || intValue(order.get("shelved_qty"), 0) > 0
        || sapPosted(order)) {
      failOperation(orderNo, "EDIT_INBOUND_ORDER", operator,
          "当前状态【" + inboundStatus(order) + "】不允许编辑预期到货通知单，仅创建状态且未采集、未收货、未上架时允许编辑");
    }
    int snCount = repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_no = :orderNo
          AND status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF')
        """, params("orderNo", orderNo)).intValue();
    int receiptCount = repo.number("""
        SELECT COUNT(*)
        FROM wms_inbound_receipt
        WHERE inbound_order_id = :id
          AND status <> 'CANCELED'
        """, params("id", order.get("id"))).intValue();
    if (snCount > 0 || receiptCount > 0) {
      failOperation(orderNo, "EDIT_INBOUND_ORDER", operator,
          "当前预期到货通知单已有 SN 采集或收货记录，不允许编辑");
    }
  }

  private void validateInboundReceivable(Map<String, Object> order, String operator) {
    if (!List.of("CREATED", "PARTIAL_RECEIVED", "RECEIVING").contains(inboundStatus(order))) {
      failOperation(String.valueOf(order.get("order_no")), "RECEIVE_CONFIRM", operator,
          "当前状态【" + inboundStatus(order) + "】不允许收货，仅创建或部分收货状态允许收货");
    }
  }

  private void validateInboundCancelable(Map<String, Object> order, String operator) {
    if (!"CREATED".equals(inboundStatus(order)) || sapPosted(order)) {
      failOperation(String.valueOf(order.get("order_no")), "CANCEL_INBOUND_ORDER", operator,
          "当前状态【" + inboundStatus(order) + "】不允许取消预期到货通知单，仅创建状态且未采集、未收货时允许取消");
    }
  }

  private void validateInboundSapPostable(Map<String, Object> order, String operator, int pendingReceiptCount) {
    String sapStatus = cell(order, "sap_post_status");
    if (!List.of("PARTIAL_RECEIVED", "RECEIVED", "ON_SHELF", "BOUND").contains(inboundStatus(order))
        || (pendingReceiptCount <= 0 && !List.of("FAILED", "NOT_POSTED", "").contains(sapStatus))) {
      failOperation(String.valueOf(order.get("order_no")), "SAP_POSTING", operator,
          "当前状态【" + inboundStatus(order) + "】且 SAP 状态【" + firstText(sapStatus, "空") + "】不允许回传 SAP，仅已收货且存在未回传或失败收货批次时允许回传");
    }
  }

  private boolean sapPosted(Map<String, Object> order) {
    return List.of("SUCCESS", "POSTED").contains(cell(order, "sap_post_status"));
  }

  private String inboundStatus(Map<String, Object> order) {
    return firstText(cell(order, "status"), "空");
  }

  private void refreshInboundHeaderStatus(long orderId) {
    Map<String, Object> current = repo.one("SELECT status FROM wms_inbound_order WHERE id = :orderId", params("orderId", orderId));
    if (current != null && List.of("CANCELED", "CLOSED").contains(String.valueOf(current.get("status")))) {
      return;
    }
    Map<String, Object> agg = repo.one("""
        SELECT COUNT(*) AS line_count,
               COALESCE(SUM(planned_qty), 0) AS planned_qty,
               COALESCE(SUM(received_qty), 0) AS received_qty,
               COALESCE(SUM(shelved_qty), 0) AS shelved_qty,
               SUM(CASE WHEN received_qty >= planned_qty THEN 1 ELSE 0 END) AS completed_lines
        FROM wms_inbound_order_detail
        WHERE order_id = :orderId
        """, params("orderId", orderId));
    int lineCount = intValue(agg.get("line_count"), 0);
    int plannedQty = intValue(agg.get("planned_qty"), 0);
    int receivedQty = intValue(agg.get("received_qty"), 0);
    int shelvedQty = intValue(agg.get("shelved_qty"), 0);
    int completedLines = intValue(agg.get("completed_lines"), 0);
    String status = receivedQty == 0
        ? "CREATED"
        : shelvedQty >= plannedQty && plannedQty > 0
            ? "ON_SHELF"
            : completedLines >= lineCount
                ? "RECEIVED"
                : "PARTIAL_RECEIVED";
    jdbc.update("""
        UPDATE wms_inbound_order
        SET planned_qty = :plannedQty,
            received_qty = :receivedQty,
            status = :status
        WHERE id = :orderId
        """, params(
        "orderId", orderId,
        "plannedQty", plannedQty,
        "receivedQty", receivedQty,
        "status", status
    ));
  }

  private Map<String, Object> requireOrder(long id) {
    Map<String, Object> order = repo.one("""
        SELECT o.*, w.warehouse_code, w.warehouse_name, d.product_id, d.shelved_qty,
               p.product_code, p.product_name
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        JOIN wms_inbound_order_detail d ON d.order_id = o.id
        JOIN md_product p ON p.id = d.product_id
        WHERE o.id = :id
        ORDER BY d.line_no
        LIMIT 1
        """, params("id", id));
    if (order == null) {
      throw new IllegalArgumentException("入库单不存在");
    }
    return order;
  }

  private Map<String, Object> requireProduct(String productCode) {
    return requireProduct(productCode, null);
  }

  private Map<String, Object> requireProduct(String productCode, String ownerCode) {
    Map<String, Object> product = repo.one("""
        SELECT *
        FROM md_product
        WHERE product_code = :productCode
          AND (:ownerCode IS NULL OR owner_code = :ownerCode OR owner_code IS NULL)
        ORDER BY CASE WHEN owner_code = :ownerCode THEN 0 ELSE 1 END, id
        LIMIT 1
        """, params("productCode", productCode, "ownerCode", firstText(ownerCode, null)));
    if (product == null) {
      throw new IllegalArgumentException("产品不存在: " + productCode);
    }
    return product;
  }

  private Map<String, Object> requireProductById(long productId) {
    Map<String, Object> product = repo.one("SELECT * FROM md_product WHERE id = :id", params("id", productId));
    if (product == null) {
      throw new IllegalArgumentException("产品不存在: " + productId);
    }
    return product;
  }

  private Map<String, Object> requireWarehouse(String warehouseCode) {
    Map<String, Object> warehouse = repo.one("SELECT * FROM wms_warehouse WHERE warehouse_code = :warehouseCode", params("warehouseCode", warehouseCode));
    if (warehouse == null) {
      throw new IllegalArgumentException("仓库不存在: " + warehouseCode);
    }
    return warehouse;
  }

  private Map<String, Object> requireReceivingLocation(Map<String, Object> order, String locationCode, String orderNo, String operator) {
    if (!StringUtils.hasText(locationCode)) {
      return null;
    }
    Map<String, Object> location = repo.one("""
        SELECT l.*, a.id AS target_area_id, a.area_code, w.id AS target_warehouse_id, w.warehouse_code
        FROM wms_location l
        JOIN wms_area a ON a.id = l.area_id
        JOIN wms_warehouse w ON w.id = l.warehouse_id
        WHERE l.location_code = :locationCode AND w.id = :warehouseId
        """, params("locationCode", locationCode, "warehouseId", order.get("warehouse_id")));
    if (location == null) {
      failOperation(orderNo, "RECEIVE_SN", operator, "目标库位不存在或不属于当前仓库");
    }
    if (((Number) location.get("frozen_flag")).intValue() == 1) {
      failOperation(orderNo, "RECEIVE_SN", operator, "目标库位已冻结，不允许收货");
    }
    return location;
  }

  private Map<String, Object> requireSnForOrder(String orderNo, String sn) {
    Map<String, Object> row = repo.one("SELECT * FROM wms_serial_number WHERE sn_code = :sn AND inbound_order_no = :orderNo",
        params("sn", sn, "orderNo", orderNo));
    if (row == null) {
      failOperation(orderNo, "VALIDATE_SN", "admin", "SN 不属于当前入库单: " + sn);
    }
    return row;
  }

  private void updateOrderQuantities(long id, int receivedQty, String status, boolean syncShelvedQty) {
    jdbc.update("""
        UPDATE wms_inbound_order
        SET received_qty = :receivedQty, status = :status
        WHERE id = :id
        """, params("id", id, "receivedQty", receivedQty, "status", status));
    jdbc.update("""
        UPDATE wms_inbound_order_detail
        SET received_qty = :receivedQty,
            shelved_qty = CASE WHEN :syncShelvedQty THEN :receivedQty ELSE shelved_qty END
        WHERE order_id = :id
        """, params("id", id, "receivedQty", receivedQty, "syncShelvedQty", syncShelvedQty));
  }

  private void updateInboundSapSummary(long orderId) {
    Map<String, Object> summary = repo.one("""
        SELECT
          COUNT(*) AS receipt_count,
          SUM(CASE WHEN sap_post_status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
          SUM(CASE WHEN sap_post_status IN ('NOT_POSTED', 'FAILED') THEN 1 ELSE 0 END) AS pending_count
        FROM wms_inbound_receipt
        WHERE inbound_order_id = :orderId
          AND status <> 'CANCELED'
        """, params("orderId", orderId));
    Map<String, Object> latest = repo.one("""
        SELECT sap_post_status, sap_material_doc_no, sap_post_result
        FROM wms_inbound_receipt
        WHERE inbound_order_id = :orderId
          AND status <> 'CANCELED'
        ORDER BY id DESC
        LIMIT 1
        """, params("orderId", orderId));
    int receiptCount = intValue(summary.get("receipt_count"), 0);
    int failedCount = intValue(summary.get("failed_count"), 0);
    int pendingCount = intValue(summary.get("pending_count"), 0);
    String status = receiptCount == 0 ? "NOT_POSTED" : failedCount > 0 ? "FAILED" : pendingCount > 0 ? "NOT_POSTED" : "SUCCESS";
    jdbc.update("""
        UPDATE wms_inbound_order
        SET sap_post_status = :status,
            sap_material_doc_no = :materialDoc,
            sap_post_result = :result
        WHERE id = :orderId
        """, params(
        "orderId", orderId,
        "status", status,
        "materialDoc", latest == null ? "" : nullToEmpty(latest.get("sap_material_doc_no")),
        "result", latest == null ? "" : nullToEmpty(latest.get("sap_post_result"))
    ));
  }

  private int countReceived(String orderNo) {
    return repo.number("""
        SELECT COUNT(*)
        FROM wms_serial_number
        WHERE inbound_order_no = :orderNo AND status IN ('RECEIVED', 'ON_SHELF')
        """, params("orderNo", orderNo)).intValue();
  }

  private String nextReceiptNo() {
    return "RCV" + System.currentTimeMillis();
  }

  private void upsertInventory(Map<String, Object> order, Map<String, Object> location, int qty) {
    Map<String, Object> existing = repo.one("""
        SELECT id
        FROM wms_inventory
        WHERE warehouse_id = :warehouseId
          AND area_id = :areaId
          AND location_id = :locationId
          AND product_id = :productId
          AND batch_no = :batchNo
          AND inventory_status = 'QUALIFIED'
        """, params(
        "warehouseId", order.get("warehouse_id"),
        "areaId", location.get("target_area_id"),
        "locationId", location.get("id"),
        "productId", order.get("product_id"),
        "batchNo", "BATCH-" + LocalDate.now()
    ));
    if (existing == null) {
      jdbc.update("""
          INSERT INTO wms_inventory (
            warehouse_id, area_id, location_id, product_id, owner_code, owner_name, batch_no, inventory_status,
            total_qty, available_qty, allocated_qty, frozen_qty, unqualified_qty, inbound_date, vmi_flag
          ) VALUES (
            :warehouseId, :areaId, :locationId, :productId, :ownerCode, :ownerName, :batchNo, 'QUALIFIED',
            :qty, :qty, 0, 0, 0, CURDATE(), 0
          )
          """, params(
          "warehouseId", order.get("warehouse_id"),
          "areaId", location.get("target_area_id"),
          "locationId", location.get("id"),
          "productId", order.get("product_id"),
          "ownerCode", order.get("owner_code"),
          "ownerName", order.get("owner_name"),
          "batchNo", "BATCH-" + LocalDate.now(),
          "qty", qty
      ));
      return;
    }
    jdbc.update("""
        UPDATE wms_inventory
        SET total_qty = total_qty + :qty,
            available_qty = available_qty + :qty,
            owner_code = COALESCE(owner_code, :ownerCode),
            owner_name = COALESCE(owner_name, :ownerName)
        WHERE id = :id
        """, params("id", existing.get("id"), "qty", qty, "ownerCode", order.get("owner_code"), "ownerName", order.get("owner_name")));
  }

  private void failOperation(String orderNo, String action, String operator, String message) {
    repo.operationLog("INBOUND", orderNo, action, operator(operator), "FAILED", message);
    throw new IllegalArgumentException(message);
  }

  private List<String> cleanSerials(List<String> serials) {
    if (serials == null) {
      return List.of();
    }
    List<String> result = new ArrayList<>();
    for (String sn : serials) {
      if (StringUtils.hasText(sn)) {
        String value = sn.trim();
        if (!result.contains(value)) {
          result.add(value);
        }
      }
    }
    return result;
  }

  private List<String> parseInputSerials(List<String> serials) {
    if (serials == null) {
      return List.of();
    }
    List<String> result = new ArrayList<>();
    for (String sn : serials) {
      if (StringUtils.hasText(sn)) {
        result.add(sn.trim());
      }
    }
    return result;
  }

  private String operator(String operator) {
    return StringUtils.hasText(operator) ? operator : "admin";
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> bodyRows(Map<String, Object> body, String key) {
    Object value = body.get(key);
    if (value instanceof List<?> list) {
      return (List<Map<String, Object>>) list;
    }
    return List.of();
  }

  private Map<String, Object> importResult() {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("successCount", 0);
    result.put("failedCount", 0);
    result.put("errors", new ArrayList<Map<String, Object>>());
    return result;
  }

  @SuppressWarnings("unchecked")
  private void importError(Map<String, Object> result, int rowNo, String reason) {
    ((List<Map<String, Object>>) result.get("errors")).add(Map.of("rowNo", rowNo, "reason", reason));
  }

  private void incrementSuccess(Map<String, Object> result) {
    result.put("successCount", ((Number) result.get("successCount")).intValue() + 1);
  }

  @SuppressWarnings("unchecked")
  private void finishImportResult(Map<String, Object> result) {
    result.put("failedCount", ((List<Map<String, Object>>) result.get("errors")).size());
  }

  private String firstMissing(List<List<String>> checks) {
    for (List<String> check : checks) {
      if (!StringUtils.hasText(check.get(0))) {
        return check.get(1);
      }
    }
    return null;
  }

  private String cell(Map<String, Object> row, String... keys) {
    for (String key : keys) {
      Object value = row.get(key);
      if (value != null && StringUtils.hasText(String.valueOf(value))) {
        return String.valueOf(value).trim();
      }
    }
    return "";
  }

  private String value(Map<String, Object> row, String key) {
    Object value = row.get(key);
    return value == null ? "" : String.valueOf(value);
  }

  private List<String> inboundImportHeaderColumns() {
    return List.of("入库单号", "入库类型", "来源系统", "来源单号", "货主编码", "货主名称", "入库仓库编码", "入库仓库名称", "出库国家", "SAP 工厂", "计划到货日期", "备注");
  }

  private List<String> inboundImportLineColumns() {
    return List.of("入库单号", "行号", "产品编码", "产品名称", "SAP 工厂", "SAP 库存地点", "批次号", "计划数量", "质量状态", "备注");
  }

  private List<String> inboundExportHeaderColumns() {
    return List.of("入库单号", "入库类型", "来源系统", "来源单号", "货主编码", "货主名称", "入库仓库编码", "入库仓库名称", "出库国家", "SAP 工厂", "产品行数", "计划总数量", "已采集数量", "待收货数量", "已收货数量", "已上架数量", "订单状态", "SAP 回传状态", "回传结果", "创建时间");
  }

  private List<String> inboundExportLineColumns() {
    return List.of("入库单号", "行号", "产品编码", "产品名称", "SN 管理", "SAP 工厂", "SAP 库存地点", "批次号", "计划数量", "已采集数量", "待收货数量", "已收货数量", "已上架数量", "行状态");
  }

  private Map<String, Object> inboundExportParams(Map<String, Object> query) {
    return params(
        "orderNo", repo.like(String.valueOf(query.getOrDefault("orderNo", ""))),
        "sourceOrderNo", repo.like(String.valueOf(query.getOrDefault("sourceOrderNo", ""))),
        "inboundType", repo.like(String.valueOf(query.getOrDefault("inboundType", ""))),
        "warehouseCode", repo.like(String.valueOf(query.getOrDefault("warehouseCode", ""))),
        "owner", repo.like(String.valueOf(query.getOrDefault("owner", ""))),
        "sapPostStatus", repo.like(String.valueOf(query.getOrDefault("sapPostStatus", ""))),
        "createdStart", blankToNull(query.get("createdStart")),
        "createdEnd", blankToNull(query.get("createdEnd")),
        "status", repo.like(String.valueOf(query.getOrDefault("status", "")))
    );
  }

  private Object blankToNull(Object value) {
    return value == null || !StringUtils.hasText(String.valueOf(value)) ? null : value;
  }

  private String parseInboundType(String value) {
    String text = value == null ? "" : value.trim();
    return switch (text.toUpperCase()) {
      case "PRODUCTION" -> "PRODUCTION";
      case "STOCKING" -> "STOCKING";
      case "RMA" -> "RMA";
      case "TRANSFER" -> "TRANSFER";
      case "SUPPLIER_VMI" -> "SUPPLIER_VMI";
      case "OTHER" -> "OTHER";
      default -> switch (text) {
        case "生产入库" -> "PRODUCTION";
        case "备货入库" -> "STOCKING";
        case "售后 RMA 入库" -> "RMA";
        case "调拨入库" -> "TRANSFER";
        case "供应商 VMI 入库" -> "SUPPLIER_VMI";
        case "其他入库" -> "OTHER";
        default -> "";
      };
    };
  }

  private String inboundTypeName(String value) {
    return switch (value == null ? "" : value) {
      case "PRODUCTION" -> "生产入库";
      case "STOCKING" -> "备货入库";
      case "RMA" -> "售后 RMA 入库";
      case "TRANSFER" -> "调拨入库";
      case "SUPPLIER_VMI" -> "供应商 VMI 入库";
      case "OTHER" -> "其他入库";
      default -> value == null ? "" : value;
    };
  }

  private String inboundStatusName(String value) {
    return switch (value == null ? "" : value) {
      case "CREATED" -> "创建";
      case "PARTIAL_RECEIVED" -> "部分收货";
      case "RECEIVED" -> "完全收货";
      case "ON_SHELF" -> "已上架";
      case "CLOSED" -> "已关闭";
      case "CANCELED" -> "已取消";
      default -> value == null ? "" : value;
    };
  }

  private String sapStatusName(String value) {
    return switch (value == null ? "" : value) {
      case "NOT_POSTED" -> "未回传";
      case "POSTED" -> "已回传";
      case "SUCCESS" -> "回传成功";
      case "FAILED" -> "回传失败";
      default -> value == null ? "" : value;
    };
  }

  private String yesNo(Object value) {
    if (value instanceof Number number) {
      return number.intValue() == 1 ? "是" : "否";
    }
    return "1".equals(String.valueOf(value)) ? "是" : "否";
  }

  private String firstText(String value, String fallback) {
    return StringUtils.hasText(value) ? value : fallback;
  }

  private String nullToEmpty(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String nextOrderNo() {
    return "IN" + System.currentTimeMillis();
  }

  private int intValue(Object value, int defaultValue) {
    if (value == null) {
      return defaultValue;
    }
    if (value instanceof Number number) {
      return number.intValue();
    }
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return defaultValue;
    }
  }

  private Map<String, Object> params(Object... values) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < values.length; i += 2) {
      map.put(String.valueOf(values[i]), values[i + 1]);
    }
    return map;
  }
}
