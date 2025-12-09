@echo off
REM Run the full Smart University test suite using Docker images only.
REM This does NOT require Maven or Node.js to be installed on the host.
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

echo ==> Running frontend tests (npm test) inside Docker...

docker run --rm -v "%CD%\frontend":/app -w /app node:20-alpine sh -c "npm install && npm test"

if %ERRORLEVEL% neq 0 (
    echo Error: Frontend tests failed.
    exit /b 1
)

echo ==> Frontend tests completed successfully.

echo ==> All tests finished.
