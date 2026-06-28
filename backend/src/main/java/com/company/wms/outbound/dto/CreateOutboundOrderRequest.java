package com.company.wms.outbound.dto;

public record CreateOutboundOrderRequest(
    String outboundOrderNo,
    String sourceOrderNo,
    String sourceSystem,
    String outboundType,
    String warehouseCode,
    String targetWarehouseCode,
    String customerCode,
    String productCode,
    Integer qty,
    String remark,
    String operator
) {
}
