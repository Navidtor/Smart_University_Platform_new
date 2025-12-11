@echo off
REM Run the backend test suite using Docker images only.
REM This does NOT require Maven to be installed on the host.
REM
REM Usage (from repo root):
REM   scripts\run-tests.bat
REM

setlocal enabledelayedexpansion

echo ==> Checking required tools...

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is required but not installed or not in PATH.
    exit /b 1
)

echo ==> Running backend tests (Maven) inside Docker...

docker run --rm -v "%CD%":/workspace -w /workspace maven:3.9-eclipse-temurin-17 mvn clean verify

if %ERRORLEVEL% neq 0 (
    echo Error: Backend tests failed.
    exit /b 1
)

echo ==> Backend tests completed successfully.

echo ==> Cleaning up generated test artifacts...

REM Remove Maven target directories (compiled classes, test reports)
for /d %%d in (auth-service booking-service dashboard-service exam-service gateway-service marketplace-service notification-service payment-service common-lib) do (
    if exist "%%d\target" (
        echo Removing %%d\target...
        rmdir /s /q "%%d\target"
    )
)
if exist "target" (
    echo Removing root target...
    rmdir /s /q "target"
)

echo ==> Cleanup complete.

echo ==> All tests finished.
