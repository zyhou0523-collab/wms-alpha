package com.company.wms.outbound.dto;

import java.util.List;

public record ScanSnRequest(
    String snCode,
    List<String> serialNumbers,
    String operator
) {
}
