package com.company.wms.outbound.dto;

public record OutboundExceptionRequest(
    String snCode,
    String exceptionType,
    String reason,
    String operator
) {
}
