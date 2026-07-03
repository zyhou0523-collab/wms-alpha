package com.company.wms.outbound;

import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ShippingOrderService {
  private static final DateTimeFormatter COMPACT_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  public ShippingOrderService(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
  }

  public PageResult<Map<String, Object>> orders(Map<String, Object> query) {
    Map<String, Object> params = new HashMap<>();
    params.put("orderNo", repo.like(text(query, "orderNo", "shipmentOrderNo", "outboundOrderNo")));
    params.put("orderType", normalizeOrderType(text(query, "orderType", "outboundType")));
    params.put("status", repo.like(text(query, "status", "shipmentStatus")));
    params.put("warehouseCode", repo.like(text(query, "warehouseCode")));
    params.put("owner", repo.like(text(query, "ownerCode", "owner")));
    params.put("consignee", repo.like(text(query, "consigneeCode", "customerCode")));
    params.put("relatedOrderNo", repo.like(text(query, "relatedOrderNo", "sourceOrderNo")));
    params.put("salesOrderNo", repo.like(text(query, "salesOrderNo")));
    params.put("sapPostStatus", repo.like(text(query, "sapPostStatus")));
    int pageNum = intValue(query.get("pageNum"), 1);
    int pageSize = intValue(query.get("pageSize"), 10);
    String from = """
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_warehouse tw ON tw.id = o.target_warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        WHERE (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:orderType IS NULL OR o.outbound_type = :orderType)
          AND (:status IS NULL OR o.status LIKE :status)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR o.owner_code LIKE :owner OR o.owner_name LIKE :owner)
          AND (:consignee IS NULL OR c.customer_code LIKE :consignee OR c.customer_name LIKE :consignee OR o.consignee_code LIKE :consignee)
          AND (:relatedOrderNo IS NULL OR o.related_order_no LIKE :relatedOrderNo OR o.source_order_no LIKE :relatedOrderNo)
          AND (:salesOrderNo IS NULL OR o.sales_order_no LIKE :salesOrderNo)
          AND (:sapPostStatus IS NULL OR o.sap_post_status LIKE :sapPostStatus)
          AND COALESCE(o.deleted_flag, 0) = 0
        """;
    PageResult<Map<String, Object>> page = repo.page(
        """
        SELECT o.*, o.order_no AS shipment_order_no,
               o.outbound_type AS order_type,
               w.warehouse_code, w.warehouse_name,
               tw.warehouse_code AS target_warehouse_code,
               tw.warehouse_name AS target_warehouse_name,
               COALESCE(o.consignee_code, c.customer_code) AS consignee_code,
               COALESCE(o.consignee_name, c.customer_name) AS consignee_name,
               COALESCE(o.carrier_name, o.logistics_company) AS carrier_name,
               COALESCE(o.related_order_no, o.source_order_no) AS related_order_no
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    );
    page.items().forEach(row -> row.put("lines", lines(((Number) row.get("id")).longValue())));
    return page;
  }

  public Map<String, Object> detail(long id) {
    Map<String, Object> order = requireOrder(id);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("order", order);
    data.put("lines", lines(id));
    data.put("details", lines(id));
    data.put("allocations", allocations(id));
    data.put("pickingTasks", pickingTasks(id));
    data.put("pickingRecords", repo.query("""
        SELECT r.*, l.location_code
        FROM wms_picking_record r
        LEFT JOIN wms_location l ON l.id = r.location_id
        WHERE r.outbound_order_id = :id
        ORDER BY r.id DESC
        """, params("id", id)));
    data.put("shipments", repo.query("""
        SELECT *
        FROM wms_shipment_record
        WHERE outbound_order_id = :id
        ORDER BY id DESC
        """, params("id", id)));
    data.put("interfaceLogs", interfaceLogRows(order));
    data.put("shipmentRecords", data.get("shipments"));
    data.put("sapLogs", data.get("interfaceLogs"));
    data.put("operationLogs", repo.query("""
        SELECT *
        FROM wms_operation_log
        WHERE business_doc_no = :orderNo
        ORDER BY id DESC
        LIMIT 50
        """, params("orderNo", order.get("order_no"))));
    data.put("exceptions", repo.query("""
        SELECT *
        FROM wms_outbound_exception
        WHERE outbound_order_id = :id OR outbound_order_no = :orderNo
        ORDER BY id DESC
        LIMIT 50
        """, params("id", id, "orderNo", order.get("order_no"))));
    data.put("statusFlow", repo.query("""
        SELECT *
        FROM wms_outbound_status_history
        WHERE outbound_order_id = :id
        ORDER BY id ASC
        """, params("id", id)));
    return data;
  }

  @Transactional
  public Map<String, Object> create(Map<String, Object> body) {
    String orderType = normalizeOrderType(firstText(text(body, "orderType", "outboundType"), "SALES_OUTBOUND"));
    Map<String, Object> warehouse = requireWarehouse(firstText(text(body, "warehouseCode"), "WH-HZ-CENTRAL"));
    Map<String, Object> targetWarehouse = null;
    if (isTransfer(orderType)) {
      targetWarehouse = requireWarehouse(firstText(text(body, "targetWarehouseCode"), "WH-SH-REGION"));
    }
    Map<String, Object> consignee = null;
    String consigneeCode = text(body, "consigneeCode", "customerCode");
    if (StringUtils.hasText(consigneeCode)) {
      consignee = requireCustomer(consigneeCode);
    }
    List<Map<String, Object>> inputLines = inputLines(body);
    if (inputLines.isEmpty()) {
      inputLines.add(Map.of(
          "lineNo", 10,
          "productCode", firstText(text(body, "productCode"), "GT3-10KD1R11004"),
          "orderQty", intValue(body.getOrDefault("qty", body.get("orderQty")), 1)
      ));
    }
    String orderNo = firstText(text(body, "shipmentOrderNo", "outboundOrderNo", "orderNo"), nextNo(prefixFor(orderType)));
    String relatedOrderNo = firstText(text(body, "relatedOrderNo", "sourceOrderNo"), orderNo);
    String sourceSystem = firstText(text(body, "sourceSystem"), isTransfer(orderType) ? "SAP" : "FULFILLMENT");
    String ownerCode = firstText(text(body, "ownerCode"), "3060");
    String ownerName = firstText(text(body, "ownerName"), "杭州利沃得");
    int plannedQty = inputLines.stream().mapToInt(row -> intValue(row.getOrDefault("orderQty", row.get("plannedQty")), 0)).sum();

    jdbc.update("""
        INSERT INTO wms_outbound_order (
          order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
          planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, status,
          owner_code, owner_name, consignee_code, consignee_name, expected_ship_time,
          related_order_no, sales_order_no, rework_order_no, target_owner_code, target_owner_name,
          required_delivery_time, carrier_name, tracking_no, sap_post_status, sap_post_result,
          parent_order_no, split_flag, remark
        ) VALUES (
          :orderNo, :sourceOrderNo, :sourceSystem, :orderType, :warehouseId, :targetWarehouseId, :customerId,
          :plannedQty, 0, 0, 0, 0, 'CREATED',
          :ownerCode, :ownerName, :consigneeCode, :consigneeName, :expectedShipTime,
          :relatedOrderNo, :salesOrderNo, :reworkOrderNo, :targetOwnerCode, :targetOwnerName,
          :requiredDeliveryTime, :carrierName, :trackingNo, 'NOT_POSTED', '',
          :parentOrderNo, :splitFlag, :remark
        )
        """, params(
        "orderNo", orderNo,
        "sourceOrderNo", relatedOrderNo,
        "sourceSystem", sourceSystem,
        "orderType", orderType,
        "warehouseId", warehouse.get("id"),
        "targetWarehouseId", targetWarehouse == null ? null : targetWarehouse.get("id"),
        "customerId", consignee == null ? null : consignee.get("id"),
        "plannedQty", plannedQty,
        "ownerCode", ownerCode,
        "ownerName", ownerName,
        "consigneeCode", consignee == null ? consigneeCode : consignee.get("customer_code"),
        "consigneeName", firstText(text(body, "consigneeName", "customerName"), consignee == null ? "" : String.valueOf(consignee.get("customer_name"))),
        "expectedShipTime", text(body, "expectedShipTime"),
        "relatedOrderNo", relatedOrderNo,
        "salesOrderNo", text(body, "salesOrderNo"),
        "reworkOrderNo", text(body, "reworkOrderNo"),
        "targetOwnerCode", text(body, "targetOwnerCode"),
        "targetOwnerName", text(body, "targetOwnerName"),
        "requiredDeliveryTime", text(body, "requiredDeliveryTime"),
        "carrierName", text(body, "carrierName"),
        "trackingNo", text(body, "trackingNo"),
        "parentOrderNo", text(body, "parentOrderNo"),
        "splitFlag", bool(body.get("splitFlag")) ? 1 : 0,
        "remark", text(body, "remark")
    ));
    long orderId = repo.number("SELECT id FROM wms_outbound_order WHERE order_no = :orderNo", params("orderNo", orderNo)).longValue();
    for (int i = 0; i < inputLines.size(); i++) {
      Map<String, Object> line = inputLines.get(i);
      Map<String, Object> product = requireProduct(firstText(text(line, "productCode"), text(body, "productCode")), ownerCode);
      int lineNo = intValue(line.get("lineNo"), (i + 1) * 10);
      int qty = intValue(line.getOrDefault("orderQty", line.get("plannedQty")), 1);
      jdbc.update("""
          INSERT INTO wms_outbound_order_detail (
            order_id, line_no, product_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
            batch_no, sap_plant, unit, sn_required, status
          ) VALUES (
            :orderId, :lineNo, :productId, :qty, 0, 0, 0, 0,
            :batchNo, :sapPlant, :unit, :snRequired, 'CREATED'
          )
          """, params(
          "orderId", orderId,
          "lineNo", lineNo,
          "productId", product.get("id"),
          "qty", qty,
          "batchNo", firstText(text(line, "batchNo"), "BATCH-OUT-" + orderNo + "-" + lineNo),
          "sapPlant", firstText(text(line, "sapPlant"), ownerCode),
          "unit", firstText(text(line, "unit"), firstText(String.valueOf(product.get("unit")), "PCS")),
          "snRequired", line.containsKey("snRequired") ? (bool(line.get("snRequired")) ? 1 : 0) : intValue(product.get("sn_managed"), 0)
      ));
    }
    logStatus(orderId, orderNo, null, "CREATED", "CREATE_SHIPPING_ORDER", operator(body), "创建发运订单");
    repo.operationLog("OUTBOUND", orderNo, "CREATE_SHIPPING_ORDER", operator(body), "SUCCESS", "创建发运订单 " + inputLines.size() + " 行");
    repo.interfaceLog(isTransfer(orderType) ? "SAP_STO_PUSH" : "FULFILLMENT_ORDER_PUSH", sourceSystem, "WMS", orderNo,
        isTransfer(orderType) ? "/api/mock/sap/sto-orders" : "/api/mock/fulfillment/outbound-orders",
        Map.of("shipmentOrderNo", orderNo, "orderType", orderType, "lines", inputLines),
        Map.of("status", "CREATED"), "SUCCESS", null);
    refreshOrder(orderId);
    return detail(orderId);
  }

  @Transactional
  public Map<String, Object> allocateAuto(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundAllocatable(order, operator(body));
    List<Map<String, Object>> lines = lines(id);
    int allocated = 0;
    int shortage = 0;
    for (Map<String, Object> line : lines) {
      int need = Math.max(intValue(line.get("order_qty"), 0) - intValue(line.get("allocated_qty"), 0), 0);
      if (need <= 0) continue;
      if (bool(line.get("sn_required"))) {
        List<Map<String, Object>> candidates = snCandidates(order, line, need);
        if (candidates.size() < need) shortage += need - candidates.size();
        for (Map<String, Object> candidate : candidates) {
          createAllocation(order, line, candidate, 1, "AUTO_FIFO", "ALLOCATED");
          allocated++;
        }
      } else {
        int remain = need;
        for (Map<String, Object> inv : nonSnCandidates(order, line)) {
          if (remain <= 0) break;
          int qty = Math.min(remain, intValue(inv.get("available_qty"), 0));
          createAllocation(order, line, inv, qty, "AUTO_FIFO", "ALLOCATED");
          allocated += qty;
          remain -= qty;
        }
        shortage += remain;
      }
    }
    refreshOrder(id);
    Map<String, Object> refreshed = requireOrder(id);
    if (shortage > 0) {
      registerException(id, String.valueOf(order.get("order_no")), null, null, "INSUFFICIENT_STOCK",
          "可用库存不足，缺口 " + shortage, operator(body));
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_AUTO", operator(body), "FAILED", "部分分配，缺口 " + shortage);
    } else {
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_AUTO", operator(body), "SUCCESS", "自动 FIFO 分配 " + allocated);
    }
    logStatus(id, String.valueOf(order.get("order_no")), String.valueOf(order.get("status")), String.valueOf(refreshed.get("status")),
        "ALLOCATE_AUTO", operator(body), shortage > 0 ? "库存不足，已生成异常记录" : "自动分配完成");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> allocateManual(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundAllocatable(order, operator(body));
    Map<String, Object> line = requireLine(id, longValue(body.get("lineId"), 0));
    List<String> serials = cleanSerials(body.get("serialNumbers"));
    int allocated = 0;
    if (!serials.isEmpty()) {
      for (String sn : serials) {
        Map<String, Object> candidate = requireAllocatableSn(order, line, sn);
        createAllocation(order, line, candidate, 1, "MANUAL", "ALLOCATED");
        allocated++;
      }
    } else {
      int qty = intValue(body.get("quantity"), 0);
      if (qty <= 0) throw new IllegalArgumentException("请输入人工指定数量或 SN");
      Map<String, Object> inv = requireAllocatableInventory(order, line, text(body, "locationCode"), longValue(body.get("inventoryId"), 0));
      if (intValue(inv.get("available_qty"), 0) < qty) throw new IllegalArgumentException("指定库存可用数量不足");
      createAllocation(order, line, inv, qty, "MANUAL", "ALLOCATED");
      allocated = qty;
    }
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_MANUAL", operator(body), "SUCCESS", "人工指定分配 " + allocated);
    return detail(id);
  }

  @Transactional
  public Map<String, Object> releaseAllocation(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundAllocationCancelable(order, operator(body));
    List<Map<String, Object>> rows = repo.query("""
        SELECT * FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status = 'ALLOCATED'
        """, params("id", id));
    for (Map<String, Object> row : rows) {
      int qty = intValue(row.get("allocated_qty"), 1);
      jdbc.update("""
          UPDATE wms_inventory
          SET available_qty = available_qty + :qty,
              allocated_qty = GREATEST(allocated_qty - :qty, 0)
          WHERE id = :inventoryId
          """, params("qty", qty, "inventoryId", row.get("inventory_id")));
      if (StringUtils.hasText(text(row, "sn_code"))) {
        jdbc.update("""
            UPDATE wms_serial_number
            SET status = 'ON_SHELF', locked_flag = 0, locked_order_no = NULL, outbound_order_no = NULL
            WHERE sn_code = :sn
            """, params("sn", row.get("sn_code")));
      }
    }
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'CANCELED'
        WHERE outbound_order_id = :id AND allocation_status = 'ALLOCATED'
        """, params("id", id));
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "RELEASE_ALLOCATION", operator(body), "SUCCESS", "取消未拣货分配");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> cancelAllocations(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundAllocationCancelable(order, operator(body));
    List<Long> ids = numberList(body.get("allocationIds"));
    if (ids.isEmpty()) throw new IllegalArgumentException("请选择需要取消的分配记录");
    List<Map<String, Object>> failedItems = new ArrayList<>();
    int successCount = 0;
    for (Long allocationId : ids) {
      try {
        Map<String, Object> row = repo.one("""
            SELECT *
            FROM wms_inventory_allocation
            WHERE id = :allocationId AND outbound_order_id = :orderId
            """, params("allocationId", allocationId, "orderId", id));
        if (row == null) throw new IllegalArgumentException("分配记录不存在");
        if (!"ALLOCATED".equals(String.valueOf(row.get("allocation_status")))) {
          throw new IllegalArgumentException("仅允许取消未拣货分配记录");
        }
        int qty = intValue(row.get("allocated_qty"), 1);
        jdbc.update("""
            UPDATE wms_inventory
            SET available_qty = available_qty + :qty,
                allocated_qty = GREATEST(allocated_qty - :qty, 0)
            WHERE id = :inventoryId
            """, params("qty", qty, "inventoryId", row.get("inventory_id")));
        if (StringUtils.hasText(text(row, "sn_code"))) {
          jdbc.update("""
              UPDATE wms_serial_number
              SET status = 'ON_SHELF',
                  locked_flag = 0,
                  locked_order_no = NULL,
                  outbound_order_no = NULL
              WHERE sn_code = :sn
              """, params("sn", row.get("sn_code")));
        }
        jdbc.update("""
            UPDATE wms_inventory_allocation
            SET allocation_status = 'CANCELED'
            WHERE id = :allocationId
            """, params("allocationId", allocationId));
        repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_ALLOCATION_DETAIL", operator(body), "SUCCESS",
            "取消分配记录 " + row.get("allocation_no"));
        successCount++;
      } catch (Exception ex) {
        failedItems.add(Map.of("id", allocationId, "reason", String.valueOf(ex.getMessage())));
      }
    }
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_ALLOCATION", operator(body),
        failedItems.isEmpty() ? "SUCCESS" : "PARTIAL_SUCCESS",
        "批量取消分配，成功 " + successCount + " 条，失败 " + failedItems.size() + " 条");
    return Map.of("successCount", successCount, "failedItems", failedItems);
  }

  public Map<String, Object> allocationView(long id) {
    return Map.of(
        "order", requireOrder(id),
        "lines", lines(id),
        "allocations", allocations(id),
        "availableInventory", allocationCandidates(id).get("items"),
        "recommendedInventory", allocationCandidates(id).get("recommended")
    );
  }

  public Map<String, Object> allocationCandidates(long id) {
    Map<String, Object> order = requireOrder(id);
    List<Map<String, Object>> items = new ArrayList<>();
    List<Map<String, Object>> recommended = new ArrayList<>();
    for (Map<String, Object> line : lines(id)) {
      if (bool(line.get("sn_required"))) {
        List<Map<String, Object>> candidates = snCandidates(order, line, 80);
        items.addAll(candidates);
        int need = Math.max(intValue(line.get("order_qty"), 0) - intValue(line.get("allocated_qty"), 0), 0);
        recommended.addAll(candidates.stream().limit(need).toList());
      } else {
        List<Map<String, Object>> candidates = nonSnCandidates(order, line);
        items.addAll(candidates);
        recommended.addAll(candidates);
      }
    }
    return Map.of("items", items, "recommended", recommended);
  }

  @Transactional
  public Map<String, Object> generatePicking(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundPickable(order, operator(body));
    for (Map<String, Object> line : lines(id)) {
      if (repo.number("""
          SELECT COUNT(*) FROM wms_picking_task
          WHERE outbound_order_id = :orderId AND product_id = :productId
          """, params("orderId", id, "productId", line.get("product_id"))).intValue() > 0) {
        continue;
      }
      jdbc.update("""
          INSERT INTO wms_picking_task (
            task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker
          ) VALUES (
            :taskNo, :orderId, :orderNo, :warehouseId, :locationId, :productId, :planQty, 0, 'PENDING', :picker
          )
          """, params(
          "taskNo", nextNo("PICK"),
          "orderId", id,
          "orderNo", order.get("order_no"),
          "warehouseId", order.get("warehouse_id"),
          "locationId", defaultLocationId(order, line),
          "productId", line.get("product_id"),
          "planQty", Math.max(intValue(line.get("order_qty"), 0) - intValue(line.get("picked_qty"), 0), 0),
          "picker", operator(body)
      ));
    }
    updateHeaderStatus(id, "GENERATE_PICKING", operator(body), "生成拣货任务");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> pick(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundPickable(order, operator(body));
    Map<String, Object> line = requireLine(id, longValue(body.get("lineId"), 0));
    List<String> serials = cleanSerials(firstText(text(body, "scanCode", "snCode"), ""));
    serials.addAll(cleanSerials(body.get("serialNumbers")));
    if (bool(line.get("sn_required"))) {
      if (serials.isEmpty()) throw new IllegalArgumentException("SN 管理产品必须扫描 SN");
      for (String sn : serials) {
        pickSn(order, line, sn, operator(body));
      }
    } else {
      int qty = intValue(body.get("quantity"), 0);
      if (qty <= 0) throw new IllegalArgumentException("非 SN 产品请输入拣货数量");
      pickNonSn(order, line, qty, text(body, "locationCode"), operator(body));
    }
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "PICK", operator(body), "SUCCESS", "发运订单拣货");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> ship(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundShippable(order, operator(body));
    Long lineId = longValue(body.get("lineId"), 0) > 0 ? longValue(body.get("lineId"), 0) : null;
    List<Map<String, Object>> rows = repo.query("""
        SELECT *
        FROM wms_inventory_allocation
        WHERE outbound_order_id = :id
          AND (:lineId IS NULL OR outbound_detail_id = :lineId)
          AND allocation_status IN ('PICKED', 'REVIEWED')
        ORDER BY id
        """, params("id", id, "lineId", lineId));
    if (rows.isEmpty()) throw new IllegalArgumentException("没有已拣货未发运数据");
    int requestedQty = intValue(body.get("shipQty"), 0);
    int availableToShip = rows.stream().mapToInt(row -> intValue(row.get("allocated_qty"), 1)).sum();
    if (requestedQty > availableToShip) {
      throw new IllegalArgumentException("本次发货数量不能超过已拣货未发货数量。");
    }
    int shippedQty = 0;
    String shipmentNo = nextNo("SHP");
    String carrier = firstText(text(body, "carrierName", "carrier"), "SF");
    String trackingNo = firstText(text(body, "trackingNo"), "SF" + System.currentTimeMillis());
    String shipper = firstText(text(body, "shipper"), operator(body));
    jdbc.update("""
        INSERT INTO wms_shipment_record (
          shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark
        ) VALUES (
          :shipmentNo, :id, :orderNo, :carrier, :trackingNo, 0, :shipper, NOW(), :remark
        )
        """, params("shipmentNo", shipmentNo, "id", id, "orderNo", order.get("order_no"),
        "carrier", carrier, "trackingNo", trackingNo, "shipper", shipper, "remark", text(body, "remark")));
    long shipmentId = repo.number("SELECT id FROM wms_shipment_record WHERE shipment_no = :shipmentNo", params("shipmentNo", shipmentNo)).longValue();
    for (Map<String, Object> row : rows) {
      if (requestedQty > 0 && shippedQty >= requestedQty) break;
      int rowQty = intValue(row.get("allocated_qty"), 1);
      if (requestedQty > 0) rowQty = Math.min(rowQty, requestedQty - shippedQty);
      if (rowQty < intValue(row.get("allocated_qty"), 1)) {
        row = splitAllocationForShipment(row, rowQty);
      }
      shipAllocation(order, shipmentId, row, rowQty, shipper);
      shippedQty += rowQty;
    }
    jdbc.update("""
        UPDATE wms_shipment_record
        SET shipped_qty = :qty
        WHERE id = :shipmentId
        """, params("qty", shippedQty, "shipmentId", shipmentId));
    jdbc.update("""
        UPDATE wms_outbound_order
        SET logistics_company = :carrier,
            carrier_name = :carrier,
            tracking_no = :trackingNo,
            shipper = :shipper,
            ship_time = NOW()
        WHERE id = :id
        """, params("id", id, "carrier", carrier, "trackingNo", trackingNo, "shipper", shipper));
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SHIP", shipper, "SUCCESS", "发运确认 " + shippedQty);
    tracePost(id, bool(body.get("forceTraceFail")), shipper);
    sapPost(id, bool(body.get("forceSapFail")), shipper, shipmentNo);
    return detail(id);
  }

  @Transactional
  public Map<String, Object> cancelPick(long id, long pickId, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundPickCancelable(order, operator(body));
    Map<String, Object> record = repo.one("""
        SELECT *
        FROM wms_picking_record
        WHERE id = :pickId AND outbound_order_id = :orderId
        """, params("pickId", pickId, "orderId", id));
    if (record == null) throw new IllegalArgumentException("拣货记录不存在");
    if ("CANCELED".equals(String.valueOf(record.get("result")))) {
      throw new IllegalArgumentException("拣货记录已取消，请勿重复操作");
    }
    String sn = text(record, "sn_code");
    long allocationId = allocationIdFromPickSn(sn);
    Map<String, Object> allocation = allocationId > 0
        ? repo.one("SELECT * FROM wms_inventory_allocation WHERE id = :id AND outbound_order_id = :orderId",
            params("id", allocationId, "orderId", id))
        : repo.one("""
            SELECT *
            FROM wms_inventory_allocation
            WHERE outbound_order_id = :orderId
              AND sn_code = :sn
              AND allocation_status IN ('PICKED', 'REVIEWED')
            ORDER BY id DESC
            LIMIT 1
            """, params("orderId", id, "sn", sn));
    if (allocation == null || !"PICKED".equals(String.valueOf(allocation.get("allocation_status")))) {
      throw new IllegalArgumentException("当前拣货记录已发货或不在可取消拣货状态");
    }
    int qty = intValue(allocation.get("allocated_qty"), 1);
    String mode = String.valueOf(allocation.get("allocation_mode"));
    if ("DIRECT_PICK".equals(mode)) {
      jdbc.update("""
          UPDATE wms_inventory
          SET available_qty = available_qty + :qty,
              allocated_qty = GREATEST(allocated_qty - :qty, 0)
          WHERE id = :inventoryId
          """, params("qty", qty, "inventoryId", allocation.get("inventory_id")));
      jdbc.update("""
          UPDATE wms_inventory_allocation
          SET allocation_status = 'CANCELED'
          WHERE id = :id
          """, params("id", allocation.get("id")));
      if (StringUtils.hasText(text(allocation, "sn_code"))) {
        jdbc.update("""
            UPDATE wms_serial_number
            SET status = 'ON_SHELF',
                locked_flag = 0,
                locked_order_no = NULL,
                outbound_order_no = NULL
            WHERE sn_code = :sn
            """, params("sn", allocation.get("sn_code")));
      }
    } else {
      jdbc.update("""
          UPDATE wms_inventory_allocation
          SET allocation_status = 'ALLOCATED',
              picker = NULL,
              picked_at = NULL
          WHERE id = :id
          """, params("id", allocation.get("id")));
      if (StringUtils.hasText(text(allocation, "sn_code"))) {
        jdbc.update("""
            UPDATE wms_serial_number
            SET status = 'ALLOCATED',
                locked_flag = 1,
                locked_order_no = :orderNo
            WHERE sn_code = :sn
            """, params("orderNo", order.get("order_no"), "sn", allocation.get("sn_code")));
      }
    }
    jdbc.update("""
        UPDATE wms_picking_record
        SET result = 'CANCELED',
            error_message = :reason
        WHERE id = :pickId
        """, params("pickId", pickId, "reason", firstText(text(body, "reason"), "取消拣货")));
    refreshOrder(id);
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_PICK", operator(body), "SUCCESS",
        "取消拣货记录 " + record.get("task_no"));
    return detail(id);
  }

  public Map<String, Object> cancelPicks(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    List<Long> ids = numberList(body.get("pickIds"));
    if (ids.isEmpty()) throw new IllegalArgumentException("请选择需要取消的拣货记录");
    List<Map<String, Object>> failedItems = new ArrayList<>();
    int successCount = 0;
    for (Long pickId : ids) {
      try {
        cancelPick(id, pickId, body);
        successCount++;
      } catch (Exception ex) {
        failedItems.add(Map.of("id", pickId, "reason", String.valueOf(ex.getMessage())));
      }
    }
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_PICK_BATCH", operator(body),
        failedItems.isEmpty() ? "SUCCESS" : "PARTIAL_SUCCESS",
        "批量取消拣货，成功 " + successCount + " 条，失败 " + failedItems.size() + " 条");
    return Map.of("successCount", successCount, "failedItems", failedItems);
  }

  @Transactional
  public Map<String, Object> cancelShipment(long id, long shipmentId, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundShipCancelable(order, operator(body));
    Map<String, Object> shipment = repo.one("""
        SELECT *
        FROM wms_shipment_record
        WHERE id = :shipmentId AND outbound_order_id = :orderId
        """, params("shipmentId", shipmentId, "orderId", id));
    if (shipment == null) throw new IllegalArgumentException("发货批次不存在");
    if ("CANCELED".equals(String.valueOf(shipment.get("shipment_status")))) {
      throw new IllegalArgumentException("发货批次已取消，请勿重复操作");
    }
    int postedLines = repo.number("""
        SELECT COUNT(*)
        FROM outbound_shipment_line
        WHERE shipment_id = :shipmentId
          AND sap_post_status IN ('SUCCESS', 'POSTED')
        """, params("shipmentId", shipmentId)).intValue();
    if (List.of("SUCCESS", "POSTED").contains(String.valueOf(shipment.get("sap_post_status"))) || postedLines > 0) {
      throw new IllegalArgumentException("当前发货批次已回传 SAP 成功，不允许直接取消发货，请走 SAP 冲销流程。");
    }

    List<Map<String, Object>> shipLines = repo.query("""
        SELECT *
        FROM outbound_shipment_line
        WHERE shipment_id = :shipmentId
        ORDER BY id
        """, params("shipmentId", shipmentId));
    for (Map<String, Object> shipLine : shipLines) {
      int remaining = intValue(shipLine.get("ship_qty"), 0);
      List<String> serials = repo.query("""
          SELECT sn_code
          FROM outbound_shipment_sn
          WHERE shipment_line_id = :shipmentLineId
          ORDER BY id
          """, params("shipmentLineId", shipLine.get("id"))).stream()
          .map(row -> String.valueOf(row.get("sn_code")))
          .toList();
      List<Map<String, Object>> allocations = serials.isEmpty()
          ? repo.query("""
              SELECT *
              FROM wms_inventory_allocation
              WHERE outbound_order_id = :orderId
                AND outbound_detail_id = :lineId
                AND allocation_status = 'SHIPPED'
              ORDER BY id DESC
              """, params("orderId", id, "lineId", shipLine.get("outbound_order_line_id")))
          : repo.query("""
              SELECT *
              FROM wms_inventory_allocation
              WHERE outbound_order_id = :orderId
                AND outbound_detail_id = :lineId
                AND sn_code IN (:serials)
                AND allocation_status = 'SHIPPED'
              ORDER BY id DESC
              """, params("orderId", id, "lineId", shipLine.get("outbound_order_line_id"), "serials", serials));
      for (Map<String, Object> allocation : allocations) {
        if (remaining <= 0) break;
        int qty = Math.min(remaining, intValue(allocation.get("allocated_qty"), 1));
        rollbackShipmentAllocation(order, allocation, qty, operator(body));
        remaining -= qty;
      }
    }
    jdbc.update("""
        UPDATE outbound_shipment_line
        SET sap_post_status = 'CANCELED',
            sap_post_result = :reason
        WHERE shipment_id = :shipmentId
        """, params("shipmentId", shipmentId, "reason", firstText(text(body, "reason"), "取消发货")));
    jdbc.update("""
        UPDATE wms_shipment_record
        SET shipment_status = 'CANCELED',
            sap_post_status = 'CANCELED',
            sap_post_result = :reason,
            remark = :remark
        WHERE id = :shipmentId
        """, params("shipmentId", shipmentId, "reason", firstText(text(body, "reason"), "取消发货"),
        "remark", firstText(text(body, "reason"), "取消发货")));
    refreshOrder(id);
    Map<String, Object> refreshed = requireOrder(id);
    if (intValue(refreshed.get("shipped_qty"), 0) == 0 && !List.of("SUCCESS", "POSTED").contains(String.valueOf(refreshed.get("sap_post_status")))) {
      jdbc.update("UPDATE wms_outbound_order SET sap_post_status = 'NOT_POSTED', sap_post_result = '' WHERE id = :id", params("id", id));
    }
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_SHIPMENT", operator(body), "SUCCESS",
        "取消发货批次 " + shipment.get("shipment_no"));
    return detail(id);
  }

  public Map<String, Object> cancelShipments(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    List<Long> ids = numberList(body.get("shipmentIds"));
    if (ids.isEmpty()) throw new IllegalArgumentException("请选择需要取消的发货记录");
    List<Map<String, Object>> failedItems = new ArrayList<>();
    int successCount = 0;
    for (Long shipmentId : ids) {
      try {
        cancelShipment(id, shipmentId, body);
        successCount++;
      } catch (Exception ex) {
        failedItems.add(Map.of("id", shipmentId, "reason", String.valueOf(ex.getMessage())));
      }
    }
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_SHIPMENT_BATCH", operator(body),
        failedItems.isEmpty() ? "SUCCESS" : "PARTIAL_SUCCESS",
        "批量取消发货，成功 " + successCount + " 条，失败 " + failedItems.size() + " 条");
    return Map.of("successCount", successCount, "failedItems", failedItems);
  }

  @Transactional
  public Map<String, Object> cancel(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    validateOutboundCancelable(order, operator(body));
    jdbc.update("UPDATE wms_outbound_order SET status = 'CANCELED' WHERE id = :id", params("id", id));
    jdbc.update("UPDATE wms_outbound_order_detail SET status = 'CANCELED' WHERE order_id = :id", params("id", id));
    logStatus(id, String.valueOf(order.get("order_no")), String.valueOf(order.get("status")), "CANCELED", "CANCEL", operator(body), text(body, "reason"));
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL", operator(body), "SUCCESS", firstText(text(body, "reason"), "取消发运订单"));
    return detail(id);
  }

  @Transactional
  public Map<String, Object> close(long id, Map<String, Object> body) {
    Map<String, Object> order = requireOrder(id);
    refreshOrder(id);
    order = requireOrder(id);
    validateOutboundClosable(order, operator(body));
    int planned = intValue(order.get("planned_qty"), 0);
    int shipped = intValue(order.get("shipped_qty"), 0);
    if (shipped <= 0) throw new IllegalArgumentException("没有发运记录的订单不允许关闭");
    String orderNo = String.valueOf(order.get("order_no"));
    List<Map<String, Object>> lineRows = lines(id);
    if (shipped < planned) {
      assertPartialCloseAllowed(lineRows);
      createSplitOrder(order, lineRows, operator(body));
    }
    jdbc.update("UPDATE wms_outbound_order SET status = 'CLOSED' WHERE id = :id", params("id", id));
    jdbc.update("UPDATE wms_outbound_order_detail SET status = 'CLOSED' WHERE order_id = :id", params("id", id));
    logStatus(id, orderNo, String.valueOf(order.get("status")), "CLOSED", "CLOSE", operator(body), shipped < planned ? "部分发运关闭，已生成剩余分单" : "完全发运关闭");
    repo.operationLog("OUTBOUND", orderNo, "CLOSE", operator(body), "SUCCESS", "关闭发运订单");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> postSap(long id, Map<String, Object> body) {
    validateOutboundSapPostable(requireOrder(id), operator(body));
    sapPost(id, bool(body.get("forceSapFail")), operator(body), null);
    return detail(id);
  }

  public Map<String, Object> interfaceLogs(long id) {
    return Map.of("items", interfaceLogRows(requireOrder(id)));
  }

  public Map<String, Object> statusFlow(long id) {
    return Map.of("order", requireOrder(id), "items", repo.query("""
        SELECT *
        FROM wms_outbound_status_history
        WHERE outbound_order_id = :id
        ORDER BY id ASC
        """, params("id", id)));
  }

  public Map<String, Object> pickingList(long id) {
    Map<String, Object> order = requireOrder(id);
    List<Map<String, Object>> items = allocations(id).stream()
        .filter(row -> List.of("ALLOCATED", "PICKED", "REVIEWED").contains(String.valueOf(row.get("allocation_status"))))
        .toList();
    return Map.of("order", order, "items", items);
  }

  private List<Map<String, Object>> lines(long id) {
    return repo.query("""
        SELECT d.*, d.id AS line_id, d.status AS line_status,
               d.planned_qty AS order_qty,
               p.product_code, p.product_name, p.product_name AS product_description,
               p.unit AS product_unit, p.sn_managed
        FROM wms_outbound_order_detail d
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id = :id
        ORDER BY d.line_no
        """, params("id", id));
  }

  private List<Map<String, Object>> allocations(long id) {
    return repo.query("""
        SELECT a.*, a.allocation_mode AS allocation_type,
               w.warehouse_code, l.location_code, p.product_code, p.product_name,
               p.owner_code, p.owner_name,
               s.status AS sn_status, s.quality_status, s.locked_flag, s.pallet_code, s.box_code
        FROM wms_inventory_allocation a
        JOIN wms_warehouse w ON w.id = a.warehouse_id
        JOIN wms_location l ON l.id = a.location_id
        JOIN md_product p ON p.id = a.product_id
        LEFT JOIN wms_serial_number s ON s.sn_code = a.sn_code
        WHERE a.outbound_order_id = :id
        ORDER BY a.id DESC
        """, params("id", id));
  }

  private List<Map<String, Object>> pickingTasks(long id) {
    return repo.query("""
        SELECT t.*, w.warehouse_code, l.location_code, p.product_code, p.product_name
        FROM wms_picking_task t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        JOIN wms_location l ON l.id = t.location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE t.outbound_order_id = :id
        ORDER BY t.id DESC
        """, params("id", id));
  }

  private void validateOutboundEditable(Map<String, Object> order, String operator) {
    if (!"CREATED".equals(orderStatus(order))
        || intValue(order.get("allocated_qty"), 0) > 0
        || intValue(order.get("picked_qty"), 0) > 0
        || intValue(order.get("shipped_qty"), 0) > 0
        || sapPosted(order)) {
      failOutboundOperation(order, "EDIT_SHIPPING_ORDER", operator,
          "当前状态【" + orderStatus(order) + "】不允许编辑发运订单，仅创建状态且未产生分配、拣货、发货记录时允许编辑");
    }
  }

  private void validateOutboundAllocatable(Map<String, Object> order, String operator) {
    if (!List.of("CREATED", "PARTIAL_ALLOCATED", "PENDING_ALLOC").contains(orderStatus(order)) || sapPosted(order)) {
      failOutboundOperation(order, "ALLOCATE", operator,
          "当前状态【" + orderStatus(order) + "】不允许分配库存，仅创建或部分分配状态允许分配");
    }
  }

  private void validateOutboundPickable(Map<String, Object> order, String operator) {
    if (!List.of("PARTIAL_ALLOCATED", "ALLOCATED", "PARTIAL_PICKED", "PICKING").contains(orderStatus(order))) {
      failOutboundOperation(order, "PICK", operator,
          "当前状态【" + orderStatus(order) + "】不允许拣货，仅已分配或部分拣货状态允许拣货");
    }
  }

  private void validateOutboundShippable(Map<String, Object> order, String operator) {
    if (!List.of("PARTIAL_PICKED", "PICKED", "PARTIAL_SHIPPED", "REVIEWED", "PICKING").contains(orderStatus(order))) {
      failOutboundOperation(order, "SHIP", operator,
          "当前状态【" + orderStatus(order) + "】不允许发货，仅已拣货或部分发运状态允许发货");
    }
  }

  private void validateOutboundClosable(Map<String, Object> order, String operator) {
    if (!List.of("PARTIAL_SHIPPED", "SHIPPED").contains(orderStatus(order)) || intValue(order.get("shipped_qty"), 0) <= 0) {
      failOutboundOperation(order, "CLOSE", operator,
          "当前状态【" + orderStatus(order) + "】不允许关闭发运订单，仅部分发运或完全发运状态允许关闭");
    }
  }

  private void validateOutboundCancelable(Map<String, Object> order, String operator) {
    if (!List.of("CREATED", "PENDING_ALLOC").contains(orderStatus(order)) || sapPosted(order)) {
      failOutboundOperation(order, "CANCEL", operator,
          "当前状态【" + orderStatus(order) + "】不允许取消发运订单，仅创建状态允许取消");
    }
  }

  private void validateOutboundSapPostable(Map<String, Object> order, String operator) {
    String sapStatus = text(order, "sap_post_status");
    if (!"CLOSED".equals(orderStatus(order)) || !List.of("FAILED", "NOT_POSTED", "").contains(sapStatus)) {
      failOutboundOperation(order, "POST_SAP", operator,
          "当前状态【" + orderStatus(order) + "】且 SAP 状态【" + firstText(sapStatus, "空") + "】不允许回传 SAP，仅关闭且未回传或回传失败的发运订单允许回传");
    }
  }

  private void validateOutboundAllocationCancelable(Map<String, Object> order, String operator) {
    if (!List.of("PARTIAL_ALLOCATED", "ALLOCATED", "PENDING_ALLOC").contains(orderStatus(order))) {
      failOutboundOperation(order, "CANCEL_ALLOCATION", operator,
          "当前状态【" + orderStatus(order) + "】不允许取消分配，仅已分配未拣货阶段允许取消分配");
    }
  }

  private void validateOutboundPickCancelable(Map<String, Object> order, String operator) {
    if (!List.of("PARTIAL_PICKED", "PICKED", "PICKING", "REVIEWING", "REVIEWED").contains(orderStatus(order))) {
      failOutboundOperation(order, "CANCEL_PICK", operator,
          "当前状态【" + orderStatus(order) + "】不允许取消拣货，仅部分拣货或完全拣货状态允许取消拣货");
    }
  }

  private void validateOutboundShipCancelable(Map<String, Object> order, String operator) {
    if (!"PARTIAL_SHIPPED".equals(orderStatus(order)) || sapPosted(order)) {
      failOutboundOperation(order, "CANCEL_SHIPMENT", operator,
          "当前状态【" + orderStatus(order) + "】不允许取消发货，仅部分发运且 SAP 未成功回传时允许取消发货");
    }
  }

  private boolean sapPosted(Map<String, Object> order) {
    return List.of("SUCCESS", "POSTED").contains(text(order, "sap_post_status"));
  }

  private String orderStatus(Map<String, Object> order) {
    return firstText(text(order, "status"), "空");
  }

  private void failOutboundOperation(Map<String, Object> order, String action, String operator, String message) {
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), action, firstText(operator, "admin"), "FAILED", message);
    throw new IllegalArgumentException(message);
  }

  private Map<String, Object> requireOrder(long id) {
    Map<String, Object> row = repo.one("""
        SELECT o.*, o.order_no AS shipment_order_no,
               o.outbound_type AS order_type,
               w.warehouse_code, w.warehouse_name,
               tw.warehouse_code AS target_warehouse_code,
               tw.warehouse_name AS target_warehouse_name,
               COALESCE(o.consignee_code, c.customer_code) AS consignee_code,
               COALESCE(o.consignee_name, c.customer_name) AS consignee_name,
               COALESCE(o.carrier_name, o.logistics_company) AS carrier_name,
               COALESCE(o.related_order_no, o.source_order_no) AS related_order_no
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_warehouse tw ON tw.id = o.target_warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        WHERE o.id = :id
        """, params("id", id));
    if (row == null) throw new IllegalArgumentException("发运订单不存在");
    return row;
  }

  private Map<String, Object> requireLine(long orderId, long lineId) {
    List<Map<String, Object>> rows = lines(orderId);
    if (rows.isEmpty()) throw new IllegalArgumentException("发运订单没有行明细");
    if (lineId <= 0) return rows.get(0);
    return rows.stream()
        .filter(row -> longValue(row.get("line_id"), 0) == lineId || longValue(row.get("id"), 0) == lineId)
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("发运订单行不存在"));
  }

  private List<Map<String, Object>> snCandidates(Map<String, Object> order, Map<String, Object> line, int limit) {
    return repo.query("""
        SELECT s.id AS sn_id, s.sn_code, s.product_id, s.location_id, s.warehouse_id,
               s.pallet_code, s.box_code, s.status AS sn_status, s.quality_status, s.locked_flag,
               i.id AS inventory_id, i.batch_no, i.available_qty, i.inventory_status, i.frozen_qty, i.inbound_date,
               l.location_code, l.frozen_flag, p.product_code, p.product_name, p.owner_code, p.owner_name,
               w.warehouse_code, w.warehouse_name
        FROM wms_serial_number s
        JOIN wms_warehouse w ON w.id = s.warehouse_id
        JOIN wms_location l ON l.id = s.location_id
        JOIN wms_inventory i ON i.warehouse_id = s.warehouse_id
          AND i.location_id = s.location_id
          AND i.product_id = s.product_id
          AND i.inventory_status = 'QUALIFIED'
          AND i.available_qty > 0
          AND i.frozen_qty = 0
        JOIN md_product p ON p.id = s.product_id
        WHERE s.warehouse_id = :warehouseId
          AND s.product_id = :productId
          AND s.status = 'ON_SHELF'
          AND s.quality_status = 'QUALIFIED'
          AND s.locked_flag = 0
          AND l.frozen_flag = 0
          AND (:ownerCode IS NULL OR p.owner_code IS NULL OR p.owner_code = :ownerCode)
          AND NOT EXISTS (
            SELECT 1 FROM wms_inventory_allocation a
            WHERE a.sn_code = s.sn_code AND a.allocation_status IN ('ALLOCATED', 'PICKED', 'REVIEWED')
          )
        ORDER BY i.inbound_date ASC, l.location_code ASC, s.created_at ASC, s.sn_code ASC
        LIMIT :limit
        """, params("warehouseId", order.get("warehouse_id"), "productId", line.get("product_id"), "ownerCode", order.get("owner_code"), "limit", limit));
  }

  private List<Map<String, Object>> nonSnCandidates(Map<String, Object> order, Map<String, Object> line) {
    return repo.query("""
        SELECT i.id AS inventory_id, i.warehouse_id, i.location_id, i.product_id, i.batch_no,
               i.available_qty, i.inventory_status, i.frozen_qty, i.inbound_date,
               l.location_code, l.frozen_flag, p.product_code, p.product_name, p.owner_code, p.owner_name,
               w.warehouse_code, w.warehouse_name
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN md_product p ON p.id = i.product_id
        WHERE i.warehouse_id = :warehouseId
          AND i.product_id = :productId
          AND i.inventory_status = 'QUALIFIED'
          AND i.available_qty > 0
          AND i.frozen_qty = 0
          AND l.frozen_flag = 0
          AND (:ownerCode IS NULL OR p.owner_code IS NULL OR p.owner_code = :ownerCode)
        ORDER BY i.inbound_date ASC, l.location_code ASC
        """, params("warehouseId", order.get("warehouse_id"), "productId", line.get("product_id"), "ownerCode", order.get("owner_code")));
  }

  private Map<String, Object> requireAllocatableSn(Map<String, Object> order, Map<String, Object> line, String sn) {
    return snCandidates(order, line, 200).stream()
        .filter(row -> sn.equals(String.valueOf(row.get("sn_code"))))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("SN 不可分配，可能不在库、被冻结、质量不合格或产品不一致: " + sn));
  }

  private Map<String, Object> requireAllocatableInventory(Map<String, Object> order, Map<String, Object> line, String locationCode, long inventoryId) {
    return nonSnCandidates(order, line).stream()
        .filter(row -> inventoryId <= 0 || longValue(row.get("inventory_id"), 0) == inventoryId)
        .filter(row -> !StringUtils.hasText(locationCode) || locationCode.equals(String.valueOf(row.get("location_code"))))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("没有可用非 SN 库存"));
  }

  private void createAllocation(Map<String, Object> order, Map<String, Object> line, Map<String, Object> source, int qty, String mode, String status) {
    String sn = text(source, "sn_code");
    jdbc.update("""
        INSERT INTO wms_inventory_allocation (
          allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
          warehouse_id, location_id, product_id, batch_no, sn_code, allocated_qty, allocation_mode, allocation_status
        ) VALUES (
          :allocationNo, :orderId, :orderNo, :lineId, :inventoryId,
          :warehouseId, :locationId, :productId, :batchNo, :sn, :qty, :mode, :status
        )
        """, params(
        "allocationNo", nextNo("ALLOC"),
        "orderId", order.get("id"),
        "orderNo", order.get("order_no"),
        "lineId", line.get("line_id"),
        "inventoryId", source.get("inventory_id"),
        "warehouseId", order.get("warehouse_id"),
        "locationId", source.get("location_id"),
        "productId", line.get("product_id"),
        "batchNo", source.get("batch_no"),
        "sn", StringUtils.hasText(sn) ? sn : null,
        "qty", qty,
        "mode", mode,
        "status", status
    ));
    jdbc.update("""
        UPDATE wms_inventory
        SET available_qty = GREATEST(available_qty - :qty, 0),
            allocated_qty = allocated_qty + :qty
        WHERE id = :inventoryId
        """, params("qty", qty, "inventoryId", source.get("inventory_id")));
    if (StringUtils.hasText(sn)) {
      jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'ALLOCATED', locked_flag = 1, locked_order_no = :orderNo, outbound_order_no = :orderNo
          WHERE sn_code = :sn
          """, params("orderNo", order.get("order_no"), "sn", sn));
    }
  }

  private void pickSn(Map<String, Object> order, Map<String, Object> line, String sn, String operator) {
    Map<String, Object> allocation = repo.one("""
        SELECT *
        FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId
          AND outbound_detail_id = :lineId
          AND sn_code = :sn
          AND allocation_status IN ('ALLOCATED', 'PICKED')
        """, params("orderId", order.get("id"), "lineId", line.get("line_id"), "sn", sn));
    if (allocation == null) {
      if (repo.number("""
          SELECT COUNT(*) FROM wms_inventory_allocation
          WHERE outbound_order_id = :orderId AND allocation_status IN ('ALLOCATED', 'PICKED', 'REVIEWED')
          """, params("orderId", order.get("id"))).intValue() > 0) {
        throw new IllegalArgumentException("当前扫描 SN 不属于此订单的分配结果，不允许拣货。" + sn);
      }
      createAllocation(order, line, requireAllocatableSn(order, line, sn), 1, "DIRECT_PICK", "ALLOCATED");
      allocation = repo.one("""
          SELECT *
          FROM wms_inventory_allocation
          WHERE outbound_order_id = :orderId AND outbound_detail_id = :lineId AND sn_code = :sn
          """, params("orderId", order.get("id"), "lineId", line.get("line_id"), "sn", sn));
    }
    if ("PICKED".equals(String.valueOf(allocation.get("allocation_status")))) {
      throw new IllegalArgumentException("SN 已拣货，请勿重复扫描: " + sn);
    }
    long taskId = ensurePickTask(order, line, longValue(allocation.get("location_id"), 0), operator);
    jdbc.update("""
        INSERT INTO wms_picking_record (task_id, task_no, outbound_order_id, outbound_order_no, sn_code, location_id, picker, result)
        SELECT id, task_no, :orderId, :orderNo, :sn, :locationId, :picker, 'SUCCESS'
        FROM wms_picking_task WHERE id = :taskId
        """, params("taskId", taskId, "orderId", order.get("id"), "orderNo", order.get("order_no"),
        "sn", sn, "locationId", allocation.get("location_id"), "picker", operator));
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'PICKED', picker = :picker, picked_at = NOW()
        WHERE id = :id
        """, params("id", allocation.get("id"), "picker", operator));
    jdbc.update("UPDATE wms_serial_number SET status = 'PICKED' WHERE sn_code = :sn", params("sn", sn));
  }

  private void pickNonSn(Map<String, Object> order, Map<String, Object> line, int qty, String locationCode, String operator) {
    int remaining = Math.max(intValue(line.get("order_qty"), 0) - intValue(line.get("picked_qty"), 0), 0);
    if (qty > remaining) throw new IllegalArgumentException("拣货数量不能超过订单剩余数量");
    List<Map<String, Object>> allocations = repo.query("""
        SELECT *
        FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId
          AND outbound_detail_id = :lineId
          AND allocation_status = 'ALLOCATED'
        ORDER BY id
        """, params("orderId", order.get("id"), "lineId", line.get("line_id")));
    int need = qty;
    if (allocations.isEmpty()) {
      if (repo.number("""
          SELECT COUNT(*) FROM wms_inventory_allocation
          WHERE outbound_order_id = :orderId AND allocation_status IN ('ALLOCATED', 'PICKED', 'REVIEWED')
          """, params("orderId", order.get("id"))).intValue() > 0) {
        throw new IllegalArgumentException("当前行没有可拣货的分配结果，不允许直接拣货。");
      }
      Map<String, Object> inv = requireAllocatableInventory(order, line, locationCode, 0);
      createAllocation(order, line, inv, qty, "DIRECT_PICK", "ALLOCATED");
      allocations = repo.query("""
          SELECT *
          FROM wms_inventory_allocation
          WHERE outbound_order_id = :orderId AND outbound_detail_id = :lineId AND allocation_status = 'ALLOCATED'
          ORDER BY id DESC LIMIT 1
          """, params("orderId", order.get("id"), "lineId", line.get("line_id")));
    }
    int allocatableQty = allocations.stream().mapToInt(row -> intValue(row.get("allocated_qty"), 1)).sum();
    if (qty > allocatableQty) throw new IllegalArgumentException("当前行已分配未拣货数量不足，不允许按分配结果拣货。");
    for (Map<String, Object> allocation : allocations) {
      if (need <= 0) break;
      int allocationQty = intValue(allocation.get("allocated_qty"), 1);
      int picked = Math.min(need, allocationQty);
      long taskId = ensurePickTask(order, line, longValue(allocation.get("location_id"), 0), operator);
      String pseudoSn = "NONSN-" + allocation.get("id") + "-" + System.nanoTime();
      jdbc.update("""
          INSERT INTO wms_picking_record (task_id, task_no, outbound_order_id, outbound_order_no, sn_code, location_id, picker, result)
          SELECT id, task_no, :orderId, :orderNo, :sn, :locationId, :picker, 'SUCCESS'
          FROM wms_picking_task WHERE id = :taskId
          """, params("taskId", taskId, "orderId", order.get("id"), "orderNo", order.get("order_no"),
          "sn", pseudoSn, "locationId", allocation.get("location_id"), "picker", operator));
      if (picked < allocationQty) {
        jdbc.update("""
            INSERT INTO wms_inventory_allocation (
              allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
              warehouse_id, location_id, product_id, batch_no, sn_code, allocated_qty, allocation_mode,
              allocation_status, picker, picked_at
            )
            SELECT :allocationNo, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
              warehouse_id, location_id, product_id, batch_no, sn_code, :pickedQty, allocation_mode,
              'PICKED', :picker, NOW()
            FROM wms_inventory_allocation
            WHERE id = :id
            """, params("allocationNo", nextNo("ALLOC"), "id", allocation.get("id"), "pickedQty", picked, "picker", operator));
        jdbc.update("""
            UPDATE wms_inventory_allocation
            SET allocated_qty = :remainQty
            WHERE id = :id
            """, params("id", allocation.get("id"), "remainQty", allocationQty - picked));
      } else {
        jdbc.update("""
            UPDATE wms_inventory_allocation
            SET allocation_status = 'PICKED', picker = :picker, picked_at = NOW()
            WHERE id = :id
            """, params("id", allocation.get("id"), "picker", operator));
      }
      need -= picked;
    }
  }

  private long ensurePickTask(Map<String, Object> order, Map<String, Object> line, long locationId, String operator) {
    Map<String, Object> task = repo.one("""
        SELECT *
        FROM wms_picking_task
        WHERE outbound_order_id = :orderId
          AND product_id = :productId
          AND location_id = :locationId
        ORDER BY id DESC LIMIT 1
        """, params("orderId", order.get("id"), "productId", line.get("product_id"), "locationId", locationId));
    if (task != null) return longValue(task.get("id"), 0);
    jdbc.update("""
        INSERT INTO wms_picking_task (
          task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status, picker
        ) VALUES (
          :taskNo, :orderId, :orderNo, :warehouseId, :locationId, :productId, :planQty, 0, 'PICKING', :picker
        )
        """, params("taskNo", nextNo("PICK"), "orderId", order.get("id"), "orderNo", order.get("order_no"),
        "warehouseId", order.get("warehouse_id"), "locationId", locationId, "productId", line.get("product_id"),
        "planQty", intValue(line.get("order_qty"), 0), "picker", operator));
    return repo.number("SELECT LAST_INSERT_ID()", Map.of()).longValue();
  }

  private Map<String, Object> splitAllocationForShipment(Map<String, Object> allocation, int qty) {
    jdbc.update("""
        INSERT INTO wms_inventory_allocation (
          allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
          warehouse_id, location_id, product_id, batch_no, sn_code, allocated_qty, allocation_mode,
          allocation_status, picker, picked_at
        )
        SELECT :allocationNo, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
          warehouse_id, location_id, product_id, batch_no, sn_code, :qty, allocation_mode,
          allocation_status, picker, picked_at
        FROM wms_inventory_allocation
        WHERE id = :id
        """, params("allocationNo", nextNo("ALLOC"), "qty", qty, "id", allocation.get("id")));
    long newId = repo.number("SELECT LAST_INSERT_ID()", Map.of()).longValue();
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocated_qty = allocated_qty - :qty
        WHERE id = :id
        """, params("qty", qty, "id", allocation.get("id")));
    return repo.one("SELECT * FROM wms_inventory_allocation WHERE id = :id", params("id", newId));
  }

  private long allocationIdFromPickSn(String sn) {
    if (!StringUtils.hasText(sn) || !sn.startsWith("NONSN-")) return 0;
    String[] parts = sn.split("-");
    if (parts.length < 2) return 0;
    try {
      return Long.parseLong(parts[1]);
    } catch (NumberFormatException ex) {
      return 0;
    }
  }

  private void rollbackShipmentAllocation(Map<String, Object> order, Map<String, Object> allocation, int qty, String operator) {
    int allocationQty = intValue(allocation.get("allocated_qty"), 1);
    String sn = text(allocation, "sn_code");
    Map<String, Object> before = repo.one("SELECT total_qty FROM wms_inventory WHERE id = :id", params("id", allocation.get("inventory_id")));
    int beforeQty = before == null ? 0 : intValue(before.get("total_qty"), 0);
    jdbc.update("""
        UPDATE wms_inventory
        SET total_qty = total_qty + :qty,
            allocated_qty = allocated_qty + :qty
        WHERE id = :inventoryId
        """, params("qty", qty, "inventoryId", allocation.get("inventory_id")));
    if (qty < allocationQty) {
      jdbc.update("""
          INSERT INTO wms_inventory_allocation (
            allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
            warehouse_id, location_id, product_id, batch_no, sn_code, allocated_qty, allocation_mode,
            allocation_status, picker, picked_at
          )
          SELECT :allocationNo, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
            warehouse_id, location_id, product_id, batch_no, sn_code, :qty, allocation_mode,
            'PICKED', picker, picked_at
          FROM wms_inventory_allocation
          WHERE id = :id
          """, params("allocationNo", nextNo("ALLOC"), "qty", qty, "id", allocation.get("id")));
      jdbc.update("""
          UPDATE wms_inventory_allocation
          SET allocated_qty = allocated_qty - :qty
          WHERE id = :id
          """, params("qty", qty, "id", allocation.get("id")));
    } else {
      jdbc.update("""
          UPDATE wms_inventory_allocation
          SET allocation_status = 'PICKED'
          WHERE id = :id
          """, params("id", allocation.get("id")));
    }
    if (StringUtils.hasText(sn)) {
      jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'PICKED',
              locked_flag = 1,
              locked_order_no = :orderNo,
              sold_flag = 0,
              market_flag = 0
          WHERE sn_code = :sn
          """, params("orderNo", order.get("order_no"), "sn", sn));
    }
    jdbc.update("""
        INSERT INTO wms_inventory_transaction (
          transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id,
          sn_code, batch_no, qty, before_qty, after_qty, operator, remark
        ) VALUES (
          :transactionNo, 'OUTBOUND_SHIP_CANCEL', :orderNo, :warehouseId, :locationId, :productId,
          :sn, :batchNo, :qty, :beforeQty, :afterQty, :operator, '取消发货回退库存'
        )
        """, params("transactionNo", nextNo("TXN"), "orderNo", order.get("order_no"),
        "warehouseId", order.get("warehouse_id"), "locationId", allocation.get("location_id"), "productId", allocation.get("product_id"),
        "sn", sn, "batchNo", allocation.get("batch_no"), "qty", qty, "beforeQty", beforeQty, "afterQty", beforeQty + qty, "operator", operator));
  }

  private void shipAllocation(Map<String, Object> order, long shipmentId, Map<String, Object> allocation, int qty, String operator) {
    String sn = text(allocation, "sn_code");
    Map<String, Object> before = repo.one("SELECT total_qty, allocated_qty FROM wms_inventory WHERE id = :id", params("id", allocation.get("inventory_id")));
    int beforeQty = before == null ? 0 : intValue(before.get("total_qty"), 0);
    int afterQty = Math.max(beforeQty - qty, 0);
    jdbc.update("""
        UPDATE wms_inventory
        SET total_qty = GREATEST(total_qty - :qty, 0),
            allocated_qty = GREATEST(allocated_qty - :qty, 0)
        WHERE id = :inventoryId
        """, params("qty", qty, "inventoryId", allocation.get("inventory_id")));
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'SHIPPED'
        WHERE id = :id
        """, params("id", allocation.get("id")));
    if (StringUtils.hasText(sn)) {
      jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'SHIPPED', locked_flag = 0, locked_order_no = NULL, outbound_order_no = :orderNo
          WHERE sn_code = :sn
          """, params("orderNo", order.get("order_no"), "sn", sn));
    }
    jdbc.update("""
        INSERT INTO outbound_shipment_line (
          shipment_id, outbound_order_line_id, line_no, product_id, product_code, ship_qty, sap_post_qty, sap_post_status
        )
        SELECT :shipmentId, d.id, d.line_no, d.product_id, p.product_code, :qty, 0, 'NOT_POSTED'
        FROM wms_outbound_order_detail d
        JOIN md_product p ON p.id = d.product_id
        WHERE d.id = :lineId
        """, params("shipmentId", shipmentId, "qty", qty, "lineId", allocation.get("outbound_detail_id")));
    if (StringUtils.hasText(sn)) {
      long shipmentLineId = repo.number("SELECT LAST_INSERT_ID()", Map.of()).longValue();
      jdbc.update("""
          INSERT INTO outbound_shipment_sn (
            shipment_id, shipment_line_id, sn_code, product_id, outbound_order_line_id, location_code
          ) VALUES (
            :shipmentId, :shipmentLineId, :sn, :productId, :lineId,
            (SELECT location_code FROM wms_location WHERE id = :locationId)
          )
          """, params("shipmentId", shipmentId, "shipmentLineId", shipmentLineId, "sn", sn,
          "productId", allocation.get("product_id"), "lineId", allocation.get("outbound_detail_id"), "locationId", allocation.get("location_id")));
    }
    jdbc.update("""
        INSERT INTO wms_inventory_transaction (
          transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id,
          sn_code, batch_no, qty, before_qty, after_qty, operator, remark
        ) VALUES (
          :transactionNo, 'OUTBOUND_SHIP', :orderNo, :warehouseId, :locationId, :productId,
          :sn, :batchNo, :qty, :beforeQty, :afterQty, :operator, '发运确认扣减库存'
        )
        """, params("transactionNo", nextNo("TXN"), "orderNo", order.get("order_no"),
        "warehouseId", order.get("warehouse_id"), "locationId", allocation.get("location_id"), "productId", allocation.get("product_id"),
        "sn", sn, "batchNo", allocation.get("batch_no"), "qty", -qty, "beforeQty", beforeQty, "afterQty", afterQty, "operator", operator));
  }

  private void refreshOrder(long orderId) {
    List<Map<String, Object>> rows = repo.query("""
        SELECT d.id, d.planned_qty,
               COALESCE(SUM(CASE WHEN a.allocation_status IN ('ALLOCATED','PICKED','REVIEWED','SHIPPED') THEN a.allocated_qty ELSE 0 END), 0) AS allocated_qty,
               COALESCE(SUM(CASE WHEN a.allocation_status IN ('PICKED','REVIEWED','SHIPPED') THEN a.allocated_qty ELSE 0 END), 0) AS picked_qty,
               COALESCE(SUM(CASE WHEN a.allocation_status IN ('REVIEWED','SHIPPED') THEN a.allocated_qty ELSE 0 END), 0) AS review_qty,
               COALESCE(SUM(CASE WHEN a.allocation_status = 'SHIPPED' THEN a.allocated_qty ELSE 0 END), 0) AS shipped_qty
        FROM wms_outbound_order_detail d
        LEFT JOIN wms_inventory_allocation a ON a.outbound_detail_id = d.id
        WHERE d.order_id = :orderId
        GROUP BY d.id, d.planned_qty
        """, params("orderId", orderId));
    for (Map<String, Object> row : rows) {
      int planned = intValue(row.get("planned_qty"), 0);
      int allocated = intValue(row.get("allocated_qty"), 0);
      int picked = intValue(row.get("picked_qty"), 0);
      int shipped = intValue(row.get("shipped_qty"), 0);
      String status = statusByQty(planned, allocated, picked, shipped);
      jdbc.update("""
          UPDATE wms_outbound_order_detail
          SET allocated_qty = :allocatedQty,
              picked_qty = :pickedQty,
              review_qty = :reviewQty,
              shipped_qty = :shippedQty,
              status = :status
          WHERE id = :id
          """, params("id", row.get("id"), "allocatedQty", allocated, "pickedQty", picked,
          "reviewQty", row.get("review_qty"), "shippedQty", shipped, "status", status));
    }
    int planned = rows.stream().mapToInt(row -> intValue(row.get("planned_qty"), 0)).sum();
    int allocated = rows.stream().mapToInt(row -> intValue(row.get("allocated_qty"), 0)).sum();
    int picked = rows.stream().mapToInt(row -> intValue(row.get("picked_qty"), 0)).sum();
    int reviewed = rows.stream().mapToInt(row -> intValue(row.get("review_qty"), 0)).sum();
    int shipped = rows.stream().mapToInt(row -> intValue(row.get("shipped_qty"), 0)).sum();
    Map<String, Object> order = requireOrder(orderId);
    String current = String.valueOf(order.get("status"));
    String status = List.of("CANCELED", "CLOSED").contains(current) ? current : statusByQty(planned, allocated, picked, shipped);
    jdbc.update("""
        UPDATE wms_outbound_order
        SET planned_qty = :planned,
            allocated_qty = :allocated,
            picked_qty = :picked,
            review_qty = :reviewed,
            shipped_qty = :shipped,
            status = :status
        WHERE id = :id
        """, params("id", orderId, "planned", planned, "allocated", allocated, "picked", picked,
        "reviewed", reviewed, "shipped", shipped, "status", status));
  }

  private String statusByQty(int planned, int allocated, int picked, int shipped) {
    if (planned > 0 && shipped >= planned) return "SHIPPED";
    if (shipped > 0) return "PARTIAL_SHIPPED";
    if (planned > 0 && picked >= planned) return "PICKED";
    if (picked > 0) return "PARTIAL_PICKED";
    if (planned > 0 && allocated >= planned) return "ALLOCATED";
    if (allocated > 0) return "PARTIAL_ALLOCATED";
    return "CREATED";
  }

  private void updateHeaderStatus(long id, String action, String operator, String message) {
    Map<String, Object> before = requireOrder(id);
    refreshOrder(id);
    Map<String, Object> after = requireOrder(id);
    logStatus(id, String.valueOf(before.get("order_no")), String.valueOf(before.get("status")), String.valueOf(after.get("status")), action, operator, message);
  }

  private void tracePost(long id, boolean forceFail, String operator) {
    Map<String, Object> order = requireOrder(id);
    List<String> serials = repo.query("""
        SELECT sn_code FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status = 'SHIPPED' AND sn_code IS NOT NULL
        ORDER BY sn_code
        """, params("id", id)).stream().map(row -> String.valueOf(row.get("sn_code"))).toList();
    if (forceFail) {
      String error = "追溯系统 SN 回传 Mock 失败";
      repo.interfaceLog("TRACE_OUTBOUND_SN", "WMS", "TRACE", String.valueOf(order.get("order_no")),
          "/api/mock/trace/outbound-sn", Map.of("shipmentOrderNo", order.get("order_no"), "serialNumbers", serials),
          Map.of("code", 1, "message", error), "FAILED", error);
      jdbc.update("UPDATE wms_outbound_order SET trace_post_status = 'FAILED' WHERE id = :id", params("id", id));
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "TRACE_OUTBOUND_SN", operator, "FAILED", error);
      return;
    }
    if (!serials.isEmpty()) {
      jdbc.update("UPDATE wms_serial_number SET sold_flag = 1, market_flag = 1 WHERE sn_code IN (:serials)", params("serials", serials));
    }
    repo.interfaceLog("TRACE_OUTBOUND_SN", "WMS", "TRACE", String.valueOf(order.get("order_no")),
        "/api/mock/trace/outbound-sn", Map.of("shipmentOrderNo", order.get("order_no"), "serialNumbers", serials),
        Map.of("traceStatus", "RECEIVED", "receivedCount", serials.size()), "SUCCESS", null);
    jdbc.update("UPDATE wms_outbound_order SET trace_post_status = 'POSTED' WHERE id = :id", params("id", id));
  }

  private void sapPost(long id, boolean forceFail, String operator, String shipmentNo) {
    Map<String, Object> order = requireOrder(id);
    List<Map<String, Object>> shipLines = repo.query("""
        SELECT d.line_no, p.id AS product_id, p.product_code,
               SUM(a.allocated_qty) AS ship_qty
        FROM wms_inventory_allocation a
        JOIN wms_outbound_order_detail d ON d.id = a.outbound_detail_id
        JOIN md_product p ON p.id = a.product_id
        WHERE a.outbound_order_id = :id AND a.allocation_status = 'SHIPPED'
        GROUP BY d.line_no, p.id, p.product_code
        ORDER BY d.line_no
        """, params("id", id));
    Map<String, Object> latestShipment = repo.one("""
        SELECT shipment_no FROM wms_shipment_record
        WHERE outbound_order_id = :id
        ORDER BY id DESC LIMIT 1
        """, params("id", id));
    String realShipmentNo = firstText(shipmentNo, latestShipment == null ? "" : String.valueOf(latestShipment.get("shipment_no")));
    Map<String, Object> request = new LinkedHashMap<>();
    request.put("requestId", nextNo("REQ-WMS-SAP-OUT-"));
    request.put("sourceSystem", "WMS");
    request.put("businessType", "OUTBOUND_SHIPMENT_POSTING");
    request.put("shipmentOrderNo", order.get("order_no"));
    request.put("shipmentNo", realShipmentNo);
    request.put("relatedOrderNo", order.get("related_order_no"));
    request.put("lines", shipLines);
    if (forceFail) {
      String error = "SAP 出库扣减 Mock 失败";
      repo.interfaceLog("SAP_OUTBOUND_POSTING", "WMS", "SAP", String.valueOf(order.get("order_no")),
          "/api/mock/sap/material-documents", request, Map.of("code", 1, "message", error), "FAILED", error);
      jdbc.update("UPDATE wms_outbound_order SET sap_post_status = 'FAILED', sap_post_result = :error WHERE id = :id",
          params("id", id, "error", error));
      if (StringUtils.hasText(realShipmentNo)) {
        jdbc.update("""
            UPDATE wms_shipment_record
            SET sap_post_status = 'FAILED',
                sap_post_result = :error
            WHERE outbound_order_id = :id AND shipment_no = :shipmentNo
            """, params("id", id, "shipmentNo", realShipmentNo, "error", error));
      }
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SAP_OUTBOUND_POSTING", operator, "FAILED", error);
      return;
    }
    String materialDoc = "49" + (System.currentTimeMillis() % 100000000L);
    repo.interfaceLog("SAP_OUTBOUND_POSTING", "WMS", "SAP", String.valueOf(order.get("order_no")),
        "/api/mock/sap/material-documents", request, Map.of("sapMaterialDocNo", materialDoc, "postingStatus", "POSTED"), "SUCCESS", null);
    jdbc.update("""
        UPDATE wms_outbound_order
        SET sap_post_status = 'SUCCESS',
            sap_material_doc_no = :materialDoc,
            sap_post_result = :result
        WHERE id = :id
        """, params("id", id, "materialDoc", materialDoc, "result", "SAP 出库扣减成功 " + materialDoc));
    if (StringUtils.hasText(realShipmentNo)) {
      jdbc.update("""
          UPDATE wms_shipment_record
          SET sap_post_status = 'SUCCESS',
              sap_material_doc_no = :materialDoc,
              sap_post_result = :result
          WHERE outbound_order_id = :id AND shipment_no = :shipmentNo
          """, params("id", id, "shipmentNo", realShipmentNo, "materialDoc", materialDoc, "result", "SAP 出库扣减成功"));
    }
    jdbc.update("""
        UPDATE outbound_shipment_line
        SET sap_post_status = 'SUCCESS',
            sap_post_qty = ship_qty,
            sap_material_doc_no = :materialDoc,
            sap_post_result = :result
        WHERE shipment_id IN (
          SELECT id FROM wms_shipment_record
          WHERE outbound_order_id = :id
            AND (:shipmentNo IS NULL OR shipment_no = :shipmentNo)
        )
        """, params("id", id, "shipmentNo", StringUtils.hasText(realShipmentNo) ? realShipmentNo : null, "materialDoc", materialDoc, "result", "SAP 出库扣减成功"));
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SAP_OUTBOUND_POSTING", operator, "SUCCESS", "SAP 出库扣减成功 " + materialDoc);
  }

  private void assertPartialCloseAllowed(List<Map<String, Object>> lines) {
    for (Map<String, Object> line : lines) {
      int planned = intValue(line.get("order_qty"), intValue(line.get("planned_qty"), 0));
      int shipped = intValue(line.get("shipped_qty"), 0);
      if (shipped >= planned) continue;
      int allocated = intValue(line.get("allocated_qty"), 0);
      int picked = intValue(line.get("picked_qty"), 0);
      String status = String.valueOf(line.getOrDefault("line_status", line.get("status")));
      if (allocated > shipped || picked > shipped || List.of("PARTIAL_ALLOCATED", "ALLOCATED", "PARTIAL_PICKED", "PICKED").contains(status)) {
        throw new IllegalArgumentException("存在已分配/已拣货的数据，不允许直接关单。请先释放分配或回退拣货，使未发运明细回到创建状态后再关单。");
      }
    }
  }

  private void createSplitOrder(Map<String, Object> order, List<Map<String, Object>> lines, String operator) {
    String sourceOrderNo = String.valueOf(order.get("order_no"));
    int splitIndex = repo.number("""
        SELECT COUNT(*) + 1 FROM wms_outbound_order
        WHERE parent_order_no = :orderNo
        """, params("orderNo", sourceOrderNo)).intValue();
    String splitOrderNo = sourceOrderNo + "-S" + String.format("%02d", splitIndex);
    jdbc.update("""
        INSERT INTO wms_outbound_order (
          order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
          planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, status,
          owner_code, owner_name, consignee_code, consignee_name, expected_ship_time,
          related_order_no, sales_order_no, rework_order_no, target_owner_code, target_owner_name,
          required_delivery_time, carrier_name, tracking_no, sap_post_status, sap_post_result,
          parent_order_no, split_flag, remark
        )
        SELECT :splitOrderNo, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id, customer_id,
          0, 0, 0, 0, 0, 'CREATED',
          owner_code, owner_name, consignee_code, consignee_name, expected_ship_time,
          related_order_no, sales_order_no, rework_order_no, target_owner_code, target_owner_name,
          required_delivery_time, carrier_name, tracking_no, 'NOT_POSTED', '',
          order_no, 1, '部分发运关闭后自动生成剩余分单'
        FROM wms_outbound_order
        WHERE id = :id
        """, params("splitOrderNo", splitOrderNo, "id", order.get("id")));
    long splitId = repo.number("SELECT id FROM wms_outbound_order WHERE order_no = :orderNo", params("orderNo", splitOrderNo)).longValue();
    for (Map<String, Object> line : lines) {
      int remain = Math.max(intValue(line.get("order_qty"), 0) - intValue(line.get("shipped_qty"), 0), 0);
      if (remain <= 0) continue;
      jdbc.update("""
          INSERT INTO wms_outbound_order_detail (
            order_id, line_no, product_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty,
            batch_no, sap_plant, unit, sn_required, status
          ) VALUES (
            :orderId, :lineNo, :productId, :plannedQty, 0, 0, 0, 0,
            :batchNo, :sapPlant, :unit, :snRequired, 'CREATED'
          )
          """, params("orderId", splitId, "lineNo", line.get("line_no"), "productId", line.get("product_id"),
          "plannedQty", remain, "batchNo", line.get("batch_no"), "sapPlant", line.get("sap_plant"),
          "unit", firstText(text(line, "unit"), "PCS"), "snRequired", intValue(line.get("sn_required"), 0)));
    }
    refreshOrder(splitId);
    logStatus(splitId, splitOrderNo, null, "CREATED", "SPLIT_FROM_PARTIAL_SHIPMENT", operator, "原单部分发运关闭生成分单");
  }

  private long defaultLocationId(Map<String, Object> order, Map<String, Object> line) {
    Map<String, Object> row = repo.one("""
        SELECT location_id
        FROM wms_inventory
        WHERE warehouse_id = :warehouseId AND product_id = :productId
        ORDER BY available_qty DESC, id
        LIMIT 1
        """, params("warehouseId", order.get("warehouse_id"), "productId", line.get("product_id")));
    if (row != null) return longValue(row.get("location_id"), 0);
    return repo.number("SELECT MIN(id) FROM wms_location WHERE warehouse_id = :warehouseId", params("warehouseId", order.get("warehouse_id"))).longValue();
  }

  private void registerException(long orderId, String orderNo, String taskNo, String sn, String type, String message, String operator) {
    jdbc.update("""
        INSERT INTO wms_outbound_exception (
          exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, operator
        ) VALUES (
          :exceptionNo, :orderId, :orderNo, :taskNo, :sn, :type, :message, :operator
        )
        """, params("exceptionNo", nextNo("EXC"), "orderId", orderId, "orderNo", orderNo,
        "taskNo", taskNo, "sn", sn, "type", type, "message", message, "operator", operator));
  }

  private List<Map<String, Object>> interfaceLogRows(Map<String, Object> order) {
    return repo.query("""
        SELECT *
        FROM wms_interface_log
        WHERE business_doc_no = :orderNo OR business_doc_no = :relatedOrderNo OR business_doc_no = :sourceOrderNo
        ORDER BY id DESC
        LIMIT 50
        """, params("orderNo", order.get("order_no"), "relatedOrderNo", text(order, "related_order_no"), "sourceOrderNo", text(order, "source_order_no")));
  }

  private Map<String, Object> requireProduct(String productCode) {
    return requireProduct(productCode, null);
  }

  private Map<String, Object> requireProduct(String productCode, String ownerCode) {
    Map<String, Object> product = repo.one("""
        SELECT *
        FROM md_product
        WHERE product_code = :productCode
          AND (:ownerCode IS NULL OR owner_code IS NULL OR owner_code = :ownerCode)
        ORDER BY CASE WHEN owner_code = :ownerCode THEN 0 ELSE 1 END, owner_code DESC
        LIMIT 1
        """, params("productCode", productCode, "ownerCode", ownerCode));
    if (product == null) throw new IllegalArgumentException("产品不存在: " + productCode);
    return product;
  }

  private Map<String, Object> requireWarehouse(String warehouseCode) {
    Map<String, Object> warehouse = repo.one("SELECT * FROM wms_warehouse WHERE warehouse_code = :warehouseCode", params("warehouseCode", warehouseCode));
    if (warehouse == null) throw new IllegalArgumentException("仓库不存在: " + warehouseCode);
    return warehouse;
  }

  private Map<String, Object> requireCustomer(String customerCode) {
    Map<String, Object> customer = repo.one("SELECT * FROM md_customer WHERE customer_code = :customerCode", params("customerCode", customerCode));
    if (customer == null) throw new IllegalArgumentException("客户/收货人不存在: " + customerCode);
    return customer;
  }

  private void logStatus(long id, String orderNo, String before, String after, String action, String operator, String message) {
    jdbc.update("""
        INSERT INTO wms_outbound_status_history (
          outbound_order_id, outbound_order_no, from_status, to_status, action, operator, message
        ) VALUES (
          :id, :orderNo, :beforeStatus, :afterStatus, :action, :operator, :message
        )
        """, params("id", id, "orderNo", orderNo, "beforeStatus", before, "afterStatus", after,
        "action", action, "operator", operator, "message", message));
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> inputLines(Map<String, Object> body) {
    Object value = body.get("lines");
    if (value instanceof List<?> list) {
      return list.stream()
          .filter(item -> item instanceof Map<?, ?>)
          .map(item -> (Map<String, Object>) item)
          .toList();
    }
    return new ArrayList<>();
  }

  private List<Long> numberList(Object value) {
    if (value instanceof List<?> list) {
      return list.stream()
          .filter(item -> item != null && StringUtils.hasText(String.valueOf(item)))
          .map(item -> item instanceof Number number ? number.longValue() : Long.parseLong(String.valueOf(item)))
          .toList();
    }
    return new ArrayList<>();
  }

  private List<String> cleanSerials(Object value) {
    if (value == null) return new ArrayList<>();
    if (value instanceof List<?> list) {
      return list.stream().map(String::valueOf).map(String::trim).filter(StringUtils::hasText).distinct().toList();
    }
    String raw = String.valueOf(value);
    List<String> result = new ArrayList<>();
    for (String item : raw.split("\\r?\\n|,|;|\\s+")) {
      if (StringUtils.hasText(item) && !result.contains(item.trim())) result.add(item.trim());
    }
    return result;
  }

  private String normalizeOrderType(String value) {
    if (!StringUtils.hasText(value)) return null;
    return switch (value) {
      case "SALES" -> "SALES_OUTBOUND";
      case "TRANSFER" -> "WAREHOUSE_TRANSFER";
      case "AFTERSALE" -> "AFTERSALE_OUTBOUND";
      default -> value;
    };
  }

  private boolean isTransfer(String orderType) {
    return List.of("WAREHOUSE_TRANSFER", "STO_OUTBOUND", "TRANSFER").contains(orderType);
  }

  private String prefixFor(String orderType) {
    if ("WAREHOUSE_TRANSFER".equals(orderType)) return "TR-OUT-";
    if ("STO_OUTBOUND".equals(orderType)) return "STO-OUT-";
    return "SO-OUT-";
  }

  private String operator(Map<String, Object> body) {
    return firstText(text(body, "operator"), "admin");
  }

  private String text(Map<String, Object> row, String... keys) {
    for (String key : keys) {
      Object value = row.get(key);
      if (value != null && StringUtils.hasText(String.valueOf(value))) return String.valueOf(value).trim();
    }
    return "";
  }

  private String firstText(String value, String fallback) {
    return StringUtils.hasText(value) ? value : fallback;
  }

  private boolean bool(Object value) {
    if (value instanceof Boolean b) return b;
    if (value instanceof Number n) return n.intValue() != 0;
    return value != null && List.of("true", "1", "Y", "YES").contains(String.valueOf(value).toUpperCase());
  }

  private int intValue(Object value, int fallback) {
    if (value == null || !StringUtils.hasText(String.valueOf(value))) return fallback;
    if (value instanceof Number number) return number.intValue();
    return Integer.parseInt(String.valueOf(value));
  }

  private long longValue(Object value, long fallback) {
    if (value == null || !StringUtils.hasText(String.valueOf(value))) return fallback;
    if (value instanceof Number number) return number.longValue();
    return Long.parseLong(String.valueOf(value));
  }

  private String nextNo(String prefix) {
    return prefix + LocalDateTime.now().format(COMPACT_TIME) + String.format("%03d", Math.abs(System.nanoTime() % 1000));
  }

  private Map<String, Object> params(Object... values) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < values.length; i += 2) {
      map.put(String.valueOf(values[i]), values[i + 1]);
    }
    return map;
  }
}
