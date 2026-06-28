package com.company.wms.inbound.dto;

import java.util.List;

public record CancelSnCollectionRequest(
    List<String> serialNumbers,
    String operator
) {
}
