@echo off
echo ========================================
echo   Ethan's Website Deploy Script
echo ========================================
echo.

set /p GH_USER="Enter your GitHub username: "
set REPO=https://github.com/%GH_USER%/ethans-site.git

echo.
echo 1) Creating GitHub repo...
echo    Open this in your browser: https://github.com/new
echo    Name it: ethans-site, make it Public, click Create
echo.
pause

echo 2) Setting up Git and pushing...
cd /d "%~dp0"
git init 2>nul
git remote remove origin 2>nul
git add -A
git config user.email "%GH_USER%@users.noreply.github.com"
git config user.name "%GH_USER%"
git commit -m "Ethan's personal website" 2>nul
git branch -M main
git remote add origin %REPO%
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo Push failed! Check your username and try again.
    pause
    exit /b
)

echo.
echo 3) Deploy to Vercel (free)...
echo    Go to https://vercel.com/new and click "Continue with GitHub"
echo    Select "ethans-site" and click "Deploy"
echo    Your site will be LIVE in ~2 minutes!
echo.
echo    Vercel auto-rebuilds when you push changes.
echo    PlayHQ stats auto-update daily via GitHub Actions.
echo.
pause
