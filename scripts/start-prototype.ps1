param(
  [int]$Port = 5174,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path (Join-Path $ScriptDir "..")
$ServerScript = Join-Path $ScriptDir "prototype-static-server.mjs"
$DistRoot = Join-Path $ProjectRoot "frontend\dist"
$RuntimeDir = Join-Path $ProjectRoot ".runtime"
$PidFile = Join-Path $RuntimeDir "prototype-server.pid"

function Get-ListeningPid([int]$LocalPort) {
  $pattern = ":$LocalPort\s+.*\s+LISTENING\s+(\d+)\s*$"
  $match = netstat -ano | Select-String -Pattern $pattern | Select-Object -First 1
  if ($match -and $match.Matches.Count -gt 0) {
    return [int]$match.Matches[0].Groups[1].Value
  }
  return $null
}

if (!(Test-Path $DistRoot)) {
  throw "frontend\dist does not exist. Run frontend build before starting the prototype server."
}

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

$listenerPid = Get-ListeningPid $Port
if ($listenerPid) {
  $listenerPid | Set-Content -Path $PidFile -Encoding ASCII
  Write-Host "WMS Alpha prototype is already listening on http://$HostName`:$Port (PID $listenerPid)."
  exit 0
}

$node = Get-Command node -ErrorAction Stop

$command = "start ""WMS Alpha Prototype"" /B ""$($node.Source)"" ""$ServerScript"" --host $HostName --port $Port --root ""$DistRoot"""
cmd.exe /d /c $command | Out-Null

Start-Sleep -Milliseconds 1200
$startedPid = Get-ListeningPid $Port
if (!$startedPid) {
  Write-Host "Prototype server process started but port $Port is not listening yet."
  exit 1
}

$startedPid | Set-Content -Path $PidFile -Encoding ASCII

Write-Host "WMS Alpha prototype is running at http://$HostName`:$Port (PID $startedPid)."
