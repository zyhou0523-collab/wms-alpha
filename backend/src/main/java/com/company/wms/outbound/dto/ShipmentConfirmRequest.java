package com.company.wms.outbound.dto;

public record ShipmentConfirmRequest(
    String carrier,
    String trackingNo,
    String shipTime,
    String shipper,
    String remark,
    Boolean forceTraceFail,
    Boolean forceSapFail,
    String operator
) {
}
