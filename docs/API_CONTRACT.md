# API Contract

Base URL:

```text
http://localhost:8080/api
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

## Auth

- `POST /auth/login`
- `GET /auth/me`
- `GET /menus`

## Master Data

- `GET /products`
- `POST /products`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `GET /products/options`
- `GET /products/export-template`
- `POST /products/import`
- `GET /products/export`
- `GET /customers`
- `POST /customers`
- `PUT /customers/{id}`
- `DELETE /customers/{id}`
- `GET /customers/options`
- `GET /customers/export-template`
- `POST /customers/import`
- `GET /customers/export`

## Warehouse

- `GET /warehouses`
- `POST /warehouses`
- `PUT /warehouses/{id}`
- `DELETE /warehouses/{id}`
- `GET /locations`
- `POST /locations`
- `PUT /locations/{id}`
- `DELETE /locations/{id}`

## Inventory

- `GET /inventory`
- `GET /serial-numbers`

## Inbound

- `GET /inbound-orders`
- `GET /inbound-orders/{id}`
- `POST /inbound-orders`
- `POST /inbound-orders/{id}/receive`
- `GET /inbound-orders/{orderId}/sn-collect-context`
- `GET /inbound-orders/{orderId}/lines/{lineId}/sn-collect-context`
- `GET /inbound-orders/{orderId}/lines/{lineId}/collected-sns`
- `POST /inbound-orders/{orderId}/lines/{lineId}/validate-sn-collection`
- `POST /inbound-orders/{orderId}/lines/{lineId}/confirm-sn-collection`
- `POST /inbound-orders/{orderId}/lines/{lineId}/cancel-sn-collection`
- `POST /inbound-orders/{id}/post-sap`
- `POST /inbound-orders/retry-sap`
- `GET /inbound-orders/import-template`
- `POST /inbound-orders/import`
- `POST /inbound-orders/export`
- `GET /inbound/sn-bindings`
- `DELETE /inbound/sn-bindings/{id}`
- `POST /inbound/sn-bindings/bulk-delete`
- `GET /inbound/sn-bindings/export`

## Outbound Alpha

- `GET /outbound/shipping-orders`
- `GET /outbound/orders/{id}`
- `POST /outbound/orders/{id}/allocate-auto`
- `POST /outbound/orders/{id}/picking-tasks`
- `POST /outbound/orders/{id}/review`
- `POST /outbound/orders/{id}/ship`

## Logs and Dashboard

- `GET /dashboard/summary`
- `GET /interface-logs`
- `POST /interface-logs/{id}/retry`
- `GET /system/users`

## Import / Export Format

Current Alpha import/export uses CSV payload objects:

```json
{
  "filename": "产品主数据_20260617120000.csv",
  "content": "货主编码,货主名称,...",
  "mimeType": "text/csv;charset=utf-8"
}
```

Excel `.xlsx` multi-sheet export is planned for a later iteration.
