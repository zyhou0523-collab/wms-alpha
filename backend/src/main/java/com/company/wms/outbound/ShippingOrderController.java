package com.company.wms.outbound;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ShippingOrderController {
  private final ShippingOrderService service;

  public ShippingOrderController(ShippingOrderService service) {
    this.service = service;
  }

  @GetMapping("/api/outbound-orders")
  public ApiResponse<PageResult<Map<String, Object>>> list(@RequestParam Map<String, Object> params) {
    return ApiResponse.ok(service.orders(params));
  }

  @GetMapping("/api/outbound-orders/{id}")
  public ApiResponse<Map<String, Object>> detail(@PathVariable long id) {
    return ApiResponse.ok(service.detail(id));
  }

  @PostMapping("/api/outbound-orders")
  public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.create(body));
  }

  @PostMapping("/api/outbound-orders/{id}/allocate-auto")
  public ApiResponse<Map<String, Object>> allocateAuto(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.allocateAuto(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/allocate-manual")
  public ApiResponse<Map<String, Object>> allocateManual(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.allocateManual(id, body));
  }

  @PostMapping("/api/outbound-orders/{id}/release-allocation")
  public ApiResponse<Map<String, Object>> releaseAllocation(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.releaseAllocation(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/allocations/cancel")
  public ApiResponse<Map<String, Object>> cancelAllocations(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancelAllocations(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/outbound-orders/{id}/allocation-candidates")
  public ApiResponse<Map<String, Object>> allocationCandidates(@PathVariable long id) {
    return ApiResponse.ok(service.allocationCandidates(id));
  }

  @GetMapping("/api/outbound-orders/{id}/allocations")
  public ApiResponse<Map<String, Object>> allocations(@PathVariable long id) {
    return ApiResponse.ok(service.allocationView(id));
  }

  @PostMapping("/api/outbound-orders/{id}/pick")
  public ApiResponse<Map<String, Object>> pick(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.pick(id, body));
  }

  @PostMapping("/api/outbound-orders/{id}/pick-scan")
  public ApiResponse<Map<String, Object>> pickScan(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.pick(id, body));
  }

  @PostMapping("/api/outbound-orders/{id}/picks/{pickId}/cancel")
  public ApiResponse<Map<String, Object>> cancelPick(
      @PathVariable long id,
      @PathVariable long pickId,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    return ApiResponse.ok(service.cancelPick(id, pickId, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/picks/cancel")
  public ApiResponse<Map<String, Object>> cancelPicks(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancelPicks(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/picking-tasks")
  public ApiResponse<Map<String, Object>> generatePicking(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.generatePicking(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/outbound-orders/{id}/pick-records")
  public ApiResponse<Map<String, Object>> pickRecords(@PathVariable long id) {
    return ApiResponse.ok(service.detail(id));
  }

  @PostMapping("/api/outbound-orders/{id}/ship")
  public ApiResponse<Map<String, Object>> ship(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.ship(id, body));
  }

  @PostMapping("/api/outbound-orders/{id}/shipments/{shipmentId}/cancel")
  public ApiResponse<Map<String, Object>> cancelShipment(
      @PathVariable long id,
      @PathVariable long shipmentId,
      @RequestBody(required = false) Map<String, Object> body
  ) {
    return ApiResponse.ok(service.cancelShipment(id, shipmentId, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/shipments/cancel")
  public ApiResponse<Map<String, Object>> cancelShipments(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancelShipments(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/outbound-orders/{id}/picking-list")
  public ApiResponse<Map<String, Object>> pickingList(@PathVariable long id) {
    return ApiResponse.ok(service.pickingList(id));
  }

  @GetMapping("/api/outbound-orders/{id}/shipments")
  public ApiResponse<Map<String, Object>> shipments(@PathVariable long id) {
    return ApiResponse.ok(service.detail(id));
  }

  @PostMapping("/api/outbound-orders/{id}/post-sap")
  public ApiResponse<Map<String, Object>> postSap(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.postSap(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/retry-sap")
  public ApiResponse<Map<String, Object>> retrySap(@RequestBody Map<String, Object> body) {
    Object id = body.get("orderId");
    if (id == null) {
      return ApiResponse.ok(Map.of("successCount", 0, "failedCount", 0));
    }
    return ApiResponse.ok(service.postSap(Long.parseLong(String.valueOf(id)), body));
  }

  @PostMapping("/api/outbound-orders/{id}/cancel")
  public ApiResponse<Map<String, Object>> cancel(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancel(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/outbound-orders/{id}/close")
  public ApiResponse<Map<String, Object>> close(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.close(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/outbound-orders/{id}/interface-logs")
  public ApiResponse<Map<String, Object>> interfaceLogs(@PathVariable long id) {
    return ApiResponse.ok(service.interfaceLogs(id));
  }

  @GetMapping("/api/outbound-orders/{id}/status-flow")
  public ApiResponse<Map<String, Object>> statusFlow(@PathVariable long id) {
    return ApiResponse.ok(service.statusFlow(id));
  }
}
