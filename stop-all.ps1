# PowerShell script to stop all 6 microservices
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Stopping Trading Backtest Microservices..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$ports = @(8080, 8081, 8082, 8083, 8084, 8085)
$stoppedAny = $false

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $pids) {
            if ($procId -le 4) { continue }
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Stopping process PID $($procId) ($($proc.ProcessName)) on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                    $stoppedAny = $true
                }
            } catch {
                Write-Host "Could not stop PID $($procId): $_" -ForegroundColor Red
            }
        }
    }
}

if (-not $stoppedAny) {
    Write-Host "No active microservices found on ports 8080-8085." -ForegroundColor Gray
} else {
    Write-Host "All microservices on ports 8080-8085 have been stopped." -ForegroundColor Green
}
Write-Host "==========================================" -ForegroundColor Cyan
