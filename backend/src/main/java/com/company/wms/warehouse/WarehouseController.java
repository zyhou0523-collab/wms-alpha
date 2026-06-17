package com.company.wms.warehouse;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WarehouseController {
  private static final List<String> WAREHOUSE_COLUMNS = List.of(
      "warehouse_code", "warehouse_name", "warehouse_type", "region", "country", "city",
      "owner_type", "owner_code", "own_flag", "vmi_flag", "status"
  );
  private static final List<String> LOCATION_COLUMNS = List.of(
      "warehouse_id", "area_id", "location_code", "location_name", "rack_no", "level_no",
      "column_no", "capacity", "frozen_flag", "status"
  );

  private final WmsRepository repo;

  public WarehouseController(WmsRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/api/warehouses")
  public ApiResponse<PageResult<Map<String, Object>>> warehouses(
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String warehouseName,
      @RequestParam(required = false) String warehouseType,
      @RequestParam(required = false) String region,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("warehouseName", repo.like(warehouseName));
    params.put("warehouseType", repo.like(warehouseType));
    params.put("region", repo.like(region));
    params.put("status", repo.like(status));
    String where = """
        WHERE (:warehouseCode IS NULL OR warehouse_code LIKE :warehouseCode)
          AND (:warehouseName IS NULL OR warehouse_name LIKE :warehouseName)
          AND (:warehouseType IS NULL OR warehouse_type LIKE :warehouseType)
          AND (:region IS NULL OR region LIKE :region)
          AND (:status IS NULL OR status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT * FROM wms_warehouse " + where + " ORDER BY id DESC",
        "SELECT COUNT(*) FROM wms_warehouse " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  @PostMapping("/api/warehouses")
  public ApiResponse<String> createWarehouse(@RequestBody Map<String, Object> body) {
    repo.insert("wms_warehouse", body, WAREHOUSE_COLUMNS);
    return ApiResponse.ok("created");
  }

  @PutMapping("/api/warehouses/{id}")
  public ApiResponse<String> updateWarehouse(@PathVariable long id, @RequestBody Map<String, Object> body) {
    repo.updateById("wms_warehouse", id, body, WAREHOUSE_COLUMNS);
    return ApiResponse.ok("updated");
  }

  @DeleteMapping("/api/warehouses/{id}")
  public ApiResponse<String> deleteWarehouse(@PathVariable long id) {
    repo.deleteById("wms_warehouse", id);
    return ApiResponse.ok("deleted");
  }

  @GetMapping("/api/locations")
  public ApiResponse<PageResult<Map<String, Object>>> locations(
      @RequestParam(required = false) String locationCode,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("locationCode", repo.like(locationCode));
    params.put("warehouseCode", repo.like(warehouseCode));
    params.put("status", repo.like(status));
    String from = """
        FROM wms_location l
        JOIN wms_warehouse w ON w.id = l.warehouse_id
        JOIN wms_area a ON a.id = l.area_id
        WHERE (:locationCode IS NULL OR l.location_code LIKE :locationCode)
          AND (:warehouseCode IS NULL OR w.warehouse_code LIKE :warehouseCode)
          AND (:status IS NULL OR l.status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        """
        SELECT l.*, w.warehouse_code, w.warehouse_name, a.area_code, a.area_name
        """ + from + " ORDER BY l.id DESC",
        "SELECT COUNT(*) " + from,
        params,
        pageNum,
        pageSize
    ));
  }

  @PostMapping("/api/locations")
  public ApiResponse<String> createLocation(@RequestBody Map<String, Object> body) {
    repo.insert("wms_location", body, LOCATION_COLUMNS);
    return ApiResponse.ok("created");
  }

  @PutMapping("/api/locations/{id}")
  public ApiResponse<String> updateLocation(@PathVariable long id, @RequestBody Map<String, Object> body) {
    repo.updateById("wms_location", id, body, LOCATION_COLUMNS);
    return ApiResponse.ok("updated");
  }

  @DeleteMapping("/api/locations/{id}")
  public ApiResponse<String> deleteLocation(@PathVariable long id) {
    repo.deleteById("wms_location", id);
    return ApiResponse.ok("deleted");
  }
}

