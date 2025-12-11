@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Exam Service Test Runner
echo   Runs tests using Docker (no local JDK needed)
echo ============================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    echo Please install Docker Desktop and try again.
    exit /b 1
)

echo [INFO] Docker detected.
echo.

REM Navigate to project root (parent of scripts folder)
cd /d "%~dp0.."

echo ============================================
echo   Running Exam Service Tests
echo ============================================
echo.

REM Run exam-service tests using Maven Docker container
docker run --rm ^
    -v "%CD%":/workspace ^
    -w /workspace ^
    maven:3.9-eclipse-temurin-17 ^
    mvn clean verify -pl exam-service -am

if %ERRORLEVEL% neq 0 (
    echo.
    echo [FAILED] Exam Service tests failed!
    exit /b 1
)

echo.
echo ============================================
echo   All Exam Service Tests Passed!
echo ============================================
echo.

exit /b 0
