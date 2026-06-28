package com.company.wms.workbench;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.WmsRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/workbench")
public class WorkbenchController {
  private final WmsRepository repo;

  public WorkbenchController(WmsRepository repo) {
    this.repo = repo;
  }

  @GetMapping
  public ApiResponse<Map<String, Object>> workbench() {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("summary", summaryData());
    data.put("inventoryRows", inventoryRows(null, null, null, null, 5));
    data.put("safetyWarnings", safetyWarnings(5));
    data.put("todoList", todoListData());
    data.put("pendingInbound", pendingInboundData(8));
    data.put("pendingOutbound", pendingOutboundData(8));
    data.put("businessEntries", businessEntries());
    return ApiResponse.ok(data);
  }

  @GetMapping("/summary")
  public ApiResponse<Map<String, Object>> summary() {
    return ApiResponse.ok(summaryData());
  }

  @GetMapping("/inventory-query")
  public ApiResponse<List<Map<String, Object>>> inventoryQuery(
      @RequestParam(required = false) String productCode,
      @RequestParam(required = false) String productName,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String owner,
      @RequestParam(defaultValue = "5") int limit
  ) {
    return ApiResponse.ok(inventoryRows(productCode, productName, warehouseCode, owner, limit));
  }

  @GetMapping("/todo-list")
  public ApiResponse<List<Map<String, Object>>> todoList() {
    return ApiResponse.ok(todoListData());
  }

  @GetMapping("/pending-inbound")
  public ApiResponse<List<Map<String, Object>>> pendingInbound(@RequestParam(defaultValue = "8") int limit) {
    return ApiResponse.ok(pendingInboundData(limit));
  }

  @GetMapping("/pending-outbound")
  public ApiResponse<List<Map<String, Object>>> pendingOutbound(@RequestParam(defaultValue = "8") int limit) {
    return ApiResponse.ok(pendingOutboundData(limit));
  }

  private Map<String, Object> summaryData() {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("pendingReceiveCount", repo.number("""
        SELECT COUNT(*)
        FROM wms_inbound_order
        WHERE status IN ('CREATED', 'PARTIAL_RECEIVED', 'RECEIVING', 'BOUND', 'COLLECTED')
          AND planned_qty > received_qty
        """, Map.of()));
    data.put("pendingShelveCount", repo.number("""
        SELECT COALESCE(SUM(GREATEST(received_qty - shelved_qty, 0)), 0)
        FROM wms_inbound_order_detail
        """, Map.of()));
    data.put("pendingPickCount", repo.number("""
        SELECT COUNT(*)
        FROM wms_outbound_order
        WHERE status IN ('ALLOCATED', 'PICKING', 'PENDING_PICK')
           OR (allocated_qty > picked_qty AND status <> 'SHIPPED')
        """, Map.of()));
    data.put("pendingShipCount", repo.number("""
        SELECT COUNT(*)
        FROM wms_outbound_order
        WHERE status IN ('PICKED', 'REVIEWING', 'REVIEWED')
           OR (review_qty > shipped_qty AND status <> 'SHIPPED')
        """, Map.of()));
    return data;
  }

  private List<Map<String, Object>> inventoryRows(
      String productCode,
      String productName,
      String warehouseCode,
      String owner,
      int limit
  ) {
    Map<String, Object> params = new LinkedHashMap<>();
    params.put("productCode", like(productCode));
    params.put("productName", like(productName));
    params.put("warehouseCode", like(warehouseCode));
    params.put("owner", like(owner));
    params.put("limit", Math.min(Math.max(limit, 1), 50));
    return repo.query("""
        SELECT w.warehouse_code AS warehouseCode,
               w.warehouse_name AS warehouseName,
               p.product_code AS productCode,
               p.product_name AS productName,
               COALESCE(SUM(i.total_qty), 0) AS totalQty,
               COALESCE(SUM(i.available_qty), 0) AS availableQty,
               COALESCE(SUM(i.allocated_qty), 0) AS allocatedQty,
               COALESCE(SUM(i.frozen_qty), 0) AS frozenQty,
               p.unit
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN md_product p ON p.id = i.product_id
        WHERE (:productCode IS NULL OR p.product_code LIKE :productCode)
          AND (:productName IS NULL OR p.product_name LIKE :productName)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR COALESCE(p.owner_code, w.owner_code, '') LIKE :owner OR COALESCE(p.owner_name, '') LIKE :owner)
        GROUP BY w.id, w.warehouse_code, w.warehouse_name, p.id, p.product_code, p.product_name, p.unit
        ORDER BY availableQty DESC, totalQty DESC
        LIMIT :limit
        """, params);
  }

  private List<Map<String, Object>> safetyWarnings(int limit) {
    Map<String, Object> params = Map.of("limit", Math.min(Math.max(limit, 1), 50));
    return repo.query("""
        SELECT warehouseName, productCode, productName, availableQty, safetyStockQty, shortageQty,
               CASE
                 WHEN shortageQty >= safetyStockQty * 0.5 THEN 'HIGH'
                 WHEN shortageQty > 0 THEN 'MEDIUM'
                 ELSE 'LOW'
               END AS warningLevel
        FROM (
          SELECT w.warehouse_name AS warehouseName,
                 p.product_code AS productCode,
                 p.product_name AS productName,
                 COALESCE(SUM(i.available_qty), 0) AS availableQty,
                 p.safety_stock AS safetyStockQty,
                 GREATEST(p.safety_stock - COALESCE(SUM(i.available_qty), 0), 0) AS shortageQty
          FROM wms_inventory i
          JOIN wms_warehouse w ON w.id = i.warehouse_id
          JOIN md_product p ON p.id = i.product_id
          GROUP BY w.id, w.warehouse_name, p.id, p.product_code, p.product_name, p.safety_stock
        ) t
        WHERE shortageQty > 0
        ORDER BY shortageQty DESC
        LIMIT :limit
        """, params);
  }

  private List<Map<String, Object>> todoListData() {
    List<Map<String, Object>> rows = new ArrayList<>();
    rows.add(todo("入库待办", "待采集 SN", repo.number("""
        SELECT COUNT(*) FROM wms_inbound_order o
        WHERE o.status IN ('CREATED', 'PARTIAL_RECEIVED', 'RECEIVING')
          AND EXISTS (
            SELECT 1 FROM wms_inbound_order_detail d
            WHERE d.order_id = o.id AND d.sn_required = 1 AND d.planned_qty > d.received_qty
          )
        """, Map.of()), "/inbound/arrival-notices"));
    rows.add(todo("入库待办", "待收货", repo.number("""
        SELECT COUNT(*) FROM wms_inbound_order WHERE planned_qty > received_qty AND status <> 'CLOSED'
        """, Map.of()), "/inbound/arrival-notices"));
    rows.add(todo("入库待办", "SAP 回传失败", repo.number("""
        SELECT COUNT(*) FROM wms_inbound_order WHERE sap_post_status = 'FAILED'
        """, Map.of()), "/inbound/arrival-notices?sapPostStatus=FAILED"));
    rows.add(todo("出库待办", "待分配", repo.number("""
        SELECT COUNT(*) FROM wms_outbound_order WHERE status IN ('PENDING_ALLOC', 'CREATED')
        """, Map.of()), "/outbound/shipping-orders"));
    rows.add(todo("出库待办", "待拣货", repo.number("""
        SELECT COUNT(*) FROM wms_outbound_order WHERE status IN ('ALLOCATED', 'PICKING') OR allocated_qty > picked_qty
        """, Map.of()), "/outbound/shipping-orders"));
    rows.add(todo("出库待办", "待发货", repo.number("""
        SELECT COUNT(*) FROM wms_outbound_order WHERE status IN ('PICKED', 'REVIEWED') OR review_qty > shipped_qty
        """, Map.of()), "/outbound/shipping-orders"));
    rows.add(todo("库存待办", "安全库存预警", repo.number("""
        SELECT COUNT(*) FROM (
          SELECT p.id, w.id AS warehouse_id, p.safety_stock, COALESCE(SUM(i.available_qty), 0) AS available_qty
          FROM wms_inventory i
          JOIN wms_warehouse w ON w.id = i.warehouse_id
          JOIN md_product p ON p.id = i.product_id
          GROUP BY p.id, w.id, p.safety_stock
          HAVING p.safety_stock > 0 AND available_qty < p.safety_stock
        ) t
        """, Map.of()), "/inventory/list"));
    rows.add(todo("库存待办", "长库龄预警", repo.number("""
        SELECT COUNT(*) FROM wms_inventory i
        JOIN md_product p ON p.id = i.product_id
        WHERE DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days
        """, Map.of()), "/inventory/list"));
    return rows;
  }

  private List<Map<String, Object>> pendingInboundData(int limit) {
    return repo.query("""
        SELECT o.id,
               o.order_no AS inboundOrderNo,
               o.inbound_type AS inboundType,
               w.warehouse_name AS warehouseName,
               COALESCE(o.owner_name, s.supplier_name, c.customer_name, w.warehouse_name) AS ownerName,
               COUNT(d.id) AS lineCount,
               COALESCE(SUM(GREATEST(d.planned_qty - d.received_qty, 0)), 0) AS pendingReceiveQty,
               o.status,
               o.created_at AS createdAt
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN md_supplier s ON s.id = o.supplier_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        JOIN wms_inbound_order_detail d ON d.order_id = o.id
        WHERE o.status <> 'CLOSED'
        GROUP BY o.id, o.order_no, o.inbound_type, w.warehouse_name, o.owner_name, s.supplier_name, c.customer_name, o.status, o.created_at
        HAVING pendingReceiveQty > 0
        ORDER BY o.created_at DESC
        LIMIT :limit
        """, Map.of("limit", Math.min(Math.max(limit, 1), 50)));
  }

  private List<Map<String, Object>> pendingOutboundData(int limit) {
    return repo.query("""
        SELECT o.id,
               o.order_no AS outboundOrderNo,
               o.outbound_type AS outboundType,
               w.warehouse_name AS warehouseName,
               c.customer_name AS customerName,
               o.planned_qty AS orderQty,
               o.status,
               o.created_at AS createdAt
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        WHERE o.status <> 'SHIPPED'
        ORDER BY o.created_at DESC
        LIMIT :limit
        """, Map.of("limit", Math.min(Math.max(limit, 1), 50)));
  }

  private List<Map<String, Object>> businessEntries() {
    return List.of(
        entry("采集 SN", "入库作业", "/inbound/arrival-notices", "CirclePlus"),
        entry("收货确认", "入库作业", "/inbound/arrival-notices", "Download"),
        entry("SAP 回传异常", "接口处理", "/inbound/arrival-notices?sapPostStatus=FAILED", "Warning"),
        entry("库存查询", "库存管理", "/inventory/list", "Search"),
        entry("产品主数据", "基础数据", "/masterdata/products", "Box"),
        entry("客户主数据", "基础数据", "/masterdata/customers", "User")
    );
  }

  private Map<String, Object> todo(String group, String title, Number count, String path) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("group", group);
    row.put("title", title);
    row.put("count", count == null ? 0 : count);
    row.put("recentDoc", "");
    row.put("path", path);
    return row;
  }

  private Map<String, Object> entry(String title, String group, String path, String icon) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("title", title);
    row.put("group", group);
    row.put("path", path);
    row.put("icon", icon);
    return row;
  }

  private String like(String value) {
    return value == null || value.isBlank() ? null : "%" + value.trim() + "%";
  }
}
