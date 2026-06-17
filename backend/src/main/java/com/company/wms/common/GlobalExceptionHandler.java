package com.company.wms.common;

import org.springframework.dao.DataAccessException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(IllegalArgumentException.class)
  public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
    return ApiResponse.fail(ex.getMessage());
  }

  @ExceptionHandler(DataAccessException.class)
  public ApiResponse<Void> handleDataAccess(DataAccessException ex) {
    return ApiResponse.fail("数据库操作失败: " + ex.getMostSpecificCause().getMessage());
  }

  @ExceptionHandler(Exception.class)
  public ApiResponse<Void> handleException(Exception ex) {
    return ApiResponse.fail("系统异常: " + ex.getMessage());
  }
}

