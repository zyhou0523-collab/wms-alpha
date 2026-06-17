package com.company.wms.auth;

import com.company.wms.common.ApiResponse;
import com.company.wms.common.WmsRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final WmsRepository repo;

  public AuthController(WmsRepository repo) {
    this.repo = repo;
  }

  @PostMapping("/auth/login")
  public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, Object> body) {
    String username = String.valueOf(body.getOrDefault("username", ""));
    String password = String.valueOf(body.getOrDefault("password", ""));
    Map<String, Object> user = repo.one(
        "SELECT id, username, display_name, role_code, role_name, status FROM sys_user WHERE username = :username AND password_hash = :password",
        Map.of("username", username, "password", password)
    );
    if (user == null) {
      return ApiResponse.fail("账号或密码错误");
    }
    String token = "mock-jwt-" + username + "-" + System.currentTimeMillis();
    Map<String, Object> data = new HashMap<>();
    data.put("token", token);
    data.put("user", user);
    return ApiResponse.ok(data);
  }

  @GetMapping("/auth/me")
  public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
    String username = usernameFromToken(authorization);
    Map<String, Object> user = repo.one(
        "SELECT id, username, display_name, role_code, role_name, warehouse_scope, status FROM sys_user WHERE username = :username",
        Map.of("username", username)
    );
    return ApiResponse.ok(user == null ? Map.of("username", "admin", "display_name", "系统管理员") : user);
  }

  @GetMapping("/menus")
  public ApiResponse<List<Map<String, Object>>> menus() {
    return ApiResponse.ok(List.of(
        menu("dashboard", "数据驾驶舱", "Monitor", "/dashboard"),
        menu("masterdata", "基础数据", "Collection", null,
            child("products", "产品主数据", "/masterdata/products"),
            child("customers", "客户主数据", "/masterdata/customers")
        ),
        menu("warehouse", "仓库设置", "OfficeBuilding", null,
            child("warehouses", "仓库管理", "/warehouse/warehouses"),
            child("locations", "库位管理", "/warehouse/locations")
        ),
        menu("inbound", "入库管理", "Download", null,
            child("arrivalNotices", "预期到货通知单", "/inbound/arrival-notices"),
            child("snBindings", "SN 绑定", "/inbound/sn-bindings")
        ),
        menu("outbound", "出库管理", "Upload", null,
            child("shippingOrders", "发运订单", "/outbound/shipping-orders")
        ),
        menu("inventory", "库存管理", "Box", null,
            child("inventoryList", "库存查询", "/inventory/list"),
            child("snList", "SN 查询", "/inventory/sn")
        ),
        menu("interface", "接口中心", "Connection", null,
            child("interfaceLogs", "接口日志", "/interface/logs")
        ),
        menu("system", "系统设置", "Setting", null,
            child("users", "系统用户", "/system/users")
        )
    ));
  }

  private Map<String, Object> menu(String id, String title, String icon, String path, Map<String, Object>... children) {
    Map<String, Object> item = new HashMap<>();
    item.put("id", id);
    item.put("title", title);
    item.put("icon", icon);
    item.put("path", path);
    item.put("children", List.of(children));
    return item;
  }

  private Map<String, Object> child(String id, String title, String path) {
    Map<String, Object> item = new HashMap<>();
    item.put("id", id);
    item.put("title", title);
    item.put("path", path);
    return item;
  }

  private String usernameFromToken(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer mock-jwt-")) {
      return "admin";
    }
    String token = authorization.substring("Bearer mock-jwt-".length());
    int split = token.lastIndexOf('-');
    return split > 0 ? token.substring(0, split) : "admin";
  }
}
