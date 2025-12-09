@echo off
REM Clean all build artifacts from the Smart University project
REM Usage: scripts\clean-all.bat
REM

echo ==> Cleaning all Maven target directories...

REM Clean root target
if exist "target" rmdir /s /q "target"

REM Clean all service targets
for %%d in (auth-service booking-service common-lib dashboard-service exam-service gateway-service marketplace-service notification-service payment-service) do (
    if exist "%%d\target" (
        echo Cleaning %%d\target...
        rmdir /s /q "%%d\target"
    )
)

REM Clean frontend build
if exist "frontend\dist" (
    echo Cleaning frontend\dist...
    rmdir /s /q "frontend\dist"
)

if exist "frontend\node_modules" (
    echo Cleaning frontend\node_modules...
    rmdir /s /q "frontend\node_modules"
)

echo ==> Clean complete!
