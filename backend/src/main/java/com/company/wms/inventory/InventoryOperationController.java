package com.company.wms.inventory;

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
public class InventoryOperationController {
  private final InventoryOperationService service;

  public InventoryOperationController(InventoryOperationService service) {
    this.service = service;
  }

  @GetMapping("/api/inventory/count-orders")
  public ApiResponse<PageResult<Map<String, Object>>> countOrders(@RequestParam Map<String, Object> params) {
    return ApiResponse.ok(service.countOrders(params));
  }

  @GetMapping("/api/inventory/count-orders/{id}")
  public ApiResponse<Map<String, Object>> countDetail(@PathVariable long id) {
    return ApiResponse.ok(service.countDetail(id));
  }

  @PostMapping("/api/inventory/count-orders")
  public ApiResponse<Map<String, Object>> createCountOrder(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.createCountOrder(body));
  }

  @PostMapping("/api/inventory/count-orders/{id}/generate-lines")
  public ApiResponse<Map<String, Object>> generateCountLines(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.generateCountLines(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/inventory/count-orders/{id}/record")
  public ApiResponse<Map<String, Object>> recordCount(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.recordCount(id, body));
  }

  @PostMapping("/api/inventory/count-orders/{id}/confirm-difference")
  public ApiResponse<Map<String, Object>> confirmCountDifference(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.confirmCountDifference(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/inventory/count-orders/{id}/adjust")
  public ApiResponse<Map<String, Object>> adjustCount(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.adjustCount(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/inventory/count-orders/{id}/cancel")
  public ApiResponse<Map<String, Object>> cancelCount(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancelCount(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/inventory/move-orders")
  public ApiResponse<PageResult<Map<String, Object>>> moveOrders(@RequestParam Map<String, Object> params) {
    return ApiResponse.ok(service.moveOrders(params));
  }

  @GetMapping("/api/inventory/move-orders/{id}")
  public ApiResponse<Map<String, Object>> moveDetail(@PathVariable long id) {
    return ApiResponse.ok(service.moveDetail(id));
  }

  @PostMapping("/api/inventory/move-orders")
  public ApiResponse<Map<String, Object>> createMoveOrder(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(service.createMoveOrder(body));
  }

  @PostMapping("/api/inventory/move-orders/{id}/confirm")
  public ApiResponse<Map<String, Object>> confirmMove(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.confirmMove(id, body == null ? Map.of() : body));
  }

  @PostMapping("/api/inventory/move-orders/{id}/cancel")
  public ApiResponse<Map<String, Object>> cancelMove(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    return ApiResponse.ok(service.cancelMove(id, body == null ? Map.of() : body));
  }

  @GetMapping("/api/inventory/move-orders/stock-candidates")
  public ApiResponse<Map<String, Object>> stockCandidates(@RequestParam Map<String, Object> params) {
    return ApiResponse.ok(service.stockCandidates(params));
  }

  @GetMapping("/api/inventory/transactions")
  public ApiResponse<PageResult<Map<String, Object>>> transactions(@RequestParam Map<String, Object> params) {
    return ApiResponse.ok(service.transactions(params));
  }
}
