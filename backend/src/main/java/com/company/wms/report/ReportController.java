package com.company.wms.report;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.CsvExport;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final WmsRepository repo;

  public ReportController(WmsRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/{reportKey}")
  public ApiResponse<PageResult<Map<String, Object>>> list(
      @PathVariable String reportKey,
      @RequestParam Map<String, String> query
  ) {
    List<Map<String, Object>> rows = filteredRows(reportKey, new HashMap<>(query));
    int pageNum = intValue(query.get("pageNum"), 1);
    int pageSize = Math.min(intValue(query.get("pageSize"), 10), 100);
    int from = Math.min(Math.max(pageNum - 1, 0) * pageSize, rows.size());
    int to = Math.min(from + pageSize, rows.size());
    return ApiResponse.ok(new PageResult<>(rows.subList(from, to), rows.size(), pageNum, pageSize));
  }

  @PostMapping("/{reportKey}/export")
  public ApiResponse<Map<String, Object>> export(
      @PathVariable String reportKey,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    Map<String, Object> query = body == null ? Map.of() : body;
    List<Map<String, Object>> rows = filteredRows(reportKey, query);
    List<Column> columns = columns(reportKey);
    List<List<?>> data = rows.stream()
        .map(row -> columns.stream().map(column -> value(row, column.prop())).toList())
        .map(row -> (List<?>) row)
        .toList();
    String filename = reportName(reportKey) + "_" + CsvExport.timestamp() + ".csv";
    return ApiResponse.ok(CsvExport.file(filename, CsvExport.csv(columns.stream().map(Column::label).toList(), data)));
  }

  private List<Map<String, Object>> filteredRows(String reportKey, Map<String, ?> query) {
    if (!reportNames().containsKey(reportKey)) {
      throw new IllegalArgumentException("报表不存在: " + reportKey);
    }
    return baseRows(reportKey).stream()
        .filter(row -> matchText(row, query))
        .filter(row -> matchDate(row, query))
        .toList();
  }

  private List<Map<String, Object>> baseRows(String reportKey) {
    return switch (reportKey) {
      case "inout-stock" -> inoutStockRows();
      case "inbound-daily" -> inboundDailyRows();
      case "outbound-daily" -> outboundDailyRows();
      case "standard-aging" -> standardAgingRows();
      case "segment-aging" -> segmentAgingRows();
      case "outbound-sn" -> outboundSnRows();
      case "inbound-sn" -> inboundSnRows();
      default -> List.of();
    };
  }

  private List<Map<String, Object>> inoutStockRows() {
    return repo.query("""
        SELECT
          DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS reportDate,
          COALESCE(i.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(i.owner_name, p.owner_name, '') AS ownerName,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          a.area_name AS areaName,
          l.location_code AS locationCode,
          COALESCE(p.owner_code, i.owner_code, '3060') AS sapPlant,
          '1001' AS sapStorageLocation,
          p.product_code AS productCode,
          p.product_name AS productName,
          p.product_name_en AS productNameEn,
          p.product_family AS productFamily,
          p.product_class AS productClass,
          p.category AS productCategory,
          p.unit AS unit,
          GREATEST(i.total_qty - COALESCE(inb.inboundQty, 0) + COALESCE(outb.outboundQty, 0), 0) AS openingQty,
          COALESCE(inb.inboundQty, 0) AS inboundQty,
          COALESCE(outb.outboundQty, 0) AS outboundQty,
          0 AS adjustInQty,
          0 AS adjustOutQty,
          i.frozen_qty AS frozenQty,
          i.allocated_qty AS allocatedQty,
          i.total_qty AS closingQty,
          i.available_qty AS availableQty,
          i.inventory_status AS stockStatus,
          CONCAT(i.inbound_date, ' 09:00:00') AS lastInboundTime,
          COALESCE(outb.lastOutboundTime, '') AS lastOutboundTime
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN wms_area a ON a.id = i.area_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN md_product p ON p.id = i.product_id
        LEFT JOIN (
          SELECT product_id, SUM(received_qty) AS inboundQty
          FROM wms_inbound_order_detail
          GROUP BY product_id
        ) inb ON inb.product_id = i.product_id
        LEFT JOIN (
          SELECT d.product_id, SUM(d.shipped_qty) AS outboundQty, MAX(o.ship_time) AS lastOutboundTime
          FROM wms_outbound_order_detail d
          JOIN wms_outbound_order o ON o.id = d.order_id
          GROUP BY d.product_id
        ) outb ON outb.product_id = i.product_id
        ORDER BY w.warehouse_code, p.product_code
        """, Map.of());
  }

  private List<Map<String, Object>> inboundDailyRows() {
    return repo.query("""
        SELECT
          DATE(COALESCE(r.receipt_time, o.created_at)) AS receiptDate,
          COALESCE(r.receipt_no, '') AS receiptNo,
          o.order_no AS inboundOrderNo,
          o.inbound_type AS inboundType,
          o.source_system AS sourceSystem,
          o.source_order_no AS sourceDocNo,
          COALESCE(o.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(o.owner_name, p.owner_name, '') AS ownerName,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          COALESCE(d.sap_plant, o.sap_plant, p.owner_code, '3060') AS sapPlant,
          d.sap_storage_location AS sapStorageLocation,
          d.line_no AS lineNo,
          p.product_code AS productCode,
          p.product_name AS productName,
          p.product_name AS productDescription,
          p.unit AS unit,
          d.planned_qty AS planQty,
          COALESCE(rl.receive_qty, 0) AS receiptQty,
          d.received_qty AS receivedQty,
          d.shelved_qty AS shelvedQty,
          COALESCE(d.sn_required, p.sn_managed) AS snRequired,
          COALESCE(r.status, d.status) AS receiptStatus,
          COALESCE(rl.sap_post_status, r.sap_post_status, o.sap_post_status, 'NOT_POSTED') AS sapPostStatus,
          COALESCE(rl.sap_material_doc_no, r.sap_material_doc_no, o.sap_material_doc_no, '') AS sapMaterialDocNo,
          COALESCE(rl.sap_post_result, r.sap_post_result, o.sap_post_result, '') AS sapPostResult,
          COALESCE(r.receipt_user, '') AS receiptUser,
          COALESCE(r.receipt_time, '') AS receiptTime,
          o.created_at AS createdAt
        FROM wms_inbound_order_detail d
        JOIN wms_inbound_order o ON o.id = d.order_id
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        JOIN md_product p ON p.id = d.product_id
        LEFT JOIN wms_inbound_receipt_line rl ON rl.inbound_order_line_id = d.id
        LEFT JOIN wms_inbound_receipt r ON r.id = rl.receipt_id
        ORDER BY COALESCE(r.receipt_time, o.created_at) DESC, o.order_no, d.line_no
        """, Map.of());
  }

  private List<Map<String, Object>> outboundDailyRows() {
    return repo.query("""
        SELECT
          DATE(COALESCE(sr.ship_time, o.ship_time, o.created_at)) AS shipmentDate,
          COALESCE(sr.shipment_no, '') AS shipmentNo,
          o.order_no AS outboundOrderNo,
          o.outbound_type AS outboundType,
          o.status AS orderStatus,
          COALESCE(o.related_order_no, o.source_order_no, '') AS relatedOrderNo,
          COALESCE(o.sales_order_no, o.source_order_no, '') AS salesOrderNo,
          COALESCE(o.rework_order_no, '') AS reworkOrderNo,
          COALESCE(o.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(o.owner_name, p.owner_name, '') AS ownerName,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          COALESCE(o.consignee_code, c.customer_code, '') AS consigneeCode,
          COALESCE(o.consignee_name, c.customer_name, '') AS consigneeName,
          COALESCE(tw.warehouse_name, '') AS targetWarehouseName,
          COALESCE(o.target_owner_name, '') AS targetOwnerName,
          COALESCE(d.sap_plant, p.owner_code, '3060') AS sapPlant,
          d.line_no AS lineNo,
          p.product_code AS productCode,
          p.product_name AS productDescription,
          COALESCE(d.unit, p.unit) AS unit,
          d.planned_qty AS orderQty,
          d.allocated_qty AS allocatedQty,
          d.picked_qty AS pickedQty,
          d.shipped_qty AS shipmentQty,
          d.shipped_qty AS shippedQty,
          COALESCE(sr.carrier, o.carrier_name, o.logistics_company, '') AS carrierName,
          COALESCE(sr.tracking_no, o.tracking_no, '') AS trackingNo,
          COALESCE(sr.sap_post_status, o.sap_post_status, 'NOT_POSTED') AS sapPostStatus,
          COALESCE(sr.sap_material_doc_no, o.sap_material_doc_no, '') AS sapMaterialDocNo,
          COALESCE(sr.sap_post_result, o.sap_post_result, '') AS sapPostResult,
          COALESCE(sr.shipper, o.shipper, '') AS shipmentUser,
          COALESCE(sr.ship_time, o.ship_time, '') AS shipmentTime,
          o.created_at AS createdAt
        FROM wms_outbound_order_detail d
        JOIN wms_outbound_order o ON o.id = d.order_id
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_warehouse tw ON tw.id = o.target_warehouse_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        JOIN md_product p ON p.id = d.product_id
        LEFT JOIN wms_shipment_record sr ON sr.outbound_order_id = o.id
        WHERE COALESCE(o.deleted_flag, 0) = 0
        ORDER BY COALESCE(sr.ship_time, o.ship_time, o.created_at) DESC, o.order_no, d.line_no
        """, Map.of());
  }

  private List<Map<String, Object>> standardAgingRows() {
    return repo.query("""
        SELECT
          DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS asOfDate,
          COALESCE(i.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(i.owner_name, p.owner_name, '') AS ownerName,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          a.area_name AS areaName,
          l.location_code AS locationCode,
          p.product_code AS productCode,
          p.product_name AS productName,
          p.product_name_en AS productNameEn,
          p.product_family AS productFamily,
          p.product_class AS productClass,
          p.category AS productCategory,
          p.unit AS unit,
          i.batch_no AS batchNo,
          COALESCE(s.sn_code, '') AS snCode,
          COALESCE(s.pallet_code, '') AS palletCode,
          COALESCE(s.box_code, '') AS boxCode,
          COALESCE(s.inbound_order_no, '') AS inboundOrderNo,
          i.inbound_date AS inboundDate,
          COALESCE(r.receipt_time, '') AS lastReceiptDate,
          CASE WHEN s.status IN ('ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'TRACED') THEN i.updated_at ELSE '' END AS lastShelvedDate,
          DATEDIFF(CURDATE(), i.inbound_date) AS agingDays,
          p.aging_threshold_days AS agingThresholdDays,
          CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days THEN 1 ELSE 0 END AS overdueFlag,
          p.battery_flag AS batteryFlag,
          i.total_qty AS stockQty,
          i.available_qty AS availableQty,
          i.frozen_qty AS frozenQty,
          i.inventory_status AS stockStatus,
          CASE
            WHEN DATEDIFF(CURDATE(), i.inbound_date) > 360 THEN '管理层重点关注'
            WHEN DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days AND p.battery_flag = 1 THEN '优先复检 / 补电 / 调拨'
            WHEN DATEDIFF(CURDATE(), i.inbound_date) > p.aging_threshold_days THEN '优先销售 / 调拨'
            ELSE '正常'
          END AS handlingSuggestion
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN wms_area a ON a.id = i.area_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN md_product p ON p.id = i.product_id
        LEFT JOIN wms_serial_number s ON s.product_id = i.product_id AND s.warehouse_id = i.warehouse_id AND s.location_id = i.location_id
        LEFT JOIN wms_inbound_receipt r ON r.inbound_order_no = s.inbound_order_no
        ORDER BY agingDays DESC, w.warehouse_code, p.product_code
        """, Map.of());
  }

  private List<Map<String, Object>> segmentAgingRows() {
    return repo.query("""
        SELECT
          COALESCE(i.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(i.owner_name, p.owner_name, '') AS ownerName,
          w.warehouse_code AS warehouseCode,
          w.warehouse_name AS warehouseName,
          p.product_code AS productCode,
          p.product_name AS productName,
          p.product_family AS productFamily,
          p.product_class AS productClass,
          p.unit AS unit,
          SUM(i.total_qty) AS totalStockQty,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) <= 30 THEN i.total_qty ELSE 0 END) AS qty_0_30,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) BETWEEN 31 AND 60 THEN i.total_qty ELSE 0 END) AS qty_31_60,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) BETWEEN 61 AND 90 THEN i.total_qty ELSE 0 END) AS qty_61_90,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) BETWEEN 91 AND 180 THEN i.total_qty ELSE 0 END) AS qty_91_180,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) BETWEEN 181 AND 270 THEN i.total_qty ELSE 0 END) AS qty_181_270,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) BETWEEN 271 AND 360 THEN i.total_qty ELSE 0 END) AS qty_271_360,
          SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) > 360 THEN i.total_qty ELSE 0 END) AS qty_over_360,
          CONCAT(ROUND(SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) > 360 THEN i.total_qty ELSE 0 END) / GREATEST(SUM(i.total_qty), 1) * 100, 0), '%') AS ratioOver360,
          p.battery_flag AS batteryFlag,
          CASE
            WHEN SUM(CASE WHEN DATEDIFF(CURDATE(), i.inbound_date) > 360 THEN i.total_qty ELSE 0 END) > 0 THEN '管理层重点关注'
            WHEN MAX(DATEDIFF(CURDATE(), i.inbound_date)) > p.aging_threshold_days THEN '优先消化'
            ELSE '正常'
          END AS handlingSuggestion
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN md_product p ON p.id = i.product_id
        GROUP BY COALESCE(i.owner_code, p.owner_code, '3060'), COALESCE(i.owner_name, p.owner_name, ''), w.warehouse_code, w.warehouse_name,
                 p.product_code, p.product_name, p.product_family, p.product_class, p.unit, p.battery_flag, p.aging_threshold_days
        ORDER BY qty_over_360 DESC, totalStockQty DESC
        """, Map.of());
  }

  private List<Map<String, Object>> outboundSnRows() {
    return repo.query("""
        SELECT
          s.sn_code AS snCode,
          p.product_code AS productCode,
          p.product_name AS productDescription,
          p.product_name_en AS productNameEn,
          COALESCE(s.owner_code, o.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(s.owner_name, o.owner_name, p.owner_name, '') AS ownerName,
          COALESCE(w.warehouse_code, '') AS warehouseCode,
          COALESCE(w.warehouse_name, '') AS warehouseName,
          COALESCE(l.location_code, ss.location_code, '') AS locationCode,
          COALESCE(s.pallet_code, ss.pallet_code, '') AS palletCode,
          COALESCE(s.box_code, ss.box_code, '') AS boxCode,
          COALESCE(o.order_no, s.outbound_order_no, '') AS outboundOrderNo,
          COALESCE(o.outbound_type, '') AS outboundType,
          COALESCE(d.line_no, '') AS lineNo,
          COALESCE(o.sales_order_no, o.source_order_no, '') AS salesOrderNo,
          COALESCE(o.related_order_no, o.source_order_no, '') AS relatedOrderNo,
          COALESCE(o.consignee_code, c.customer_code, '') AS consigneeCode,
          COALESCE(o.consignee_name, c.customer_name, '') AS consigneeName,
          COALESCE(sr.shipment_no, '') AS shipmentNo,
          COALESCE(sr.ship_time, o.ship_time, '') AS shipmentTime,
          COALESCE(sr.carrier, o.carrier_name, o.logistics_company, '') AS carrierName,
          COALESCE(sr.tracking_no, o.tracking_no, '') AS trackingNo,
          COALESCE(sr.sap_post_status, o.sap_post_status, 'NOT_POSTED') AS sapPostStatus,
          COALESCE(sr.sap_material_doc_no, o.sap_material_doc_no, '') AS sapMaterialDocNo,
          COALESCE(sr.sap_post_result, o.sap_post_result, '') AS sapPostResult,
          s.status AS snStatus,
          COALESCE(o.trace_post_status, 'NOT_POSTED') AS tracePostStatus,
          COALESCE(sr.ship_time, '') AS tracePostTime
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_outbound_order o ON o.order_no = s.outbound_order_no
        LEFT JOIN wms_outbound_order_detail d ON d.order_id = o.id AND d.product_id = s.product_id
        LEFT JOIN md_customer c ON c.id = o.customer_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        LEFT JOIN wms_shipment_record sr ON sr.outbound_order_id = o.id
        LEFT JOIN outbound_shipment_sn ss ON ss.sn_code = s.sn_code
        WHERE s.outbound_order_no IS NOT NULL OR s.status IN ('PICKED', 'SHIPPED', 'TRACED')
        ORDER BY COALESCE(sr.ship_time, s.updated_at) DESC, s.sn_code
        """, Map.of());
  }

  private List<Map<String, Object>> inboundSnRows() {
    return repo.query("""
        SELECT
          s.sn_code AS snCode,
          p.product_code AS productCode,
          p.product_name AS productName,
          p.product_name_en AS productNameEn,
          COALESCE(s.owner_code, o.owner_code, p.owner_code, '3060') AS ownerCode,
          COALESCE(s.owner_name, o.owner_name, p.owner_name, '') AS ownerName,
          COALESCE(w.warehouse_code, '') AS warehouseCode,
          COALESCE(w.warehouse_name, '') AS warehouseName,
          COALESCE(a.area_name, '') AS areaName,
          COALESCE(l.location_code, '') AS locationCode,
          COALESCE(s.pallet_code, rs.pallet_code, '') AS palletCode,
          COALESCE(s.box_code, rs.box_code, '') AS boxCode,
          COALESCE(o.order_no, s.inbound_order_no, '') AS inboundOrderNo,
          COALESCE(o.inbound_type, '') AS inboundType,
          COALESCE(o.source_system, '') AS sourceSystem,
          COALESCE(o.source_order_no, '') AS sourceDocNo,
          COALESCE(d.line_no, '') AS lineNo,
          COALESCE(s.mes_work_order_no, o.mes_work_order_no, '') AS mesWorkOrderNo,
          COALESCE(o.source_order_no, '') AS sapWorkOrderNo,
          s.created_at AS issuedTime,
          CASE WHEN s.pallet_code IS NOT NULL OR s.box_code IS NOT NULL THEN s.updated_at ELSE '' END AS collectedTime,
          COALESCE(r.receipt_no, '') AS receiptNo,
          COALESCE(r.receipt_time, '') AS receiptTime,
          CASE WHEN s.status IN ('ON_SHELF', 'ALLOCATED', 'PICKED', 'SHIPPED', 'TRACED') THEN s.updated_at ELSE '' END AS shelvedTime,
          COALESCE(r.sap_post_status, o.sap_post_status, 'NOT_POSTED') AS sapPostStatus,
          COALESCE(r.sap_material_doc_no, o.sap_material_doc_no, '') AS sapMaterialDocNo,
          COALESCE(r.sap_post_result, o.sap_post_result, '') AS sapPostResult,
          s.status AS snStatus,
          s.quality_status AS qualityStatus
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_inbound_order o ON o.order_no = s.inbound_order_no
        LEFT JOIN wms_inbound_order_detail d ON d.id = s.inbound_order_line_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        LEFT JOIN wms_area a ON a.id = l.area_id
        LEFT JOIN wms_inbound_receipt_sn rs ON rs.sn_code = s.sn_code
        LEFT JOIN wms_inbound_receipt r ON r.id = rs.receipt_id
        WHERE s.inbound_order_no IS NOT NULL OR s.status IN ('INBOUND', 'COLLECTED', 'RECEIVED', 'ON_SHELF')
        ORDER BY s.updated_at DESC, s.sn_code
        """, Map.of());
  }

  private boolean matchText(Map<String, Object> row, Map<String, ?> query) {
    for (Map.Entry<String, ?> entry : query.entrySet()) {
      String key = entry.getKey();
      Object expected = entry.getValue();
      if (expected == null || String.valueOf(expected).isBlank() || List.of("pageNum", "pageSize", "startDate", "endDate").contains(key)) {
        continue;
      }
      String actual = String.valueOf(value(row, key)).toLowerCase();
      if (!actual.contains(String.valueOf(expected).toLowerCase())) {
        return false;
      }
    }
    return true;
  }

  private boolean matchDate(Map<String, Object> row, Map<String, ?> query) {
    String startDate = text(query.get("startDate"));
    String endDate = text(query.get("endDate"));
    if (startDate.isBlank() && endDate.isBlank()) {
      return true;
    }
    String rowDate = firstNonBlank(
        value(row, "reportDate"),
        value(row, "receiptDate"),
        value(row, "shipmentDate"),
        value(row, "asOfDate"),
        value(row, "inboundDate"),
        value(row, "receiptTime"),
        value(row, "shipmentTime")
    );
    if (rowDate.isBlank()) {
      return true;
    }
    String date = rowDate.length() > 10 ? rowDate.substring(0, 10) : rowDate;
    return (startDate.isBlank() || date.compareTo(startDate) >= 0)
        && (endDate.isBlank() || date.compareTo(endDate) <= 0);
  }

  private Object value(Map<String, Object> row, String prop) {
    if (row.containsKey(prop)) {
      return row.get(prop);
    }
    return row.getOrDefault(toSnake(prop), "");
  }

  private String firstNonBlank(Object... values) {
    for (Object value : values) {
      String text = text(value);
      if (!text.isBlank()) {
        return text;
      }
    }
    return "";
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String toSnake(String value) {
    StringBuilder builder = new StringBuilder();
    for (char item : value.toCharArray()) {
      if (Character.isUpperCase(item)) {
        builder.append('_').append(Character.toLowerCase(item));
      } else {
        builder.append(item);
      }
    }
    return builder.toString();
  }

  private int intValue(Object value, int defaultValue) {
    try {
      return value == null || String.valueOf(value).isBlank() ? defaultValue : Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return defaultValue;
    }
  }

  private String reportName(String reportKey) {
    return Objects.requireNonNullElse(reportNames().get(reportKey), reportKey);
  }

  private Map<String, String> reportNames() {
    Map<String, String> names = new LinkedHashMap<>();
    names.put("inout-stock", "进出存报表");
    names.put("inbound-daily", "入库日报表");
    names.put("outbound-daily", "出库日报表");
    names.put("standard-aging", "标准库龄报表");
    names.put("segment-aging", "分段库龄报表");
    names.put("outbound-sn", "出库SN报表");
    names.put("inbound-sn", "入库SN报表");
    return names;
  }

  private List<Column> columns(String reportKey) {
    Map<String, List<Column>> map = new HashMap<>();
    map.put("inout-stock", columns(
        "统计日期:reportDate", "货主:ownerCode", "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName",
        "库区:areaName", "库位:locationCode", "SAP工厂:sapPlant", "SAP库存地点:sapStorageLocation", "产品编码:productCode",
        "产品名称:productName", "产品名称英文:productNameEn", "产品族:productFamily", "产品类:productClass", "产品类别:productCategory",
        "单位:unit", "期初库存:openingQty", "本期入库数量:inboundQty", "本期出库数量:outboundQty", "调整入库数量:adjustInQty",
        "调整出库数量:adjustOutQty", "冻结数量:frozenQty", "已分配数量:allocatedQty", "期末库存:closingQty", "可用库存:availableQty",
        "库存状态:stockStatus", "最后入库时间:lastInboundTime", "最后出库时间:lastOutboundTime"
    ));
    map.put("inbound-daily", columns(
        "入库日期:receiptDate", "收货批次号:receiptNo", "入库单号:inboundOrderNo", "入库类型:inboundType", "来源系统:sourceSystem",
        "来源单号:sourceDocNo", "货主:ownerCode", "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName",
        "SAP工厂:sapPlant", "SAP库存地点:sapStorageLocation", "行号:lineNo", "产品编码:productCode", "产品名称:productName",
        "产品描述:productDescription", "单位:unit", "计划数量:planQty", "本次收货数量:receiptQty", "累计收货数量:receivedQty",
        "已上架数量:shelvedQty", "SN管理:snRequired", "收货状态:receiptStatus", "SAP回传状态:sapPostStatus", "SAP凭证号:sapMaterialDocNo",
        "SAP回传说明:sapPostResult", "收货人:receiptUser", "收货时间:receiptTime", "创建时间:createdAt"
    ));
    map.put("outbound-daily", columns(
        "发货日期:shipmentDate", "发货批次号:shipmentNo", "发运订单号:outboundOrderNo", "订单类型:outboundType", "发运订单状态:orderStatus",
        "关联单号:relatedOrderNo", "销售单号:salesOrderNo", "返工单号:reworkOrderNo", "货主:ownerCode", "货主名称:ownerName",
        "仓库编码:warehouseCode", "仓库名称:warehouseName", "收货人编码:consigneeCode", "收货人名称:consigneeName", "目标仓库:targetWarehouseName",
        "目标货主:targetOwnerName", "SAP工厂:sapPlant", "行号:lineNo", "产品编码:productCode", "产品描述:productDescription",
        "单位:unit", "订单数量:orderQty", "分配数量:allocatedQty", "拣货数量:pickedQty", "本次发货数量:shipmentQty",
        "累计发货数量:shippedQty", "物流商:carrierName", "物流单号:trackingNo", "SAP回传状态:sapPostStatus", "SAP凭证号:sapMaterialDocNo",
        "SAP回传说明:sapPostResult", "发货人:shipmentUser", "发货时间:shipmentTime", "创建时间:createdAt"
    ));
    map.put("standard-aging", columns(
        "截止日期:asOfDate", "货主:ownerCode", "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName",
        "库区:areaName", "库位:locationCode", "产品编码:productCode", "产品名称:productName", "产品名称英文:productNameEn",
        "产品族:productFamily", "产品类:productClass", "产品类别:productCategory", "单位:unit", "批次号:batchNo",
        "SN:snCode", "托盘码:palletCode", "箱码:boxCode", "入库单号:inboundOrderNo", "入库日期:inboundDate",
        "最近收货日期:lastReceiptDate", "最近上架日期:lastShelvedDate", "库龄天数:agingDays", "标准库龄阈值:agingThresholdDays",
        "是否超期:overdueFlag", "是否电池类:batteryFlag", "库存数量:stockQty", "可用数量:availableQty", "冻结数量:frozenQty",
        "库存状态:stockStatus", "处理建议:handlingSuggestion"
    ));
    map.put("segment-aging", columns(
        "货主:ownerCode", "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName", "产品编码:productCode",
        "产品名称:productName", "产品族:productFamily", "产品类:productClass", "单位:unit", "总库存数量:totalStockQty",
        "0-30天数量:qty_0_30", "31-60天数量:qty_31_60", "61-90天数量:qty_61_90", "91-180天数量:qty_91_180",
        "181-270天数量:qty_181_270", "271-360天数量:qty_271_360", "360天以上数量:qty_over_360", "360天以上占比:ratioOver360",
        "是否电池类:batteryFlag", "处理建议:handlingSuggestion"
    ));
    map.put("outbound-sn", columns(
        "SN:snCode", "产品编码:productCode", "产品描述:productDescription", "产品名称英文:productNameEn", "货主:ownerCode",
        "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName", "库位:locationCode", "托盘码:palletCode",
        "箱码:boxCode", "发运订单号:outboundOrderNo", "订单类型:outboundType", "行号:lineNo", "销售单号:salesOrderNo",
        "关联单号:relatedOrderNo", "收货人编码:consigneeCode", "收货人名称:consigneeName", "发货批次号:shipmentNo", "发货时间:shipmentTime",
        "物流商:carrierName", "物流单号:trackingNo", "SAP回传状态:sapPostStatus", "SAP凭证号:sapMaterialDocNo", "SAP回传说明:sapPostResult",
        "SN状态:snStatus", "追溯回传状态:tracePostStatus", "追溯回传时间:tracePostTime"
    ));
    map.put("inbound-sn", columns(
        "SN:snCode", "产品编码:productCode", "产品名称:productName", "产品名称英文:productNameEn", "货主:ownerCode",
        "货主名称:ownerName", "仓库编码:warehouseCode", "仓库名称:warehouseName", "库区:areaName", "库位:locationCode",
        "托盘码:palletCode", "箱码:boxCode", "入库单号:inboundOrderNo", "入库类型:inboundType", "来源系统:sourceSystem",
        "来源单号:sourceDocNo", "行号:lineNo", "MES工单号:mesWorkOrderNo", "SAP工单号:sapWorkOrderNo", "SN下发时间:issuedTime",
        "SN采集时间:collectedTime", "收货批次号:receiptNo", "收货时间:receiptTime", "上架时间:shelvedTime", "SAP回传状态:sapPostStatus",
        "SAP凭证号:sapMaterialDocNo", "SAP回传说明:sapPostResult", "SN状态:snStatus", "质量状态:qualityStatus"
    ));
    return map.getOrDefault(reportKey, new ArrayList<>());
  }

  private List<Column> columns(String... items) {
    List<Column> result = new ArrayList<>();
    for (String item : items) {
      String[] parts = item.split(":", 2);
      result.add(new Column(parts[0], parts[1]));
    }
    return result;
  }

  private record Column(String label, String prop) {
  }
}
