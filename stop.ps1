$ErrorActionPreference = "Continue"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateDir = Join-Path $RepoRoot ".dev"
$BackendPidFile = Join-Path $StateDir "backend.pid"
$FrontendPidFile = Join-Path $StateDir "frontend.pid"

function Stop-TrackedProcess {
  param(
    [string]$Name,
    [string]$PidFile
  )

  if (-not (Test-Path $PidFile)) {
    Write-Host "$Name PID file not found."
    return
  }

  $pidValue = (Get-Content $PidFile -Raw).Trim()
  if (-not $pidValue) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "$Name PID file was empty and removed."
    return
  }

  $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
  if (-not $process) {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "$Name process not running; removed stale PID file."
    return
  }

  try {
    & taskkill /PID $process.Id /T /F | Out-Null
    Write-Host "Stopped $Name (PID $($process.Id))."
  } catch {
    Write-Warning "Failed to stop $Name (PID $($process.Id)): $($_.Exception.Message)"
  } finally {
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
  }
}

Stop-TrackedProcess -Name "backend" -PidFile $BackendPidFile
Stop-TrackedProcess -Name "frontend" -PidFile $FrontendPidFile

Write-Host "Done. Dev processes stopped for this project."
