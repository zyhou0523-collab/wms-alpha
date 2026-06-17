#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Building backend..."
cd "${ROOT_DIR}/backend"
mvn clean test

echo "Building frontend..."
cd "${ROOT_DIR}/frontend"
npm install
npm run build

echo "Build completed."
