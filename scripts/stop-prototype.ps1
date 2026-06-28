param(
  [int]$Port = 5174
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$RuntimeDir = Join-Path $ProjectRoot ".runtime"
$PidFile = Join-Path $RuntimeDir "prototype-server.pid"

function Get-ListeningPids([int]$LocalPort) {
  $pattern = ":$LocalPort\s+.*\s+LISTENING\s+(\d+)\s*$"
  return netstat -ano |
    Select-String -Pattern $pattern |
    ForEach-Object { [int]$_.Matches[0].Groups[1].Value } |
    Select-Object -Unique
}

$pids = @()
if (Test-Path $PidFile) {
  $pids += Get-Content $PidFile | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }
}

$pids += Get-ListeningPids $Port
$pids = $pids | Select-Object -Unique

if (!$pids.Count) {
  Write-Host "No WMS Alpha prototype process found on port $Port."
  exit 0
}

foreach ($pidValue in $pids) {
  Stop-Process -Id $pidValue -ErrorAction SilentlyContinue
  Write-Host "Stopped prototype process PID $pidValue."
}

if (Test-Path $PidFile) {
  Remove-Item -LiteralPath $PidFile -Force
}
