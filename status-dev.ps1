$ErrorActionPreference = "Continue"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateDir = Join-Path $RepoRoot ".dev"
$BackendPidFile = Join-Path $StateDir "backend.pid"
$FrontendPidFile = Join-Path $StateDir "frontend.pid"
$BackendLog = Join-Path $StateDir "backend.log"
$FrontendLog = Join-Path $StateDir "frontend.log"

function Show-TrackedStatus {
  param(
    [string]$Name,
    [string]$PidFile
  )

  if (-not (Test-Path $PidFile)) {
    Write-Host "${Name}: not tracked (PID file missing)"
    return
  }

  $pidValue = (Get-Content $PidFile -Raw).Trim()
  if (-not $pidValue) {
    Write-Host "${Name}: PID file empty"
    return
  }

  $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  if ($proc) {
    Write-Host "${Name}: running (PID $($proc.Id))"
  } else {
    Write-Host "${Name}: not running (stale PID $pidValue)"
  }
}

Show-TrackedStatus -Name "backend" -PidFile $BackendPidFile
Show-TrackedStatus -Name "frontend" -PidFile $FrontendPidFile

if (Test-Path $BackendLog) {
  Write-Host "backend log : $BackendLog"
}

if (Test-Path $FrontendLog) {
  Write-Host "frontend log: $FrontendLog"
}
