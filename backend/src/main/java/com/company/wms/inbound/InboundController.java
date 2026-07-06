package com.company.wms.inbound;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import com.company.wms.inbound.dto.BindPackageRequest;
import com.company.wms.inbound.dto.CancelSnCollectionRequest;
import com.company.wms.inbound.dto.CreateProductionInboundRequest;
import com.company.wms.inbound.dto.PutawayRequest;
import com.company.wms.inbound.dto.ReceiveSnRequest;
import com.company.wms.inbound.dto.SapPostRequest;
import com.company.wms.inbound.dto.SnCollectionRequest;
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
public class InboundController {
  private final InboundService service;

  public InboundController(InboundService service) {
    this.service = service;
  }

  @GetMapping("/api/inbound/production-orders")
  public ApiResponse<PageResult<Map<String, Object>>> productionOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String mesWorkOrderNo,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(service.productionOrders(orderNo, sourceOrderNo, mesWorkOrderNo, warehouseCode, status, pageNum, pageSize));
  }

  @PostMapping({"/api/inbound/production-orders", "/api/inbound-orders"})
  public ApiResponse<Map<String, Object>> create(@RequestBody CreateProductionInboundRequest request) {
    return ApiResponse.ok(service.create(request));
  }

  @PutMapping({"/api/inbound/production-orders/{id}", "/api/inbound-orders/{id}"})
  public ApiResponse<Map<String, Object>> update(@PathVariable long id, @RequestBody CreateProductionInboundRequest request) {
    return ApiResponse.ok(service.update(id, request));
  }

  @GetMapping({"/api/inbound/production-orders/{id}", "/api/inbound-orders/{id}", "/api/inbound/arrival-notices/{id}"})
  public ApiResponse<Map<String, Object>> detail(@PathVariable long id) {
    return ApiResponse.ok(service.detail(id));
  }

  @PostMapping({"/api/inbound/production-orders/{id}/receive", "/api/inbound-orders/{id}/receive", "/api/inbound/arrival-notices/{id}/receive"})
  public ApiResponse<Map<String, Object>> receive(@PathVariable long id, @RequestBody ReceiveSnRequest request) {
    return ApiResponse.ok(service.receive(id, request));
  }

  @PostMapping({"/api/inbound-orders/{id}/cancel", "/api/inbound/arrival-notices/{id}/cancel"})
  public ApiResponse<Map<String, Object>> cancel(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancel(id, body == null ? Map.of() : body));
  }

  @PostMapping({"/api/inbound-orders/{id}/close", "/api/inbound/arrival-notices/{id}/close"})
  public ApiResponse<Map<String, Object>> close(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.close(id, body == null ? Map.of() : body));
  }

  @PostMapping({"/api/inbound-orders/{id}/receipts/{receiptId}/cancel", "/api/inbound/arrival-notices/{id}/receipts/{receiptId}/cancel"})
  public ApiResponse<Map<String, Object>> cancelReceipt(
      @PathVariable long id,
      @PathVariable long receiptId,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    return ApiResponse.ok(service.cancelReceipt(id, receiptId, body == null ? Map.of() : body));
  }

  @PostMapping({"/api/inbound/production-orders/{id}/bind-package", "/api/inbound-orders/{id}/bind-package", "/api/inbound/arrival-notices/{id}/bind-package"})
  public ApiResponse<Map<String, Object>> bindPackage(@PathVariable long id, @RequestBody BindPackageRequest request) {
    return ApiResponse.ok(service.bindPackage(id, request));
  }

  @GetMapping("/api/inbound-orders/{orderId}/sn-collect-context")
  public ApiResponse<Map<String, Object>> orderSnCollectContext(@PathVariable long orderId) {
    return ApiResponse.ok(service.orderSnCollectContext(orderId));
  }

  @GetMapping("/api/inbound-orders/{orderId}/lines/{lineId}/sn-collect-context")
  public ApiResponse<Map<String, Object>> snCollectContext(@PathVariable long orderId, @PathVariable long lineId) {
    return ApiResponse.ok(service.snCollectContext(orderId, lineId));
  }

  @GetMapping("/api/inbound-orders/{orderId}/lines/{lineId}/collected-sns")
  public ApiResponse<List<Map<String, Object>>> collectedSns(@PathVariable long orderId, @PathVariable long lineId) {
    return ApiResponse.ok(service.collectedSns(orderId, lineId));
  }

  @PostMapping("/api/inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection")
  public ApiResponse<Map<String, Object>> validateSnCollection(
      @PathVariable long orderId,
      @PathVariable long lineId,
      @RequestBody SnCollectionRequest request
  ) {
    return ApiResponse.ok(service.validateSnCollection(orderId, lineId, request));
  }

  @PostMapping("/api/inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection")
  public ApiResponse<Map<String, Object>> confirmSnCollection(
      @PathVariable long orderId,
      @PathVariable long lineId,
      @RequestBody SnCollectionRequest request
  ) {
    return ApiResponse.ok(service.confirmSnCollection(orderId, lineId, request));
  }

  @PostMapping("/api/inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection")
  public ApiResponse<Map<String, Object>> cancelSnCollection(
      @PathVariable long orderId,
      @PathVariable long lineId,
      @RequestBody CancelSnCollectionRequest request
  ) {
    return ApiResponse.ok(service.cancelSnCollection(orderId, lineId, request));
  }

  @PostMapping("/api/inbound/production-orders/{id}/putaway")
  public ApiResponse<Map<String, Object>> putaway(@PathVariable long id, @RequestBody PutawayRequest request) {
    return ApiResponse.ok(service.putaway(id, request));
  }

  @PostMapping({"/api/inbound/production-orders/{id}/sap-post", "/api/inbound-orders/{id}/sap-post", "/api/inbound-orders/{id}/post-sap", "/api/inbound/arrival-notices/{id}/sap-post"})
  public ApiResponse<Map<String, Object>> sapPost(@PathVariable long id, @RequestBody SapPostRequest request) {
    return ApiResponse.ok(service.sapPost(id, request));
  }

  @PostMapping("/api/inbound-orders/retry-sap")
  public ApiResponse<Map<String, Object>> retrySap(@RequestBody Map<String, Object> body) {
    @SuppressWarnings("unchecked")
    List<Number> numbers = (List<Number>) body.getOrDefault("orderIds", List.of());
    return ApiResponse.ok(service.retrySap(numbers.stream().map(Number::longValue).toList()));
  }

  @GetMapping("/api/inbound-orders/import-template")
  public ApiResponse<Map<String, Object>> importTemplate() {
    return ApiResponse.ok(service.importTemplate());
  }

  @PostMapping("/api/inbound-orders/import")
  public ApiResponse<Map<String, Object>> importInboundOrders(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.importInboundOrders(body));
  }

  @PostMapping("/api/inbound-orders/export")
  public ApiResponse<Map<String, Object>> exportInboundOrders(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.exportInboundOrders(body));
  }

  @GetMapping("/api/inbound/sn-bindings/export")
  public ApiResponse<Map<String, Object>> exportSnBindings(
      @RequestParam(required = false) String palletCode,
      @RequestParam(required = false) String asnNo,
      @RequestParam(required = false) String boxCode,
      @RequestParam(required = false) String snCode
  ) {
    return ApiResponse.ok(service.exportSnBindings(palletCode, asnNo, boxCode, snCode));
  }

  @DeleteMapping("/api/inbound/sn-bindings/{id}")
  public ApiResponse<String> deleteBinding(@PathVariable long id) {
    service.deleteBinding(id, "wh_admin");
    return ApiResponse.ok("deleted");
  }

  @PostMapping("/api/inbound/sn-bindings/bulk-delete")
  public ApiResponse<String> deleteBindings(@RequestBody Map<String, Object> body) {
    @SuppressWarnings("unchecked")
    List<Number> numbers = (List<Number>) body.getOrDefault("ids", List.of());
    service.deleteBindings(numbers.stream().map(Number::longValue).toList(), "wh_admin");
    return ApiResponse.ok("deleted");
  }
}
