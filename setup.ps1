param(
    [switch]$Production
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

Write-Host "Installing Accountbook dependencies..." -ForegroundColor Cyan

Push-Location (Join-Path $root 'backend')
try {
    dotnet restore
    if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed with exit code $LASTEXITCODE" }
}
finally {
    Pop-Location
}

Push-Location (Join-Path $root 'fronted')
try {
    if ($Production) {
        cmd /c npm ci --omit=dev
    }
    else {
        cmd /c npm ci
    }
    if ($LASTEXITCODE -ne 0) { throw "npm dependency installation failed with exit code $LASTEXITCODE. Close any running Node/Vite process and run the script again." }
}
finally {
    Pop-Location
}

Write-Host "Dependencies installed successfully." -ForegroundColor Green
