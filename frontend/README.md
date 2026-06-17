# WMS Alpha Frontend

## 技术栈

- Vue3
- Vite
- TypeScript
- Element Plus
- Pinia
- Vue Router

## 启动

```bash
cd frontend
npm install
npm run dev
```

默认访问：`http://localhost:5173`

## Mock 演示

默认调用后端 `/api`。如果只想演示前端，可以启用本地 Mock：

```bash
set VITE_USE_MOCK=true
npm run dev
```

Mock 数据会写入浏览器 `localStorage`，支持基础列表查询和主数据新增/编辑/删除。

