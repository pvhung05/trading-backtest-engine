# PowerShell script to start all 5 microservices in separate windows
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Trading Backtest Microservices..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# Check if any port is already in use
$ports = @(8080, 8081, 8082, 8083, 8084, 8085)
$alreadyRunning = @()
foreach ($p in $ports) {
    if (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) {
        $alreadyRunning += $p
    }
}

if ($alreadyRunning.Count -gt 0) {
    Write-Host "[INFO] Detected active services on port(s): $($alreadyRunning -join ', ')" -ForegroundColor Yellow
    Write-Host "Stopping existing services to prevent port conflict..." -ForegroundColor Yellow
    & "$root\stop-all.ps1"
    Start-Sleep -Seconds 2
}

# 1. Start Auth Service (Port 8081)
Write-Host "[1/6] Starting Auth Service (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\auth-service'; Write-Host '=== AUTH SERVICE (8081) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 2. Start Realtime Service (Port 8082)
Write-Host "[2/6] Starting Realtime Service (Port 8082)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\realtime-service'; Write-Host '=== REALTIME SERVICE (8082) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 3. Start Backtest Service (Port 8083)
Write-Host "[3/6] Starting Backtest Service (Port 8083)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\backtest-service'; Write-Host '=== BACKTEST SERVICE (8083) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 4. Start Community Service (Port 8084)
Write-Host "[4/6] Starting Community Service (Port 8084)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\community-service'; Write-Host '=== COMMUNITY SERVICE (8084) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 5. Start Script Service (Port 8085)
Write-Host "[5/6] Starting Script Service (Port 8085)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\script-service'; Write-Host '=== SCRIPT SERVICE (8085) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 6. Start API Gateway (Port 8080)
Write-Host "[6/6] Starting API Gateway (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\api-gateway'; Write-Host '=== API GATEWAY (8080) ===' -ForegroundColor Green; mvn spring-boot:run"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All 6 services are launching in separate windows!" -ForegroundColor Green
Write-Host "Note: Services take ~10-15s to fully initialize." -ForegroundColor Yellow
Write-Host "Gateway URL:   http://localhost:8080" -ForegroundColor White
Write-Host "Script URL:    http://localhost:8085" -ForegroundColor White
Write-Host "Community URL: http://localhost:8084" -ForegroundColor White
Write-Host "Check status:  .\check-status.ps1" -ForegroundColor Cyan
Write-Host "Stop all:      .\stop-all.ps1" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
