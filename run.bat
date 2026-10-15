@echo off
:: Ensure working directory is the project directory (handles spaces and running from anywhere)
cd /d "%~dp0"

title College Mini Project - Library Management System (100 Marks)
color 0A

echo ======================================================================
echo    COLLEGE MINI PROJECT: LIBRARY MANAGEMENT SYSTEM (100 MARKS)
echo    Developer: Aditya
echo    Tech Stack: Java 25 + HTML5 + CSS3 + SQL (Zero NPM / No Frameworks)
echo ======================================================================
echo.

:: Step 1: Check Java Installation
where java >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed or not in PATH!
    echo Please install JDK from https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)

where javac >nul 2>&1
if errorlevel 1 (
    echo [ERROR] javac (Java Compiler) was not found in PATH!
    echo Please ensure Java Development Kit (JDK) is installed, not just JRE.
    pause
    exit /b 1
)

:: Step 2: Compile Java Source Code
echo [1/3] Compiling Java classes into bin/ directory...
if not exist "bin" mkdir "bin"
javac -encoding UTF-8 -cp "src" -d "bin" "src\models\*.java" "src\DBManager.java" "src\LibraryApp.java"

if errorlevel 1 (
    echo [ERROR] Compilation failed!
    pause
    exit /b 1
)
echo [OK] Compilation successful!
echo.

:: Step 3: Run Java Server
echo [2/3] Starting Library Management HTTP Server on port 8080...
echo [3/3] The dashboard will open in your browser automatically!
echo.
echo ======================================================================
echo SERVER IS LIVE! DO NOT CLOSE THIS WINDOW WHILE USING THE APP.
echo Terminal will display live SQL queries generated during app usage.
echo URL: http://127.0.0.1:8080 or http://localhost:8080
echo Press Ctrl + C to stop the server anytime.
echo ======================================================================
echo.

java -cp bin LibraryApp

pause
