# College Mini Project - Library Management System (PowerShell Launcher)
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)" -ForegroundColor Cyan
Write-Host "   Developer: Aditya" -ForegroundColor Cyan
Write-Host "   Tech Stack: Full-Stack TypeScript + Node.js + Express + SQL" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Step 2: Install dependencies if missing
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/3] First-time setup: Installing project dependencies..." -ForegroundColor Yellow
    & cmd.exe /c "npm install"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "[OK] Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Compile TypeScript
Write-Host "[2/3] Compiling TypeScript source files into dist/ and web/app.js..." -ForegroundColor Cyan
& cmd.exe /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] TypeScript compilation failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[OK] TypeScript compilation successful!" -ForegroundColor Green
Write-Host ""

# Step 4: Start Server
Write-Host "[3/3] Starting Library Management Server on port 8080..." -ForegroundColor Cyan
Write-Host "The dashboard will open in your default browser automatically!" -ForegroundColor Cyan

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "SERVER IS LIVE! DO NOT CLOSE THIS WINDOW WHILE USING THE APP." -ForegroundColor Yellow
Write-Host "URL: http://127.0.0.1:8080 or http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl + C to stop the server anytime." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

node dist/server/server.js
