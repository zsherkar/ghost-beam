$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Trash = Join-Path $Root ".project-trash"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TargetTrash = Join-Path $Trash "demo-artifacts-$Stamp"

New-Item -ItemType Directory -Path $TargetTrash -Force | Out-Null

$ArtifactDirs = @(
  "backend\artifacts\reports",
  "backend\artifacts\benchmarks",
  "backend\artifacts\evidence_bundles",
  "backend\artifacts_output"
)

foreach ($relative in $ArtifactDirs) {
  $path = Join-Path $Root $relative
  if (Test-Path $path) {
    $destination = Join-Path $TargetTrash ($relative -replace '[\\/:*?"<>|]', '_')
    Move-Item -LiteralPath $path -Destination $destination
    Write-Host "Moved $relative to .project-trash."
  }
}

Write-Host "Demo generated artifacts reset safely inside project trash."
Write-Host "No source files, dependencies, caches, or files outside the project were removed."
