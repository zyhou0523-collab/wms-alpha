#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Starting MySQL..."
docker compose -f "${ROOT_DIR}/docker-compose.yml" up -d mysql

echo "Start backend in another terminal:"
echo "  cd ${ROOT_DIR}/backend && mvn spring-boot:run"

echo "Start frontend in another terminal:"
echo "  cd ${ROOT_DIR}/frontend && npm install && npm run dev"

echo "Open http://localhost:5173"
