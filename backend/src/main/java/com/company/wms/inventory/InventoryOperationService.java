package com.company.wms.inventory;

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
public class InventoryOperationService {
  private static final DateTimeFormatter NO_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  public InventoryOperationService(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
  }

  public PageResult<Map<String, Object>> countOrders(Map<String, Object> query) {
    Map<String, Object> params = new HashMap<>();
    params.put("countOrderNo", repo.like(text(query, "countOrderNo")));
    params.put("countType", repo.like(text(query, "countType")));
    params.put("countScope", repo.like(text(query, "countScope")));
    params.put("status", repo.like(text(query, "status")));
    params.put("warehouseCode", repo.like(text(query, "warehouseCode")));
    params.put("owner", repo.like(text(query, "ownerCode", "owner")));
    params.put("productCode", repo.like(text(query, "productCode")));
    params.put("createdStart", text(query, "createdStart"));
    params.put("createdEnd", text(query, "createdEnd"));
    String from = """
        FROM wms_inventory_count_order o
        LEFT JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN (
          SELECT count_order_id,
                 COUNT(*) AS line_count,
                 SUM(CASE WHEN COALESCE(diff_type, 'NONE') <> 'NONE' THEN 1 ELSE 0 END) AS diff_count
          FROM wms_inventory_count_line
          GROUP BY count_order_id
        ) agg ON agg.count_order_id = o.id
        WHERE (:countOrderNo IS NULL OR o.count_order_no LIKE :countOrderNo)
          AND (:countType IS NULL OR o.count_type LIKE :countType)
          AND (:countScope IS NULL OR o.count_scope LIKE :countScope)
          AND (:status IS NULL OR o.status LIKE :status)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR o.owner_code LIKE :owner OR o.owner_name LIKE :owner)
          AND (:productCode IS NULL OR o.product_code LIKE :productCode)
          AND (:createdStart IS NULL OR o.created_at >= :createdStart)
          AND (:createdEnd IS NULL OR o.created_at < DATE_ADD(:createdEnd, INTERVAL 1 DAY))
        """;
    return repo.page(
        """
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.diff_count, 0) AS diff_count
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        intValue(query.get("pageNum"), 1),
        intValue(query.get("pageSize"), 10)
    );
  }

  public Map<String, Object> countDetail(long id) {
    Map<String, Object> order = requireCountOrder(id);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("order", order);
    data.put("lines", countLines(id));
    data.put("differences", repo.query("""
        SELECT l.*, w.warehouse_code, w.warehouse_name, a.area_code, loc.location_code,
               p.product_code, p.product_name
        FROM wms_inventory_count_line l
        JOIN wms_warehouse w ON w.id = l.warehouse_id
        LEFT JOIN wms_area a ON a.id = l.area_id
        LEFT JOIN wms_location loc ON loc.id = l.location_id
        JOIN md_product p ON p.id = l.product_id
        WHERE l.count_order_id = :id AND COALESCE(l.diff_type, 'NONE') <> 'NONE'
        ORDER BY l.line_no
        """, params("id", id)));
    data.put("adjustments", repo.query("""
        SELECT a.*, l.line_no, l.sn_code, l.diff_type
        FROM wms_inventory_count_adjustment a
        JOIN wms_inventory_count_line l ON l.id = a.count_line_id
        WHERE a.count_order_id = :id
        ORDER BY a.id DESC
        """, params("id", id)));
    data.put("transactions", repo.query("""
        SELECT t.*, w.warehouse_code, l.location_code, p.product_code, p.product_name
        FROM wms_inventory_transaction t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        LEFT JOIN wms_location l ON l.id = t.location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE t.business_doc_no = :businessNo
        ORDER BY t.id DESC
        """, params("businessNo", order.get("count_order_no"))));
    data.put("operationLogs", operationLogs(text(order, "count_order_no")));
    return data;
  }

  @Transactional
  public Map<String, Object> createCountOrder(Map<String, Object> body) {
    Map<String, Object> warehouse = optionalWarehouse(text(body, "warehouseCode"));
    Map<String, Object> product = optionalProduct(text(body, "productCode"), text(body, "ownerCode"));
    String countOrderNo = firstText(text(body, "countOrderNo"), nextNo("CNT"));
    String countType = firstText(text(body, "countType"), "RANGE");
    String countScope = firstText(text(body, "countScope"), warehouse == null ? "WAREHOUSE" : "LOCATION");
    String ownerCode = firstText(text(body, "ownerCode"), product == null ? "" : text(product, "owner_code"));
    String ownerName = firstText(text(body, "ownerName"), product == null ? "" : text(product, "owner_name"));
    jdbc.update("""
        INSERT INTO wms_inventory_count_order (
          count_order_no, count_type, count_scope, status, warehouse_id,
          owner_code, owner_name, area_code, location_code, product_id, product_code, product_name,
          batch_no, pallet_code, box_code, sn_code, freeze_flag, start_time, created_by, remark
        ) VALUES (
          :countOrderNo, :countType, :countScope, 'CREATED', :warehouseId,
          :ownerCode, :ownerName, :areaCode, :locationCode, :productId, :productCode, :productName,
          :batchNo, :palletCode, :boxCode, :snCode, :freezeFlag, NOW(), :createdBy, :remark
        )
        """, params(
        "countOrderNo", countOrderNo,
        "countType", countType,
        "countScope", countScope,
        "warehouseId", warehouse == null ? null : warehouse.get("id"),
        "ownerCode", ownerCode,
        "ownerName", ownerName,
        "areaCode", text(body, "areaCode"),
        "locationCode", text(body, "locationCode"),
        "productId", product == null ? null : product.get("id"),
        "productCode", product == null ? text(body, "productCode") : product.get("product_code"),
        "productName", product == null ? text(body, "productName") : product.get("product_name"),
        "batchNo", text(body, "batchNo"),
        "palletCode", text(body, "palletCode"),
        "boxCode", text(body, "boxCode"),
        "snCode", text(body, "snCode"),
        "freezeFlag", bool(body.get("freezeFlag")) ? 1 : 0,
        "createdBy", firstText(text(body, "createdBy", "operator"), "admin"),
        "remark", text(body, "remark")
    ));
    long id = repo.number("SELECT id FROM wms_inventory_count_order WHERE count_order_no = :no", params("no", countOrderNo)).longValue();
    if (!body.containsKey("autoGenerate") || bool(body.get("autoGenerate"))) {
      return generateCountLines(id, body);
    }
    repo.operationLog("INVENTORY_COUNT", countOrderNo, "COUNT_CREATE", text(body, "createdBy", "operator"), "SUCCESS", "创建库存盘点单");
    return countDetail(id);
  }

  @Transactional
  public Map<String, Object> generateCountLines(long id, Map<String, Object> body) {
    Map<String, Object> order = requireCountOrder(id);
    String status = text(order, "status");
    if (!List.of("CREATED", "COUNTING").contains(status)) {
      throw new IllegalArgumentException("只有创建或盘点中状态允许重新生成盘点明细");
    }
    jdbc.update("DELETE FROM wms_inventory_count_line WHERE count_order_id = :id", params("id", id));
    List<Map<String, Object>> rows = snapshotRows(order);
    int lineNo = 10;
    for (Map<String, Object> row : rows) {
      jdbc.update("""
          INSERT INTO wms_inventory_count_line (
            count_order_id, line_no, owner_code, owner_name, warehouse_id, area_id, location_id, product_id,
            sn_required, pallet_code, box_code, sn_code, batch_no, unit, book_qty, line_status
          ) VALUES (
            :orderId, :lineNo, :ownerCode, :ownerName, :warehouseId, :areaId, :locationId, :productId,
            :snRequired, :palletCode, :boxCode, :snCode, :batchNo, :unit, :bookQty, 'NOT_COUNTED'
          )
          """, params(
          "orderId", id,
          "lineNo", lineNo,
          "ownerCode", firstText(text(row, "owner_code"), text(order, "owner_code")),
          "ownerName", firstText(text(row, "owner_name"), text(order, "owner_name")),
          "warehouseId", row.get("warehouse_id"),
          "areaId", row.get("area_id"),
          "locationId", row.get("location_id"),
          "productId", row.get("product_id"),
          "snRequired", bool(row.get("sn_required")) ? 1 : 0,
          "palletCode", text(row, "pallet_code"),
          "boxCode", text(row, "box_code"),
          "snCode", text(row, "sn_code"),
          "batchNo", text(row, "batch_no"),
          "unit", firstText(text(row, "unit"), "PCS"),
          "bookQty", intValue(row.get("book_qty"), 0)
      ));
      lineNo += 10;
    }
    if (bool(order.get("freeze_flag"))) {
      freezeCountScope(order);
    }
    jdbc.update("UPDATE wms_inventory_count_order SET status = 'COUNTING', updated_by = :operator WHERE id = :id",
        params("id", id, "operator", firstText(text(body, "operator"), "admin")));
    repo.operationLog("INVENTORY_COUNT", text(order, "count_order_no"), "COUNT_SNAPSHOT", text(body, "operator"), "SUCCESS",
        "生成盘点快照 " + rows.size() + " 行");
    return countDetail(id);
  }

  @Transactional
  public Map<String, Object> recordCount(long id, Map<String, Object> body) {
    Map<String, Object> order = requireCountOrder(id);
    if (!List.of("COUNTING", "RECORDED", "CREATED").contains(text(order, "status"))) {
      throw new IllegalArgumentException("当前状态不允许录入盘点结果");
    }
    Object scanned = body.get("scannedSns");
    if (scanned instanceof List<?> list) {
      for (Object sn : list) {
        recordScannedSn(id, String.valueOf(sn), text(body, "operator"));
      }
    }
    Object lines = body.get("lines");
    if (lines instanceof List<?> list) {
      for (Object item : list) {
        if (item instanceof Map<?, ?> line) {
          updateCountLine(id, line);
        }
      }
    }
    jdbc.update("UPDATE wms_inventory_count_order SET status = 'RECORDED', updated_by = :operator WHERE id = :id",
        params("id", id, "operator", firstText(text(body, "operator"), "admin")));
    repo.operationLog("INVENTORY_COUNT", text(order, "count_order_no"), "COUNT_RECORD", text(body, "operator"), "SUCCESS", "录入盘点结果并计算差异");
    return countDetail(id);
  }

  @Transactional
  public Map<String, Object> confirmCountDifference(long id, Map<String, Object> body) {
    Map<String, Object> order = requireCountOrder(id);
    if (!List.of("RECORDED", "COUNTING").contains(text(order, "status"))) {
      throw new IllegalArgumentException("只有已录入或盘点中状态允许差异确认");
    }
    Object lines = body.get("lines");
    if (lines instanceof List<?> list) {
      for (Object item : list) {
        if (item instanceof Map<?, ?> row) {
          long lineId = longValue(row.get("id"), longValue(row.get("lineId"), 0));
          if (lineId > 0) {
            jdbc.update("""
                UPDATE wms_inventory_count_line
                SET diff_reason = COALESCE(:diffReason, diff_reason),
                    handling_method = COALESCE(:handlingMethod, handling_method),
                    line_status = 'CONFIRMED'
                WHERE id = :id AND count_order_id = :orderId
                """, params(
                "id", lineId,
                "orderId", id,
                "diffReason", nullableText(row.get("diffReason")),
                "handlingMethod", nullableText(row.get("handlingMethod"))
            ));
          }
        }
      }
    }
    jdbc.update("""
        UPDATE wms_inventory_count_line
        SET line_status = 'CONFIRMED',
            handling_method = CASE
              WHEN diff_type = 'OVERAGE' THEN COALESCE(handling_method, 'INCREASE_STOCK')
              WHEN diff_type = 'SHORTAGE' THEN COALESCE(handling_method, 'DECREASE_STOCK')
              WHEN diff_type IN ('LOCATION_DIFF', 'SN_DIFF') THEN COALESCE(handling_method, 'CORRECT_LOCATION')
              ELSE COALESCE(handling_method, 'NO_ACTION')
            END
        WHERE count_order_id = :id AND line_status IN ('COUNTED', 'DIFFERENCE')
        """, params("id", id));
    jdbc.update("UPDATE wms_inventory_count_order SET status = 'DIFF_CONFIRMED', updated_by = :operator WHERE id = :id",
        params("id", id, "operator", firstText(text(body, "operator"), "admin")));
    repo.operationLog("INVENTORY_COUNT", text(order, "count_order_no"), "DIFF_CONFIRM", text(body, "operator"), "SUCCESS", "确认盘点差异");
    return countDetail(id);
  }

  @Transactional
  public Map<String, Object> adjustCount(long id, Map<String, Object> body) {
    Map<String, Object> order = requireCountOrder(id);
    if (!List.of("DIFF_CONFIRMED", "RECORDED").contains(text(order, "status"))) {
      throw new IllegalArgumentException("只有差异已确认或已录入状态允许调整生效");
    }
    String operator = firstText(text(body, "operator"), "admin");
    List<Map<String, Object>> lines = repo.query("""
        SELECT *
        FROM wms_inventory_count_line
        WHERE count_order_id = :id
          AND line_status IN ('CONFIRMED', 'DIFFERENCE', 'COUNTED')
        ORDER BY line_no
        """, params("id", id));
    for (Map<String, Object> line : lines) {
      applyCountAdjustment(order, line, operator);
    }
    jdbc.update("""
        UPDATE wms_inventory_count_order
        SET status = 'ADJUSTED', end_time = NOW(), updated_by = :operator
        WHERE id = :id
        """, params("id", id, "operator", operator));
    repo.operationLog("INVENTORY_COUNT", text(order, "count_order_no"), "COUNT_ADJUST", operator, "SUCCESS", "盘点差异调整生效");
    return countDetail(id);
  }

  @Transactional
  public Map<String, Object> cancelCount(long id, Map<String, Object> body) {
    Map<String, Object> order = requireCountOrder(id);
    if (!List.of("CREATED", "COUNTING").contains(text(order, "status"))) {
      throw new IllegalArgumentException("只有创建或盘点中状态允许取消");
    }
    if (bool(order.get("freeze_flag"))) {
      releaseCountFreeze(order);
    }
    jdbc.update("UPDATE wms_inventory_count_order SET status = 'CANCELED', updated_by = :operator WHERE id = :id",
        params("id", id, "operator", firstText(text(body, "operator"), "admin")));
    repo.operationLog("INVENTORY_COUNT", text(order, "count_order_no"), "COUNT_CANCEL", text(body, "operator"), "SUCCESS", "取消盘点单");
    return countDetail(id);
  }

  public PageResult<Map<String, Object>> moveOrders(Map<String, Object> query) {
    Map<String, Object> params = new HashMap<>();
    params.put("moveOrderNo", repo.like(text(query, "moveOrderNo")));
    params.put("moveType", repo.like(text(query, "moveType")));
    params.put("status", repo.like(text(query, "status")));
    params.put("warehouseCode", repo.like(text(query, "warehouseCode")));
    params.put("owner", repo.like(text(query, "ownerCode", "owner")));
    params.put("fromLocationCode", repo.like(text(query, "fromLocationCode")));
    params.put("toLocationCode", repo.like(text(query, "toLocationCode")));
    String from = """
        FROM wms_inventory_move_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_location fl ON fl.id = o.from_location_id
        LEFT JOIN wms_location tl ON tl.id = o.to_location_id
        LEFT JOIN (
          SELECT move_order_id, COUNT(*) AS line_count, COALESCE(SUM(move_qty), 0) AS total_move_qty
          FROM wms_inventory_move_line
          GROUP BY move_order_id
        ) agg ON agg.move_order_id = o.id
        WHERE (:moveOrderNo IS NULL OR o.move_order_no LIKE :moveOrderNo)
          AND (:moveType IS NULL OR o.move_type LIKE :moveType)
          AND (:status IS NULL OR o.status LIKE :status)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR o.owner_code LIKE :owner OR o.owner_name LIKE :owner)
          AND (:fromLocationCode IS NULL OR fl.location_code LIKE :fromLocationCode)
          AND (:toLocationCode IS NULL OR tl.location_code LIKE :toLocationCode)
        """;
    return repo.page(
        """
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               fl.location_code AS from_location_code,
               tl.location_code AS to_location_code,
               COALESCE(agg.line_count, 0) AS line_count,
               COALESCE(agg.total_move_qty, 0) AS total_move_qty
        """ + from + " ORDER BY o.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        intValue(query.get("pageNum"), 1),
        intValue(query.get("pageSize"), 10)
    );
  }

  public Map<String, Object> moveDetail(long id) {
    Map<String, Object> order = requireMoveOrder(id);
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("order", order);
    data.put("lines", moveLines(id));
    data.put("transactions", repo.query("""
        SELECT t.*, w.warehouse_code, l.location_code, p.product_code, p.product_name,
               fl.location_code AS from_location_code, tl.location_code AS to_location_code
        FROM wms_inventory_transaction t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        LEFT JOIN wms_location l ON l.id = t.location_id
        LEFT JOIN wms_location fl ON fl.id = t.from_location_id
        LEFT JOIN wms_location tl ON tl.id = t.to_location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE t.business_doc_no = :businessNo
        ORDER BY t.id DESC
        """, params("businessNo", order.get("move_order_no"))));
    data.put("operationLogs", operationLogs(text(order, "move_order_no")));
    return data;
  }

  @Transactional
  public Map<String, Object> createMoveOrder(Map<String, Object> body) {
    Map<String, Object> warehouse = requireWarehouse(firstText(text(body, "warehouseCode"), "WH-HZ-CENTRAL"));
    Map<String, Object> fromLocation = optionalLocation(text(body, "fromLocationCode"), longValue(warehouse.get("id"), 0));
    Map<String, Object> toLocation = optionalLocation(text(body, "toLocationCode"), longValue(warehouse.get("id"), 0));
    String ownerCode = firstText(text(body, "ownerCode"), "3060");
    String ownerName = firstText(text(body, "ownerName"), ownerName(ownerCode));
    String moveOrderNo = firstText(text(body, "moveOrderNo"), nextNo("MOVE"));
    jdbc.update("""
        INSERT INTO wms_inventory_move_order (
          move_order_no, move_type, status, owner_code, owner_name, warehouse_id,
          from_area_code, from_location_id, to_area_code, to_location_id,
          from_pallet_code, to_pallet_code, from_box_code, to_box_code, created_by, remark
        ) VALUES (
          :moveOrderNo, :moveType, 'CREATED', :ownerCode, :ownerName, :warehouseId,
          :fromAreaCode, :fromLocationId, :toAreaCode, :toLocationId,
          :fromPalletCode, :toPalletCode, :fromBoxCode, :toBoxCode, :createdBy, :remark
        )
        """, params(
        "moveOrderNo", moveOrderNo,
        "moveType", firstText(text(body, "moveType"), "LOCATION_MOVE"),
        "ownerCode", ownerCode,
        "ownerName", ownerName,
        "warehouseId", warehouse.get("id"),
        "fromAreaCode", fromLocation == null ? text(body, "fromAreaCode") : fromLocation.get("area_code"),
        "fromLocationId", fromLocation == null ? null : fromLocation.get("id"),
        "toAreaCode", toLocation == null ? text(body, "toAreaCode") : toLocation.get("area_code"),
        "toLocationId", toLocation == null ? null : toLocation.get("id"),
        "fromPalletCode", text(body, "fromPalletCode"),
        "toPalletCode", text(body, "toPalletCode"),
        "fromBoxCode", text(body, "fromBoxCode"),
        "toBoxCode", text(body, "toBoxCode"),
        "createdBy", firstText(text(body, "createdBy", "operator"), "admin"),
        "remark", text(body, "remark")
    ));
    long id = repo.number("SELECT id FROM wms_inventory_move_order WHERE move_order_no = :no", params("no", moveOrderNo)).longValue();
    List<Map<String, Object>> rows = bodyLines(body);
    if (rows.isEmpty()) {
      rows.add(body);
    }
    int lineNo = 10;
    for (Map<String, Object> row : rows) {
      addMoveLine(id, warehouse, fromLocation, toLocation, ownerCode, row, lineNo);
      lineNo += 10;
    }
    repo.operationLog("INVENTORY_MOVE", moveOrderNo, "MOVE_CREATE", text(body, "createdBy", "operator"), "SUCCESS", "创建库存移动单");
    return moveDetail(id);
  }

  @Transactional
  public Map<String, Object> confirmMove(long id, Map<String, Object> body) {
    Map<String, Object> order = requireMoveOrder(id);
    if (!"CREATED".equals(text(order, "status"))) {
      throw new IllegalArgumentException("只有创建状态允许确认移动");
    }
    String operator = firstText(text(body, "operator"), "admin");
    for (Map<String, Object> line : moveLines(id)) {
      if (bool(line.get("sn_required"))) {
        confirmSnMove(order, line, operator);
      } else {
        confirmQtyMove(order, line, operator);
      }
      jdbc.update("UPDATE wms_inventory_move_line SET line_status = 'CONFIRMED' WHERE id = :id", params("id", line.get("id")));
    }
    jdbc.update("""
        UPDATE wms_inventory_move_order
        SET status = 'CONFIRMED', confirmed_by = :operator, confirmed_at = NOW()
        WHERE id = :id
        """, params("id", id, "operator", operator));
    repo.operationLog("INVENTORY_MOVE", text(order, "move_order_no"), "MOVE_CONFIRM", operator, "SUCCESS", "确认库存移动并更新库存/SN");
    return moveDetail(id);
  }

  @Transactional
  public Map<String, Object> cancelMove(long id, Map<String, Object> body) {
    Map<String, Object> order = requireMoveOrder(id);
    if (!"CREATED".equals(text(order, "status"))) {
      throw new IllegalArgumentException("已确认的移动单不允许取消，如需回退请新建反向移动单");
    }
    jdbc.update("UPDATE wms_inventory_move_order SET status = 'CANCELED' WHERE id = :id", params("id", id));
    jdbc.update("UPDATE wms_inventory_move_line SET line_status = 'CANCELED' WHERE move_order_id = :id", params("id", id));
    repo.operationLog("INVENTORY_MOVE", text(order, "move_order_no"), "MOVE_CANCEL", text(body, "operator"), "SUCCESS", "取消库存移动单");
    return moveDetail(id);
  }

  public Map<String, Object> stockCandidates(Map<String, Object> query) {
    Map<String, Object> params = new HashMap<>();
    params.put("warehouseCode", repo.like(text(query, "warehouseCode")));
    params.put("owner", repo.like(text(query, "ownerCode", "owner")));
    params.put("locationCode", repo.like(text(query, "locationCode", "fromLocationCode")));
    params.put("productCode", repo.like(text(query, "productCode")));
    params.put("snCode", repo.like(text(query, "snCode")));
    params.put("palletCode", repo.like(text(query, "palletCode")));
    params.put("boxCode", repo.like(text(query, "boxCode")));
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("inventory", repo.query("""
        SELECT i.*, w.warehouse_code, w.warehouse_name, a.area_code, l.location_code,
               p.product_code, p.product_name, p.sn_managed,
               COALESCE(i.owner_code, p.owner_code) AS owner_code,
               COALESCE(i.owner_name, p.owner_name) AS owner_name
        FROM wms_inventory i
        JOIN wms_warehouse w ON w.id = i.warehouse_id
        JOIN wms_area a ON a.id = i.area_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN md_product p ON p.id = i.product_id
        WHERE (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR COALESCE(i.owner_code, p.owner_code) LIKE :owner OR COALESCE(i.owner_name, p.owner_name) LIKE :owner)
          AND (:locationCode IS NULL OR l.location_code LIKE :locationCode)
          AND (:productCode IS NULL OR p.product_code LIKE :productCode)
          AND (:palletCode IS NULL OR i.pallet_code LIKE :palletCode)
          AND (:boxCode IS NULL OR i.box_code LIKE :boxCode)
        ORDER BY i.available_qty DESC
        LIMIT 50
        """, params));
    data.put("sns", repo.query("""
        SELECT s.*, w.warehouse_code, w.warehouse_name, l.location_code, p.product_code, p.product_name,
               COALESCE(s.owner_code, p.owner_code) AS owner_code,
               COALESCE(s.owner_name, p.owner_name) AS owner_name
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_warehouse w ON w.id = s.warehouse_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR COALESCE(s.owner_code, p.owner_code) LIKE :owner OR COALESCE(s.owner_name, p.owner_name) LIKE :owner)
          AND (:locationCode IS NULL OR l.location_code LIKE :locationCode)
          AND (:productCode IS NULL OR p.product_code LIKE :productCode)
          AND (:snCode IS NULL OR s.sn_code LIKE :snCode)
          AND (:palletCode IS NULL OR s.pallet_code LIKE :palletCode)
          AND (:boxCode IS NULL OR s.box_code LIKE :boxCode)
        ORDER BY s.id DESC
        LIMIT 50
        """, params));
    data.put("locations", repo.query("""
        SELECT l.*, w.warehouse_code, a.area_code
        FROM wms_location l
        JOIN wms_warehouse w ON w.id = l.warehouse_id
        JOIN wms_area a ON a.id = l.area_id
        WHERE l.status = 'ACTIVE'
        ORDER BY w.warehouse_code, l.location_code
        LIMIT 100
        """, Map.of()));
    return data;
  }

  public PageResult<Map<String, Object>> transactions(Map<String, Object> query) {
    Map<String, Object> params = new HashMap<>();
    params.put("businessNo", repo.like(text(query, "businessNo", "businessDocNo")));
    params.put("transactionType", repo.like(text(query, "transactionType")));
    params.put("warehouseCode", repo.like(text(query, "warehouseCode")));
    params.put("owner", repo.like(text(query, "ownerCode", "owner")));
    params.put("productCode", repo.like(text(query, "productCode")));
    String from = """
        FROM wms_inventory_transaction t
        JOIN wms_warehouse w ON w.id = t.warehouse_id
        LEFT JOIN wms_location l ON l.id = t.location_id
        LEFT JOIN wms_location fl ON fl.id = t.from_location_id
        LEFT JOIN wms_location tl ON tl.id = t.to_location_id
        JOIN md_product p ON p.id = t.product_id
        WHERE (:businessNo IS NULL OR t.business_doc_no LIKE :businessNo)
          AND (:transactionType IS NULL OR t.transaction_type LIKE :transactionType)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:owner IS NULL OR t.owner_code LIKE :owner OR t.owner_name LIKE :owner)
          AND (:productCode IS NULL OR p.product_code LIKE :productCode)
        """;
    return repo.page(
        """
        SELECT t.*, w.warehouse_code, w.warehouse_name, l.location_code,
               fl.location_code AS from_location_code, tl.location_code AS to_location_code,
               p.product_code, p.product_name
        """ + from + " ORDER BY t.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        intValue(query.get("pageNum"), 1),
        intValue(query.get("pageSize"), 10)
    );
  }

  private List<Map<String, Object>> snapshotRows(Map<String, Object> order) {
    Map<String, Object> p = scopeParams(order);
    List<Map<String, Object>> rows = new ArrayList<>();
    rows.addAll(repo.query("""
        SELECT s.warehouse_id, a.id AS area_id, s.location_id, s.product_id,
               1 AS sn_required, s.pallet_code, s.box_code, s.sn_code, NULL AS batch_no,
               p.unit, 1 AS book_qty,
               COALESCE(s.owner_code, p.owner_code) AS owner_code,
               COALESCE(s.owner_name, p.owner_name) AS owner_name
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        JOIN wms_location l ON l.id = s.location_id
        JOIN wms_area a ON a.id = l.area_id
        WHERE COALESCE(p.sn_managed, 0) = 1
          AND s.status IN ('ON_SHELF', 'ALLOCATED', 'PICKED', 'REVIEWED')
          AND s.quality_status = 'QUALIFIED'
          AND (:warehouseId IS NULL OR s.warehouse_id = :warehouseId)
          AND (:ownerCode = '' OR COALESCE(s.owner_code, p.owner_code) = :ownerCode)
          AND (:areaCode = '' OR a.area_code = :areaCode)
          AND (:locationCode = '' OR l.location_code = :locationCode)
          AND (:productCode = '' OR p.product_code = :productCode)
          AND (:palletCode = '' OR s.pallet_code = :palletCode)
          AND (:boxCode = '' OR s.box_code = :boxCode)
          AND (:snCode = '' OR s.sn_code = :snCode)
        ORDER BY s.id
        """, p));
    rows.addAll(repo.query("""
        SELECT i.warehouse_id, i.area_id, i.location_id, i.product_id,
               0 AS sn_required, i.pallet_code, i.box_code, NULL AS sn_code, i.batch_no,
               p.unit, i.total_qty AS book_qty,
               COALESCE(i.owner_code, p.owner_code) AS owner_code,
               COALESCE(i.owner_name, p.owner_name) AS owner_name
        FROM wms_inventory i
        JOIN md_product p ON p.id = i.product_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN wms_area a ON a.id = i.area_id
        WHERE COALESCE(p.sn_managed, 0) = 0
          AND i.total_qty > 0
          AND (:warehouseId IS NULL OR i.warehouse_id = :warehouseId)
          AND (:ownerCode = '' OR COALESCE(i.owner_code, p.owner_code) = :ownerCode)
          AND (:areaCode = '' OR a.area_code = :areaCode)
          AND (:locationCode = '' OR l.location_code = :locationCode)
          AND (:productCode = '' OR p.product_code = :productCode)
          AND (:batchNo = '' OR i.batch_no = :batchNo)
          AND (:palletCode = '' OR i.pallet_code = :palletCode)
          AND (:boxCode = '' OR i.box_code = :boxCode)
        ORDER BY i.id
        """, p));
    return rows;
  }

  private void updateCountLine(long orderId, Map<?, ?> row) {
    long lineId = longValue(row.get("id"), longValue(row.get("lineId"), 0));
    if (lineId <= 0) return;
    Map<String, Object> line = repo.one("""
        SELECT l.*, loc.location_code
        FROM wms_inventory_count_line l
        LEFT JOIN wms_location loc ON loc.id = l.location_id
        WHERE l.id = :id AND l.count_order_id = :orderId
        """, params("id", lineId, "orderId", orderId));
    if (line == null) return;
    int actualQty = intValue(row.get("actualQty"), intValue(row.get("actual_qty"), intValue(line.get("actual_qty"), 0)));
    int bookQty = intValue(line.get("book_qty"), 0);
    String actualLocationCode = nullableText(row.get("actualLocationCode"));
    int diffQty = actualQty - bookQty;
    String diffType = diffType(line, actualQty, actualLocationCode);
    jdbc.update("""
        UPDATE wms_inventory_count_line
        SET actual_qty = :actualQty,
            diff_qty = :diffQty,
            diff_type = :diffType,
            diff_reason = COALESCE(:diffReason, diff_reason),
            handling_method = COALESCE(:handlingMethod, handling_method),
            actual_location_code = COALESCE(:actualLocationCode, actual_location_code),
            line_status = :lineStatus
        WHERE id = :id
        """, params(
        "id", lineId,
        "actualQty", actualQty,
        "diffQty", diffQty,
        "diffType", diffType,
        "diffReason", nullableText(row.get("diffReason")),
        "handlingMethod", nullableText(row.get("handlingMethod")),
        "actualLocationCode", actualLocationCode,
        "lineStatus", "NONE".equals(diffType) ? "COUNTED" : "DIFFERENCE"
    ));
  }

  private void recordScannedSn(long orderId, String snCode, String operator) {
    if (!StringUtils.hasText(snCode)) return;
    Map<String, Object> line = repo.one("""
        SELECT *
        FROM wms_inventory_count_line
        WHERE count_order_id = :orderId AND sn_code = :sn
        """, params("orderId", orderId, "sn", snCode));
    if (line != null) {
      updateCountLine(orderId, Map.of("id", line.get("id"), "actualQty", 1));
      return;
    }
    Map<String, Object> sn = repo.one("""
        SELECT s.*, p.owner_code, p.owner_name, p.product_code, p.product_name, p.unit,
               l.area_id, l.location_code
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        LEFT JOIN wms_location l ON l.id = s.location_id
        WHERE s.sn_code = :sn
        """, params("sn", snCode));
    if (sn == null) {
      throw new IllegalArgumentException("扫描 SN 不存在：" + snCode);
    }
    int lineNo = repo.number("SELECT COALESCE(MAX(line_no), 0) + 10 FROM wms_inventory_count_line WHERE count_order_id = :id", params("id", orderId)).intValue();
    jdbc.update("""
        INSERT INTO wms_inventory_count_line (
          count_order_id, line_no, owner_code, owner_name, warehouse_id, area_id, location_id, product_id,
          sn_required, pallet_code, box_code, sn_code, unit, book_qty, actual_qty, diff_qty,
          diff_type, diff_reason, handling_method, line_status
        ) VALUES (
          :orderId, :lineNo, :ownerCode, :ownerName, :warehouseId, :areaId, :locationId, :productId,
          1, :palletCode, :boxCode, :snCode, :unit, 0, 1, 1,
          'OVERAGE', '扫描到盘点快照外 SN', 'INCREASE_STOCK', 'DIFFERENCE'
        )
        """, params(
        "orderId", orderId,
        "lineNo", lineNo,
        "ownerCode", firstText(text(sn, "owner_code"), ""),
        "ownerName", firstText(text(sn, "owner_name"), ""),
        "warehouseId", sn.get("warehouse_id"),
        "areaId", sn.get("area_id"),
        "locationId", sn.get("location_id"),
        "productId", sn.get("product_id"),
        "palletCode", sn.get("pallet_code"),
        "boxCode", sn.get("box_code"),
        "snCode", snCode,
        "unit", firstText(text(sn, "unit"), "PCS")
    ));
  }

  private void applyCountAdjustment(Map<String, Object> order, Map<String, Object> line, String operator) {
    String diffType = firstText(text(line, "diff_type"), "NONE");
    int diffQty = intValue(line.get("diff_qty"), 0);
    if ("NONE".equals(diffType) || diffQty == 0) {
      markCountLineAdjusted(order, line, "NO_ACTION", 0, operator, "无差异，无需调整");
      return;
    }
    if ("OVERAGE".equals(diffType)) {
      long targetLocationId = longValue(line.get("location_id"), 0);
      changeInventory(line, targetLocationId, Math.abs(diffQty), operator, text(order, "count_order_no"), "盘盈增加库存");
      if (bool(line.get("sn_required")) && StringUtils.hasText(text(line, "sn_code"))) {
        jdbc.update("""
            UPDATE wms_serial_number
            SET status = 'ON_SHELF', warehouse_id = :warehouseId, location_id = :locationId,
                pallet_code = :palletCode, box_code = :boxCode, locked_flag = 0, locked_order_no = NULL
            WHERE sn_code = :sn
            """, params(
            "warehouseId", line.get("warehouse_id"),
            "locationId", targetLocationId,
            "palletCode", line.get("pallet_code"),
            "boxCode", line.get("box_code"),
            "sn", line.get("sn_code")
        ));
      }
      markCountLineAdjusted(order, line, "INCREASE_STOCK", Math.abs(diffQty), operator, "盘盈调整增加库存");
      return;
    }
    if ("SHORTAGE".equals(diffType)) {
      changeInventory(line, longValue(line.get("location_id"), 0), -Math.abs(diffQty), operator, text(order, "count_order_no"), "盘亏减少库存");
      if (bool(line.get("sn_required")) && StringUtils.hasText(text(line, "sn_code"))) {
        jdbc.update("UPDATE wms_serial_number SET status = 'MISSING', locked_flag = 0, locked_order_no = NULL WHERE sn_code = :sn",
            params("sn", line.get("sn_code")));
      }
      markCountLineAdjusted(order, line, "DECREASE_STOCK", -Math.abs(diffQty), operator, "盘亏调整减少库存");
      return;
    }
    if ("LOCATION_DIFF".equals(diffType)) {
      Map<String, Object> target = requireLocation(text(line, "actual_location_code"), longValue(line.get("warehouse_id"), 0));
      moveInventoryQty(line, longValue(line.get("location_id"), 0), longValue(target.get("id"), 0), 1, operator, text(order, "count_order_no"), "盘点库位差异调整");
      if (StringUtils.hasText(text(line, "sn_code"))) {
        jdbc.update("UPDATE wms_serial_number SET location_id = :locationId WHERE sn_code = :sn",
            params("locationId", target.get("id"), "sn", line.get("sn_code")));
      }
      markCountLineAdjusted(order, line, "CORRECT_LOCATION", 0, operator, "库位差异调整");
    }
  }

  private void markCountLineAdjusted(Map<String, Object> order, Map<String, Object> line, String type, int qty, String operator, String remark) {
    jdbc.update("UPDATE wms_inventory_count_line SET line_status = 'ADJUSTED' WHERE id = :id", params("id", line.get("id")));
    jdbc.update("""
        INSERT INTO wms_inventory_count_adjustment (
          count_order_id, count_line_id, adjustment_no, adjustment_type, qty, from_location_id, to_location_id, operator, result, remark
        ) VALUES (
          :orderId, :lineId, :adjustmentNo, :type, :qty, :fromLocationId, :toLocationId, :operator, 'SUCCESS', :remark
        )
        """, params(
        "orderId", order.get("id"),
        "lineId", line.get("id"),
        "adjustmentNo", nextNo("ADJ"),
        "type", type,
        "qty", qty,
        "fromLocationId", line.get("location_id"),
        "toLocationId", line.get("location_id"),
        "operator", operator,
        "remark", remark
    ));
  }

  private void addMoveLine(long orderId, Map<String, Object> warehouse, Map<String, Object> fromLocation, Map<String, Object> toLocation,
                           String ownerCode, Map<String, Object> row, int lineNo) {
    Map<String, Object> product;
    Map<String, Object> lineFromLocation = fromLocation;
    Map<String, Object> lineToLocation = toLocation;
    String snCode = text(row, "snCode", "sn_code");
    if (StringUtils.hasText(snCode)) {
      Map<String, Object> sn = requireSn(snCode);
      product = repo.one("SELECT * FROM md_product WHERE id = :id", params("id", sn.get("product_id")));
      if (lineFromLocation == null && sn.get("location_id") != null) {
        lineFromLocation = locationById(longValue(sn.get("location_id"), 0));
      }
    } else {
      product = requireProduct(firstText(text(row, "productCode"), text(row, "product_code")), ownerCode);
    }
    if (StringUtils.hasText(text(row, "fromLocationCode"))) {
      lineFromLocation = requireLocation(text(row, "fromLocationCode"), longValue(warehouse.get("id"), 0));
    }
    if (StringUtils.hasText(text(row, "toLocationCode"))) {
      lineToLocation = requireLocation(text(row, "toLocationCode"), longValue(warehouse.get("id"), 0));
    }
    jdbc.update("""
        INSERT INTO wms_inventory_move_line (
          move_order_id, line_no, product_id, sn_required, sn_code, batch_no,
          from_location_id, to_location_id, from_pallet_code, to_pallet_code,
          from_box_code, to_box_code, move_qty, unit, line_status
        ) VALUES (
          :orderId, :lineNo, :productId, :snRequired, :snCode, :batchNo,
          :fromLocationId, :toLocationId, :fromPalletCode, :toPalletCode,
          :fromBoxCode, :toBoxCode, :moveQty, :unit, 'CREATED'
        )
        """, params(
        "orderId", orderId,
        "lineNo", intValue(row.get("lineNo"), lineNo),
        "productId", product.get("id"),
        "snRequired", bool(product.get("sn_managed")) ? 1 : 0,
        "snCode", snCode,
        "batchNo", text(row, "batchNo"),
        "fromLocationId", lineFromLocation == null ? null : lineFromLocation.get("id"),
        "toLocationId", lineToLocation == null ? null : lineToLocation.get("id"),
        "fromPalletCode", text(row, "fromPalletCode"),
        "toPalletCode", text(row, "toPalletCode"),
        "fromBoxCode", text(row, "fromBoxCode"),
        "toBoxCode", text(row, "toBoxCode"),
        "moveQty", intValue(row.get("moveQty"), StringUtils.hasText(snCode) ? 1 : 0),
        "unit", firstText(text(row, "unit"), text(product, "unit"), "PCS")
    ));
  }

  private void confirmSnMove(Map<String, Object> order, Map<String, Object> line, String operator) {
    Map<String, Object> sn = requireSn(text(line, "sn_code"));
    if (!"ON_SHELF".equals(text(sn, "status"))) {
      throw new IllegalArgumentException("当前 SN 已分配/拣货/发货或不在库，不允许移动：" + sn.get("sn_code"));
    }
    if (!"QUALIFIED".equals(text(sn, "quality_status"))) {
      throw new IllegalArgumentException("当前 SN 非合格状态，不允许移动：" + sn.get("sn_code"));
    }
    if (bool(sn.get("locked_flag"))) {
      throw new IllegalArgumentException("当前 SN 已分配出库，不允许移动：" + sn.get("sn_code"));
    }
    validateMoveOwner(order, sn);
    validateMoveLocation(order, line, sn);
    long fromLocationId = longValue(line.get("from_location_id"), longValue(sn.get("location_id"), 0));
    long toLocationId = longValue(line.get("to_location_id"), fromLocationId);
    moveInventoryQty(line, fromLocationId, toLocationId, 1, operator, text(order, "move_order_no"), "SN 库存移动");
    jdbc.update("""
        UPDATE wms_serial_number
        SET location_id = :toLocationId,
            pallet_code = COALESCE(:toPalletCode, pallet_code),
            box_code = COALESCE(:toBoxCode, box_code)
        WHERE sn_code = :sn
        """, params(
        "toLocationId", toLocationId,
        "toPalletCode", nullableText(firstText(text(line, "to_pallet_code"), text(order, "to_pallet_code"))),
        "toBoxCode", nullableText(firstText(text(line, "to_box_code"), text(order, "to_box_code"))),
        "sn", sn.get("sn_code")
    ));
    jdbc.update("""
        UPDATE wms_package_binding
        SET pallet_code = COALESCE(:toPalletCode, pallet_code),
            box_code = COALESCE(:toBoxCode, box_code)
        WHERE sn_code = :sn
        """, params(
        "toPalletCode", nullableText(firstText(text(line, "to_pallet_code"), text(order, "to_pallet_code"))),
        "toBoxCode", nullableText(firstText(text(line, "to_box_code"), text(order, "to_box_code"))),
        "sn", sn.get("sn_code")
    ));
  }

  private void confirmQtyMove(Map<String, Object> order, Map<String, Object> line, String operator) {
    int qty = intValue(line.get("move_qty"), 0);
    if (qty <= 0) {
      throw new IllegalArgumentException("移动数量必须大于 0");
    }
    Map<String, Object> target = locationById(longValue(line.get("to_location_id"), 0));
    if (target == null) {
      throw new IllegalArgumentException("目标库位不存在");
    }
    if (bool(target.get("frozen_flag"))) {
      throw new IllegalArgumentException("目标库位已冻结，不允许移入");
    }
    if (longValue(target.get("warehouse_id"), 0) != longValue(order.get("warehouse_id"), 0)) {
      throw new IllegalArgumentException("库存移动本轮不支持跨仓移动");
    }
    Map<String, Object> inv = requireMovableInventory(order, line);
    if (intValue(inv.get("available_qty"), 0) < qty) {
      throw new IllegalArgumentException("移动数量不能大于可用库存数量");
    }
    moveInventoryQty(line, longValue(inv.get("location_id"), 0), longValue(target.get("id"), 0), qty, operator, text(order, "move_order_no"), "非 SN 数量移动");
  }

  private void validateMoveOwner(Map<String, Object> order, Map<String, Object> row) {
    String rowOwner = firstText(text(row, "owner_code"), text(row, "product_owner_code"));
    if (StringUtils.hasText(rowOwner) && StringUtils.hasText(text(order, "owner_code")) && !rowOwner.equals(text(order, "owner_code"))) {
      throw new IllegalArgumentException("库存移动不允许变更货主");
    }
  }

  private void validateMoveLocation(Map<String, Object> order, Map<String, Object> line, Map<String, Object> sn) {
    long fromLocationId = longValue(line.get("from_location_id"), 0);
    if (fromLocationId > 0 && fromLocationId != longValue(sn.get("location_id"), 0)) {
      throw new IllegalArgumentException("SN 当前库位与移动单来源库位不一致");
    }
    Map<String, Object> target = locationById(longValue(line.get("to_location_id"), fromLocationId));
    if (target == null) {
      throw new IllegalArgumentException("目标库位不存在");
    }
    if (bool(target.get("frozen_flag"))) {
      throw new IllegalArgumentException("目标库位已冻结，不允许移入");
    }
    if (longValue(target.get("warehouse_id"), 0) != longValue(order.get("warehouse_id"), 0)) {
      throw new IllegalArgumentException("库存移动本轮不支持跨仓移动");
    }
  }

  private void moveInventoryQty(Map<String, Object> line, long fromLocationId, long toLocationId, int qty,
                                String operator, String businessNo, String remark) {
    if (fromLocationId == toLocationId) {
      writeTransaction("MOVE_OUT", businessNo, line, fromLocationId, fromLocationId, toLocationId, -qty, null, null, operator, remark);
      writeTransaction("MOVE_IN", businessNo, line, toLocationId, fromLocationId, toLocationId, qty, null, null, operator, remark);
      return;
    }
    changeInventoryAtLocation(line, fromLocationId, -qty, operator, businessNo, "MOVE_OUT", remark);
    changeInventoryAtLocation(line, toLocationId, qty, operator, businessNo, "MOVE_IN", remark);
  }

  private void changeInventory(Map<String, Object> line, long locationId, int qty, String operator, String businessNo, String remark) {
    changeInventoryAtLocation(line, locationId, qty, operator, businessNo, "COUNT_ADJUST", remark);
  }

  private void changeInventoryAtLocation(Map<String, Object> line, long locationId, int qty, String operator,
                                         String businessNo, String transactionType, String remark) {
    Map<String, Object> existing = findInventory(line, locationId, qty > 0);
    int beforeQty = existing == null ? 0 : intValue(existing.get("total_qty"), 0);
    int afterQty = beforeQty + qty;
    if (afterQty < 0) {
      throw new IllegalArgumentException("库存调整后数量不能小于 0");
    }
    if (existing == null) {
      Map<String, Object> location = locationById(locationId);
      jdbc.update("""
          INSERT INTO wms_inventory (
            warehouse_id, area_id, location_id, product_id, owner_code, owner_name, batch_no,
            pallet_code, box_code, inventory_status, total_qty, available_qty, allocated_qty, frozen_qty,
            unqualified_qty, inbound_date, vmi_flag
          ) VALUES (
            :warehouseId, :areaId, :locationId, :productId, :ownerCode, :ownerName, :batchNo,
            :palletCode, :boxCode, 'QUALIFIED', :qty, :qty, 0, 0, 0, CURDATE(), 0
          )
          """, params(
          "warehouseId", location.get("warehouse_id"),
          "areaId", location.get("area_id"),
          "locationId", locationId,
          "productId", line.get("product_id"),
          "ownerCode", line.get("owner_code"),
          "ownerName", line.get("owner_name"),
          "batchNo", text(line, "batch_no"),
          "palletCode", firstText(text(line, "to_pallet_code"), text(line, "pallet_code")),
          "boxCode", firstText(text(line, "to_box_code"), text(line, "box_code")),
          "qty", qty
      ));
    } else {
      if (qty < 0 && intValue(existing.get("available_qty"), 0) < Math.abs(qty)) {
        throw new IllegalArgumentException("移动数量不能大于可用库存数量");
      }
      jdbc.update("""
          UPDATE wms_inventory
          SET total_qty = total_qty + :qty,
              available_qty = available_qty + :qty
          WHERE id = :id
          """, params("id", existing.get("id"), "qty", qty));
    }
    writeTransaction(transactionType, businessNo, line, locationId, null, null, qty, beforeQty, afterQty, operator, remark);
  }

  private Map<String, Object> findInventory(Map<String, Object> line, long locationId, boolean targetSide) {
    String palletCode = targetSide
        ? firstText(text(line, "to_pallet_code"), text(line, "pallet_code"))
        : firstText(text(line, "from_pallet_code"), text(line, "pallet_code"));
    String boxCode = targetSide
        ? firstText(text(line, "to_box_code"), text(line, "box_code"))
        : firstText(text(line, "from_box_code"), text(line, "box_code"));
    return repo.one("""
        SELECT *
        FROM wms_inventory
        WHERE location_id = :locationId
          AND product_id = :productId
          AND COALESCE(owner_code, '') = COALESCE(:ownerCode, '')
          AND ((batch_no = :batchNo) OR (batch_no IS NULL AND :batchNo IS NULL) OR (:batchNo = ''))
          AND (:palletCode = '' OR COALESCE(pallet_code, '') = :palletCode)
          AND (:boxCode = '' OR COALESCE(box_code, '') = :boxCode)
          AND inventory_status = 'QUALIFIED'
        ORDER BY id
        LIMIT 1
        """, params(
        "locationId", locationId,
        "productId", line.get("product_id"),
        "ownerCode", text(line, "owner_code"),
        "batchNo", text(line, "batch_no"),
        "palletCode", palletCode,
        "boxCode", boxCode
    ));
  }

  private Map<String, Object> requireMovableInventory(Map<String, Object> order, Map<String, Object> line) {
    Map<String, Object> inv = repo.one("""
        SELECT *
        FROM wms_inventory
        WHERE warehouse_id = :warehouseId
          AND location_id = :locationId
          AND product_id = :productId
          AND COALESCE(owner_code, '') = COALESCE(:ownerCode, '')
          AND inventory_status = 'QUALIFIED'
          AND frozen_qty = 0
          AND allocated_qty = 0
          AND ((batch_no = :batchNo) OR (:batchNo = ''))
          AND (:palletCode = '' OR COALESCE(pallet_code, '') = :palletCode)
          AND (:boxCode = '' OR COALESCE(box_code, '') = :boxCode)
        ORDER BY available_qty DESC
        LIMIT 1
        """, params(
        "warehouseId", order.get("warehouse_id"),
        "locationId", line.get("from_location_id"),
        "productId", line.get("product_id"),
        "ownerCode", text(order, "owner_code"),
        "batchNo", text(line, "batch_no"),
        "palletCode", firstText(text(line, "from_pallet_code"), ""),
        "boxCode", firstText(text(line, "from_box_code"), "")
    ));
    if (inv == null) {
      throw new IllegalArgumentException("来源库存不存在、已冻结或已分配，不允许移动");
    }
    return inv;
  }

  private void writeTransaction(String type, String businessNo, Map<String, Object> line, long locationId,
                                Long fromLocationId, Long toLocationId, int qty, Integer beforeQty, Integer afterQty,
                                String operator, String remark) {
    jdbc.update("""
        INSERT INTO wms_inventory_transaction (
          transaction_no, transaction_type, business_doc_no, owner_code, owner_name,
          warehouse_id, location_id, from_location_id, to_location_id, product_id, sn_code, batch_no,
          from_pallet_code, to_pallet_code, from_box_code, to_box_code,
          qty, before_qty, after_qty, operator, remark
        ) VALUES (
          :transactionNo, :transactionType, :businessNo, :ownerCode, :ownerName,
          :warehouseId, :locationId, :fromLocationId, :toLocationId, :productId, :snCode, :batchNo,
          :fromPalletCode, :toPalletCode, :fromBoxCode, :toBoxCode,
          :qty, :beforeQty, :afterQty, :operator, :remark
        )
        """, params(
        "transactionNo", nextNo("TXN"),
        "transactionType", type,
        "businessNo", businessNo,
        "ownerCode", line.get("owner_code"),
        "ownerName", line.get("owner_name"),
        "warehouseId", line.get("warehouse_id"),
        "locationId", locationId,
        "fromLocationId", fromLocationId,
        "toLocationId", toLocationId,
        "productId", line.get("product_id"),
        "snCode", text(line, "sn_code"),
        "batchNo", text(line, "batch_no"),
        "fromPalletCode", firstText(text(line, "from_pallet_code"), text(line, "pallet_code")),
        "toPalletCode", firstText(text(line, "to_pallet_code"), text(line, "pallet_code")),
        "fromBoxCode", firstText(text(line, "from_box_code"), text(line, "box_code")),
        "toBoxCode", firstText(text(line, "to_box_code"), text(line, "box_code")),
        "qty", qty,
        "beforeQty", beforeQty,
        "afterQty", afterQty,
        "operator", firstText(operator, "admin"),
        "remark", remark
    ));
  }

  private List<Map<String, Object>> countLines(long id) {
    return repo.query("""
        SELECT l.*, w.warehouse_code, w.warehouse_name, a.area_code, a.area_name,
               loc.location_code, p.product_code, p.product_name
        FROM wms_inventory_count_line l
        JOIN wms_warehouse w ON w.id = l.warehouse_id
        LEFT JOIN wms_area a ON a.id = l.area_id
        LEFT JOIN wms_location loc ON loc.id = l.location_id
        JOIN md_product p ON p.id = l.product_id
        WHERE l.count_order_id = :id
        ORDER BY l.line_no
        """, params("id", id));
  }

  private List<Map<String, Object>> moveLines(long id) {
    return repo.query("""
        SELECT l.*, p.product_code, p.product_name, p.owner_code AS product_owner_code, p.owner_name AS product_owner_name,
               fl.location_code AS from_location_code, tl.location_code AS to_location_code,
               o.owner_code, o.owner_name, o.warehouse_id
        FROM wms_inventory_move_line l
        JOIN wms_inventory_move_order o ON o.id = l.move_order_id
        JOIN md_product p ON p.id = l.product_id
        LEFT JOIN wms_location fl ON fl.id = l.from_location_id
        LEFT JOIN wms_location tl ON tl.id = l.to_location_id
        WHERE l.move_order_id = :id
        ORDER BY l.line_no
        """, params("id", id));
  }

  private List<Map<String, Object>> operationLogs(String businessNo) {
    return repo.query("""
        SELECT *
        FROM wms_operation_log
        WHERE business_doc_no = :businessNo
        ORDER BY id DESC
        LIMIT 50
        """, params("businessNo", businessNo));
  }

  private Map<String, Object> requireCountOrder(long id) {
    Map<String, Object> order = repo.one("""
        SELECT o.*, w.warehouse_code, w.warehouse_name
        FROM wms_inventory_count_order o
        LEFT JOIN wms_warehouse w ON w.id = o.warehouse_id
        WHERE o.id = :id
        """, params("id", id));
    if (order == null) throw new IllegalArgumentException("盘点单不存在");
    return order;
  }

  private Map<String, Object> requireMoveOrder(long id) {
    Map<String, Object> order = repo.one("""
        SELECT o.*, w.warehouse_code, w.warehouse_name,
               fl.location_code AS from_location_code, tl.location_code AS to_location_code
        FROM wms_inventory_move_order o
        JOIN wms_warehouse w ON w.id = o.warehouse_id
        LEFT JOIN wms_location fl ON fl.id = o.from_location_id
        LEFT JOIN wms_location tl ON tl.id = o.to_location_id
        WHERE o.id = :id
        """, params("id", id));
    if (order == null) throw new IllegalArgumentException("库存移动单不存在");
    return order;
  }

  private Map<String, Object> requireWarehouse(String warehouseCode) {
    Map<String, Object> warehouse = optionalWarehouse(warehouseCode);
    if (warehouse == null) throw new IllegalArgumentException("仓库不存在：" + warehouseCode);
    return warehouse;
  }

  private Map<String, Object> optionalWarehouse(String warehouseCode) {
    if (!StringUtils.hasText(warehouseCode)) return null;
    return repo.one("SELECT * FROM wms_warehouse WHERE warehouse_code = :code", params("code", warehouseCode));
  }

  private Map<String, Object> requireProduct(String productCode, String ownerCode) {
    Map<String, Object> product = optionalProduct(productCode, ownerCode);
    if (product == null) throw new IllegalArgumentException("产品不存在：" + productCode);
    return product;
  }

  private Map<String, Object> optionalProduct(String productCode, String ownerCode) {
    if (!StringUtils.hasText(productCode)) return null;
    return repo.one("""
        SELECT *
        FROM md_product
        WHERE product_code = :productCode
          AND (:ownerCode = '' OR owner_code = :ownerCode OR owner_code IS NULL)
        ORDER BY owner_code IS NULL
        LIMIT 1
        """, params("productCode", productCode, "ownerCode", firstText(ownerCode, "")));
  }

  private Map<String, Object> requireLocation(String locationCode, long warehouseId) {
    Map<String, Object> location = optionalLocation(locationCode, warehouseId);
    if (location == null) throw new IllegalArgumentException("库位不存在：" + locationCode);
    return location;
  }

  private Map<String, Object> optionalLocation(String locationCode, long warehouseId) {
    if (!StringUtils.hasText(locationCode)) return null;
    return repo.one("""
        SELECT l.*, a.area_code
        FROM wms_location l
        JOIN wms_area a ON a.id = l.area_id
        WHERE l.location_code = :locationCode
          AND (:warehouseId = 0 OR l.warehouse_id = :warehouseId)
        """, params("locationCode", locationCode, "warehouseId", warehouseId));
  }

  private Map<String, Object> locationById(long locationId) {
    if (locationId <= 0) return null;
    return repo.one("""
        SELECT l.*, a.area_code
        FROM wms_location l
        JOIN wms_area a ON a.id = l.area_id
        WHERE l.id = :id
        """, params("id", locationId));
  }

  private Map<String, Object> requireSn(String snCode) {
    Map<String, Object> sn = repo.one("""
        SELECT s.*, p.owner_code AS product_owner_code, p.owner_name AS product_owner_name,
               p.product_code, p.product_name
        FROM wms_serial_number s
        JOIN md_product p ON p.id = s.product_id
        WHERE s.sn_code = :sn
        """, params("sn", snCode));
    if (sn == null) throw new IllegalArgumentException("SN 不存在：" + snCode);
    return sn;
  }

  private void freezeCountScope(Map<String, Object> order) {
    jdbc.update("""
        UPDATE wms_inventory i
        JOIN md_product p ON p.id = i.product_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN wms_area a ON a.id = i.area_id
        SET i.frozen_qty = i.available_qty,
            i.available_qty = 0,
            i.inventory_status = 'FROZEN'
        WHERE i.inventory_status = 'QUALIFIED'
          AND (:warehouseId IS NULL OR i.warehouse_id = :warehouseId)
          AND (:ownerCode = '' OR COALESCE(i.owner_code, p.owner_code) = :ownerCode)
          AND (:areaCode = '' OR a.area_code = :areaCode)
          AND (:locationCode = '' OR l.location_code = :locationCode)
          AND (:productCode = '' OR p.product_code = :productCode)
        """, scopeParams(order));
  }

  private void releaseCountFreeze(Map<String, Object> order) {
    jdbc.update("""
        UPDATE wms_inventory i
        JOIN md_product p ON p.id = i.product_id
        JOIN wms_location l ON l.id = i.location_id
        JOIN wms_area a ON a.id = i.area_id
        SET i.available_qty = i.available_qty + i.frozen_qty,
            i.frozen_qty = 0,
            i.inventory_status = 'QUALIFIED'
        WHERE i.inventory_status = 'FROZEN'
          AND (:warehouseId IS NULL OR i.warehouse_id = :warehouseId)
          AND (:ownerCode = '' OR COALESCE(i.owner_code, p.owner_code) = :ownerCode)
          AND (:areaCode = '' OR a.area_code = :areaCode)
          AND (:locationCode = '' OR l.location_code = :locationCode)
          AND (:productCode = '' OR p.product_code = :productCode)
        """, scopeParams(order));
  }

  private Map<String, Object> scopeParams(Map<String, Object> order) {
    return params(
        "warehouseId", order.get("warehouse_id"),
        "ownerCode", firstText(text(order, "owner_code"), ""),
        "areaCode", firstText(text(order, "area_code"), ""),
        "locationCode", firstText(text(order, "location_code"), ""),
        "productCode", firstText(text(order, "product_code"), ""),
        "batchNo", firstText(text(order, "batch_no"), ""),
        "palletCode", firstText(text(order, "pallet_code"), ""),
        "boxCode", firstText(text(order, "box_code"), ""),
        "snCode", firstText(text(order, "sn_code"), "")
    );
  }

  private String diffType(Map<String, Object> line, int actualQty, String actualLocationCode) {
    String currentLocationCode = text(line, "location_code");
    if (StringUtils.hasText(actualLocationCode) && StringUtils.hasText(currentLocationCode) && !actualLocationCode.equals(currentLocationCode)) {
      return "LOCATION_DIFF";
    }
    int diffQty = actualQty - intValue(line.get("book_qty"), 0);
    if (diffQty > 0) return "OVERAGE";
    if (diffQty < 0) return "SHORTAGE";
    return "NONE";
  }

  private List<Map<String, Object>> bodyLines(Map<String, Object> body) {
    Object lines = body.get("lines");
    List<Map<String, Object>> rows = new ArrayList<>();
    if (lines instanceof List<?> list) {
      for (Object item : list) {
        if (item instanceof Map<?, ?> source) {
          Map<String, Object> row = new HashMap<>();
          source.forEach((k, v) -> row.put(String.valueOf(k), v));
          rows.add(row);
        }
      }
    }
    return rows;
  }

  private String ownerName(String ownerCode) {
    Map<String, Object> row = repo.one("SELECT customer_name FROM md_customer WHERE customer_code = :code", params("code", ownerCode));
    return row == null ? "" : text(row, "customer_name");
  }

  private String nextNo(String prefix) {
    return prefix + "-" + NO_TIME.format(LocalDateTime.now()) + "-" + String.format("%03d", System.nanoTime() % 1000);
  }

  private Map<String, Object> params(Object... values) {
    Map<String, Object> params = new HashMap<>();
    for (int i = 0; i + 1 < values.length; i += 2) {
      params.put(String.valueOf(values[i]), values[i + 1]);
    }
    return params;
  }

  private String text(Map<?, ?> row, String... keys) {
    for (String key : keys) {
      Object value = row.get(key);
      if (value == null && key.indexOf('_') < 0) {
        value = row.get(camelToSnake(key));
      }
      if (value != null && StringUtils.hasText(String.valueOf(value))) {
        return String.valueOf(value);
      }
    }
    return "";
  }

  private String nullableText(Object value) {
    if (value == null) return null;
    String text = String.valueOf(value);
    return StringUtils.hasText(text) ? text : null;
  }

  private String firstText(String... values) {
    for (String value : values) {
      if (StringUtils.hasText(value)) return value;
    }
    return "";
  }

  private boolean bool(Object value) {
    if (value == null) return false;
    if (value instanceof Boolean bool) return bool;
    if (value instanceof Number number) return number.intValue() != 0;
    String text = String.valueOf(value);
    return "true".equalsIgnoreCase(text) || "1".equals(text) || "Y".equalsIgnoreCase(text);
  }

  private int intValue(Object value, int defaultValue) {
    if (value == null) return defaultValue;
    if (value instanceof Number number) return number.intValue();
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return defaultValue;
    }
  }

  private long longValue(Object value, long defaultValue) {
    if (value == null) return defaultValue;
    if (value instanceof Number number) return number.longValue();
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return defaultValue;
    }
  }

  private String camelToSnake(String key) {
    return key.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
  }
}
