@echo off
:: Ensure working directory is the project directory (handles spaces and running from anywhere)
cd /d "%~dp0"

title College Mini Project - Library Management System (TypeScript - 100 Marks)
color 0B

echo ======================================================================
echo    COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
echo    Developer: Aditya
echo    Tech Stack: Full-Stack TypeScript + Node.js + Express + SQL
echo ======================================================================
echo.

:: Step 1: Check Node.js Installation
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

:: Step 2: Install dependencies if missing
if not exist "node_modules" (
    echo [1/3] First-time setup: Installing project dependencies...
    call npm.cmd install
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully!
    echo.
)

:: Step 3: Compile TypeScript (Client + Server)
echo [2/3] Compiling TypeScript source files into dist/ and web/app.js...
call npm.cmd run build
if errorlevel 1 (
    echo [ERROR] TypeScript compilation failed!
    pause
    exit /b 1
)
echo [OK] TypeScript compilation successful!
echo.

:: Step 4: Run Node.js TypeScript Server
echo [3/3] Starting Library Management Server on port 8080...
echo The dashboard will open in your default browser automatically!
echo.
echo ======================================================================
echo SERVER IS LIVE! DO NOT CLOSE THIS WINDOW WHILE USING THE APP.
echo Terminal will display live SQL queries generated during app usage.
echo URL: http://127.0.0.1:8080 or http://localhost:8080
echo Press Ctrl + C to stop the server anytime.
echo ======================================================================
echo.

node dist/server/server.js

pause
