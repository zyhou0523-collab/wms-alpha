#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

required_files=(
  "README.md"
  "QUICK_START.md"
  "DEMO_GUIDE.md"
  "DEPLOYMENT.md"
  "docker-compose.yml"
  ".gitignore"
  ".env.example"
  "frontend/package.json"
  "backend/pom.xml"
  "sql/01_schema.sql"
  "sql/02_seed_master_data.sql"
  "sql/03_seed_business_data.sql"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "${file}" ]]; then
    echo "Missing required file: ${file}"
    exit 1
  fi
done

for path in "frontend/node_modules" "frontend/dist" "backend/target" "dist" "build" ".env"; do
  if [[ -e "${path}" ]]; then
    echo "Release check failed: ${path} should not be committed."
    exit 1
  fi
done

if grep -RInE "(AKIA|SECRET_KEY|PRIVATE_KEY|BEGIN RSA|ghp_|glpat-|真实密码)" . \
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=target --exclude-dir=dist \
  --exclude=check-release.sh --exclude=check-release.ps1; then
  echo "Potential secret detected. Please review before release."
  exit 1
fi

echo "Release checklist passed."
