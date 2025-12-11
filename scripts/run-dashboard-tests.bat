@echo off
echo ==========================================
echo  Testing Dashboard Service
echo ==========================================
echo.

cd /d "%~dp0.."

echo Running dashboard-service tests...
echo.

call mvn test -pl dashboard-service -am -DskipTests=false

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==========================================
    echo  Dashboard Service Tests FAILED
    echo ==========================================
    exit /b 1
)

echo.
echo ==========================================
echo  Dashboard Service Tests PASSED
echo ==========================================
exit /b 0
