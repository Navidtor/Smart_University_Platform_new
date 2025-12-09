@echo off
REM ============================================================
REM Docker NUCLEAR Cleanup - Removes EVERYTHING
REM ============================================================
REM
REM WARNING: This script removes ALL Docker resources including:
REM   - ALL containers (running and stopped)
REM   - ALL images
REM   - ALL volumes (databases will be DELETED)
REM   - ALL networks
REM   - ALL build cache
REM
REM Use this only when you want to start completely fresh.
REM Your SOURCE CODE is safe - only Docker resources are removed.
REM ============================================================

setlocal

echo.
echo ============================================================
echo     DOCKER NUCLEAR CLEANUP - REMOVES EVERYTHING
echo ============================================================
echo.
echo WARNING: This will remove ALL Docker resources:
echo   - All containers (including running ones)
echo   - All images (you'll need to rebuild/re-pull)
echo   - All volumes (DATABASE DATA WILL BE LOST)
echo   - All networks
echo   - All build cache
echo.
echo Your source code files are SAFE and won't be affected.
echo.
echo ============================================================
echo.

set /p CONFIRM="Are you sure? Type 'YES' to continue: "
if not "%CONFIRM%"=="YES" (
    echo.
    echo Aborted. No changes made.
    exit /b 0
)

echo.
echo [INFO] Current disk usage:
docker system df
echo.

echo [STEP 1/6] Stopping all running containers...
for /f "tokens=*" %%i in ('docker ps -q 2^>nul') do (
    docker stop %%i 2>nul
)
echo           Done.

echo [STEP 2/6] Removing all containers...
for /f "tokens=*" %%i in ('docker ps -a -q 2^>nul') do (
    docker rm -f %%i 2>nul
)
echo           Done.

echo [STEP 3/6] Removing all images...
for /f "tokens=*" %%i in ('docker images -q 2^>nul') do (
    docker rmi -f %%i 2>nul
)
echo           Done.

echo [STEP 4/6] Removing all volumes...
docker volume prune -f --all 2>nul
echo           Done.

echo [STEP 5/6] Removing all networks...
docker network prune -f 2>nul
echo           Done.

echo [STEP 6/6] Removing all build cache...
docker builder prune -f --all 2>nul
echo           Done.

echo.
echo ============================================================
echo.
echo [INFO] Docker is now clean. New disk usage:
echo.
docker system df
echo.
echo ============================================================
echo.
echo To rebuild the Smart University project:
echo   docker compose up --build
echo.
echo ============================================================
