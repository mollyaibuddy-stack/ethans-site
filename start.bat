@echo off
echo ========================================
echo   Ethan's Website - Setup & Launch
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js not found. Installing...
    echo Please download and install Node.js from:
    echo https://nodejs.org/en/download
    echo.
    echo After installing, run this file again.
    pause
    exit /b
)

echo Node.js found! Installing dependencies...

cd /d "%~dp0"
call npm install

echo.
echo Starting the website...
echo Open http://localhost:3000 in your browser
echo.
call npm run dev
pause
