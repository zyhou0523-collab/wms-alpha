package com.company.wms.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class WmsRepository {
  private final NamedParameterJdbcTemplate jdbc;
  private final ObjectMapper objectMapper;

  public WmsRepository(NamedParameterJdbcTemplate jdbc, ObjectMapper objectMapper) {
    this.jdbc = jdbc;
    this.objectMapper = objectMapper;
  }

  public List<Map<String, Object>> query(String sql, Map<String, ?> params) {
    return jdbc.queryForList(sql, params == null ? Map.of() : params);
  }

  public Map<String, Object> one(String sql, Map<String, ?> params) {
    try {
      return jdbc.queryForMap(sql, params == null ? Map.of() : params);
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  public Number number(String sql, Map<String, ?> params) {
    Number value = jdbc.queryForObject(sql, params == null ? Map.of() : params, Number.class);
    return value == null ? 0 : value;
  }

  public PageResult<Map<String, Object>> page(
      String selectSql,
      String countSql,
      Map<String, Object> params,
      int pageNum,
      int pageSize
  ) {
    int safePageNum = Math.max(pageNum, 1);
    int safePageSize = Math.min(Math.max(pageSize, 1), 100);
    Map<String, Object> pageParams = new HashMap<>(params);
    pageParams.put("limit", safePageSize);
    pageParams.put("offset", (safePageNum - 1) * safePageSize);

    long total = number(countSql, params).longValue();
    List<Map<String, Object>> items = jdbc.queryForList(selectSql + " LIMIT :limit OFFSET :offset", pageParams);
    return new PageResult<>(items, total, safePageNum, safePageSize);
  }

  public int insert(String table, Map<String, Object> body, List<String> columns) {
    StringJoiner names = new StringJoiner(", ");
    StringJoiner values = new StringJoiner(", ");
    MapSqlParameterSource params = new MapSqlParameterSource();
    for (String column : columns) {
      if (body.containsKey(column)) {
        names.add(column);
        values.add(":" + column);
        params.addValue(column, body.get(column));
      }
    }
    if (names.length() == 0) {
      return 0;
    }
    return jdbc.update("INSERT INTO " + table + " (" + names + ") VALUES (" + values + ")", params);
  }

  public int updateById(String table, long id, Map<String, Object> body, List<String> columns) {
    StringJoiner sets = new StringJoiner(", ");
    MapSqlParameterSource params = new MapSqlParameterSource().addValue("id", id);
    for (String column : columns) {
      if (body.containsKey(column)) {
        sets.add(column + " = :" + column);
        params.addValue(column, body.get(column));
      }
    }
    if (sets.length() == 0) {
      return 0;
    }
    return jdbc.update("UPDATE " + table + " SET " + sets + " WHERE id = :id", params);
  }

  public int deleteById(String table, long id) {
    return jdbc.update("DELETE FROM " + table + " WHERE id = :id", Map.of("id", id));
  }

  public String like(String value) {
    return value == null || value.isBlank() ? null : "%" + value.trim() + "%";
  }

  public Integer integerOrNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    if ("true".equalsIgnoreCase(value)) {
      return 1;
    }
    if ("false".equalsIgnoreCase(value)) {
      return 0;
    }
    return Integer.valueOf(value);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void interfaceLog(
      String interfaceName,
      String sourceSystem,
      String targetSystem,
      String businessDocNo,
      String requestUrl,
      Object requestBody,
      Object responseBody,
      String status,
      String errorMessage
  ) {
    String sql = """
        INSERT INTO wms_interface_log (
          interface_name, source_system, target_system, business_doc_no,
          http_method, request_url, request_body, response_body, status, retry_count, error_message
        ) VALUES (
          :interfaceName, :sourceSystem, :targetSystem, :businessDocNo,
          'POST', :requestUrl, :requestBody, :responseBody, :status, :retryCount, :errorMessage
        )
        """;
    Map<String, Object> params = new HashMap<>();
    params.put("interfaceName", interfaceName);
    params.put("sourceSystem", sourceSystem);
    params.put("targetSystem", targetSystem);
    params.put("businessDocNo", businessDocNo);
    params.put("requestUrl", requestUrl);
    params.put("requestBody", json(requestBody));
    params.put("responseBody", json(responseBody));
    params.put("status", status);
    params.put("retryCount", "FAILED".equals(status) ? 1 : 0);
    params.put("errorMessage", errorMessage);
    jdbc.update(sql, params);
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void operationLog(
      String module,
      String businessDocNo,
      String action,
      String operator,
      String result,
      String message
  ) {
    jdbc.update("""
        INSERT INTO wms_operation_log (module, business_doc_no, action, operator, result, message)
        VALUES (:module, :businessDocNo, :action, :operator, :result, :message)
        """, Map.of(
        "module", module,
        "businessDocNo", businessDocNo == null ? "" : businessDocNo,
        "action", action,
        "operator", operator == null ? "admin" : operator,
        "result", result,
        "message", message == null ? "" : message
    ));
  }

  private String json(Object value) {
    try {
      return objectMapper.writeValueAsString(value == null ? Map.of() : value);
    } catch (JsonProcessingException ex) {
      return "{}";
    }
  }
}
