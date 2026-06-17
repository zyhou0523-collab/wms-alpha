package com.company.wms.inbound.dto;

public record SapPostRequest(
    Boolean forceFail,
    String operator
) {
}

