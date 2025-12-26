# Smart University Health Check Script for Windows PowerShell
# Verifies all services are running and healthy

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "  Smart University Health Check" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Services accessible via exposed ports
$exposedServices = @(
    @{ Name = "Gateway"; Port = 8080; HealthPath = "/actuator/health" },
    @{ Name = "Frontend"; Port = 3200; HealthPath = "/" }
)

# Internal services checked via Docker container health
$dockerServices = @(
    @{ Name = "Auth Service"; Container = "auth-service" },
    @{ Name = "Booking Service"; Container = "booking-service" },
    @{ Name = "Marketplace Service"; Container = "marketplace-service" },
    @{ Name = "Payment Service"; Container = "payment-service" },
    @{ Name = "Exam Service"; Container = "exam-service" },
    @{ Name = "Notification Service"; Container = "notification-service" },
    @{ Name = "Dashboard Service"; Container = "dashboard-service" }
)

Write-Host "`n📡 Checking Exposed Services..." -ForegroundColor Yellow

$healthyCount = 0
$totalCount = $exposedServices.Count + $dockerServices.Count

foreach ($svc in $exposedServices) {
    $url = "http://localhost:$($svc.Port)$($svc.HealthPath)"
    Write-Host -NoNewline "   $($svc.Name.PadRight(25))"
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ UP" -ForegroundColor Green
            $healthyCount++
        }
        else {
            Write-Host "⚠️  HTTP $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ DOWN" -ForegroundColor Red
    }
}

Write-Host "`n🐳 Checking Docker Services (via container status)..." -ForegroundColor Yellow

foreach ($svc in $dockerServices) {
    Write-Host -NoNewline "   $($svc.Name.PadRight(25))"
    try {
        $status = docker inspect --format "{{.State.Status}}" $svc.Container 2>$null
        if ($status -match "running") {
            Write-Host "✅ Running" -ForegroundColor Green
            $healthyCount++
        }
        elseif ($status) {
            Write-Host "⚠️  $status" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ Not found" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Not found" -ForegroundColor Red
    }
}

Write-Host "`n🔧 Checking Infrastructure..." -ForegroundColor Yellow

# Check RabbitMQ
Write-Host -NoNewline "   RabbitMQ                  "
try {
    $rabbit = Invoke-WebRequest -Uri "http://localhost:15800/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ UP (Web UI available)" -ForegroundColor Green
}
catch {
    Write-Host "❌ DOWN" -ForegroundColor Red
}

# Check Redis
Write-Host -NoNewline "   Redis                     "
try {
    # Redis requires password authentication (default: changeme)
    $redisPing = docker exec redis redis-cli -a changeme ping 2>$null
    if ($redisPing -match "PONG") {
        Write-Host "✅ UP (PONG received)" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  No response" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠️  Cannot check (Docker?)" -ForegroundColor Yellow
}

# Check PostgreSQL databases via Docker
Write-Host "`n🗄️  Checking Databases..." -ForegroundColor Yellow

$databases = @("auth-db", "booking-db", "market-db", "payment-db", "exam-db", "notification-db", "dashboard-db")

foreach ($db in $databases) {
    Write-Host -NoNewline "   $($db.PadRight(25))"
    try {
        $status = docker inspect --format "{{.State.Status}}" $db 2>$null
        if ($status -eq "running") {
            Write-Host "✅ Running" -ForegroundColor Green
        }
        else {
            Write-Host "⚠️  $status" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Not found" -ForegroundColor Red
    }
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "  Health Check Summary" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$percentage = [math]::Round(($healthyCount / $totalCount) * 100)
$color = if ($percentage -eq 100) { "Green" } elseif ($percentage -ge 80) { "Yellow" } else { "Red" }

Write-Host "`n   Services Healthy: $healthyCount / $totalCount ($percentage%)" -ForegroundColor $color

if ($healthyCount -eq $totalCount) {
    Write-Host "`n   🎉 All systems operational! Ready to test." -ForegroundColor Green
    Write-Host "   🌐 Open: http://localhost:3200" -ForegroundColor Cyan
}
else {
    Write-Host "`n   ⚠️  Some services are down. Run:" -ForegroundColor Yellow
    Write-Host "      docker compose logs -f [service-name]" -ForegroundColor Gray
}
