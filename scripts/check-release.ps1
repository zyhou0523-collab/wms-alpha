$ErrorActionPreference = 'Stop'

$rootDir = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')
Set-Location $rootDir

$requiredFiles = @(
  'README.md',
  'QUICK_START.md',
  'DEMO_GUIDE.md',
  'DEPLOYMENT.md',
  'docker-compose.yml',
  '.gitignore',
  '.env.example',
  'frontend/package.json',
  'backend/pom.xml',
  'sql/01_schema.sql',
  'sql/02_seed_master_data.sql',
  'sql/03_seed_business_data.sql'
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
    Write-Error "Missing required file: $file"
    exit 1
  }
}

$blockedPaths = @(
  'frontend/node_modules',
  'frontend/dist',
  'backend/target',
  'dist',
  'build',
  '.env'
)

foreach ($path in $blockedPaths) {
  $tracked = git ls-files -- $path
  if ($tracked) {
    Write-Error "Release check failed: $path is tracked by Git."
    exit 1
  }

  if (Test-Path -LiteralPath $path) {
    git check-ignore -q -- $path
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Release check failed: $path exists locally and is not ignored by Git."
      exit 1
    }
  }
}

$secretPattern = 'AKIA|SECRET_KEY|PRIVATE_KEY|BEGIN RSA|ghp_|glpat-|真实密码'
$files = Get-ChildItem -Recurse -File -Force |
  Where-Object {
    $_.FullName -notmatch '\\(\.git|node_modules|target|dist)\\' -and
    $_.Name -notin @('check-release.sh', 'check-release.ps1')
  }

$hits = $files | Select-String -Pattern $secretPattern -ErrorAction SilentlyContinue
if ($hits) {
  $hits | ForEach-Object {
    Write-Host "$($_.Path):$($_.LineNumber): $($_.Line)"
  }
  Write-Error 'Potential secret detected. Please review before release.'
  exit 1
}

Write-Host 'Release checklist passed.'
