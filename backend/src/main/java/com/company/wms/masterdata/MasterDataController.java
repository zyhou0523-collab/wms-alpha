package com.company.wms.masterdata;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.CsvExport;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MasterDataController {
  private static final List<String> PRODUCT_COLUMNS = List.of(
      "owner_code", "owner_name", "product_code", "product_name", "product_name_en",
      "category", "spec_model", "product_family", "product_class", "unit", "sn_managed",
      "battery_flag", "shelf_life_days", "safety_stock", "aging_threshold_days", "status"
  );
  private static final List<String> CUSTOMER_COLUMNS = List.of(
      "customer_code", "customer_name", "customer_type", "country_region", "contact_name",
      "contact_phone", "delivery_address", "vmi_flag", "status"
  );

  private final WmsRepository repo;

  public MasterDataController(WmsRepository repo) {
    this.repo = repo;
  }

  @GetMapping("/api/products")
  public ApiResponse<PageResult<Map<String, Object>>> products(
      @RequestParam(required = false) String productCode,
      @RequestParam(required = false) String productName,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String productFamily,
      @RequestParam(required = false) String productClass,
      @RequestParam(required = false) String snManaged,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("productCode", repo.like(productCode));
    params.put("productName", repo.like(productName));
    params.put("ownerCode", repo.like(ownerCode));
    params.put("keyword", repo.like(keyword));
    params.put("category", repo.like(category));
    params.put("productFamily", repo.like(productFamily));
    params.put("productClass", repo.like(productClass));
    params.put("snManaged", repo.integerOrNull(snManaged));
    params.put("status", repo.like(status));
    String where = """
        WHERE (:productCode IS NULL OR product_code LIKE :productCode)
          AND (:productName IS NULL OR product_name LIKE :productName)
          AND (:ownerCode IS NULL OR owner_code LIKE :ownerCode)
          AND (:keyword IS NULL OR product_code LIKE :keyword OR product_name LIKE :keyword OR product_name_en LIKE :keyword)
          AND (:category IS NULL OR category LIKE :category)
          AND (:productFamily IS NULL OR product_family LIKE :productFamily)
          AND (:productClass IS NULL OR product_class LIKE :productClass)
          AND (:snManaged IS NULL OR sn_managed = :snManaged)
          AND (:status IS NULL OR status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT * FROM md_product " + where + " ORDER BY id DESC",
        "SELECT COUNT(*) FROM md_product " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  @PostMapping("/api/products")
  public ApiResponse<String> createProduct(@RequestBody Map<String, Object> body) {
    validateProductUnique(null, body);
    repo.insert("md_product", body, PRODUCT_COLUMNS);
    return ApiResponse.ok("created");
  }

  @PutMapping("/api/products/{id}")
  public ApiResponse<String> updateProduct(@PathVariable long id, @RequestBody Map<String, Object> body) {
    validateProductUnique(id, body);
    repo.updateById("md_product", id, body, PRODUCT_COLUMNS);
    return ApiResponse.ok("updated");
  }

  @DeleteMapping("/api/products/{id}")
  public ApiResponse<String> deleteProduct(@PathVariable long id) {
    repo.deleteById("md_product", id);
    return ApiResponse.ok("deleted");
  }

  @GetMapping("/api/products/options")
  public ApiResponse<List<Map<String, Object>>> productOptions(
      @RequestParam(required = false) String ownerCode,
      @RequestParam(required = false) String keyword
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("ownerCode", ownerCode);
    params.put("keyword", repo.like(keyword));
    return ApiResponse.ok(repo.query("""
        SELECT id AS productId, id, owner_code AS ownerCode, owner_name AS ownerName,
               product_code AS productCode, product_code, product_name AS productName,
               product_name, product_name_en AS productNameEn, unit,
               sn_managed AS snRequired, sn_managed, battery_flag,
               category, spec_model, product_family, product_class
        FROM md_product
        WHERE (:ownerCode IS NULL OR owner_code = :ownerCode)
          AND (:keyword IS NULL OR product_code LIKE :keyword OR product_name LIKE :keyword OR product_name_en LIKE :keyword)
          AND status = 'ACTIVE'
        ORDER BY owner_code, product_code
        LIMIT 100
        """, params));
  }

  @GetMapping("/api/products/export-template")
  public ApiResponse<Map<String, Object>> productTemplate() {
    return ApiResponse.ok(CsvExport.file("产品主数据导入模板.csv", CsvExport.csv(productTemplateHeaders(), List.of(List.of(
        "3060", "杭州利沃得", "DEMO-PROD-001", "演示产品", "Demo Product", "MODEL-001",
        "数字能源", "逆变器", "成品", "PCS", "是", "否", "20", "180", "启用"
    )))));
  }

  @GetMapping("/api/products/export")
  public ApiResponse<Map<String, Object>> productExport(
      @RequestParam(required = false) String productCode,
      @RequestParam(required = false) String productName,
      @RequestParam(required = false) String ownerCode,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String productFamily,
      @RequestParam(required = false) String productClass,
      @RequestParam(required = false) String snManaged,
      @RequestParam(required = false) String status
  ) {
    Map<String, Object> params = productParams(productCode, productName, ownerCode, keyword, category, productFamily, productClass, snManaged, status);
    List<Map<String, Object>> rows = repo.query("""
        SELECT * FROM md_product
        WHERE (:productCode IS NULL OR product_code LIKE :productCode)
          AND (:productName IS NULL OR product_name LIKE :productName)
          AND (:ownerCode IS NULL OR owner_code LIKE :ownerCode)
          AND (:keyword IS NULL OR product_code LIKE :keyword OR product_name LIKE :keyword OR product_name_en LIKE :keyword)
          AND (:category IS NULL OR category LIKE :category)
          AND (:productFamily IS NULL OR product_family LIKE :productFamily)
          AND (:productClass IS NULL OR product_class LIKE :productClass)
          AND (:snManaged IS NULL OR sn_managed = :snManaged)
          AND (:status IS NULL OR status LIKE :status)
        ORDER BY id DESC
        """, params);
    List<List<?>> data = rows.stream().map(row -> List.of(
        value(row, "owner_code"), value(row, "owner_name"), value(row, "product_code"), value(row, "product_name"),
        value(row, "product_name_en"), value(row, "spec_model"), value(row, "product_family"), value(row, "product_class"),
        value(row, "category"), value(row, "unit"), yesNo(row.get("sn_managed")), yesNo(row.get("battery_flag")),
        value(row, "safety_stock"), value(row, "aging_threshold_days"), statusName(value(row, "status"))
    )).toList();
    return ApiResponse.ok(CsvExport.file("产品主数据_" + CsvExport.timestamp() + ".csv", CsvExport.csv(productTemplateHeaders(), data)));
  }

  @PostMapping("/api/products/import")
  @Transactional
  public ApiResponse<Map<String, Object>> productImport(@RequestBody Map<String, Object> body) {
    List<Map<String, Object>> rows = bodyRows(body, "rows");
    Map<String, Object> result = importResult();
    for (int i = 0; i < rows.size(); i++) {
      Map<String, Object> row = rows.get(i);
      int rowNo = i + 2;
      String ownerCode = cell(row, "货主编码", "ownerCode", "owner_code");
      String ownerName = cell(row, "货主名称", "ownerName", "owner_name");
      String productCode = cell(row, "产品编码", "productCode", "product_code");
      String productName = cell(row, "产品名称（中文）", "产品名称", "productName", "product_name");
      String unit = cell(row, "单位", "unit");
      String snValue = cell(row, "SN 管理", "SN管理", "snManaged", "sn_managed");
      String statusValue = cell(row, "状态", "status");
      String missing = firstMissing(List.of(
          List.of(ownerCode, "货主编码不能为空"),
          List.of(ownerName, "货主名称不能为空"),
          List.of(productCode, "产品编码不能为空"),
          List.of(productName, "产品名称不能为空"),
          List.of(unit, "单位不能为空"),
          List.of(snValue, "SN 管理不能为空"),
          List.of(statusValue, "状态不能为空")
      ));
      Integer snManaged = parseYesNo(snValue);
      String status = parseStatus(statusValue);
      if (missing != null) {
        importError(result, rowNo, missing);
      } else if (snManaged == null) {
        importError(result, rowNo, "SN 管理必须是“是 / 否”");
      } else if (status.isBlank()) {
        importError(result, rowNo, "状态必须是：启用 / 停用");
      } else {
        Map<String, Object> data = new HashMap<>();
        data.put("owner_code", ownerCode);
        data.put("owner_name", ownerName);
        data.put("product_code", productCode);
        data.put("product_name", productName);
        data.put("product_name_en", cell(row, "产品名称（英文）", "productNameEn", "product_name_en"));
        data.put("spec_model", cell(row, "产品型号", "productModel", "spec_model"));
        data.put("product_family", cell(row, "产品族", "productFamily", "product_family"));
        data.put("product_class", cell(row, "产品类", "productClass", "product_class"));
        data.put("category", cell(row, "类别", "productCategory", "category"));
        data.put("unit", unit);
        data.put("sn_managed", snManaged);
        data.put("battery_flag", parseYesNo(cell(row, "电池类", "batteryFlag", "battery_flag")) == null ? 0 : parseYesNo(cell(row, "电池类", "batteryFlag", "battery_flag")));
        data.put("safety_stock", intValue(cell(row, "安全库存", "safetyStock", "safety_stock"), 0));
        data.put("aging_threshold_days", intValue(cell(row, "库龄阈值", "agingThresholdDays", "aging_threshold_days"), 180));
        data.put("status", status);
        if (String.valueOf(data.get("category")).isBlank()) {
          importError(result, rowNo, "类别不能为空");
        } else {
          Map<String, Object> existing = repo.one("SELECT id FROM md_product WHERE owner_code = :ownerCode AND product_code = :productCode", Map.of("ownerCode", ownerCode, "productCode", productCode));
          if (existing == null) {
            repo.insert("md_product", data, PRODUCT_COLUMNS);
          } else {
            repo.updateById("md_product", ((Number) existing.get("id")).longValue(), data, PRODUCT_COLUMNS);
          }
          incrementSuccess(result);
        }
      }
    }
    finishImportResult(result);
    return ApiResponse.ok(result);
  }

  @GetMapping("/api/customers")
  public ApiResponse<PageResult<Map<String, Object>>> customers(
      @RequestParam(required = false) String customerCode,
      @RequestParam(required = false) String customerName,
      @RequestParam(required = false) String customerType,
      @RequestParam(required = false) String vmiFlag,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("customerCode", repo.like(customerCode));
    params.put("customerName", repo.like(customerName));
    params.put("customerType", repo.like(customerType));
    params.put("vmiFlag", repo.integerOrNull(vmiFlag));
    params.put("status", repo.like(status));
    String where = """
        WHERE (:customerCode IS NULL OR customer_code LIKE :customerCode)
          AND (:customerName IS NULL OR customer_name LIKE :customerName)
          AND (:customerType IS NULL OR customer_type LIKE :customerType)
          AND (:vmiFlag IS NULL OR vmi_flag = :vmiFlag)
          AND (:status IS NULL OR status LIKE :status)
        """;
    return ApiResponse.ok(repo.page(
        "SELECT * FROM md_customer " + where + " ORDER BY id DESC",
        "SELECT COUNT(*) FROM md_customer " + where,
        params,
        pageNum,
        pageSize
    ));
  }

  @PostMapping("/api/customers")
  public ApiResponse<String> createCustomer(@RequestBody Map<String, Object> body) {
    repo.insert("md_customer", body, CUSTOMER_COLUMNS);
    return ApiResponse.ok("created");
  }

  @PutMapping("/api/customers/{id}")
  public ApiResponse<String> updateCustomer(@PathVariable long id, @RequestBody Map<String, Object> body) {
    repo.updateById("md_customer", id, body, CUSTOMER_COLUMNS);
    return ApiResponse.ok("updated");
  }

  @DeleteMapping("/api/customers/{id}")
  public ApiResponse<String> deleteCustomer(@PathVariable long id) {
    repo.deleteById("md_customer", id);
    return ApiResponse.ok("deleted");
  }

  @GetMapping("/api/customers/options")
  public ApiResponse<List<Map<String, Object>>> customerOptions(@RequestParam(required = false) String type) {
    Map<String, Object> params = new HashMap<>();
    params.put("type", type);
    return ApiResponse.ok(repo.query("""
        SELECT id, customer_code AS customerCode, customer_code,
               customer_name AS customerName, customer_name,
               customer_type AS customerType, customer_type
        FROM md_customer
        WHERE (:type IS NULL OR customer_type = :type)
          AND status = 'ACTIVE'
        ORDER BY customer_code
        """, params));
  }

  @GetMapping("/api/customers/export-template")
  public ApiResponse<Map<String, Object>> customerTemplate() {
    return ApiResponse.ok(CsvExport.file("客户主数据导入模板.csv", CsvExport.csv(customerTemplateHeaders(), List.of(List.of(
        "CUST-DEMO-001", "演示客户", "客户", "中国", "浙江", "张三", "13800000000", "杭州市演示地址", "启用"
    )))));
  }

  @GetMapping("/api/customers/export")
  public ApiResponse<Map<String, Object>> customerExport(
      @RequestParam(required = false) String customerCode,
      @RequestParam(required = false) String customerName,
      @RequestParam(required = false) String customerType,
      @RequestParam(required = false) String vmiFlag,
      @RequestParam(required = false) String status
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("customerCode", repo.like(customerCode));
    params.put("customerName", repo.like(customerName));
    params.put("customerType", repo.like(customerType));
    params.put("vmiFlag", repo.integerOrNull(vmiFlag));
    params.put("status", repo.like(status));
    List<Map<String, Object>> rows = repo.query("""
        SELECT * FROM md_customer
        WHERE (:customerCode IS NULL OR customer_code LIKE :customerCode)
          AND (:customerName IS NULL OR customer_name LIKE :customerName)
          AND (:customerType IS NULL OR customer_type LIKE :customerType)
          AND (:vmiFlag IS NULL OR vmi_flag = :vmiFlag)
          AND (:status IS NULL OR status LIKE :status)
        ORDER BY id DESC
        """, params);
    List<List<?>> data = rows.stream().map(row -> {
      String[] countryRegion = splitCountryRegion(value(row, "country_region"));
      return List.of(
          value(row, "customer_code"), value(row, "customer_name"), customerTypeName(value(row, "customer_type")),
          countryRegion[0], countryRegion[1], value(row, "contact_name"), value(row, "contact_phone"),
          value(row, "delivery_address"), statusName(value(row, "status"))
      );
    }).toList();
    return ApiResponse.ok(CsvExport.file("客户主数据_" + CsvExport.timestamp() + ".csv", CsvExport.csv(customerTemplateHeaders(), data)));
  }

  @PostMapping("/api/customers/import")
  @Transactional
  public ApiResponse<Map<String, Object>> customerImport(@RequestBody Map<String, Object> body) {
    List<Map<String, Object>> rows = bodyRows(body, "rows");
    Map<String, Object> result = importResult();
    for (int i = 0; i < rows.size(); i++) {
      Map<String, Object> row = rows.get(i);
      int rowNo = i + 2;
      String code = cell(row, "编码", "customerCode", "customer_code");
      String name = cell(row, "名称", "customerName", "customer_name");
      String typeValue = cell(row, "类型", "customerType", "customer_type");
      String statusValue = cell(row, "状态", "status");
      String type = parseCustomerType(typeValue);
      String status = parseStatus(statusValue);
      String missing = firstMissing(List.of(
          List.of(code, "编码不能为空"),
          List.of(name, "名称不能为空"),
          List.of(typeValue, "类型不能为空"),
          List.of(statusValue, "状态不能为空")
      ));
      if (missing != null) {
        importError(result, rowNo, missing);
      } else if (type.isBlank()) {
        importError(result, rowNo, "类型必须是：客户 / 供应商 / 货主");
      } else if (status.isBlank()) {
        importError(result, rowNo, "状态必须是：启用 / 停用");
      } else {
        Map<String, Object> data = new HashMap<>();
        data.put("customer_code", code);
        data.put("customer_name", name);
        data.put("customer_type", type);
        data.put("country_region", joinCountryRegion(cell(row, "国家", "country"), cell(row, "地区", "region"), cell(row, "国家/地区", "countryRegion", "country_region")));
        data.put("contact_name", cell(row, "联系人", "contactName", "contact_name"));
        data.put("contact_phone", cell(row, "联系电话", "contactPhone", "contact_phone"));
        data.put("delivery_address", cell(row, "地址", "address", "delivery_address"));
        data.put("vmi_flag", 0);
        data.put("status", status);
        Map<String, Object> existing = repo.one("SELECT id FROM md_customer WHERE customer_code = :code", Map.of("code", code));
        if (existing == null) {
          repo.insert("md_customer", data, CUSTOMER_COLUMNS);
        } else {
          repo.updateById("md_customer", ((Number) existing.get("id")).longValue(), data, CUSTOMER_COLUMNS);
        }
        incrementSuccess(result);
      }
    }
    finishImportResult(result);
    return ApiResponse.ok(result);
  }

  private List<String> productTemplateHeaders() {
    return List.of("货主编码", "货主名称", "产品编码", "产品名称（中文）", "产品名称（英文）", "产品型号", "产品族", "产品类", "类别", "单位", "SN 管理", "电池类", "安全库存", "库龄阈值", "状态");
  }

  private List<String> customerTemplateHeaders() {
    return List.of("编码", "名称", "类型", "国家", "地区", "联系人", "联系电话", "地址", "状态");
  }

  private Map<String, Object> productParams(
      String productCode,
      String productName,
      String ownerCode,
      String keyword,
      String category,
      String productFamily,
      String productClass,
      String snManaged,
      String status
  ) {
    Map<String, Object> params = new HashMap<>();
    params.put("productCode", repo.like(productCode));
    params.put("productName", repo.like(productName));
    params.put("ownerCode", repo.like(ownerCode));
    params.put("keyword", repo.like(keyword));
    params.put("category", repo.like(category));
    params.put("productFamily", repo.like(productFamily));
    params.put("productClass", repo.like(productClass));
    params.put("snManaged", repo.integerOrNull(snManaged));
    params.put("status", repo.like(status));
    return params;
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
      if (check.get(0) == null || check.get(0).isBlank()) {
        return check.get(1);
      }
    }
    return null;
  }

  private String cell(Map<String, Object> row, String... keys) {
    for (String key : keys) {
      Object value = row.get(key);
      if (value != null && !String.valueOf(value).trim().isBlank()) {
        return String.valueOf(value).trim();
      }
    }
    return "";
  }

  private String value(Map<String, Object> row, String key) {
    Object value = row.get(key);
    return value == null ? "" : String.valueOf(value);
  }

  private int intValue(String value, int fallback) {
    if (value == null || value.isBlank()) {
      return fallback;
    }
    try {
      return Integer.parseInt(value);
    } catch (NumberFormatException ex) {
      return fallback;
    }
  }

  private Integer parseYesNo(String value) {
    String text = value == null ? "" : value.trim();
    if (List.of("是", "Y", "YES", "true", "1", "启用").contains(text) || List.of("Y", "YES", "TRUE").contains(text.toUpperCase())) {
      return 1;
    }
    if (List.of("否", "N", "NO", "false", "0", "停用").contains(text) || List.of("N", "NO", "FALSE").contains(text.toUpperCase())) {
      return 0;
    }
    return null;
  }

  private String parseStatus(String value) {
    String text = value == null ? "" : value.trim();
    if ("启用".equals(text) || "ACTIVE".equalsIgnoreCase(text)) {
      return "ACTIVE";
    }
    if ("停用".equals(text) || "DISABLED".equalsIgnoreCase(text) || "INACTIVE".equalsIgnoreCase(text)) {
      return "DISABLED";
    }
    return "";
  }

  private String statusName(String value) {
    return switch (value == null ? "" : value) {
      case "ACTIVE" -> "启用";
      case "DISABLED" -> "停用";
      default -> value == null ? "" : value;
    };
  }

  private String yesNo(Object value) {
    if (value instanceof Boolean bool) {
      return bool ? "是" : "否";
    }
    if (value instanceof Number number) {
      return number.intValue() == 1 ? "是" : "否";
    }
    return "1".equals(String.valueOf(value)) ? "是" : "否";
  }

  private String parseCustomerType(String value) {
    String text = value == null ? "" : value.trim();
    return switch (text.toUpperCase()) {
      case "CUSTOMER" -> "CUSTOMER";
      case "SUPPLIER" -> "SUPPLIER";
      case "OWNER" -> "OWNER";
      default -> switch (text) {
        case "客户" -> "CUSTOMER";
        case "供应商" -> "SUPPLIER";
        case "货主" -> "OWNER";
        default -> "";
      };
    };
  }

  private String customerTypeName(String value) {
    return switch (value == null ? "" : value) {
      case "CUSTOMER" -> "客户";
      case "SUPPLIER" -> "供应商";
      case "OWNER" -> "货主";
      default -> value == null ? "" : value;
    };
  }

  private String joinCountryRegion(String country, String region, String fallback) {
    if ((country == null || country.isBlank()) && (region == null || region.isBlank())) {
      return fallback == null ? "" : fallback;
    }
    if (region == null || region.isBlank()) {
      return country;
    }
    return country + "/" + region;
  }

  private String[] splitCountryRegion(String value) {
    String[] parts = (value == null ? "" : value).split("[/-]", 2);
    return new String[] { parts.length > 0 ? parts[0] : "", parts.length > 1 ? parts[1] : "" };
  }

  private void validateProductUnique(Long id, Map<String, Object> body) {
    Object productCode = body.get("product_code");
    Object ownerCode = body.get("owner_code");
    if (productCode == null || String.valueOf(productCode).isBlank()) {
      return;
    }
    Map<String, Object> params = new HashMap<>();
    params.put("id", id == null ? -1 : id);
    params.put("productCode", productCode);
    params.put("ownerCode", ownerCode);
    Number count = repo.number("""
        SELECT COUNT(*)
        FROM md_product
        WHERE product_code = :productCode
          AND COALESCE(owner_code, '') = COALESCE(:ownerCode, '')
          AND id <> :id
        """, params);
    if (count.intValue() > 0) {
      throw new IllegalArgumentException("同一货主下产品编码不能重复");
    }
  }
}
