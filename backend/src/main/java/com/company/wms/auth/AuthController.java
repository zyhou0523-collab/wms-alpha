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
        """
        SELECT id, username, display_name, role_code, role_name, warehouse_scope, owner_scope,
               default_warehouse_code, default_owner_code, status
        FROM sys_user
        WHERE username = :username
        """,
        Map.of("username", username)
    );
    return ApiResponse.ok(user == null ? Map.of("username", "admin", "display_name", "系统管理员") : user);
  }

  @GetMapping("/menus")
  public ApiResponse<List<Map<String, Object>>> menus() {
    return ApiResponse.ok(List.of(
        menu("dashboard", "数据驾驶舱", "Monitor", null,
            child("globalDashboard", "全局库存看板", "/dashboard")
        ),
        menu("workbench", "工作台", "HomeFilled", null,
            child("myWorkbench", "我的工作台", "/dashboard/workbench")
        ),
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
            child("snList", "SN 查询", "/inventory/sn"),
            child("inventoryCount", "库存盘点", "/inventory/count"),
            child("inventoryMove", "库存移动", "/inventory/move")
        ),
        menu("reports", "报表中心", "DataAnalysis", null,
            child("inoutStockReport", "进出存报表", "/reports/inout-stock"),
            child("inboundDailyReport", "入库日报表", "/reports/inbound-daily"),
            child("outboundDailyReport", "出库日报表", "/reports/outbound-daily"),
            child("standardAgingReport", "标准库龄报表", "/reports/standard-aging"),
            child("segmentAgingReport", "分段库龄报表", "/reports/segment-aging"),
            child("outboundSnReport", "出库 SN 报表", "/reports/outbound-sn"),
            child("inboundSnReport", "入库 SN 报表", "/reports/inbound-sn")
        ),
        menu("interface", "接口中心", "Connection", null,
            child("interfaceLogs", "接口日志", "/interface/logs")
        ),
        menu("system", "系统管理", "Setting", null,
            child("users", "用户管理", "/system/users"),
            child("roles", "角色管理", "/system/roles"),
            child("menus", "菜单管理", "/system/menus"),
            child("depts", "部门管理", "/system/depts"),
            child("posts", "岗位管理", "/system/posts"),
            child("dict", "字典管理", "/system/dict"),
            child("configs", "参数设置", "/system/config"),
            child("notices", "通知公告", "/system/notice"),
            child("operlogs", "操作日志", "/system/operlog"),
            child("loginlogs", "登录日志", "/system/loginlog"),
            child("fields", "字段管理", "/system/field"),
            child("dataScopes", "数据权限", "/system/data-scope"),
            child("systemInterfaceLogs", "接口日志", "/system/interface-log")
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
