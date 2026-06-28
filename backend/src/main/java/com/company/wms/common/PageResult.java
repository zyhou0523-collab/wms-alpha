package com.company.wms.common;

import java.util.List;

public record PageResult<T>(List<T> items, long total, int pageNum, int pageSize) {
}

