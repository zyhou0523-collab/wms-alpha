package com.company.wms.outbound;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import com.company.wms.outbound.dto.CreateOutboundOrderRequest;
import com.company.wms.outbound.dto.ManualAllocationRequest;
import com.company.wms.outbound.dto.OutboundExceptionRequest;
import com.company.wms.outbound.dto.ScanSnRequest;
import com.company.wms.outbound.dto.ShipmentConfirmRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OutboundController {
  private final OutboundService service;

  public OutboundController(OutboundService service) {
    this.service = service;
  }

  @GetMapping("/api/outbound/shipping-orders")
  public ApiResponse<PageResult<Map<String, Object>>> shippingOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String outboundType,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String customerCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(service.orders(outboundType, orderNo, sourceOrderNo, warehouseCode, customerCode, status, pageNum, pageSize));
  }

  @GetMapping("/api/outbound/sales-orders")
  public ApiResponse<PageResult<Map<String, Object>>> salesOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String customerCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(service.orders("SALES", orderNo, sourceOrderNo, warehouseCode, customerCode, status, pageNum, pageSize));
  }

  @GetMapping("/api/outbound/transfer-orders")
  public ApiResponse<PageResult<Map<String, Object>>> transferOrders(
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String sourceOrderNo,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(service.orders("TRANSFER", orderNo, sourceOrderNo, warehouseCode, null, status, pageNum, pageSize));
  }

  @PostMapping("/api/outbound/sales-orders/mock")
  public ApiResponse<Map<String, Object>> createSalesMock(@RequestBody CreateOutboundOrderRequest request) {
    return ApiResponse.ok(service.create(request, "SALES"));
  }

  @PostMapping("/api/outbound/transfer-orders/mock")
  public ApiResponse<Map<String, Object>> createTransferMock(@RequestBody CreateOutboundOrderRequest request) {
    return ApiResponse.ok(service.create(request, "TRANSFER"));
  }

  @PostMapping("/api/outbound/shipping-orders/mock")
  public ApiResponse<Map<String, Object>> createShippingMock(@RequestBody CreateOutboundOrderRequest request) {
    return ApiResponse.ok(service.create(request, "SALES"));
  }

  @GetMapping("/api/outbound/orders/{id}")
  public ApiResponse<Map<String, Object>> detail(@PathVariable long id) {
    return ApiResponse.ok(service.detail(id));
  }

  @PostMapping("/api/outbound/orders/{id}/allocate-auto")
  public ApiResponse<Map<String, Object>> allocateAuto(@PathVariable long id, @RequestBody(required = false) ManualAllocationRequest request) {
    return ApiResponse.ok(service.allocateAuto(id, request == null ? null : request.operator()));
  }

  @PostMapping("/api/outbound/orders/{id}/allocate-manual")
  public ApiResponse<Map<String, Object>> allocateManual(@PathVariable long id, @RequestBody ManualAllocationRequest request) {
    return ApiResponse.ok(service.allocateManual(id, request));
  }

  @PostMapping("/api/outbound/orders/{id}/cancel-allocation")
  public ApiResponse<Map<String, Object>> cancelAllocation(@PathVariable long id, @RequestBody(required = false) ManualAllocationRequest request) {
    return ApiResponse.ok(service.cancelAllocation(id, request == null ? null : request.operator()));
  }

  @GetMapping("/api/outbound/orders/{id}/allocations")
  public ApiResponse<Map<String, Object>> allocations(@PathVariable long id) {
    return ApiResponse.ok(service.allocationView(id));
  }

  @PostMapping("/api/outbound/orders/{id}/picking-tasks")
  public ApiResponse<Map<String, Object>> generatePickingTasks(@PathVariable long id, @RequestBody(required = false) ScanSnRequest request) {
    return ApiResponse.ok(service.generatePickingTasks(id, request == null ? null : request.operator()));
  }

  @GetMapping("/api/outbound/picking-tasks")
  public ApiResponse<PageResult<Map<String, Object>>> pickingTasks(
      @RequestParam(required = false) String taskNo,
      @RequestParam(required = false) String orderNo,
      @RequestParam(required = false) String warehouseCode,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(service.pickingTasks(taskNo, orderNo, warehouseCode, status, pageNum, pageSize));
  }

  @PostMapping("/api/outbound/picking-tasks/{id}/scan")
  public ApiResponse<Map<String, Object>> scanPicking(@PathVariable long id, @RequestBody ScanSnRequest request) {
    return ApiResponse.ok(service.scanPicking(id, request));
  }

  @PostMapping("/api/outbound/picking-tasks/{id}/exception")
  public ApiResponse<Map<String, Object>> pickingException(@PathVariable long id, @RequestBody OutboundExceptionRequest request) {
    return ApiResponse.ok(service.registerPickingException(id, request));
  }

  @PostMapping("/api/outbound/orders/{id}/review")
  public ApiResponse<Map<String, Object>> review(@PathVariable long id, @RequestBody ScanSnRequest request) {
    return ApiResponse.ok(service.review(id, request));
  }

  @PostMapping("/api/outbound/orders/{id}/ship")
  public ApiResponse<Map<String, Object>> ship(@PathVariable long id, @RequestBody ShipmentConfirmRequest request) {
    return ApiResponse.ok(service.ship(id, request));
  }

  @PostMapping("/api/outbound/orders/{id}/trace-callback")
  public ApiResponse<Map<String, Object>> traceCallback(@PathVariable long id, @RequestBody(required = false) ShipmentConfirmRequest request) {
    return ApiResponse.ok(service.traceCallback(id, request != null && Boolean.TRUE.equals(request.forceTraceFail()), request == null ? null : request.operator()));
  }

  @PostMapping("/api/outbound/orders/{id}/sap-callback")
  public ApiResponse<Map<String, Object>> sapCallback(@PathVariable long id, @RequestBody(required = false) ShipmentConfirmRequest request) {
    return ApiResponse.ok(service.sapCallback(id, request != null && Boolean.TRUE.equals(request.forceSapFail()), request == null ? null : request.operator()));
  }

  @GetMapping("/api/outbound/orders/{id}/interface-logs")
  public ApiResponse<Map<String, Object>> interfaceLogs(@PathVariable long id) {
    return ApiResponse.ok(service.interfaceLogs(id));
  }

  @GetMapping("/api/outbound/orders/{id}/status-flow")
  public ApiResponse<Map<String, Object>> statusFlow(@PathVariable long id) {
    return ApiResponse.ok(service.statusFlow(id));
  }
}
