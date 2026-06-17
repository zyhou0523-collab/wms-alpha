package com.company.wms.outbound;

import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import com.company.wms.outbound.dto.CreateOutboundOrderRequest;
import com.company.wms.outbound.dto.ManualAllocationRequest;
import com.company.wms.outbound.dto.OutboundExceptionRequest;
import com.company.wms.outbound.dto.ScanSnRequest;
import com.company.wms.outbound.dto.ShipmentConfirmRequest;
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
public class OutboundService {
  private static final DateTimeFormatter COMPACT_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  public OutboundService(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
  }

  public PageResult<Map<String, Object>> orders(
      String outboundType,
      String orderNo,
      String sourceOrderNo,
      String warehouseCode,
      String customerCode,
      String status,
      int pageNum,
      int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("outboundType", StringUtils.hasText(outboundType) ? outboundType : null);
    params.put("orderNo", repo.like(orderNo));
    params.put("sourceOrderNo", repo.like(sourceOrderNo));
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("customerCode", repo.like(customerCode));
    params.put("status", repo.like(status));
    String from = """
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_warehouse tw ON tw.id = o.target_warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        LEFT JOIN (
          SELECT d.order_id,
                 COUNT(*) AS line_count,
                 GROUP_CONCAT(p.product_code ORDER BY d.line_no SEPARATOR ', ') AS product_summary
          FROM wms_outbound_order_detail d
          JOIN md_product p ON p.id = d.product_id
          GROUP BY d.order_id
        ) agg ON agg.order_id = o.id
        WHERE (:outboundType IS NULL OR o.outbound_type = :outboundType)
          AND (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:sourceOrderNo IS NULL OR o.source_order_no LIKE :sourceOrderNo)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:customerCode IS NULL OR c.customer_code LIKE :customerCode)
          AND (:status IS NULL OR o.status LIKE :status)
        """;
    return repo.page(
        """
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               tw.warehouse_code AS target_warehouse_code,
               tw.warehouse_name AS target_warehouse_name,
               c.customer_code, c.customer_name,
               COALESCE(agg.line_count, 0) AS line_count,
               agg.product_summary
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    );
  }

  public Map<String, Object> detail(long id) {
    Map<String, Object> order = requireOrder(id);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("order", order);
    data.put("details", repo.query("""
        SELECT d.*, p.product_code, p.product_name
        FROM wms_outbound_order_detail d
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id = :id
        ORDER BY d.line_no
        """, params("id", id)));
    data.put("allocations", allocationsByOrder(id));
    data.put("pickingTasks", repo.query("""
        SELECT t.*, w.warehouse_code, l.location_code, p.product_code, p.product_name
        FROM wms_picking_task t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        JOIN wms_location l ON l.id = t.location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE t.outbound_order_id = :id
        ORDER BY t.id DESC
        """, params("id", id)));
    data.put("pickingRecords", repo.query("""
        SELECT r.*, l.location_code
        FROM wms_picking_record r
        JOIN wms_location l ON l.id = r.location_id
        WHERE r.outbound_order_id = :id
        ORDER BY r.id DESC
        """, params("id", id)));
    data.put("reviewRecords", repo.query("""
        SELECT *
        FROM wms_outbound_review_record
        WHERE outbound_order_id = :id
        ORDER BY id DESC
        """, params("id", id)));
    data.put("shipments", repo.query("""
        SELECT *
        FROM wms_shipment_record
        WHERE outbound_order_id = :id
        ORDER BY id DESC
        """, params("id", id)));
    data.put("interfaceLogs", repo.query("""
        SELECT *
        FROM wms_interface_log
        WHERE business_doc_no = :orderNo OR business_doc_no = :sourceOrderNo
        ORDER BY id DESC
        LIMIT 30
        """, params("orderNo", order.get("order_no"), "sourceOrderNo", nullToEmpty(order.get("source_order_no")))));
    data.put("operationLogs", repo.query("""
        SELECT *
        FROM wms_operation_log
        WHERE business_doc_no = :orderNo
        ORDER BY id DESC
        LIMIT 30
        """, params("orderNo", order.get("order_no"))));
    data.put("exceptions", repo.query("""
        SELECT *
        FROM wms_outbound_exception
        WHERE outbound_order_id = :id OR outbound_order_no = :orderNo
        ORDER BY id DESC
        LIMIT 20
        """, params("id", id, "orderNo", order.get("order_no"))));
    return data;
  }

  @Transactional
  public Map<String, Object> create(CreateOutboundOrderRequest request, String defaultType) {
    String outboundType = firstText(request.outboundType(), defaultType);
    Map<String, Object> product = requireProduct(firstText(request.productCode(), "GT3-30KD1R11001"));
    Map<String, Object> warehouse = requireWarehouse(firstText(request.warehouseCode(), "WH-HZ-CENTRAL"));
    Map<String, Object> targetWarehouse = null;
    if ("TRANSFER".equals(outboundType)) {
      targetWarehouse = requireWarehouse(firstText(request.targetWarehouseCode(), "WH-SH-REGION"));
      if (warehouse.get("id").equals(targetWarehouse.get("id"))) {
        throw new IllegalArgumentException("调拨出库来源仓和目标仓不能相同");
      }
    }
    Map<String, Object> customer = null;
    if (!"TRANSFER".equals(outboundType)) {
      customer = requireCustomer(firstText(request.customerCode(), "CUST-TESLA-001"));
    }
    int qty = request.qty() == null ? 5 : Math.max(request.qty(), 1);
    String orderNo = firstText(request.outboundOrderNo(), nextNo("OUT"));
    String sourceOrderNo = firstText(request.sourceOrderNo(), ("TRANSFER".equals(outboundType) ? "STO" : "SO") + orderNo.substring(Math.max(0, orderNo.length() - 8)));
    String sourceSystem = firstText(request.sourceSystem(), "TRANSFER".equals(outboundType) ? "SAP" : "FULFILLMENT");

    jdbc.update("""
        INSERT INTO wms_outbound_order (
          order_no, source_order_no, source_system, outbound_type, warehouse_id, target_warehouse_id,
          customer_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, status, remark
        ) VALUES (
          :orderNo, :sourceOrderNo, :sourceSystem, :outboundType, :warehouseId, :targetWarehouseId,
          :customerId, :qty, 0, 0, 0, 0, 'PENDING_ALLOC', :remark
        )
        """, params(
        "orderNo", orderNo,
        "sourceOrderNo", sourceOrderNo,
        "sourceSystem", sourceSystem,
        "outboundType", outboundType,
        "warehouseId", warehouse.get("id"),
        "targetWarehouseId", targetWarehouse == null ? null : targetWarehouse.get("id"),
        "customerId", customer == null ? null : customer.get("id"),
        "qty", qty,
        "remark", firstText(request.remark(), "模拟下发出库单")
    ));
    long orderId = repo.number("SELECT id FROM wms_outbound_order WHERE order_no = :orderNo", params("orderNo", orderNo)).longValue();
    jdbc.update("""
        INSERT INTO wms_outbound_order_detail (order_id, line_no, product_id, planned_qty, allocated_qty, picked_qty, review_qty, shipped_qty, batch_no, status)
        VALUES (:orderId, 1, :productId, :qty, 0, 0, 0, 0, :batchNo, 'PENDING_ALLOC')
        """, params("orderId", orderId, "productId", product.get("id"), "qty", qty, "batchNo", "BATCH-OUT-" + orderNo));
    repo.interfaceLog(interfaceNameForCreate(outboundType), sourceSystem, "WMS", orderNo,
        "TRANSFER".equals(outboundType) ? "/api/mock/sap/sto-orders" : "/api/mock/fulfillment/outbound-orders",
        requestBody(orderNo, sourceOrderNo, outboundType, qty), Map.of("outboundOrderNo", orderNo, "status", "PENDING_ALLOC"), "SUCCESS", null);
    logStatus(orderId, orderNo, null, "PENDING_ALLOC", "CREATE_OUTBOUND_ORDER", operator(request.operator()), "模拟创建出库单");
    repo.operationLog("OUTBOUND", orderNo, "CREATE_OUTBOUND_ORDER", operator(request.operator()), "SUCCESS", "创建模拟出库单");
    return detail(orderId);
  }

  @Transactional
  public Map<String, Object> allocateAuto(long id, String operator) {
    Map<String, Object> order = requireOrder(id);
    int need = remaining(order, "planned_qty", "allocated_qty");
    if (need <= 0) {
      return detail(id);
    }
    List<Map<String, Object>> candidates = repo.query("""
        SELECT s.id AS sn_id, s.sn_code, s.product_id, s.location_id, s.warehouse_id,
               i.id AS inventory_id, i.batch_no, l.location_code, i.inbound_date
        FROM wms_serial_number s
        JOIN wms_location l ON l.id = s.location_id
        JOIN wms_inventory i ON i.warehouse_id = s.warehouse_id
          AND i.location_id = s.location_id
          AND i.product_id = s.product_id
          AND i.inventory_status = 'QUALIFIED'
          AND i.available_qty > 0
        WHERE s.warehouse_id = :warehouseId
          AND s.product_id = :productId
          AND s.status = 'ON_SHELF'
          AND s.quality_status = 'QUALIFIED'
          AND s.locked_flag = 0
          AND l.frozen_flag = 0
          AND i.frozen_qty = 0
        ORDER BY i.inbound_date ASC, s.created_at ASC, s.sn_code ASC
        LIMIT :need
        """, params(
        "warehouseId", order.get("warehouse_id"),
        "productId", order.get("product_id"),
        "need", need
    ));
    if (candidates.size() < need) {
      String message = "可用库存不足，需要 " + need + " 个 SN，当前可分配 " + candidates.size() + " 个";
      registerException(id, String.valueOf(order.get("order_no")), null, null, "INSUFFICIENT_STOCK", message, operator(operator));
      updateOrderStatus(id, "ALLOCATION_EXCEPTION", "ALLOCATE_AUTO", operator(operator), message);
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_AUTO", operator(operator), "FAILED", message);
      return detail(id);
    }
    applyAllocations(order, candidates, "AUTO", operator(operator));
    updateOrderStatus(id, "ALLOCATED", "ALLOCATE_AUTO", operator(operator), "系统自动 FIFO 分配 " + candidates.size() + " 个 SN");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_AUTO", operator(operator), "SUCCESS", "系统自动分配 " + candidates.size() + " 个 SN");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> allocateManual(long id, ManualAllocationRequest request) {
    Map<String, Object> order = requireOrder(id);
    List<String> serials = cleanSerials(request == null ? null : request.serialNumbers());
    if (serials.isEmpty()) {
      throw new IllegalArgumentException("请至少选择一个 SN");
    }
    int need = remaining(order, "planned_qty", "allocated_qty");
    if (serials.size() > need) {
      throw new IllegalArgumentException("人工指定数量不能超过待分配数量");
    }
    List<Map<String, Object>> candidates = new ArrayList<>();
    for (String sn : serials) {
      candidates.add(requireAllocatableSn(order, sn));
    }
    applyAllocations(order, candidates, "MANUAL", operator(request.operator()));
    String nextStatus = remaining(requireOrder(id), "planned_qty", "allocated_qty") <= 0 ? "ALLOCATED" : "PENDING_ALLOC";
    updateOrderStatus(id, nextStatus, "ALLOCATE_MANUAL", operator(request.operator()), "人工指定分配 " + serials.size() + " 个 SN");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "ALLOCATE_MANUAL", operator(request.operator()), "SUCCESS", "人工指定分配 " + serials.size() + " 个 SN");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> cancelAllocation(long id, String operator) {
    Map<String, Object> order = requireOrder(id);
    if (repo.number("""
        SELECT COUNT(*) FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status IN ('PICKED', 'REVIEWED', 'SHIPPED')
        """, params("id", id)).intValue() > 0) {
      throw new IllegalArgumentException("已拣货、已复核或已发货的分配不允许取消");
    }
    List<Map<String, Object>> allocations = repo.query("""
        SELECT * FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status = 'ALLOCATED'
        """, params("id", id));
    for (Map<String, Object> allocation : allocations) {
      jdbc.update("""
          UPDATE wms_inventory
          SET available_qty = available_qty + 1,
              allocated_qty = GREATEST(allocated_qty - 1, 0)
          WHERE id = :inventoryId
          """, params("inventoryId", allocation.get("inventory_id")));
    }
    jdbc.update("""
        UPDATE wms_serial_number
        SET status = 'ON_SHELF', locked_flag = 0, locked_order_no = NULL, outbound_order_no = NULL
        WHERE locked_order_no = :orderNo AND status = 'ALLOCATED'
        """, params("orderNo", order.get("order_no")));
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'CANCELED'
        WHERE outbound_order_id = :id AND allocation_status = 'ALLOCATED'
        """, params("id", id));
    refreshQuantities(id);
    updateOrderStatus(id, "PENDING_ALLOC", "CANCEL_ALLOCATION", operator(operator), "取消库存分配");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "CANCEL_ALLOCATION", operator(operator), "SUCCESS", "取消库存分配");
    return detail(id);
  }

  public Map<String, Object> allocationView(long id) {
    Map<String, Object> order = requireOrder(id);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("order", order);
    data.put("allocations", allocationsByOrder(id));
    data.put("availableInventory", availableInventory(order));
    data.put("recommendedInventory", recommendedInventory(order));
    return data;
  }

  @Transactional
  public Map<String, Object> generatePickingTasks(long id, String operator) {
    Map<String, Object> order = requireOrder(id);
    if (((Number) order.get("allocated_qty")).intValue() <= 0) {
      throw new IllegalArgumentException("请先完成库存分配");
    }
    if (repo.number("SELECT COUNT(*) FROM wms_picking_task WHERE outbound_order_id = :id", params("id", id)).intValue() == 0) {
      List<Map<String, Object>> groups = repo.query("""
          SELECT warehouse_id, location_id, product_id, COUNT(*) AS plan_qty
          FROM wms_inventory_allocation
          WHERE outbound_order_id = :id AND allocation_status = 'ALLOCATED'
          GROUP BY warehouse_id, location_id, product_id
          ORDER BY location_id
          """, params("id", id));
      int index = 1;
      for (Map<String, Object> group : groups) {
        jdbc.update("""
            INSERT INTO wms_picking_task (
              task_no, outbound_order_id, outbound_order_no, warehouse_id, location_id, product_id, plan_qty, picked_qty, status
            ) VALUES (
              :taskNo, :orderId, :orderNo, :warehouseId, :locationId, :productId, :planQty, 0, 'PENDING'
            )
            """, params(
            "taskNo", nextNo("PICK") + "-" + index++,
            "orderId", id,
            "orderNo", order.get("order_no"),
            "warehouseId", group.get("warehouse_id"),
            "locationId", group.get("location_id"),
            "productId", group.get("product_id"),
            "planQty", group.get("plan_qty")
        ));
      }
    }
    updateOrderStatus(id, "PICKING", "GENERATE_PICKING_TASK", operator(operator), "生成拣货任务");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "GENERATE_PICKING_TASK", operator(operator), "SUCCESS", "生成拣货任务");
    return detail(id);
  }

  public PageResult<Map<String, Object>> pickingTasks(
      String taskNo,
      String orderNo,
      String warehouseCode,
      String status,
      int pageNum,
      int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("taskNo", repo.like(taskNo));
    params.put("orderNo", repo.like(orderNo));
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("status", repo.like(status));
    String from = """
        FROM wms_picking_task t
        JOIN wms_outbound_order o ON o.id = t.outbound_order_id
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        JOIN wms_location l ON l.id = t.location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE (:taskNo IS NULL OR t.task_no LIKE :taskNo)
          AND (:orderNo IS NULL OR t.outbound_order_no LIKE :orderNo)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:status IS NULL OR t.status LIKE :status)
        """;
    return repo.page(
        """
        SELECT t.*, o.status AS order_status, w.warehouse_code, w.warehouse_name,
               l.location_code, p.product_code, p.product_name
        """ + from + " ORDER BY t.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    );
  }

  @Transactional
  public Map<String, Object> scanPicking(long taskId, ScanSnRequest request) {
    Map<String, Object> task = requireTask(taskId);
    List<String> serials = scanSerials(request);
    if (serials.isEmpty()) {
      throw new IllegalArgumentException("请扫描 SN");
    }
    for (String sn : serials) {
      pickOne(task, sn, operator(request.operator()));
    }
    refreshTask(taskId);
    refreshQuantities(((Number) task.get("outbound_order_id")).longValue());
    Map<String, Object> order = requireOrder(((Number) task.get("outbound_order_id")).longValue());
    String nextStatus = ((Number) order.get("picked_qty")).intValue() >= ((Number) order.get("planned_qty")).intValue() ? "PICKED" : "PICKING";
    updateOrderStatus(((Number) task.get("outbound_order_id")).longValue(), nextStatus, "PICK_SN", operator(request.operator()), "扫码拣货 " + serials.size() + " 个 SN");
    repo.operationLog("OUTBOUND", String.valueOf(task.get("outbound_order_no")), "PICK_SN", operator(request.operator()), "SUCCESS", "扫码拣货 " + serials.size() + " 个 SN");
    return detail(((Number) task.get("outbound_order_id")).longValue());
  }

  @Transactional
  public Map<String, Object> registerPickingException(long taskId, OutboundExceptionRequest request) {
    Map<String, Object> task = requireTask(taskId);
    String message = firstText(request.reason(), "拣货异常登记");
    registerException(((Number) task.get("outbound_order_id")).longValue(), String.valueOf(task.get("outbound_order_no")),
        String.valueOf(task.get("task_no")), request.snCode(), firstText(request.exceptionType(), "PICKING_EXCEPTION"), message, operator(request.operator()));
    repo.operationLog("OUTBOUND", String.valueOf(task.get("outbound_order_no")), "PICKING_EXCEPTION", operator(request.operator()), "FAILED", message);
    return detail(((Number) task.get("outbound_order_id")).longValue());
  }

  @Transactional
  public Map<String, Object> review(long id, ScanSnRequest request) {
    Map<String, Object> order = requireOrder(id);
    List<String> serials = scanSerials(request);
    if (serials.isEmpty()) {
      throw new IllegalArgumentException("请扫描 SN");
    }
    int reviewedQty = ((Number) order.get("review_qty")).intValue();
    int plannedQty = ((Number) order.get("planned_qty")).intValue();
    if (reviewedQty + serials.size() > plannedQty) {
      throw new IllegalArgumentException("复核数量不能超过订单数量");
    }
    for (String sn : serials) {
      Map<String, Object> allocation = repo.one("""
          SELECT * FROM wms_inventory_allocation
          WHERE outbound_order_id = :id AND sn_code = :sn
          """, params("id", id, "sn", sn));
      if (allocation == null) {
        throw new IllegalArgumentException("该 SN 不属于当前出库单: " + sn);
      }
      if (!List.of("PICKED", "REVIEWED").contains(String.valueOf(allocation.get("allocation_status")))) {
        throw new IllegalArgumentException("SN 尚未拣货，不允许复核: " + sn);
      }
      if (repo.number("""
          SELECT COUNT(*) FROM wms_outbound_review_record
          WHERE outbound_order_id = :id AND sn_code = :sn
          """, params("id", id, "sn", sn)).intValue() > 0) {
        throw new IllegalArgumentException("SN 已复核，请勿重复扫描: " + sn);
      }
      jdbc.update("""
          INSERT INTO wms_outbound_review_record (outbound_order_id, outbound_order_no, sn_code, reviewer, result)
          VALUES (:id, :orderNo, :sn, :reviewer, 'SUCCESS')
          """, params("id", id, "orderNo", order.get("order_no"), "sn", sn, "reviewer", operator(request.operator())));
      jdbc.update("""
          UPDATE wms_inventory_allocation
          SET allocation_status = 'REVIEWED', reviewer = :reviewer, reviewed_at = NOW()
          WHERE outbound_order_id = :id AND sn_code = :sn
          """, params("id", id, "sn", sn, "reviewer", operator(request.operator())));
      jdbc.update("UPDATE wms_serial_number SET status = 'REVIEWED' WHERE sn_code = :sn", params("sn", sn));
    }
    refreshQuantities(id);
    Map<String, Object> refreshed = requireOrder(id);
    String nextStatus = ((Number) refreshed.get("review_qty")).intValue() >= ((Number) refreshed.get("planned_qty")).intValue() ? "REVIEWED" : "REVIEWING";
    updateOrderStatus(id, nextStatus, "REVIEW_SN", operator(request.operator()), "扫码复核 " + serials.size() + " 个 SN");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "REVIEW_SN", operator(request.operator()), "SUCCESS", "扫码复核 " + serials.size() + " 个 SN");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> ship(long id, ShipmentConfirmRequest request) {
    Map<String, Object> order = requireOrder(id);
    if (!"REVIEWED".equals(String.valueOf(order.get("status")))) {
      throw new IllegalArgumentException("只有已复核出库单允许发货确认");
    }
    List<Map<String, Object>> allocations = repo.query("""
        SELECT *
        FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status = 'REVIEWED'
        ORDER BY id
        """, params("id", id));
    if (allocations.isEmpty()) {
      throw new IllegalArgumentException("没有可发货的已复核 SN");
    }
    String carrier = firstText(request.carrier(), "SF");
    String trackingNo = firstText(request.trackingNo(), "SF" + System.currentTimeMillis());
    String shipper = operator(firstText(request.shipper(), request.operator()));
    String shipmentNo = nextNo("SHIP");
    jdbc.update("""
        INSERT INTO wms_shipment_record (
          shipment_no, outbound_order_id, outbound_order_no, carrier, tracking_no, shipped_qty, shipper, ship_time, remark
        ) VALUES (
          :shipmentNo, :id, :orderNo, :carrier, :trackingNo, :qty, :shipper, NOW(), :remark
        )
        """, params(
        "shipmentNo", shipmentNo,
        "id", id,
        "orderNo", order.get("order_no"),
        "carrier", carrier,
        "trackingNo", trackingNo,
        "qty", allocations.size(),
        "shipper", shipper,
        "remark", firstText(request.remark(), "")
    ));
    for (Map<String, Object> allocation : allocations) {
      shipOne(order, allocation, shipper);
    }
    jdbc.update("""
        UPDATE wms_outbound_order
        SET shipped_qty = :qty,
            logistics_company = :carrier,
            tracking_no = :trackingNo,
            shipper = :shipper,
            ship_time = NOW(),
            status = 'SHIPPED'
        WHERE id = :id
        """, params("id", id, "qty", allocations.size(), "carrier", carrier, "trackingNo", trackingNo, "shipper", shipper));
    jdbc.update("UPDATE wms_outbound_order_detail SET shipped_qty = :qty, status = 'SHIPPED' WHERE order_id = :id",
        params("id", id, "qty", allocations.size()));
    updateOrderStatus(id, "SHIPPED", "SHIP_CONFIRM", shipper, "发货确认，扣减 WMS 库存");
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SHIP_CONFIRM", shipper, "SUCCESS", "发货确认并扣减库存");
    if ("TRANSFER".equals(String.valueOf(order.get("outbound_type")))) {
      createTransferInbound(order, allocations.size());
    }
    boolean traceOk = callbackTraceInternal(requireOrder(id), Boolean.TRUE.equals(request.forceTraceFail()), shipper);
    boolean sapOk = callbackSapInternal(requireOrder(id), Boolean.TRUE.equals(request.forceSapFail()), shipper);
    String finalStatus = traceOk && sapOk ? "CALLBACK_SUCCESS" : "CALLBACK_FAILED";
    updateOrderStatus(id, finalStatus, "OUTBOUND_CALLBACK", shipper, traceOk && sapOk ? "追溯和 SAP 回传成功" : "外部回传失败");
    return detail(id);
  }

  @Transactional
  public Map<String, Object> traceCallback(long id, boolean forceFail, String operator) {
    callbackTraceInternal(requireOrder(id), forceFail, operator(operator));
    syncCallbackStatus(id, operator(operator));
    return detail(id);
  }

  @Transactional
  public Map<String, Object> sapCallback(long id, boolean forceFail, String operator) {
    callbackSapInternal(requireOrder(id), forceFail, operator(operator));
    syncCallbackStatus(id, operator(operator));
    return detail(id);
  }

  public Map<String, Object> interfaceLogs(long id) {
    Map<String, Object> order = requireOrder(id);
    return Map.of("items", repo.query("""
        SELECT *
        FROM wms_interface_log
        WHERE business_doc_no = :orderNo OR business_doc_no = :sourceOrderNo
        ORDER BY id DESC
        """, params("orderNo", order.get("order_no"), "sourceOrderNo", nullToEmpty(order.get("source_order_no")))));
  }

  public Map<String, Object> statusFlow(long id) {
    Map<String, Object> order = requireOrder(id);
    return Map.of(
        "order", order,
        "items", repo.query("""
            SELECT *
            FROM wms_outbound_status_history
            WHERE outbound_order_id = :id
            ORDER BY id ASC
            """, params("id", id))
    );
  }

  @Transactional
  public Map<String, Object> createFromFulfillmentMock(Map<String, Object> body) {
    CreateOutboundOrderRequest request = new CreateOutboundOrderRequest(
        stringValue(body.get("outboundOrderNo")),
        stringValue(body.getOrDefault("sourceOrderNo", body.get("salesOrderNo"))),
        "FULFILLMENT",
        firstText(stringValue(body.get("outboundType")), "SALES"),
        firstText(stringValue(body.get("warehouseCode")), "WH-HZ-CENTRAL"),
        stringValue(body.get("targetWarehouseCode")),
        firstText(stringValue(body.get("customerCode")), "CUST-TESLA-001"),
        firstText(stringValue(body.get("productCode")), "GT3-30KD1R11001"),
        intValue(body.get("qty"), 5),
        "履约系统 Mock 下发",
        "system"
    );
    return create(request, firstText(request.outboundType(), "SALES"));
  }

  private void applyAllocations(Map<String, Object> order, List<Map<String, Object>> candidates, String mode, String operator) {
    long orderId = ((Number) order.get("id")).longValue();
    long detailId = ((Number) order.get("detail_id")).longValue();
    String orderNo = String.valueOf(order.get("order_no"));
    for (Map<String, Object> candidate : candidates) {
      jdbc.update("""
          INSERT INTO wms_inventory_allocation (
            allocation_no, outbound_order_id, outbound_order_no, outbound_detail_id, inventory_id,
            warehouse_id, location_id, product_id, batch_no, sn_code, allocation_mode, allocation_status
          ) VALUES (
            :allocationNo, :orderId, :orderNo, :detailId, :inventoryId,
            :warehouseId, :locationId, :productId, :batchNo, :sn, :mode, 'ALLOCATED'
          )
          """, params(
          "allocationNo", nextNo("ALLOC"),
          "orderId", orderId,
          "orderNo", orderNo,
          "detailId", detailId,
          "inventoryId", candidate.get("inventory_id"),
          "warehouseId", order.get("warehouse_id"),
          "locationId", candidate.get("location_id"),
          "productId", order.get("product_id"),
          "batchNo", candidate.get("batch_no"),
          "sn", candidate.get("sn_code"),
          "mode", mode
      ));
      jdbc.update("""
          UPDATE wms_inventory
          SET available_qty = GREATEST(available_qty - 1, 0),
              allocated_qty = allocated_qty + 1
          WHERE id = :inventoryId
          """, params("inventoryId", candidate.get("inventory_id")));
      jdbc.update("""
          UPDATE wms_serial_number
          SET status = 'ALLOCATED',
              locked_flag = 1,
              locked_order_no = :orderNo,
              outbound_order_no = :orderNo
          WHERE sn_code = :sn
          """, params("orderNo", orderNo, "sn", candidate.get("sn_code")));
      jdbc.update("""
          INSERT INTO wms_inventory_transaction (
            transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id,
            sn_code, batch_no, qty, operator, remark
          ) VALUES (
            :transactionNo, 'OUTBOUND_ALLOCATE', :orderNo, :warehouseId, :locationId, :productId,
            :sn, :batchNo, 0, :operator, '库存分配锁定'
          )
          """, params(
          "transactionNo", nextNo("TXN"),
          "orderNo", orderNo,
          "warehouseId", order.get("warehouse_id"),
          "locationId", candidate.get("location_id"),
          "productId", order.get("product_id"),
          "sn", candidate.get("sn_code"),
          "batchNo", candidate.get("batch_no"),
          "operator", operator
      ));
    }
    refreshQuantities(orderId);
  }

  private Map<String, Object> requireAllocatableSn(Map<String, Object> order, String sn) {
    Map<String, Object> row = repo.one("""
        SELECT s.id AS sn_id, s.sn_code, s.product_id, s.location_id, s.warehouse_id,
               s.status AS sn_status, s.quality_status, s.locked_flag,
               i.id AS inventory_id, i.batch_no, i.available_qty, i.inventory_status, i.frozen_qty,
               l.location_code, l.frozen_flag
        FROM wms_serial_number s
        JOIN wms_location l ON l.id = s.location_id
        JOIN wms_inventory i ON i.warehouse_id = s.warehouse_id
          AND i.location_id = s.location_id
          AND i.product_id = s.product_id
          AND i.inventory_status = 'QUALIFIED'
          AND i.available_qty > 0
        WHERE s.sn_code = :sn
        """, params("sn", sn));
    if (row == null) {
      throw new IllegalArgumentException("SN 不存在: " + sn);
    }
    if (((Number) row.get("warehouse_id")).longValue() != ((Number) order.get("warehouse_id")).longValue()) {
      throw new IllegalArgumentException("SN 不在当前出库仓库: " + sn);
    }
    if (((Number) row.get("product_id")).longValue() != ((Number) order.get("product_id")).longValue()) {
      throw new IllegalArgumentException("SN 产品与出库单不一致: " + sn);
    }
    if (!"ON_SHELF".equals(String.valueOf(row.get("sn_status")))) {
      throw new IllegalArgumentException("SN 不在库或状态不允许分配: " + sn);
    }
    if (!"QUALIFIED".equals(String.valueOf(row.get("quality_status")))) {
      throw new IllegalArgumentException("不合格 SN 不允许出库: " + sn);
    }
    if (((Number) row.get("locked_flag")).intValue() == 1) {
      throw new IllegalArgumentException("SN 已被其他单据锁定: " + sn);
    }
    if (((Number) row.get("frozen_flag")).intValue() == 1 || ((Number) row.get("frozen_qty")).intValue() > 0 || !"QUALIFIED".equals(String.valueOf(row.get("inventory_status")))) {
      throw new IllegalArgumentException("冻结、待检或不合格库存不可分配: " + sn);
    }
    if (((Number) row.get("available_qty")).intValue() <= 0) {
      throw new IllegalArgumentException("SN 对应库存可用数量不足: " + sn);
    }
    return row;
  }

  private void pickOne(Map<String, Object> task, String sn, String operator) {
    long taskId = ((Number) task.get("id")).longValue();
    long orderId = ((Number) task.get("outbound_order_id")).longValue();
    Map<String, Object> allocation = repo.one("""
        SELECT a.*, s.status AS sn_status, s.locked_order_no, l.location_code
        FROM wms_inventory_allocation a
        JOIN wms_serial_number s ON s.sn_code = a.sn_code
        JOIN wms_location l ON l.id = a.location_id
        WHERE a.outbound_order_id = :orderId AND a.sn_code = :sn
        """, params("orderId", orderId, "sn", sn));
    if (allocation == null) {
      registerException(orderId, String.valueOf(task.get("outbound_order_no")), String.valueOf(task.get("task_no")), sn, "SN_MISMATCH", "该 SN 不属于当前出库单分配范围", operator);
      throw new IllegalArgumentException("该 SN 不属于当前出库单分配范围: " + sn);
    }
    if (((Number) allocation.get("location_id")).longValue() != ((Number) task.get("location_id")).longValue()) {
      throw new IllegalArgumentException("SN 所在库位与拣货任务不一致: " + sn);
    }
    if (repo.number("SELECT COUNT(*) FROM wms_picking_record WHERE task_id = :taskId AND sn_code = :sn",
        params("taskId", taskId, "sn", sn)).intValue() > 0) {
      throw new IllegalArgumentException("SN 已拣货，请勿重复扫描: " + sn);
    }
    if (!"ALLOCATED".equals(String.valueOf(allocation.get("allocation_status")))) {
      throw new IllegalArgumentException("SN 当前状态不允许拣货: " + sn);
    }
    if (!String.valueOf(task.get("outbound_order_no")).equals(String.valueOf(allocation.get("locked_order_no")))) {
      throw new IllegalArgumentException("SN 已被其他单据锁定: " + sn);
    }
    jdbc.update("""
        INSERT INTO wms_picking_record (task_id, task_no, outbound_order_id, outbound_order_no, sn_code, location_id, picker, result)
        VALUES (:taskId, :taskNo, :orderId, :orderNo, :sn, :locationId, :picker, 'SUCCESS')
        """, params(
        "taskId", taskId,
        "taskNo", task.get("task_no"),
        "orderId", orderId,
        "orderNo", task.get("outbound_order_no"),
        "sn", sn,
        "locationId", task.get("location_id"),
        "picker", operator
    ));
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'PICKED', picker = :picker, picked_at = NOW()
        WHERE id = :id
        """, params("id", allocation.get("id"), "picker", operator));
    jdbc.update("UPDATE wms_serial_number SET status = 'PICKED' WHERE sn_code = :sn", params("sn", sn));
  }

  private void shipOne(Map<String, Object> order, Map<String, Object> allocation, String operator) {
    Map<String, Object> inventory = repo.one("SELECT total_qty, allocated_qty FROM wms_inventory WHERE id = :id",
        params("id", allocation.get("inventory_id")));
    int beforeQty = inventory == null ? 0 : ((Number) inventory.get("total_qty")).intValue();
    int afterQty = Math.max(beforeQty - 1, 0);
    jdbc.update("""
        UPDATE wms_inventory
        SET total_qty = GREATEST(total_qty - 1, 0),
            allocated_qty = GREATEST(allocated_qty - 1, 0)
        WHERE id = :inventoryId
        """, params("inventoryId", allocation.get("inventory_id")));
    jdbc.update("""
        UPDATE wms_inventory_allocation
        SET allocation_status = 'SHIPPED'
        WHERE id = :id
        """, params("id", allocation.get("id")));
    jdbc.update("""
        UPDATE wms_serial_number
        SET status = 'SHIPPED',
            locked_flag = 0,
            locked_order_no = NULL,
            outbound_order_no = :orderNo
        WHERE sn_code = :sn
        """, params("orderNo", order.get("order_no"), "sn", allocation.get("sn_code")));
    jdbc.update("""
        INSERT INTO wms_inventory_transaction (
          transaction_no, transaction_type, business_doc_no, warehouse_id, location_id, product_id,
          sn_code, batch_no, qty, before_qty, after_qty, operator, remark
        ) VALUES (
          :transactionNo, 'OUTBOUND_SHIP', :orderNo, :warehouseId, :locationId, :productId,
          :sn, :batchNo, -1, :beforeQty, :afterQty, :operator, '发货确认扣减库存'
        )
        """, params(
        "transactionNo", nextNo("TXN"),
        "orderNo", order.get("order_no"),
        "warehouseId", order.get("warehouse_id"),
        "locationId", allocation.get("location_id"),
        "productId", allocation.get("product_id"),
        "sn", allocation.get("sn_code"),
        "batchNo", allocation.get("batch_no"),
        "beforeQty", beforeQty,
        "afterQty", afterQty,
        "operator", operator
    ));
  }

  private boolean callbackTraceInternal(Map<String, Object> order, boolean forceFail, String operator) {
    List<String> serials = shippedSerials(((Number) order.get("id")).longValue());
    if (serials.isEmpty()) {
      return false;
    }
    Map<String, Object> body = callbackBody(order, serials);
    if (forceFail) {
      String error = "追溯系统 Mock 回传失败";
      repo.interfaceLog("TRACE_OUTBOUND_SN", "WMS", "TRACE", String.valueOf(order.get("order_no")),
          "/api/mock/trace/outbound-sn", body, Map.of("code", 1, "message", error), "FAILED", error);
      jdbc.update("UPDATE wms_outbound_order SET trace_post_status = 'FAILED', status = 'CALLBACK_FAILED' WHERE id = :id",
          params("id", order.get("id")));
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "TRACE_OUTBOUND_SN", operator, "FAILED", error);
      return false;
    }
    jdbc.update("""
        UPDATE wms_serial_number
        SET sold_flag = 1, market_flag = 1
        WHERE sn_code IN (:serials)
        """, params("serials", serials));
    repo.interfaceLog("TRACE_OUTBOUND_SN", "WMS", "TRACE", String.valueOf(order.get("order_no")),
        "/api/mock/trace/outbound-sn", body, Map.of("traceStatus", "RECEIVED", "receivedCount", serials.size()), "SUCCESS", null);
    jdbc.update("UPDATE wms_outbound_order SET trace_post_status = 'POSTED' WHERE id = :id", params("id", order.get("id")));
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "TRACE_OUTBOUND_SN", operator, "SUCCESS", "追溯 SN 回传成功");
    return true;
  }

  private boolean callbackSapInternal(Map<String, Object> order, boolean forceFail, String operator) {
    List<String> serials = shippedSerials(((Number) order.get("id")).longValue());
    if (serials.isEmpty()) {
      return false;
    }
    Map<String, Object> body = callbackBody(order, serials);
    body.put("sapDocNo", order.get("source_order_no"));
    body.put("storageLocation", order.get("warehouse_code"));
    if (forceFail) {
      String error = "SAP 出库扣减 Mock 失败";
      repo.interfaceLog("SAP_OUTBOUND_POSTING", "WMS", "SAP", String.valueOf(order.get("order_no")),
          "/api/mock/sap/material-documents", body, Map.of("code", 1, "message", error), "FAILED", error);
      jdbc.update("UPDATE wms_outbound_order SET sap_post_status = 'FAILED', status = 'CALLBACK_FAILED' WHERE id = :id",
          params("id", order.get("id")));
      repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SAP_OUTBOUND_POSTING", operator, "FAILED", error);
      return false;
    }
    String materialDoc = "49" + (System.currentTimeMillis() % 100000000L);
    repo.interfaceLog("SAP_OUTBOUND_POSTING", "WMS", "SAP", String.valueOf(order.get("order_no")),
        "/api/mock/sap/material-documents", body, Map.of("sapMaterialDocNo", materialDoc, "postingStatus", "POSTED"), "SUCCESS", null);
    jdbc.update("""
        UPDATE wms_outbound_order
        SET sap_post_status = 'POSTED',
            sap_material_doc_no = :materialDoc
        WHERE id = :id
        """, params("id", order.get("id"), "materialDoc", materialDoc));
    repo.operationLog("OUTBOUND", String.valueOf(order.get("order_no")), "SAP_OUTBOUND_POSTING", operator, "SUCCESS", "SAP 出库扣减成功 " + materialDoc);
    return true;
  }

  private void createTransferInbound(Map<String, Object> order, int qty) {
    if (order.get("target_warehouse_id") == null) {
      return;
    }
    String inboundNo = "TIN-" + order.get("order_no");
    if (repo.number("SELECT COUNT(*) FROM wms_inbound_order WHERE order_no = :orderNo", params("orderNo", inboundNo)).intValue() > 0) {
      return;
    }
    jdbc.update("""
        INSERT INTO wms_inbound_order (
          order_no, source_order_no, inbound_type, source_system, warehouse_id, planned_qty, received_qty, status, remark
        ) VALUES (
          :orderNo, :sourceOrderNo, 'TRANSFER_IN', 'WMS', :warehouseId, :qty, 0, 'CREATED', '调拨出库发货后自动生成待收货单'
        )
        """, params(
        "orderNo", inboundNo,
        "sourceOrderNo", order.get("order_no"),
        "warehouseId", order.get("target_warehouse_id"),
        "qty", qty
    ));
    long inboundId = repo.number("SELECT id FROM wms_inbound_order WHERE order_no = :orderNo", params("orderNo", inboundNo)).longValue();
    jdbc.update("""
        INSERT INTO wms_inbound_order_detail (order_id, line_no, product_id, planned_qty, received_qty, shelved_qty, batch_no, quality_status)
        VALUES (:orderId, 1, :productId, :qty, 0, 0, :batchNo, 'QUALIFIED')
        """, params("orderId", inboundId, "productId", order.get("product_id"), "qty", qty, "batchNo", "BATCH-" + inboundNo));
  }

  private void syncCallbackStatus(long id, String operator) {
    Map<String, Object> order = requireOrder(id);
    if ("POSTED".equals(String.valueOf(order.get("trace_post_status")))
        && "POSTED".equals(String.valueOf(order.get("sap_post_status")))) {
      updateOrderStatus(id, "CALLBACK_SUCCESS", "CALLBACK_RETRY_SUCCESS", operator, "追溯和 SAP 重试后均成功");
    }
  }

  private List<Map<String, Object>> availableInventory(Map<String, Object> order) {
    return repo.query("""
        SELECT s.sn_code, s.status AS sn_status, s.quality_status, s.locked_flag,
               i.id AS inventory_id, i.batch_no, i.inventory_status, i.available_qty, i.frozen_qty, i.inbound_date,
               w.warehouse_code, l.location_code, l.frozen_flag,
               p.product_code, p.product_name
        FROM wms_serial_number s
        JOIN wms_inventory i ON i.warehouse_id = s.warehouse_id
          AND i.location_id = s.location_id
          AND i.product_id = s.product_id
        JOIN wms_warehouse w ON w.id = s.warehouse_id
        JOIN wms_location l ON l.id = s.location_id
        JOIN md_product p ON p.id = s.product_id
        WHERE s.warehouse_id = :warehouseId
          AND s.product_id = :productId
          AND s.status IN ('ON_SHELF', 'ALLOCATED', 'PICKED', 'REVIEWED')
        ORDER BY FIELD(s.status, 'ON_SHELF', 'ALLOCATED', 'PICKED', 'REVIEWED'), i.inbound_date, s.sn_code
        LIMIT 80
        """, params("warehouseId", order.get("warehouse_id"), "productId", order.get("product_id")));
  }

  private List<Map<String, Object>> recommendedInventory(Map<String, Object> order) {
    int need = remaining(order, "planned_qty", "allocated_qty");
    if (need <= 0) {
      return List.of();
    }
    return repo.query("""
        SELECT s.sn_code, i.batch_no, i.inbound_date, l.location_code, p.product_code, p.product_name
        FROM wms_serial_number s
        JOIN wms_inventory i ON i.warehouse_id = s.warehouse_id
          AND i.location_id = s.location_id
          AND i.product_id = s.product_id
          AND i.inventory_status = 'QUALIFIED'
        JOIN wms_location l ON l.id = s.location_id
        JOIN md_product p ON p.id = s.product_id
        WHERE s.warehouse_id = :warehouseId
          AND s.product_id = :productId
          AND s.status = 'ON_SHELF'
          AND s.quality_status = 'QUALIFIED'
          AND s.locked_flag = 0
          AND l.frozen_flag = 0
          AND i.available_qty > 0
          AND i.frozen_qty = 0
        ORDER BY i.inbound_date, s.created_at, s.sn_code
        LIMIT :need
        """, params("warehouseId", order.get("warehouse_id"), "productId", order.get("product_id"), "need", need));
  }

  private List<Map<String, Object>> allocationsByOrder(long id) {
    return repo.query("""
        SELECT a.*, w.warehouse_code, l.location_code, p.product_code, p.product_name,
               s.status AS sn_status, s.quality_status, s.locked_flag
        FROM wms_inventory_allocation a
        JOIN wms_warehouse w ON w.id = a.warehouse_id
        JOIN wms_location l ON l.id = a.location_id
        JOIN md_product p ON p.id = a.product_id
        LEFT JOIN wms_serial_number s ON s.sn_code = a.sn_code
        WHERE a.outbound_order_id = :id
        ORDER BY a.id DESC
        """, params("id", id));
  }

  private Map<String, Object> requireOrder(long id) {
    Map<String, Object> order = repo.one("""
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               tw.warehouse_code AS target_warehouse_code,
               tw.warehouse_name AS target_warehouse_name,
               c.customer_code, c.customer_name,
               d.id AS detail_id, d.product_id, d.batch_no,
               p.product_code, p.product_name
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_warehouse tw ON tw.id = o.target_warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        JOIN wms_outbound_order_detail d ON d.order_id = o.id
        JOIN md_product p ON p.id = d.product_id
        WHERE o.id = :id
        """, params("id", id));
    if (order == null) {
      throw new IllegalArgumentException("出库单不存在");
    }
    return order;
  }

  private Map<String, Object> requireTask(long id) {
    Map<String, Object> task = repo.one("""
        SELECT t.*, w.warehouse_code, l.location_code, p.product_code, p.product_name
        FROM wms_picking_task t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        JOIN wms_location l ON l.id = t.location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE t.id = :id
        """, params("id", id));
    if (task == null) {
      throw new IllegalArgumentException("拣货任务不存在");
    }
    return task;
  }

  private Map<String, Object> requireProduct(String productCode) {
    Map<String, Object> product = repo.one("SELECT * FROM md_product WHERE product_code = :productCode", params("productCode", productCode));
    if (product == null) {
      throw new IllegalArgumentException("产品不存在: " + productCode);
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

  private Map<String, Object> requireCustomer(String customerCode) {
    Map<String, Object> customer = repo.one("SELECT * FROM md_customer WHERE customer_code = :customerCode", params("customerCode", customerCode));
    if (customer == null) {
      throw new IllegalArgumentException("客户不存在: " + customerCode);
    }
    return customer;
  }

  private void refreshTask(long taskId) {
    Map<String, Object> task = requireTask(taskId);
    int pickedQty = repo.number("SELECT COUNT(*) FROM wms_picking_record WHERE task_id = :taskId AND result = 'SUCCESS'", params("taskId", taskId)).intValue();
    String status = pickedQty >= ((Number) task.get("plan_qty")).intValue() ? "PICKED" : "PICKING";
    jdbc.update("UPDATE wms_picking_task SET picked_qty = :pickedQty, status = :status WHERE id = :taskId",
        params("taskId", taskId, "pickedQty", pickedQty, "status", status));
  }

  private void refreshQuantities(long orderId) {
    int allocatedQty = repo.number("""
        SELECT COUNT(*) FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId AND allocation_status IN ('ALLOCATED', 'PICKED', 'REVIEWED', 'SHIPPED')
        """, params("orderId", orderId)).intValue();
    int pickedQty = repo.number("""
        SELECT COUNT(*) FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId AND allocation_status IN ('PICKED', 'REVIEWED', 'SHIPPED')
        """, params("orderId", orderId)).intValue();
    int reviewedQty = repo.number("""
        SELECT COUNT(*) FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId AND allocation_status IN ('REVIEWED', 'SHIPPED')
        """, params("orderId", orderId)).intValue();
    int shippedQty = repo.number("""
        SELECT COUNT(*) FROM wms_inventory_allocation
        WHERE outbound_order_id = :orderId AND allocation_status = 'SHIPPED'
        """, params("orderId", orderId)).intValue();
    jdbc.update("""
        UPDATE wms_outbound_order
        SET allocated_qty = :allocatedQty,
            picked_qty = :pickedQty,
            review_qty = :reviewedQty,
            shipped_qty = IF(:shippedQty > 0, :shippedQty, shipped_qty)
        WHERE id = :orderId
        """, params("orderId", orderId, "allocatedQty", allocatedQty, "pickedQty", pickedQty, "reviewedQty", reviewedQty, "shippedQty", shippedQty));
    jdbc.update("""
        UPDATE wms_outbound_order_detail
        SET allocated_qty = :allocatedQty,
            picked_qty = :pickedQty,
            review_qty = :reviewedQty,
            shipped_qty = IF(:shippedQty > 0, :shippedQty, shipped_qty)
        WHERE order_id = :orderId
        """, params("orderId", orderId, "allocatedQty", allocatedQty, "pickedQty", pickedQty, "reviewedQty", reviewedQty, "shippedQty", shippedQty));
  }

  private void updateOrderStatus(long id, String status, String action, String operator, String message) {
    Map<String, Object> order = requireOrder(id);
    String before = String.valueOf(order.get("status"));
    jdbc.update("UPDATE wms_outbound_order SET status = :status WHERE id = :id", params("id", id, "status", status));
    jdbc.update("UPDATE wms_outbound_order_detail SET status = :status WHERE order_id = :id", params("id", id, "status", status));
    logStatus(id, String.valueOf(order.get("order_no")), before, status, action, operator, message);
  }

  private void logStatus(long id, String orderNo, String before, String after, String action, String operator, String message) {
    jdbc.update("""
        INSERT INTO wms_outbound_status_history (
          outbound_order_id, outbound_order_no, from_status, to_status, action, operator, message
        ) VALUES (
          :id, :orderNo, :fromStatus, :toStatus, :action, :operator, :message
        )
        """, params("id", id, "orderNo", orderNo, "fromStatus", before, "toStatus", after, "action", action, "operator", operator, "message", message));
  }

  private void registerException(long orderId, String orderNo, String taskNo, String sn, String type, String message, String operator) {
    jdbc.update("""
        INSERT INTO wms_outbound_exception (
          exception_no, outbound_order_id, outbound_order_no, task_no, sn_code, exception_type, message, operator
        ) VALUES (
          :exceptionNo, :orderId, :orderNo, :taskNo, :sn, :type, :message, :operator
        )
        """, params(
        "exceptionNo", nextNo("EXC"),
        "orderId", orderId,
        "orderNo", orderNo,
        "taskNo", taskNo,
        "sn", sn,
        "type", type,
        "message", message,
        "operator", operator
    ));
  }

  private Map<String, Object> callbackBody(Map<String, Object> order, List<String> serials) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("outboundOrderNo", order.get("order_no"));
    body.put("salesOrderNo", order.get("source_order_no"));
    body.put("customerCode", order.get("customer_code"));
    body.put("productCode", order.get("product_code"));
    body.put("qty", serials.size());
    body.put("serialNumbers", serials);
    body.put("warehouseCode", order.get("warehouse_code"));
    body.put("shipTime", order.get("ship_time"));
    return body;
  }

  private Map<String, Object> requestBody(String orderNo, String sourceOrderNo, String outboundType, int qty) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("outboundOrderNo", orderNo);
    body.put("sourceOrderNo", sourceOrderNo);
    body.put("outboundType", outboundType);
    body.put("qty", qty);
    return body;
  }

  private List<String> shippedSerials(long id) {
    return repo.query("""
        SELECT sn_code
        FROM wms_inventory_allocation
        WHERE outbound_order_id = :id AND allocation_status = 'SHIPPED'
        ORDER BY sn_code
        """, params("id", id)).stream().map(row -> String.valueOf(row.get("sn_code"))).toList();
  }

  private List<String> scanSerials(ScanSnRequest request) {
    List<String> result = cleanSerials(request == null ? null : request.serialNumbers());
    if (request != null && StringUtils.hasText(request.snCode()) && !result.contains(request.snCode().trim())) {
      result.add(request.snCode().trim());
    }
    return result;
  }

  private List<String> cleanSerials(List<String> serials) {
    if (serials == null) {
      return new ArrayList<>();
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

  private int remaining(Map<String, Object> row, String plannedKey, String doneKey) {
    return Math.max(((Number) row.get(plannedKey)).intValue() - ((Number) row.get(doneKey)).intValue(), 0);
  }

  private String operator(String operator) {
    return StringUtils.hasText(operator) ? operator : "admin";
  }

  private String firstText(String value, String fallback) {
    return StringUtils.hasText(value) ? value : fallback;
  }

  private String stringValue(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String nullToEmpty(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private int intValue(Object value, int fallback) {
    if (value == null) {
      return fallback;
    }
    if (value instanceof Number number) {
      return number.intValue();
    }
    return Integer.parseInt(String.valueOf(value));
  }

  private String interfaceNameForCreate(String outboundType) {
    return "TRANSFER".equals(outboundType) ? "SAP_STO_PUSH" : "FULFILLMENT_ORDER_PUSH";
  }

  private String nextNo(String prefix) {
    return prefix + LocalDateTime.now().format(COMPACT_TIME) + String.format("%03d", System.nanoTime() % 1000);
  }

  private Map<String, Object> params(Object... values) {
    Map<String, Object> map = new HashMap<>();
    for (int i = 0; i < values.length; i += 2) {
      map.put(String.valueOf(values[i]), values[i + 1]);
    }
    return map;
  }
}
