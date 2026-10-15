# College Mini Project - Library Management System (PowerShell Launcher)
Set-Location -Path $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)" -ForegroundColor Green
Write-Host "   Developer: Aditya" -ForegroundColor Green
Write-Host "   Tech Stack: Java 25 + HTML5 + CSS3 + SQL (Zero NPM / No Frameworks)" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

# Step 1: Check Java & Javac
if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Java is not installed or not in PATH!" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Get-Command javac -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] javac (Java Compiler) was not found in PATH!" -ForegroundColor Red
    pause
    exit 1
}

# Step 2: Compile
Write-Host "[1/3] Compiling Java classes into bin/ directory..." -ForegroundColor Cyan
if (-not (Test-Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

javac -encoding UTF-8 -cp "src" -d "bin" src/models/*.java src/DBManager.java src/LibraryApp.java
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Compilation failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[OK] Compilation successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Start Server
Write-Host "[2/3] Starting Library Management HTTP Server on port 8080..." -ForegroundColor Cyan
Write-Host "[3/3] The dashboard will open in your browser automatically!" -ForegroundColor Cyan

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "SERVER IS LIVE! DO NOT CLOSE THIS WINDOW WHILE USING THE APP." -ForegroundColor Yellow
Write-Host "URL: http://127.0.0.1:8080 or http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl + C to stop the server anytime." -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""

java -cp bin LibraryApp
