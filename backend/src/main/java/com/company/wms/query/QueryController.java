package com.company.wms.query;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QueryController {
  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  public QueryController(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
  }

  @GetMapping("/api/inventory")
  public ApiResponse<PageResult<Map<String, Object>>> inventory(
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(required = false) String locationCode,
      @RequestParam(required = false) String productCode,
      @RequestParam(required = false) String batchNo,
      @RequestParam(required = false) String inventoryStatus,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("ownerCode", repo.like(ownerCode));
    params.put("locationCode", repo.like(locationCode));
    params.put("productCode", repo.like(productCode));
    params.put("batchNo", repo.like(batchNo));
    params.put("inventoryStatus", repo.like(inventoryStatus));
    String from = """
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN wms_area a ON a.id = i.area_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN md_product p ON p.id = i.product_id
        WHERE (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:ownerCode IS NULL OR p.owner_code LIKE :ownerCode OR p.owner_name LIKE :ownerCode)
          AND (:locationCode IS NULL OR l.location_code LIKE :locationCode)
          AND (:productCode IS NULL OR p.product_code LIKE :productCode)
          AND (:batchNo IS NULL OR i.batch_no LIKE :batchNo)
          AND (:inventoryStatus IS NULL OR i.inventory_status LIKE :inventoryStatus)
        """;
    return ApiResponse.ok(repo.page(
        """
        SELECT i.*, w.warehouse_code, w.warehouse_name, a.area_code, a.area_name,
               l.location_code, p.owner_code, p.owner_name, p.product_code, p.product_name, p.safety_stock, p.aging_threshold_days,
               CASE WHEN i.available_qty < p.safety_stock THEN 1 ELSE 0 END AS low_stock,
               CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days THEN 1 ELSE 0 END AS aged
        """ + from + " ORDER BY low_stock DESC, aged DESC, i.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    ));
  }

  @GetMapping("/api/serial-numbers")
  public ApiResponse<PageResult<Map<String, Object>>> serialNumbers(
      @RequestParam(required = false) String snCode,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(required = false) String productCode,
      @RequestParam(required = false) String palletCode,
      @RequestParam(required = false) String boxCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("snCode", repo.like(snCode));
    params.put("ownerCode", repo.like(ownerCode));
    params.put("productCode", repo.like(productCode));
    params.put("palletCode", repo.like(palletCode));
    params.put("boxCode", repo.like(boxCode));
    params.put("status", repo.like(status));
    String from = """
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE (:snCode IS NULL OR s.sn_code LIKE :snCode)
          AND (:ownerCode IS NULL OR p.owner_code LIKE :ownerCode OR p.owner_name LIKE :ownerCode)
          AND (:productCode IS NULL OR p.product_code LIKE :productCode)
          AND (:palletCode IS NULL OR s.pallet_code LIKE :palletCode)
          AND (:boxCode IS NULL OR s.box_code LIKE :boxCode)
          AND (:status IS NULL OR s.status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        """
        SELECT s.*, p.owner_code, p.owner_name, p.product_code, p.product_name, w.warehouse_code, w.warehouse_name, l.location_code
        """ + from + " ORDER BY s.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    ));
  }

  @GetMapping("/api/inbound/sn-bindings")
  public ApiResponse<PageResult<Map<String, Object>>> snBindings(
      @RequestParam(required = false) String palletCode,
      @RequestParam(required = false) String asnNo,
      @RequestParam(required = false) String boxCode,
      @RequestParam(required = false) String snCode,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("palletCode", repo.like(palletCode));
    params.put("asnNo", repo.like(asnNo));
    params.put("boxCode", repo.like(boxCode));
    params.put("snCode", repo.like(snCode));
    String from = """
        FROM wms_package_binding b
        LEFT JOIN wms_serial_number s ON s.sn_code = b.sn_code
        LEFT JOIN md_product p ON p.id = b.product_id
        LEFT JOIN wms_inbound_order_detail d ON d.id = b.inbound_order_line_id
        WHERE (:palletCode IS NULL OR b.pallet_code LIKE :palletCode)
          AND (:asnNo IS NULL OR b.inbound_order_no LIKE :asnNo OR b.bind_order_no LIKE :asnNo)
          AND (:boxCode IS NULL OR b.box_code LIKE :boxCode)
          AND (:snCode IS NULL OR b.sn_code LIKE :snCode)
        """;
    return ApiResponse.ok(repo.page(
        """
        SELECT b.id, b.sn_code, b.box_code, b.pallet_code,
               COALESCE(b.inbound_order_no, b.bind_order_no) AS inbound_order_no,
               b.inbound_order_line_id, d.line_no,
               p.product_code, p.product_name, b.bind_status, b.bind_time,
               s.status AS sn_status
        """ + from + " ORDER BY b.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    ));
  }

  @GetMapping({"/api/inbound-orders", "/api/inbound/arrival-notices"})
  public ApiResponse<PageResult<Map<String, Object>>> inboundOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String inboundType,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String owner,
      @RequestParam(required = false) String sapPostStatus,
      @RequestParam(required = false) String createdStart,
      @RequestParam(required = false) String createdEnd,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("orderNo", repo.like(orderNo));
    params.put("sourceOrderNo", repo.like(sourceOrderNo));
    params.put("inboundType", repo.like(inboundType));
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("owner", repo.like(owner));
    params.put("sapPostStatus", repo.like(sapPostStatus));
    params.put("createdStart", createdStart);
    params.put("createdEnd", createdEnd);
    params.put("status", repo.like(status));
    String from = """
        FROM wms_inbound_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN md_supplier s ON s.id = o.supplier_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        LEFT JOIN (
          SELECT order_id,
                 COUNT(*) AS line_count,
                 COALESCE(SUM(planned_qty), 0) AS total_planned_qty,
                 COALESCE(SUM(received_qty), 0) AS total_received_qty,
                 COALESCE(SUM(shelved_qty), 0) AS total_shelved_qty
          FROM wms_inbound_order_detail
          GROUP BY order_id
        ) agg ON agg.order_id = o.id
        LEFT JOIN (
          SELECT inbound_order_no,
                 SUM(CASE WHEN status IN ('COLLECTED', 'RECEIVED', 'ON_SHELF') THEN 1 ELSE 0 END) AS total_collected_qty,
                 SUM(CASE WHEN status = 'COLLECTED' THEN 1 ELSE 0 END) AS total_pending_receive_qty
          FROM wms_serial_number
          WHERE inbound_order_no IS NOT NULL
          GROUP BY inbound_order_no
        ) snagg ON snagg.inbound_order_no = o.order_no
        LEFT JOIN (
          SELECT inbound_order_id,
                 SUM(CASE WHEN sap_post_status IN ('NOT_POSTED', 'FAILED') THEN 1 ELSE 0 END) AS pending_sap_receipt_count
          FROM wms_inbound_receipt
          GROUP BY inbound_order_id
        ) ragg ON ragg.inbound_order_id = o.id
        WHERE (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:sourceOrderNo IS NULL OR o.source_order_no LIKE :sourceOrderNo)
          AND (:inboundType IS NULL OR o.inbound_type LIKE :inboundType)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR COALESCE(o.owner_code, s.supplier_code, c.customer_code, w.owner_code, 'OWN') LIKE :owner
            OR COALESCE(o.owner_name, s.supplier_name, c.customer_name, w.warehouse_name) LIKE :owner)
          AND (:sapPostStatus IS NULL OR COALESCE(o.sap_post_status, 'NOT_POSTED') LIKE :sapPostStatus)
          AND (:createdStart IS NULL OR o.created_at >= :createdStart)
          AND (:createdEnd IS NULL OR o.created_at < DATE_ADD(:createdEnd, INTERVAL 1 DAY))
          AND (:status IS NULL OR o.status LIKE :status)
        """;
    PageResult<Map<String, Object>> page = repo.page(
        """
        SELECT o.*, w.warehouse_code, w.warehouse_name, s.supplier_code, s.supplier_name,
               c.customer_code, c.customer_name,
               COALESCE(o.owner_code, s.supplier_code, c.customer_code, w.owner_code, 'OWN') AS owner_code,
               COALESCE(o.owner_name, s.supplier_name, c.customer_name, w.warehouse_name) AS owner_name,
               COALESCE(o.mes_work_order_no, o.source_order_no) AS related_order_no,
               COALESCE(o.sap_post_status, 'NOT_POSTED') AS sap_post_status,
               COALESCE(o.sap_post_result, '') AS sap_post_result,
               COALESCE(o.sap_material_doc_no, '') AS sap_material_doc_no,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_planned_qty, o.planned_qty) AS planned_qty,
               COALESCE(agg.total_received_qty, o.received_qty) AS received_qty,
               COALESCE(agg.total_shelved_qty, 0) AS shelved_qty,
               COALESCE(snagg.total_collected_qty, 0) AS collected_qty,
               COALESCE(snagg.total_pending_receive_qty, 0) AS pending_receive_qty,
               COALESCE(ragg.pending_sap_receipt_count, 0) AS pending_sap_receipt_count,
               'system' AS created_by,
               'system' AS updated_by
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    );
    return ApiResponse.ok(attachInboundLines(page));
  }

  private PageResult<Map<String, Object>> attachInboundLines(PageResult<Map<String, Object>> page) {
    if (page.items().isEmpty()) {
      return page;
    }
    List<Long> orderIds = page.items().stream()
        .map(row -> ((Number) row.get("id")).longValue())
        .toList();
    List<Map<String, Object>> lines = repo.query("""
        SELECT d.order_id,
               d.id,
               d.line_no,
               d.product_id,
               p.product_code,
               p.product_name,
               COALESCE(d.sn_required, p.sn_managed) AS sn_required,
               COALESCE(d.sap_plant, o.sap_plant, '') AS sap_plant,
               d.sap_storage_location,
               d.planned_qty,
               d.received_qty,
               d.shelved_qty,
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
        JOIN md_product p ON p.id = d.product_id
        WHERE d.order_id IN (:orderIds)
        ORDER BY d.order_id DESC, d.line_no
        """, Map.of("orderIds", orderIds));
    Map<Long, List<Map<String, Object>>> lineMap = new HashMap<>();
    for (Map<String, Object> line : lines) {
      long orderId = ((Number) line.get("order_id")).longValue();
      line.put("lineNo", line.get("line_no"));
      line.put("productId", line.get("product_id"));
      line.put("productCode", line.get("product_code"));
      line.put("productName", line.get("product_name"));
      line.put("snRequired", intValue(line.get("sn_required"), 0) == 1);
      line.put("sapPlant", line.get("sap_plant"));
      line.put("sapStorageLocation", line.get("sap_storage_location"));
      line.put("planQty", line.get("planned_qty"));
      line.put("collectedQty", line.get("collected_sn_qty"));
      line.put("pendingReceiveQty", line.get("pending_receive_qty"));
      line.put("receivedQty", line.get("received_qty"));
      line.put("shelvedQty", line.get("shelved_qty"));
      line.put("lineStatus", line.get("line_status"));
      lineMap.computeIfAbsent(orderId, key -> new java.util.ArrayList<>()).add(line);
    }
    for (Map<String, Object> item : page.items()) {
      long orderId = ((Number) item.get("id")).longValue();
      item.put("lines", lineMap.getOrDefault(orderId, List.of()));
    }
    return page;
  }

  @GetMapping("/api/outbound-orders-legacy")
  public ApiResponse<PageResult<Map<String, Object>>> outboundOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String outboundType,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String customerCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("orderNo", repo.like(orderNo));
    params.put("sourceOrderNo", repo.like(sourceOrderNo));
    params.put("outboundType", repo.like(outboundType));
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
        WHERE (:orderNo IS NULL OR o.order_no LIKE :orderNo)
          AND (:sourceOrderNo IS NULL OR o.source_order_no LIKE :sourceOrderNo)
          AND (:outboundType IS NULL OR o.outbound_type LIKE :outboundType)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:customerCode IS NULL OR c.customer_code LIKE :customerCode)
          AND (:status IS NULL OR o.status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
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
    ));
  }

  @GetMapping("/api/interface-logs")
  public ApiResponse<PageResult<Map<String, Object>>> interfaceLogs(
      @RequestParam(required = false) String interfaceName,
      @RequestParam(required = false) String sourceSystem,
      @RequestParam(required = false) String targetSystem,
      @RequestParam(required = false) String businessDocNo,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("interfaceName", repo.like(interfaceName));
    params.put("sourceSystem", repo.like(sourceSystem));
    params.put("targetSystem", repo.like(targetSystem));
    params.put("businessDocNo", repo.like(businessDocNo));
    params.put("status", repo.like(status));
    String where = """
        WHERE (:interfaceName IS NULL OR interface_name LIKE :interfaceName)
          AND (:sourceSystem IS NULL OR source_system LIKE :sourceSystem)
          AND (:targetSystem IS NULL OR target_system LIKE :targetSystem)
          AND (:businessDocNo IS NULL OR business_doc_no LIKE :businessDocNo)
          AND (:status IS NULL OR status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT * FROM wms_interface_log " + where + " ORDER BY id DESC",
        "SELECT COUNT(*) FROM wms_interface_log " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  @PostMapping("/api/interface-logs/{id}/retry")
  public ApiResponse<Map<String, Object>> retryInterfaceLog(
      @PathVariable long id,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    Map<String, Object> log = repo.one("SELECT * FROM wms_interface_log WHERE id = :id", Map.of("id", id));
    if (log == null) {
      throw new IllegalArgumentException("接口日志不存在");
    }
    String interfaceName = text(log.get("interface_name"));
    String businessDocNo = text(log.get("business_doc_no"));
    Map<String, Object> config = repo.one(
        "SELECT * FROM wms_mock_config WHERE interface_name = :interfaceName",
        Map.of("interfaceName", interfaceName)
    );
    boolean enabled = config == null || boolValue(config.get("enabled"));
    boolean forceFail = config != null && boolValue(config.get("force_fail"));
    String operator = text(body == null ? null : body.getOrDefault("operator", "admin"));
    int retryCount = intValue(log.get("retry_count"), 0) + 1;
    String nextStatus = enabled && !forceFail ? "SUCCESS" : "FAILED";
    String errorMessage = "SUCCESS".equals(nextStatus)
        ? null
        : text(config == null ? "Mock 配置未启用，重试失败" : config.getOrDefault("failure_message", "Mock 配置为失败，重试失败"));
    Map<String, Object> response = "SUCCESS".equals(nextStatus)
        ? Map.of("retryStatus", "SUCCESS", "message", "人工重试成功")
        : Map.of("retryStatus", "FAILED", "message", errorMessage);

    Map<String, Object> updateParams = new HashMap<>();
    updateParams.put("id", id);
    updateParams.put("status", nextStatus);
    updateParams.put("retryCount", retryCount);
    updateParams.put("responseBody", "SUCCESS".equals(nextStatus)
        ? "{\"retryStatus\":\"SUCCESS\",\"message\":\"人工重试成功\"}"
        : "{\"retryStatus\":\"FAILED\",\"message\":\"" + errorMessage + "\"}");
    updateParams.put("errorMessage", errorMessage);
    jdbc.update("""
        UPDATE wms_interface_log
        SET status = :status,
            retry_count = :retryCount,
            response_body = :responseBody,
            error_message = :errorMessage
        WHERE id = :id
        """, updateParams);
    repo.interfaceLog(
        interfaceName,
        text(log.get("source_system")),
        text(log.get("target_system")),
        businessDocNo,
        text(log.get("request_url")),
        Map.of("retryFromLogId", id, "operator", operator),
        response,
        nextStatus,
        errorMessage
    );
    repo.operationLog("INTERFACE", businessDocNo, "INTERFACE_RETRY", operator, nextStatus,
        "接口日志人工重试 " + interfaceName + "，结果 " + nextStatus);
    return ApiResponse.ok(Map.of(
        "id", id,
        "status", nextStatus,
        "retryCount", retryCount,
        "message", "SUCCESS".equals(nextStatus) ? "重试成功" : errorMessage
    ));
  }

  @GetMapping("/api/mock-configs")
  public ApiResponse<PageResult<Map<String, Object>>> mockConfigs(
      @RequestParam(required = false) String interfaceName,
      @RequestParam(required = false) String targetSystem,
      @RequestParam(required = false) String enabled,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("interfaceName", repo.like(interfaceName));
    params.put("targetSystem", repo.like(targetSystem));
    params.put("enabled", repo.integerOrNull(enabled));
    String where = """
        WHERE (:interfaceName IS NULL OR interface_name LIKE :interfaceName)
          AND (:targetSystem IS NULL OR target_system LIKE :targetSystem)
          AND (:enabled IS NULL OR enabled = :enabled)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT * FROM wms_mock_config " + where + " ORDER BY id",
        "SELECT COUNT(*) FROM wms_mock_config " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  @PutMapping("/api/mock-configs/{id}")
  public ApiResponse<Map<String, Object>> updateMockConfig(
      @PathVariable long id,
      @RequestBody Map<String, Object> body
  ) {
    Map<String, Object> existing = repo.one("SELECT * FROM wms_mock_config WHERE id = :id", Map.of("id", id));
    if (existing == null) {
      throw new IllegalArgumentException("Mock 配置不存在");
    }
    jdbc.update("""
        UPDATE wms_mock_config
        SET enabled = :enabled,
            force_fail = :forceFail,
            delay_ms = :delayMs,
            failure_message = :failureMessage,
            updated_by = :updatedBy
        WHERE id = :id
        """, Map.of(
        "id", id,
        "enabled", boolValue(body.getOrDefault("enabled", existing.get("enabled"))) ? 1 : 0,
        "forceFail", boolValue(body.getOrDefault("force_fail", body.getOrDefault("forceFail", existing.get("force_fail")))) ? 1 : 0,
        "delayMs", intValue(body.getOrDefault("delay_ms", body.getOrDefault("delayMs", existing.get("delay_ms"))), 120),
        "failureMessage", text(body.getOrDefault("failure_message", body.getOrDefault("failureMessage", existing.get("failure_message")))),
        "updatedBy", text(body.getOrDefault("updatedBy", "admin"))
    ));
    repo.operationLog("INTERFACE", text(existing.get("interface_name")), "MOCK_CONFIG_UPDATE", text(body.getOrDefault("updatedBy", "admin")), "SUCCESS",
        "更新 Mock 配置 " + existing.get("interface_name"));
    return ApiResponse.ok(repo.one("SELECT * FROM wms_mock_config WHERE id = :id", Map.of("id", id)));
  }

  @GetMapping("/api/system/users")
  public ApiResponse<PageResult<Map<String, Object>>> users(
      @RequestParam(required = false) String username,
      @RequestParam(required = false) String roleCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("username", repo.like(username));
    params.put("roleCode", repo.like(roleCode));
    params.put("status", repo.like(status));
    String where = """
        WHERE (:username IS NULL OR username LIKE :username)
          AND (:roleCode IS NULL OR role_code LIKE :roleCode)
          AND (:status IS NULL OR status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT id, username, display_name, role_code, role_name, warehouse_scope, status, created_at, updated_at FROM sys_user " + where + " ORDER BY id DESC",
        "SELECT COUNT(*) FROM sys_user " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  private boolean boolValue(Object value) {
    if (value == null) {
      return false;
    }
    if (value instanceof Boolean bool) {
      return bool;
    }
    if (value instanceof Number number) {
      return number.intValue() != 0;
    }
    String text = String.valueOf(value);
    return "true".equalsIgnoreCase(text) || "1".equals(text) || "Y".equalsIgnoreCase(text);
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

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value);
  }
}
