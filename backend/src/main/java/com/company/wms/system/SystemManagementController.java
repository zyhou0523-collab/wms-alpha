package com.company.wms.system;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.PageResult;
import com.company.wms.common.WmsRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemManagementController {
  private final WmsRepository repo;
  private final NamedParameterJdbcTemplate jdbc;

  private final Map<String, ResourceConfig> resources = new HashMap<>();

  public SystemManagementController(WmsRepository repo, NamedParameterJdbcTemplate jdbc) {
    this.repo = repo;
    this.jdbc = jdbc;
    initResources();
  }

  @PostMapping("/users")
  public ApiResponse<Map<String, Object>> createUser(@RequestBody Map<String, Object> body) {
    Map<String, Object> data = normalizeUser(body);
    repo.insert("sys_user", data, List.of(
        "username", "password_hash", "display_name", "nickname", "dept_id", "post_id",
        "mobile", "email", "role_code", "role_name", "warehouse_scope", "owner_scope",
        "default_warehouse_code", "default_owner_code", "remark", "status"
    ));
    Map<String, Object> row = lastRow("sys_user");
    syncUserRole(longValue(row.get("id"), 0), data.get("role_code"));
    repo.operationLog("SYSTEM", text(data.get("username")), "CREATE_USER", "admin", "SUCCESS", "Create system user");
    return ApiResponse.ok(row);
  }

  @PutMapping("/users/{id}")
  public ApiResponse<Map<String, Object>> updateUser(@PathVariable long id, @RequestBody Map<String, Object> body) {
    Map<String, Object> data = normalizeUser(body);
    repo.updateById("sys_user", id, data, List.of(
        "display_name", "nickname", "dept_id", "post_id", "mobile", "email",
        "role_code", "role_name", "warehouse_scope", "owner_scope",
        "default_warehouse_code", "default_owner_code", "remark", "status"
    ));
    syncUserRole(id, data.get("role_code"));
    repo.operationLog("SYSTEM", text(data.get("username")), "UPDATE_USER", "admin", "SUCCESS", "Update system user");
    return ApiResponse.ok(repo.one("SELECT * FROM sys_user WHERE id = :id", Map.of("id", id)));
  }

  @DeleteMapping("/users/{id}")
  public ApiResponse<String> deleteUser(@PathVariable long id) {
    jdbc.update("DELETE FROM sys_user_role WHERE user_id = :id", Map.of("id", id));
    jdbc.update("DELETE FROM sys_user_warehouse WHERE user_id = :id", Map.of("id", id));
    jdbc.update("DELETE FROM sys_user_owner WHERE user_id = :id", Map.of("id", id));
    repo.deleteById("sys_user", id);
    repo.operationLog("SYSTEM", String.valueOf(id), "DELETE_USER", "admin", "SUCCESS", "Delete system user");
    return ApiResponse.ok("ok");
  }

  @PostMapping("/users/{id}/reset-password")
  public ApiResponse<String> resetPassword(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
    String password = body == null ? "123456" : text(body.getOrDefault("password", "123456"));
    jdbc.update("UPDATE sys_user SET password_hash = :password WHERE id = :id", Map.of("id", id, "password", password));
    repo.operationLog("SYSTEM", String.valueOf(id), "RESET_PASSWORD", "admin", "SUCCESS", "Reset user password");
    return ApiResponse.ok("ok");
  }

  @GetMapping("/users/{id}/roles")
  public ApiResponse<List<Map<String, Object>>> userRoles(@PathVariable long id) {
    return ApiResponse.ok(repo.query("""
        SELECT r.*
        FROM sys_user_role ur
        JOIN sys_role r ON r.id = ur.role_id
        WHERE ur.user_id = :id
        ORDER BY r.role_sort, r.id
        """, Map.of("id", id)));
  }

  @PostMapping("/users/{id}/roles")
  public ApiResponse<String> saveUserRoles(@PathVariable long id, @RequestBody Map<String, Object> body) {
    jdbc.update("DELETE FROM sys_user_role WHERE user_id = :id", Map.of("id", id));
    List<Long> roleIds = longList(body.get("roleIds"));
    for (Long roleId : roleIds) {
      jdbc.update("INSERT INTO sys_user_role (user_id, role_id) VALUES (:userId, :roleId)",
          Map.of("userId", id, "roleId", roleId));
    }
    repo.operationLog("SYSTEM", String.valueOf(id), "ASSIGN_USER_ROLE", "admin", "SUCCESS", "Assign user roles");
    return ApiResponse.ok("ok");
  }

  @GetMapping("/roles")
  public ApiResponse<PageResult<Map<String, Object>>> roles(
      @RequestParam(required = false) Map<String, String> params,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    return ApiResponse.ok(listResource("roles", params, pageNum, pageSize));
  }

  @PostMapping("/roles")
  public ApiResponse<Map<String, Object>> createRole(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(createResource("roles", body, "CREATE_ROLE"));
  }

  @PutMapping("/roles/{id}")
  public ApiResponse<Map<String, Object>> updateRole(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(updateResource("roles", id, body, "UPDATE_ROLE"));
  }

  @DeleteMapping("/roles/{id}")
  public ApiResponse<String> deleteRole(@PathVariable long id) {
    jdbc.update("DELETE FROM sys_role_menu WHERE role_id = :id", Map.of("id", id));
    jdbc.update("DELETE FROM sys_user_role WHERE role_id = :id", Map.of("id", id));
    return deleteResource("roles", id, "DELETE_ROLE");
  }

  @GetMapping("/roles/{id}/menus")
  public ApiResponse<List<Long>> roleMenus(@PathVariable long id) {
    List<Long> menuIds = repo.query("SELECT menu_id FROM sys_role_menu WHERE role_id = :id", Map.of("id", id))
        .stream()
        .map(row -> longValue(row.get("menu_id"), 0))
        .toList();
    return ApiResponse.ok(menuIds);
  }

  @PostMapping("/roles/{id}/menus")
  public ApiResponse<String> saveRoleMenus(@PathVariable long id, @RequestBody Map<String, Object> body) {
    jdbc.update("DELETE FROM sys_role_menu WHERE role_id = :id", Map.of("id", id));
    for (Long menuId : longList(body.get("menuIds"))) {
      jdbc.update("INSERT INTO sys_role_menu (role_id, menu_id) VALUES (:roleId, :menuId)",
          Map.of("roleId", id, "menuId", menuId));
    }
    repo.operationLog("SYSTEM", String.valueOf(id), "ASSIGN_ROLE_MENU", "admin", "SUCCESS", "Assign role menus");
    return ApiResponse.ok("ok");
  }

  @GetMapping("/menus")
  public ApiResponse<PageResult<Map<String, Object>>> menus(
      @RequestParam(required = false) Map<String, String> params,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "20") int pageSize
  ) {
    return ApiResponse.ok(listResource("menus", params, pageNum, pageSize));
  }

  @GetMapping("/menus/tree")
  public ApiResponse<List<Map<String, Object>>> menuTree() {
    return ApiResponse.ok(repo.query("SELECT * FROM sys_menu ORDER BY parent_id, order_num, id", Map.of()));
  }

  @PostMapping("/menus")
  public ApiResponse<Map<String, Object>> createMenu(@RequestBody Map<String, Object> body) {
    return ApiResponse.ok(createResource("menus", body, "CREATE_MENU"));
  }

  @PutMapping("/menus/{id}")
  public ApiResponse<Map<String, Object>> updateMenu(@PathVariable long id, @RequestBody Map<String, Object> body) {
    return ApiResponse.ok(updateResource("menus", id, body, "UPDATE_MENU"));
  }

  @DeleteMapping("/menus/{id}")
  public ApiResponse<String> deleteMenu(@PathVariable long id) {
    jdbc.update("DELETE FROM sys_role_menu WHERE menu_id = :id", Map.of("id", id));
    return deleteResource("menus", id, "DELETE_MENU");
  }

  @GetMapping("/{resource}")
  public ApiResponse<PageResult<Map<String, Object>>> list(
      @PathVariable String resource,
      @RequestParam(required = false) Map<String, String> params,
      @RequestParam(defaultValue = "1") int pageNum,
      @RequestParam(defaultValue = "10") int pageSize
  ) {
    ResourceConfig config = resourceConfig(resource);
    return ApiResponse.ok(listResource(config.key(), params, pageNum, pageSize));
  }

  @PostMapping("/{resource}")
  public ApiResponse<Map<String, Object>> create(@PathVariable String resource, @RequestBody Map<String, Object> body) {
    ResourceConfig config = resourceConfig(resource);
    return ApiResponse.ok(createResource(config.key(), body, "CREATE_" + config.logName()));
  }

  @PutMapping("/{resource}/{id}")
  public ApiResponse<Map<String, Object>> update(
      @PathVariable String resource,
      @PathVariable long id,
      @RequestBody Map<String, Object> body
  ) {
    ResourceConfig config = resourceConfig(resource);
    return ApiResponse.ok(updateResource(config.key(), id, body, "UPDATE_" + config.logName()));
  }

  @DeleteMapping("/{resource}/{id}")
  public ApiResponse<String> delete(@PathVariable String resource, @PathVariable long id) {
    ResourceConfig config = resourceConfig(resource);
    return deleteResource(config.key(), id, "DELETE_" + config.logName());
  }

  private PageResult<Map<String, Object>> listResource(
      String key,
      Map<String, String> requestParams,
      int pageNum,
      int pageSize
  ) {
    ResourceConfig config = resourceConfig(key);
    Map<String, Object> params = new HashMap<>();
    StringJoiner where = new StringJoiner(" AND ", " WHERE 1 = 1", "");
    String keyword = requestParams == null ? null : requestParams.get("keyword");
    params.put("keyword", repo.like(keyword));
    if (params.get("keyword") != null && !config.keywordColumns().isEmpty()) {
      StringJoiner keywordWhere = new StringJoiner(" OR ", "(", ")");
      for (String column : config.keywordColumns()) {
        keywordWhere.add(column + " LIKE :keyword");
      }
      where.add(keywordWhere.toString());
    }
    for (Map.Entry<String, String> entry : config.filters().entrySet()) {
      String value = requestParams == null ? null : requestParams.get(entry.getKey());
      params.put(entry.getKey(), repo.like(value));
      where.add("(:%s IS NULL OR %s LIKE :%s)".formatted(entry.getKey(), entry.getValue(), entry.getKey()));
    }
    String select = "SELECT " + config.selectColumns() + " FROM " + config.table() + where;
    String count = "SELECT COUNT(*) FROM " + config.table() + where;
    return repo.page(select + " ORDER BY " + config.orderBy(), count, params, pageNum, pageSize);
  }

  private Map<String, Object> createResource(String key, Map<String, Object> body, String action) {
    ResourceConfig config = resourceConfig(key);
    Map<String, Object> data = snakeCaseBody(body);
    repo.insert(config.table(), data, config.writeColumns());
    repo.operationLog("SYSTEM", config.logName(), action, "admin", "SUCCESS", "Create " + config.logName());
    return lastRow(config.table());
  }

  private Map<String, Object> updateResource(String key, long id, Map<String, Object> body, String action) {
    ResourceConfig config = resourceConfig(key);
    Map<String, Object> data = snakeCaseBody(body);
    repo.updateById(config.table(), id, data, config.writeColumns());
    repo.operationLog("SYSTEM", config.logName(), action, "admin", "SUCCESS", "Update " + config.logName());
    return repo.one("SELECT * FROM " + config.table() + " WHERE id = :id", Map.of("id", id));
  }

  private ApiResponse<String> deleteResource(String key, long id, String action) {
    ResourceConfig config = resourceConfig(key);
    repo.deleteById(config.table(), id);
    repo.operationLog("SYSTEM", config.logName(), action, "admin", "SUCCESS", "Delete " + config.logName());
    return ApiResponse.ok("ok");
  }

  private Map<String, Object> normalizeUser(Map<String, Object> body) {
    Map<String, Object> data = snakeCaseBody(body);
    data.putIfAbsent("password_hash", text(body.getOrDefault("password", "123456")));
    data.putIfAbsent("display_name", text(body.getOrDefault("displayName", body.getOrDefault("display_name", body.get("username")))));
    data.putIfAbsent("status", "ACTIVE");
    if (!data.containsKey("role_name") || text(data.get("role_name")).isBlank()) {
      Map<String, Object> role = repo.one("SELECT role_name FROM sys_role WHERE role_code = :roleCode",
          Map.of("roleCode", text(data.get("role_code"))));
      data.put("role_name", role == null ? text(data.get("role_code")) : role.get("role_name"));
    }
    return data;
  }

  private void syncUserRole(long userId, Object roleCodeValue) {
    String roleCode = text(roleCodeValue);
    if (roleCode.isBlank()) {
      return;
    }
    Map<String, Object> role = repo.one("SELECT id FROM sys_role WHERE role_code = :roleCode", Map.of("roleCode", roleCode));
    if (role == null) {
      return;
    }
    jdbc.update("DELETE FROM sys_user_role WHERE user_id = :userId", Map.of("userId", userId));
    jdbc.update("INSERT INTO sys_user_role (user_id, role_id) VALUES (:userId, :roleId)",
        Map.of("userId", userId, "roleId", role.get("id")));
  }

  private void initResources() {
    resources.put("roles", config(
        "roles", "sys_role",
        "id, role_code, role_name, role_sort, data_scope, warehouse_scope, owner_scope, status, remark, created_at, updated_at",
        "role_sort, id",
        List.of("role_code", "role_name", "role_sort", "data_scope", "warehouse_scope", "owner_scope", "status", "remark"),
        List.of("role_code", "role_name"),
        filters("roleCode", "role_code", "status", "status"),
        "ROLE"
    ));
    resources.put("menus", config(
        "menus", "sys_menu",
        "id, parent_id, menu_name, menu_type, path, component, perms, icon, order_num, visible, status, remark, created_at, updated_at",
        "parent_id, order_num, id",
        List.of("parent_id", "menu_name", "menu_type", "path", "component", "perms", "icon", "order_num", "visible", "status", "remark"),
        List.of("menu_name", "path", "perms"),
        filters("menuName", "menu_name", "menuType", "menu_type", "status", "status"),
        "MENU"
    ));
    resources.put("depts", config(
        "depts", "sys_dept",
        "id, parent_id, dept_code, dept_name, leader, phone, email, order_num, status, created_at, updated_at",
        "parent_id, order_num, id",
        List.of("parent_id", "dept_code", "dept_name", "leader", "phone", "email", "order_num", "status"),
        List.of("dept_code", "dept_name", "leader"),
        filters("deptName", "dept_name", "status", "status"),
        "DEPT"
    ));
    resources.put("posts", config(
        "posts", "sys_post",
        "id, post_code, post_name, post_sort, status, remark, created_at, updated_at",
        "post_sort, id",
        List.of("post_code", "post_name", "post_sort", "status", "remark"),
        List.of("post_code", "post_name"),
        filters("postName", "post_name", "status", "status"),
        "POST"
    ));
    resources.put("dict-types", config(
        "dict-types", "sys_dict_type",
        "id, dict_name, dict_type, status, remark, created_at, updated_at",
        "id DESC",
        List.of("dict_name", "dict_type", "status", "remark"),
        List.of("dict_name", "dict_type"),
        filters("dictType", "dict_type", "status", "status"),
        "DICT_TYPE"
    ));
    resources.put("dict-data", config(
        "dict-data", "sys_dict_data",
        "id, dict_type, dict_label, dict_value, dict_sort, css_class, list_class, is_default, status, remark, created_at, updated_at",
        "dict_type, dict_sort, id",
        List.of("dict_type", "dict_label", "dict_value", "dict_sort", "css_class", "list_class", "is_default", "status", "remark"),
        List.of("dict_label", "dict_value", "dict_type"),
        filters("dictType", "dict_type", "status", "status"),
        "DICT_DATA"
    ));
    resources.put("configs", config(
        "configs", "sys_config",
        "id, config_name, config_key, config_value, config_type, status, remark, created_at, updated_at",
        "id DESC",
        List.of("config_name", "config_key", "config_value", "config_type", "status", "remark"),
        List.of("config_name", "config_key"),
        filters("configKey", "config_key", "status", "status"),
        "CONFIG"
    ));
    resources.put("notices", config(
        "notices", "sys_notice",
        "id, notice_title, notice_type, notice_content, status, created_by, created_at, updated_at",
        "id DESC",
        List.of("notice_title", "notice_type", "notice_content", "status", "created_by"),
        List.of("notice_title", "notice_content"),
        filters("noticeTitle", "notice_title", "noticeType", "notice_type", "status", "status"),
        "NOTICE"
    ));
    resources.put("loginlogs", config(
        "loginlogs", "sys_login_log",
        "id, username, ipaddr, login_location, browser, os, status, message, login_time",
        "id DESC",
        List.of(),
        List.of("username", "ipaddr", "message"),
        filters("username", "username", "status", "status"),
        "LOGIN_LOG"
    ));
    resources.put("fields", config(
        "fields", "sys_field_config",
        "id, page_code, page_name, field_code, field_name, field_type, visible, required, editable, order_num, role_codes, remark, created_at, updated_at",
        "page_code, order_num, id",
        List.of("page_code", "page_name", "field_code", "field_name", "field_type", "visible", "required", "editable", "order_num", "role_codes", "remark"),
        List.of("page_code", "page_name", "field_code", "field_name"),
        filters("pageCode", "page_code", "fieldName", "field_name"),
        "FIELD_CONFIG"
    ));
    resources.put("data-scopes", config(
        "data-scopes", "sys_data_scope",
        "id, scope_code, scope_name, role_code, role_name, scope_type, dept_codes, warehouse_codes, owner_codes, status, remark, created_at, updated_at",
        "id DESC",
        List.of("scope_code", "scope_name", "role_code", "role_name", "scope_type", "dept_codes", "warehouse_codes", "owner_codes", "status", "remark"),
        List.of("scope_code", "scope_name", "role_code", "warehouse_codes", "owner_codes"),
        filters("roleCode", "role_code", "scopeType", "scope_type", "status", "status"),
        "DATA_SCOPE"
    ));
    resources.put("operlogs", config(
        "operlogs", "wms_operation_log",
        "id, module, business_doc_no, action, operator, result, message, created_at",
        "id DESC",
        List.of(),
        List.of("module", "business_doc_no", "action", "operator", "message"),
        filters("module", "module", "operator", "operator", "result", "result"),
        "OPER_LOG"
    ));
    resources.put("interface-log", config(
        "interface-log", "wms_interface_log",
        "id, interface_name, source_system, target_system, business_doc_no, http_method, request_url, status, retry_count, error_message, created_at",
        "id DESC",
        List.of(),
        List.of("interface_name", "business_doc_no", "source_system", "target_system", "error_message"),
        filters("interfaceName", "interface_name", "targetSystem", "target_system", "status", "status"),
        "INTERFACE_LOG"
    ));
  }

  private ResourceConfig config(
      String key,
      String table,
      String selectColumns,
      String orderBy,
      List<String> writeColumns,
      List<String> keywordColumns,
      Map<String, String> filters,
      String logName
  ) {
    return new ResourceConfig(key, table, selectColumns, orderBy, writeColumns, keywordColumns, filters, logName);
  }

  private Map<String, String> filters(String... values) {
    Map<String, String> filters = new LinkedHashMap<>();
    for (int index = 0; index + 1 < values.length; index += 2) {
      filters.put(values[index], values[index + 1]);
    }
    return filters;
  }

  private ResourceConfig resourceConfig(String key) {
    ResourceConfig config = resources.get(key);
    if (config == null) {
      throw new IllegalArgumentException("Unknown system resource: " + key);
    }
    return config;
  }

  private Map<String, Object> snakeCaseBody(Map<String, Object> body) {
    Map<String, Object> data = new HashMap<>();
    body.forEach((key, value) -> data.put(toSnakeCase(key), value));
    return data;
  }

  private String toSnakeCase(String value) {
    StringBuilder builder = new StringBuilder();
    for (char ch : value.toCharArray()) {
      if (Character.isUpperCase(ch)) {
        builder.append('_').append(Character.toLowerCase(ch));
      } else {
        builder.append(ch);
      }
    }
    return builder.toString();
  }

  private Map<String, Object> lastRow(String table) {
    return repo.one("SELECT * FROM " + table + " ORDER BY id DESC LIMIT 1", Map.of());
  }

  private List<Long> longList(Object value) {
    List<Long> ids = new ArrayList<>();
    if (value instanceof List<?> list) {
      for (Object item : list) {
        long id = longValue(item, 0);
        if (id > 0) {
          ids.add(id);
        }
      }
    }
    return ids;
  }

  private long longValue(Object value, long defaultValue) {
    if (value == null) {
      return defaultValue;
    }
    if (value instanceof Number number) {
      return number.longValue();
    }
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return defaultValue;
    }
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private record ResourceConfig(
      String key,
      String table,
      String selectColumns,
      String orderBy,
      List<String> writeColumns,
      List<String> keywordColumns,
      Map<String, String> filters,
      String logName
  ) {
  }
}
