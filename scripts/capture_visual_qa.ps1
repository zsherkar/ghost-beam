param(
  [string]$Url = "http://127.0.0.1:5173/",
  [string]$OutDir = "docs/screenshots"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$targetDir = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

Write-Host "Ghost Beam visual QA target: $Url"
Write-Host "Screenshot directory: $targetDir"

$playwrightCli = Join-Path $root "frontend\node_modules\.bin\playwright.cmd"
if (Test-Path $playwrightCli) {
  Write-Host "Playwright CLI detected. Capturing baseline screenshots."
  Push-Location (Join-Path $root "frontend")
  try {
    & $playwrightCli screenshot --viewport-size=1920,1080 $Url (Join-Path $targetDir "external_1920_dark_green_zone.png")
    & $playwrightCli screenshot --viewport-size=1440,900 $Url (Join-Path $targetDir "external_1440_dark_green_zone.png")
  } finally {
    Pop-Location
  }
  Write-Host "Screenshots captured. Continue manual QA for theme, drawer, benchmark, evidence bundle, and recorded fixture states."
  exit 0
}

Write-Host "Playwright CLI not found. Manual visual QA instructions:"
Write-Host "1. Start backend on http://127.0.0.1:8000 and frontend on http://127.0.0.1:5173."
Write-Host "2. Open $Url in an external browser."
Write-Host "3. Capture 1920x1080 and 1440x900 screenshots for dark/light, guided demo, Evidence drawer, benchmark, evidence bundle, and recorded fixture."
Write-Host "4. Save screenshots under $targetDir using the names in docs/visual_qa_checklist.md."
exit 0
