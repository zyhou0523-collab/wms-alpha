package com.company.wms.inbound.dto;

import java.util.List;

public record CreateProductionInboundRequest(
    String orderNo,
    String sapWorkOrderNo,
    String mesWorkOrderNo,
    String productCode,
    String warehouseCode,
    Integer plannedQty,
    String remark,
    String inboundType,
    String sourceSystem,
    String sourceOrderNo,
    String planArrivalDate,
    String shipFromCountry,
    String sapPlant,
    String ownerCode,
    String ownerName,
    String supplierCode,
    String customerCode,
    List<Line> lines
) {
  public record Line(
      Integer lineNo,
      Long productId,
      String productCode,
      String productName,
      Integer plannedQty,
      String sapPlant,
      String sapStorageLocation,
      Boolean snRequired,
      String batchNo,
      String qualityStatus
  ) {
  }
}
