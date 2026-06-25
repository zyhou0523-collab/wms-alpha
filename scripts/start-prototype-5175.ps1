$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$logDir = Join-Path $root "logs"
$log = Join-Path $logDir "frontend-dev-5175.log"
$url = "http://127.0.0.1:5175/outbound/shipping-orders"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

try {
  $status = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3).StatusCode
  if ($status -eq 200) {
    Write-Host "WMS Alpha prototype is already running: $url"
    exit 0
  }
} catch {
  # Service is not running yet.
}

$args = "/c cd /d `"$frontend`" && set VITE_USE_MOCK=true&& npm.cmd run dev -- --host 127.0.0.1 --port 5175 > `"$log`" 2>&1"
$process = Start-Process -FilePath "cmd.exe" -ArgumentList $args -WindowStyle Hidden -PassThru
Write-Host "Started WMS Alpha prototype. PID=$($process.Id)"
Write-Host "URL: $url"
Write-Host "Log: $log"
