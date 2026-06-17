package com.company.wms.common;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;

public final class CsvExport {
  private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

  private CsvExport() {
  }

  public static Map<String, Object> file(String filename, String content) {
    return Map.of(
        "filename", filename,
        "content", content,
        "mimeType", "text/csv;charset=utf-8"
    );
  }

  public static String timestamp() {
    return LocalDateTime.now().format(TS);
  }

  public static String csv(List<String> headers, List<List<?>> rows) {
    StringJoiner lines = new StringJoiner("\n");
    lines.add(row(headers));
    for (List<?> item : rows) {
      lines.add(row(item));
    }
    return lines.toString();
  }

  private static String row(List<?> cells) {
    StringJoiner joiner = new StringJoiner(",");
    for (Object cell : cells) {
      joiner.add(escape(cell));
    }
    return joiner.toString();
  }

  private static String escape(Object value) {
    String text = value == null ? "" : String.valueOf(value);
    if (text.contains("\"") || text.contains(",") || text.contains("\n") || text.contains("\r")) {
      return "\"" + text.replace("\"", "\"\"") + "\"";
    }
    return text;
  }
}
