@echo off
REM Convenience script to start the full Smart University stack via docker-compose.
REM This version relies on Docker multi-stage builds to run Maven inside containers,
REM so Maven is NOT required on the host.
REM
REM Usage:
REM   scripts\start-platform.bat          - docker-compose up --build
REM   scripts\start-platform.bat -d       - docker-compose up -d --build (detached)
REM

setlocal

echo ==> Checking required tools...

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is required but not installed or not in PATH.
    exit /b 1
)

echo ==> Starting full stack with docker-compose (builds images as needed)...

if "%1"=="-d" (
    docker compose up --build -d
) else (
    docker compose up --build
)
