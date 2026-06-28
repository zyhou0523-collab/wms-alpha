package com.company.wms.inbound.dto;

import java.util.List;

public record PutawayRequest(
    String locationCode,
    String palletCode,
    List<String> serialNumbers,
    String operator
) {
}

