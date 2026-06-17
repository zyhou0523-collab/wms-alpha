# Technical Architecture

## Overview

WMS Alpha uses a classic frontend/backend/database architecture.

```text
Browser
  -> Vue 3 + Vite + Element Plus
  -> REST API /api
  -> Spring Boot 3 + Spring JDBC
  -> MySQL 8
```

## Frontend

- Path: `frontend/`
- Framework: Vue 3
- UI: Element Plus
- Build tool: Vite
- API client: Axios
- Environment:
  - `VITE_API_BASE_URL=/api`
  - `VITE_USE_MOCK=true` for frontend-only demo mode

## Backend

- Path: `backend/`
- Runtime: Java 17
- Framework: Spring Boot 3
- Persistence: Spring JDBC
- API style: REST
- API prefix: `/api`
- Swagger UI: `/swagger-ui/index.html`

## Database

- MySQL 8
- Standard initialization scripts live in `sql/`
- Legacy scripts are kept in `database/`

## Mock Integration

The prototype includes mock flows for:

- SAP inbound material document posting
- MES SN push
- Fulfillment outbound order push
- Trace system callback
- CRM customer data

## Deployment Shape

For local development, run MySQL with Docker Compose and run frontend/backend locally.

For online demo, deploy:

- Frontend to Vercel / Netlify / Nginx
- Backend to cloud server / Render / Railway
- MySQL to managed database
