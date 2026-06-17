package com.company.wms.mock;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.WmsRepository;
import com.company.wms.inbound.InboundService;
import com.company.wms.outbound.OutboundService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mock")
public class MockController {
  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;
  private final InboundService inboundService;
  private final OutboundService outboundService;

  public MockController(WmsRepository repo, NamedParameterJdbcTemplate jdbc, InboundService inboundService, OutboundService outboundService) {
    this.repo = repo;
    this.jdbc = jdbc;
    this.inboundService = inboundService;
    this.outboundService = outboundService;
  }

  @PostMapping("/mes/sn-push")
  public ApiResponse<Map<String, Object>> mesSnPush(@RequestBody Map<String, Object> body) {
    String productCode = String.valueOf(body.getOrDefault("productCode", "GT3-30KD1R11001"));
    String mesWorkOrderNo = String.valueOf(body.getOrDefault("mesWorkOrderNo", body.getOrDefault("workOrderNo", "MES-MO-202606110001")));
    int qty = intValue(body.get("qty"), 10);
    Map<String, Object> product = repo.one("SELECT id FROM md_product WHERE product_code = :productCode", Map.of("productCode", productCode));
    if (product == null) {
      repo.interfaceLog("MES_SN_PUSH", "MES", "WMS", mesWorkOrderNo,
          "/api/mock/mes/sn-push", body, Map.of("code", 1, "message", "产品不存在"), "FAILED", "产品不存在: " + productCode);
      return ApiResponse.fail("产品不存在: " + productCode);
    }
    long productId = ((Number) product.get("id")).longValue();
    String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    List<String> serialNumbers = serialNumbers(body.get("serialNumbers"), qty, stamp);
    for (String sn : serialNumbers) {
      jdbc.update("""
          INSERT INTO wms_serial_number (sn_code, product_id, mes_work_order_no, status)
          VALUES (:snCode, :productId, :mesWorkOrderNo, 'ISSUED')
          ON DUPLICATE KEY UPDATE
            product_id = VALUES(product_id),
            mes_work_order_no = VALUES(mes_work_order_no),
            status = IF(status IN ('ISSUED', 'INBOUND'), status, VALUES(status))
          """, Map.of("snCode", sn, "productId", productId, "mesWorkOrderNo", mesWorkOrderNo));
    }
    Map<String, Object> response = Map.of(
        "issuedCount", serialNumbers.size(),
        "productCode", productCode,
        "mesWorkOrderNo", mesWorkOrderNo,
        "serialNumbers", serialNumbers,
        "status", "ISSUED"
    );
    repo.interfaceLog("MES_SN_PUSH", "MES", "WMS", mesWorkOrderNo,
        "/api/mock/mes/sn-push", body, response, "SUCCESS", null);
    return ApiResponse.ok(response);
  }

  @PostMapping("/sap/production-orders")
  public ApiResponse<Map<String, Object>> sapProductionOrder(@RequestBody Map<String, Object> body) {
    try {
      return ApiResponse.ok(inboundService.createFromSapMock(body));
    } catch (IllegalArgumentException ex) {
      repo.interfaceLog("SAP_PRODUCTION_ORDER_PUSH", "SAP", "WMS", String.valueOf(body.getOrDefault("sapWorkOrderNo", "")),
          "/api/mock/sap/production-orders", body, Map.of("code", 1, "message", ex.getMessage()), "FAILED", ex.getMessage());
      return ApiResponse.fail(ex.getMessage());
    }
  }

  @PostMapping("/fulfillment/outbound-orders")
  public ApiResponse<Map<String, Object>> fulfillmentOrder(@RequestBody Map<String, Object> body) {
    try {
      return ApiResponse.ok(outboundService.createFromFulfillmentMock(body));
    } catch (IllegalArgumentException ex) {
      repo.interfaceLog("FULFILLMENT_ORDER_PUSH", "FULFILLMENT", "WMS", String.valueOf(body.getOrDefault("outboundOrderNo", "")),
          "/api/mock/fulfillment/outbound-orders", body, Map.of("code", 1, "message", ex.getMessage()), "FAILED", ex.getMessage());
      return ApiResponse.fail(ex.getMessage());
    }
  }

  @PostMapping("/trace/outbound-sn")
  public ApiResponse<Map<String, Object>> traceOutboundSn(@RequestBody Map<String, Object> body) {
    Object serials = body.get("serialNumbers");
    if (serials instanceof List<?> list) {
      for (Object sn : list) {
        jdbc.update("UPDATE wms_serial_number SET sold_flag = 1, market_flag = 1 WHERE sn_code = :sn",
            Map.of("sn", String.valueOf(sn)));
      }
    }
    String docNo = String.valueOf(body.getOrDefault("outboundOrderNo", ""));
    Map<String, Object> response = Map.of("traceStatus", "RECEIVED", "receivedCount", serials instanceof List<?> list ? list.size() : 0);
    repo.interfaceLog("TRACE_OUTBOUND_SN", "WMS", "TRACE", docNo,
        "/api/mock/trace/outbound-sn", body, response, "SUCCESS", null);
    return ApiResponse.ok(response);
  }

  @PostMapping("/sap/material-documents")
  public ApiResponse<Map<String, Object>> sapPosting(@RequestBody Map<String, Object> body) {
    String docNo = String.valueOf(body.getOrDefault("businessDocNo", ""));
    Map<String, Object> response = new HashMap<>();
    response.put("sapMaterialDocNo", "4900000001");
    response.put("postingStatus", "POSTED");
    repo.interfaceLog("SAP_POSTING", "WMS", "SAP", docNo,
        "/api/mock/sap/material-documents", body, response, "SUCCESS", null);
    return ApiResponse.ok(response);
  }

  @PostMapping("/crm/customers")
  public ApiResponse<Map<String, Object>> crmCustomerSync(@RequestBody Map<String, Object> body) {
    Map<String, Object> response = Map.of("syncStatus", "RECEIVED");
    repo.interfaceLog("CRM_CUSTOMER_SYNC", "CRM", "WMS", String.valueOf(body.getOrDefault("customerCode", "")),
        "/api/mock/crm/customers", body, response, "SUCCESS", null);
    return ApiResponse.ok(response);
  }

  private int intValue(Object value, int defaultValue) {
    if (value == null) {
      return defaultValue;
    }
    if (value instanceof Number number) {
      return number.intValue();
    }
    return Integer.parseInt(String.valueOf(value));
  }

  private List<String> serialNumbers(Object value, int qty, String stamp) {
    if (value instanceof List<?> list && !list.isEmpty()) {
      return list.stream().map(String::valueOf).toList();
    }
    List<String> serials = new ArrayList<>();
    for (int i = 1; i <= qty; i++) {
      serials.add("SN-MES-" + stamp + "-" + String.format("%04d", i));
    }
    return serials;
  }
}
