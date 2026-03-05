$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$StateDir = Join-Path $RepoRoot ".dev"
$BackendPidFile = Join-Path $StateDir "backend.pid"
$FrontendPidFile = Join-Path $StateDir "frontend.pid"
$BackendLog = Join-Path $StateDir "backend.log"
$FrontendLog = Join-Path $StateDir "frontend.log"
$MysqlExe = "C:\xampp\mysql\bin\mysql.exe"

function Get-EnvValue {
  param(
    [string]$FilePath,
    [string]$Key,
    [string]$DefaultValue
  )

  if (-not (Test-Path $FilePath)) {
    return $DefaultValue
  }

  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $DefaultValue
  }

  $value = ($line -split "=", 2)[1].Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  return $value
}

function Test-TrackedProcess {
  param([string]$PidFile)

  if (-not (Test-Path $PidFile)) {
    return $null
  }

  $pidValue = (Get-Content $PidFile -Raw).Trim()
  if (-not $pidValue) {
    Remove-Item $PidFile -ErrorAction SilentlyContinue
    return $null
  }

  $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  if (-not $process) {
    Remove-Item $PidFile -ErrorAction SilentlyContinue
    return $null
  }

  return $process
}

function Start-TrackedProcess {
  param(
    [string]$Name,
    [string]$WorkingDir,
    [string]$Command,
    [string]$PidFile,
    [string]$LogFile
  )

  $existing = Test-TrackedProcess -PidFile $PidFile
  if ($existing) {
    Write-Host "$Name is already running with PID $($existing.Id)."
    return
  }

  if (Test-Path $LogFile) {
    Remove-Item $LogFile -Force
  }

  $child = Start-Process -FilePath "powershell.exe" `
    -ArgumentList @(
      "-NoLogo",
      "-NoProfile",
      "-Command",
      "Set-Location -LiteralPath '$WorkingDir'; $Command *>> '$LogFile'"
    ) `
    -WorkingDirectory $WorkingDir `
    -WindowStyle Hidden `
    -PassThru

  Set-Content -Path $PidFile -Value $child.Id
  Write-Host "Started $Name with PID $($child.Id). Log: $LogFile"
}

if (-not (Test-Path $BackendDir)) {
  throw "Backend directory not found: $BackendDir"
}

if (-not (Test-Path $FrontendDir)) {
  throw "Frontend directory not found: $FrontendDir"
}

if (-not (Test-Path $StateDir)) {
  New-Item -ItemType Directory -Path $StateDir | Out-Null
}

if (-not (Test-Path (Join-Path $BackendDir ".env"))) {
  Write-Warning "Missing backend/.env"
}

if (-not (Test-Path (Join-Path $FrontendDir ".env"))) {
  Write-Warning "Missing frontend/.env"
}

$FrontendUrl = Get-EnvValue `
  -FilePath (Join-Path $BackendDir ".env") `
  -Key "FRONTEND_URL" `
  -DefaultValue "http://localhost:5180"

if ($FrontendUrl -match ",") {
  $FrontendUrl = ($FrontendUrl -split ",")[0].Trim()
}

try {
  $uri = [Uri]$FrontendUrl
  if ($uri.AbsolutePath -eq "/") {
    $base = $FrontendUrl.TrimEnd("/")
    $FrontendUrl = "$base/WB_Monitoring"
  }
} catch {
  # Keep original value if it is not a valid absolute URI.
}

if (-not (Test-Path $MysqlExe)) {
  Write-Warning "XAMPP MySQL client not found at $MysqlExe"
} else {
  try {
    & $MysqlExe --version | Out-Null
    Write-Host "Detected XAMPP MySQL client."
  } catch {
    Write-Warning "Unable to execute MySQL client at $MysqlExe"
  }
}

Start-TrackedProcess `
  -Name "backend" `
  -WorkingDir $BackendDir `
  -Command "npm run dev" `
  -PidFile $BackendPidFile `
  -LogFile $BackendLog

Start-TrackedProcess `
  -Name "frontend" `
  -WorkingDir $FrontendDir `
  -Command "npm run dev" `
  -PidFile $FrontendPidFile `
  -LogFile $FrontendLog

Write-Host ""
Write-Host "Backend log:  $BackendLog"
Write-Host "Frontend log: $FrontendLog"
Write-Host "Use .\status-dev.ps1 to inspect processes."
Write-Host "Use .\stop.ps1 to stop only this project's dev processes."
Write-Host "Opening $FrontendUrl"

Start-Sleep -Seconds 3
Start-Process $FrontendUrl | Out-Null
