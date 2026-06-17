package com.company.wms.inbound.dto;

import java.util.List;

public record BindPackageRequest(
    String palletCode,
    String boxCode,
    List<String> serialNumbers,
    String operator
) {
}

