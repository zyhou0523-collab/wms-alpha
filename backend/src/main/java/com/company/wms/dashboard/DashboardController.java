package com.company.wms.dashboard;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.WmsRepository;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
  private final WmsRepository repo;

  public DashboardController(WmsRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/summary")
  public ApiResponse<Map<String, Object>> summary(
      @RequestParam(defaultValue = "GROUP") String level,
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    Map<String, Object> stock = repo.one("""
        SELECT COALESCE(SUM(i.total_qty), 0) AS totalStockQty,
               COALESCE(SUM(i.available_qty), 0) AS availableStockQty,
               COALESCE(SUM(i.allocated_qty), 0) AS allocatedStockQty,
               COALESCE(SUM(i.frozen_qty), 0) AS frozenStockQty
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere(), params);

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("level", level);
    data.put("scopeName", scopeName(level, params));
    data.put("totalStockQty", number(stock, "totalStockQty"));
    data.put("availableStockQty", number(stock, "availableStockQty"));
    data.put("allocatedStockQty", number(stock, "allocatedStockQty"));
    data.put("frozenStockQty", number(stock, "frozenStockQty"));
    data.put("safetyWarningSkuCount", repo.number("""
        SELECT COUNT(*) FROM (
          SELECT w.id AS warehouse_id, p.id AS product_id, p.safety_stock,
                 COALESCE(SUM(i.available_qty), 0) AS available_qty
          FROM wms_inventory i
          JOIN wms_warehouse w ON w.id = i.warehouse_id
          JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere() + """
          GROUP BY w.id, p.id, p.safety_stock
          HAVING p.safety_stock > 0 AND available_qty < p.safety_stock
        ) t
        """, params));
    data.put("agingWarningSkuCount", repo.number("""
        SELECT COUNT(*) FROM (
          SELECT w.id AS warehouse_id, p.id AS product_id, COALESCE(i.batch_no, '') AS batch_no
          FROM wms_inventory i
          JOIN wms_warehouse w ON w.id = i.warehouse_id
          JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere() + """
            AND DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days
          GROUP BY w.id, p.id, COALESCE(i.batch_no, '')
        ) t
        """, params));
    data.put("interfaceFailedCount", repo.number("""
        SELECT COUNT(*) FROM wms_interface_log
        WHERE status = 'FAILED'
        """, Map.of()));
    data.put("sapFailedCount", repo.number("""
        SELECT COUNT(*) FROM wms_interface_log
        WHERE status = 'FAILED' AND target_system = 'SAP'
        """, Map.of()));
    data.put("todayInboundQty", repo.number("""
        SELECT COALESCE(SUM(o.received_qty), 0)
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        WHERE DATE(o.created_at) = CURDATE()
          AND (:region IS NULL OR w.region = :region)
          AND (:warehouseId IS NULL OR w.id = :warehouseId)
          AND (:ownerCode IS NULL OR COALESCE(o.owner_code, w.owner_code, '') = :ownerCode)
        """, params));
    data.put("todayOutboundQty", repo.number("""
        SELECT COALESCE(SUM(o.shipped_qty), 0)
        FROM wms_outbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        WHERE DATE(o.created_at) = CURDATE()
          AND (:region IS NULL OR w.region = :region)
          AND (:warehouseId IS NULL OR w.id = :warehouseId)
          AND (:ownerCode IS NULL OR COALESCE(w.owner_code, '') = :ownerCode)
        """, params));
    return ApiResponse.ok(data);
  }

  @GetMapping("/inventory-structure")
  public ApiResponse<List<Map<String, Object>>> inventoryStructure(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    List<Map<String, Object>> rows = new ArrayList<>();
    rows.add(metric("可用库存", repo.number("""
        SELECT COALESCE(SUM(i.available_qty), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere(), params), "#22c55e"));
    rows.add(metric("已分配库存", repo.number("""
        SELECT COALESCE(SUM(i.allocated_qty), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere(), params), "#3b82f6"));
    rows.add(metric("冻结库存", repo.number("""
        SELECT COALESCE(SUM(i.frozen_qty), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere(), params), "#f97316"));
    rows.add(metric("待检库存", repo.number("""
        SELECT COALESCE(SUM(i.total_qty), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere() + " AND i.inventory_status = 'PENDING'", params), "#eab308"));
    rows.add(metric("不合格库存", repo.number("""
        SELECT COALESCE(SUM(CASE WHEN i.unqualified_qty > 0 THEN i.unqualified_qty ELSE i.total_qty END), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere() + " AND i.inventory_status = 'UNQUALIFIED'", params), "#ef4444"));
    return ApiResponse.ok(rows);
  }

  @GetMapping("/warehouse-map")
  public ApiResponse<List<Map<String, Object>>> warehouseMap(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    return ApiResponse.ok(repo.query("""
        SELECT w.id AS warehouseId,
               w.warehouse_code AS warehouseCode,
               w.warehouse_name AS warehouseName,
               w.warehouse_type AS warehouseType,
               w.region,
               COALESCE(w.country, '中国') AS country,
               COALESCE(w.city, '-') AS city,
               COALESCE(SUM(i.total_qty), 0) AS stockQty,
               COALESCE(SUM(CASE WHEN p.safety_stock > 0 AND i.available_qty < p.safety_stock THEN 1 ELSE 0 END), 0) AS warningCount,
               CASE COALESCE(w.city, '')
                 WHEN '杭州' THEN 120.15 WHEN '上海' THEN 121.47 WHEN '广州' THEN 113.27
                 WHEN '深圳' THEN 114.05 WHEN '宁德' THEN 119.52 ELSE 116.40
               END AS longitude,
               CASE COALESCE(w.city, '')
                 WHEN '杭州' THEN 30.28 WHEN '上海' THEN 31.23 WHEN '广州' THEN 23.13
                 WHEN '深圳' THEN 22.55 WHEN '宁德' THEN 26.66 ELSE 39.90
               END AS latitude
        FROM wms_warehouse w
        LEFT JOIN wms_inventory i ON i.warehouse_id = w.id
        LEFT JOIN md_product p ON p.id = i.product_id
        WHERE (:region IS NULL OR w.region = :region)
          AND (:warehouseId IS NULL OR w.id = :warehouseId)
          AND (:ownerCode IS NULL OR COALESCE(p.owner_code, w.owner_code, '') = :ownerCode)
        GROUP BY w.id, w.warehouse_code, w.warehouse_name, w.warehouse_type, w.region, w.country, w.city
        ORDER BY stockQty DESC, w.id
        LIMIT 20
        """, params));
  }

  @GetMapping("/inout-trend")
  public ApiResponse<Map<String, Object>> inoutTrend(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    List<Map<String, Object>> rows = repo.query("""
        SELECT month_key, SUM(inbound_qty) AS inbound_qty, SUM(outbound_qty) AS outbound_qty
        FROM (
          SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month_key, SUM(o.received_qty) AS inbound_qty, 0 AS outbound_qty
          FROM wms_inbound_order o
          JOIN wms_warehouse w ON w.id = o.warehouse_id
          WHERE (:region IS NULL OR w.region = :region)
            AND (:warehouseId IS NULL OR w.id = :warehouseId)
            AND (:ownerCode IS NULL OR COALESCE(o.owner_code, w.owner_code, '') = :ownerCode)
          GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
          UNION ALL
          SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS month_key, 0 AS inbound_qty, SUM(o.shipped_qty) AS outbound_qty
          FROM wms_outbound_order o
          JOIN wms_warehouse w ON w.id = o.warehouse_id
          WHERE (:region IS NULL OR w.region = :region)
            AND (:warehouseId IS NULL OR w.id = :warehouseId)
            AND (:ownerCode IS NULL OR COALESCE(w.owner_code, '') = :ownerCode)
          GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
        ) t
        GROUP BY month_key
        ORDER BY month_key
        """, params);

    Map<String, Map<String, Object>> byMonth = new HashMap<>();
    for (Map<String, Object> row : rows) {
      byMonth.put(String.valueOf(row.get("month_key")), row);
    }
    YearMonth start = YearMonth.now().minusMonths(5);
    List<String> xAxis = new ArrayList<>();
    List<Long> inboundQty = new ArrayList<>();
    List<Long> outboundQty = new ArrayList<>();
    List<Long> stockBalance = new ArrayList<>();
    long balance = Math.max(0, repo.number("""
        SELECT COALESCE(SUM(i.total_qty), 0)
        FROM wms_inventory i JOIN wms_warehouse w ON w.id = i.warehouse_id JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere(), params).longValue() - 100);
    for (int i = 0; i < 6; i++) {
      String month = start.plusMonths(i).toString();
      Map<String, Object> row = byMonth.getOrDefault(month, Map.of());
      long inbound = longValue(row.get("inbound_qty"));
      long outbound = longValue(row.get("outbound_qty"));
      balance = Math.max(0, balance + inbound - outbound);
      xAxis.add(month);
      inboundQty.add(inbound);
      outboundQty.add(outbound);
      stockBalance.add(balance);
    }
    return ApiResponse.ok(Map.of(
        "xAxis", xAxis,
        "inboundQty", inboundQty,
        "outboundQty", outboundQty,
        "stockBalance", stockBalance
    ));
  }

  @GetMapping({"/warehouse-operation", "/warehouse-operations"})
  public ApiResponse<List<Map<String, Object>>> warehouseOperations(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    return ApiResponse.ok(repo.query("""
        SELECT w.warehouse_code AS warehouseCode,
               w.warehouse_name AS warehouseName,
               COALESCE(inb.inbound_qty, 0) AS inboundQty,
               COALESCE(outb.outbound_qty, 0) AS outboundQty,
               COALESCE(txn.count_qty, 0) AS countQty,
               COALESCE(exc.exception_qty, 0) AS exceptionQty
        FROM wms_warehouse w
        LEFT JOIN (
          SELECT warehouse_id, SUM(received_qty) AS inbound_qty FROM wms_inbound_order GROUP BY warehouse_id
        ) inb ON inb.warehouse_id = w.id
        LEFT JOIN (
          SELECT warehouse_id, SUM(shipped_qty) AS outbound_qty FROM wms_outbound_order GROUP BY warehouse_id
        ) outb ON outb.warehouse_id = w.id
        LEFT JOIN (
          SELECT warehouse_id, COUNT(*) AS count_qty FROM wms_inventory_transaction GROUP BY warehouse_id
        ) txn ON txn.warehouse_id = w.id
        LEFT JOIN (
          SELECT o.warehouse_id, COUNT(e.id) AS exception_qty
          FROM wms_outbound_exception e
          JOIN wms_outbound_order o ON o.id = e.outbound_order_id
          GROUP BY o.warehouse_id
        ) exc ON exc.warehouse_id = w.id
        WHERE (:region IS NULL OR w.region = :region)
          AND (:warehouseId IS NULL OR w.id = :warehouseId)
          AND (:ownerCode IS NULL OR COALESCE(w.owner_code, '') = :ownerCode)
        ORDER BY (COALESCE(inb.inbound_qty, 0) + COALESCE(outb.outbound_qty, 0)) DESC
        LIMIT 8
        """, params));
  }

  @GetMapping("/safety-warnings")
  public ApiResponse<List<Map<String, Object>>> safetyWarnings(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(defaultValue = "10") int limit
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    params.put("limit", Math.min(Math.max(limit, 1), 50));
    return ApiResponse.ok(repo.query("""
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
        """ + inventoryWhere() + """
          GROUP BY w.id, w.warehouse_name, p.id, p.product_code, p.product_name, p.safety_stock
        ) t
        WHERE shortageQty > 0
        ORDER BY shortageQty DESC, safetyStockQty DESC
        LIMIT :limit
        """, params));
  }

  @GetMapping("/aging-warnings")
  public ApiResponse<List<Map<String, Object>>> agingWarnings(
      @RequestParam(required = false) String region,
      @RequestParam(required = false) Long warehouseId,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(defaultValue = "10") int limit
  ) {
    Map<String, Object> params = scopeParams(region, warehouseId, ownerCode);
    params.put("limit", Math.min(Math.max(limit, 1), 50));
    return ApiResponse.ok(repo.query("""
        SELECT w.warehouse_name AS warehouseName,
               p.product_code AS productCode,
               p.product_name AS productName,
               COALESCE(i.batch_no, '-') AS batchNo,
               MIN(i.inbound_date) AS inboundDate,
               DATEDIFF(CURDATE(), MIN(i.inbound_date)) AS agingDays,
               p.aging_threshold_days AS thresholdDays,
               CASE WHEN p.battery_flag = 1 THEN '是' ELSE '否' END AS batteryFlag
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN md_product p ON p.id = i.product_id
        """ + inventoryWhere() + """
          AND DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days
        GROUP BY w.id, w.warehouse_name, p.id, p.product_code, p.product_name, COALESCE(i.batch_no, '-'), p.aging_threshold_days, p.battery_flag
        ORDER BY agingDays DESC
        LIMIT :limit
        """, params));
  }

  private Map<String, Object> scopeParams(String region, Long warehouseId, String ownerCode) {
    Map<String, Object> params = new HashMap<>();
    params.put("region", blankToNull(region));
    params.put("warehouseId", warehouseId);
    params.put("ownerCode", blankToNull(ownerCode));
    return params;
  }

  private String inventoryWhere() {
    return """
        WHERE (:region IS NULL OR w.region = :region)
          AND (:warehouseId IS NULL OR w.id = :warehouseId)
          AND (:ownerCode IS NULL OR COALESCE(p.owner_code, w.owner_code, '') = :ownerCode)
        """;
  }

  private Map<String, Object> metric(String name, Number value, String color) {
    Map<String, Object> row = new LinkedHashMap<>();
    row.put("name", name);
    row.put("value", value == null ? 0 : value);
    row.put("color", color);
    return row;
  }

  private String scopeName(String level, Map<String, Object> params) {
    if ("WAREHOUSE".equalsIgnoreCase(level) && params.get("warehouseId") != null) {
      Map<String, Object> warehouse = repo.one(
          "SELECT warehouse_name FROM wms_warehouse WHERE id = :warehouseId",
          Map.of("warehouseId", params.get("warehouseId"))
      );
      return warehouse == null ? "仓库层" : String.valueOf(warehouse.get("warehouse_name"));
    }
    if ("REGION".equalsIgnoreCase(level) && params.get("region") != null) {
      return params.get("region") + "地区部";
    }
    return "集团全局";
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private long number(Map<String, Object> row, String key) {
    return row == null ? 0 : longValue(row.get(key));
  }

  private long longValue(Object value) {
    if (value instanceof Number number) {
      return number.longValue();
    }
    if (value == null) {
      return 0;
    }
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return 0;
    }
  }
}
