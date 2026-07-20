$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $projectRoot 'rust\Cargo.toml'
$releaseArtifact = Join-Path $projectRoot 'rust\target\wasm32-unknown-unknown\release\fyr_engine.wasm'
$distDirectory = Join-Path $projectRoot 'dist'
$distArtifact = Join-Path $distDirectory 'fyr-engine.wasm'
$cargoPath = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'

if (-not (Test-Path $cargoPath)) {
    $cargoPath = 'cargo'
}

& $cargoPath build --manifest-path $manifestPath --target wasm32-unknown-unknown --release
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

if (-not (Test-Path $releaseArtifact)) {
    throw "Cargo completed without producing $releaseArtifact"
}

New-Item -ItemType Directory -Force -Path $distDirectory | Out-Null
Copy-Item -LiteralPath $releaseArtifact -Destination $distArtifact -Force
Write-Host "Copied $releaseArtifact to $distArtifact"
