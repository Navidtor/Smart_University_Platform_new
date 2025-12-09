@echo off
REM ============================================================
REM Docker Cleanup Script for Windows
REM Safely removes unused Docker resources to free disk space
REM ============================================================
REM
REM Usage: scripts\docker-cleanup.bat [options]
REM
REM Options:
REM   --all     : Deep clean (includes all unused images, not just dangling)
REM   --volumes : Also remove unused volumes (WARNING: may delete data)
REM
REM Safe by default: Only removes stopped containers, dangling images,
REM                  and build cache. Running containers are preserved.
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo        Docker Cleanup Utility - Smart University
echo ============================================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

REM Parse arguments
set CLEAN_ALL=0
set CLEAN_VOLUMES=0

for %%a in (%*) do (
    if "%%a"=="--all" set CLEAN_ALL=1
    if "%%a"=="--volumes" set CLEAN_VOLUMES=1
)

echo [INFO] Analyzing Docker disk usage...
echo.
docker system df
echo.
echo ============================================================
echo.

REM Step 1: Stop all project containers (if running)
echo [STEP 1/6] Stopping Smart University containers...
docker compose down 2>nul
if %ERRORLEVEL% equ 0 (
    echo           Containers stopped.
) else (
    echo           No compose containers running.
)
echo.

REM Step 2: Remove stopped containers
echo [STEP 2/6] Removing stopped containers...
for /f "tokens=*" %%i in ('docker ps -a -q --filter "status=exited" 2^>nul') do (
    set FOUND_CONTAINERS=1
)
if defined FOUND_CONTAINERS (
    docker container prune -f
) else (
    echo           No stopped containers to remove.
)
echo.

REM Step 3: Remove dangling images (or all unused if --all)
if %CLEAN_ALL%==1 (
    echo [STEP 3/6] Removing ALL unused images (--all mode)...
    docker image prune -a -f
) else (
    echo [STEP 3/6] Removing dangling images only...
    docker image prune -f
)
echo.

REM Step 4: Remove build cache
echo [STEP 4/6] Removing Docker build cache...
docker builder prune -f
echo.

REM Step 5: Remove unused networks
echo [STEP 5/6] Removing unused networks...
docker network prune -f
echo.

REM Step 6: Remove unused volumes (only if --volumes flag)
if %CLEAN_VOLUMES%==1 (
    echo [STEP 6/6] Removing unused volumes (--volumes mode)...
    echo           WARNING: This may delete database data!
    docker volume prune -f
) else (
    echo [STEP 6/6] Skipping volume cleanup (use --volumes to include)
    echo           [Volumes preserved to protect database data]
)
echo.

echo ============================================================
echo.
echo [INFO] Cleanup complete! New disk usage:
echo.
docker system df
echo.
echo ============================================================
echo.
echo Tips:
echo   - Run 'scripts\docker-cleanup.bat --all' for deeper cleanup
echo   - Run 'scripts\docker-cleanup.bat --volumes' to also remove volumes
echo   - Rebuild project with: docker compose up --build
echo.
echo ============================================================
