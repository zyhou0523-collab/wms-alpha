# WMS Mobile

WMS PDA / H5 移动端作业系统，面向手持 PDA、安卓扫码终端和移动浏览器，用于承接 WMS Alpha 的现场仓储作业入口。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Vant
- Pinia
- Axios

## 启动方式

```bash
cd mobile
npm install
npm run dev
```

## 构建方式

```bash
npm run build
```

## 本机预览

```text
http://127.0.0.1:5174
http://127.0.0.1:5174/home
```

## 局域网 PDA 访问

Vite 已配置 `host: '0.0.0.0'`，启动后可使用电脑局域网 IP 访问：

```bash
npm run dev -- --host 0.0.0.0
```

```text
http://电脑局域网IP:5174
```

电脑和 PDA / 手机需要连接同一局域网。

## H5 / PDA 适配说明

- 页面最大宽度限制为 430px，桌面浏览器打开时居中显示为手机 / PDA 竖屏效果。
- 支持常见手机和 PDA 宽度，例如 360px、375px、390px、414px、430px。
- 首页采用移动端待办卡片和 2 列作业入口布局。
- 底部 Tab 导航固定在移动端容器范围内，不横跨 PC 宽屏。
- 大按钮和扫码输入组件面向手持作业场景预留。

## Chrome 手机模式预览

在 Chrome 中打开页面后：

1. 打开 DevTools：F12 或右键检查。
2. 点击 Toggle device toolbar。
3. 选择 iPhone 12、Pixel 5，或自定义 `430 x 932`。
4. 刷新页面。

## 后端接口

移动端复用 WMS Alpha 后端接口。默认开发代理会将 `/api` 转发到：

```text
http://localhost:8080
```

也可以通过 `.env` 配置：

```text
VITE_API_BASE_URL=http://localhost:8080
```

## 默认账号

- `admin / admin123`
- `wh_admin / 123456`
- `logistics / 123456`

## 当前范围

WMS Mobile V1.0 完成移动端基础框架和入口：

- 登录页
- 首页 PDA 作业入口
- 当前仓库展示
- 今日待办卡片
- 入库、出库、库存查询、库存移动、库存盘点、SN 查询入口
- 底部 Tab
- 请求封装
- Token 管理
- 扫码输入组件
- H5 / PDA 竖屏预览

具体业务闭环仍需在后续版本继续与 PC 端和后端接口联调。

## 后续打包

后续可使用 Capacitor / uni-app 打包 Android APK，也可继续扩展为小程序端。
