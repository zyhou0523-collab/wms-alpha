package com.company.wms.inbound.dto;

import java.util.List;

public record ReceiveSnRequest(
    List<Line> lines,
    List<String> serialNumbers,
    String locationCode,
    String operator
) {
  public record Line(
      Long lineId,
      Long productId,
      Integer receiveQty,
      List<String> receiveSnList
  ) {
  }
}
