package com.company.wms.outbound.dto;

import java.util.List;

public record ManualAllocationRequest(
    List<String> serialNumbers,
    String operator
) {
}
