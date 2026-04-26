param(
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  $Python = "python"
}

Write-Host "Starting Ghost Beam locally only..."
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://127.0.0.1:5173"

$backendScript = @"
`$env:PYTHONPATH='$Backend\.deps;$Backend'
Set-Location '$Backend'
& '$Python' -m uvicorn ghostbeam.api.main:app --host 127.0.0.1 --port 8000 --reload
"@

$frontendScript = @"
Set-Location '$Frontend'
npm run dev -- --host 127.0.0.1 --port 5173
"@

Start-Job -Name "ghostbeam-backend" -ScriptBlock ([scriptblock]::Create($backendScript)) | Out-Null
Start-Job -Name "ghostbeam-frontend" -ScriptBlock ([scriptblock]::Create($frontendScript)) | Out-Null

Write-Host "Started local jobs: ghostbeam-backend, ghostbeam-frontend"
Write-Host "Use Get-Job / Receive-Job / Stop-Job to inspect or stop them."

if ($OpenBrowser) {
  Start-Process "http://127.0.0.1:5173"
}
