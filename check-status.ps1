# PowerShell script to check health and status of all microservices
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Checking Microservices Status..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$services = @(
    @{ Name = "API Gateway";       Port = 8080; Url = "http://localhost:8080/actuator/health" },
    @{ Name = "Auth Service";      Port = 8081; Url = "http://localhost:8081/actuator/health" },
    @{ Name = "Realtime Service";  Port = 8082; Url = "http://localhost:8082/api/market/health" },
    @{ Name = "Backtest Service";  Port = 8083; Url = "http://localhost:8083/api/backtest-runs" },
    @{ Name = "Community Service"; Port = 8084; Url = "http://localhost:8084/api/community/health" },
    @{ Name = "Script Service";    Port = 8085; Url = "http://localhost:8085/api-docs" }
)

foreach ($svc in $services) {
    $conn = Get-NetTCPConnection -LocalPort $svc.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $pidNum = $conn.OwningProcess
        $statusStr = "[LISTENING] Port $($svc.Port) (PID $pidNum)"
        Write-Host ("{0,-20} : {1}" -f $svc.Name, $statusStr) -ForegroundColor Green
    } else {
        Write-Host ("{0,-20} : [STOPPED] Port $($svc.Port) is free" -f $svc.Name) -ForegroundColor Red
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
