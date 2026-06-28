package com.company.wms.inbound.dto;

import java.util.List;

public record SnCollectionRequest(
    Long orderId,
    Long lineId,
    Long productId,
    String palletCode,
    String boxCode,
    List<String> serialNumbers,
    String operator
) {
}
