@echo off
REM Convenience script to start the full Smart University stack via docker-compose.
REM This version relies on Docker multi-stage builds to run Maven inside containers,
REM so Maven is NOT required on the host.
REM
REM Usage:
REM   scripts\start-platform.bat          - docker-compose up --build
REM   scripts\start-platform.bat -d       - docker-compose up -d --build (detached)
REM

setlocal EnableDelayedExpansion

REM Change to project root directory (parent of scripts folder)
cd /d "%~dp0.."

echo.
echo ==^> Checking required tools...

where docker >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo Error: Docker is required but not installed or not in PATH.
    exit /b 1
)

REM Check for Docker Compose (V2 or V1)
set COMPOSE_CMD=

docker compose version >nul 2>nul
if !ERRORLEVEL! equ 0 (
    set COMPOSE_CMD=docker compose
    goto :compose_found
)

where docker-compose >nul 2>nul
if !ERRORLEVEL! equ 0 (
    set COMPOSE_CMD=docker-compose
    goto :compose_found
)

echo Error: Docker Compose is required but not installed.
echo Please install Docker Compose V2 (docker compose) or V1 (docker-compose).
exit /b 1

:compose_found
echo.
echo ==^> Starting full stack with !COMPOSE_CMD! (builds images as needed)...

if "%1"=="-d" (
    !COMPOSE_CMD! up --build -d
) else (
    !COMPOSE_CMD! up --build
)

endlocal
