# PowerShell script to start all 5 microservices in separate windows
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Trading Backtest Microservices..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# 1. Start Auth Service (Port 8081)
Write-Host "[1/5] Starting Auth Service (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\auth-service'; Write-Host '=== AUTH SERVICE (8081) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 2. Start Realtime Service (Port 8082)
Write-Host "[2/5] Starting Realtime Service (Port 8082)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\realtime-service'; Write-Host '=== REALTIME SERVICE (8082) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 3. Start Backtest Service (Port 8083)
Write-Host "[3/5] Starting Backtest Service (Port 8083)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\backtest-service'; Write-Host '=== BACKTEST SERVICE (8083) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 4. Start Community Service (Port 8084)
Write-Host "[4/5] Starting Community Service (Port 8084)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\community-service'; Write-Host '=== COMMUNITY SERVICE (8084) ===' -ForegroundColor Green; mvn spring-boot:run"

Start-Sleep -Seconds 2

# 5. Start API Gateway (Port 8080)
Write-Host "[5/5] Starting API Gateway (Port 8080)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend\api-gateway'; Write-Host '=== API GATEWAY (8080) ===' -ForegroundColor Green; mvn spring-boot:run"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All 5 services are launching in separate windows!" -ForegroundColor Green
Write-Host "Gateway URL:   http://localhost:8080" -ForegroundColor White
Write-Host "Community URL: http://localhost:8084" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
